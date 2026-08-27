(function initPetLiveWebBreedController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.breed = root.domains.breed || {};

  function createController({ initiallyExpanded = false } = {}) {
    let expanded = !!initiallyExpanded;

    return {
      isExpanded() {
        return expanded;
      },
      setExpanded(value) {
        expanded = !!value;
      },
      toggle() {
        expanded = !expanded;
        return expanded;
      },
      reset() {
        expanded = false;
      },
    };
  }

  root.domains.breed.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
