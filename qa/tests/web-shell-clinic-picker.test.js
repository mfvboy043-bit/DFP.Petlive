import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadClinicPicker() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("shell/clinic-picker.js", WEB_ROOT), "utf8"),
    context,
    { filename: "shell/clinic-picker.js" }
  );
  return context.PetLiveWeb.shell;
}

describe("shell clinic-picker", () => {
  it("applyClinicResults writes hidden + html", () => {
    const shell = loadClinicPicker();
    const el = { hidden: true, innerHTML: "" };
    shell.applyClinicResults(el, { hidden: false, html: "<li>ok</li>" });
    assert.equal(el.hidden, false);
    assert.equal(el.innerHTML, "<li>ok</li>");
  });

  it("applySelectedClinic paints anonymous and named clinics", () => {
    const shell = loadClinicPicker();
    const els = {
      search: { value: "" },
      nameInput: { value: "" },
      anonymousInput: { value: "" },
      selectedEl: {
        hidden: true,
        textContent: "",
        classList: {
          _on: new Set(),
          remove(c) {
            this._on.delete(c);
          },
          toggle(c, on) {
            if (on) this._on.add(c);
            else this._on.delete(c);
          },
        },
      },
      results: { hidden: false },
    };
    shell.applySelectedClinic(
      { id: "a", name: "Anon", anonymous: true },
      els,
      {
        clinicNameOf: (c) => c.name,
        t: (key) => (key === "selectedClinicAnon" ? "匿名診所" : key),
      }
    );
    assert.equal(els.search.value, "Anon");
    assert.equal(els.anonymousInput.value, "true");
    assert.equal(els.selectedEl.hidden, false);
    assert.equal(els.selectedEl.textContent, "匿名診所");
    assert.equal(els.results.hidden, true);
    assert.ok(els.selectedEl.classList._on.has("is-anonymous"));
  });

  it("bindClinicPicker select + delete + add routes", () => {
    const shell = loadClinicPicker();
    const listeners = {};
    const search = {
      value: "華",
      addEventListener(type, fn) {
        listeners[`search:${type}`] = fn;
      },
    };
    const results = {
      hidden: true,
      innerHTML: "",
      addEventListener(type, fn) {
        listeners[`results:${type}`] = fn;
      },
    };
    const calls = { remove: [], select: [], free: [], clear: 0, toast: [] };
    shell.bindClinicPicker(
      { search, results },
      {
        searchClinics: (q) => [{ id: "c1", name: `hit:${q}` }],
        buildResultsHtml: (list) => ({
          hidden: false,
          html: list.map((c) => `<button data-clinic-id="${c.id}">${c.name}</button>`).join(""),
        }),
        getClinicDirectory: () => [{ id: "c1", name: "華寵" }],
        removeSavedClinic: (id) => calls.remove.push(id),
        applyFreeTextClinic: (name) => calls.free.push(name),
        onSelectClinic: (c) => calls.select.push(c.id),
        showToast: (msg) => calls.toast.push(msg),
        t: (key) => key,
        clearSelectionChrome: () => {
          calls.clear += 1;
        },
      }
    );

    listeners["search:focus"]();
    assert.match(results.innerHTML, /data-clinic-id="c1"/);

    listeners["search:input"]();
    assert.equal(calls.clear, 1);

    listeners["results:click"]({
      target: {
        closest(sel) {
          if (sel === "[data-clinic-delete]") {
            return { dataset: { clinicDelete: "saved-1" } };
          }
          return null;
        },
      },
      preventDefault() {},
      stopPropagation() {},
    });
    assert.deepEqual(calls.remove, ["saved-1"]);
    assert.deepEqual(calls.toast, ["toastClinicRemoved"]);

    listeners["results:click"]({
      target: {
        closest(sel) {
          if (sel === "[data-clinic-delete]") return null;
          if (sel === "[data-clinic-id]") {
            return {
              dataset: { clinicId: "__add__", clinicAddName: "新診所" },
            };
          }
          return null;
        },
      },
    });
    assert.deepEqual(calls.free, ["新診所"]);

    listeners["results:click"]({
      target: {
        closest(sel) {
          if (sel === "[data-clinic-delete]") return null;
          if (sel === "[data-clinic-id]") {
            return { dataset: { clinicId: "c1" } };
          }
          return null;
        },
      },
    });
    assert.deepEqual(calls.select, ["c1"]);
  });

  it("source has no localStorage", () => {
    const src = readFileSync(
      new URL("shell/clinic-picker.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\blocalStorage\b/.test(src), false);
  });
});
