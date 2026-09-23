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
    resolveEnrichedDrug: resolveEnrichedDrugFn,
    formatFrequencyLabelOf,
    durationDaysLabelOf,
    compoundFormLabelOf,
    formatDraftDoseLineOf,
  } = {}) {
    if (!visits || typeof visits.findVisitByDateClinic !== "function") {
      throw new TypeError("createController requires visits public API");
    }
    if (typeof searchDrugsFn !== "function") {
      throw new TypeError("createController requires searchDrugs from drugs adapter");
    }
    if (typeof resolveEnrichedDrugFn !== "function") {
      throw new TypeError(
        "createController requires resolveEnrichedDrug from drugs adapter"
      );
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

    function applyDraftToPendingMed(pendingMeds, localId, draft) {
      if (!Array.isArray(pendingMeds) || !localId) {
        return { ok: false, reason: "missing_med" };
      }
      if (!draft?.drugName) return { ok: false, reason: "need_drug" };
      const index = pendingMeds.findIndex((item) => item.localId === localId);
      if (index < 0) return { ok: false, reason: "missing_med" };
      pendingMeds[index] = buildPendingItem(draft, {
        localId,
        pendingMeds,
      });
      return { ok: true, item: pendingMeds[index] };
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
            amount: med.amount || null,
            unit: med.unit || "",
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
              amount: med.amount || null,
              unit: med.unit || "",
            });
          });
          return;
        }
        const sample = members[0];
        const compoundColor =
          sample.compoundColor || resolveCompoundColor(form);
        const doseParts = [];
        if (sample.frequency) doseParts.push(freqLabel(sample.frequency));
        if (Number.isInteger(sample.durationDays) && sample.durationDays > 0) {
          doseParts.push(daysLabel(sample.durationDays));
        }
        feedingUnits.push({
          id: `m-${petId}-cmp-${Date.now()}-${feedingUnits.length}`,
          kind: "compound_bundle",
          name: compoundLabel(form),
          dose: doseParts.join(" · "),
          source: sample.source,
          compoundForm: form,
          compoundColor,
          frequency: sample.frequency,
          durationDays: sample.durationDays,
          ingredients: members.map((med) => ({
            name: med.name,
            dose: med.dose,
            source: med.source,
            amount: med.amount || null,
            unit: med.unit || "",
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

    const DOSE_UNIT_ALIASES = {
      mg: "mg",
      ml: "ml",
      tablet: "tablet",
      tab: "tablet",
    };

    function parseAmountUnitFromDose(dose) {
      const text = String(dose || "").trim();
      const match = text.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]+)?/);
      if (!match) return { amount: null, unit: "" };
      const amount = Number(match[1]);
      const raw = String(match[2] || "").toLowerCase();
      return {
        amount: amount > 0 ? amount : null,
        unit: DOSE_UNIT_ALIASES[raw] || "",
      };
    }

    function draftFromSavedMed(med, parent) {
      const source = med?.source || parent?.source || "owner";
      const parsed = parseAmountUnitFromDose(med?.dose);
      const amountRaw = med?.amount ?? med?.dosageAmount ?? parsed.amount;
      const amount = amountRaw != null && Number(amountRaw) > 0 ? Number(amountRaw) : null;
      const daysRaw = med?.durationDays ?? parent?.durationDays;
      const days =
        daysRaw != null && Number.isInteger(Number(daysRaw)) && Number(daysRaw) > 0
          ? Number(daysRaw)
          : null;
      return {
        drugName: String(med?.name || "").trim(),
        amount,
        unit: normalizeMedUnitForStore(med?.unit || med?.dosageUnit || parsed.unit),
        frequency: normalizeMedFreqForStore(med?.frequency || parent?.frequency || ""),
        days,
        sourcePreset: source === "clinic_ref" ? "clinic_ref" : "owner",
        compoundGroup: String(med?.compoundGroup || parent?.compoundForm || "").trim(),
        compoundColor: String(med?.compoundColor || parent?.compoundColor || "").trim(),
      };
    }

    function findVisitMed(visit, ref = {}) {
      const list = Array.isArray(visit?.medications) ? visit.medications : [];
      let index = -1;
      if (ref.medId) {
        index = list.findIndex((item) => item && item.id === ref.medId);
      }
      if (index < 0 && Number.isInteger(ref.medIndex)) {
        index = ref.medIndex;
      }
      const med = index >= 0 ? list[index] : null;
      if (!med) return { ok: false, reason: "missing_med" };
      if (ref.ingredientIndex == null || ref.ingredientIndex === "") {
        return { ok: true, med, list, index };
      }
      const ingredientIndex = Number(ref.ingredientIndex);
      const ingredients = Array.isArray(med.ingredients) ? med.ingredients : [];
      const ingredient = ingredients[ingredientIndex];
      if (!ingredient) return { ok: false, reason: "missing_ingredient" };
      return { ok: true, med, ingredient, ingredients, list, index, ingredientIndex };
    }

    function applyDraftToVisitMed(visit, ref, draft) {
      const found = findVisitMed(visit, ref);
      if (!found.ok) return found;
      if (!draft?.drugName) return { ok: false, reason: "need_drug" };
      const target = found.ingredient || found.med;
      target.name = draft.drugName;
      target.dose = doseLineForDraft(draft);
      target.frequency = draft.frequency || "";
      target.durationDays = draft.days || null;
      target.amount = draft.amount || null;
      target.unit = draft.unit || "";
      if (!found.ingredient) {
        target.source = draft.sourcePreset === "clinic_ref" ? "clinic_ref" : "owner";
      } else if (draft.sourcePreset) {
        target.source = draft.sourcePreset === "clinic_ref" ? "clinic_ref" : "owner";
      }
      return { ok: true, med: found.med, target };
    }

    function pendingFromCompoundBundle(bundle) {
      const ingredients = Array.isArray(bundle?.ingredients)
        ? bundle.ingredients
        : [];
      const pending = [];
      ingredients.forEach((ing) => {
        const draft = draftFromSavedMed(ing, bundle);
        draft.compoundGroup = bundle?.compoundForm || draft.compoundGroup;
        draft.compoundColor = bundle?.compoundColor || draft.compoundColor;
        pending.push(buildPendingItem(draft, { pendingMeds: pending }));
      });
      return pending;
    }

    function replaceVisitMedication(visit, ref, units) {
      const found = findVisitMed(visit, {
        medId: ref?.medId,
        medIndex: ref?.medIndex,
      });
      if (!found.ok) return found;
      const next = Array.isArray(units) ? units.slice() : [];
      next.forEach((med) => {
        if (!med.startDate) med.startDate = visit?.date;
      });
      if (!next.length) {
        found.list.splice(found.index, 1);
        return { ok: true, removed: true, units: [] };
      }
      found.list.splice(found.index, 1, ...next);
      return { ok: true, units: next };
    }

    function removeVisitMedication(visit, ref) {
      const found = findVisitMed(visit, ref);
      if (!found.ok) return found;
      if (Number.isInteger(found.ingredientIndex)) {
        const ingredients = Array.isArray(found.med?.ingredients)
          ? found.med.ingredients
          : [];
        if (!ingredients[found.ingredientIndex]) {
          return { ok: false, reason: "missing_ingredient" };
        }
        ingredients.splice(found.ingredientIndex, 1);
        if (!ingredients.length) {
          found.list.splice(found.index, 1);
        }
        return { ok: true, removed: "ingredient" };
      }
      found.list.splice(found.index, 1);
      return { ok: true, removed: "med" };
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

    function searchDrugs(query) {
      const result = searchDrugsFn(query);
      if (Array.isArray(result)) return result;
      if (result && typeof result === "object" && "ok" in result) {
        if (result.ok) return result.data || [];
        return [];
      }
      return [];
    }

    function resolveEnrichedDrug(drugOrId) {
      return resolveEnrichedDrugFn(drugOrId);
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
      applyDraftToPendingMed,
      setPendingCompoundGroup,
      pendingMedScheduleKey,
      pendingMedHasCompoundTag,
      buildVisitMedicationsFromPending,
      appendPhotoBundleToVisit,
      appendUnitsToVisit,
      parseAmountUnitFromDose,
      draftFromSavedMed,
      findVisitMed,
      applyDraftToVisitMed,
      pendingFromCompoundBundle,
      replaceVisitMedication,
      removeVisitMedication,
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
