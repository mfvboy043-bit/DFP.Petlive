(function initPetLiveWebParasiteLabels(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.parasite = root.domains.parasite || {};

  /**
   * Pure parasite calendar title/details text. Inject label/t for copy keys.
   * Facade supplies kindTitle (localized) and record from controller.
   */
  function createLabels({ label } = {}) {
    if (typeof label !== "function") {
      throw new TypeError("createLabels requires label(key, params?)");
    }

    function buildCalendarTitleDetails({ pet, kindTitle, record } = {}) {
      if (!pet || !record?.nextDue) return null;
      const title = label("parasiteCalTitle", {
        name: pet.name,
        kind: kindTitle,
        product: record.product || kindTitle,
      });
      const details = label("parasiteCalDetails", {
        name: pet.name,
        kind: kindTitle,
        product: record.product || "—",
        last: record.lastGiven || "—",
        next: record.nextDue,
      });
      return { title, details };
    }

    return { buildCalendarTitleDetails };
  }

  root.domains.parasite.createLabels = createLabels;
})(typeof window !== "undefined" ? window : globalThis);
