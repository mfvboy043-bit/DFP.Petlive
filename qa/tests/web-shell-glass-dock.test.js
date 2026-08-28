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

describe("shell glass-dock", () => {
  it("dockKeyForScreen maps passport only; detail screens have no dock tab", () => {
    const shell = loadShell(["shell/glass-dock.js"]);
    assert.equal(shell.dockKeyForScreen("timeline"), null);
    assert.equal(shell.dockKeyForScreen("add-visit"), null);
    assert.equal(shell.dockKeyForScreen("alerts"), null);
    assert.equal(shell.dockKeyForScreen("imaging"), null);
    assert.equal(shell.dockKeyForScreen("labs"), null);
    assert.equal(shell.dockKeyForScreen("emergency"), "passport");
    assert.equal(shell.dockKeyForScreen("intro"), null);
  });

  it("glassDockMarkup is solo passport tab with passportGo", () => {
    const shell = loadShell(["shell/glass-dock.js"]);
    const markup = shell.glassDockMarkup({ passportGo: "emergency" });
    assert.match(markup, /id="glass-dock"/);
    assert.match(markup, /glass-dock--solo/);
    assert.doesNotMatch(markup, /data-dock="home"/);
    assert.match(markup, /data-dock="passport"/);
    assert.match(markup, /data-go="emergency"/);
    assert.doesNotMatch(markup, /data-dock="timeline"/);
    assert.doesNotMatch(markup, /data-dock="alerts"/);
    assert.doesNotMatch(markup, /data-dock="imaging"/);
    assert.doesNotMatch(markup, /data-dock="labs"/);
    const hidden = shell.glassDockMarkup({ passportGo: "emergency", startHidden: true });
    assert.match(hidden, /\shidden/);
    const defaultGo = shell.glassDockMarkup({});
    assert.match(defaultGo, /data-go="emergency"/);
  });
});

describe("shell screen-home-btn", () => {
  it("screenHomeBtnMarkup is an icon-only control for home", () => {
    const shell = loadShell(["shell/screen-home-btn.js"]);
    const html = shell.screenHomeBtnMarkup();
    assert.match(html, /data-screen-home-btn/);
    assert.match(html, /data-go="home"/);
    assert.match(html, /data-i18n-aria="dockHome"/);
    assert.match(html, /class="screen-home-btn"/);
    assert.doesNotMatch(html, /screen-home-btn-label/);
  });
});
