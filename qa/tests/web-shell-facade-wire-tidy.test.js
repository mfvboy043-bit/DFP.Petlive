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
    vm.runInContext(
      readFileSync(new URL(file, WEB_ROOT), "utf8"),
      context,
      { filename: file }
    );
  }
  return context.PetLiveWeb.shell;
}

function makeEl(attrs = {}) {
  const listeners = {};
  return {
    hidden: attrs.hidden ?? true,
    dataset: attrs.dataset || {},
    textContent: "",
    value: attrs.value || "",
    innerHTML: "",
    getAttribute: (name) => attrs[name] || null,
    setAttribute(name, value) {
      attrs[name] = String(value);
    },
    querySelector() {
      return null;
    },
    closest(sel) {
      if (attrs.matches && attrs.matches(sel)) return this;
      return null;
    },
    addEventListener(type, fn) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    _emit(type, event) {
      (listeners[type] || []).forEach((fn) => fn(event));
    },
  };
}

function assertCalls(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

describe("shell facade-wire-tidy", () => {
  it("confirmArchivePet gates missing passedAwayDate", () => {
    const shell = loadShell(["shell/archive-pet.js"]);
    const toasts = [];
    const ok = shell.confirmArchivePet({
      getPendingArchivePet: () => ({ id: "p1", name: "Mochi" }),
      passedAwayDate: "",
      memorialNote: "",
      showToast: (m) => toasts.push(m),
      t: (k) => k,
      archivePet: () => ({ ok: true }),
    });
    assert.equal(ok, false);
    assertCalls(toasts, ["toastNeedPassedDate"]);
  });

  it("confirmArchivePet success path toasts and goes archive replace", () => {
    const shell = loadShell(["shell/archive-pet.js"]);
    const calls = [];
    const ok = shell.confirmArchivePet({
      getPendingArchivePet: () => ({ id: "p1", name: "Mochi" }),
      passedAwayDate: "2024-01-01",
      memorialNote: "note",
      currentPetId: "p1",
      archivePet: (id, payload) => {
        calls.push(["archive", id, payload.passedAwayDate]);
        return {
          ok: true,
          archived: { name: "Mochi" },
          nextCurrentPetId: null,
        };
      },
      onArchived: () => calls.push(["cleared"]),
      setManageMode: (v) => calls.push(["manage", v]),
      setCurrentPetId: (id) => calls.push(["current", id]),
      applySelectedPet: () => calls.push(["refresh"]),
      renderArchiveList: () => calls.push(["archiveList"]),
      showToast: (m) => calls.push(["toast", m]),
      t: (k, vars) => (vars ? `${k}:${vars.name}` : k),
      clearNavigationHistory: () => calls.push(["clearNav"]),
      go: (screen, opts) => calls.push(["go", screen, opts]),
    });
    assert.equal(ok, true);
    assertCalls(calls, [
      ["archive", "p1", "2024-01-01"],
      ["cleared"],
      ["manage", false],
      ["current", null],
      ["refresh"],
      ["archiveList"],
      ["toast", "toastArchived:Mochi"],
      ["clearNav"],
      ["go", "archive", { replace: true }],
    ]);
  });

  it("openImagingProofScreen copies pending photos and goes", () => {
    const shell = loadShell(["shell/imaging-proof.js"]);
    const calls = [];
    const nameEl = { textContent: "" };
    const metaEl = { textContent: "" };
    const subEl = { textContent: "" };
    const kickerEl = {
      attrs: {},
      setAttribute(k, v) {
        this.attrs[k] = v;
      },
      textContent: "",
    };
    const ok = shell.openImagingProofScreen({
      visitIndex: 0,
      getCurrentPet: () => ({
        visits: [{ date: "2024-02-02", clinicId: "c1" }],
      }),
      getVisitImaging: () => ({
        xrayPhotos: ["x1"],
        usPhotos: ["u1"],
      }),
      visitClinicLabel: () => "Clinic A",
      setPendingImagingVisitIndex: (i) => calls.push(["idx", i]),
      setPendingXrayPhotos: (p) => calls.push(["xray", p.slice()]),
      setPendingUsPhotos: (p) => calls.push(["us", p.slice()]),
      nameEl,
      metaEl,
      subEl,
      kickerEl,
      xrayInput: { value: "old" },
      usInput: { value: "old" },
      renderImagingSlotPreviews: (slot) => calls.push(["preview", slot]),
      go: (s) => calls.push(["go", s]),
      t: (k) => k,
    });
    assert.equal(ok, true);
    assert.equal(nameEl.textContent, "Clinic A");
    assert.equal(metaEl.textContent, "2024-02-02");
    assert.equal(subEl.textContent, "timelineVisitImagingProofSub");
    assert.equal(kickerEl.attrs["data-i18n"], "timelineVisitImagingTarget");
    assertCalls(calls, [
      ["idx", 0],
      ["xray", ["x1"]],
      ["us", ["u1"]],
      ["preview", "xray"],
      ["preview", "us"],
      ["go", "imaging-proof"],
    ]);
  });

  it("bindTimelineList routes labs go and weight submit", () => {
    const shell = loadShell(["shell/timeline-list-wire.js"]);
    const calls = [];
    const listEl = makeEl();
    shell.bindTimelineList(listEl, {
      go: (s) => calls.push(["go", s]),
      saveVisitWeightAtIndex: (i) => calls.push(["weight", i]),
    });

    const labsBtn = makeEl({
      matches: (sel) => sel === "[data-open-labs]",
    });
    listEl._emit("click", {
      target: {
        closest(sel) {
          return sel === "[data-open-labs]" ? labsBtn : null;
        },
      },
    });
    assertCalls(calls, [["go", "labs"]]);

    calls.length = 0;
    const form = makeEl({
      dataset: { visitWeightForm: "2" },
      matches: (sel) => sel === "[data-visit-weight-form]",
    });
    const submitEvent = {
      target: {
        closest(sel) {
          return sel === "[data-visit-weight-form]" ? form : null;
        },
      },
      preventDefault() {
        calls.push(["prevent"]);
      },
    };
    listEl._emit("submit", submitEvent);
    assertCalls(calls, [["prevent"], ["weight", 2]]);
  });

  it("initLangMenu picks lang and toasts", () => {
    const shell = loadShell(["shell/lang-menu.js"]);
    const calls = [];
    const langFab = makeEl({ hidden: false });
    const langMenu = makeEl({ hidden: true });
    const doc = {
      addEventListener() {},
    };
    shell.initLangMenu(
      { langFab, langMenu, doc },
      {
        onPickLang: (lang) => calls.push(["lang", lang]),
        onToast: () => calls.push(["toast"]),
      }
    );
    langFab._emit("click", { stopPropagation() {} });
    assert.equal(langMenu.hidden, false);
    assert.equal(langFab.getAttribute("aria-expanded"), "true");

    const btn = makeEl({
      dataset: { lang: "en" },
      matches: (sel) => sel === "[data-lang]",
    });
    langMenu._emit("click", {
      target: {
        closest(sel) {
          return sel === "[data-lang]" ? btn : null;
        },
      },
    });
    assertCalls(calls, [["lang", "en"], ["toast"]]);
    assert.equal(langMenu.hidden, true);
  });

  it("setVaxHelpOpen toggles aria and hidden", () => {
    const shell = loadShell(["shell/vax-help.js"]);
    const helpBtn = makeEl();
    const pop = makeEl({ hidden: true });
    shell.setVaxHelpOpen({ helpBtn, pop }, true);
    assert.equal(pop.hidden, false);
    assert.equal(helpBtn.getAttribute("aria-expanded"), "true");
    shell.setVaxHelpOpen({ helpBtn, pop }, false);
    assert.equal(pop.hidden, true);
    assert.equal(helpBtn.getAttribute("aria-expanded"), "false");
  });

  it("renderDrugResults applies hidden + html", () => {
    const shell = loadShell(["shell/drug-search.js"]);
    const drugResults = makeEl({ hidden: true });
    shell.renderDrugResults(
      { drugResults },
      [{ id: "d1" }],
      {
        buildDrugResultsHtml: () => ({
          hidden: false,
          html: "<button data-drug-id='d1'>x</button>",
        }),
      }
    );
    assert.equal(drugResults.hidden, false);
    assert.match(drugResults.innerHTML, /data-drug-id/);
  });
});
