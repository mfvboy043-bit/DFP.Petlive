(function initPetLiveWebCloudScheduler(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.cloud = root.domains.cloud || {};

  function createScheduler({
    debounceMs = 1800,
    maxRetries = 3,
    backoffMs = 2000,
    hasDriveSession,
    isBusy,
    isDemo,
    hasRealLocalData,
    hasPendingLocal,
    pushSilent,
    onStateChange,
    now,
    setTimeout: scheduleTimeout,
    clearTimeout: cancelTimeout,
  } = {}) {
    if (typeof hasDriveSession !== "function") {
      throw new TypeError("createScheduler requires hasDriveSession");
    }
    if (typeof isBusy !== "function") {
      throw new TypeError("createScheduler requires isBusy");
    }
    if (typeof isDemo !== "function") {
      throw new TypeError("createScheduler requires isDemo");
    }
    if (typeof hasRealLocalData !== "function") {
      throw new TypeError("createScheduler requires hasRealLocalData");
    }
    if (typeof hasPendingLocal !== "function") {
      throw new TypeError("createScheduler requires hasPendingLocal");
    }
    if (typeof pushSilent !== "function") {
      throw new TypeError("createScheduler requires pushSilent");
    }

    const wait =
      typeof scheduleTimeout === "function" ? scheduleTimeout : global.setTimeout;
    const cancel =
      typeof cancelTimeout === "function" ? cancelTimeout : global.clearTimeout;

    let pending = false;
    let inFlight = false;
    let attempts = 0;
    let lastError = null;
    let debounceId = null;
    let retryId = null;

    function demo() {
      return Boolean(isDemo());
    }

    function driveReady() {
      return Boolean(hasDriveSession());
    }

    function emit() {
      if (typeof onStateChange !== "function") return;
      try {
        onStateChange();
      } catch {
        /* facade paint must not break the queue */
      }
    }

    function clearDebounce() {
      if (debounceId == null) return;
      cancel(debounceId);
      debounceId = null;
    }

    function clearRetry() {
      if (retryId == null) return;
      cancel(retryId);
      retryId = null;
    }

    function clearTimers() {
      clearDebounce();
      clearRetry();
    }

    function getState() {
      const drive = driveReady();
      const owed = pending || Boolean(hasPendingLocal());
      return {
        pending,
        backingUp: inFlight || Boolean(isBusy()),
        attempts,
        lastError,
        needDrive: !demo() && !drive && owed,
      };
    }

    function armDebounce() {
      clearDebounce();
      clearRetry();
      debounceId = wait(() => {
        debounceId = null;
        void attemptPush();
      }, debounceMs);
    }

    function armRetry() {
      if (retryId != null || debounceId != null) return;
      retryId = wait(() => {
        retryId = null;
        void attemptPush();
      }, backoffMs);
    }

    async function attemptPush() {
      if (demo()) {
        pending = false;
        emit();
        return false;
      }
      if (!driveReady()) {
        pending = true;
        emit();
        return false;
      }
      if (!pending && !hasPendingLocal()) return false;
      if (inFlight || isBusy()) {
        pending = true;
        armRetry();
        emit();
        return false;
      }
      if (!hasRealLocalData()) {
        emit();
        return false;
      }

      pending = false;
      inFlight = true;
      emit();
      let ok = false;
      try {
        ok = Boolean(await pushSilent());
      } catch (err) {
        lastError = err && err.message ? String(err.message) : "push_failed";
        ok = false;
      }
      inFlight = false;
      if (ok) {
        lastError = null;
        attempts = 0;
        emit();
        if (pending || hasPendingLocal()) armDebounce();
        return true;
      }
      pending = true;
      if (!lastError) lastError = "push_failed";
      attempts += 1;
      emit();
      if (attempts < maxRetries) armRetry();
      return false;
    }

    function schedule() {
      if (demo()) return;
      pending = true;
      attempts = 0;
      lastError = null;
      if (!driveReady()) {
        emit();
        return;
      }
      armDebounce();
      emit();
    }

    async function flushPending() {
      clearTimers();
      if (demo()) return false;
      if (!driveReady()) {
        if (pending || hasPendingLocal()) emit();
        return false;
      }
      if (!(pending || hasPendingLocal())) return false;
      if (!hasRealLocalData()) return false;
      pending = true;
      return attemptPush();
    }

    function notifyDriveReady() {
      return flushPending();
    }

    function dispose() {
      clearTimers();
    }

    return {
      schedule,
      flushPending,
      notifyDriveReady,
      getState,
      dispose,
    };
  }

  root.domains.cloud.createScheduler = createScheduler;
})(typeof window !== "undefined" ? window : globalThis);
