(function initPetLiveWebOwnerController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.owner = root.domains.owner || {};

  function createController({
    selectors,
    ownerProfileSlot,
    isDemoMode,
    onAfterSave,
  } = {}) {
    if (!selectors || typeof selectors.emptyProfile !== "function") {
      throw new TypeError(
        "createController requires selectors from createSelectors"
      );
    }
    if (!ownerProfileSlot || typeof ownerProfileSlot.read !== "function") {
      throw new TypeError(
        "createController requires ownerProfileSlot with read/write"
      );
    }

    function demo() {
      return typeof isDemoMode === "function" ? Boolean(isDemoMode()) : false;
    }

    function load() {
      if (demo()) {
        return selectors.normalize({
          ...selectors.emptyProfile(),
          ...selectors.demoProfile(),
        });
      }
      return selectors.normalize({
        ...selectors.emptyProfile(),
        ...ownerProfileSlot.read(),
      });
    }

    function save(profile) {
      if (demo()) return false;
      const normalized = selectors.normalize(profile);
      const ok = ownerProfileSlot.write(normalized);
      if (ok && typeof onAfterSave === "function") {
        onAfterSave(normalized);
      }
      return ok;
    }

    function hasAny(profile) {
      return selectors.hasAny(profile != null ? profile : load());
    }

    return {
      load,
      save,
      hasAny,
    };
  }

  root.domains.owner.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
