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

describe("Phase 1 surface stylesheet activation", () => {
  const cStyles = stylesheetHrefs(read("c/index.html"));
  const bStyles = stylesheetHrefs(read("index.html"));

  it("loads C canonical account and parasite styles before C overrides", () => {
    const account = "../shell/account-chrome.css?v=20260903-cb-p1";
    const parasite = "../shell/parasite-strip.css?v=20260903-cb-p1";
    const surface = "./styles.css?v=20260903-cb-p1";

    assert.equal(cStyles.filter((href) => href === account).length, 1);
    assert.equal(cStyles.filter((href) => href === parasite).length, 1);
    assert.ok(cStyles.indexOf(account) < cStyles.indexOf(surface));
    assert.ok(cStyles.indexOf(parasite) < cStyles.indexOf(surface));
  });

  it("does not activate account chrome on B during Phase 1", () => {
    assert.equal(
      bStyles.some((href) => href.includes("account-chrome.css")),
      false,
    );
  });

  it("keeps B's unlayered parasite duplicates authoritative", () => {
    const parasiteIndex = bStyles.findIndex((href) => href.includes("parasite-strip.css"));
    const surfaceIndex = bStyles.findIndex((href) => href.startsWith("./styles.css?v="));
    const parasiteCss = read("shell/parasite-strip.css");
    const bSurfaceCss = read("styles.css");

    assert.ok(parasiteIndex >= 0, "B must retain its existing parasite shell asset");
    assert.ok(surfaceIndex >= 0, "B must retain its own surface stylesheet");
    assert.match(parasiteCss, /@layer petlive-shared-shell\s*\{/);
    assert.doesNotMatch(bSurfaceCss, /@layer petlive-shared-shell\s*\{/);
    assert.ok(
      surfaceIndex < parasiteIndex,
      "baseline B link order must stay unchanged during Phase 1",
    );
  });
});
