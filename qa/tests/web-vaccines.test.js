import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function referenceDaysUntil(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function loadVaccines({ findKeyByLocalizedName, isRabiesLocalizedName, daysUntil } = {}) {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  context.document = undefined;
  context.localStorage = undefined;
  ["domains/vaccines/selectors.js", "domains/vaccines/controller.js"].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });
  const daysUntilFn = daysUntil || referenceDaysUntil;
  const selectors = context.PetLiveWeb.domains.vaccines.createSelectors({
    daysUntil: daysUntilFn,
    findKeyByLocalizedName:
      findKeyByLocalizedName ||
      ((name) => {
        const map = { "五合一": "v5in1", Rabies: "vRabies", "狂犬病疫苗": "vRabies" };
        return map[name] || "";
      }),
    isRabiesLocalizedName,
  });
  const controller = context.PetLiveWeb.domains.vaccines.createController({ selectors });
  return { api: context.PetLiveWeb, selectors, controller, daysUntilFn };
}

/** Normalize vm-realm objects for deepStrictEqual (different Object/Array prototypes). */
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("VC-04 vaccines selectors + controller", () => {
  it("getVaccineProtectionStatus thresholds: expired, approaching, protected", () => {
    const stubbed = loadVaccines({
      daysUntil: (iso) => {
        if (iso === "expired-day") return 0;
        if (iso === "approaching-day") return 45;
        if (iso === "protected-day") return 120;
        return 100;
      },
    });
    assert.equal(stubbed.selectors.getVaccineProtectionStatus("expired-day"), "expired");
    assert.equal(stubbed.selectors.getVaccineProtectionStatus("approaching-day"), "approaching");
    assert.equal(stubbed.selectors.getVaccineProtectionStatus("protected-day"), "protected");
  });

  it("injected daysUntil parity vs reference implementation", () => {
    const { selectors } = loadVaccines();
    const sample = selectors.addYears(selectors.todayISODate(), 1);
    const days = referenceDaysUntil(sample);
    const expected =
      days <= 0 ? "expired" : days <= 90 ? "approaching" : "protected";
    assert.equal(selectors.getVaccineProtectionStatus(sample), expected);
  });

  it("getCurrentVaccinesByGroup picks higher tier / later given within group", () => {
    const { selectors } = loadVaccines();
    const pet = {
      vaccines: [
        { key: "v5in1", name: "五合一", given: "2024-01-01", next: "2025-01-01" },
        { key: "v8in1", name: "八合一", given: "2024-06-01", next: "2025-06-01" },
        { key: "vRabies", name: "Rabies", given: "2024-03-01", next: "2025-03-01" },
      ],
    };
    const groups = selectors.getCurrentVaccinesByGroup(pet);
    assert.equal(groups.get("coreCombo").key, "v8in1");
    assert.equal(groups.get("rabies").key, "vRabies");
    const olderCombo = pet.vaccines[0];
    assert.equal(selectors.getVaccineSuccessor(pet, olderCombo).key, "v8in1");
  });

  it("getNextVaccine orders by urgency then displayRank (combo before rabies when equal urgency)", () => {
    const { selectors } = loadVaccines({
      daysUntil: (iso) => {
        if (iso === "2025-06-01") return 30;
        if (iso === "2025-03-01") return 10;
        return 100;
      },
    });
    const pet = {
      vaccines: [
        { key: "v8in1", name: "八合一", given: "2024-06-01", next: "2025-06-01" },
        { key: "vRabies", name: "Rabies", given: "2024-03-01", next: "2025-03-01" },
      ],
    };
    const next = selectors.getNextVaccine(pet);
    assert.equal(next.key, "vRabies");
  });

  it("compareVaccinesForList puts active before superseded history", () => {
    const { selectors } = loadVaccines();
    const pet = {
      vaccines: [
        { key: "v5in1", name: "五合一", given: "2023-01-01", next: "2024-01-01" },
        { key: "v8in1", name: "八合一", given: "2024-06-01", next: "2025-06-01" },
      ],
    };
    const active = pet.vaccines[1];
    const history = pet.vaccines[0];
    assert.ok(selectors.compareVaccinesForList(pet, active, history) < 0);
    assert.ok(selectors.compareVaccinesForList(pet, history, active) > 0);
  });

  it("isRabiesVaccineEntry / vaccineAllowedForPet blocks cats for rabies heuristics", () => {
    const { selectors } = loadVaccines({
      isRabiesLocalizedName: (name) => /rabies|狂犬/i.test(name),
    });
    const cat = { species: "cat" };
    assert.equal(selectors.isRabiesVaccineEntry({ key: "vRabies", name: "Rabies" }), true);
    assert.equal(selectors.isRabiesVaccineEntry({ key: "", name: "狂犬病疫苗" }), true);
    assert.equal(selectors.isRabiesVaccineEntry({ key: "", name: "五合一" }), false);
    assert.equal(selectors.vaccineAllowedForPet(cat, { key: "v5in1", name: "五合一" }), true);
    assert.equal(selectors.vaccineAllowedForPet(cat, { key: "vRabies", name: "Rabies" }), false);
    assert.equal(
      selectors.vaccineAllowedForPet({ species: "dog" }, { key: "vRabies", name: "Rabies" }),
      true
    );
  });

  it("upsertPetVaccines replaces same key/name, preserves unrelated, newest first", () => {
    const { controller } = loadVaccines();
    const pet = {
      vaccines: [
        { key: "vLepto", name: "Lepto", given: "2023-01-01", next: "2024-01-01", status: "ok" },
        { key: "v5in1", name: "五合一", given: "2023-06-01", next: "2024-06-01", status: "ok" },
      ],
    };
    controller.upsertPetVaccines(pet, [
      { key: "v5in1", name: "五合一", given: "2024-06-01", next: "2025-06-01", status: "ok" },
      { key: "vRabies", name: "Rabies", given: "2024-03-01", next: "2025-03-01", status: "ok" },
    ]);
    assert.equal(pet.vaccines.length, 3);
    assert.equal(pet.vaccines[0].key, "vRabies");
    assert.equal(pet.vaccines[1].key, "v5in1");
    assert.equal(pet.vaccines[1].given, "2024-06-01");
    assert.equal(pet.vaccines[2].key, "vLepto");
  });

  it("validateSave / buildSaveEntries cover empty, species block, dates, order", () => {
    const { controller } = loadVaccines({
      isRabiesLocalizedName: (name) => /rabies|狂犬/i.test(name),
    });
    const cat = { species: "cat", vaccines: [] };
    assert.deepEqual(plain(controller.validateSave({ pet: cat, selected: [], given: "2024-01-01", next: "2025-01-01" })), {
      ok: false,
      reason: "need_name",
    });
    assert.deepEqual(
      plain(
        controller.validateSave({
          pet: cat,
          selected: [{ key: "vRabies", name: "Rabies" }],
          given: "2024-01-01",
          next: "2025-01-01",
        })
      ),
      { ok: false, reason: "species_blocked", blocked: { key: "vRabies", name: "Rabies" } }
    );
    assert.deepEqual(
      plain(
        controller.validateSave({
          pet: cat,
          selected: [{ key: "v5in1", name: "五合一" }],
          given: "",
          next: "2025-01-01",
        })
      ),
      { ok: false, reason: "need_dates" }
    );
    assert.deepEqual(
      plain(
        controller.validateSave({
          pet: cat,
          selected: [{ key: "v5in1", name: "五合一" }],
          given: "2025-01-01",
          next: "2024-01-01",
        })
      ),
      { ok: false, reason: "date_order" }
    );

    const built = plain(
      controller.buildSaveEntries({
        pet: cat,
        selected: [{ key: "v5in1", name: "五合一" }],
        given: "2024-01-01",
        next: "2025-01-01",
      })
    );
    assert.equal(built.ok, true);
    assert.equal(built.updated, false);
    assert.equal(built.entries.length, 1);
    assert.equal(built.entries[0].key, "v5in1");
    assert.ok(["ok", "soon", "expired"].includes(built.entries[0].status));
  });

  it("wasVaccineUpdated detects existing key or name match", () => {
    const { controller } = loadVaccines();
    const pet = {
      vaccines: [{ key: "v5in1", name: "五合一", given: "2023-01-01", next: "2024-01-01" }],
    };
    assert.equal(
      controller.wasVaccineUpdated(pet, [{ key: "v5in1", name: "五合一" }]),
      true
    );
    assert.equal(
      controller.wasVaccineUpdated(pet, [{ key: "", name: "Custom" }]),
      false
    );
  });

  it("buildVaccineCalendarPayload null without next; fields present with next", () => {
    const { controller } = loadVaccines();
    const pet = { name: "Mochi", vaccines: [] };
    assert.equal(
      controller.buildVaccineCalendarPayload(
        pet,
        { vaccines: [{ name: "五合一" }], given: "2026-01-01", next: "" },
        { title: "t", details: "d" }
      ),
      null
    );
    assert.equal(
      controller.buildVaccineCalendarPayload(null, { vaccines: [], given: "", next: "2026-08-27" }, {}),
      null
    );
    assert.deepEqual(
      plain(
        controller.buildVaccineCalendarPayload(
          pet,
          {
            vaccines: [{ name: "五合一" }, { name: "Rabies" }],
            given: "2026-01-01",
            next: "2026-08-27",
          },
          { title: "Title", details: "Details" }
        )
      ),
      {
        title: "Title",
        details: "Details",
        nextDue: "2026-08-27",
        uid: "vaccine-20260827-2",
      }
    );
  });

  it("domain scripts do not reference document, localStorage, or modules/vaccine", () => {
    for (const path of ["domains/vaccines/selectors.js", "domains/vaccines/controller.js"]) {
      const src = readFileSync(new URL(path, WEB_ROOT), "utf8");
      assert.equal(/\bdocument\b/.test(src), false, `${path} must not use document`);
      assert.equal(/\blocalStorage\b/.test(src), false, `${path} must not use localStorage`);
      assert.equal(/modules\/vaccine/.test(src), false, `${path} must not import modules/vaccine`);
    }
  });
});
