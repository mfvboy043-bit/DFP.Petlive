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

function makeGraph(api, pets, archivedPets, timers, bumpedRef) {
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
      bumpedRef.n += 1;
    },
  });
  return { graph, slot, timers };
}

describe("core/pets-graph write door", () => {
  it("hydrates, pushPet, and schedulePersist via slot", () => {
    const { api, timers } = loadPetsGraph();
    const pets = [];
    const archivedPets = [];
    const bumpedRef = { n: 0 };
    const { graph, slot } = makeGraph(api, pets, archivedPets, timers, bumpedRef);

    const id = graph.hydrate();
    assert.equal(id, "p1");
    assert.equal(pets.length, 1);
    assert.equal(pets[0].name, "Seed");

    graph.pushPet({ id: "p2", name: "Mochi" });
    assert.equal(pets.length, 2);
    graph.schedulePersist();
    assert.ok(bumpedRef.n >= 1);
    timers.forEach((t) => t.fn());
    const stored = slot.read();
    assert.equal(stored.pets.length, 2);
    assert.equal(stored.pets[1].name, "Mochi");
  });

  it("schedulePersist strips avatar photo only; keeps visit proof media (SEC-1)", () => {
    const { api, timers } = loadPetsGraph();
    const pets = [];
    const archivedPets = [];
    const bumpedRef = { n: 0 };
    const { graph, slot } = makeGraph(api, pets, archivedPets, timers, bumpedRef);
    graph.hydrate();
    pets[0].photo = "data:image/jpeg;base64," + "A".repeat(9000);
    pets[0].visits = [
      {
        id: "v1",
        rxPhoto: "data:image/jpeg;base64," + "B".repeat(9000),
        bagPhoto: "data:image/jpeg;base64," + "C".repeat(9000),
        imaging: { xrayPhotos: ["data:image/jpeg;base64," + "D".repeat(9000)] },
      },
    ];
    graph.schedulePersist();
    timers.forEach((entry) => entry.fn());
    const stored = slot.read();
    assert.equal(stored.pets[0].photo, undefined);
    assert.equal(stored.pets[0].visits[0].rxPhoto.startsWith("data:image"), true);
    assert.equal(stored.pets[0].visits[0].bagPhoto.startsWith("data:image"), true);
    assert.ok(stored.pets[0].visits[0].imaging?.xrayPhotos?.[0]);
    assert.equal(pets[0].photo.startsWith("data:image"), true);
  });

  it("scheduleSelectionPersist writes only the tiny selection slot", () => {
    const { api, timers } = loadPetsGraph();
    const pets = [{ id: "p1", name: "Seed" }];
    const archivedPets = [];
    const selection = api.storage.createJsonSlot({
      key: "test-current-pet",
      fallback: () => ({ currentPetId: null }),
      validate: (value) => Boolean(value && typeof value === "object"),
      coalesceMs: 0,
    });
    const graphSlot = api.storage.createJsonSlot({
      key: "test-pets-graph",
      fallback: () => ({
        version: 1,
        pets: [{ id: "p1", name: "Seed" }],
        archivedPets: [],
        currentPetId: "p1",
      }),
      validate: (value) =>
        value && Array.isArray(value.pets) && Array.isArray(value.archivedPets),
      coalesceMs: 0,
    });
    let current = "p1";
    const graph = api.core.createPetsGraph({
      pets,
      archivedPets,
      slot: graphSlot,
      selectionSlot: selection,
      getCurrentPetId: () => current,
      cloneSeedPets: () => [{ id: "seed", name: "Seed" }],
    });
    graph.hydrate();
    current = "p1";
    pets[0].photo = "data:image/jpeg;base64," + "C".repeat(9000);
    graph.scheduleSelectionPersist();
    timers.forEach((entry) => entry.fn());
    assert.equal(selection.read().currentPetId, "p1");
    const graphRaw = graphSlot.read();
    assert.equal(graphRaw.pets[0].photo, undefined);
  });

  it("replaceGraph and clearGraph rewrite arrays in place", () => {
    const { api, timers } = loadPetsGraph();
    const pets = [];
    const archivedPets = [];
    const bumpedRef = { n: 0 };
    const { graph } = makeGraph(api, pets, archivedPets, timers, bumpedRef);
    graph.hydrate();

    graph.replaceGraph({
      pets: [{ id: "a", name: "A" }, { id: "b", name: "B" }],
      archivedPets: [{ id: "z", name: "Z" }],
    });
    assert.equal(pets.length, 2);
    assert.equal(pets[0].id, "a");
    assert.equal(archivedPets.length, 1);
    assert.equal(archivedPets[0].id, "z");

    graph.clearGraph();
    assert.equal(pets.length, 0);
    assert.equal(archivedPets.length, 0);
  });

  function assertFacadeNoRawStructuralMutates(relPath) {
    const source = readFileSync(new URL(relPath, WEB_ROOT), "utf8");
    const stripped = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");

    assert.equal(
      /pets\.push\s*\(/.test(stripped),
      false,
      `${relPath} must not raw pets.push (use petsGraph.pushPet / replaceGraph)`
    );
    assert.equal(
      /pets\.splice\s*\(/.test(stripped),
      false,
      `${relPath} must not raw pets.splice`
    );
    assert.equal(
      /pets\.length\s*=\s*0/.test(stripped),
      false,
      `${relPath} must not raw pets.length = 0`
    );
    assert.equal(
      /archivedPets\.push\s*\(/.test(stripped),
      false,
      `${relPath} must not raw archivedPets.push`
    );
    assert.equal(
      /archivedPets\.length\s*=\s*0/.test(stripped),
      false,
      `${relPath} must not raw archivedPets.length = 0`
    );
    assert.match(
      stripped,
      /petsGraph\s*,/,
      `${relPath} cloud controller must receive petsGraph door`
    );
  }

  it("fails if C facade has raw structural pets mutates", () => {
    assertFacadeNoRawStructuralMutates("c/app.js");
  });

  it("fails if B facade has raw structural pets mutates", () => {
    assertFacadeNoRawStructuralMutates("app.js");
  });
});
