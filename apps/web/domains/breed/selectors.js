(function initPetLiveWebBreedSelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.breed = root.domains.breed || {};

  function createSelectors({
    CUSTOM_VALUE,
    getListForSpecies,
    getGroupsForSpecies,
    getCommonGroupId,
    findByValue,
    search,
    labelOf,
  } = {}) {
    if (!CUSTOM_VALUE) {
      throw new TypeError("createSelectors requires CUSTOM_VALUE");
    }
    if (typeof getListForSpecies !== "function") {
      throw new TypeError("createSelectors requires getListForSpecies");
    }
    if (typeof getGroupsForSpecies !== "function") {
      throw new TypeError("createSelectors requires getGroupsForSpecies");
    }
    if (typeof getCommonGroupId !== "function") {
      throw new TypeError("createSelectors requires getCommonGroupId");
    }
    if (typeof findByValue !== "function") {
      throw new TypeError("createSelectors requires findByValue");
    }
    if (typeof search !== "function") {
      throw new TypeError("createSelectors requires search");
    }
    const label =
      typeof labelOf === "function" ? labelOf : (breed) => String(breed?.value || "");

    function listForSpecies(species) {
      return getListForSpecies(species);
    }

    function groupsForSpecies(species) {
      return getGroupsForSpecies(species);
    }

    function collapsedChipValues(species, selectedValue) {
      const groups = getGroupsForSpecies(species);
      const commonId = getCommonGroupId(species);
      const commonGroup = groups.find((g) => g.id === commonId);
      const seen = new Set();
      const values = [];

      const pushValue = (value) => {
        if (!value || seen.has(value)) return;
        const breed = findByValue(species, value);
        if (!breed) return;
        seen.add(value);
        values.push(value);
      };

      if (commonGroup) {
        commonGroup.members.forEach(pushValue);
      }
      if (
        selectedValue &&
        selectedValue !== CUSTOM_VALUE &&
        !(commonGroup && commonGroup.members.includes(selectedValue))
      ) {
        pushValue(selectedValue);
      }
      pushValue(CUSTOM_VALUE);

      return values;
    }

    function expandedGroups(species) {
      return getGroupsForSpecies(species).map((group) => ({
        id: group.id,
        i18nKey: group.i18nKey,
        breeds: group.members
          .map((value) => findByValue(species, value))
          .filter(Boolean),
      }));
    }

    function isValidSelection(species, value) {
      if (!value) return false;
      return getListForSpecies(species).some((breed) => breed.value === value);
    }

    function resolveKey({ species, breedSelectValue }) {
      if (species === "other") return CUSTOM_VALUE;
      return breedSelectValue || CUSTOM_VALUE;
    }

    function resolveDisplayName({ species, breedSelectValue, customText }) {
      if (species === "other" || breedSelectValue === CUSTOM_VALUE) {
        return String(customText || "").trim();
      }
      const found = findByValue(species, breedSelectValue);
      return found ? label(found) : "";
    }

    /**
     * Pure breed search-face value: known breed → display label;
     * custom / empty → leaveTyped (facade keeps typed text).
     */
    function resolveSearchFaceValue(value, species) {
      if (value && value !== CUSTOM_VALUE) {
        const breed = findByValue(species, value);
        return { setValue: true, display: breed ? label(breed) : "" };
      }
      return { setValue: false, leaveTyped: true };
    }

    return {
      CUSTOM_VALUE,
      search,
      listForSpecies,
      groupsForSpecies,
      findByValue,
      collapsedChipValues,
      expandedGroups,
      isValidSelection,
      resolveKey,
      resolveDisplayName,
      resolveSearchFaceValue,
    };
  }

  /**
   * Standalone pure helper (same semantics as selectors.resolveSearchFaceValue).
   * @returns {{ setValue: true, display: string } | { setValue: false, leaveTyped: true }}
   */
  function resolveBreedSearchFaceValue(
    value,
    { species, findBreed, breedOptionLabel, customSentinel } = {}
  ) {
    if (typeof findBreed !== "function") {
      throw new TypeError("resolveBreedSearchFaceValue requires findBreed");
    }
    if (typeof breedOptionLabel !== "function") {
      throw new TypeError("resolveBreedSearchFaceValue requires breedOptionLabel");
    }
    if (!customSentinel) {
      throw new TypeError("resolveBreedSearchFaceValue requires customSentinel");
    }
    if (value && value !== customSentinel) {
      const breed = findBreed(species, value);
      return { setValue: true, display: breed ? breedOptionLabel(breed) : "" };
    }
    return { setValue: false, leaveTyped: true };
  }

  root.domains.breed.createSelectors = createSelectors;
  root.domains.breed.resolveBreedSearchFaceValue = resolveBreedSearchFaceValue;
})(typeof window !== "undefined" ? window : globalThis);
