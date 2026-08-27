(function initPetLiveWebPetsLabels(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.pets = root.domains.pets || {};

  /**
   * Pure age label from birthDate ISO. Inject label/t for copy keys.
   * @param {string} birthDate YYYY-MM-DD
   * @param {function} label i18n (key, params?)
   */
  function formatAgeLabel(birthDate, label) {
    if (typeof label !== "function") {
      throw new TypeError("formatAgeLabel requires label(key, params?)");
    }
    const birth = new Date(`${birthDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) months -= 1;
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    if (years < 0) return label("ageUnknown");
    if (years === 0) {
      return months <= 0 ? label("ageUnderMonth") : label("ageMonths", { n: months });
    }
    if (months === 0) return label("ageYears", { n: years });
    return label("ageYearsMonths", { y: years, m: months });
  }

  function formatGenderLabel(gender, isNeutered, label) {
    if (typeof label !== "function") {
      throw new TypeError("formatGenderLabel requires label(key, params?)");
    }
    const genderText = label(gender) || label("unknown");
    if (isNeutered === "yes") return label("genderNeutered", { g: genderText });
    if (isNeutered === "no") return label("genderNotNeutered", { g: genderText });
    return label("genderNeuterUnknown", { g: genderText });
  }

  function createLabels({ label } = {}) {
    if (typeof label !== "function") {
      throw new TypeError("createLabels requires label(key, params?)");
    }
    return {
      formatAgeLabel: (birthDate) => formatAgeLabel(birthDate, label),
      formatGenderLabel: (gender, isNeutered) =>
        formatGenderLabel(gender, isNeutered, label),
    };
  }

  root.domains.pets.formatAgeLabel = formatAgeLabel;
  root.domains.pets.formatGenderLabel = formatGenderLabel;
  root.domains.pets.createLabels = createLabels;
})(typeof window !== "undefined" ? window : globalThis);
