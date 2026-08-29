(function initPetLiveWebWeightController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.weight = root.domains.weight || {};

  const { toKg, normalizeDateKey } = root.domains.weight;

  function ensureWeightLogs(pet) {
    if (!Array.isArray(pet.weightLogs)) {
      pet.weightLogs = [];
    }
    return pet.weightLogs;
  }

  function sortLogsDesc(logs) {
    return (logs || []).slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }

  function getManualLogs(pet) {
    return sortLogsDesc(ensureWeightLogs(pet));
  }

  function maybeUpdatePetLatestWeight(pet, date, weightKg) {
    const currentDate = normalizeDateKey(pet.weightDate);
    if (!currentDate || date >= currentDate) {
      pet.weight = weightKg;
      pet.weightDate = date;
    }
  }

  function validateDraft(draft) {
    const date = normalizeDateKey(draft?.date);
    const unit = draft?.unit === "lb" ? "lb" : "kg";
    const weightKg = toKg(draft?.weight, unit);
    if (!date) return { ok: false, reason: "needDate" };
    if (weightKg == null) return { ok: false, reason: "needWeight" };
    return { ok: true, draft: { date, weightKg, unit } };
  }

  function buildLog(draft) {
    return {
      id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: draft.date,
      weightKg: draft.weightKg,
      source: "manual",
      createdAt: new Date().toISOString(),
    };
  }

  function addLog(pet, draft) {
    if (!pet) return { ok: false, reason: "noPet" };
    const validation = validateDraft(draft);
    if (!validation.ok) return validation;

    const record = buildLog(validation.draft);
    ensureWeightLogs(pet).unshift(record);
    maybeUpdatePetLatestWeight(pet, record.date, record.weightKg);
    return { ok: true, record, pet };
  }

  function removeLog(pet, logId) {
    if (!pet || !logId) return { ok: false, reason: "missing" };
    const list = ensureWeightLogs(pet);
    const before = list.length;
    pet.weightLogs = list.filter((row) => row.id !== logId);
    return { ok: pet.weightLogs.length < before, pet };
  }

  function createController() {
    return {
      ensureWeightLogs,
      sortLogsDesc,
      getManualLogs,
      validateDraft,
      buildLog,
      addLog,
      removeLog,
    };
  }

  root.domains.weight.ensureWeightLogs = ensureWeightLogs;
  root.domains.weight.sortLogsDesc = sortLogsDesc;
  root.domains.weight.getManualLogs = getManualLogs;
  root.domains.weight.validateDraft = validateDraft;
  root.domains.weight.buildLog = buildLog;
  root.domains.weight.addLog = addLog;
  root.domains.weight.removeLog = removeLog;
  root.domains.weight.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
