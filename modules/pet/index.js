import { ok, fail, guard } from "../../packages/shared/result.js";

/** @type {Map<string, object>} */
const pets = new Map();
/** @type {Map<string, object[]>} */
const weightsByPet = new Map();

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {object} input
 */
export function createPet(input) {
  return guard(() => {
    if (!input?.name?.trim()) throw new Error("Pet name is required");
    if (!input?.ownerId) throw new Error("ownerId is required");
    const pet = {
      id: input.id || newId("pet"),
      ownerId: input.ownerId,
      name: input.name.trim(),
      species: input.species || "other",
      breed: input.breed || "",
      gender: input.gender || "unknown",
      isNeutered: Boolean(input.isNeutered),
      birthDate: input.birthDate,
      chipNumber: input.chipNumber,
      createdAt: input.createdAt || nowIso(),
    };
    pets.set(pet.id, pet);
    if (!weightsByPet.has(pet.id)) weightsByPet.set(pet.id, []);
    return pet;
  }, "PET_CREATE_FAILED");
}

export function getPetById(petId) {
  return guard(() => {
    const pet = pets.get(petId);
    if (!pet) throw new Error(`Pet not found: ${petId}`);
    return { ...pet };
  }, "PET_NOT_FOUND");
}

export function listPetsByOwner(ownerId) {
  return guard(() => {
    return [...pets.values()]
      .filter((pet) => pet.ownerId === ownerId)
      .map((pet) => ({ ...pet }));
  }, "PET_LIST_FAILED");
}

/**
 * Record a weight. Used by Visit module sync and direct weight entry.
 */
export function recordWeight({ petId, weight, recordedDate, sourceVisitId, id }) {
  return guard(() => {
    if (!pets.has(petId)) throw new Error(`Pet not found: ${petId}`);
    if (!(Number(weight) > 0)) throw new Error("weight must be > 0");
    const entry = {
      id: id || newId("wt"),
      petId,
      weight: Number(weight),
      recordedDate,
      sourceVisitId,
    };
    const list = weightsByPet.get(petId) || [];
    list.push(entry);
    list.sort((a, b) => (a.recordedDate < b.recordedDate ? 1 : -1));
    weightsByPet.set(petId, list);
    return { ...entry };
  }, "PET_WEIGHT_FAILED");
}

export function getLatestWeight(petId) {
  return guard(() => {
    if (!pets.has(petId)) throw new Error(`Pet not found: ${petId}`);
    const list = weightsByPet.get(petId) || [];
    return list.length ? { ...list[0] } : null;
  }, "PET_WEIGHT_FAILED");
}

export function getWeightHistory(petId) {
  return guard(() => {
    if (!pets.has(petId)) throw new Error(`Pet not found: ${petId}`);
    return (weightsByPet.get(petId) || []).map((w) => ({ ...w }));
  }, "PET_WEIGHT_FAILED");
}

/** Test / bootstrap helpers — not part of public contract surface for other modules' business logic */
export function __resetPetStore() {
  pets.clear();
  weightsByPet.clear();
  return ok(true);
}

export function __seedPet(pet, weights = []) {
  pets.set(pet.id, pet);
  weightsByPet.set(
    pet.id,
    [...weights].sort((a, b) => (a.recordedDate < b.recordedDate ? 1 : -1))
  );
  return ok(pet);
}
