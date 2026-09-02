(function initPetLiveWebCloudSelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.cloud = root.domains.cloud || {};

  function createSelectors({
    getSeedPetIds,
    getSeedPetsSnapshot,
    hasStoredPetsGraph,
    readPetsGraphSnapshot,
    readSyncMeta,
  } = {}) {
    if (typeof getSeedPetIds !== "function") {
      throw new TypeError("createSelectors requires getSeedPetIds");
    }

    function normalizePetsForSeedCompare(petList) {
      return (petList || [])
        .slice()
        .sort((a, b) => String(a?.id || "").localeCompare(String(b?.id || "")))
        .map((pet) => {
          if (!pet || typeof pet !== "object") return pet;
          const copy = { ...pet };
          delete copy.photo;
          return copy;
        });
    }

    function matchesSeedSnapshot(petList) {
      if (typeof getSeedPetsSnapshot !== "function") return false;
      const seed = getSeedPetsSnapshot();
      if (!seed?.length || !petList?.length) return false;
      if (!isSeedOnlyPets(petList)) return false;
      try {
        return (
          JSON.stringify(normalizePetsForSeedCompare(petList)) ===
          JSON.stringify(normalizePetsForSeedCompare(seed))
        );
      } catch {
        return false;
      }
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

    /** True when cloud backup is still the untouched demo graph (same seed ids + content). */
    function isSeedOnlyCloudPayload(payload) {
      const list = payload?.pets;
      if (!list?.length) return true;
      if (!isSeedOnlyPets(list)) return false;
      if (Number(payload?.localRevision) > 0) return false;
      if (typeof getSeedPetsSnapshot === "function") {
        return matchesSeedSnapshot(list);
      }
      return true;
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
      if (petsFromGraph?.length) {
        if (!isSeedOnlyPets(petsFromGraph)) return true;
        if (
          typeof getSeedPetsSnapshot === "function" &&
          !matchesSeedSnapshot(petsFromGraph)
        ) {
          return true;
        }
      }

      if (memoryPets?.length) {
        if (!isSeedOnlyPets(memoryPets)) return true;
        if (
          typeof getSeedPetsSnapshot === "function" &&
          !matchesSeedSnapshot(memoryPets)
        ) {
          return true;
        }
      }
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

    /**
     * True only when the user has local edits not yet backed up to cloud.
     * Legacy graphs without sync-meta synthesize localRevision=1 / lastSynced=0 —
     * that is not a pending edit and must not block auto-restore after login.
     */
    function hasLocalPendingChanges(meta) {
      const m = normalizeSyncMeta(meta);
      if (m.localRevision === m.lastSyncedRevision) return false;
      if (
        m.localRevision === 1 &&
        m.lastSyncedRevision === 0 &&
        !m.lastCloudUpdatedAt
      ) {
        return false;
      }
      return true;
    }

    /**
     * Whether boot/login reconcile should pull cloud payload without a confirm.
     * Facade still handles conflict UI when pull is skipped.
     */
    function shouldAutoPullCloud({
      meta,
      payload,
      cloudNewer,
      localPets,
      hasStoredGraph,
      hasRealLocal,
    } = {}) {
      if (!payload || isSeedOnlyCloudPayload(payload)) return false;
      if (hasLocalPendingChanges(meta)) return false;
      if (cloudNewer) return true;
      if (isFreshDevice({ meta, hasStoredGraph })) return true;
      if (!hasRealLocal || isSeedOnlyPets(localPets)) return true;
      const m = normalizeSyncMeta(meta);
      if (!m.lastCloudUpdatedAt) return true;
      return false;
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
      if (hasLocalPendingChanges(meta)) return "accountSyncDirty";
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
      hasLocalPendingChanges,
      shouldAutoPullCloud,
      nextBumpMeta,
      nextMarkSyncedMeta,
      accountSyncStatusKey,
    };
  }

  root.domains.cloud.createSelectors = createSelectors;
})(typeof window !== "undefined" ? window : globalThis);
