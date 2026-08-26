(function initPetLiveWebPetsLifecycle(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.pets = root.domains.pets || {};

  const IDENTITY_KEYS = [
    "name",
    "species",
    "speciesLabel",
    "breedKey",
    "breed",
    "gender",
    "isNeutered",
    "birthDate",
    "weight",
    "weightDate",
    "chipNumber",
  ];

  function pickIdentity(identity) {
    const out = {};
    if (!identity || typeof identity !== "object") return out;
    for (const key of IDENTITY_KEYS) {
      if (Object.prototype.hasOwnProperty.call(identity, key)) {
        out[key] = identity[key];
      }
    }
    return out;
  }

  function nextCurrentAfterRemoval(pets, removedId, currentPetId) {
    const wasCurrent = currentPetId === removedId;
    const currentMissing =
      currentPetId == null || !pets.some((item) => item.id === currentPetId);
    if (wasCurrent || currentMissing) {
      return pets[0]?.id || null;
    }
    return undefined;
  }

  function createLifecycle({ pets, archivedPets, tones, newId } = {}) {
    if (!Array.isArray(pets) || !Array.isArray(archivedPets)) {
      throw new TypeError("createLifecycle requires pets and archivedPets arrays");
    }

    const toneList = Array.isArray(tones) && tones.length ? tones : ["#355f54"];
    const makeId =
      typeof newId === "function" ? newId : () => `p${Date.now()}`;

    function createPet(identity, options = {}) {
      const tone =
        options.tone != null
          ? options.tone
          : toneList[pets.length % toneList.length];
      return {
        id: makeId(),
        ...pickIdentity(identity),
        tone,
        alertCount: 0,
        alerts: [],
        meds: [],
        visits: [],
        vaccines: [],
        parasitePrevention: {
          external: null,
          heartworm: null,
        },
      };
    }

    function updatePet(pet, identity) {
      if (!pet || typeof pet !== "object") {
        throw new TypeError("updatePet requires a pet object");
      }
      Object.assign(pet, pickIdentity(identity));
      return pet;
    }

    function archivePet(petId, options = {}) {
      const passedAwayDate = options.passedAwayDate;
      if (!passedAwayDate) {
        return { ok: false, reason: "missing_passed_away_date" };
      }
      const index = pets.findIndex((item) => item.id === petId);
      if (index < 0) {
        return { ok: false, reason: "not_found" };
      }
      const [archived] = pets.splice(index, 1);
      archived.passedAwayDate = passedAwayDate;
      archived.memorialNote = options.memorialNote || "";
      archivedPets.unshift(archived);
      const nextCurrentPetId = nextCurrentAfterRemoval(
        pets,
        archived.id,
        options.currentPetId
      );
      const result = { ok: true, archived };
      if (nextCurrentPetId !== undefined) {
        result.nextCurrentPetId = nextCurrentPetId;
      }
      return result;
    }

    function removePet(petId, options = {}) {
      const index = pets.findIndex((item) => item.id === petId);
      if (index < 0) {
        return { ok: false, reason: "not_found" };
      }
      const [removed] = pets.splice(index, 1);
      const nextCurrentPetId = nextCurrentAfterRemoval(
        pets,
        removed.id,
        options.currentPetId
      );
      const result = { ok: true, removed };
      if (nextCurrentPetId !== undefined) {
        result.nextCurrentPetId = nextCurrentPetId;
      }
      return result;
    }

    return { createPet, updatePet, archivePet, removePet };
  }

  root.domains.pets.createLifecycle = createLifecycle;
})(typeof window !== "undefined" ? window : globalThis);
