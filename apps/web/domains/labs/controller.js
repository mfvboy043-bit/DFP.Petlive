(function initPetLiveWebLabsController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.labs = root.domains.labs || {};

  function createController({
    labReportsSlot,
    selectors,
    isDemoMode,
    onAfterWrite,
  } = {}) {
    if (
      !labReportsSlot ||
      typeof labReportsSlot.read !== "function" ||
      typeof labReportsSlot.write !== "function"
    ) {
      throw new TypeError("createController requires labReportsSlot with read/write");
    }
    if (!selectors || typeof selectors.sortLabReports !== "function") {
      throw new TypeError("createController requires selectors from createSelectors");
    }

    function demo() {
      return typeof isDemoMode === "function" ? Boolean(isDemoMode()) : false;
    }

    function getLabReportsForPet(petId) {
      if (!petId) return [];
      const map = labReportsSlot.read();
      const rows = map[petId];
      if (!Array.isArray(rows)) return [];
      return selectors.sortLabReports(rows);
    }

    function writeLabReportsForPet(petId, reports) {
      if (!petId || demo()) return false;
      const map = labReportsSlot.read();
      map[petId] = Array.isArray(reports) ? reports : [];
      const ok = labReportsSlot.write(map);
      if (ok && typeof onAfterWrite === "function") onAfterWrite();
      return ok;
    }

    function buildLabReport({
      petId,
      date,
      types,
      clinic,
      clinicId,
      visitDate,
      visitClinicId,
      note,
      photos,
    } = {}) {
      const filteredTypes = selectors.filterLabTypes(
        Array.isArray(types) ? types : []
      );
      return {
        id: `lab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        petId,
        date: String(date || ""),
        types: filteredTypes,
        clinic: String(clinic || ""),
        clinicId:
          clinicId && clinicId !== "anonymous" ? String(clinicId) : undefined,
        visitDate: visitDate ? String(visitDate) : "",
        visitClinicId: visitClinicId ? String(visitClinicId) : "",
        note: String(note || ""),
        photos: Array.isArray(photos) ? photos.filter(Boolean).slice() : [],
        source: "owner_proof",
        createdAt: new Date().toISOString(),
      };
    }

    function addLabReport(petId, report) {
      if (!petId || !report) return false;
      if (!Array.isArray(report.photos) || !report.photos.length) return false;
      const next = [report, ...getLabReportsForPet(petId)];
      return writeLabReportsForPet(petId, next);
    }

    function removeLabReport(petId, reportId) {
      if (!petId || !reportId) return false;
      const next = getLabReportsForPet(petId).filter((row) => row.id !== reportId);
      return writeLabReportsForPet(petId, next);
    }

    return {
      getLabReportsForPet,
      writeLabReportsForPet,
      buildLabReport,
      addLabReport,
      removeLabReport,
    };
  }

  root.domains.labs.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
