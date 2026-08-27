(function initPetLiveWebClinicsCatalog(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.clinics = root.domains.clinics || {};

  const CLINIC_PRESETS = [
    { id: "c1", name: "幸福動物醫院", noteKey: "clinicGeneral", anonymous: false },
    { id: "c2", name: "夜間急診動物醫院", noteKey: "clinicEmergency", anonymous: false },
    { id: "c3", name: "綠葉動物醫院", noteKey: "clinicGeneral", anonymous: false },
    { id: "c4", name: "忠孝動物醫院", noteKey: "clinicGeneral", anonymous: false },
    { id: "c5", name: "城市寵物診所", noteKey: "clinicGeneral", anonymous: false },
    { id: "c6", name: "喵星人專科醫院", noteKey: "clinicCat", anonymous: false },
  ];

  function createCatalog({ label, locField } = {}) {
    if (typeof label !== "function") {
      throw new TypeError("createCatalog requires label(key)");
    }
    if (typeof locField !== "function") {
      throw new TypeError("createCatalog requires locField(value)");
    }

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

    function visitClinicLabel(visit) {
      if (!visit) return "";
      if (visit.clinicId) {
        const preset = CLINIC_PRESETS.find((clinic) => clinic.id === visit.clinicId);
        if (preset) return clinicNameOf(preset);
        if (visit.clinicId === "anonymous") return label("anonymousClinic");
      }
      return locField(visit.clinic);
    }

    function getClinicDirectory(pets) {
      const anonymous = getAnonymousClinic();
      const presets = CLINIC_PRESETS.map((clinic) => ({
        ...clinic,
        name: clinicNameOf(clinic),
        note: label(clinic.noteKey),
      }));
      const fromVisits = (pets || []).flatMap((pet) =>
        (pet.visits || []).map((visit) => visitClinicLabel(visit)).filter(Boolean)
      );
      const names = new Set(presets.map((clinic) => clinic.name));
      const extra = fromVisits
        .filter((name) => !names.has(name) && name !== anonymous.name)
        .filter((name, index, arr) => arr.indexOf(name) === index)
        .map((name, index) => ({
          id: `extra-${index}`,
          name,
          note: label("clinicFromHistory"),
          anonymous: false,
        }));
      // Pin anonymous first so clinics that prefer not to be named see it immediately.
      return [anonymous, ...presets, ...extra];
    }

    return {
      CLINIC_PRESETS,
      clinicNameOf,
      getAnonymousClinic,
      visitClinicLabel,
      getClinicDirectory,
    };
  }

  root.domains.clinics.CLINIC_PRESETS = CLINIC_PRESETS;
  root.domains.clinics.createCatalog = createCatalog;
})(typeof window !== "undefined" ? window : globalThis);
