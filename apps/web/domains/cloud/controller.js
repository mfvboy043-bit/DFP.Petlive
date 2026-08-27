(function initPetLiveWebCloudController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.cloud = root.domains.cloud || {};

  const HEAVY_MEDIA_KEYS = new Set([
    "bagPhoto",
    "rxPhoto",
    "drugPhoto",
    "xrayPhotos",
    "usPhotos",
    "imaging",
    "attachmentUrl",
  ]);

  function createController({
    selectors,
    getPets,
    getArchivedPets,
    getCurrentPetId,
    setCurrentPetId,
    petsGraph,
    petsGraphSlot,
    ownerProfileSlot,
    ownerAlertsSlot,
    suppressedAlertsSlot,
    petPhotosSlot,
    labReportsSlot,
    syncMetaSlot,
    isDemoMode,
    getSuppressSyncMetaBump,
    setSuppressSyncMetaBump,
    hasStoredSyncMeta,
    hasStoredPetsGraph,
    readPetsGraphSnapshot,
    onAfterApply,
    scheduleCloudBackup,
  } = {}) {
    if (!selectors || typeof selectors.isSeedOnlyPets !== "function") {
      throw new TypeError(
        "createController requires selectors from createSelectors"
      );
    }
    if (typeof getPets !== "function" || typeof getArchivedPets !== "function") {
      throw new TypeError("createController requires getPets and getArchivedPets");
    }
    if (!syncMetaSlot || typeof syncMetaSlot.read !== "function") {
      throw new TypeError("createController requires syncMetaSlot with read/write");
    }

    function demo() {
      return typeof isDemoMode === "function" ? Boolean(isDemoMode()) : false;
    }

    function suppressBump() {
      return typeof getSuppressSyncMetaBump === "function"
        ? Boolean(getSuppressSyncMetaBump())
        : false;
    }

    function readSyncMeta() {
      if (typeof hasStoredSyncMeta === "function" && !hasStoredSyncMeta()) {
        if (typeof hasStoredPetsGraph === "function" && hasStoredPetsGraph()) {
          try {
            const graph =
              typeof readPetsGraphSnapshot === "function"
                ? readPetsGraphSnapshot()
                : null;
            if (graph?.pets?.length) {
              return {
                localRevision: 1,
                lastSyncedRevision: 0,
                lastCloudUpdatedAt: null,
              };
            }
          } catch {
            /* ignore */
          }
        }
        return selectors.emptySyncMeta();
      }
      return selectors.normalizeSyncMeta(syncMetaSlot.read());
    }

    function writeSyncMeta(meta) {
      return syncMetaSlot.write(selectors.normalizeSyncMeta(meta));
    }

    function stripHeavyMedia(value) {
      if (Array.isArray(value)) return value.map(stripHeavyMedia);
      if (!value || typeof value !== "object") return value;
      const out = {};
      for (const [key, val] of Object.entries(value)) {
        if (HEAVY_MEDIA_KEYS.has(key)) continue;
        if (
          typeof val === "string" &&
          val.startsWith("data:image") &&
          val.length > 8000
        ) {
          continue;
        }
        out[key] = stripHeavyMedia(val);
      }
      return out;
    }

    function buildCloudPayload() {
      const pets = getPets() || [];
      const archivedPets = getArchivedPets() || [];
      return {
        version: 1,
        updatedAt: new Date().toISOString(),
        pets: stripHeavyMedia(pets),
        archivedPets: stripHeavyMedia(archivedPets),
        currentPetId:
          typeof getCurrentPetId === "function" ? getCurrentPetId() : null,
        ownerProfile:
          ownerProfileSlot && typeof ownerProfileSlot.read === "function"
            ? ownerProfileSlot.read()
            : null,
        petAlerts:
          ownerAlertsSlot && typeof ownerAlertsSlot.read === "function"
            ? ownerAlertsSlot.read()
            : null,
        suppressedAlerts:
          suppressedAlertsSlot &&
          typeof suppressedAlertsSlot.read === "function"
            ? suppressedAlertsSlot.read()
            : null,
        petPhotos:
          petPhotosSlot && typeof petPhotosSlot.read === "function"
            ? petPhotosSlot.read()
            : null,
        labReports:
          labReportsSlot && typeof labReportsSlot.read === "function"
            ? stripHeavyMedia(labReportsSlot.read())
            : null,
      };
    }

    function replaceActiveGraph(nextPets, nextArchived) {
      if (
        !petsGraph ||
        typeof petsGraph.replaceGraph !== "function"
      ) {
        throw new TypeError(
          "createController requires petsGraph.replaceGraph (Wave 4 Phase 1 door)"
        );
      }
      petsGraph.replaceGraph({
        pets: nextPets,
        archivedPets: nextArchived || [],
      });
    }

    function clearActiveGraph() {
      if (!petsGraph || typeof petsGraph.clearGraph !== "function") {
        throw new TypeError(
          "createController requires petsGraph.clearGraph (Wave 4 Phase 1 door)"
        );
      }
      petsGraph.clearGraph();
    }

    function applyCloudPayload(payload) {
      if (demo()) return false;
      if (!payload || !Array.isArray(payload.pets)) return false;
      if (selectors.isSeedOnlyCloudPayload(payload)) return false;

      replaceActiveGraph(payload.pets, payload.archivedPets || []);
      const pets = getPets();
      const archivedPets = getArchivedPets();

      if (payload.ownerProfile && ownerProfileSlot?.write) {
        ownerProfileSlot.write(payload.ownerProfile);
      }
      if (payload.petAlerts && ownerAlertsSlot?.write) {
        ownerAlertsSlot.write(payload.petAlerts);
      }
      if (payload.suppressedAlerts && suppressedAlertsSlot?.write) {
        suppressedAlertsSlot.write(payload.suppressedAlerts);
      }
      if (payload.petPhotos && petPhotosSlot?.write) {
        petPhotosSlot.write(payload.petPhotos);
      }
      if (payload.labReports && labReportsSlot?.write) {
        labReportsSlot.write(payload.labReports);
      }

      const nextId =
        payload.currentPetId && pets.some((p) => p.id === payload.currentPetId)
          ? payload.currentPetId
          : pets[0]?.id || null;
      if (nextId && typeof setCurrentPetId === "function") {
        setCurrentPetId(nextId);
      }
      if (petsGraphSlot?.write) {
        petsGraphSlot.write({
          version: 1,
          pets,
          archivedPets,
          currentPetId: nextId,
        });
      }
      if (typeof onAfterApply === "function") onAfterApply();
      return true;
    }

    function bumpLocalDataRevision() {
      if (demo() || suppressBump()) return;
      const next = selectors.nextBumpMeta(readSyncMeta());
      writeSyncMeta(next);
      if (typeof scheduleCloudBackup === "function") scheduleCloudBackup();
    }

    function markCloudSynced(cloudUpdatedAt) {
      const next = selectors.nextMarkSyncedMeta(readSyncMeta(), cloudUpdatedAt);
      writeSyncMeta(next);
    }

    function clearSeedPetsFromMemory() {
      const pets = getPets();
      if (!pets.length) return;
      if (!selectors.isSeedOnlyPets(pets)) return;
      clearActiveGraph();
      if (typeof setCurrentPetId === "function") setCurrentPetId(null);
      try {
        if (petsGraphSlot?.write) {
          petsGraphSlot.write({
            version: 1,
            pets: [],
            archivedPets: [],
            currentPetId: null,
          });
        }
      } catch {
        /* ignore */
      }
      if (typeof onAfterApply === "function") onAfterApply();
    }

    return {
      stripHeavyMedia,
      buildCloudPayload,
      applyCloudPayload,
      bumpLocalDataRevision,
      markCloudSynced,
      clearSeedPetsFromMemory,
      readSyncMeta,
      writeSyncMeta,
    };
  }

  root.domains.cloud.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
