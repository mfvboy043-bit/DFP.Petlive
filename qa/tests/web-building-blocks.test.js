import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

class FakeStorage {
  constructor(seed = {}) {
    this.values = new Map(Object.entries(seed));
    this.gets = 0;
    this.sets = 0;
    this.throwOnGet = false;
    this.throwOnSet = false;
  }

  getItem(key) {
    this.gets += 1;
    if (this.throwOnGet) throw new Error("blocked");
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.sets += 1;
    if (this.throwOnSet) throw new Error("quota");
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function createFakeIndexedDb(seed = {}) {
  const databases = new Map(Object.entries(seed));

  class FakeRequest {
    constructor(result, error = null) {
      this.result = result;
      this.error = error;
      this.onsuccess = null;
      this.onerror = null;
      this.onblocked = null;
      this.onupgradeneeded = null;
    }

    emitSuccess() {
      queueMicrotask(() => this.onsuccess?.({ target: this }));
    }

    emitError() {
      queueMicrotask(() => this.onerror?.({ target: this }));
    }
  }

  class FakeObjectStore {
    constructor(dbName, tx) {
      this.dbName = dbName;
      this.tx = tx;
    }

    get(key) {
      const db = databases.get(this.dbName) || new Map();
      const request = new FakeRequest(db.get(key));
      queueMicrotask(() => {
        request.onsuccess?.({ target: request });
        this.tx._scheduleComplete();
      });
      return request;
    }

    put(value, key) {
      const db = databases.get(this.dbName) || new Map();
      db.set(key, value);
      databases.set(this.dbName, db);
      const request = new FakeRequest(undefined);
      queueMicrotask(() => {
        request.onsuccess?.({ target: request });
        this.tx._scheduleComplete();
      });
      return request;
    }

    delete(key) {
      const db = databases.get(this.dbName) || new Map();
      db.delete(key);
      const request = new FakeRequest(undefined);
      queueMicrotask(() => {
        request.onsuccess?.({ target: request });
        this.tx._scheduleComplete();
      });
      return request;
    }
  }

  class FakeTransaction {
    constructor(dbName) {
      this.dbName = dbName;
      this.oncomplete = null;
      this.onerror = null;
      this.onabort = null;
      this.error = null;
      this._completeScheduled = false;
    }

    objectStore(_name) {
      return new FakeObjectStore(this.dbName, this);
    }

    _scheduleComplete() {
      if (this._completeScheduled) return;
      this._completeScheduled = true;
      queueMicrotask(() => {
        this.oncomplete?.({ target: this });
      });
    }
  }

  class FakeDatabase {
    constructor(name) {
      this.name = name;
      this.objectStoreNames = {
        contains() {
          return true;
        },
      };
    }

    transaction(storeName, _mode) {
      return new FakeTransaction(this.name);
    }
  }

  return {
    databases,
    indexedDB: {
      open(name, _version) {
        const request = new FakeRequest(new FakeDatabase(name));
        queueMicrotask(() => {
          request.onupgradeneeded?.({ target: request });
          request.emitSuccess();
        });
        return request;
      },
    },
  };
}

function flushMicrotasks() {
  return new Promise((resolve) => queueMicrotask(() => queueMicrotask(resolve)));
}

function loadStorageFactories({
  storage = new FakeStorage(),
  indexedDB = null,
  configure = null,
  extraScripts = ["core/storage-idb.js", "core/storage.js"],
} = {}) {
  const clone =
    globalThis.structuredClone ||
    ((value) => JSON.parse(JSON.stringify(value)));
  const timers = [];
  const context = vm.createContext({
    console,
    localStorage: storage,
    indexedDB: indexedDB?.indexedDB,
    performance: { now: () => 1 },
    structuredClone: clone,
    queueMicrotask: queueMicrotask,
    setTimeout: (fn, ms) => {
      const id = timers.length + 1;
      timers.push({ id, fn, ms });
      return id;
    },
    clearTimeout: (id) => {
      const index = timers.findIndex((entry) => entry.id === id);
      if (index >= 0) timers.splice(index, 1);
    },
    addEventListener() {},
    document: {
      addEventListener() {},
      visibilityState: "visible",
    },
  });
  context.globalThis = context;
  context.window = context;

  for (const path of extraScripts) {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  }

  if (configure) {
    context.PetLiveWeb.storage.configure(configure);
  }

  return { api: context.PetLiveWeb, storage, indexedDB, timers, context };
}

function loadFactories(storage = new FakeStorage()) {
  const clone =
    globalThis.structuredClone ||
    ((value) => JSON.parse(JSON.stringify(value)));
  const timers = [];
  const context = vm.createContext({
    console,
    localStorage: storage,
    performance: { now: () => 1 },
    structuredClone: clone,
    setTimeout: (fn, ms) => {
      const id = timers.length + 1;
      timers.push({ id, fn, ms });
      return id;
    },
    clearTimeout: (id) => {
      const index = timers.findIndex((entry) => entry.id === id);
      if (index >= 0) timers.splice(index, 1);
    },
    addEventListener() {},
    document: {
      addEventListener() {},
      visibilityState: "visible",
    },
  });
  context.globalThis = context;
  context.window = context;
  [
    "core/storage-idb.js",
    "core/storage.js",
    "core/state.js",
    "shell/navigation.js",
    "shell/render-coordinator.js",
    "domains/pets/controller.js",
  ].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });
  return { api: context.PetLiveWeb, storage, timers, context };
}

class FakeClassList {
  constructor(values = []) {
    this.values = new Set(values);
  }
  add(value) {
    this.values.add(value);
  }
  remove(value) {
    this.values.delete(value);
  }
  contains(value) {
    return this.values.has(value);
  }
}

class FakeScreen {
  constructor(name, active = false) {
    this.dataset = { screen: name };
    this.hidden = !active;
    this.classList = new FakeClassList(active ? ["screen", "is-active"] : ["screen"]);
  }
}

function fakeApp(names) {
  const screens = names.map((name, index) => new FakeScreen(name, index === 0));
  return {
    screens,
    querySelector(selector) {
      if (selector === ".screen.is-active") {
        return screens.find((screen) => screen.classList.contains("is-active")) || null;
      }
      const match = selector.match(/^\[data-screen="(.+)"\]$/);
      return match ? screens.find((screen) => screen.dataset.screen === match[1]) || null : null;
    },
    querySelectorAll(selector) {
      return selector === ".screen" ? screens : [];
    },
  };
}

describe("ARCH-01 guarded JSON slots", () => {
  it("caches one parse, preserves ownership, and never writes a fallback", () => {
    const fake = new FakeStorage({ demo: '{"saved":true}' });
    const { api } = loadFactories(fake);
    const slot = api.storage.createJsonSlot({
      key: "demo",
      fallback: () => ({ fallback: true }),
      validate: (value) => value && typeof value === "object",
    });

    const first = slot.read();
    first.saved = false;
    assert.deepEqual(slot.read(), { saved: true });
    assert.equal(fake.gets, 1);
    assert.equal(fake.sets, 0);
    assert.deepEqual(
      { parses: slot.getStats().parses, cacheHits: slot.getStats().cacheHits },
      { parses: 1, cacheHits: 1 }
    );
  });

  it("contains malformed JSON and storage read/write failures", () => {
    const fake = new FakeStorage({ broken: "{" });
    const { api } = loadFactories(fake);
    const slot = api.storage.createJsonSlot({
      key: "broken",
      fallback: () => ({}),
      validate: (value) => value && typeof value === "object",
    });
    assert.deepEqual(slot.read(), {});
    assert.equal(slot.getStats().failures, 1);

    fake.throwOnSet = true;
    assert.equal(slot.write({ safe: true }), false);
    assert.equal(slot.getStats().failures, 2);
    assert.deepEqual(slot.read(), {});
  });

  it("contains getItem failures without persisting the read fallback", () => {
    const fake = new FakeStorage();
    fake.throwOnGet = true;
    const { api } = loadFactories(fake);
    const slot = api.storage.createJsonSlot({
      key: "profile",
      fallback: () => ({ demo: true }),
      validate: (value) => value && typeof value === "object",
    });
    assert.deepEqual(slot.read(), { demo: true });
    assert.equal(fake.sets, 0);
    assert.equal(slot.getStats().failures, 1);
  });
});

describe("STORAGE-IDB backend", () => {
  it("defaults to local backend with zero behavior change", () => {
    const fake = new FakeStorage({ demo: '{"saved":true}' });
    const { api } = loadStorageFactories({ storage: fake });
    assert.equal(api.storage.getBackend(), "local");
    const slot = api.storage.createJsonSlot({
      key: "demo",
      fallback: () => ({}),
    });
    assert.equal(slot.getStats().backend, "local");
    assert.deepEqual(slot.read(), { saved: true });
  });

  it("hydrates from localStorage once and prefers existing IDB values", async () => {
    const fake = new FakeStorage({ demo: '{"from":"local"}' });
    const idb = createFakeIndexedDb({
      "petlive-web-storage": new Map([["demo", '{"from":"idb"}']]),
    });
    const { api, storage } = loadStorageFactories({
      storage: fake,
      indexedDB: idb,
      configure: { backend: "idb", mirrorLocal: true },
    });

    const slot = api.storage.createJsonSlot({
      key: "demo",
      fallback: () => ({ from: "fallback" }),
      validate: (value) => value && typeof value === "object",
    });

    assert.deepEqual(slot.read(), { from: "local" });
    await api.storage.whenReady();
    assert.deepEqual(slot.read(), { from: "idb" });
    assert.equal(storage.sets, 0);
  });

  it("write-through mirrors to localStorage and supports sync read after ready", async () => {
    const fake = new FakeStorage();
    const idb = createFakeIndexedDb();
    const { api } = loadStorageFactories({
      storage: fake,
      indexedDB: idb,
      configure: { backend: "idb", mirrorLocal: true },
    });
    const slot = api.storage.createJsonSlot({
      key: "demo",
      fallback: () => ({}),
      validate: (value) => value && typeof value === "object",
    });

    await api.storage.whenReady();
    assert.equal(slot.write({ ok: true }), true);
    await flushMicrotasks();
    assert.deepEqual(slot.read(), { ok: true });
    assert.equal(fake.values.get("demo"), JSON.stringify({ ok: true }));
    assert.equal(
      idb.databases.get("petlive-web-storage")?.get("demo"),
      JSON.stringify({ ok: true })
    );
  });

  it("auto falls back to local when indexedDB is unavailable", () => {
    const fake = new FakeStorage({ demo: '{"mode":"local"}' });
    const { api } = loadStorageFactories({
      storage: fake,
      indexedDB: null,
      configure: { backend: "auto" },
    });
    assert.equal(api.storage.getBackend(), "local");
    const slot = api.storage.createJsonSlot({
      key: "demo",
      fallback: () => ({}),
    });
    assert.equal(slot.getStats().backend, "local");
    assert.deepEqual(slot.read(), { mode: "local" });
  });

  it("coalesced scheduleWrite still flushes once on idb backend", async () => {
    const fake = new FakeStorage();
    const idb = createFakeIndexedDb();
    const { api, timers } = loadStorageFactories({
      storage: fake,
      indexedDB: idb,
      configure: { backend: "idb" },
    });
    const slot = api.storage.createJsonSlot({
      key: "petlive-pet-photos",
      fallback: () => ({}),
      validate: (value) => value && typeof value === "object" && !Array.isArray(value),
      coalesceMs: 80,
    });

    await api.storage.whenReady();
    for (let i = 0; i < 6; i += 1) {
      assert.equal(slot.scheduleWrite({ pet: `v${i}` }), true);
    }
    assert.equal(slot.hasPendingWrite(), true);
    assert.equal(slot.flush(), true);
    assert.deepEqual(slot.read(), { pet: "v5" });
    assert.equal(
      idb.databases.get("petlive-web-storage")?.get("petlive-pet-photos"),
      JSON.stringify({ pet: "v5" })
    );
    assert.ok(timers.length >= 0);
  });

  it("clear removes idb and mirrored local entries", async () => {
    const fake = new FakeStorage({ demo: '{"old":true}' });
    const idb = createFakeIndexedDb({
      "petlive-web-storage": new Map([["demo", '{"old":true}']]),
    });
    const { api } = loadStorageFactories({
      storage: fake,
      indexedDB: idb,
      configure: { backend: "idb", mirrorLocal: true },
    });
    const slot = api.storage.createJsonSlot({
      key: "demo",
      fallback: () => ({}),
      validate: (value) => value && typeof value === "object",
    });

    await api.storage.whenReady();
    assert.equal(slot.clear(), true);
    await flushMicrotasks();
    assert.deepEqual(slot.read(), {});
    assert.equal(fake.values.has("demo"), false);
    assert.equal(idb.databases.get("petlive-web-storage")?.has("demo"), false);
  });
});

describe("PERF-04 coalesced pet photo writes", () => {
  it("coalesces rapid scheduleWrite calls and flushes the last map", () => {
    const fake = new FakeStorage();
    const { api, timers } = loadFactories(fake);
    const slot = api.storage.createJsonSlot({
      key: "petlive-pet-photos",
      fallback: () => ({}),
      validate: (value) => value && typeof value === "object" && !Array.isArray(value),
      coalesceMs: 80,
    });

    const bursts = 12;
    for (let i = 0; i < bursts; i += 1) {
      assert.equal(slot.scheduleWrite({ pet: `data:image/png;base64,${i}` }), true);
    }

    assert.equal(fake.sets, 0);
    assert.equal(slot.hasPendingWrite(), true);
    assert.ok(timers.length >= 1);
    assert.equal(slot.getStats().scheduled, bursts);

    assert.equal(slot.flush(), true);
    assert.equal(fake.sets, 1);
    assert.ok(fake.sets < bursts);
    assert.deepEqual(JSON.parse(fake.values.get("petlive-pet-photos")), {
      pet: "data:image/png;base64,11",
    });
    assert.equal(slot.hasPendingWrite(), false);
    assert.deepEqual(slot.read(), { pet: "data:image/png;base64,11" });
  });

  it("propagates false when the final flush fails", () => {
    const fake = new FakeStorage();
    const { api } = loadFactories(fake);
    const slot = api.storage.createJsonSlot({
      key: "petlive-pet-photos",
      fallback: () => ({}),
      validate: (value) => value && typeof value === "object",
      coalesceMs: 50,
    });

    assert.equal(slot.scheduleWrite({ a: "1" }), true);
    fake.throwOnSet = true;
    assert.equal(slot.flush(), false);
    assert.equal(slot.hasPendingWrite(), true);
    assert.deepEqual(slot.read(), { a: "1" });
  });

  it("exposes an IndexedDB-ready persisted map alias", () => {
    const { api } = loadFactories();
    assert.equal(typeof api.storage.createPersistedMapSlot, "function");
    const slot = api.storage.createPersistedMapSlot({
      key: "alias",
      fallback: () => ({}),
    });
    assert.equal(typeof slot.scheduleWrite, "function");
    assert.equal(typeof slot.flush, "function");
  });
});

describe("ARCH-02/04 state and pet selection", () => {
  it("retains array references and rejects unknown selections", () => {
    const { api } = loadFactories();
    const pets = [{ id: "p1" }, { id: "p2" }];
    const archivedPets = [];
    const state = api.state.createAppState({
      pets,
      archivedPets,
      initialPetId: "missing",
    });
    assert.equal(state.getCurrentPetId(), "p1");
    assert.equal(state.setCurrentPetId("missing"), false);
    assert.equal(state.getCurrentPetId(), "p1");
    assert.equal(state.getPets(), pets);
    assert.equal(state.getArchivedPets(), archivedPets);

    pets.shift();
    assert.equal(state.getCurrentPetId(), "p2");
  });

  it("runs selection hooks only for accepted selection behavior", () => {
    const { api } = loadFactories();
    const state = api.state.createAppState({
      pets: [{ id: "p1" }, { id: "p2" }],
      archivedPets: [],
      initialPetId: "p1",
    });
    const events = [];
    const controller = api.domains.pets.createController({
      state,
      beforeSelect: (_id, _previous, meta) => events.push(`before:${meta.forced}`),
      afterSelect: (pet) => events.push(`after:${pet.id}`),
    });
    assert.equal(controller.select("missing"), false);
    assert.equal(controller.select("p1"), false);
    assert.equal(controller.select("p2"), true);
    assert.equal(controller.selectForced("p2"), true);
    assert.deepEqual(events, [
      "before:false",
      "after:p2",
      "before:true",
      "after:p2",
    ]);
  });
});

describe("ARCH-03 navigation and dirty rendering", () => {
  it("keeps navigation history and flushes before revealing a screen", () => {
    const { api } = loadFactories();
    const app = fakeApp(["home", "timeline", "alerts"]);
    const entries = [];
    const navigation = api.shell.createNavigation({
      app,
      onEnter: (screen) => {
        entries.push(`${screen}:${app.querySelector(`[data-screen="${screen}"]`).hidden}`);
      },
    });

    assert.equal(navigation.go("timeline"), true);
    assert.equal(navigation.getActiveScreen(), "timeline");
    assert.equal(navigation.go("alerts"), true);
    assert.equal(navigation.back(), true);
    assert.equal(navigation.getActiveScreen(), "timeline");
    navigation.clearHistory();
    assert.equal(navigation.back(), true);
    assert.equal(navigation.getActiveScreen(), "home");
    assert.deepEqual(entries, [
      "timeline:true",
      "alerts:true",
      "timeline:true",
      "home:true",
    ]);
  });

  it("renders home plus active only and isolates failed siblings", () => {
    const { api } = loadFactories();
    let active = "home";
    const runs = [];
    const errors = [];
    const coordinator = api.shell.createRenderCoordinator({
      safeRender: (name, render, onError) => {
        try {
          render();
          return true;
        } catch (error) {
          errors.push(name);
          onError?.(error);
          return false;
        }
      },
      getCurrentPet: () => ({ id: "p1" }),
      getActiveScreen: () => active,
    });
    coordinator.register("home", "home", () => runs.push("home"));
    coordinator.register("timeline", "timeline-fail", () => {
      runs.push("timeline-fail");
      throw new Error("section failed");
    });
    coordinator.register("timeline", "timeline-ok", () => runs.push("timeline-ok"));
    coordinator.register("alerts", "alerts", () => runs.push("alerts"));

    coordinator.refreshSelection();
    assert.deepEqual(runs, ["home"]);
    active = "timeline";
    coordinator.refreshSelection();
    assert.deepEqual(runs, ["home", "home", "timeline-fail", "timeline-ok"]);
    assert.deepEqual(errors, ["timeline-fail"]);
    assert.equal(coordinator.getMetrics().sectionRuns.alerts || 0, 0);

    coordinator.flush("alerts");
    assert.equal(runs.at(-1), "alerts");
  });
});

describe("PERF-02 incremental language refresh", () => {
  it("does not render inactive timeline/alerts/vaccines/archive from home", () => {
    const { api } = loadFactories();
    const active = "home";
    const runs = [];
    const coordinator = api.shell.createRenderCoordinator({
      safeRender: (_name, render) => {
        render();
        return true;
      },
      getCurrentPet: () => ({ id: "p1" }),
      getActiveScreen: () => active,
    });

    coordinator.register("home", "petHeader", () => runs.push("home"));
    coordinator.register("timeline", "timeline", () => runs.push("timeline"));
    coordinator.register("alerts", "alerts", () => runs.push("alerts"));
    coordinator.register("vaccines", "vaccines", () => runs.push("vaccines"));
    coordinator.register("archive", "archiveList", () => runs.push("archive"));

    coordinator.flush("home", { force: true });
    runs.length = 0;

    coordinator.refreshLanguage();

    assert.deepEqual(runs, ["home"]);
    assert.equal(coordinator.getMetrics().sectionRuns.timeline || 0, 0);
    assert.equal(coordinator.getMetrics().sectionRuns.alerts || 0, 0);
    assert.equal(coordinator.getMetrics().sectionRuns.vaccines || 0, 0);
    assert.equal(coordinator.getMetrics().sectionRuns.archiveList || 0, 0);
    assert.equal(coordinator.getMetrics().languageRefreshes, 1);

    const dirty = new Set(coordinator.getMetrics().dirtyScreens);
    assert.ok(dirty.has("timeline"));
    assert.ok(dirty.has("alerts"));
    assert.ok(dirty.has("vaccines"));
    assert.ok(dirty.has("archive"));
  });

  it("flushes the active non-home group on language refresh", () => {
    const { api } = loadFactories();
    const active = "timeline";
    const runs = [];
    const coordinator = api.shell.createRenderCoordinator({
      safeRender: (_name, render) => {
        render();
        return true;
      },
      getCurrentPet: () => ({ id: "p1" }),
      getActiveScreen: () => active,
    });

    coordinator.register("home", "home", () => runs.push("home"));
    coordinator.register("timeline", "timeline", () => runs.push("timeline"));
    coordinator.register("alerts", "alerts", () => runs.push("alerts"));

    coordinator.refreshLanguage();
    assert.deepEqual(runs, ["home", "timeline"]);
    assert.equal(coordinator.getMetrics().sectionRuns.alerts || 0, 0);
  });
});

describe("candidate integration guards", () => {
  it("has one static i18n path and language refresh instead of full applySelectedPet", () => {
    const source = readFileSync(new URL("app.js", WEB_ROOT), "utf8");
    const callback = source.match(/window\.onLanguageChange = \(\) => \{([\s\S]*?)\n\};/);
    assert.ok(callback);
    assert.equal(callback[1].includes("applyI18n()"), false);
    assert.equal(callback[1].includes("applySelectedPet()"), false);
    assert.match(callback[1], /refreshLanguage\(/);
    assert.equal(source.includes("seedDemoOwnerProfile"), false);
  });

  it("preserves the adopted timeline integrations and stylesheet baseline", () => {
    const source = readFileSync(new URL("app.js", WEB_ROOT), "utf8");
    assert.match(source, /visitWeightEditAria/);
    assert.match(source, /data-proof-lightbox/);

    const html = readFileSync(new URL("index.html", WEB_ROOT), "utf8");
    assert.match(html, /styles\.css\?v=/);
    assert.match(html, /id="proof-lightbox"/);
  });

  it("gates persistence success paths on slot write results", () => {
    const source = readFileSync(new URL("app.js", WEB_ROOT), "utf8");
    assert.match(source, /return saveSuppressedAlertsMap\(map\)/);
    assert.match(source, /return saveOwnerAlertsMap\(map\)/);
    assert.match(source, /if \(!savePetPhotosMap\(map\)\) return false/);
    assert.match(source, /scheduleWrite\(map\)/);
    assert.match(source, /flushPetPhotosOrToast/);
    assert.match(source, /if \(!saveOwnerProfile\(profile\)\)/);
    assert.match(source, /if \(!persistOwnerAlertsForPet\(pet\.id, ownerAlerts\)\)/);
    assert.match(source, /if \(!suppressLinkedAlert\(pet\.id, alertId\)\)/);
  });

  it("preserves active and hidden dirty vaccine drafts for the same pet", () => {
    const source = readFileSync(new URL("app.js", WEB_ROOT), "utf8");
    const start = source.indexOf("function refreshVaccineForm");
    const end = source.indexOf("function renderVaccineList", start);
    assert.ok(start >= 0 && end > start);

    const chips = [
      { dataset: { vaccineKey: "vaccineRabies" }, classList: { toggle() {} } },
      { dataset: { vaccineKey: "vaccineCoreDog" }, classList: { toggle() {} } },
    ];
    const context = vm.createContext({
      selectedVaccineKeys: new Set(["vaccineRabies"]),
      vaccineCustomName: { value: "Custom draft" },
      vaccineGivenInput: { value: "2026-08-13" },
      vaccineNextDueInput: { value: "2027-08-13" },
      vaccineChipsEl: { querySelectorAll: () => chips },
      vaccineFormPetId: "p1",
      fillVaccineNameOptions() {
        this.selectedVaccineKeys.clear();
        this.vaccineCustomName.value = "";
      },
      resetVaccineForm() {
        throw new Error("same-pet refresh must not reset");
      },
    });
    vm.runInContext(`${source.slice(start, end)}; this.refresh = refreshVaccineForm;`, context);

    context.refresh({ id: "p1" }); // active dirty refresh
    context.refresh({ id: "p1" }); // hidden dirty flush on re-entry
    assert.deepEqual([...context.selectedVaccineKeys], ["vaccineRabies"]);
    assert.equal(context.vaccineCustomName.value, "Custom draft");
    assert.equal(context.vaccineGivenInput.value, "2026-08-13");
    assert.equal(context.vaccineNextDueInput.value, "2027-08-13");
  });
});
