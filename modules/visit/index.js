import { ok, fail, guard } from "../../packages/shared/result.js";
import { getPetById, recordWeight } from "../pet/index.js";

/** @type {Map<string, object>} */
const visits = new Map();

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create visit and sync PetWeight (contracts hard rule).
 */
export function createVisit(input) {
  return guard(() => {
    const petResult = getPetById(input.petId);
    if (!petResult.ok) throw new Error(petResult.error.message);
    if (!(Number(input.weightAtVisit) > 0)) {
      throw new Error("weightAtVisit must be > 0");
    }
    if (!input.visitDate) throw new Error("visitDate is required");

    const visit = {
      id: input.id || newId("visit"),
      petId: input.petId,
      visitDate: input.visitDate,
      clinicName: input.clinicName || "",
      weightAtVisit: Number(input.weightAtVisit),
      symptomTags: [...(input.symptomTags || [])],
      notes: input.notes,
      createdBy: input.createdBy || petResult.data.ownerId,
      createdAt: input.createdAt || nowIso(),
    };

    const weightResult = recordWeight({
      petId: visit.petId,
      weight: visit.weightAtVisit,
      recordedDate: visit.visitDate,
      sourceVisitId: visit.id,
    });
    if (!weightResult.ok) {
      throw new Error(`PetWeight sync failed: ${weightResult.error.message}`);
    }

    visits.set(visit.id, visit);
    return { ...visit, symptomTags: [...visit.symptomTags] };
  }, "VISIT_CREATE_FAILED");
}

export function getVisitById(visitId) {
  return guard(() => {
    const visit = visits.get(visitId);
    if (!visit) throw new Error(`Visit not found: ${visitId}`);
    return { ...visit, symptomTags: [...visit.symptomTags] };
  }, "VISIT_NOT_FOUND");
}

export function getVisitsByPetId(petId) {
  return guard(() => {
    const petResult = getPetById(petId);
    if (!petResult.ok) throw new Error(petResult.error.message);
    return [...visits.values()]
      .filter((v) => v.petId === petId)
      .sort((a, b) => (a.visitDate < b.visitDate ? 1 : -1))
      .map((v) => ({ ...v, symptomTags: [...v.symptomTags] }));
  }, "VISIT_LIST_FAILED");
}

export function __resetVisitStore() {
  visits.clear();
  return ok(true);
}

export function __seedVisit(visit) {
  visits.set(visit.id, visit);
  return ok(visit);
}
