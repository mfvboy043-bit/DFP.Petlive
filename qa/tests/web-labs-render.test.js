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

function loadLabsRenderer() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;

  vm.runInContext(
    readFileSync(new URL("domains/labs/render.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/labs/render.js" }
  );

  const renderer = context.PetLiveWeb.domains.labs.createRenderer({
    label: stubLabel,
    escapeHtml: (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;"),
    formatLabTypes: (types) => (types?.length ? types.join("/") : "labNoTypes"),
  });

  return { renderer };
}

describe("LB-05 labs render builders", () => {
  it("buildEmptyListHtml and buildLabListHtml empty", () => {
    const { renderer } = loadLabsRenderer();
    assert.match(renderer.buildEmptyListHtml(), /lab-list-empty/);
    assert.equal(renderer.buildLabListHtml([]), renderer.buildEmptyListHtml());
  });

  it("buildLabListHtml report row attrs and escape", () => {
    const { renderer } = loadLabsRenderer();
    const html = renderer.buildLabListHtml([
      {
        id: "lab-1",
        date: "2026-08-01",
        clinic: "Clinic<script>",
        types: ["cbc"],
        note: "Note",
        photos: ["data:image/png;base64,x"],
      },
    ]);
    assert.match(html, /data-lab-id="lab-1"/);
    assert.match(html, /data-lab-remove="lab-1"/);
    assert.match(html, /Clinic&lt;script/);
    assert.match(html, /data-proof-lightbox/);
    assert.match(html, /lab-item-note/);
  });

  it("buildEmergencyNavPresentation empty vs latest", () => {
    const { renderer } = loadLabsRenderer();
    const empty = renderer.buildEmergencyNavPresentation([]);
    assert.equal(empty.i18nMode, "empty");
    assert.equal(empty.i18nKey, "eLabSubEmpty");
    const latest = renderer.buildEmergencyNavPresentation([
      { date: "2026-08-01", types: ["cbc"] },
    ]);
    assert.equal(latest.i18nMode, "dynamic");
    assert.match(latest.subText, /eLabSubLatest/);
  });

  it("render.js has no document, innerHTML, localStorage, or literal t(", () => {
    const src = readFileSync(new URL("domains/labs/render.js", WEB_ROOT), "utf8");
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bt\s*\(/.test(src), false);
    assert.equal(/\bPetLive\b/.test(src), false);
  });
});
