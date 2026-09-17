import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, WEB_ROOT), "utf8");
}

function stylesheetHrefs(html) {
  return [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g)]
    .map((match) => match[1]);
}

describe("Phase 2 surface stylesheet activation", () => {
  const cStyles = stylesheetHrefs(read("c/index.html"));
  const bStyles = stylesheetHrefs(read("index.html"));
  const token = "20260903-cb-p2";

  it("loads C canonical account and parasite styles before C overrides", () => {
    const account = `../shell/account-chrome.css?v=${token}`;
    const parasite = `../shell/parasite-strip.css?v=${token}`;
    const surfaceIndex = cStyles.findIndex((href) => href.startsWith("./styles.css?v="));
    assert.equal(cStyles.filter((href) => href === account).length, 1);
    assert.equal(cStyles.filter((href) => href === parasite).length, 1);
    assert.ok(cStyles.indexOf(account) < surfaceIndex);
    assert.ok(cStyles.indexOf(parasite) < surfaceIndex);
  });

  it("activates the same canonical CSS on B before B overrides", () => {
    const account = `./shell/account-chrome.css?v=${token}`;
    const parasite = `./shell/parasite-strip.css?v=${token}`;
    const surfaceIndex = bStyles.findIndex((href) => href.startsWith("./styles.css?v="));
    assert.equal(bStyles.filter((href) => href === account).length, 1);
    assert.equal(bStyles.filter((href) => href === parasite).length, 1);
    assert.ok(bStyles.indexOf(account) < surfaceIndex);
    assert.ok(bStyles.indexOf(parasite) < surfaceIndex);
    assert.equal(
      bStyles.filter((href) => href.includes("parasite-strip.css")).length,
      1,
      "B must not double-load parasite-strip.css",
    );
  });
});
