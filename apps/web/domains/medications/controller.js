(function initPetLiveWebMedicationsController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.medications = root.domains.medications || {};

  const COMPOUND_DEFAULT_COLORS = {
    liquid: "#6DA6C3",
    liquid_a: "#6DA6C3",
    liquid_b: "#6BAA8E",
    liquid_c: "#E8655A",
    capsule_a: "#E38A6C",
    capsule_b: "#9B8BC4",
    capsule_c: "#C9A227",
  };

  function createController({
    visits,
    searchDrugs: searchDrugsFn,
    getDrugById: getDrugByIdFn,
    localDrugs,
    formatFrequencyLabelOf,
    durationDaysLabelOf,
    compoundFormLabelOf,
    formatDraftDoseLineOf,
  } = {}) {
    if (!visits || typeof visits.findVisitByDateClinic !== "function") {
      throw new TypeError("createController requires visits public API");
    }

    function resolveLocalDrugs() {
      if (typeof localDrugs === "function") return localDrugs() || [];
      return Array.isArray(localDrugs) ? localDrugs : [];
    }

    function normalizeMedUnitForStore(unit) {
      const value = (unit || "").trim();
      if (!value || value === "unrecorded") return "";
      return value;
    }

    function normalizeMedFreqForStore(frequency) {
      const value = (frequency || "").trim();
      if (!value || value === "unrecorded") return "";
      return value;
    }

    function validateMedDraft(draft) {
      if (!draft?.drugName) {
        return { ok: false, reason: "need_drug" };
      }
      if (draft.amount != null && !(draft.amount > 0)) {
        return { ok: false, reason: "dose" };
      }
      if (
        draft.days != null &&
        (!Number.isInteger(draft.days) || draft.days <= 0)
      ) {
        return { ok: false, reason: "days" };
      }
      return { ok: true };
    }

    function draftFromFields(fields = {}) {
      const amountRaw = fields.dosageAmount;
      const daysRaw = fields.durationDays;
      const amount =
        amountRaw === "" || amountRaw == null ? null : Number(amountRaw);
      const days =
        daysRaw === "" || daysRaw == null ? null : Number(daysRaw);
      const compoundGroup = String(fields.compoundGroup || "").trim();
      return {
        amount: amount != null && amount > 0 ? amount : null,
        days: Number.isInteger(days) && days > 0 ? days : null,
        unit: normalizeMedUnitForStore(fields.dosageUnit || fields.unit || ""),
        frequency: normalizeMedFreqForStore(
          fields.frequency || fields.medFrequency || ""
        ),
        compoundGroup,
        compoundColor: compoundGroup
          ? String(fields.compoundColor || "").trim()
          : "",
        sourcePreset:
          fields.sourcePreset === "clinic_ref" ? "clinic_ref" : "owner",
        drugName: String(fields.drugName || "").trim(),
      };
    }

    function defaultCompoundColor(group) {
      return COMPOUND_DEFAULT_COLORS[group] || COMPOUND_DEFAULT_COLORS.liquid_a;
    }

    function resolveCompoundColor(group, explicit, colorByGroup) {
      if (explicit) return explicit;
      if (group && colorByGroup && colorByGroup[group]) {
        return colorByGroup[group];
      }
      return group ? defaultCompoundColor(group) : "";
    }

    function setCompoundColorOverride(colorByGroup, group, hex) {
      if (!colorByGroup || !group || !hex) return;
      colorByGroup[group] = hex;
    }

    function createPendingId(pendingMeds) {
      const len = Array.isArray(pendingMeds) ? pendingMeds.length : 0;
      return `pm-${Date.now()}-${len}`;
    }

    function doseLineForDraft(draft) {
      if (typeof formatDraftDoseLineOf === "function") {
        return formatDraftDoseLineOf(draft);
      }
      return draft?.dose || "";
    }

    function buildPendingItem(draft, { localId, pendingMeds } = {}) {
      return {
        localId: localId || createPendingId(pendingMeds),
        name: draft.drugName,
        dose: doseLineForDraft(draft),
        source: draft.sourcePreset,
        frequency: draft.frequency || "",
        durationDays: draft.days || null,
        amount: draft.amount || null,
        unit: draft.unit || "",
        compoundGroup: draft.compoundGroup || "",
        compoundColor: draft.compoundColor || "",
      };
    }

    function pushPendingMed(pendingMeds, draft) {
      if (!Array.isArray(pendingMeds)) {
        throw new TypeError("pushPendingMed requires pendingMeds array");
      }
      const item = buildPendingItem(draft, { pendingMeds });
      pendingMeds.push(item);
      return item;
    }

    function removePendingMed(pendingMeds, localId) {
      if (!Array.isArray(pendingMeds)) return [];
      return pendingMeds.filter((med) => med.localId !== localId);
    }

    function setPendingCompoundGroup(
      pendingMeds,
      localId,
      group,
      colorByGroup
    ) {
      if (!Array.isArray(pendingMeds)) return null;
      const med = pendingMeds.find((item) => item.localId === localId);
      if (!med) return null;
      med.compoundGroup = group || "";
      if (med.compoundGroup) {
        med.compoundColor = resolveCompoundColor(
          med.compoundGroup,
          med.compoundColor,
          colorByGroup
        );
        if (colorByGroup) {
          setCompoundColorOverride(
            colorByGroup,
            med.compoundGroup,
            med.compoundColor
          );
        }
      } else {
        med.compoundColor = "";
      }
      return med;
    }

    function pendingMedScheduleKey(med) {
      return `${med?.frequency || ""}|${med?.durationDays || ""}`;
    }

    function pendingMedHasCompoundTag(med) {
      return Boolean(med?.compoundGroup);
    }

    function newMedId(petId, suffix) {
      return `m-${petId}-${suffix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;
    }

    function buildVisitMedicationsFromPending(pendingMeds, petId, labelOf) {
      const compoundLabel =
        typeof labelOf === "function"
          ? labelOf
          : typeof compoundFormLabelOf === "function"
            ? compoundFormLabelOf
            : (form) => form;
      const freqLabel =
        typeof formatFrequencyLabelOf === "function"
          ? formatFrequencyLabelOf
          : (code) => code || "";
      const daysLabel =
        typeof durationDaysLabelOf === "function"
          ? durationDaysLabelOf
          : (n) => String(n);

      const feedingUnits = [];
      const groupBuckets = new Map();
      const list = Array.isArray(pendingMeds) ? pendingMeds : [];

      list.forEach((med) => {
        const group = med.compoundGroup || "";
        if (!group) {
          feedingUnits.push({
            id: newMedId(petId, feedingUnits.length),
            name: med.name,
            dose: med.dose,
            source: med.source,
            frequency: med.frequency,
            durationDays: med.durationDays,
          });
          return;
        }
        const key = `${group}|${pendingMedScheduleKey(med)}`;
        if (!groupBuckets.has(key)) groupBuckets.set(key, []);
        groupBuckets.get(key).push(med);
      });

      groupBuckets.forEach((members, key) => {
        const [form] = key.split("|");
        if (members.length < 2) {
          members.forEach((med) => {
            feedingUnits.push({
              id: newMedId(petId, feedingUnits.length),
              name: med.name,
              dose: med.dose,
              source: med.source,
              frequency: med.frequency,
              durationDays: med.durationDays,
            });
          });
          return;
        }
        const sample = members[0];
        const compoundColor =
          sample.compoundColor || resolveCompoundColor(form);
        feedingUnits.push({
          id: `m-${petId}-cmp-${Date.now()}-${feedingUnits.length}`,
          kind: "compound_bundle",
          name: compoundLabel(form),
          dose: `${freqLabel(sample.frequency)} · ${daysLabel(
            sample.durationDays
          )}`,
          source: sample.source,
          compoundForm: form,
          compoundColor,
          frequency: sample.frequency,
          durationDays: sample.durationDays,
          ingredients: members.map((med) => ({
            name: med.name,
            dose: med.dose,
            source: med.source,
          })),
        });
      });

      return feedingUnits;
    }

    function appendPhotoBundleToVisit(
      visit,
      pet,
      { bagPhoto, rxPhoto, drugPhoto, name, dosePendingText } = {}
    ) {
      if (!visit) throw new TypeError("appendPhotoBundleToVisit requires visit");
      const hasProof = Boolean(bagPhoto || rxPhoto || drugPhoto);
      if (hasProof) {
        visit.bagPhoto = bagPhoto || visit.bagPhoto || null;
        visit.rxPhoto = rxPhoto || visit.rxPhoto || null;
        visit.drugPhoto = drugPhoto || visit.drugPhoto || null;
      }
      if (!Array.isArray(visit.medications)) visit.medications = [];
      const med = {
        id: `m-${pet?.id || "pet"}-photo-${Date.now()}`,
        kind: "photo_bundle",
        name: name || "",
        dose: dosePendingText || "",
        source: hasProof ? "owner_proof" : "owner",
        bagPhoto: bagPhoto || null,
        rxPhoto: rxPhoto || null,
        drugPhoto: drugPhoto || null,
        structuredPending: true,
      };
      visit.medications.push(med);
      return med;
    }

    function appendUnitsToVisit(visit, units) {
      if (!visit) return;
      if (!Array.isArray(visit.medications)) visit.medications = [];
      (units || []).forEach((med) => {
        if (!med.startDate) med.startDate = visit.date;
        visit.medications.push(med);
      });
    }

    function findVisitForMedSave(
      pet,
      { date, clinicId, clinicName } = {}
    ) {
      return visits.findVisitByDateClinic(pet, {
        date,
        clinicId,
        clinicName,
      });
    }

    function applyVisitWeightOnMedSave(pet, visit, weightKg) {
      if (!pet?.visits || !visit) {
        return { ok: false, reason: "missing_visit" };
      }
      const visitIndex = pet.visits.indexOf(visit);
      if (visitIndex < 0) {
        return { ok: false, reason: "missing_visit" };
      }
      if (typeof visits.saveVisitWeight !== "function") {
        return { ok: false, reason: "missing_helper" };
      }
      return visits.saveVisitWeight(pet, visitIndex, weightKg);
    }

    function searchLocal(query) {
      const q = String(query || "")
        .trim()
        .toLowerCase();
      if (!q) return [];
      return resolveLocalDrugs().filter((drug) => {
        const hay = [
          drug.genericName,
          drug.brandNameZh,
          drug.brandNameEn,
          drug.drugClass,
          drug.purpose,
          ...(drug.commonAliases || []),
          ...(drug.commonSideEffects || []),
          ...(drug.precautions || []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    function searchDrugs(query) {
      if (typeof searchDrugsFn === "function") {
        const result = searchDrugsFn(query);
        if (Array.isArray(result)) return result;
        if (result && typeof result === "object" && "ok" in result) {
          if (result.ok) return result.data || [];
          return [];
        }
        if (result == null) {
          return searchLocal(query);
        }
        return [];
      }
      return searchLocal(query);
    }

    function resolveEnrichedDrug(drugOrId) {
      const id = typeof drugOrId === "string" ? drugOrId : drugOrId?.id;
      const list = resolveLocalDrugs();
      if (id && list.length) {
        const local = list.find((item) => item.id === id);
        if (local) return local;
      }
      if (id && typeof getDrugByIdFn === "function") {
        const fromApi = getDrugByIdFn(id);
        if (fromApi && typeof fromApi === "object" && "ok" in fromApi) {
          if (fromApi.ok && fromApi.data) return fromApi.data;
        } else if (fromApi) {
          return fromApi;
        }
      }
      return typeof drugOrId === "object" && drugOrId ? drugOrId : null;
    }

    return {
      normalizeMedUnitForStore,
      normalizeMedFreqForStore,
      validateMedDraft,
      draftFromFields,
      defaultCompoundColor,
      resolveCompoundColor,
      setCompoundColorOverride,
      createPendingId,
      buildPendingItem,
      pushPendingMed,
      removePendingMed,
      setPendingCompoundGroup,
      pendingMedScheduleKey,
      pendingMedHasCompoundTag,
      buildVisitMedicationsFromPending,
      appendPhotoBundleToVisit,
      appendUnitsToVisit,
      findVisitForMedSave,
      applyVisitWeightOnMedSave,
      searchDrugs,
      resolveEnrichedDrug,
      COMPOUND_DEFAULT_COLORS,
    };
  }

  root.domains.medications.createController = createController;
  root.domains.medications.COMPOUND_DEFAULT_COLORS = COMPOUND_DEFAULT_COLORS;
})(typeof window !== "undefined" ? window : globalThis);
