(function initPetLiveWebCloudSelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.cloud = root.domains.cloud || {};

  function createSelectors({
    getSeedPetIds,
    hasStoredPetsGraph,
    readPetsGraphSnapshot,
    readSyncMeta,
  } = {}) {
    if (typeof getSeedPetIds !== "function") {
      throw new TypeError("createSelectors requires getSeedPetIds");
    }

    function emptySyncMeta() {
      return {
        localRevision: 0,
        lastSyncedRevision: 0,
        lastCloudUpdatedAt: null,
      };
    }

    function normalizeSyncMeta(raw) {
      if (!raw || typeof raw !== "object") return emptySyncMeta();
      return {
        localRevision: Number(raw.localRevision) || 0,
        lastSyncedRevision: Number(raw.lastSyncedRevision) || 0,
        lastCloudUpdatedAt: raw.lastCloudUpdatedAt || null,
      };
    }

    function isSeedOnlyPets(petList) {
      if (!petList?.length) return true;
      const seedIds = getSeedPetIds() || [];
      if (petList.length !== seedIds.length) return false;
      for (let i = 0; i < seedIds.length; i += 1) {
        if (petList[i]?.id !== seedIds[i]) return false;
      }
      return true;
    }

    function isSeedOnlyCloudPayload(payload) {
      return isSeedOnlyPets(payload?.pets);
    }

    function isFreshDevice({ meta, hasStoredGraph } = {}) {
      const stored =
        typeof hasStoredGraph === "boolean"
          ? hasStoredGraph
          : typeof hasStoredPetsGraph === "function"
            ? hasStoredPetsGraph()
            : false;
      if (stored) return false;
      const m = normalizeSyncMeta(meta);
      return m.localRevision === 0 && m.lastSyncedRevision === 0;
    }

    function hasRealLocalData({ meta, graphPets, memoryPets } = {}) {
      const m =
        meta != null
          ? normalizeSyncMeta(meta)
          : typeof readSyncMeta === "function"
            ? normalizeSyncMeta(readSyncMeta())
            : emptySyncMeta();
      if (m.localRevision > 0) return true;

      let petsFromGraph = graphPets;
      if (petsFromGraph === undefined) {
        if (typeof hasStoredPetsGraph === "function" && hasStoredPetsGraph()) {
          try {
            const graph =
              typeof readPetsGraphSnapshot === "function"
                ? readPetsGraphSnapshot()
                : null;
            petsFromGraph = graph?.pets;
          } catch {
            petsFromGraph = null;
          }
        } else {
          petsFromGraph = null;
        }
      }
      if (petsFromGraph?.length && !isSeedOnlyPets(petsFromGraph)) return true;

      if (memoryPets?.length && !isSeedOnlyPets(memoryPets)) return true;
      return false;
    }

    function localCloudGraphFingerprint(petList) {
      const first = petList?.[0];
      return `${petList?.length || 0}:${first?.id || ""}`;
    }

    function cloudPayloadGraphFingerprint(payload) {
      const petList = payload?.pets || [];
      const first = petList[0];
      return `${petList.length}:${first?.id || ""}`;
    }

    function hasCloudGraphConflict({
      localPets,
      payload,
      meta,
      hasStoredGraph,
      graphPets,
      memoryPets,
    } = {}) {
      if (!payload?.pets?.length) return false;
      if (
        isFreshDevice({ meta, hasStoredGraph }) ||
        isSeedOnlyPets(localPets)
      ) {
        return false;
      }
      if (
        !hasRealLocalData({
          meta,
          graphPets,
          memoryPets: memoryPets !== undefined ? memoryPets : localPets,
        })
      ) {
        return false;
      }
      return (
        localCloudGraphFingerprint(localPets) !==
        cloudPayloadGraphFingerprint(payload)
      );
    }

    function isLocalDirty(meta) {
      const m = normalizeSyncMeta(meta);
      return m.localRevision !== m.lastSyncedRevision;
    }

    function nextBumpMeta(meta) {
      const m = normalizeSyncMeta(meta);
      return {
        localRevision: m.localRevision + 1,
        lastSyncedRevision: m.lastSyncedRevision,
        lastCloudUpdatedAt: m.lastCloudUpdatedAt,
      };
    }

    function nextMarkSyncedMeta(meta, cloudUpdatedAt) {
      const m = normalizeSyncMeta(meta);
      return {
        localRevision: m.localRevision,
        lastSyncedRevision: m.localRevision,
        lastCloudUpdatedAt: cloudUpdatedAt
          ? cloudUpdatedAt
          : m.lastCloudUpdatedAt,
      };
    }

    /**
     * Returns i18n key only (facade maps with t()).
     * Mirrors B accountSyncStatusText branching.
     */
    function accountSyncStatusKey({
      signedIn,
      reconcileState,
      reconcilePhase,
      conflict,
      meta,
      lastBackupAt,
      hasRealLocal,
    } = {}) {
      if (!signedIn) return "accountPlanLocal";
      if (reconcileState === "running") {
        return reconcilePhase === "restoring"
          ? "accountSyncRestoring"
          : "accountSyncChecking";
      }
      if (reconcileState === "error") return "accountSyncError";
      if (conflict) return "accountSyncConflict";
      if (isLocalDirty(meta)) return "accountSyncDirty";
      if (normalizeSyncMeta(meta).lastCloudUpdatedAt || lastBackupAt) {
        return "accountSyncOk";
      }
      if (!hasRealLocal) return "accountSyncFirstBackup";
      return "accountSyncPending";
    }

    return {
      isSeedOnlyPets,
      isSeedOnlyCloudPayload,
      isFreshDevice,
      hasRealLocalData,
      localCloudGraphFingerprint,
      cloudPayloadGraphFingerprint,
      hasCloudGraphConflict,
      emptySyncMeta,
      normalizeSyncMeta,
      isLocalDirty,
      nextBumpMeta,
      nextMarkSyncedMeta,
      accountSyncStatusKey,
    };
  }

  root.domains.cloud.createSelectors = createSelectors;
})(typeof window !== "undefined" ? window : globalThis);
