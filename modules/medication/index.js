import { ok, fail, guard } from "../../packages/shared/result.js";
import { getVisitById, getVisitsByPetId } from "../visit/index.js";
import { getDrugById } from "../drug/index.js";

/** @type {Map<string, object>} */
const medications = new Map();

const DOSAGE_UNITS = new Set(["mg", "ml", "tablet"]);

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Contract validation rules (QA §9 / Medication §4).
 */
export function validateMedicationInput(input) {
  const status = input.status || "complete";
  if (status === "pending_drug_name") {
    return ok(true);
  }

  if (!(Number(input.dosageAmount) > 0)) {
    return fail("MED_INVALID_DOSE", "dosageAmount must be > 0");
  }
  if (!DOSAGE_UNITS.has(input.dosageUnit)) {
    return fail("MED_INVALID_UNIT", "dosageUnit must be mg | ml | tablet");
  }
  const days = Number(input.durationDays);
  if (!Number.isInteger(days) || days <= 0) {
    return fail("MED_INVALID_DURATION", "durationDays must be a positive integer");
  }
  const hasDrug = input.drugId != null && input.drugId !== "";
  const unrecognized = (input.unrecognizedDrugName || "").trim();
  if (!hasDrug && !unrecognized) {
    return fail(
      "MED_DRUG_REQUIRED",
      "unrecognizedDrugName is required when drugId is null"
    );
  }
  if (hasDrug && unrecognized) {
    return fail(
      "MED_DRUG_XOR",
      "drugId and unrecognizedDrugName cannot both be set"
    );
  }
  return ok(true);
}

export function createMedication(input) {
  return guard(() => {
    const validation = validateMedicationInput(input);
    if (!validation.ok) throw new Error(validation.error.message);

    const visitResult = getVisitById(input.visitId);
    if (!visitResult.ok) throw new Error(visitResult.error.message);

    if (input.drugId) {
      const drugResult = getDrugById(input.drugId);
      if (!drugResult.ok) throw new Error(drugResult.error.message);
    }

    const status = input.status || "complete";
    const med = {
      id: input.id || newId("med"),
      visitId: input.visitId,
      kind: input.kind || (status === "pending_drug_name" ? "photo_bundle" : "single"),
      status,
      drugId: input.drugId ?? null,
      unrecognizedDrugName: input.drugId
        ? null
        : (input.unrecognizedDrugName || "").trim() || null,
      dosageAmount:
        input.dosageAmount == null ? undefined : Number(input.dosageAmount),
      dosageUnit: input.dosageUnit,
      frequency: input.frequency || (status === "complete" ? "SID" : undefined),
      durationDays:
        input.durationDays == null ? undefined : Number(input.durationDays),
      startDate: input.startDate,
      inputSource: input.inputSource || "owner",
      hasDisclaimer: Boolean(input.hasDisclaimer),
      bagPhoto: input.bagPhoto,
      rxPhoto: input.rxPhoto,
      drugPhoto: input.drugPhoto,
      attachmentUrl: input.attachmentUrl,
      compoundForm: input.compoundForm,
      compoundColor: input.compoundColor,
      compoundGroup: input.compoundGroup,
      ingredients: input.ingredients,
      createdAt: input.createdAt || nowIso(),
    };

    medications.set(med.id, med);
    return { ...med };
  }, "MED_CREATE_FAILED");
}

export function getMedicationsByVisitId(visitId) {
  return guard(() => {
    const visitResult = getVisitById(visitId);
    if (!visitResult.ok) throw new Error(visitResult.error.message);
    return [...medications.values()]
      .filter((m) => m.visitId === visitId)
      .map((m) => ({ ...m }));
  }, "MED_LIST_FAILED");
}

export function getMedicationHistory(petId) {
  return guard(() => {
    const visitsResult = getVisitsByPetId(petId);
    if (!visitsResult.ok) throw new Error(visitsResult.error.message);
    const visitIds = new Set(visitsResult.data.map((v) => v.id));
    return [...medications.values()]
      .filter((m) => visitIds.has(m.visitId))
      .map((m) => ({ ...m }));
  }, "MED_HISTORY_FAILED");
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Active = visitDate + durationDays - 1 >= asOfDate */
export function getCurrentMedications(petId, asOfDate = new Date().toISOString().slice(0, 10)) {
  return guard(() => {
    const history = getMedicationHistory(petId);
    if (!history.ok) throw new Error(history.error.message);
    const visitsResult = getVisitsByPetId(petId);
    if (!visitsResult.ok) throw new Error(visitsResult.error.message);
    const visitDateById = new Map(
      visitsResult.data.map((v) => [v.id, v.visitDate])
    );

    return history.data.filter((med) => {
      const start = visitDateById.get(med.visitId);
      if (!start) return false;
      const end = addDays(start, med.durationDays - 1);
      return end >= asOfDate;
    });
  }, "MED_CURRENT_FAILED");
}

export function __resetMedicationStore() {
  medications.clear();
  return ok(true);
}

export function __seedMedication(med) {
  medications.set(med.id, med);
  return ok(med);
}
