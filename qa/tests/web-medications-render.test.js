import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadMedicationsRenderer() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;

  vm.runInContext(
    readFileSync(new URL("domains/medications/render.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/medications/render.js" }
  );

  return context.PetLiveWeb.domains.medications.createRenderer({
    label: (key, params) => {
      if (key === "medDetailsPending") return "medDetailsPending";
      if (params && typeof params === "object" && "n" in params) return `${key}:${params.n}`;
      return key;
    },
    compoundFormOptions: [["liquid_a", "compoundLiquidA"]],
    compoundColorSwatches: [{ hex: "#E8655A", labelKey: "compoundColorRose" }],
    compoundChipToneClass: () => "tone-a",
    compoundIconKind: () => "liquid",
    resolveCompoundColor: (_group, explicit) => explicit || "#E8655A",
  });
}

describe("FO-05 medications render builders", () => {
  it("buildClinicResultsHtml and buildDrugResultsHtml", () => {
    const renderer = loadMedicationsRenderer();
    const emptyClinic = renderer.buildClinicResultsHtml([]);
    assert.equal(emptyClinic.hidden, true);
    assert.equal(emptyClinic.html, "");
    const clinic = renderer.buildClinicResultsHtml([
      { id: "c1", name: "Vet", note: "note", anonymous: true },
    ]);
    assert.match(clinic.html, /data-clinic-id="c1"/);
    assert.match(clinic.html, /is-anonymous/);

    const drug = renderer.buildDrugResultsHtml([
      { id: "d1", genericName: "Amox", brandNameZh: "阿莫", drugClass: "Abx", purpose: "感染" },
    ]);
    assert.match(drug.html, /data-drug-id="d1"/);
    assert.match(drug.html, /Amox（阿莫）/);
  });

  it("buildDrugInfoListsHtml empty vs populated", () => {
    const renderer = loadMedicationsRenderer();
    assert.equal(renderer.buildDrugInfoListsHtml(null).visible, false);
    const built = renderer.buildDrugInfoListsHtml({
      drugClass: "Abx",
      purpose: "感染",
      commonSideEffects: ["Nausea"],
      precautions: ["Kidney"],
    });
    assert.match(built.purposeText, /Abx/);
    assert.match(built.sideEffectsHtml, /Nausea/);
    assert.match(built.precautionsHtml, /Kidney/);
  });

  it("buildPendingMedsListHtml with compound options", () => {
    const renderer = loadMedicationsRenderer();
    const empty = renderer.buildPendingMedsListHtml([]);
    assert.equal(empty.countI18nKey, "pendingMedsEmpty");

    const built = renderer.buildPendingMedsListHtml([
      {
        localId: "pm-1",
        name: "Med A",
        dose: "1 tab",
        compoundGroup: "liquid_a",
        compoundColor: "#E8655A",
      },
      { localId: "pm-2", name: "Med B", dose: "medDetailsPending", compoundGroup: "" },
    ]);
    assert.match(built.listHtml, /data-pending-id="pm-1"/);
    assert.match(built.listHtml, /pending-compound/);
    assert.match(built.listHtml, /is-pending/);
    assert.equal(built.showCompoundHint, true);
  });

  it("buildCompoundColorSwatchesHtml", () => {
    const renderer = loadMedicationsRenderer();
    assert.equal(renderer.buildCompoundColorSwatchesHtml("").hidden, true);
    const built = renderer.buildCompoundColorSwatchesHtml("liquid_a", "#E8655A");
    assert.match(built.html, /compound-color-swatch is-on/);
    assert.equal(built.colorValue, "#E8655A");
  });

  it("render.js has no document, innerHTML, localStorage, or literal t(", () => {
    const src = readFileSync(
      new URL("domains/medications/render.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bt\s*\(/.test(src), false);
  });
});
