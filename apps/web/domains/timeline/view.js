(function initPetLiveWebTimelineView(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.timeline = root.domains.timeline || {};

  function findDrugByNameInCatalog(drugs, name) {
    if (!name || !Array.isArray(drugs)) return null;
    const q = String(name).trim().toLowerCase();
    if (!q) return null;
    return (
      drugs.find((drug) => {
        const keys = [
          drug.genericName,
          drug.brandNameZh,
          drug.brandNameEn,
          ...(drug.commonAliases || []),
        ]
          .filter(Boolean)
          .map((item) => String(item).toLowerCase());
        return keys.some((key) => key === q || key.includes(q) || q.includes(key));
      }) || null
    );
  }

  function createViewHelpers({ findDrugByName } = {}) {
    if (typeof findDrugByName !== "function") {
      throw new TypeError("createViewHelpers requires findDrugByName");
    }

    function notesIdForMed({
      petId,
      visitIndex,
      medIndex,
      ingredientIndex,
      emergencyPrefix,
    } = {}) {
      if (emergencyPrefix != null && emergencyPrefix !== "") {
        return `e-drug-notes-${emergencyPrefix}-${medIndex}`;
      }
      if (ingredientIndex != null && ingredientIndex !== "") {
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
        precautions: Array.isArray(drug.precautions) ? drug.precautions.slice() : [],
      };
    }

    /** Same payload as resolveDrugNoteModel; first-open hydrate uses this contract. */
    function hydrateDrugNoteModel(med) {
      return resolveDrugNoteModel(med);
    }

    /** All drug-note bodies are deferred until first expand (shell-only first paint). */
    function shouldDeferDrugNoteBody() {
      return true;
    }

    return {
      notesIdForMed,
      resolveDrugNoteModel,
      hydrateDrugNoteModel,
      shouldDeferDrugNoteBody,
      findDrugByName,
    };
  }

  root.domains.timeline.findDrugByNameInCatalog = findDrugByNameInCatalog;
  root.domains.timeline.createViewHelpers = createViewHelpers;
})(typeof window !== "undefined" ? window : globalThis);
