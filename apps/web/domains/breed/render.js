(function initPetLiveWebBreedRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.breed = root.domains.breed || {};

  function createRenderer(deps = {}) {
    const { label, breedOptionLabel, breedSelectors } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (typeof breedOptionLabel !== "function") {
      throw new TypeError("createRenderer requires breedOptionLabel(breed)");
    }
    if (!breedSelectors) {
      throw new TypeError("createRenderer requires breedSelectors");
    }

    function buildBreedChipHtml(breed) {
      return `
      <button
        type="button"
        class="chip"
        role="option"
        data-breed="${breed.value}"
        aria-selected="false"
      >${breedOptionLabel(breed)}</button>`;
    }

    function buildBreedResultsHtml(list, query) {
      const q = String(query || "").trim();
      if (!q) return { hidden: true, html: "" };

      if (!list.length) {
        return {
          hidden: false,
          html: `
      <li>
        <p class="breed-results-empty">${label("breedSearchEmpty")}</p>
      </li>`,
        };
      }

      return {
        hidden: false,
        html: list
          .map(
            (breed) => `
      <li>
        <button type="button" data-breed-suggest="${breed.value}">
          <strong>${breedOptionLabel(breed)}</strong>
        </button>
      </li>`
          )
          .join(""),
      };
    }

    function buildCollapsedChipsHtml(species, selectedValue) {
      return breedSelectors
        .collapsedChipValues(species, selectedValue)
        .map((value) => breedSelectors.findByValue(species, value))
        .filter(Boolean)
        .map(buildBreedChipHtml)
        .join("");
    }

    function buildExpandedGroupsHtml(species) {
      return breedSelectors
        .expandedGroups(species)
        .map((group) => {
          const groupLabel = label(group.i18nKey);
          const chips = group.breeds.map(buildBreedChipHtml).join("");
          return `
      <div class="breed-group" data-breed-group="${group.id}">
        <div class="breed-group-label">${groupLabel}</div>
        <div class="breed-group-chips">${chips}</div>
      </div>`;
        })
        .join("");
    }

    return {
      buildBreedChipHtml,
      buildBreedResultsHtml,
      buildCollapsedChipsHtml,
      buildExpandedGroupsHtml,
    };
  }

  root.domains.breed.createRenderer = createRenderer;
})(typeof window !== "undefined" ? window : globalThis);
