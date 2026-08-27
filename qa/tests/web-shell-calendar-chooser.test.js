import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadChooser() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("shell/calendar-chooser.js", WEB_ROOT), "utf8"),
    context,
    { filename: "shell/calendar-chooser.js" }
  );
  return context.PetLiveWeb.shell.createCalendarChooser();
}

describe("ABCD shell calendar chooser", () => {
  it("show/close pending payload and canShow", () => {
    const chooser = loadChooser();
    assert.equal(chooser.canShow(null), false);
    assert.equal(chooser.canShow({ title: "x" }), false);
    assert.equal(chooser.canShow({ nextDue: "2026-09-01" }), true);

    const overlay = { hidden: true, dataset: {} };
    const metaEl = { textContent: "" };
    const payload = { nextDue: "2026-09-01", title: "Vax" };
    assert.equal(
      chooser.show({
        overlay,
        metaEl,
        payload,
        metaText: "meta",
      }),
      true
    );
    assert.equal(overlay.hidden, false);
    assert.equal(metaEl.textContent, "meta");
    assert.equal(chooser.getPending(), payload);

    chooser.close({ overlay });
    assert.equal(overlay.hidden, true);
    assert.equal(chooser.getPending(), null);
    assert.equal(overlay.dataset.parasiteKind, undefined);
  });

  it("source has no localStorage or literal t(", () => {
    const src = readFileSync(
      new URL("shell/calendar-chooser.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bt\s*\(/.test(src), false);
  });
});
