(function initPetLiveWebShellBreedForm(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Breed field sync orchestration: species gate → chip expand/collapse HTML
   * → select sync. Does not own resolveBreedSearchFaceValue (Wave 1).
   */
  function syncBreedFields(hooks = {}) {
    const {
      speciesEl,
      breedSelect,
      breedSearch,
      breedChips,
      keepSelection = true,
      resetExpanded = false,
      resetExpandState,
      getBreedListForSpecies,
      getBreedGroupsForSpecies,
      isExpanded,
      isValidSelection,
      customValue,
      renderExpandedBreedChips,
      renderCollapsedBreedChips,
      buildBreedChipHtml,
      setSelectedBreed,
      hideBreedResults,
      updateBreedExpandToggle,
      toggleBreedCustomField,
      missingCatalogHtml = "<p class='field-hint'>品種清單載入失敗，請重新整理頁面</p>",
    } = hooks;

    if (!speciesEl || !breedSelect || !breedSearch || !breedChips) return false;

    if (typeof getBreedListForSpecies !== "function") {
      breedChips.innerHTML = missingCatalogHtml;
      return false;
    }

    if (resetExpanded && typeof resetExpandState === "function") {
      resetExpandState();
    }

    const species = speciesEl.value;
    const list = getBreedListForSpecies(species);
    const previous = keepSelection ? breedSelect.value : "";

    if (species === "other") {
      breedChips.innerHTML = "";
      breedChips.classList.remove("is-expanded", "is-collapsed");
      breedSelect.value = customValue;
      if (typeof hideBreedResults === "function") hideBreedResults();
      if (typeof updateBreedExpandToggle === "function") {
        updateBreedExpandToggle();
      }
      if (typeof toggleBreedCustomField === "function") {
        toggleBreedCustomField();
      }
      return true;
    }

    const stillValid =
      typeof isValidSelection === "function"
        ? isValidSelection(species, previous)
        : Boolean(previous);
    const selectedValue = stillValid ? previous : "";

    const hasGroups = typeof getBreedGroupsForSpecies === "function";
    const expanded = typeof isExpanded === "function" && isExpanded();

    if (expanded && hasGroups) {
      breedChips.innerHTML =
        typeof renderExpandedBreedChips === "function"
          ? renderExpandedBreedChips(species)
          : "";
      breedChips.classList.add("is-expanded");
      breedChips.classList.remove("is-collapsed");
    } else if (hasGroups) {
      breedChips.innerHTML =
        typeof renderCollapsedBreedChips === "function"
          ? renderCollapsedBreedChips(species, selectedValue)
          : "";
      breedChips.classList.add("is-collapsed");
      breedChips.classList.remove("is-expanded");
    } else {
      breedChips.innerHTML = Array.isArray(list)
        ? list
            .map((breed) =>
              typeof buildBreedChipHtml === "function"
                ? buildBreedChipHtml(breed)
                : ""
            )
            .join("")
        : "";
      breedChips.classList.remove("is-expanded", "is-collapsed");
    }

    if (typeof setSelectedBreed === "function") {
      setSelectedBreed(selectedValue);
    }
    if (typeof updateBreedExpandToggle === "function") {
      updateBreedExpandToggle();
    }
    return true;
  }

  root.shell.syncBreedFields = syncBreedFields;
})(typeof window !== "undefined" ? window : globalThis);
