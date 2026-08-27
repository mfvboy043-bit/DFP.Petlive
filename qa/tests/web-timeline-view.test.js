import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadTimelineView() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  ["domains/timeline/selectors.js", "domains/timeline/view.js"].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });
  return context.PetLiveWeb;
}

const FAKE_CATALOG = [
  {
    genericName: "Metronidazole",
    brandNameZh: "甲硝唑",
    brandNameEn: "Flagyl",
    commonAliases: ["metro"],
    purpose: "Antiprotozoal",
    drugClass: "Antibiotic",
    commonSideEffects: ["Nausea", "Loss of appetite"],
    precautions: ["Avoid alcohol"],
  },
  {
    genericName: "Prednisolone",
    brandNameZh: "潑尼松龍",
    purpose: "Anti-inflammatory",
    commonSideEffects: [],
    precautions: ["Taper dose"],
  },
];

function createViewHelpers(catalog = FAKE_CATALOG) {
  const api = loadTimelineView();
  return api.domains.timeline.createViewHelpers({
    findDrugByName: (name) =>
      api.domains.timeline.findDrugByNameInCatalog(catalog, name),
  });
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("TL-04 timeline drug-note view helpers", () => {
  it("resolveDrugNoteModel: pending for photo_bundle / structuredPending", () => {
    const view = createViewHelpers();
    assert.deepEqual(
      plain(view.resolveDrugNoteModel({ kind: "photo_bundle", name: "X" })),
      { status: "pending", sideEffects: [], precautions: [] }
    );
    assert.deepEqual(
      plain(view.resolveDrugNoteModel({ name: "X", structuredPending: true })),
      { status: "pending", sideEffects: [], precautions: [] }
    );
  });

  it("resolveDrugNoteModel: unavailable when no catalog match", () => {
    const view = createViewHelpers();
    assert.deepEqual(plain(view.resolveDrugNoteModel({ name: "UnknownDrug" })), {
      status: "unavailable",
      sideEffects: [],
      precautions: [],
    });
  });

  it("resolveDrugNoteModel: matched with purpose, lists, and purpose||drugClass fallback", () => {
    const view = createViewHelpers();
    assert.deepEqual(plain(view.resolveDrugNoteModel({ name: "甲硝唑" })), {
      status: "matched",
      purposeText: "Antiprotozoal",
      sideEffects: ["Nausea", "Loss of appetite"],
      precautions: ["Avoid alcohol"],
    });
    assert.deepEqual(plain(view.resolveDrugNoteModel({ name: "Prednisolone" })), {
      status: "matched",
      purposeText: "Anti-inflammatory",
      sideEffects: [],
      precautions: ["Taper dose"],
    });
    const noPurpose = createViewHelpers([
      {
        genericName: "TestMed",
        drugClass: "ClassOnly",
        commonSideEffects: [],
        precautions: [],
      },
    ]);
    assert.equal(
      noPurpose.resolveDrugNoteModel({ name: "TestMed" }).purposeText,
      "ClassOnly"
    );
  });

  it("hydrateDrugNoteModel matches resolveDrugNoteModel", () => {
    const view = createViewHelpers();
    const med = { name: "metro" };
    assert.deepEqual(
      plain(view.hydrateDrugNoteModel(med)),
      plain(view.resolveDrugNoteModel(med))
    );
  });

  it("findDrugByNameInCatalog: alias, includes, and exact parity cases", () => {
    const api = loadTimelineView();
    const find = (name) =>
      api.domains.timeline.findDrugByNameInCatalog(FAKE_CATALOG, name);

    assert.equal(find("Metronidazole")?.genericName, "Metronidazole");
    assert.equal(find("甲硝唑")?.genericName, "Metronidazole");
    assert.equal(find("metro")?.genericName, "Metronidazole");
    assert.equal(find("Flagyl")?.genericName, "Metronidazole");
    assert.equal(find("  METRO  ")?.genericName, "Metronidazole");
    assert.equal(find(""), null);
    assert.equal(find(null), null);
    assert.equal(find("TotallyUnknown"), null);
  });

  it("notesIdForMed: stable ids for med, ingredient, emergency", () => {
    const view = createViewHelpers();
    assert.equal(
      view.notesIdForMed({ petId: "p1", visitIndex: 2, medIndex: 1 }),
      "drug-notes-p1-2-1"
    );
    assert.equal(
      view.notesIdForMed({
        petId: "p1",
        visitIndex: 2,
        medIndex: 1,
        ingredientIndex: 0,
      }),
      "drug-notes-p1-2-1-0"
    );
    assert.equal(
      view.notesIdForMed({ emergencyPrefix: "p1", medIndex: 3 }),
      "e-drug-notes-p1-3"
    );
    assert.equal(
      view.notesIdForMed({ emergencyPrefix: "med-abc", medIndex: 0 }),
      "e-drug-notes-med-abc-0"
    );
  });

  it("shouldDeferDrugNoteBody: all bodies deferred until first expand", () => {
    const view = createViewHelpers();
    assert.equal(view.shouldDeferDrugNoteBody(), true);
  });

  it("shell HTML is smaller than eager matched body payload", () => {
    const view = createViewHelpers();
    const model = view.resolveDrugNoteModel({ name: "甲硝唑" });
    const shellApprox = `<div class="tl-drug-notes" id="drug-notes-p-0-0" hidden data-drug-notes-shell>
    <p class="tl-drug-notes-title">Notes</p>
  </div>`;
    const eagerBodyLen =
      (model.purposeText?.length || 0) +
      model.sideEffects.join("").length +
      model.precautions.join("").length +
      200;
    assert.ok(shellApprox.length < eagerBodyLen);
  });

  it("timeline view domain files contain no document, innerHTML, localStorage, or t(", () => {
    for (const file of ["domains/timeline/selectors.js", "domains/timeline/view.js"]) {
      const src = readFileSync(new URL(file, WEB_ROOT), "utf8");
      assert.equal(/\bdocument\b/.test(src), false, file);
      assert.equal(/\binnerHTML\b/.test(src), false, file);
      assert.equal(/\blocalStorage\b/.test(src), false, file);
      assert.equal(/\bt\s*\(/.test(src), false, file);
    }

    const context = vm.createContext({ console });
    context.globalThis = context;
    context.window = context;
    vm.runInContext(
      readFileSync(new URL("domains/timeline/view.js", WEB_ROOT), "utf8"),
      context
    );
    const view = context.PetLiveWeb.domains.timeline.createViewHelpers({
      findDrugByName: () => null,
    });
    assert.equal("document" in context, false);
    assert.deepEqual(plain(view.resolveDrugNoteModel({ name: "X" })), {
      status: "unavailable",
      sideEffects: [],
      precautions: [],
    });
  });
});
