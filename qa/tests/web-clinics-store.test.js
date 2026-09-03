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
  }

  getItem(key) {
    this.gets += 1;
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.sets += 1;
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function loadClinicsStore(storage = new FakeStorage()) {
  const clone =
    globalThis.structuredClone ||
    ((value) => JSON.parse(JSON.stringify(value)));
  const context = vm.createContext({
    console,
    localStorage: storage,
    structuredClone: clone,
  });
  context.globalThis = context;
  context.window = context;

  for (const path of ["core/storage.js", "domains/clinics/store.js"]) {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  }

  return { api: context.PetLiveWeb, storage };
}

/** vm-context objects carry a foreign prototype; compare plain values instead. */
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function createMemorySlot(initial = []) {
  let value = initial;
  const stats = { reads: 0, writes: 0 };
  return {
    stats,
    read() {
      stats.reads += 1;
      return value;
    },
    write(next) {
      stats.writes += 1;
      value = next;
      return true;
    },
  };
}

describe("clinics store storage boundary (BB-1)", () => {
  it("never touches localStorage itself", () => {
    const source = readFileSync(
      new URL("domains/clinics/store.js", WEB_ROOT),
      "utf8"
    );
    assert.ok(
      !source.includes("localStorage"),
      "domains/clinics/store.js must persist through a core slot, not localStorage"
    );
  });

  it("reads and writes through an injected slot", () => {
    const { api, storage } = loadClinicsStore();
    const slot = createMemorySlot([{ id: "saved-1", name: "喵喵動物醫院" }]);
    const store = api.domains.clinics.createStore({ slot });

    assert.deepEqual(plain(store.load()), [
      { id: "saved-1", name: "喵喵動物醫院" },
    ]);

    const added = store.add("汪汪動物醫院");
    assert.equal(added.length, 2);
    assert.equal(added[1].name, "汪汪動物醫院");
    assert.equal(slot.stats.writes, 1);

    const removed = store.remove("saved-1");
    assert.deepEqual(
      plain(removed).map((item) => item.name),
      ["汪汪動物醫院"]
    );
    assert.equal(storage.gets, 0, "injected slot must own persistence");
    assert.equal(storage.sets, 0);
  });

  it("drops entries missing an id or name and trims the rest", () => {
    const { api } = loadClinicsStore();
    const slot = createMemorySlot([
      { id: " saved-1 ", name: " 有效診所 " },
      { id: "", name: "沒有 id" },
      { id: "saved-3", name: "   " },
      null,
    ]);
    const store = api.domains.clinics.createStore({ slot });

    assert.deepEqual(plain(store.load()), [{ id: "saved-1", name: "有效診所" }]);
  });

  it("ignores a duplicate name and a blank name", () => {
    const { api } = loadClinicsStore();
    const slot = createMemorySlot([{ id: "saved-1", name: "喵喵動物醫院" }]);
    const store = api.domains.clinics.createStore({ slot });

    assert.equal(store.add("喵喵動物醫院").length, 1);
    assert.equal(store.add("   ").length, 1);
    assert.equal(slot.stats.writes, 0, "no-op adds must not persist");
  });

  it("keeps the on-disk shape when built from a storage key", () => {
    const { api, storage } = loadClinicsStore(
      new FakeStorage({
        "petlive-saved-clinics": JSON.stringify([
          { id: "saved-1", name: "既有診所" },
        ]),
      })
    );
    const store = api.domains.clinics.createStore({
      storageKey: "petlive-saved-clinics",
    });

    assert.deepEqual(
      plain(store.load()),
      [{ id: "saved-1", name: "既有診所" }],
      "clinics saved before the slot layer must still load"
    );

    store.add("新診所");
    const raw = storage.values.get("petlive-saved-clinics");
    assert.deepEqual(
      JSON.parse(raw).map((item) => item.name),
      ["既有診所", "新診所"],
      "raw format must stay a plain JSON array"
    );
  });

  it("re-reads storage so a second tab cannot clobber saved clinics", () => {
    const { api, storage } = loadClinicsStore(
      new FakeStorage({
        "petlive-saved-clinics": JSON.stringify([
          { id: "saved-1", name: "第一分頁存的" },
        ]),
      })
    );
    const store = api.domains.clinics.createStore({
      storageKey: "petlive-saved-clinics",
    });

    store.load();

    // Another tab saves a clinic against the same key.
    storage.setItem(
      "petlive-saved-clinics",
      JSON.stringify([
        { id: "saved-1", name: "第一分頁存的" },
        { id: "saved-2", name: "另一分頁存的" },
      ])
    );

    assert.deepEqual(
      plain(store.add("本分頁存的")).map((item) => item.name),
      ["第一分頁存的", "另一分頁存的", "本分頁存的"]
    );
  });

  it("survives unreadable storage without throwing", () => {
    const { api } = loadClinicsStore(
      new FakeStorage({ "petlive-saved-clinics": "{ not json" })
    );
    const store = api.domains.clinics.createStore({
      storageKey: "petlive-saved-clinics",
    });

    assert.deepEqual(plain(store.load()), []);
    assert.equal(store.add("新診所").length, 1);
  });

  it("requires a slot or a storage key", () => {
    const { api } = loadClinicsStore();
    assert.throws(
      () => api.domains.clinics.createStore({}),
      /requires slot or storageKey/
    );
  });
});
