(function initPetLiveWebParasiteSelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.parasite = root.domains.parasite || {};

  function createSelectors({ parasite } = {}) {
    if (
      !parasite ||
      typeof parasite.getParasiteStatus !== "function" ||
      typeof parasite.getParasiteRecord !== "function" ||
      typeof parasite.ensureParasitePrevention !== "function"
    ) {
      throw new TypeError(
        "createSelectors requires parasite controller with getParasiteStatus/getParasiteRecord/ensureParasitePrevention"
      );
    }

    const kinds = parasite.KINDS || ["external", "heartworm"];

    /**
     * @returns {"protected"|"approaching"|"unprotected"|"optional"}
     * Cats: heartworm unset (no nextDue) → optional (non-alarming).
     */
    function getParasiteSlotStatus(pet, kind) {
      const record = parasite.getParasiteRecord(pet, kind);
      if (pet?.species === "cat" && kind === "heartworm" && !record?.nextDue) {
        return "optional";
      }
      return parasite.getParasiteStatus(record?.nextDue);
    }

    function stripFlags(pet) {
      parasite.ensureParasitePrevention(pet);
      const result = {};
      kinds.forEach((kind) => {
        const record = parasite.getParasiteRecord(pet, kind);
        result[kind] = {
          status: getParasiteSlotStatus(pet, kind),
          record,
        };
      });
      return result;
    }

    function hasApproaching(pet) {
      return kinds.some(
        (kind) => getParasiteSlotStatus(pet, kind) === "approaching"
      );
    }

    function hasUnprotected(pet) {
      return kinds.some(
        (kind) => getParasiteSlotStatus(pet, kind) === "unprotected"
      );
    }

    return {
      getParasiteSlotStatus,
      stripFlags,
      hasApproaching,
      hasUnprotected,
    };
  }

  root.domains.parasite.createSelectors = createSelectors;
})(typeof window !== "undefined" ? window : globalThis);
