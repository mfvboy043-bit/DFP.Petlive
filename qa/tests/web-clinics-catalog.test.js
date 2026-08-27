import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadClinicsCatalog() {
  const context = vm.createContext({ console });
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
  it("pins anonymous first and resolves preset clinic labels", () => {
    const clinics = loadClinicsCatalog();
    const catalog = clinics.createCatalog({
      label: (key) => key,
      locField: (value) => value || "",
    });
    const dir = catalog.getClinicDirectory([
      {
        visits: [
          { clinicId: "c1" },
          { clinic: "自訂診所" },
          { clinicId: "c1" },
        ],
      },
    ]);
    assert.equal(dir[0].id, "anonymous");
    assert.equal(dir[0].name, "anonymousClinic");
    assert.equal(catalog.visitClinicLabel({ clinicId: "c1" }), "幸福動物醫院");
    assert.ok(dir.some((c) => c.name === "自訂診所"));
  });
});
