(function initPetLiveWebStorage(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});

  const globalConfig = {
    backend: "local",
    mirrorLocal: true,
  };

  let storageReady = true;
  let readyPromise = Promise.resolve(true);
  let readyPipelineStarted = false;
  let bootComplete = false;
  const hydrateQueue = [];

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

  function supportsIndexedDb() {
    return Boolean(root.storage?._idb?.supportsIndexedDb?.());
  }

  function resolveBackendMode(requested) {
    const mode = requested ?? globalConfig.backend;
    if (mode === "auto") {
      return supportsIndexedDb() ? "idb" : "local";
    }
    if (mode === "idb") {
      return supportsIndexedDb() ? "idb" : "local";
    }
    return "local";
  }

  function readLocalRaw(key) {
    try {
      return global.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeLocalRaw(key, raw) {
    try {
      global.localStorage.setItem(key, String(raw));
      return true;
    } catch {
      return false;
    }
  }

  function removeLocalRaw(key) {
    try {
      global.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  function createLocalDocumentBackend() {
    return {
      mode: "local",
      whenReady() {
        return Promise.resolve(true);
      },
    };
  }

  function createIdbDocumentBackend() {
    const idb = root.storage?._idb?.createIdbDocumentBackend?.();
    if (!idb) {
      return createLocalDocumentBackend();
    }
    return {
      mode: "idb",
      whenReady: idb.whenReady.bind(idb),
      loadRawAsync(key) {
        return idb.getRaw(key);
      },
      persistRawAsync(key, raw) {
        return idb.putRaw(key, raw);
      },
      removeRawAsync(key) {
        return idb.deleteRaw(key);
      },
    };
  }

  function createDocumentBackend(mode) {
    return mode === "idb"
      ? createIdbDocumentBackend()
      : createLocalDocumentBackend();
  }

  function parseStoredRaw(raw, validate, fallback) {
    if (raw == null || raw === "") {
      return { value: cloneFallback(fallback), parsed: false };
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        value: validate(parsed) ? parsed : cloneFallback(fallback),
        parsed: true,
      };
    } catch {
      return { value: cloneFallback(fallback), parsed: false, failed: true };
    }
  }

  /**
   * Migration policy (idb / auto when IDB is chosen):
   * - Prefer a non-empty IDB document as source of truth.
   * - On IDB miss, hydrate once from localStorage when present; write-through to IDB.
   * - Never overwrite a non-empty IDB document with empty LS or fallback.
   * - Never delete localStorage keys automatically in this slice.
   * - When mirrorLocal is true (default for idb/auto), successful IDB writes also
   *   write-through to localStorage for rollback — LS remains a mirror, not deleted.
   */
  async function hydrateSlot(entry) {
    const { backend, key, validate, fallback, setCachedValue, stats, slotState } =
      entry;
    if (backend.mode !== "idb") return;
    if (slotState?.skipHydrate) return;

    let idbRaw = null;
    try {
      idbRaw = await backend.loadRawAsync(key);
    } catch {
      stats.failures += 1;
    }

    if (idbRaw != null && idbRaw !== "") {
      const parsed = parseStoredRaw(idbRaw, validate, fallback);
      if (parsed.failed) stats.failures += 1;
      if (parsed.parsed) stats.parses += 1;
      if (!slotState?.writtenBeforeReady) {
        setCachedValue(parsed.value);
      }
      return;
    }

    const lsRaw = readLocalRaw(key);
    if (lsRaw == null || lsRaw === "") {
      setCachedValue(cloneFallback(fallback));
      return;
    }

    const parsed = parseStoredRaw(lsRaw, validate, fallback);
    if (parsed.failed) {
      stats.failures += 1;
      setCachedValue(parsed.value);
      return;
    }
    if (parsed.parsed) stats.parses += 1;
    setCachedValue(parsed.value);

    const serialized = JSON.stringify(parsed.value);
    const ok = await backend.persistRawAsync(key, serialized);
    if (!ok) stats.failures += 1;
    else stats.writes += 1;
    if (globalConfig.mirrorLocal) {
      if (!writeLocalRaw(key, serialized)) stats.failures += 1;
    }
  }

  function startReadyPipeline() {
    if (readyPipelineStarted) return;
    const mode = resolveBackendMode(globalConfig.backend);
    if (mode !== "idb") return;
    readyPipelineStarted = true;
    storageReady = false;
    readyPromise = Promise.resolve()
      .then(() => createIdbDocumentBackend().whenReady())
      .then(() => Promise.all(hydrateQueue.map((entry) => hydrateSlot(entry))))
      .then(() => {
        storageReady = true;
        return true;
      })
      .catch(() => {
        storageReady = true;
        return false;
      });
  }

  function enqueueHydration(entry) {
    hydrateQueue.push(entry);
  }

  function markBootComplete() {
    bootComplete = true;
    const mode = resolveBackendMode(globalConfig.backend);
    if (mode === "local" || readyPipelineStarted) {
      return Promise.resolve(true);
    }
    if (hydrateQueue.length === 0) {
      storageReady = true;
      return Promise.resolve(true);
    }
    startReadyPipeline();
    return readyPromise;
  }

  function configure(options = {}) {
    if (options.backend != null) {
      globalConfig.backend = options.backend;
    }
    if (options.mirrorLocal != null) {
      globalConfig.mirrorLocal = Boolean(options.mirrorLocal);
    }
    const mode = resolveBackendMode(globalConfig.backend);
    if (mode === "local") {
      storageReady = true;
      readyPipelineStarted = false;
      bootComplete = false;
      readyPromise = Promise.resolve(true);
      return { backend: mode, mirrorLocal: globalConfig.mirrorLocal };
    }
    storageReady = false;
    readyPipelineStarted = false;
    bootComplete = false;
    readyPromise = Promise.resolve(true);
    return { backend: mode, mirrorLocal: globalConfig.mirrorLocal };
  }

  function whenReady() {
    const mode = resolveBackendMode(globalConfig.backend);
    if (mode === "local") return Promise.resolve(true);
    if (!bootComplete) {
      return markBootComplete();
    }
    if (!readyPipelineStarted && hydrateQueue.length === 0) {
      return Promise.resolve(true);
    }
    startReadyPipeline();
    return readyPromise;
  }

  function getBackend() {
    return resolveBackendMode(globalConfig.backend);
  }

  /**
   * Cached JSON persistence slot.
   *
   * Options:
   * - backend: "local" | "idb" | "auto" (defaults to global configure backend)
   * - coalesceMs: when > 0, scheduleWrite batches rapid updates into one persist.
   *
   * Public surface: { read, write, scheduleWrite, flush, update, clear,
   * invalidate, getStats, hasPendingWrite }.
   *
   * Sync read()/write() after init: for idb/auto, pre-ready reads/writes use
   * localStorage so boot stays synchronous; whenReady() hydrates IDB (prefer IDB,
   * else one-shot LS copy) and warms the in-memory cache for post-ready sync reads.
   */
  function createJsonSlot({
    key,
    fallback,
    validate = () => true,
    coalesceMs = 0,
    onFlushResult,
    backend: backendOption,
  }) {
    if (!key || typeof key !== "string") {
      throw new TypeError("createJsonSlot requires a storage key");
    }

    const backendMode = resolveBackendMode(backendOption);
    const backend = createDocumentBackend(backendMode);
    const usesIdb = backend.mode === "idb";

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
      backend: backend.mode,
    };

    function fallbackValue() {
      return cloneFallback(fallback);
    }

    function setCachedValue(value) {
      cachedValue = cloneValue(value);
      cached = true;
    }

    function clearCoalesceTimer() {
      if (coalesceTimer == null) return;
      global.clearTimeout(coalesceTimer);
      coalesceTimer = null;
    }

    function loadFromLocalSync() {
      stats.reads += 1;
      try {
        const raw = readLocalRaw(key);
        const parsed = parseStoredRaw(raw, validate, fallback);
        if (parsed.failed) stats.failures += 1;
        if (parsed.parsed) stats.parses += 1;
        setCachedValue(parsed.value);
      } catch {
        stats.failures += 1;
        setCachedValue(fallbackValue());
      }
      return cloneValue(cachedValue);
    }

    function persistLocalSync(value) {
      try {
        const raw = JSON.stringify(value);
        if (!writeLocalRaw(key, raw)) {
          stats.failures += 1;
          return false;
        }
        stats.writes += 1;
        setCachedValue(value);
        return true;
      } catch {
        stats.failures += 1;
        return false;
      }
    }

    let slotState = null;

    function persist(value) {
      if (backend.mode === "local") {
        return persistLocalSync(value);
      }

      const raw = JSON.stringify(value);
      setCachedValue(value);
      if (!storageReady && slotState) {
        slotState.writtenBeforeReady = true;
      }

      if (!storageReady) {
        return persistLocalSync(value);
      }

      if (globalConfig.mirrorLocal) {
        if (!writeLocalRaw(key, raw)) stats.failures += 1;
      }

      void backend.persistRawAsync(key, raw).then((ok) => {
        if (!ok) stats.failures += 1;
        else stats.writes += 1;
      });

      return true;
    }

    function read() {
      if (cached) {
        stats.cacheHits += 1;
        return cloneValue(cachedValue);
      }

      if (backend.mode === "local" || !storageReady) {
        return loadFromLocalSync();
      }

      if (globalConfig.mirrorLocal) {
        return loadFromLocalSync();
      }

      stats.reads += 1;
      setCachedValue(fallbackValue());
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
      setCachedValue(value);
      stats.scheduled += 1;

      if (!coalesceWindow) {
        pendingValue = null;
        return persist(value);
      }

      pendingValue = cloneValue(value);
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

      if (backend.mode === "local") {
        try {
          if (!removeLocalRaw(key)) {
            stats.failures += 1;
            return false;
          }
          stats.clears += 1;
          setCachedValue(fallbackValue());
          return true;
        } catch {
          stats.failures += 1;
          return false;
        }
      }

      setCachedValue(fallbackValue());
      if (!storageReady) {
        if (!removeLocalRaw(key)) {
          stats.failures += 1;
          return false;
        }
      }
      stats.clears += 1;

      void backend.removeRawAsync(key).then((ok) => {
        if (!ok) stats.failures += 1;
      });
      if (globalConfig.mirrorLocal) {
        if (!removeLocalRaw(key)) stats.failures += 1;
      }
      return true;
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
        ready: backend.mode === "local" || storageReady,
      };
    }

    if (usesIdb) {
      slotState = { writtenBeforeReady: false, skipHydrate: false };
      enqueueHydration({
        backend,
        key,
        validate,
        fallback,
        setCachedValue,
        stats,
        slotState,
      });
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

  function createPersistedMapSlot(options) {
    return createJsonSlot(options);
  }

  /**
   * Raw string slot — stores the value verbatim, with no JSON envelope.
   *
   * The legal-consent gate keeps a bare version string that predates the slot
   * layer; re-encoding it as JSON would stop matching what consenting users
   * already have on disk and would silently re-prompt them. It also has to be
   * readable synchronously during boot, so this slot stays on localStorage
   * rather than joining the IDB hydrate pipeline.
   */
  function createTextSlot({ key, fallback = "" }) {
    if (!key || typeof key !== "string") {
      throw new TypeError("createTextSlot requires a storage key");
    }

    let cached = false;
    let cachedValue = fallback;

    function read() {
      if (cached) return cachedValue;
      const raw = readLocalRaw(key);
      cachedValue = raw == null ? fallback : raw;
      cached = true;
      return cachedValue;
    }

    function write(value) {
      const next = String(value);
      if (!writeLocalRaw(key, next)) return false;
      cachedValue = next;
      cached = true;
      return true;
    }

    function clear() {
      if (!removeLocalRaw(key)) return false;
      cachedValue = fallback;
      cached = true;
      return true;
    }

    function invalidate() {
      cached = false;
      cachedValue = fallback;
    }

    return { read, write, clear, invalidate };
  }

  root.storage = {
    ...(root.storage || {}),
    configure,
    whenReady,
    markBootComplete,
    getBackend,
    createJsonSlot,
    createPersistedMapSlot,
    createTextSlot,
  };
})(typeof window !== "undefined" ? window : globalThis);
