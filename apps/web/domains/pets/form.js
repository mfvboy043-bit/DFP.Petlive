(function initPetLiveWebPetsForm(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.pets = root.domains.pets || {};

  /**
   * Pure pet-form field validation. Toast mapping stays in the facade.
   * @returns {{ ok: true } | { ok: false, reason: string }}
   */
  function validatePetIdentityFields({
    name,
    breed,
    weight,
    birthDate,
    weightDate,
    todayISO,
  } = {}) {
    if (!name) return { ok: false, reason: "need_name" };
    if (!breed) return { ok: false, reason: "need_breed" };
    if (!(Number(weight) > 0)) return { ok: false, reason: "weight" };
    if (!birthDate) return { ok: false, reason: "need_birth" };
    if (todayISO && birthDate > todayISO) {
      return { ok: false, reason: "birth_future" };
    }
    if (!weightDate) return { ok: false, reason: "need_weight_date" };
    return { ok: true };
  }

  /**
   * Build identity payload for lifecycle create/update.
   * @param {object} fields already-trimmed/resolved form values
   * @param {{ label: function }} options
   */
  function buildPetIdentity(fields = {}, { label } = {}) {
    if (typeof label !== "function") {
      throw new TypeError("buildPetIdentity requires label(key)");
    }
    const species = fields.species || "dog";
    const chipNumber = String(fields.chipNumber || "").trim();
    return {
      name: String(fields.name || "").trim(),
      species,
      speciesLabel: label(species) || label("other"),
      breedKey: fields.breedKey,
      breed: fields.breed,
      gender: fields.gender,
      isNeutered: fields.isNeutered,
      birthDate: fields.birthDate,
      weight: Number(fields.weight),
      weightDate: fields.weightDate,
      chipNumber: chipNumber || undefined,
    };
  }

  root.domains.pets.validatePetIdentityFields = validatePetIdentityFields;
  root.domains.pets.buildPetIdentity = buildPetIdentity;
})(typeof window !== "undefined" ? window : globalThis);
