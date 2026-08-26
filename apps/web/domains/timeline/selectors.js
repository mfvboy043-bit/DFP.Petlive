(function initPetLiveWebTimelineSelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.timeline = root.domains.timeline || {};

  function createSelectors({ visits } = {}) {
    if (
      !visits ||
      typeof visits.buildPreviousVisitByIndex !== "function" ||
      typeof visits.visitWeightKg !== "function" ||
      typeof visits.visitHasAnyProof !== "function" ||
      typeof visits.visitHasImaging !== "function"
    ) {
      throw new TypeError("createSelectors requires visits controller helpers");
    }

    function buildPreviousVisitByIndex(visitsArr) {
      return visits.buildPreviousVisitByIndex(visitsArr);
    }

    function visitTimelineFlags(visit) {
      return {
        hasProof: visits.visitHasAnyProof(visit),
        hasImaging: visits.visitHasImaging(visit),
        hasRx: Array.isArray(visit?.medications) && visit.medications.length > 0,
      };
    }

    function buildTimelineEntries(pet) {
      const list = pet?.visits || [];
      const previousByIndex = buildPreviousVisitByIndex(list);
      return list.map((visit, visitIndex) => {
        const flags = visitTimelineFlags(visit);
        return {
          visitIndex,
          visit,
          previousVisit: previousByIndex[visitIndex],
          weightKg: visits.visitWeightKg(visit),
          hasProof: flags.hasProof,
          hasImaging: flags.hasImaging,
          hasRx: flags.hasRx,
          year: String(visit.date || "").slice(0, 4),
        };
      });
    }

    return {
      buildPreviousVisitByIndex,
      visitTimelineFlags,
      buildTimelineEntries,
    };
  }

  root.domains.timeline.createSelectors = createSelectors;
})(typeof window !== "undefined" ? window : globalThis);
