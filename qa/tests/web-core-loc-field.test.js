import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadLocField() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("core/loc-field.js", WEB_ROOT), "utf8"),
    context,
    { filename: "core/loc-field.js" }
  );
  return context.PetLiveWeb.core.createLocField;
}

describe("core loc-field", () => {
  it("returns empty for nullish and passthrough for strings", () => {
    const locField = loadLocField()({ getCurrentLang: () => "en" });
    assert.equal(locField(null), "");
    assert.equal(locField(undefined), "");
    assert.equal(locField("plain"), "plain");
  });

  it("resolves language map with fallback chain", () => {
    const locField = loadLocField()({ getCurrentLang: () => "ja" });
    assert.equal(locField({ ja: "犬", en: "dog", "zh-Hant": "狗" }), "犬");
    assert.equal(locField({ en: "dog", "zh-Hant": "狗" }), "狗");
    assert.equal(locField({ zh: "狗" }), "狗");
    assert.equal(locField({ en: "dog" }), "dog");
    assert.equal(locField({}), "");
  });

  it("defaults lang to zh-Hant when getter missing", () => {
    const locField = loadLocField()({});
    assert.equal(locField({ "zh-Hant": "狗", en: "dog" }), "狗");
  });
});
