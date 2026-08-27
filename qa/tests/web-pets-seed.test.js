import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadPetsSeed() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("domains/pets/seed.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/pets/seed.js" }
  );
  return context.PetLiveWeb.domains.pets;
}

describe("pets seed building blocks", () => {
  it("cloneSeedPets deep-copies and keeps seed pets", () => {
    const pets = loadPetsSeed();
    assert.ok(Array.isArray(pets.SEED_PETS));
    assert.ok(pets.SEED_PETS.length >= 1);
    const clone = pets.cloneSeedPets();
    assert.notEqual(clone, pets.SEED_PETS);
    assert.equal(clone[0].id, pets.SEED_PETS[0].id);
    clone[0].name = "__mutated__";
    assert.notEqual(pets.SEED_PETS[0].name, "__mutated__");
  });
});
