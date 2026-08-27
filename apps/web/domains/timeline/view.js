(function initPetLiveWebTimelineView(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.timeline = root.domains.timeline || {};

  function createViewHelpers({ findDrugByName } = {}) {
    if (typeof findDrugByName !== "function") {
      throw new TypeError("createViewHelpers requires findDrugByName");
    }

    function notesIdForMed({
      petId,
      visitIndex,
      medIndex,
      ingredientIndex,
      emergency = false,
    } = {}) {
      if (emergency) return `e-drug-notes-${petId}-${medIndex}`;
      if (ingredientIndex !== undefined && ingredientIndex !== null) {
        return `drug-notes-${petId}-${visitIndex}-${medIndex}-${ingredientIndex}`;
      }
      return `drug-notes-${petId}-${visitIndex}-${medIndex}`;
    }

    function resolveDrugNoteModel(med) {
      if (!med || typeof med !== "object") {
        return { status: "unavailable", sideEffects: [], precautions: [] };
      }
      if (med.kind === "photo_bundle" || med.structuredPending) {
        return { status: "pending", sideEffects: [], precautions: [] };
      }
      const drug = findDrugByName(med.name);
      if (!drug) {
        return { status: "unavailable", sideEffects: [], precautions: [] };
      }
      return {
        status: "matched",
        purposeText: drug.purpose || drug.drugClass || "",
        sideEffects: Array.isArray(drug.commonSideEffects)
          ? drug.commonSideEffects.slice()
          : [],
        precautions: Array.isArray(drug.precautions)
          ? drug.precautions.slice()
          : [],
      };
    }

    function needsHydrate(panel) {
      return Boolean(panel && panel.dataset.drugNotesHydrated !== "true");
    }

    return {
      notesIdForMed,
      resolveDrugNoteModel,
      needsHydrate,
    };
  }

  root.domains.timeline.createViewHelpers = createViewHelpers;
})(typeof window !== "undefined" ? window : globalThis);
