(function initPetLiveWebVisitsController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.visits = root.domains.visits || {};

  function createController({ clinicLabelOf: clinicLabelOfOpt } = {}) {
    const clinicLabelOf =
      typeof clinicLabelOfOpt === "function"
        ? clinicLabelOfOpt
        : (visit) => visit?.clinicId || visit?.clinic || "";

    function collectVisitProofPhotos(visit) {
      const slots = { bag: [], rx: [], drug: [] };
      const pushUnique = (list, url) => {
        if (!url || list.includes(url)) return;
        list.push(url);
      };

      pushUnique(slots.bag, visit.bagPhoto);
      pushUnique(slots.rx, visit.rxPhoto);
      pushUnique(slots.drug, visit.drugPhoto);

      (visit.medications || []).forEach((med) => {
        pushUnique(slots.bag, med.bagPhoto);
        pushUnique(slots.rx, med.rxPhoto);
        pushUnique(slots.drug, med.drugPhoto);
      });

      return slots;
    }

    function visitHasAnyProof(visit) {
      const slots = collectVisitProofPhotos(visit);
      return Boolean(slots.bag.length || slots.rx.length || slots.drug.length);
    }

    function clearVisitProofSlot(visit, slot) {
      if (slot === "bag") {
        visit.bagPhoto = null;
        (visit.medications || []).forEach((med) => {
          med.bagPhoto = null;
        });
        return;
      }
      if (slot === "rx") {
        visit.rxPhoto = null;
        (visit.medications || []).forEach((med) => {
          med.rxPhoto = null;
        });
        return;
      }
      if (slot === "drug") {
        visit.drugPhoto = null;
        (visit.medications || []).forEach((med) => {
          med.drugPhoto = null;
        });
      }
    }

    function visitWeightKg(visit) {
      const n = Number(visit?.weightAtVisit);
      return n > 0 ? n : null;
    }

    /** Calendar-day gap between ISO dates (same day → 0). */
    function calendarDaysBetween(fromIso, toIso) {
      const from = String(fromIso || "").slice(0, 10);
      const to = String(toIso || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return null;
      }
      const a = new Date(`${from}T00:00:00`);
      const b = new Date(`${to}T00:00:00`);
      return Math.round((b.getTime() - a.getTime()) / 86400000);
    }

    /**
     * Previous visit = immediately prior in chronological order.
     * Newest-first display list: same-day ties use higher index as older.
     */
    function buildPreviousVisitByIndex(visits) {
      const indexed = (visits || []).map((visit, index) => ({ visit, index }));
      indexed.sort((a, b) => {
        const da = String(a.visit.date || "");
        const db = String(b.visit.date || "");
        if (da !== db) return da < db ? -1 : da > db ? 1 : 0;
        return b.index - a.index;
      });
      const prevByIndex = new Array(indexed.length).fill(null);
      for (let i = 1; i < indexed.length; i++) {
        prevByIndex[indexed[i].index] = indexed[i - 1].visit;
      }
      return prevByIndex;
    }

    function formatWeightDeltaKg(delta) {
      return (Math.round(Math.abs(delta) * 10) / 10).toFixed(1);
    }

    function visitLinkValue(visit) {
      return `${visit.date}::${visit.clinicId || clinicLabelOf(visit) || ""}`;
    }

    function parseVisitLinkValue(value) {
      const raw = String(value || "");
      const idx = raw.indexOf("::");
      if (idx < 0) return null;
      return {
        date: raw.slice(0, idx),
        clinicKey: raw.slice(idx + 2),
      };
    }

    function findVisitByLink(pet, value) {
      const parsed = parseVisitLinkValue(value);
      if (!parsed || !pet?.visits) return null;
      return (
        pet.visits.find((visit) => {
          if (visit.date !== parsed.date) return false;
          if (visit.clinicId && parsed.clinicKey === visit.clinicId) return true;
          return (
            clinicLabelOf(visit) === parsed.clinicKey ||
            visit.clinic === parsed.clinicKey
          );
        }) || null
      );
    }

    function findVisitByDateClinic(pet, { date, clinicId, clinicName } = {}) {
      if (!pet?.visits || !date) return null;
      // Empty clinicName must match only empty-label visits (not “any same-day”).
      // Aligns with mainline completingVisitRef / visit-form name rules.
      const name = clinicName == null ? "" : String(clinicName);
      return (
        pet.visits.find((visit) => {
          if (visit.date !== date) return false;
          if (clinicId && visit.clinicId) {
            return visit.clinicId === clinicId;
          }
          return (
            clinicLabelOf(visit) === name || visit.clinic === name
          );
        }) || null
      );
    }

    function saveVisitWeight(pet, visitIndex, weightKg) {
      if (!pet?.visits?.[visitIndex]) {
        return { ok: false, reason: "missing_visit" };
      }
      const weight = Number(weightKg);
      if (!(weight > 0)) {
        return { ok: false, reason: "invalid_weight" };
      }
      const visit = pet.visits[visitIndex];
      visit.weightAtVisit = weight;
      let petWeightUpdated = false;
      if (!pet.weightDate || visit.date >= pet.weightDate) {
        pet.weight = weight;
        pet.weightDate = visit.date;
        petWeightUpdated = true;
      }
      return { ok: true, visit, petWeightUpdated };
    }

    return {
      visitWeightKg,
      calendarDaysBetween,
      buildPreviousVisitByIndex,
      formatWeightDeltaKg,
      collectVisitProofPhotos,
      visitHasAnyProof,
      visitLinkValue,
      parseVisitLinkValue,
      findVisitByLink,
      findVisitByDateClinic,
      saveVisitWeight,
      clearVisitProofSlot,
    };
  }

  root.domains.visits.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
