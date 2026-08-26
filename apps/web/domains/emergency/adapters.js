(function initPetLiveWebEmergencyAdapters(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.emergency = root.domains.emergency || {};

  function addDays(isoDate, days) {
    const date = new Date(`${isoDate}T00:00:00`);
    date.setDate(date.getDate() + days);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function parseDurationDaysFromDose(dose) {
    const match = String(dose || "").match(/(\d+)\s*天/);
    if (!match) return null;
    const days = Number(match[1]);
    return Number.isInteger(days) && days > 0 ? days : null;
  }

  function resolveMedCourse(med, visit) {
    const startDate = med.startDate || visit?.date || null;
    const durationDays =
      med.durationDays || parseDurationDaysFromDose(med.dose) || null;
    if (!startDate || !durationDays || !(durationDays > 0)) return null;
    return {
      startDate,
      durationDays,
      endDate: addDays(startDate, durationDays - 1),
    };
  }

  function isMedCourseActive(course, today) {
    if (!course) return false;
    return today >= course.startDate && today <= course.endDate;
  }

  /**
   * Thin snapshot adapter for the emergency-card module bridge.
   * Assembles pets[] truth; does not call the runtime bridge or touch DOM/storage.
   */
  function createAdapter({ getAlertsForPet, todayISODate } = {}) {
    if (typeof getAlertsForPet !== "function") {
      throw new TypeError("createAdapter requires getAlertsForPet");
    }
    if (typeof todayISODate !== "function") {
      throw new TypeError("createAdapter requires todayISODate");
    }

    /** Active courses for emergency card / copy — derived from visits only.
     *  Compound bundles are flattened to ingredient rows (no compound header).
     */
    function deriveActiveEmergencyMeds(pet, today) {
      const asOf = today || todayISODate();
      const active = [];

      (pet?.visits || []).forEach((visit) => {
        (visit.medications || []).forEach((med) => {
          if (med.kind === "photo_bundle") return;
          const course = resolveMedCourse(med, visit);
          if (!isMedCourseActive(course, asOf)) return;

          if (med.kind === "compound_bundle") {
            const ingredients = med.ingredients || [];
            if (!ingredients.length) return;
            ingredients.forEach((ing) => {
              if (!ing?.name) return;
              active.push({
                kind: "single",
                name: ing.name,
                dose: ing.dose,
                frequency: med.frequency,
                startDate: course.startDate,
                durationDays: course.durationDays,
                source: ing.source || med.source,
              });
            });
            return;
          }

          const amount = med.amount ?? med.dosageAmount;
          const unit = med.unit || med.dosageUnit;
          active.push({
            kind: "single",
            name: med.name,
            dose: med.dose,
            frequency: med.frequency,
            dosageAmount: amount,
            dosageUnit: unit,
            startDate: course.startDate,
            durationDays: course.durationDays,
            source: med.source,
          });
        });
      });

      return active;
    }

    function buildSnapshot(pet) {
      const alerts = getAlertsForPet(pet);
      const meds = deriveActiveEmergencyMeds(pet);
      return {
        pet: {
          id: pet.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          gender: pet.gender,
          birthDate: pet.birthDate,
          chipNumber: pet.chipNumber || "",
          weight: pet.weight,
          weightDate: pet.weightDate,
        },
        latestWeight:
          pet.weight != null
            ? { weight: pet.weight, recordedDate: pet.weightDate || null }
            : null,
        alerts,
        currentMedications: meds,
      };
    }

    return {
      buildSnapshot,
      deriveActiveEmergencyMeds,
    };
  }

  root.domains.emergency.createAdapter = createAdapter;
  /** Boot symmetry alias — prefer createAdapter for this domain. */
  root.domains.emergency.createController = createAdapter;
})(typeof window !== "undefined" ? window : globalThis);
