import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadBreedDomain() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  context.currentLang = "zh";
  context.getCurrentLang = () => "zh";
  vm.runInContext(
    readFileSync(new URL("breeds-database.js", WEB_ROOT), "utf8"),
    context,
    { filename: "breeds-database.js" }
  );
  [
    "domains/breed/selectors.js",
    "domains/breed/controller.js",
  ].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });
  const api = context.PetLiveWeb.domains.breed;
  const customValue = vm.runInContext("BREED_CUSTOM_VALUE", context);
  const selectors = api.createSelectors({
    CUSTOM_VALUE: customValue,
    getListForSpecies: context.getBreedListForSpecies,
    getGroupsForSpecies: context.getBreedGroupsForSpecies,
    getCommonGroupId: context.getCommonBreedGroupId,
    findByValue: context.findBreedByValue,
    search: context.searchBreeds,
    labelOf: context.breedOptionLabel,
  });
  const controller = api.createController();
  return { selectors, controller, context, customValue };
}

describe("BR-01 / BR-02 breed controller", () => {
  it("search excludes custom and empty query", () => {
    const { selectors } = loadBreedDomain();
    assert.equal(selectors.search("", "dog").length, 0);
    assert.equal(selectors.search("", "cat").length, 0);
    assert.deepEqual(
      JSON.parse(JSON.stringify(selectors.search("柴", "dog").map((b) => b.value))),
      ["shiba"]
    );
    assert.ok(
      selectors.search("米", "dog").every((b) => b.value !== selectors.CUSTOM_VALUE)
    );
    assert.equal(selectors.search("x", "other").length, 0);
  });

  it("collapsedChipValues pins non-common selection and dedupes custom", () => {
    const { selectors } = loadBreedDomain();
    const commonOnly = selectors.collapsedChipValues("dog", "");
    assert.ok(commonOnly.includes("mixed"));
    assert.ok(commonOnly.includes(selectors.CUSTOM_VALUE));
    assert.equal(new Set(commonOnly).size, commonOnly.length);

    const pinned = selectors.collapsedChipValues("dog", "golden");
    assert.ok(pinned.includes("golden"));
    assert.ok(pinned.includes(selectors.CUSTOM_VALUE));
  });

  it("expandedGroups resolves members via catalog", () => {
    const { selectors } = loadBreedDomain();
    const groups = selectors.expandedGroups("cat");
    assert.ok(groups.length > 0);
    assert.ok(groups.every((g) => g.breeds.length > 0));
    assert.ok(groups.some((g) => g.id === "common-home"));
  });

  it("resolveKey and resolveDisplayName parity", () => {
    const { selectors } = loadBreedDomain();
    assert.equal(
      selectors.resolveKey({ species: "other", breedSelectValue: "mixed" }),
      selectors.CUSTOM_VALUE
    );
    assert.equal(
      selectors.resolveKey({ species: "dog", breedSelectValue: "" }),
      selectors.CUSTOM_VALUE
    );
    assert.equal(
      selectors.resolveDisplayName({
        species: "dog",
        breedSelectValue: "shiba",
        customText: "",
      }),
      "柴犬"
    );
    assert.equal(
      selectors.resolveDisplayName({
        species: "dog",
        breedSelectValue: selectors.CUSTOM_VALUE,
        customText: " 自訂品種 ",
      }),
      "自訂品種"
    );
  });

  it("resolveSearchFaceValue leaves custom/empty typed; sets known breed (Wave 1 C)", () => {
    const { selectors, context, customValue } = loadBreedDomain();
    const known = selectors.resolveSearchFaceValue("shiba", "dog");
    assert.equal(known.setValue, true);
    assert.equal(known.display, "柴犬");
    const missing = selectors.resolveSearchFaceValue("not-a-breed", "dog");
    assert.equal(missing.setValue, true);
    assert.equal(missing.display, "");
    const empty = selectors.resolveSearchFaceValue("", "dog");
    assert.equal(empty.setValue, false);
    assert.equal(empty.leaveTyped, true);
    const custom = selectors.resolveSearchFaceValue(selectors.CUSTOM_VALUE, "dog");
    assert.equal(custom.setValue, false);
    assert.equal(custom.leaveTyped, true);
    const standalone = context.PetLiveWeb.domains.breed.resolveBreedSearchFaceValue(
      "shiba",
      {
        species: "dog",
        findBreed: context.findBreedByValue,
        breedOptionLabel: context.breedOptionLabel,
        customSentinel: customValue,
      }
    );
    assert.equal(standalone.setValue, true);
    assert.equal(standalone.display, "柴犬");
  });

  it("controller expand defaults false and resets", () => {
    const { controller } = loadBreedDomain();
    assert.equal(controller.isExpanded(), false);
    assert.equal(controller.toggle(), true);
    assert.equal(controller.isExpanded(), true);
    controller.reset();
    assert.equal(controller.isExpanded(), false);
  });

  it("breed domain files avoid DOM and storage", () => {
    for (const file of ["domains/breed/selectors.js", "domains/breed/controller.js"]) {
      const src = readFileSync(new URL(file, WEB_ROOT), "utf8");
      assert.doesNotMatch(src, /\bdocument\b/);
      assert.doesNotMatch(src, /\blocalStorage\b/);
    }
  });
});
