(function initPetLiveWebState(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});

  function createAppState({ pets, archivedPets, initialPetId }) {
    if (!Array.isArray(pets) || !Array.isArray(archivedPets)) {
      throw new TypeError("createAppState requires pets and archivedPets arrays");
    }

    let currentPetId = pets.some((pet) => pet.id === initialPetId)
      ? initialPetId
      : pets[0]?.id || null;

    function ensureCurrentPetId() {
      if (pets.some((pet) => pet.id === currentPetId)) return currentPetId;
      currentPetId = pets[0]?.id || null;
      return currentPetId;
    }

    function getPets() {
      return pets;
    }

    function getArchivedPets() {
      return archivedPets;
    }

    function getCurrentPetId() {
      return ensureCurrentPetId();
    }

    function getCurrentPet() {
      const id = ensureCurrentPetId();
      return id == null ? null : pets.find((pet) => pet.id === id) || null;
    }

    function hasPet(id) {
      return pets.some((pet) => pet.id === id);
    }

    function setCurrentPetId(id) {
      if (!hasPet(id)) {
        ensureCurrentPetId();
        return false;
      }
      currentPetId = id;
      return true;
    }

    function getSnapshot() {
      return {
        pets,
        archivedPets,
        currentPetId: ensureCurrentPetId(),
        currentPet: getCurrentPet(),
      };
    }

    return {
      getPets,
      getArchivedPets,
      getCurrentPetId,
      getCurrentPet,
      hasPet,
      setCurrentPetId,
      getSnapshot,
    };
  }

  root.state = { ...(root.state || {}), createAppState };
})(typeof window !== "undefined" ? window : globalThis);
