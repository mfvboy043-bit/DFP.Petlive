import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

class FakeStorage {
  constructor(seed = {}) {
    this.values = new Map(Object.entries(seed));
  }
  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }
  setItem(key, value) {
    this.values.set(key, String(value));
  }
  removeItem(key) {
    this.values.delete(key);
  }
}

function loadPetsGraph(storage = new FakeStorage()) {
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
    document: { addEventListener() {}, visibilityState: "visible" },
  });
  context.globalThis = context;
  context.window = context;
  ["core/storage.js", "core/pets-graph.js"].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });
  return { api: context.PetLiveWeb, timers };
}

describe("core/pets-graph write door", () => {
  it("hydrates, pushPet, and schedulePersist via slot", () => {
    const { api, timers } = loadPetsGraph();
    const pets = [];
    const archivedPets = [];
    let bumped = 0;
    const slot = api.storage.createJsonSlot({
      key: "test-pets-graph",
      fallback: () => ({
        version: 1,
        pets: [{ id: "p1", name: "Seed" }],
        archivedPets: [],
        currentPetId: "p1",
      }),
      validate: (value) =>
        value &&
        Array.isArray(value.pets) &&
        Array.isArray(value.archivedPets),
      coalesceMs: 0,
    });
    const graph = api.core.createPetsGraph({
      pets,
      archivedPets,
      slot,
      getCurrentPetId: () => pets[0]?.id || null,
      cloneSeedPets: () => [{ id: "seed", name: "Seed" }],
      onAfterScheduleWrite: () => {
        bumped += 1;
      },
    });

    const id = graph.hydrate();
    assert.equal(id, "p1");
    assert.equal(pets.length, 1);
    assert.equal(pets[0].name, "Seed");

    graph.pushPet({ id: "p2", name: "Mochi" });
    assert.equal(pets.length, 2);
    graph.schedulePersist();
    assert.ok(bumped >= 1);
    // Flush coalesce timer if any
    timers.forEach((t) => t.fn());
    const stored = slot.read();
    assert.equal(stored.pets.length, 2);
    assert.equal(stored.pets[1].name, "Mochi");
  });
});
