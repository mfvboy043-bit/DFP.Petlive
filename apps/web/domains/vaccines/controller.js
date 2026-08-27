(function initPetLiveWebVaccinesController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.vaccines = root.domains.vaccines || {};

  function createController({ selectors } = {}) {
    if (!selectors || typeof selectors.vaccineStatusForNext !== "function") {
      throw new TypeError("createController requires selectors from createSelectors");
    }

    function upsertPetVaccines(pet, entries) {
      if (!Array.isArray(pet.vaccines)) pet.vaccines = [];
      const keys = new Set(entries.map((entry) => entry.key).filter(Boolean));
      const names = new Set(entries.map((entry) => entry.name));
      pet.vaccines = pet.vaccines.filter((vaccine) => {
        if (vaccine.key && keys.has(vaccine.key)) return false;
        if (names.has(vaccine.name)) return false;
        return true;
      });
      entries
        .slice()
        .reverse()
        .forEach((entry) => {
          pet.vaccines.unshift(entry);
        });
    }

    function wasVaccineUpdated(pet, selected) {
      return (selected || []).some((entry) =>
        pet.vaccines?.some(
          (vaccine) =>
            (entry.key && vaccine.key === entry.key) || vaccine.name === entry.name
        )
      );
    }

    function validateSave({ pet, selected, given, next }) {
      if (!selected?.length) {
        return { ok: false, reason: "need_name" };
      }
      const blocked = (selected || []).filter(
        (entry) => !selectors.vaccineAllowedForPet(pet, entry)
      );
      if (blocked.length) {
        return { ok: false, reason: "species_blocked", blocked: blocked[0] };
      }
      if (!given || !next) {
        return { ok: false, reason: "need_dates" };
      }
      if (next < given) {
        return { ok: false, reason: "date_order" };
      }
      return { ok: true };
    }

    function buildSaveEntries({ pet, selected, given, next }) {
      const validation = validateSave({ pet, selected, given, next });
      if (!validation.ok) {
        return {
          ok: false,
          reason: validation.reason,
          blocked: validation.blocked,
        };
      }
      const status = selectors.vaccineStatusForNext(next);
      const entries = (selected || []).map((entry) => ({
        key: entry.key || "",
        name: entry.name,
        given,
        next,
        status,
      }));
      const updated = wasVaccineUpdated(pet, selected);
      return { ok: true, entries, updated };
    }

    function buildVaccineCalendarPayload(pet, { vaccines, given, next }, options = {}) {
      if (!pet || !next) return null;
      const vaccineNames = (vaccines || []).map((entry) => entry.name).filter(Boolean);
      let title = options.title;
      let details = options.details;
      if (typeof options.buildTitle === "function") {
        title = options.buildTitle({ vaccines, given, next }, pet);
      }
      if (typeof options.buildDetails === "function") {
        details = options.buildDetails({ vaccines, given, next }, pet);
      }
      const compactNext = String(next || "").replace(/-/g, "");
      return {
        title: title || "",
        details: details || "",
        nextDue: next,
        uid: `vaccine-${compactNext}-${vaccineNames.length}`,
      };
    }

    return {
      upsertPetVaccines,
      validateSave,
      buildSaveEntries,
      buildVaccineCalendarPayload,
      wasVaccineUpdated,
    };
  }

  root.domains.vaccines.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
