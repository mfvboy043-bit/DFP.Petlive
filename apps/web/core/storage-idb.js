(function initPetLiveWebStorageIdb(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  const storageRoot = (root.storage = root.storage || {});

  const DB_NAME = "petlive-web-storage";
  const DB_VERSION = 1;
  const STORE_NAME = "documents";

  let dbPromise = null;
  let openFailures = 0;

  function supportsIndexedDb() {
    return typeof global.indexedDB !== "undefined";
  }

  function openDatabase() {
    if (!supportsIndexedDb()) {
      return Promise.reject(new Error("indexedDB unavailable"));
    }
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        let request;
        try {
          request = global.indexedDB.open(DB_NAME, DB_VERSION);
        } catch (error) {
          openFailures += 1;
          reject(error);
          return;
        }
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          openFailures += 1;
          reject(request.error || new Error("indexedDB open failed"));
        };
        request.onblocked = () => {
          openFailures += 1;
          reject(new Error("indexedDB open blocked"));
        };
      }).catch((error) => {
        dbPromise = null;
        throw error;
      });
    }
    return dbPromise;
  }

  function runTransaction(mode, fn) {
    return openDatabase().then(
      (db) =>
        new Promise((resolve, reject) => {
          let tx;
          try {
            tx = db.transaction(STORE_NAME, mode);
          } catch (error) {
            reject(error);
            return;
          }
          const store = tx.objectStore(STORE_NAME);
          Promise.resolve(fn(store))
            .then((value) => {
              tx.oncomplete = () => resolve(value);
              tx.onerror = () =>
                reject(tx.error || new Error("indexedDB transaction failed"));
              tx.onabort = () =>
                reject(tx.error || new Error("indexedDB transaction aborted"));
            })
            .catch(reject);
        })
    );
  }

  /**
   * IndexedDB document backend — one DB, string keys, JSON string values.
   * Errors are contained; callers receive null / false instead of throws.
   */
  function createIdbDocumentBackend() {
    return {
      mode: "idb",
      whenReady() {
        return openDatabase().then(
          () => true,
          () => false
        );
      },
      getRaw(key) {
        return runTransaction("readonly", (store) => {
          return new Promise((resolve) => {
            const request = store.get(key);
            request.onsuccess = () => {
              const value = request.result;
              resolve(value == null ? null : String(value));
            };
            request.onerror = () => resolve(null);
          });
        }).catch(() => null);
      },
      putRaw(key, raw) {
        return runTransaction("readwrite", (store) => {
          return new Promise((resolve) => {
            const request = store.put(String(raw), key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
          });
        }).catch(() => false);
      },
      deleteRaw(key) {
        return runTransaction("readwrite", (store) => {
          return new Promise((resolve) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
          });
        }).catch(() => false);
      },
      getStats() {
        return { openFailures, supports: supportsIndexedDb() };
      },
    };
  }

  storageRoot._idb = {
    createIdbDocumentBackend,
    openDatabase,
    supportsIndexedDb,
    DB_NAME,
    STORE_NAME,
  };
})(typeof window !== "undefined" ? window : globalThis);
