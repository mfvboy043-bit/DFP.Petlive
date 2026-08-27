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
  it("dockKeyForScreen maps passport tabs and child screens", () => {
    const shell = loadShell(["shell/glass-dock.js"]);
    assert.equal(shell.dockKeyForScreen("timeline"), "timeline");
    assert.equal(shell.dockKeyForScreen("add-visit"), "timeline");
    assert.equal(shell.dockKeyForScreen("add-med"), "timeline");
    assert.equal(shell.dockKeyForScreen("alerts"), "alerts");
    assert.equal(shell.dockKeyForScreen("home"), "home");
    assert.equal(shell.dockKeyForScreen("emergency"), "home");
    assert.equal(shell.dockKeyForScreen("imaging"), "imaging");
    assert.equal(shell.dockKeyForScreen("imaging-proof"), "imaging");
    assert.equal(shell.dockKeyForScreen("labs"), "labs");
    assert.equal(shell.dockKeyForScreen("lab-add"), "labs");
    assert.equal(shell.dockKeyForScreen("intro"), null);
    assert.equal(shell.dockKeyForScreen("owner-settings"), null);
  });

  it("glassDockMarkup includes five tabs and passportGo", () => {
    const shell = loadShell(["shell/glass-dock.js"]);
    const home = shell.glassDockMarkup({ passportGo: "home" });
    assert.match(home, /id="glass-dock"/);
    assert.match(home, /data-dock="timeline"/);
    assert.match(home, /data-go="home"/);
    const em = shell.glassDockMarkup({ passportGo: "emergency", startHidden: true });
    assert.match(em, /data-go="emergency"/);
    assert.match(em, /\shidden/);
  });
});
