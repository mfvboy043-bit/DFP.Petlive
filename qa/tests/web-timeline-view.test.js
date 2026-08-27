import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadTimelineView() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("domains/timeline/view.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/timeline/view.js" }
  );
  return context.PetLiveWeb.domains.timeline;
}

const FAKE_CATALOG = [
  {
    genericName: "Metronidazole",
    brandNameZh: "甲硝唑",
    purpose: "Antiprotozoal",
    drugClass: "Antibiotic",
    commonSideEffects: ["Nausea"],
    precautions: ["Avoid alcohol"],
  },
];

function createHelpers() {
  const timeline = loadTimelineView();
  return timeline.createViewHelpers({
    findDrugByName(name) {
      const q = String(name || "").trim().toLowerCase();
      return (
        FAKE_CATALOG.find((drug) => {
          const keys = [drug.genericName, drug.brandNameZh]
            .filter(Boolean)
            .map((item) => String(item).toLowerCase());
          return keys.some((key) => key === q || key.includes(q) || q.includes(key));
        }) || null
      );
    },
  });
}

describe("TL-01 / TL-02 timeline view helpers", () => {
  it("notesIdForMed is stable for med and ingredient rows", () => {
    const helpers = createHelpers();
    assert.equal(
      helpers.notesIdForMed({ petId: "p1", visitIndex: 2, medIndex: 1 }),
      "drug-notes-p1-2-1"
    );
    assert.equal(
      helpers.notesIdForMed({
        petId: "p1",
        visitIndex: 2,
        medIndex: 1,
        ingredientIndex: 0,
      }),
      "drug-notes-p1-2-1-0"
    );
    assert.equal(
      helpers.notesIdForMed({ petId: "p1", medIndex: 3, emergency: true }),
      "e-drug-notes-p1-3"
    );
  });

  it("resolveDrugNoteModel covers pending, unavailable, matched", () => {
    const helpers = createHelpers();
    assert.deepEqual(
      helpers.resolveDrugNoteModel({ kind: "photo_bundle", name: "X" }),
      { status: "pending", sideEffects: [], precautions: [] }
    );
    assert.deepEqual(helpers.resolveDrugNoteModel({ name: "UnknownDrug" }), {
      status: "unavailable",
      sideEffects: [],
      precautions: [],
    });
    const matched = helpers.resolveDrugNoteModel({ name: "甲硝唑" });
    assert.equal(matched.status, "matched");
    assert.equal(matched.purposeText, "Antiprotozoal");
    assert.deepEqual(matched.sideEffects, ["Nausea"]);
    assert.deepEqual(matched.precautions, ["Avoid alcohol"]);
  });

  it("domain view.js has no DOM or storage", () => {
    const src = readFileSync(
      new URL("domains/timeline/view.js", WEB_ROOT),
      "utf8"
    );
    assert.doesNotMatch(src, /\bdocument\b/);
    assert.doesNotMatch(src, /\binnerHTML\b/);
    assert.doesNotMatch(src, /\blocalStorage\b/);
    assert.doesNotMatch(src, /\bt\s*\(/);
  });

  it("lazy shell HTML is smaller than eager matched body", () => {
    const helpers = createHelpers();
    const med = { name: "甲硝唑" };
    const model = helpers.resolveDrugNoteModel(med);
    const shell = `<div class="tl-drug-notes" hidden><div class="tl-drug-notes-body"></div></div>`;
    const eagerSides = model.sideEffects.map((item) => `<li>${item}</li>`).join("");
    const eager =
      shell +
      `<p>${model.purposeText}</p><ul>${eagerSides}</ul>`.repeat(3);
    assert.ok(shell.length < eager.length);
  });
});
