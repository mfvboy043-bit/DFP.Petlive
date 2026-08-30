import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function stubLabel(key, params) {
  if (params && typeof params === "object") {
    return `${key}:${JSON.stringify(params)}`;
  }
  return key;
}

function loadVaccinesRenderer({
  daysUntil,
  findKeyByLocalizedName,
  isRabiesLocalizedName,
} = {}) {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;

  ["domains/vaccines/selectors.js", "domains/vaccines/render.js"].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });

  const daysUntilFn =
    daysUntil ||
    ((iso) => {
      if (iso === "past") return 0;
      if (iso === "soon") return 45;
      if (iso === "future") return 120;
      return 100;
    });

  const selectors = context.PetLiveWeb.domains.vaccines.createSelectors({
    daysUntil: daysUntilFn,
    findKeyByLocalizedName:
      findKeyByLocalizedName ||
      ((name) => {
        const map = { "五合一": "v5in1", Rabies: "vRabies" };
        return map[name] || "";
      }),
    isRabiesLocalizedName,
  });

  const vaccineLabelOf = (vaccine) => vaccine.name || vaccine.key || "unknown";

  const renderer = context.PetLiveWeb.domains.vaccines.createRenderer({
    label: stubLabel,
    compareVaccinesForList: (pet, a, b) =>
      selectors.compareVaccinesForList(pet, a, b),
    getVaccineSuccessor: (pet, vaccine) =>
      selectors.getVaccineSuccessor(pet, vaccine),
    getVaccineProtectionStatus: (next) =>
      selectors.getVaccineProtectionStatus(next),
    vaccineLabelOf,
  });

  return { renderer, selectors };
}

describe("VA-05 vaccines render builders", () => {
  it("buildEmptyListHtml and buildVaccineListHtml empty", () => {
    const { renderer } = loadVaccinesRenderer();
    assert.match(renderer.buildEmptyListHtml(), /vaccine-empty/);
    assert.match(renderer.buildEmptyListHtml(), /noVaccines/);
    assert.equal(renderer.buildVaccineListHtml({ vaccines: [] }, []), renderer.buildEmptyListHtml());
  });

  it("buildVaccineListHtml protected, approaching, expired, superseded", () => {
    const { renderer } = loadVaccinesRenderer();
    const pet = {
      vaccines: [
        { key: "v5in1", name: "五合一", given: "2024-01-01", next: "future" },
        { key: "vRabies", name: "Rabies", given: "2024-01-01", next: "soon" },
        { key: "vLepto", name: "Lepto", given: "2023-01-01", next: "past" },
        { key: "v5in1", name: "Old五合一", given: "2022-01-01", next: "2023-01-01" },
      ],
    };
    const html = renderer.buildVaccineListHtml(pet, pet.vaccines);
    assert.match(html, /pill-ok/);
    assert.match(html, /pill-soon/);
    assert.match(html, /pill-expired/);
    assert.match(html, /is-superseded/);
    assert.match(html, /pill-history/);
    assert.match(html, /givenNext/);
  });

  it("buildStripPresentation not-set and status tones", () => {
    const { renderer } = loadVaccinesRenderer();
    const unset = renderer.buildStripPresentation(null);
    assert.equal(unset.rowClass, "is-unprotected");
    assert.equal(unset.metaText, "vaccineNotSet");
    assert.equal(unset.statusText, "parasiteUnprotected");
    assert.equal(unset.lightStatus, "expired");
    const expired = renderer.buildStripPresentation({
      key: "vRabies",
      name: "Rabies",
      next: "past",
    });
    assert.equal(expired.rowClass, "is-unprotected");
    assert.match(expired.metaText, /vaccineStripMeta/);
    assert.equal(expired.lightStatus, "expired");
    const approaching = renderer.buildStripPresentation({
      key: "v5in1",
      name: "五合一",
      next: "soon",
    });
    assert.equal(approaching.rowClass, "is-approaching");
    assert.equal(approaching.statusText, "parasiteApproaching");
    assert.equal(approaching.lightStatus, "approaching");
    const protectedRow = renderer.buildStripPresentation({
      key: "v5in1",
      name: "五合一",
      next: "future",
    });
    assert.equal(protectedRow.rowClass, "is-protected");
    assert.equal(protectedRow.statusText, "parasiteProtected");
    assert.equal(protectedRow.lightStatus, "protected");
  });

  it("buildEmergencyNavPresentation no-next and status tones", () => {
    const { renderer } = loadVaccinesRenderer();
    const unset = renderer.buildEmergencyNavPresentation(null);
    assert.equal(unset.nextText, "noVaccineNext");
    assert.equal(unset.nextClassName, "");
    assert.equal(unset.btnClass, "is-protected");
    assert.equal(unset.lightStatus, null);
    const expired = renderer.buildEmergencyNavPresentation({
      key: "vRabies",
      name: "Rabies",
      next: "past",
    });
    assert.equal(expired.nextClassName, "e-nav-expired");
    assert.equal(expired.btnClass, "is-expired");
    assert.equal(expired.lightStatus, "expired");
    const approaching = renderer.buildEmergencyNavPresentation({
      key: "v5in1",
      name: "五合一",
      next: "soon",
    });
    assert.equal(approaching.nextClassName, "e-nav-approaching");
    assert.equal(approaching.btnClass, "is-approaching");
    assert.equal(approaching.lightStatus, "approaching");
  });

  it("render.js has no document, innerHTML, localStorage, or literal t(", () => {
    const src = readFileSync(
      new URL("domains/vaccines/render.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bt\s*\(/.test(src), false);
    assert.equal(/\bPetLive\b/.test(src), false);
  });

  it("buildFormChipsHtml rows and keys", () => {
    const { renderer } = loadVaccinesRenderer();
    const html = renderer.buildFormChipsHtml([
      { labelKey: "vaccineChipCore", keys: ["v5in1", "vRabies"] },
    ]);
    assert.match(html, /vaccine-chip-row/);
    assert.match(html, /vaccineChipCore/);
    assert.match(html, /data-vaccine-key="v5in1"/);
    assert.match(html, /data-vaccine-key="vRabies"/);
  });
});
