import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadClinicsCatalog() {
  const context = vm.createContext({ console, localStorage: { getItem: () => null, setItem: () => {} } });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("domains/clinics/catalog.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/clinics/catalog.js" }
  );
  return context.PetLiveWeb.domains.clinics;
}

describe("clinics catalog building blocks", () => {
  it("pins anonymous first and uses saved clinics instead of presets", () => {
    const clinics = loadClinicsCatalog();
    const saved = [{ id: "saved-1", name: "自訂診所" }];
    const catalog = clinics.createCatalog({
      label: (key) => key,
      locField: (value) => value || "",
      getSavedClinics: () => saved,
    });
    const dir = catalog.getClinicDirectory([], saved);
    assert.equal(dir[0].id, "anonymous");
    assert.equal(dir[1].id, "saved-1");
    assert.equal(dir[1].name, "自訂診所");
    assert.equal(catalog.visitClinicLabel({ clinicId: "saved-1" }), "自訂診所");
    assert.equal(catalog.visitClinicLabel({ clinicId: "c1", clinic: "舊紀錄" }), "舊紀錄");
  });

  it("searchClinics offers add suggestion for unknown names", () => {
    const clinics = loadClinicsCatalog();
    const catalog = clinics.createCatalog({
      label: (key, vars) => (vars?.name ? `${key}:${vars.name}` : key),
      locField: (value) => value || "",
      getSavedClinics: () => [],
    });
    const hit = catalog.searchClinics("新醫院", [], []);
    assert.equal(hit[0].id, "anonymous");
    assert.ok(hit.some((c) => c.id === "__add__" && c.name === "新醫院"));
    const empty = catalog.searchClinics("", [], []);
    assert.equal(empty.length, 1);
    assert.equal(empty[0].id, "anonymous");
  });
});
