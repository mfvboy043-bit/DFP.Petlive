(function initPetLiveWebObservationsCloudRoundtrip(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  const obs = root.domains.observations;

  /**
   * Phase B R1 — observations travel inside pets[] on the existing Drive backup.
   *
   * domains/cloud/controller.js stripHeavyMedia drops only HEAVY_MEDIA_KEYS
   * (Rx proof photos / attachmentUrl). Visit imaging and "observations" are
   * not in that set, so buildCloudPayload keeps both without a schema change.
   *
   * Formal passport (C wiring later): after applyCloudPayload succeeds, call
   * onPetsGraphApplied(activePet, observationController) → loadFromPet + paint.
   * When flushToPet succeeds on real pets, facade should call the existing
   * bumpLocalDataRevision — do not invent a second sync-meta path.
   *
   * This module is pure: no Drive OAuth, no network, no secrets.
   */

  /** Parity copy of domains/cloud/controller.js HEAVY_MEDIA_KEYS (keep in sync). */
  const CLOUD_STRIP_MEDIA_KEYS = new Set([
    "bagPhoto",
    "rxPhoto",
    "drugPhoto",
    "attachmentUrl",
  ]);

  function stripHeavyMediaParity(value) {
    if (Array.isArray(value)) return value.map(stripHeavyMediaParity);
    if (!value || typeof value !== "object") return value;
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (CLOUD_STRIP_MEDIA_KEYS.has(key)) continue;
      if (
        typeof val === "string" &&
        val.startsWith("data:image") &&
        val.length > 8000
      ) {
        continue;
      }
      out[key] = stripHeavyMediaParity(val);
    }
    return out;
  }

  /**
   * @param {object} payload - shape from buildCloudPayload / simulate
   * @returns {{ ok: boolean, count: number, petsWithObservations: Array<object>, reason?: string }}
   * ok is true when at least one pet carries a non-empty observations notebook
   * (metrics, notes, or projects) — empty shells do not count.
   */
  function assertObservationsInPayload(payload) {
    if (!payload || !Array.isArray(payload.pets)) {
      return {
        ok: false,
        count: 0,
        petsWithObservations: [],
        reason: "missing pets array",
      };
    }
    const found = [];
    payload.pets.forEach(function (pet, index) {
      if (!pet || typeof pet !== "object") return;
      const slice = pet.observations;
      if (!slice || typeof slice !== "object") return;
      const metrics =
        slice.metrics && typeof slice.metrics === "object" ? slice.metrics : {};
      const noteCount = Array.isArray(slice.notes) ? slice.notes.length : 0;
      const projectCount = Array.isArray(slice.projects) ? slice.projects.length : 0;
      const metricCount = Object.keys(metrics).length;
      const meaningful = metricCount > 0 || noteCount > 0 || projectCount > 0;
      found.push({
        id: pet.id != null ? String(pet.id) : "",
        index: index,
        metricCount: metricCount,
        noteCount: noteCount,
        projectCount: projectCount,
        meaningful: meaningful,
      });
    });
    const meaningfulPets = found.filter(function (row) {
      return row.meaningful;
    });
    return {
      ok: meaningfulPets.length > 0,
      count: meaningfulPets.length,
      petsWithObservations: found,
    };
  }

  /**
   * Build a Drive-shaped payload fragment from pets (tryout / tests).
   * Prefer injecting cloudController.stripHeavyMedia when available.
   */
  function buildSimulatedCloudPayload(pets, opts) {
    const options = opts || {};
    const strip =
      typeof options.stripHeavyMedia === "function"
        ? options.stripHeavyMedia
        : stripHeavyMediaParity;
    const list = Array.isArray(pets) ? pets : [];
    const archived = Array.isArray(options.archivedPets) ? options.archivedPets : [];
    return {
      version: 1,
      updatedAt:
        typeof options.updatedAt === "string"
          ? options.updatedAt
          : new Date().toISOString(),
      localRevision:
        options.localRevision != null ? Number(options.localRevision) || 0 : 1,
      pets: strip(list),
      archivedPets: strip(archived),
      currentPetId:
        options.currentPetId != null
          ? options.currentPetId
          : list[0] && list[0].id != null
            ? list[0].id
            : null,
    };
  }

  /**
   * Thin restore hook for passport / tryout after pets graph was replaced.
   * Returns hydrate result or null.
   */
  function onPetsGraphApplied(pet, controller) {
    if (!controller || typeof controller.loadFromPet !== "function") return null;
    return controller.loadFromPet(pet);
  }

  /**
   * Documented bump note for facades (no second sync meta).
   * Call existing cloud bumpLocalDataRevision after a successful flushToPet
   * on real (non-demo) pets — tryout may skip; formal C should wire it.
   */
  function shouldBumpLocalDataRevisionAfterFlush(flushOk, isDemoMode) {
    if (!flushOk) return false;
    if (typeof isDemoMode === "function" ? isDemoMode() : !!isDemoMode) return false;
    return true;
  }

  obs.CLOUD_STRIP_MEDIA_KEYS = CLOUD_STRIP_MEDIA_KEYS;
  obs.stripHeavyMediaParity = stripHeavyMediaParity;
  obs.assertObservationsInPayload = assertObservationsInPayload;
  obs.buildSimulatedCloudPayload = buildSimulatedCloudPayload;
  obs.onPetsGraphApplied = onPetsGraphApplied;
  obs.shouldBumpLocalDataRevisionAfterFlush = shouldBumpLocalDataRevisionAfterFlush;
})(typeof window !== "undefined" ? window : globalThis);
