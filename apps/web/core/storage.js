(function initPetLiveWebStorage(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});

  function cloneValue(value) {
    if (value == null || typeof value !== "object") return value;
    if (typeof structuredClone === "function") {
      try {
        return structuredClone(value);
      } catch {
        // JSON-compatible storage values fall through to the portable clone.
      }
    }
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  function cloneFallback(fallback) {
    return cloneValue(typeof fallback === "function" ? fallback() : fallback);
  }

  /**
   * Cached JSON localStorage slot.
   *
   * Options:
   * - coalesceMs: when > 0, scheduleWrite batches rapid updates into one persist.
   *
   * IndexedDB-ready shape: callers depend on { read, write, scheduleWrite, flush,
   * update, clear, invalidate, getStats, hasPendingWrite }. A future backend can
   * swap the persist step without changing key/JSON map schema.
   */
  function createJsonSlot({
    key,
    fallback,
    validate = () => true,
    coalesceMs = 0,
    onFlushResult,
  }) {
    if (!key || typeof key !== "string") {
      throw new TypeError("createJsonSlot requires a storage key");
    }

    const coalesceWindow = Number(coalesceMs) > 0 ? Number(coalesceMs) : 0;
    const reportFlush =
      typeof onFlushResult === "function" ? onFlushResult : null;
    let cached = false;
    let cachedValue;
    let pendingValue = null;
    let coalesceTimer = null;
    const stats = {
      reads: 0,
      parses: 0,
      writes: 0,
      cacheHits: 0,
      failures: 0,
      clears: 0,
      invalidations: 0,
      scheduled: 0,
      flushes: 0,
    };

    function fallbackValue() {
      return cloneFallback(fallback);
    }

    function clearCoalesceTimer() {
      if (coalesceTimer == null) return;
      global.clearTimeout(coalesceTimer);
      coalesceTimer = null;
    }

    function persist(value) {
      try {
        global.localStorage.setItem(key, JSON.stringify(value));
        stats.writes += 1;
        cachedValue = cloneValue(value);
        cached = true;
        return true;
      } catch {
        stats.failures += 1;
        return false;
      }
    }

    function read() {
      if (cached) {
        stats.cacheHits += 1;
        return cloneValue(cachedValue);
      }

      stats.reads += 1;
      try {
        const raw = global.localStorage.getItem(key);
        if (raw == null || raw === "") {
          cachedValue = fallbackValue();
        } else {
          stats.parses += 1;
          const parsed = JSON.parse(raw);
          cachedValue = validate(parsed) ? parsed : fallbackValue();
        }
      } catch {
        stats.failures += 1;
        cachedValue = fallbackValue();
      }
      cached = true;
      return cloneValue(cachedValue);
    }

    function write(value) {
      if (!validate(value)) return false;
      clearCoalesceTimer();
      pendingValue = null;
      return persist(value);
    }

    function scheduleWrite(value) {
      if (!validate(value)) return false;
      cachedValue = cloneValue(value);
      cached = true;
      stats.scheduled += 1;

      if (!coalesceWindow) {
        pendingValue = null;
        return persist(value);
      }

      pendingValue = cachedValue;
      clearCoalesceTimer();
      coalesceTimer = global.setTimeout(() => {
        coalesceTimer = null;
        const ok = flush();
        reportFlush?.(ok);
      }, coalesceWindow);
      return true;
    }

    function flush() {
      clearCoalesceTimer();
      if (pendingValue == null) return true;
      stats.flushes += 1;
      const ok = persist(pendingValue);
      if (ok) pendingValue = null;
      return ok;
    }

    function hasPendingWrite() {
      return pendingValue != null;
    }

    function update(updater) {
      if (typeof updater !== "function") {
        throw new TypeError("slot.update requires an updater function");
      }
      const next = updater(read());
      return write(next);
    }

    function clear() {
      clearCoalesceTimer();
      pendingValue = null;
      try {
        global.localStorage.removeItem(key);
        stats.clears += 1;
        cachedValue = fallbackValue();
        cached = true;
        return true;
      } catch {
        stats.failures += 1;
        return false;
      }
    }

    function invalidate() {
      clearCoalesceTimer();
      pendingValue = null;
      cached = false;
      cachedValue = undefined;
      stats.invalidations += 1;
    }

    function getStats() {
      return {
        ...stats,
        cached,
        pending: pendingValue != null,
        coalesceMs: coalesceWindow,
      };
    }

    if (coalesceWindow > 0 && typeof global.addEventListener === "function") {
      const flushOnHide = () => {
        flush();
      };
      global.addEventListener("pagehide", flushOnHide);
      const doc = global.document;
      if (doc && typeof doc.addEventListener === "function") {
        doc.addEventListener("visibilitychange", () => {
          if (doc.visibilityState === "hidden") flushOnHide();
        });
      }
    }

    return {
      read,
      write,
      scheduleWrite,
      flush,
      hasPendingWrite,
      update,
      clear,
      invalidate,
      getStats,
    };
  }

  // Alias kept for a future IndexedDB-backed map store with the same surface.
  function createPersistedMapSlot(options) {
    return createJsonSlot(options);
  }

  root.storage = {
    ...(root.storage || {}),
    createJsonSlot,
    createPersistedMapSlot,
  };
})(typeof window !== "undefined" ? window : globalThis);
