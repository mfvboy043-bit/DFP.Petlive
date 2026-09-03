import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadFeatureHub() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("shell/feature-hub.js", WEB_ROOT), "utf8"),
    context,
    { filename: "shell/feature-hub.js" }
  );
  return context.PetLiveWeb.shell;
}

function makeBtn(id) {
  const listeners = {};
  return {
    id,
    _attrs: {},
    getAttribute(name) {
      return this._attrs[name] ?? null;
    },
    setAttribute(name, value) {
      this._attrs[name] = String(value);
    },
    addEventListener(type, fn) {
      listeners[type] = fn;
    },
    _fire(type, event) {
      listeners[type]?.(event);
    },
  };
}

function makePop(id) {
  const listeners = {};
  return {
    id,
    hidden: true,
    _attrs: {},
    getAttribute(name) {
      return this._attrs[name] ?? null;
    },
    setAttribute(name, value) {
      this._attrs[name] = String(value);
    },
    addEventListener(type, fn) {
      listeners[type] = fn;
    },
    _fire(type, event) {
      listeners[type]?.(event);
    },
  };
}

describe("shell feature-hub vax help", () => {
  it("setVaxHelpOpen toggles e-vax popover", () => {
    const shell = loadFeatureHub();
    const help = makeBtn("e-vax-help");
    const pop = makePop("e-vax-help-pop");
    const doc = {
      getElementById(id) {
        if (id === "e-vax-help") return help;
        if (id === "e-vax-help-pop") return pop;
        return null;
      },
    };
    shell.setVaxHelpOpen(doc, true);
    assert.equal(pop.hidden, false);
    assert.equal(help.getAttribute("aria-expanded"), "true");
    shell.setVaxHelpOpen(doc, false);
    assert.equal(pop.hidden, true);
    assert.equal(help.getAttribute("aria-expanded"), "false");
  });

  it("bindFeatureHubVaxHelp opens hub and closes emergency popover", () => {
    const shell = loadFeatureHub();
    const fhHelp = makeBtn("fh-vax-help");
    const fhPop = makePop("fh-vax-help-pop");
    const eHelp = makeBtn("e-vax-help");
    const ePop = makePop("e-vax-help-pop");
    ePop.hidden = false;
    eHelp.setAttribute("aria-expanded", "true");
    const doc = {
      getElementById(id) {
        if (id === "fh-vax-help") return fhHelp;
        if (id === "fh-vax-help-pop") return fhPop;
        if (id === "e-vax-help") return eHelp;
        if (id === "e-vax-help-pop") return ePop;
        return null;
      },
    };
    shell.bindFeatureHubVaxHelp(doc);
    fhHelp._fire("click", {
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(fhPop.hidden, false);
    assert.equal(fhHelp.getAttribute("aria-expanded"), "true");
    assert.equal(ePop.hidden, true);
    assert.equal(eHelp.getAttribute("aria-expanded"), "false");
  });

  it("closeAllVaxHelp closes emergency and feature-hub popovers", () => {
    const shell = loadFeatureHub();
    const eHelp = makeBtn("e-vax-help");
    const ePop = makePop("e-vax-help-pop");
    const fhHelp = makeBtn("fh-vax-help");
    const fhPop = makePop("fh-vax-help-pop");
    ePop.hidden = false;
    fhPop.hidden = false;
    eHelp.setAttribute("aria-expanded", "true");
    fhHelp.setAttribute("aria-expanded", "true");
    const doc = {
      getElementById(id) {
        if (id === "e-vax-help") return eHelp;
        if (id === "e-vax-help-pop") return ePop;
        if (id === "fh-vax-help") return fhHelp;
        if (id === "fh-vax-help-pop") return fhPop;
        return null;
      },
    };
    shell.closeAllVaxHelp(doc);
    assert.equal(ePop.hidden, true);
    assert.equal(fhPop.hidden, true);
    assert.equal(eHelp.getAttribute("aria-expanded"), "false");
    assert.equal(fhHelp.getAttribute("aria-expanded"), "false");
  });

  it("bindEmergencyVaxHelp outside click closes both", () => {
    const shell = loadFeatureHub();
    const eHelp = makeBtn("e-vax-help");
    const ePop = makePop("e-vax-help-pop");
    const fhHelp = makeBtn("fh-vax-help");
    const fhPop = makePop("fh-vax-help-pop");
    ePop.hidden = true;
    fhPop.hidden = true;
    const docListeners = {};
    const doc = {
      documentElement: {
        _attrs: {},
        getAttribute(name) {
          return this._attrs[name] ?? null;
        },
        setAttribute(name, value) {
          this._attrs[name] = String(value);
        },
      },
      getElementById(id) {
        if (id === "e-vax-help") return eHelp;
        if (id === "e-vax-help-pop") return ePop;
        if (id === "fh-vax-help") return fhHelp;
        if (id === "fh-vax-help-pop") return fhPop;
        return null;
      },
      addEventListener(type, fn) {
        docListeners[type] = fn;
      },
    };
    shell.bindEmergencyVaxHelp(doc);
    eHelp._fire("click", {
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(ePop.hidden, false);

    docListeners.click({
      target: {
        closest() {
          return null;
        },
      },
    });
    assert.equal(ePop.hidden, true);
    assert.equal(fhPop.hidden, true);
  });
});
