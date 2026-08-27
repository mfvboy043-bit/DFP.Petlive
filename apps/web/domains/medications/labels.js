(function initPetLiveWebMedicationsLabels(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.medications = root.domains.medications || {};

  /**
   * Pure med frequency + compound form presentation helpers.
   * Inject label/t for i18n; tone class map is label-free.
   * Badge vs label keys differ (compoundLiquidA vs compoundLiquidAName) — do not swap.
   */
  function createLabels({ label } = {}) {
    if (typeof label !== "function") {
      throw new TypeError("createLabels requires label(key, params?)");
    }

    function formatFrequencyLabel(frequency) {
      const raw = String(frequency || "").trim();
      if (!raw || raw === "unrecorded") return "";
      const code = raw.toUpperCase();
      const labels = {
        SID: label("freqLabelSid"),
        BID: label("freqLabelBid"),
        TID: label("freqLabelTid"),
        EOD: label("freqLabelEod"),
      };
      if (labels[code]) return `${labels[code]} (${code})`;
      return code;
    }

    /** Expand SID/BID/… and localized day counts inside stored dose strings. */
    function expandFrequencyInText(text) {
      if (!text) return text;
      return String(text)
        .replace(/ · SID(?= · |$)/g, ` · ${formatFrequencyLabel("SID")}`)
        .replace(/ · BID(?= · |$)/g, ` · ${formatFrequencyLabel("BID")}`)
        .replace(/ · TID(?= · |$)/g, ` · ${formatFrequencyLabel("TID")}`)
        .replace(/ · EOD(?= · |$)/g, ` · ${formatFrequencyLabel("EOD")}`)
        .replace(/ · (\d+) 天(?= · |$)/g, (_, n) => ` · ${label("durationDaysCount", { n })}`);
    }

    function compoundFormLabel(form) {
      const map = {
        liquid: label("compoundLiquidAName"),
        liquid_a: label("compoundLiquidAName"),
        liquid_b: label("compoundLiquidBName"),
        liquid_c: label("compoundLiquidCName"),
        capsule_a: label("compoundCapsuleAName"),
        capsule_b: label("compoundCapsuleBName"),
        capsule_c: label("compoundCapsuleCName"),
      };
      return map[form] || label("compoundLiquidName");
    }

    function compoundFormBadge(form) {
      const map = {
        liquid: label("compoundLiquidA"),
        liquid_a: label("compoundLiquidA"),
        liquid_b: label("compoundLiquidB"),
        liquid_c: label("compoundLiquidC"),
        capsule_a: label("compoundCapsuleA"),
        capsule_b: label("compoundCapsuleB"),
        capsule_c: label("compoundCapsuleC"),
      };
      return map[form] || label("compoundLiquid");
    }

    function compoundChipToneClass(form) {
      if (form === "liquid" || form === "liquid_a") return "is-liquid-a";
      if (form === "liquid_b") return "is-liquid-b";
      if (form === "liquid_c") return "is-liquid-c";
      if (form === "capsule_a") return "is-capsule-a";
      if (form === "capsule_b") return "is-capsule-b";
      if (form === "capsule_c") return "is-capsule-c";
      return "";
    }

    return {
      formatFrequencyLabel,
      expandFrequencyInText,
      compoundFormLabel,
      compoundFormBadge,
      compoundChipToneClass,
    };
  }

  root.domains.medications.createLabels = createLabels;
})(typeof window !== "undefined" ? window : globalThis);
