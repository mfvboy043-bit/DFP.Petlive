import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadBreedRenderer() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;

  vm.runInContext(
    readFileSync(new URL("domains/breed/render.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/breed/render.js" }
  );

  const breedSelectors = {
    collapsedChipValues: (species, selected) =>
      species === "dog" ? ["shiba", selected].filter(Boolean) : [],
    findByValue: (species, value) =>
      value ? { value, labelKey: value } : null,
    expandedGroups: (species) =>
      species === "cat"
        ? [{ id: "common", i18nKey: "breedGroupCommon", breeds: [{ value: "mix" }] }]
        : [],
  };

  return context.PetLiveWeb.domains.breed.createRenderer({
    label: (key) => key,
    breedOptionLabel: (breed) => breed.labelKey || breed.value,
    breedSelectors,
  });
}

describe("FO-05 breed render builders", () => {
  it("buildBreedResultsHtml empty query hides list", () => {
    const renderer = loadBreedRenderer();
    const built = renderer.buildBreedResultsHtml([], "");
    assert.equal(built.hidden, true);
    assert.equal(built.html, "");
  });

  it("buildBreedResultsHtml search miss and hit", () => {
    const renderer = loadBreedRenderer();
    const miss = renderer.buildBreedResultsHtml([], "x");
    assert.equal(miss.hidden, false);
    assert.match(miss.html, /breedSearchEmpty/);

    const hit = renderer.buildBreedResultsHtml([{ value: "shiba" }], "sh");
    assert.match(hit.html, /data-breed-suggest="shiba"/);
  });

  it("buildCollapsedChipsHtml and buildExpandedGroupsHtml", () => {
    const renderer = loadBreedRenderer();
    assert.match(renderer.buildCollapsedChipsHtml("dog", "shiba"), /data-breed="shiba"/);
    assert.match(renderer.buildExpandedGroupsHtml("cat"), /data-breed-group="common"/);
    assert.match(renderer.buildExpandedGroupsHtml("cat"), /data-breed="mix"/);
  });

  it("render.js has no document, innerHTML, localStorage, or literal t(", () => {
    const src = readFileSync(new URL("domains/breed/render.js", WEB_ROOT), "utf8");
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
    assert.equal(/\bt\s*\(/.test(src), false);
  });
});
