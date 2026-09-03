import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadDrugSearch() {
  const context = vm.createContext({
    console,
    requestAnimationFrame: (fn) => fn(),
  });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("shell/drug-search.js", WEB_ROOT), "utf8"),
    context,
    { filename: "shell/drug-search.js" }
  );
  return context.PetLiveWeb.shell;
}

describe("shell drug-search", () => {
  it("applyDrugInfoCard hides when not visible", () => {
    const shell = loadDrugSearch();
    const card = {
      hidden: false,
      classList: { add() {} },
      removeAttribute() {},
      scrollIntoView() {},
    };
    const purposeEl = { textContent: "x" };
    const sideEffectsEl = { innerHTML: "y" };
    const precautionsEl = { innerHTML: "z" };
    shell.applyDrugInfoCard(
      { card, purposeEl, sideEffectsEl, precautionsEl },
      { visible: false }
    );
    assert.equal(card.hidden, true);
    assert.equal(purposeEl.textContent, "");
    assert.equal(sideEffectsEl.innerHTML, "");
  });

  it("applyDrugInfoCard paints lists and scrolls when visible", () => {
    const shell = loadDrugSearch();
    let scrolled = false;
    const card = {
      hidden: true,
      classList: {
        add(c) {
          this._c = c;
        },
      },
      removeAttribute(name) {
        this._removed = name;
      },
      scrollIntoView() {
        scrolled = true;
      },
    };
    const purposeEl = { textContent: "" };
    const sideEffectsEl = { innerHTML: "" };
    const precautionsEl = { innerHTML: "" };
    shell.applyDrugInfoCard(
      { card, purposeEl, sideEffectsEl, precautionsEl },
      {
        visible: true,
        purposeText: "用途",
        sideEffectsHtml: "<li>a</li>",
        precautionsHtml: "<li>b</li>",
      }
    );
    assert.equal(card.hidden, false);
    assert.equal(card._removed, "hidden");
    assert.equal(card.classList._c, "is-visible");
    assert.equal(purposeEl.textContent, "用途");
    assert.equal(sideEffectsEl.innerHTML, "<li>a</li>");
    assert.equal(precautionsEl.innerHTML, "<li>b</li>");
    assert.equal(scrolled, true);
  });

  it("bindDrugSearch selects enriched drug and forces manual mode", () => {
    const shell = loadDrugSearch();
    const listeners = {};
    const search = {
      value: "",
      addEventListener(type, fn) {
        listeners[`search:${type}`] = fn;
      },
    };
    const results = {
      hidden: false,
      innerHTML: "",
      addEventListener(type, fn) {
        listeners[`results:${type}`] = fn;
      },
    };
    const selectedEl = { hidden: true, textContent: "" };
    const card = {
      hidden: true,
      classList: { add() {} },
      removeAttribute() {},
      scrollIntoView() {},
    };
    const calls = { mode: [], selected: [] };
    let medMode = "photo";

    shell.bindDrugSearch(
      { search, results, selectedEl },
      {
        searchDrugs: (q) => [{ id: "d1", genericName: `G:${q}` }],
        resolveEnrichedDrug: (idOrDrug) =>
          typeof idOrDrug === "string"
            ? {
                id: idOrDrug,
                genericName: "Amox",
                brandNameZh: "愛莫西林",
              }
            : idOrDrug,
        buildResultsHtml: (list) => ({
          hidden: false,
          html: list
            .map((d) => `<button data-drug-id="${d.id}">${d.genericName}</button>`)
            .join(""),
        }),
        buildInfoListsHtml: (drug) =>
          drug
            ? {
                visible: true,
                purposeText: "p",
                sideEffectsHtml: "<li>s</li>",
                precautionsHtml: "<li>c</li>",
              }
            : { visible: false },
        getDrugById: null,
        t: (key, vars) => (key === "selectedDrug" ? `選:${vars.name}` : key),
        getMedEntryMode: () => medMode,
        setMedEntryMode: (mode) => {
          medMode = mode;
          calls.mode.push(mode);
        },
        onSelectDrug: (drug) => calls.selected.push(drug?.id || null),
        infoEls: {
          card,
          purposeEl: { textContent: "" },
          sideEffectsEl: { innerHTML: "" },
          precautionsEl: { innerHTML: "" },
        },
      }
    );

    listeners["search:input"]();
    assert.equal(calls.selected.at(-1), null);
    assert.match(results.innerHTML, /data-drug-id="d1"/);

    listeners["results:click"]({
      target: {
        closest(sel) {
          if (sel === "[data-drug-id]") return { dataset: { drugId: "d1" } };
          return null;
        },
      },
    });
    assert.equal(results.hidden, true);
    assert.equal(search.value, "Amox");
    assert.equal(selectedEl.hidden, false);
    assert.match(selectedEl.textContent, /Amox/);
    assert.deepEqual(calls.mode, ["manual"]);
    assert.equal(calls.selected.at(-1), "d1");
    assert.equal(card.hidden, false);
  });

  it("bindDrugSearch falls back to PetLive.drug.getDrugById", () => {
    const shell = loadDrugSearch();
    const listeners = {};
    const search = {
      value: "",
      addEventListener(type, fn) {
        listeners[`search:${type}`] = fn;
      },
    };
    const results = {
      hidden: false,
      innerHTML: "",
      addEventListener(type, fn) {
        listeners[`results:${type}`] = fn;
      },
    };
    const selected = [];
    shell.bindDrugSearch(
      { search, results, selectedEl: { hidden: true, textContent: "" } },
      {
        searchDrugs: () => [],
        resolveEnrichedDrug: () => null,
        buildResultsHtml: () => ({ hidden: true, html: "" }),
        buildInfoListsHtml: () => ({ visible: false }),
        getDrugById: (id) => ({
          ok: true,
          data: { id, genericName: "Fallback" },
        }),
        t: (_k, vars) => vars?.name || "",
        getMedEntryMode: () => "manual",
        setMedEntryMode: () => {},
        onSelectDrug: (d) => selected.push(d?.genericName),
        infoEls: {
          card: {
            hidden: true,
            classList: { add() {} },
            removeAttribute() {},
            scrollIntoView() {},
          },
          purposeEl: { textContent: "" },
          sideEffectsEl: { innerHTML: "" },
          precautionsEl: { innerHTML: "" },
        },
      }
    );
    listeners["results:click"]({
      target: {
        closest(sel) {
          if (sel === "[data-drug-id]") return { dataset: { drugId: "x" } };
          return null;
        },
      },
    });
    assert.deepEqual(selected, ["Fallback"]);
    assert.equal(search.value, "Fallback");
  });
});
