(function initPetLiveWebVaccinesLabels(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.vaccines = root.domains.vaccines || {};

  /**
   * Pure vaccine calendar title/details text. Inject label/t and fallback name.
   * Joins vaccine entry names with 、 (same as facade today).
   */
  function createLabels({ label } = {}) {
    if (typeof label !== "function") {
      throw new TypeError("createLabels requires label(key, params?)");
    }

    function joinVaccineNames(vaccines, fallbackLabel) {
      const vaccineNames = (vaccines || []).map((entry) => entry.name).filter(Boolean);
      return vaccineNames.join("、") || fallbackLabel || "";
    }

    function buildCalendarTitleDetails({
      pet,
      vaccines,
      given,
      next,
      vaccineFallbackLabel,
    } = {}) {
      if (!pet || !next) return null;
      const vaccinesLabel = joinVaccineNames(vaccines, vaccineFallbackLabel);
      const title = label("vaccineCalTitle", {
        name: pet.name,
        vaccines: vaccinesLabel,
      });
      const details = label("vaccineCalDetails", {
        name: pet.name,
        vaccines: vaccinesLabel,
        given: given || "—",
        next,
      });
      return { title, details };
    }

    return {
      joinVaccineNames,
      buildCalendarTitleDetails,
    };
  }

  root.domains.vaccines.createLabels = createLabels;
})(typeof window !== "undefined" ? window : globalThis);
