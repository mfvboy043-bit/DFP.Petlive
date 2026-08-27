(function initPetLiveWebCorePetsGraph(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.core = root.core || {};

  /**
   * Single write door for active/archived pets graph (still pets[] backed).
   * Does not dual-write modules/* — slot + in-memory arrays only.
   *
   * Structural mutates allowed here: replaceGraph / clearGraph / pushPet / hydrate.
   * Nested content mutates stay in domain controllers + schedulePersist.
   */
  function createPetsGraph({
    pets,
    archivedPets,
    slot,
    getCurrentPetId,
    onAfterScheduleWrite,
    cloneSeedPets,
  } = {}) {
    if (!Array.isArray(pets) || !Array.isArray(archivedPets)) {
      throw new TypeError("createPetsGraph requires pets and archivedPets arrays");
    }
    if (
      !slot ||
      typeof slot.read !== "function" ||
      typeof slot.scheduleWrite !== "function"
    ) {
      throw new TypeError("createPetsGraph requires slot with read/scheduleWrite");
    }

    function replaceGraph({
      pets: nextPets = [],
      archivedPets: nextArchived = [],
    } = {}) {
      pets.length = 0;
      archivedPets.length = 0;
      for (const pet of nextPets || []) pets.push(pet);
      for (const pet of nextArchived || []) archivedPets.push(pet);
      return { pets, archivedPets };
    }

    function clearGraph() {
      return replaceGraph({ pets: [], archivedPets: [] });
    }

    function hydrate() {
      const data = slot.read();
      const seed =
        typeof cloneSeedPets === "function" ? cloneSeedPets() : [];
      const nextPets = data.pets?.length ? data.pets : seed;
      replaceGraph({
        pets: nextPets,
        archivedPets: data.archivedPets || [],
      });
      return data.currentPetId || pets[0]?.id || null;
    }

    function schedulePersist() {
      const id =
        typeof getCurrentPetId === "function" ? getCurrentPetId() : null;
      slot.scheduleWrite({
        version: 1,
        pets,
        archivedPets,
        currentPetId: id || null,
      });
      if (typeof onAfterScheduleWrite === "function") {
        onAfterScheduleWrite();
      }
    }

    function pushPet(pet) {
      pets.push(pet);
      return pet;
    }

    function findActive(petId) {
      return pets.find((item) => item.id === petId) || null;
    }

    return {
      hydrate,
      schedulePersist,
      pushPet,
      replaceGraph,
      clearGraph,
      findActive,
      getPets: () => pets,
      getArchivedPets: () => archivedPets,
    };
  }

  root.core.createPetsGraph = createPetsGraph;
})(typeof window !== "undefined" ? window : globalThis);
