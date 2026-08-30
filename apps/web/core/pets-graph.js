(function initPetLiveWebCorePetsGraph(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.core = root.core || {};

  /**
   * Local graph lean write: strip only avatar `photo` (lives in pet-photos slot).
   * Visit/Rx/imaging proofs stay in pets[] — no alternate durable store yet (SEC-1).
   * Drive/cloud keep their own broader strip in domains/cloud/controller.js.
   */
  const LOCAL_STRIP_MEDIA_KEYS = new Set(["photo"]);

  function stripAvatarPhotoForLocalPersist(value) {
    if (Array.isArray(value)) return value.map(stripAvatarPhotoForLocalPersist);
    if (!value || typeof value !== "object") return value;
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (LOCAL_STRIP_MEDIA_KEYS.has(key)) continue;
      out[key] = stripAvatarPhotoForLocalPersist(val);
    }
    return out;
  }

  /** @deprecated alias — cloud should use domains/cloud strip; local uses avatar-only. */
  function stripHeavyMedia(value) {
    return stripAvatarPhotoForLocalPersist(value);
  }

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
    selectionSlot,
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

    function readSelectionId() {
      if (!selectionSlot || typeof selectionSlot.read !== "function") return null;
      const selected = selectionSlot.read();
      if (typeof selected === "string") return selected;
      if (selected && typeof selected === "object" && selected.currentPetId) {
        return selected.currentPetId;
      }
      return null;
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
      return readSelectionId() || data.currentPetId || pets[0]?.id || null;
    }

    function currentId() {
      return typeof getCurrentPetId === "function" ? getCurrentPetId() : null;
    }

    function schedulePersist() {
      const id = currentId();
      slot.scheduleWrite({
        version: 1,
        pets: stripAvatarPhotoForLocalPersist(pets),
        archivedPets: stripAvatarPhotoForLocalPersist(archivedPets),
        currentPetId: id || null,
      });
      if (selectionSlot && typeof selectionSlot.scheduleWrite === "function") {
        selectionSlot.scheduleWrite({ currentPetId: id || null });
      }
      if (typeof onAfterScheduleWrite === "function") {
        onAfterScheduleWrite();
      }
    }

    /** Tiny write: remember selected pet without stringifying visits/photos. */
    function scheduleSelectionPersist() {
      const id = currentId() || null;
      if (selectionSlot && typeof selectionSlot.scheduleWrite === "function") {
        selectionSlot.scheduleWrite({ currentPetId: id });
        return;
      }
      schedulePersist();
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
      scheduleSelectionPersist,
      pushPet,
      replaceGraph,
      clearGraph,
      findActive,
      getPets: () => pets,
      getArchivedPets: () => archivedPets,
    };
  }

  root.core.createPetsGraph = createPetsGraph;
  root.core.stripAvatarPhotoForLocalPersist = stripAvatarPhotoForLocalPersist;
  root.core.stripHeavyMedia = stripHeavyMedia;
})(typeof window !== "undefined" ? window : globalThis);
