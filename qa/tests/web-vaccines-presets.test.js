import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadVaccinesPresets() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("domains/vaccines/presets.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/vaccines/presets.js" }
  );
  return context.PetLiveWeb.domains.vaccines;
}

describe("vaccines presets building blocks", () => {
  it("returns dog/cat/other groups; cat has no rabies keys", () => {
    const vaccines = loadVaccinesPresets();
    const dog = vaccines.getPresetGroups("dog");
    const cat = vaccines.getPresetGroups("cat");
    const other = vaccines.getPresetGroups("bird");
    assert.ok(dog.some((g) => g.keys.includes("vRabies")));
    assert.ok(!cat.some((g) => g.keys.includes("vRabies")));
    assert.deepEqual(other, vaccines.VACCINE_PRESETS.other);
  });
});
