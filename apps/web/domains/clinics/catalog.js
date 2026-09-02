(function initPetLiveWebClinicsCatalog(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.clinics = root.domains.clinics || {};

  const CLINIC_PRESETS = [];

  function createCatalog({ label, locField, getSavedClinics } = {}) {
    if (typeof label !== "function") {
      throw new TypeError("createCatalog requires label(key)");
    }
    if (typeof locField !== "function") {
      throw new TypeError("createCatalog requires locField(value)");
    }
    const readSaved =
      typeof getSavedClinics === "function" ? getSavedClinics : () => [];

    function clinicNameOf(clinic) {
      if (!clinic) return "";
      return clinic.name || (clinic.nameKey ? label(clinic.nameKey) : "");
    }

    function getAnonymousClinic() {
      return {
        id: "anonymous",
        name: label("anonymousClinic"),
        note: label("anonymousClinicNote"),
        anonymous: true,
      };
    }

    function savedClinicEntries() {
      return readSaved().map((clinic) => ({
        id: clinic.id,
        name: clinic.name,
        note: label("clinicSavedNote"),
        anonymous: false,
        saved: true,
        deletable: true,
      }));
    }

    function resolveSavedClinicName(clinicId) {
      const saved = readSaved().find((item) => item.id === clinicId);
      return saved?.name || "";
    }

    function visitClinicLabel(visit) {
      if (!visit) return "";
      if (visit.clinicId === "anonymous") return label("anonymousClinic");
      if (visit.clinicId) {
        const preset = CLINIC_PRESETS.find((clinic) => clinic.id === visit.clinicId);
        if (preset) return clinicNameOf(preset);
        const savedName = resolveSavedClinicName(visit.clinicId);
        if (savedName) return savedName;
      }
      return locField(visit.clinic);
    }

    function getClinicDirectory(pets, savedOverride) {
      const anonymous = getAnonymousClinic();
      const saved =
        Array.isArray(savedOverride) && savedOverride.length
          ? savedOverride.map((clinic) => ({
              id: clinic.id,
              name: clinic.name,
              note: label("clinicSavedNote"),
              anonymous: false,
              saved: true,
              deletable: true,
            }))
          : savedClinicEntries();
      const names = new Set(saved.map((clinic) => clinic.name));
      const fromVisits = (pets || []).flatMap((pet) =>
        (pet.visits || []).map((visit) => visitClinicLabel(visit)).filter(Boolean)
      );
      const extra = fromVisits
        .filter((name) => !names.has(name) && name !== anonymous.name)
        .filter((name, index, arr) => arr.indexOf(name) === index)
        .map((name, index) => ({
          id: `history-${index}`,
          name,
          note: label("clinicFromHistory"),
          anonymous: false,
          deletable: false,
        }));
      return [anonymous, ...saved, ...extra];
    }

    function buildAddSuggestion(query, directory) {
      const trimmed = String(query || "").trim();
      if (!trimmed) return null;
      const q = trimmed.toLowerCase();
      const exists = directory.some(
        (clinic) => clinic.id !== "anonymous" && clinic.name.toLowerCase() === q
      );
      if (exists) return null;
      return {
        id: "__add__",
        name: trimmed,
        note: label("clinicAddSuggestion", { name: trimmed }),
        anonymous: false,
        isAddSuggestion: true,
      };
    }

    /** Filter directory; anonymous stays pinned first while searching. */
    function searchClinics(query, pets, savedOverride) {
      const q = String(query || "")
        .trim()
        .toLowerCase();
      const directory = getClinicDirectory(pets, savedOverride);
      const anonymous = getAnonymousClinic();
      const rest = directory.filter((clinic) => clinic.id !== "anonymous");
      const addSuggestion = buildAddSuggestion(query, directory);
      if (!q) {
        return addSuggestion ? [anonymous, ...rest, addSuggestion] : [anonymous, ...rest];
      }
      const matched = rest.filter((clinic) => {
        const hay = `${clinic.name} ${clinic.note}`.toLowerCase();
        return hay.includes(q);
      });
      const list = [anonymous, ...matched];
      if (addSuggestion) list.push(addSuggestion);
      return list;
    }

    return {
      CLINIC_PRESETS,
      clinicNameOf,
      getAnonymousClinic,
      visitClinicLabel,
      getClinicDirectory,
      searchClinics,
      buildAddSuggestion,
    };
  }

  root.domains.clinics.CLINIC_PRESETS = CLINIC_PRESETS;
  root.domains.clinics.createCatalog = createCatalog;
})(typeof window !== "undefined" ? window : globalThis);
