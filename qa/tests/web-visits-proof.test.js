import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadVisits() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("domains/visits/controller.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/visits/controller.js" }
  );
  return context.PetLiveWeb.domains.visits.createController({});
}

describe("visits Rx proof storage", () => {
  it("setVisitProofPhotos keeps visit stills and clears med copies", () => {
    const visits = loadVisits();
    const visit = {
      date: "2026-09-23",
      bagPhoto: null,
      medications: [
        { id: "m1", name: "A", bagPhoto: "old", rxPhoto: "old-rx" },
        { id: "m2", name: "B", drugPhoto: "old-drug" },
      ],
    };
    visits.setVisitProofPhotos(visit, {
      bagPhoto: "bag",
      rxPhoto: "rx",
      drugPhoto: "drug",
    });
    assert.equal(visit.bagPhoto, "bag");
    assert.equal(visit.rxPhoto, "rx");
    assert.equal(visit.drugPhoto, "drug");
    assert.equal(visit.medications[0].bagPhoto, null);
    assert.equal(visit.medications[0].rxPhoto, null);
    assert.equal(visit.medications[1].drugPhoto, null);
    const slots = visits.collectVisitProofPhotos(visit);
    assert.equal(slots.bag.length, 1);
    assert.equal(slots.bag[0], "bag");
    assert.equal(slots.rx[0], "rx");
    assert.equal(slots.drug[0], "drug");
  });

  it("stripRedundantMedProofCopies only when visit owns the slot", () => {
    const visits = loadVisits();
    const visit = {
      bagPhoto: "visit-bag",
      medications: [
        { bagPhoto: "dup", rxPhoto: "med-only-rx" },
      ],
    };
    assert.equal(visits.stripRedundantMedProofCopies(visit), true);
    assert.equal(visit.medications[0].bagPhoto, null);
    assert.equal(visit.medications[0].rxPhoto, "med-only-rx");
  });
});
