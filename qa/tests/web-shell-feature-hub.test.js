import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadShell(files) {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  for (const file of files) {
    vm.runInContext(readFileSync(new URL(file, WEB_ROOT), "utf8"), context, {
      filename: file,
    });
  }
  return context.PetLiveWeb.shell;
}

describe("shell feature-hub", () => {
  it("featureHubBodyMarkup includes five emergency shortcuts", () => {
    const shell = loadShell(["shell/feature-hub.js"]);
    const html = shell.featureHubBodyMarkup();
    assert.match(html, /data-go="timeline"/);
    assert.match(html, /data-go="alerts"/);
    assert.match(html, /data-go="vaccines"/);
    assert.match(html, /data-go="imaging"/);
    assert.match(html, /data-go="labs"/);
    assert.match(html, /id="fh-vaccine-btn"/);
    assert.match(html, /id="fh-vax-lights"/);
    assert.match(html, /id="e-xray-btn"/);
    assert.match(html, /id="e-lab-btn"/);
    assert.match(html, /class="e-nav-alerts"/);
    assert.doesNotMatch(html, /id="e-vaccine-btn"/);
  });
});
