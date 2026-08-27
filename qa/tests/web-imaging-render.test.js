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

function loadImagingRenderer() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;

  vm.runInContext(
    readFileSync(new URL("domains/imaging/render.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/imaging/render.js" }
  );

  const renderer = context.PetLiveWeb.domains.imaging.createRenderer({
    label: stubLabel,
    escapeHtml: (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;"),
    visitClinicLabel: (visit) => visit.clinic || "Clinic",
    formatImagingTypes: () => "X-ray",
  });

  return { renderer };
}

describe("IM-05 imaging render builders", () => {
  it("buildEmptyListHtml includes go-timeline CTA", () => {
    const { renderer } = loadImagingRenderer();
    const html = renderer.buildEmptyListHtml();
    assert.match(html, /imaging-list-empty/);
    assert.match(html, /data-go-timeline-from-imaging/);
    assert.match(html, /imagingEmptyGoTimeline/);
  });

  it("buildImagingListHtml item button attrs", () => {
    const { renderer } = loadImagingRenderer();
    const html = renderer.buildImagingListHtml([
      {
        visit: { date: "2026-08-01", clinic: "Happy Vet" },
        index: 2,
      },
    ]);
    assert.match(html, /data-open-visit-imaging="2"/);
    assert.match(html, /imaging-item-clinic/);
    assert.match(html, /2026-08-01/);
  });

  it("buildEmergencyNavPresentation empty vs latest", () => {
    const { renderer } = loadImagingRenderer();
    const empty = renderer.buildEmergencyNavPresentation([]);
    assert.equal(empty.i18nMode, "empty");
    assert.equal(empty.i18nKey, "eXraySubEmpty");
    const latest = renderer.buildEmergencyNavPresentation([
      { visit: { date: "2026-08-01" }, index: 0 },
    ]);
    assert.equal(latest.i18nMode, "dynamic");
    assert.match(latest.subText, /eXraySubLatest/);
  });

  it("render.js has no document, innerHTML, localStorage, or literal t(", () => {
    const src = readFileSync(
      new URL("domains/imaging/render.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bt\s*\(/.test(src), false);
    assert.equal(/\bPetLive\b/.test(src), false);
  });
});
