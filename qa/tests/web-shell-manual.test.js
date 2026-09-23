import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadManual() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("shell/manual.js", WEB_ROOT), "utf8"),
    context,
    { filename: "shell/manual.js" }
  );
  return context.PetLiveWeb.shell;
}

describe("shell/manual paint", () => {
  it("points primary to add-pet when empty", () => {
    const shell = loadManual();
    const store = {};
    const doc = {
      getElementById(id) {
        if (!store[id]) {
          store[id] = {
            attrs: {},
            textContent: "",
            setAttribute(key, value) {
              this.attrs[key] = value;
            },
          };
        }
        return store[id];
      },
    };
    assert.equal(
      shell.paintManualScreen(doc, {
        empty: true,
        label: (key) => key,
      }),
      true
    );
    assert.equal(store["manual-cta-primary"].attrs["data-go"], "add-pet");
    assert.equal(store["manual-cta-add-alt"].attrs["data-go"], "home");
  });

  it("points primary to home when pets exist", () => {
    const shell = loadManual();
    const store = {};
    const doc = {
      getElementById(id) {
        if (!store[id]) {
          store[id] = {
            attrs: {},
            textContent: "",
            setAttribute(key, value) {
              this.attrs[key] = value;
            },
          };
        }
        return store[id];
      },
    };
    shell.paintManualScreen(doc, {
      empty: false,
      label: (key) => key,
    });
    assert.equal(store["manual-cta-primary"].attrs["data-go"], "home");
    assert.equal(store["manual-cta-add-alt"].attrs["data-go"], "add-pet");
  });
});
