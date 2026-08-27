(function initPetLiveCStorageBoot(global) {
  "use strict";

  const doc = global.document;
  const backend =
    doc?.documentElement?.dataset?.petliveStorageBackend ||
    global.__PETLIVE_C_STORAGE_BACKEND;

  if (!backend || backend === "local") {
    return;
  }

  const storage = global.PetLiveWeb?.storage;
  if (!storage?.configure) {
    return;
  }

  storage.configure({ backend, mirrorLocal: true });
})(typeof window !== "undefined" ? window : globalThis);
