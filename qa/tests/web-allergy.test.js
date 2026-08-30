import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadAllergy() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  for (const path of [
    "domains/allergy/catalog.js",
    "domains/allergy/controller.js",
  ]) {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  }
  return context.PetLiveWeb.domains.allergy.createController();
}

describe("allergy controller", () => {
  it("computes price per kg and lb", () => {
    const allergy = loadAllergy();
    assert.equal(allergy.computePricePerKg(7.5, 1990), 265.33);
    assert.equal(allergy.computePricePerUnit(7.5, "kg", 1990)?.value, 265.33);
    assert.equal(allergy.computePricePerUnit(10, "lb", 300)?.unit, "lb");
    assert.equal(allergy.computePricePerUnit(0, 100)?.value ?? null, null);
  });

  it("searches catalog and custom brands", () => {
    const allergy = loadAllergy();
    const pet = { allergyFoodBrands: ["小農場"] };
    const hits = allergy.searchBrands("皇家", pet);
    assert.ok(hits.some((row) => row.name === "皇家"));
    const customHits = allergy.searchBrands("農", pet);
    assert.ok(customHits.some((row) => row.name === "小農場"));
  });

  it("adds purchase with meats, date, and unit", () => {
    const allergy = loadAllergy();
    const pet = { id: "p1", allergyPurchases: [], allergyFoodBrands: [] };
    const added = allergy.addPurchase(pet, {
      brand: "皇家",
      recordDate: "2026-08-29",
      meats: ["chicken", "beef"],
      customMeat: "火雞",
      weight: 7.5,
      weightUnit: "kg",
      price: 1990,
    });
    assert.equal(added.ok, true);
    assert.equal(pet.allergyPurchases.length, 1);
    assert.deepEqual(pet.allergyPurchases[0].meats, ["chicken", "beef", "火雞"]);
    assert.equal(pet.allergyFoodBrands[0], "皇家");

    const removed = allergy.removePurchase(pet, pet.allergyPurchases[0].id);
    assert.equal(removed.ok, true);
    assert.equal(allergy.getPurchases(pet).length, 0);
  });

  it("rejects invalid drafts", () => {
    const allergy = loadAllergy();
    const pet = { id: "p1" };
    assert.equal(
      allergy.addPurchase(pet, {
        brand: "Hill's",
        recordDate: "",
        weight: 1,
        price: 10,
      }).reason,
      "needDate"
    );
    assert.equal(
      allergy.addPurchase(pet, {
        brand: "",
        recordDate: "2026-08-29",
        weight: 1,
        price: 10,
      }).reason,
      "needBrand"
    );
  });
});
