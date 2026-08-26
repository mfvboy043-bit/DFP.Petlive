import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function referenceTodayISODate() {
  return "2026-08-15";
}

function loadEmergency({ getAlertsForPet, todayISODate } = {}) {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  context.document = {
    getElementById() {
      throw new Error("domains must not touch document");
    },
  };
  context.localStorage = {
    getItem() {
      throw new Error("domains must not touch localStorage");
    },
    setItem() {
      throw new Error("domains must not touch localStorage");
    },
  };

  ["domains/emergency/adapters.js", "domains/emergency/selectors.js"].forEach(
    (path) => {
      vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
        filename: path,
      });
    }
  );

  const emergency = context.PetLiveWeb.domains.emergency;
  const adapter = emergency.createAdapter({
    getAlertsForPet:
      getAlertsForPet ||
      ((pet) => (Array.isArray(pet?.alerts) ? pet.alerts.slice() : [])),
    todayISODate: todayISODate || referenceTodayISODate,
  });
  const selectors = emergency.createSelectors({ adapter });
  return { api: context.PetLiveWeb, adapter, selectors, context, emergency };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function activePet({ today = "2026-08-15", visits } = {}) {
  return {
    id: "p-em",
    name: "Mochi",
    species: "dog",
    breed: "shiba",
    gender: "male",
    birthDate: "2020-01-01",
    chipNumber: "CHIP-1",
    weight: 12.5,
    weightDate: "2026-08-01",
    alerts: [
      {
        id: "a1",
        alertType: "drug_allergy",
        description: "Penicillin",
        severity: "critical",
      },
    ],
    visits: visits || [
      {
        date: "2026-08-10",
        medications: [
          {
            kind: "single",
            name: "Amox",
            dose: "1 tab",
            frequency: "bid",
            startDate: "2026-08-10",
            durationDays: 10,
            dosageAmount: 1,
            dosageUnit: "tab",
            source: "clinic",
          },
          {
            kind: "photo_bundle",
            name: "Rx photo",
            startDate: "2026-08-10",
            durationDays: 10,
          },
          {
            kind: "compound_bundle",
            frequency: "sid",
            startDate: "2026-08-12",
            durationDays: 7,
            source: "clinic",
            ingredients: [
              { name: "Ing A", dose: "2ml", source: "compound" },
              { name: "", dose: "skip" },
              { name: "Ing B", dose: "1ml" },
            ],
          },
          {
            kind: "single",
            name: "Expired Med",
            startDate: "2026-07-01",
            durationDays: 5,
            source: "clinic",
          },
        ],
      },
    ],
    _today: today,
  };
}

describe("EM-04 emergency adapter + selectors", () => {
  it("buildSnapshot shape from pet + injected alerts/meds", () => {
    const pet = activePet();
    const { adapter } = loadEmergency({
      getAlertsForPet: (p) =>
        (p.alerts || []).map((a) => ({ ...a, type: "Drug allergy" })),
      todayISODate: () => "2026-08-15",
    });
    const snap = plain(adapter.buildSnapshot(pet));
    assert.equal(snap.pet.id, "p-em");
    assert.equal(snap.pet.name, "Mochi");
    assert.equal(snap.pet.chipNumber, "CHIP-1");
    assert.deepEqual(snap.latestWeight, {
      weight: 12.5,
      recordedDate: "2026-08-01",
    });
    assert.equal(snap.alerts.length, 1);
    assert.equal(snap.alerts[0].type, "Drug allergy");
    assert.equal(snap.currentMedications.length, 3);
    assert.equal(snap.currentMedications[0].name, "Amox");
  });

  it("buildSnapshot latestWeight null when weight missing", () => {
    const { adapter } = loadEmergency();
    const snap = plain(
      adapter.buildSnapshot({
        id: "p2",
        name: "NoW",
        weight: null,
        visits: [],
        alerts: [],
      })
    );
    assert.equal(snap.latestWeight, null);
    assert.equal(snap.pet.chipNumber, "");
    assert.deepEqual(snap.alerts, []);
    assert.deepEqual(snap.currentMedications, []);
  });

  it("active meds: compound flatten, photo_bundle skip, inactive excluded", () => {
    const { adapter } = loadEmergency({
      todayISODate: () => "2026-08-15",
    });
    const meds = plain(adapter.deriveActiveEmergencyMeds(activePet()));
    assert.equal(
      meds.some((m) => m.name === "Rx photo" || m.kind === "photo_bundle"),
      false
    );
    assert.equal(meds.some((m) => m.name === "Expired Med"), false);
    assert.deepEqual(
      meds.map((m) => m.name),
      ["Amox", "Ing A", "Ing B"]
    );
    assert.equal(meds[1].kind, "single");
    assert.equal(meds[1].source, "compound");
    assert.equal(meds[2].source, "clinic");
    assert.equal(meds[0].dosageAmount, 1);
    assert.equal(meds[0].dosageUnit, "tab");
  });

  it("deriveActiveEmergencyMeds accepts explicit today override", () => {
    const { adapter } = loadEmergency({
      todayISODate: () => "2026-08-15",
    });
    const pet = activePet();
    assert.equal(adapter.deriveActiveEmergencyMeds(pet, "2026-07-02").length, 1);
    assert.equal(
      adapter.deriveActiveEmergencyMeds(pet, "2026-07-02")[0].name,
      "Expired Med"
    );
    assert.equal(adapter.deriveActiveEmergencyMeds(pet, "2026-06-01").length, 0);
  });

  it("degradedSections mirrors _degraded; defaults false", () => {
    const { selectors } = loadEmergency();
    assert.deepEqual(plain(selectors.degradedSections(null)), {
      weight: false,
      alerts: false,
      medications: false,
    });
    assert.deepEqual(plain(selectors.degradedSections({})), {
      weight: false,
      alerts: false,
      medications: false,
    });
    assert.deepEqual(
      plain(
        selectors.degradedSections({
          _degraded: { weight: true, alerts: 1, medications: false },
        })
      ),
      { weight: true, alerts: true, medications: false }
    );
  });

  it("copyPayload fields stable; no t() inside domain; local alerts/meds truth", () => {
    const { selectors } = loadEmergency({
      todayISODate: () => "2026-08-15",
    });
    const payload = plain(
      selectors.copyPayload(activePet(), {
        profile: {
          name: "Victor",
          phone: "0912",
          email: "a@b.c",
          emergencyName: "E",
          emergencyPhone: "02",
          address: "Taipei",
        },
        labelOfAlertType: (type) => `L:${type}`,
        formatMedLine: (med) => `M:${med.name}`,
        noneLabel: "NONE",
        lineTextOfAlert: (a) => a.description || "",
      })
    );
    assert.equal(payload.alertsText, "L:drug_allergy Penicillin");
    assert.equal(payload.medsText, "M:Amox；M:Ing A；M:Ing B");
    assert.equal(payload.owner.name, "Victor");
    assert.equal(payload.owner.phone, "0912");
    assert.equal(payload.pet.name, "Mochi");
    assert.equal(payload.alerts.length, 1);
    assert.equal(payload.currentMedications.length, 3);

    const empty = plain(
      selectors.copyPayload(
        { id: "x", name: "Empty", visits: [], alerts: [] },
        {
          profile: {},
          labelOfAlertType: () => "X",
          formatMedLine: (m) => m.name,
          noneLabel: "NONE",
        }
      )
    );
    assert.equal(empty.alertsText, "NONE");
    assert.equal(empty.medsText, "NONE");
  });

  it("domain files contain no document / innerHTML / localStorage / t() / PetLive", () => {
    for (const path of [
      "domains/emergency/adapters.js",
      "domains/emergency/selectors.js",
    ]) {
      const src = readFileSync(new URL(path, WEB_ROOT), "utf8");
      assert.equal(/\bdocument\b/.test(src), false, `${path} document`);
      assert.equal(/\binnerHTML\b/.test(src), false, `${path} innerHTML`);
      assert.equal(/\blocalStorage\b/.test(src), false, `${path} localStorage`);
      assert.equal(/\bt\s*\(/.test(src), false, `${path} t()`);
      assert.equal(/\bPetLive\b/.test(src), false, `${path} PetLive`);
      assert.equal(/\bmodules\/emergency-card\b/.test(src), false, `${path} module`);
    }
  });

  it("domains do not touch document / localStorage at runtime", () => {
    const { adapter, selectors, context } = loadEmergency();
    const pet = activePet();
    adapter.buildSnapshot(pet);
    adapter.deriveActiveEmergencyMeds(pet);
    selectors.degradedSections({ _degraded: { alerts: true } });
    selectors.copyPayload(pet, {
      profile: {},
      labelOfAlertType: (t) => t,
      formatMedLine: (m) => m.name,
      noneLabel: "-",
    });
    assert.equal(typeof context.document.getElementById, "function");
    assert.equal(typeof context.localStorage.getItem, "function");
  });

  it("createAdapter alias createController; requires injected deps", () => {
    const { emergency } = loadEmergency();
    assert.equal(emergency.createController, emergency.createAdapter);
    assert.throws(() => emergency.createAdapter({}), /getAlertsForPet/);
    assert.throws(
      () => emergency.createAdapter({ getAlertsForPet: () => [] }),
      /todayISODate/
    );
    assert.throws(() => emergency.createSelectors({}), /adapter/);
  });
});
