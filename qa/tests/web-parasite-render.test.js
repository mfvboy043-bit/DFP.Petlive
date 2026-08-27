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

function stubStatusLabel(status) {
  return `status:${status}`;
}

function loadParasiteRenderer() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;

  vm.runInContext(
    readFileSync(new URL("domains/parasite/render.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/parasite/render.js" }
  );

  const renderer = context.PetLiveWeb.domains.parasite.createRenderer({
    label: stubLabel,
    parasiteStatusLabel: stubStatusLabel,
    productChipLabel: (item) => item.key,
    isDualProduct: (key) => key === "dual",
  });

  return { renderer };
}

describe("PA-05 parasite render builders", () => {
  it("buildKindStripPresentation optional cat heartworm", () => {
    const { renderer } = loadParasiteRenderer();
    const row = renderer.buildKindStripPresentation({
      record: null,
      status: "optional",
      productLabel: "",
    });
    assert.equal(row.rowClass, "is-optional");
    assert.equal(row.metaText, "parasiteHeartwormOptional");
    assert.equal(row.statusText, "status:optional");
  });

  it("buildKindStripPresentation unset and protected with meta", () => {
    const { renderer } = loadParasiteRenderer();
    const unset = renderer.buildKindStripPresentation({
      record: { productKey: "ppFrontline" },
      status: "unprotected",
      productLabel: "Frontline",
    });
    assert.equal(unset.rowClass, "is-unprotected");
    assert.equal(unset.metaText, "parasiteNotSet");
    assert.equal(unset.statusText, "status:unprotected");

    const protectedRow = renderer.buildKindStripPresentation({
      record: { productKey: "ppFrontline", nextDue: "2026-12-01" },
      status: "protected",
      productLabel: "Frontline",
    });
    assert.equal(protectedRow.rowClass, "is-protected");
    assert.match(protectedRow.metaText, /parasiteStripMeta/);
    assert.equal(protectedRow.statusText, "status:protected");
  });

  it("buildKindStripPresentation approaching tone", () => {
    const { renderer } = loadParasiteRenderer();
    const row = renderer.buildKindStripPresentation({
      record: { product: "Custom", nextDue: "2026-09-01" },
      status: "approaching",
      productLabel: "Custom",
    });
    assert.equal(row.rowClass, "is-approaching");
    assert.equal(row.statusText, "status:approaching");
  });

  it("buildProductChipsHtml splits dual row", () => {
    const { renderer } = loadParasiteRenderer();
    const html = renderer.buildProductChipsHtml({
      kind: "external",
      selectedKey: "a",
      products: [
        { key: "a", intervalDays: 30 },
        { key: "dual", intervalDays: 30 },
      ],
    });
    assert.match(html, /parasite-chip-row/);
    assert.match(html, /data-parasite-product="a"/);
    assert.match(html, /is-on/);
    assert.match(html, /data-parasite-product="dual"/);
  });

  it("buildEmptyStripRowPresentation external vs vaccine meta keys", () => {
    const { renderer } = loadParasiteRenderer();
    const external = renderer.buildEmptyStripRowPresentation("external");
    assert.equal(external.rowClass, "is-unprotected");
    assert.equal(external.metaText, "parasiteNotSet");
    assert.equal(external.statusText, "parasiteUnprotected");
    const vaccine = renderer.buildEmptyStripRowPresentation("vaccine");
    assert.equal(vaccine.metaText, "vaccineNotSet");
  });

  it("render.js has no document, innerHTML, localStorage, or literal t(", () => {
    const src = readFileSync(
      new URL("domains/parasite/render.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bt\s*\(/.test(src), false);
    assert.equal(/\bPetLive\b/.test(src), false);
  });
});
