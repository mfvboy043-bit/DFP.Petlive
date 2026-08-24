(function initPetLiveWebPetsController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.pets = root.domains.pets || {};

  function createController({ state, beforeSelect, afterSelect }) {
    if (
      !state ||
      typeof state.setCurrentPetId !== "function" ||
      typeof state.getCurrentPet !== "function"
    ) {
      throw new TypeError("createController requires app state");
    }

    function performSelect(id, forced) {
      if (!state.hasPet(id)) return false;
      const previous = state.getCurrentPet();
      if (!forced && previous?.id === id) return false;
      if (typeof beforeSelect === "function") {
        beforeSelect(id, previous, { forced });
      }
      if (!state.setCurrentPetId(id)) return false;
      const current = state.getCurrentPet();
      if (typeof afterSelect === "function") {
        afterSelect(current, previous, { forced });
      }
      return true;
    }

    function select(id) {
      return performSelect(id, false);
    }

    function selectForced(id) {
      return performSelect(id, true);
    }

    function getCurrentPet() {
      return state.getCurrentPet();
    }

    return { select, selectForced, getCurrentPet };
  }

  root.domains.pets.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
