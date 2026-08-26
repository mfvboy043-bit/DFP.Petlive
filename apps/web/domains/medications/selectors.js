(function initPetLiveWebMedicationsSelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.medications = root.domains.medications || {};

  function createSelectors({
    formatFrequencyLabelOf,
    formatDosageUnitLabelOf,
    durationDaysLabelOf,
    pendingDoseLabelOf,
    formatShortDateOf,
    getMedEndDate,
    medCourseOf,
    expandFrequencyInTextOf,
  } = {}) {
    const freqLabel =
      typeof formatFrequencyLabelOf === "function"
        ? formatFrequencyLabelOf
        : (code) => code || "";
    const unitLabel =
      typeof formatDosageUnitLabelOf === "function"
        ? formatDosageUnitLabelOf
        : (unit) => {
            const value = (unit || "").trim();
            if (!value || value === "unrecorded") return "";
            return value;
          };
    const daysLabel =
      typeof durationDaysLabelOf === "function"
        ? durationDaysLabelOf
        : (n) => String(n);
    const pendingLabel =
      typeof pendingDoseLabelOf === "function"
        ? pendingDoseLabelOf
        : () => "";
    const shortDate =
      typeof formatShortDateOf === "function"
        ? formatShortDateOf
        : (iso) => iso || "";
    const endDateOf =
      typeof getMedEndDate === "function"
        ? getMedEndDate
        : () => "";
    const courseOf =
      typeof medCourseOf === "function"
        ? medCourseOf
        : ({ start, days, end }) =>
            start && days ? `${start} · ${days} · ${end}` : "";
    const expandFreq =
      typeof expandFrequencyInTextOf === "function"
        ? expandFrequencyInTextOf
        : (text) => text || "";

    function formatMedDose(med) {
      const parts = [];
      const unit = unitLabel(med?.dosageUnit || med?.unit);
      if (
        med?.dosageAmount != null &&
        med.dosageAmount !== "" &&
        Number(med.dosageAmount) > 0
      ) {
        parts.push(unit ? `${med.dosageAmount} ${unit}` : String(med.dosageAmount));
      } else if (med?.amount != null && Number(med.amount) > 0) {
        parts.push(unit ? `${med.amount} ${unit}` : String(med.amount));
      } else if (unit) {
        parts.push(unit);
      }
      if (med?.frequency) parts.push(freqLabel(med.frequency));
      if (parts.length) return parts.join(" · ");
      if (med?.dose) return expandFreq(med.dose);
      return pendingLabel();
    }

    function formatMedCourse(med) {
      if (!med?.startDate || !med?.durationDays) return "";
      return courseOf({
        start: shortDate(med.startDate),
        days: med.durationDays,
        end: shortDate(endDateOf(med)),
      });
    }

    function formatDraftDoseLine(draft) {
      const parts = [];
      const unit = unitLabel(draft?.unit);
      if (draft?.amount > 0 && unit) parts.push(`${draft.amount} ${unit}`);
      else if (draft?.amount > 0) parts.push(String(draft.amount));
      else if (unit) parts.push(unit);
      if (draft?.frequency) parts.push(freqLabel(draft.frequency));
      if (Number.isInteger(draft?.days) && draft.days > 0) {
        parts.push(daysLabel(draft.days));
      }
      return parts.join(" · ") || pendingLabel();
    }

    function compoundFormClass(form) {
      if (form === "liquid" || form === "liquid_a") return "is-liquid is-liquid-a";
      if (form === "liquid_b") return "is-liquid is-liquid-b";
      if (form === "liquid_c") return "is-liquid is-liquid-c";
      if (form === "capsule_a") return "is-capsule is-capsule-a";
      if (form === "capsule_b") return "is-capsule is-capsule-b";
      if (form === "capsule_c") return "is-capsule is-capsule-c";
      return "";
    }

    function compoundIconKind(form) {
      if (String(form || "").startsWith("capsule")) return "capsule";
      return "liquid";
    }

    return {
      formatMedDose,
      formatMedCourse,
      formatDraftDoseLine,
      compoundFormClass,
      compoundIconKind,
    };
  }

  root.domains.medications.createSelectors = createSelectors;
})(typeof window !== "undefined" ? window : globalThis);
