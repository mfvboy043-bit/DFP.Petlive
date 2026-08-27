import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadProofPreviewShell() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;

  vm.runInContext(
    readFileSync(new URL("shell/proof-preview.js", WEB_ROOT), "utf8"),
    context,
    { filename: "shell/proof-preview.js" }
  );

  return context.PetLiveWeb.shell.createProofPreview();
}

describe("FO-05 shell proof preview builders", () => {
  it("buildProofPreviewHtml empty vs image with clear", () => {
    const shell = loadProofPreviewShell();
    const empty = shell.buildProofPreviewHtml(null, { label: (key) => key });
    assert.equal(empty.hidden, true);
    assert.equal(empty.html, "");
    const built = shell.buildProofPreviewHtml("data:image/jpeg;base64,abc", {
      label: (key) => key,
      clearKey: "bag",
    });
    assert.equal(built.hidden, false);
    assert.match(built.html, /data:image/);
    assert.match(built.html, /data-proof-clear="bag"/);
    assert.match(built.html, /proofPhotoClear/);
  });

  it("proof-preview.js has no document or innerHTML", () => {
    const src = readFileSync(new URL("shell/proof-preview.js", WEB_ROOT), "utf8");
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
  });
});
