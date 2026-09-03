(function initPetLiveWebClinicsStore(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.clinics = root.domains.clinics || {};

  function normalizeList(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => ({
        id: String(item?.id || "").trim(),
        name: String(item?.name || "").trim(),
      }))
      .filter((item) => item.id && item.name);
  }

  function slotForKey(storageKey) {
    const createJsonSlot = root.storage?.createJsonSlot;
    if (typeof createJsonSlot !== "function") {
      throw new TypeError("createStore requires core/storage.js to be loaded");
    }
    return createJsonSlot({
      key: storageKey,
      fallback: () => [],
      validate: (value) => Array.isArray(value),
    });
  }

  /**
   * @param {{ slot?: object, storageKey?: string }} options
   *   `slot` is the preferred injection. `storageKey` builds a core JSON slot
   *   on the same key and on-disk shape, so surfaces that still pass a key keep
   *   reading the clinics they already saved.
   */
  function createStore({ slot, storageKey } = {}) {
    if (!slot && !storageKey) {
      throw new TypeError("createStore requires slot or storageKey");
    }

    const store = slot || slotForKey(storageKey);

    function load() {
      // Read through on every load, as this store did before the slot layer:
      // a second tab must not overwrite clinics saved by the first.
      store.invalidate?.();
      return normalizeList(store.read());
    }

    function save(list) {
      const next = Array.isArray(list) ? list : [];
      store.write(next);
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
