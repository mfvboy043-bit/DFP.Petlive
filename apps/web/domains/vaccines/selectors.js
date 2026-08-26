(function initPetLiveWebVaccinesSelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.vaccines = root.domains.vaccines || {};

  /**
   * Same group = series progression (later shot supersedes earlier for that line).
   * displayRank: lower = higher priority for home/emergency status surfacing & list order.
   *   10 core combo → 20 heartworm inj → 30 rabies → 40 standalone lepto → 50 lyme → 80 custom
   */
  const PROTECTION_META = {
    v5in1: { group: "coreCombo", tier: 5, displayRank: 10 },
    v7in1: { group: "coreCombo", tier: 7, displayRank: 10 },
    v8in1: { group: "coreCombo", tier: 8, displayRank: 10 },
    v10in1: { group: "coreCombo", tier: 10, displayRank: 10 },
    v11in1: { group: "coreCombo", tier: 11, displayRank: 10 },
    v3in1: { group: "felineCore", tier: 3, displayRank: 10 },
    v5in1Cat: { group: "felineCore", tier: 5, displayRank: 10 },
    vHeartwormInj: { group: "heartwormInj", tier: 1, displayRank: 20 },
    vRabies: { group: "rabies", tier: 1, displayRank: 30 },
    vLepto: { group: "lepto", tier: 1, displayRank: 40 },
    vLyme: { group: "lyme", tier: 1, displayRank: 50 },
    vFelv: { group: "felv", tier: 1, displayRank: 45 },
    vChlamydia: { group: "chlamydia", tier: 1, displayRank: 46 },
  };

  root.domains.vaccines.PROTECTION_META = PROTECTION_META;

  function createSelectors({
    daysUntil: daysUntilOpt,
    findKeyByLocalizedName: findKeyByLocalizedNameOpt,
    isRabiesLocalizedName: isRabiesLocalizedNameOpt,
  } = {}) {
    if (typeof daysUntilOpt !== "function") {
      throw new TypeError("createSelectors requires daysUntil");
    }
    const findKeyByLocalizedName =
      typeof findKeyByLocalizedNameOpt === "function"
        ? findKeyByLocalizedNameOpt
        : () => "";
    const isRabiesLocalizedName =
      typeof isRabiesLocalizedNameOpt === "function"
        ? isRabiesLocalizedNameOpt
        : null;

    function addYears(isoDate, years) {
      const date = new Date(`${isoDate}T00:00:00`);
      date.setFullYear(date.getFullYear() + years);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    function todayISODate() {
      const date = new Date();
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    /** @returns {"protected"|"approaching"|"expired"} */
    function getVaccineProtectionStatus(nextDate) {
      const days = daysUntilOpt(nextDate);
      if (days <= 0) return "expired";
      if (days <= 90) return "approaching";
      return "protected";
    }

    function isVaccineApproaching(nextDate) {
      return getVaccineProtectionStatus(nextDate) === "approaching";
    }

    function vaccineStatusForNext(next) {
      const s = getVaccineProtectionStatus(next);
      return s === "approaching" ? "soon" : s === "expired" ? "expired" : "ok";
    }

    function resolveVaccineKey(vaccine) {
      if (vaccine?.key && PROTECTION_META[vaccine.key]) return vaccine.key;
      const name = vaccine?.name;
      if (!name) return "";
      return findKeyByLocalizedName(name) || "";
    }

    function getVaccineProtectionGroup(vaccine) {
      const key = resolveVaccineKey(vaccine);
      if (key) return PROTECTION_META[key].group;
      return `name:${vaccine?.name || ""}`;
    }

    function getVaccineTier(vaccine) {
      const key = resolveVaccineKey(vaccine);
      return key ? PROTECTION_META[key].tier : 0;
    }

    function getVaccineDisplayRank(vaccine) {
      const key = resolveVaccineKey(vaccine);
      if (key) return PROTECTION_META[key].displayRank;
      return 80;
    }

    /** Higher = more current within a protection group. */
    function compareVaccineCurrency(a, b) {
      if (a.given !== b.given) return a.given < b.given ? -1 : 1;
      const tierDiff = getVaccineTier(a) - getVaccineTier(b);
      if (tierDiff) return tierDiff;
      if (a.next !== b.next) return a.next < b.next ? -1 : 1;
      return 0;
    }

    function getCurrentVaccinesByGroup(pet) {
      const map = new Map();
      (pet?.vaccines || []).forEach((vaccine) => {
        const group = getVaccineProtectionGroup(vaccine);
        const current = map.get(group);
        if (!current || compareVaccineCurrency(current, vaccine) < 0) {
          map.set(group, vaccine);
        }
      });
      return map;
    }

    function getVaccineSuccessor(pet, vaccine) {
      const current = getCurrentVaccinesByGroup(pet).get(getVaccineProtectionGroup(vaccine));
      return current && current !== vaccine ? current : null;
    }

    function getNextVaccine(pet) {
      const currents = [...getCurrentVaccinesByGroup(pet).values()];
      if (!currents.length) return null;
      return currents.slice().sort(compareVaccinesForStatusDisplay)[0];
    }

    /** Urgency: expired > approaching > protected (lower score = more urgent). */
    function vaccineStatusUrgency(nextDate) {
      const status = getVaccineProtectionStatus(nextDate);
      if (status === "expired") return 0;
      if (status === "approaching") return 1;
      return 2;
    }

    /**
     * Status strip / emergency nav: urgent first, then combo before rabies/add-ons,
     * then sooner next-due date.
     */
    function compareVaccinesForStatusDisplay(a, b) {
      const urgency = vaccineStatusUrgency(a.next) - vaccineStatusUrgency(b.next);
      if (urgency) return urgency;
      const rank = getVaccineDisplayRank(a) - getVaccineDisplayRank(b);
      if (rank) return rank;
      if (a.next !== b.next) return a.next < b.next ? -1 : 1;
      return 0;
    }

    /** List order: active combo → heartworm inj → rabies → rarer; history last. */
    function compareVaccinesForList(pet, a, b) {
      const aSup = Boolean(getVaccineSuccessor(pet, a));
      const bSup = Boolean(getVaccineSuccessor(pet, b));
      if (aSup !== bSup) return aSup ? 1 : -1;
      if (!aSup) {
        const rank = getVaccineDisplayRank(a) - getVaccineDisplayRank(b);
        if (rank) return rank;
        if (a.next !== b.next) return a.next < b.next ? -1 : 1;
        return getVaccineTier(b) - getVaccineTier(a);
      }
      if (a.given !== b.given) return a.given < b.given ? 1 : -1;
      return 0;
    }

    function isRabiesVaccineEntry(entry) {
      if (!entry) return false;
      if (entry.key === "vRabies") return true;
      const name = String(entry.name || "").trim();
      if (!name) return false;
      if (isRabiesLocalizedName) return isRabiesLocalizedName(name);
      const lower = name.toLowerCase();
      if (lower === "狂犬病" || lower.includes("狂犬")) return true;
      if (lower.includes("rabies")) return true;
      if (lower.includes("광견병")) return true;
      return false;
    }

    function vaccineAllowedForPet(pet, entry) {
      if (pet?.species === "cat" && isRabiesVaccineEntry(entry)) return false;
      return true;
    }

    return {
      PROTECTION_META,
      addYears,
      todayISODate,
      getVaccineProtectionStatus,
      isVaccineApproaching,
      vaccineStatusForNext,
      resolveVaccineKey,
      getVaccineProtectionGroup,
      getVaccineTier,
      getVaccineDisplayRank,
      compareVaccineCurrency,
      getCurrentVaccinesByGroup,
      getVaccineSuccessor,
      getNextVaccine,
      vaccineStatusUrgency,
      compareVaccinesForStatusDisplay,
      compareVaccinesForList,
      isRabiesVaccineEntry,
      vaccineAllowedForPet,
    };
  }

  root.domains.vaccines.createSelectors = createSelectors;
})(typeof window !== "undefined" ? window : globalThis);
