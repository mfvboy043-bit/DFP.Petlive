(function initPetLiveWebClinicsStore(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.clinics = root.domains.clinics || {};

  function readList(storageKey) {
    if (!storageKey || !global.localStorage) return [];
    try {
      const raw = global.localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => ({
          id: String(item?.id || "").trim(),
          name: String(item?.name || "").trim(),
        }))
        .filter((item) => item.id && item.name);
    } catch {
      return [];
    }
  }

  function writeList(storageKey, list) {
    if (!storageKey || !global.localStorage) return;
    try {
      global.localStorage.setItem(storageKey, JSON.stringify(list));
    } catch {
      /* quota */
    }
  }

  /**
   * @param {{ storageKey: string }} options
   */
  function createStore({ storageKey } = {}) {
    if (!storageKey) {
      throw new TypeError("createStore requires storageKey");
    }

    function load() {
      return readList(storageKey);
    }

    function save(list) {
      const next = Array.isArray(list) ? list : [];
      writeList(storageKey, next);
      return next;
    }

    function add(name) {
      const trimmed = String(name || "").trim();
      if (!trimmed) return load();
      const list = load();
      const existing = list.find((item) => item.name === trimmed);
      if (existing) return list;
      const next = [
        ...list,
        { id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: trimmed },
      ];
      return save(next);
    }

    function remove(id) {
      const key = String(id || "").trim();
      if (!key) return load();
      return save(load().filter((item) => item.id !== key));
    }

    return { load, save, add, remove };
  }

  root.domains.clinics.createStore = createStore;
})(typeof window !== "undefined" ? window : globalThis);
