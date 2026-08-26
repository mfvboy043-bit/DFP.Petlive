import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadTimelineVisits() {
  const context = vm.createContext({
    console,
  });
  context.globalThis = context;
  context.window = context;
  [
    "domains/visits/controller.js",
    "domains/timeline/selectors.js",
  ].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });
  return context.PetLiveWeb;
}

function createPair(clinicLabelOf) {
  const api = loadTimelineVisits();
  const visits = api.domains.visits.createController({
    clinicLabelOf:
      clinicLabelOf ||
      ((visit) => visit?.clinicId || visit?.clinic || ""),
  });
  const timeline = api.domains.timeline.createSelectors({ visits });
  return { api, visits, timeline };
}

/** Normalize vm-realm objects for deepStrictEqual (different Object/Array prototypes). */
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("TV-01 / TV-02 timeline + visits controllers", () => {
  it("buildPreviousVisitByIndex is chronological; same-day higher index is older", () => {
    const { visits } = createPair();
    const list = [
      { date: "2026-08-20", id: "a" }, // index 0 newest display
      { date: "2026-08-10", id: "b" },
      { date: "2026-08-10", id: "c" }, // higher index = older on same day
      { date: "2026-08-01", id: "d" },
    ];
    const prev = visits.buildPreviousVisitByIndex(list);
    // Chronological older→newer: d (idx3), c (idx2), b (idx1), a (idx0)
    // Wait: same-day sort uses b.index - a.index so higher index sorts first (older).
    // Chron order: d (2026-08-01 idx3), then same-day 08-10: idx2 (c) before idx1 (b) because higher index = older,
    // then a (08-20).
    // So chron: d → c → b → a
    // previous of c = d, previous of b = c, previous of a = b, previous of d = null
    assert.equal(prev[3], null);
    assert.equal(prev[2], list[3]);
    assert.equal(prev[1], list[2]);
    assert.equal(prev[0], list[1]);
  });

  it("saveVisitWeight updates visit and pet when visit.date >= pet.weightDate", () => {
    const { visits } = createPair();
    const pet = {
      weight: 5,
      weightDate: "2026-08-01",
      visits: [{ date: "2026-08-10", weightAtVisit: null }],
    };
    const result = visits.saveVisitWeight(pet, 0, 6.2);
    assert.equal(result.ok, true);
    assert.equal(result.petWeightUpdated, true);
    assert.equal(pet.visits[0].weightAtVisit, 6.2);
    assert.equal(pet.weight, 6.2);
    assert.equal(pet.weightDate, "2026-08-10");
  });

  it("saveVisitWeight does not clobber a newer pet.weightDate", () => {
    const { visits } = createPair();
    const pet = {
      weight: 7,
      weightDate: "2026-08-20",
      visits: [{ date: "2026-08-10", weightAtVisit: null }],
    };
    const result = visits.saveVisitWeight(pet, 0, 6.2);
    assert.equal(result.ok, true);
    assert.equal(result.petWeightUpdated, false);
    assert.equal(pet.visits[0].weightAtVisit, 6.2);
    assert.equal(pet.weight, 7);
    assert.equal(pet.weightDate, "2026-08-20");
  });

  it("invalid weight returns ok:false with no mutation", () => {
    const { visits } = createPair();
    const pet = {
      weight: 5,
      weightDate: "2026-08-01",
      visits: [{ date: "2026-08-10", weightAtVisit: 5 }],
    };
    const snapshot = JSON.stringify(pet);
    assert.deepEqual(plain(visits.saveVisitWeight(pet, 0, 0)), {
      ok: false,
      reason: "invalid_weight",
    });
    assert.deepEqual(plain(visits.saveVisitWeight(pet, 0, -1)), {
      ok: false,
      reason: "invalid_weight",
    });
    assert.deepEqual(plain(visits.saveVisitWeight(pet, 9, 4)), {
      ok: false,
      reason: "missing_visit",
    });
    assert.equal(JSON.stringify(pet), snapshot);
  });

  it("collectVisitProofPhotos merges visit + med photos; clearVisitProofSlot clears both", () => {
    const { visits } = createPair();
    const visit = {
      bagPhoto: "bag-v",
      rxPhoto: "rx-v",
      drugPhoto: null,
      medications: [
        { bagPhoto: "bag-m", rxPhoto: "rx-m", drugPhoto: "drug-m" },
        { bagPhoto: "bag-v", rxPhoto: null, drugPhoto: "drug-m2" },
      ],
    };
    const slots = plain(visits.collectVisitProofPhotos(visit));
    assert.deepEqual(slots.bag, ["bag-v", "bag-m"]);
    assert.deepEqual(slots.rx, ["rx-v", "rx-m"]);
    assert.deepEqual(slots.drug, ["drug-m", "drug-m2"]);
    assert.equal(visits.visitHasAnyProof(visit), true);

    visits.clearVisitProofSlot(visit, "bag");
    assert.equal(visit.bagPhoto, null);
    assert.equal(visit.medications[0].bagPhoto, null);
    assert.equal(visit.medications[1].bagPhoto, null);
    assert.equal(visit.rxPhoto, "rx-v");
  });

  it("ensureVisitImaging / clear / append enforce max 4", () => {
    const { visits } = createPair();
    const visit = {};
    const imaging = plain(visits.ensureVisitImaging(visit));
    assert.ok(visit.imaging);
    assert.deepEqual(imaging.xrayPhotos, []);
    assert.deepEqual(imaging.usPhotos, []);

    for (let i = 0; i < 4; i++) {
      assert.equal(visits.appendVisitImagingPhoto(visit, "xray", `x${i}`).ok, true);
    }
    assert.deepEqual(plain(visits.appendVisitImagingPhoto(visit, "xray", "x4")), {
      ok: false,
      reason: "cap",
    });
    assert.deepEqual(plain(visits.appendVisitImagingPhoto(visit, "us", "")), {
      ok: false,
      reason: "empty",
    });
    assert.equal(visit.imaging.xrayPhotos.length, 4);
    assert.equal(visits.IMAGING_PHOTOS_MAX, 4);

    visits.clearVisitImagingPhoto(visit, "xray", 1);
    assert.deepEqual(plain(visit.imaging.xrayPhotos), ["x0", "x2", "x3"]);
    assert.equal(visits.visitHasImaging(visit), true);
  });

  it("parseVisitLinkValue + findVisitByLink use clinicLabelOf", () => {
    const { visits } = createPair((visit) =>
      visit.clinicId === "c1" ? "Clinic One" : visit.clinic || ""
    );
    const pet = {
      visits: [
        { date: "2026-08-10", clinicId: "c1", clinic: "raw" },
        { date: "2026-08-11", clinic: "Walk-in" },
      ],
    };
    assert.equal(visits.visitLinkValue(pet.visits[0]), "2026-08-10::c1");
    assert.equal(visits.visitLinkValue(pet.visits[1]), "2026-08-11::Walk-in");
    assert.deepEqual(plain(visits.parseVisitLinkValue("2026-08-10::c1")), {
      date: "2026-08-10",
      clinicKey: "c1",
    });
    assert.equal(visits.findVisitByLink(pet, "2026-08-10::c1"), pet.visits[0]);
    assert.equal(
      visits.findVisitByLink(pet, "2026-08-11::Walk-in"),
      pet.visits[1]
    );
    assert.equal(
      visits.findVisitByDateClinic(pet, {
        date: "2026-08-10",
        clinicId: "c1",
      }),
      pet.visits[0]
    );
    assert.equal(
      visits.findVisitByDateClinic(pet, {
        date: "2026-08-11",
        clinicName: "Walk-in",
      }),
      pet.visits[1]
    );
  });

  it("buildTimelineEntries flags and previousVisit align", () => {
    const { visits, timeline } = createPair();
    const pet = {
      visits: [
        {
          date: "2026-08-20",
          weightAtVisit: 6,
          bagPhoto: "b",
          imaging: { xrayPhotos: ["x"], usPhotos: [] },
          medications: [{ name: "A" }],
        },
        {
          date: "2026-08-10",
          weightAtVisit: 5,
          medications: [],
        },
      ],
    };
    const prev = visits.buildPreviousVisitByIndex(pet.visits);
    const entries = timeline.buildTimelineEntries(pet);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].previousVisit, prev[0]);
    assert.equal(entries[0].previousVisit, pet.visits[1]);
    assert.equal(entries[0].year, "2026");
    assert.equal(entries[0].weightKg, 6);
    assert.deepEqual(plain(timeline.visitTimelineFlags(pet.visits[0])), {
      hasProof: true,
      hasImaging: true,
      hasRx: true,
    });
    assert.equal(entries[0].hasProof, true);
    assert.equal(entries[0].hasImaging, true);
    assert.equal(entries[0].hasRx, true);
    assert.deepEqual(plain(timeline.visitTimelineFlags(pet.visits[1])), {
      hasProof: false,
      hasImaging: false,
      hasRx: false,
    });
  });

  it("controllers never reference document or localStorage", () => {
    const visitsSrc = readFileSync(
      new URL("domains/visits/controller.js", WEB_ROOT),
      "utf8"
    );
    const timelineSrc = readFileSync(
      new URL("domains/timeline/selectors.js", WEB_ROOT),
      "utf8"
    );
    for (const src of [visitsSrc, timelineSrc]) {
      assert.equal(/\bdocument\b/.test(src), false);
      assert.equal(/\blocalStorage\b/.test(src), false);
      assert.equal(/\bmodules\/visit\b/.test(src), false);
      assert.equal(/\bt\s*\(/.test(src), false);
    }

    // Call without document / localStorage on the global
    const context = vm.createContext({ console });
    context.globalThis = context;
    context.window = context;
    vm.runInContext(
      readFileSync(new URL("domains/visits/controller.js", WEB_ROOT), "utf8"),
      context
    );
    vm.runInContext(
      readFileSync(new URL("domains/timeline/selectors.js", WEB_ROOT), "utf8"),
      context
    );
    assert.equal("document" in context, false);
    assert.equal("localStorage" in context, false);
    const visits = context.PetLiveWeb.domains.visits.createController();
    const timeline = context.PetLiveWeb.domains.timeline.createSelectors({
      visits,
    });
    const pet = {
      visits: [{ date: "2026-01-01", weightAtVisit: 3, medications: [] }],
    };
    assert.equal(visits.visitWeightKg(pet.visits[0]), 3);
    assert.equal(timeline.buildTimelineEntries(pet).length, 1);
  });
});
