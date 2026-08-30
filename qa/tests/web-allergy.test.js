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
  return context.PetLiveWeb.domains.allergy;
}

describe("allergy controller", () => {
  it("computes price per kg and lb", () => {
    const allergy = loadAllergy().createController();
    assert.equal(allergy.computePricePerKg(7.5, 1990), 265.33);
    assert.equal(allergy.computePricePerUnit(7.5, "kg", 1990)?.value, 265.33);
    assert.equal(allergy.computePricePerUnit(10, "lb", 300)?.unit, "lb");
    assert.equal(allergy.computePricePerUnit(0, 100)?.value ?? null, null);
  });

  it("searches catalog and custom brands with localized labels", () => {
    const allergy = loadAllergy();
    const controller = allergy.createController();
    const pet = { allergyFoodBrands: ["小農場"] };
    assert.deepEqual(controller.searchBrands("", pet), []);
    assert.deepEqual(controller.searchBrands("   ", pet), []);
    const hits = controller.searchBrands("皇家", pet, undefined, "zh");
    assert.ok(hits.some((row) => row.name === "Royal Canin"));
    assert.ok(hits.some((row) => row.label === "皇家 Royal Canin"));
    const enHits = controller.searchBrands("royal", pet, undefined, "en");
    assert.ok(enHits.some((row) => row.label === "Royal Canin"));
    const customHits = controller.searchBrands("農", pet);
    assert.ok(customHits.some((row) => row.name === "小農場"));
  });

  it("formats brand labels per locale", () => {
    const allergy = loadAllergy();
    const entry = allergy.FOOD_BRAND_CATALOG.find((row) => row.id === "royal-canin");
    assert.equal(allergy.formatBrandLabel(entry, "zh"), "皇家 Royal Canin");
    assert.equal(allergy.formatBrandLabel(entry, "en"), "Royal Canin");
    assert.equal(allergy.formatBrandLabel(entry, "ja"), "ロイヤルカナン Royal Canin");
    assert.equal(allergy.formatBrandLabel(entry, "ko"), "로얄캐닌 Royal Canin");
  });

  it("resolves legacy zh brand names to canonical english", () => {
    const allergy = loadAllergy();
    assert.equal(allergy.resolveBrandToCanonical("皇家"), "Royal Canin");
    assert.equal(allergy.resolveBrandDisplay("皇家", "en"), "Royal Canin");
    assert.equal(allergy.resolveBrandDisplay("皇家", "zh"), "皇家 Royal Canin");
  });

  it("adds purchase with meats, date, and unit", () => {
    const allergy = loadAllergy().createController();
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
    assert.equal(pet.allergyPurchases[0].brand, "Royal Canin");
    assert.equal(pet.allergyFoodBrands[0], "Royal Canin");

    const removed = allergy.removePurchase(pet, pet.allergyPurchases[0].id);
    assert.equal(removed.ok, true);
    assert.equal(allergy.getPurchases(pet).length, 0);
  });

  it("rejects invalid drafts", () => {
    const allergy = loadAllergy().createController();
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
