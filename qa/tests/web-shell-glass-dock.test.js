/**
 * Shell glass-dock — pure screen → tab mapping (no DOM).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SRC = path.resolve(
  __dirname,
  "../../apps/web/shell/glass-dock.js"
);

function loadShell() {
  const code = fs.readFileSync(SRC, "utf8");
  const sandbox = { console, window: {} };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.runInNewContext(code, sandbox);
  return sandbox.PetLiveWeb.shell;
}

test("dockKeyForScreen maps passport tabs and child screens", () => {
  const shell = loadShell();
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
