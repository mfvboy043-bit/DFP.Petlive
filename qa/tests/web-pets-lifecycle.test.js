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

function loadPetsDomain(storage = new FakeStorage()) {
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
    "core/storage.js",
    "domains/pets/controller.js",
    "domains/pets/lifecycle.js",
    "domains/pets/media.js",
  ].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });
  return { api: context.PetLiveWeb, storage, timers, context };
}

function sampleIdentity(overrides = {}) {
  return {
    name: "Mochi",
    species: "dog",
    speciesLabel: "Dog",
    breedKey: "shiba",
    breed: "Shiba",
    gender: "female",
    isNeutered: "yes",
    birthDate: "2020-01-01",
    weight: 8.5,
    weightDate: "2026-08-01",
    chipNumber: "CHIP-1",
    ...overrides,
  };
}

describe("PL-01 pets lifecycle mutations", () => {
  it("createPet builds id, empty collections, tone, and identity fields", () => {
    const { api } = loadPetsDomain();
    const pets = [];
    const archivedPets = [];
    const life = api.domains.pets.createLifecycle({
      pets,
      archivedPets,
      tones: ["tone-a", "tone-b"],
      newId: () => "p-fixed",
    });

    const pet = life.createPet(sampleIdentity());
    assert.equal(pet.id, "p-fixed");
    assert.equal(pet.tone, "tone-a");
    assert.equal(pet.name, "Mochi");
    assert.equal(pet.species, "dog");
    assert.equal(pet.alertCount, 0);
    assert.ok(Array.isArray(pet.alerts) && pet.alerts.length === 0);
    assert.ok(Array.isArray(pet.meds) && pet.meds.length === 0);
    assert.ok(Array.isArray(pet.visits) && pet.visits.length === 0);
    assert.ok(Array.isArray(pet.vaccines) && pet.vaccines.length === 0);
    assert.equal(pet.parasitePrevention.external, null);
    assert.equal(pet.parasitePrevention.heartworm, null);
    assert.equal(pets.length, 0);
  });

  it("updatePet mutates identity only and preserves visits/meds by reference", () => {
    const { api } = loadPetsDomain();
    const pets = [];
    const life = api.domains.pets.createLifecycle({
      pets,
      archivedPets: [],
      tones: ["t"],
    });
    const visits = [{ id: "v1" }];
    const meds = [{ id: "m1" }];
    const pet = {
      id: "p1",
      name: "Old",
      species: "cat",
      visits,
      meds,
      vaccines: [],
      alerts: [],
    };

    life.updatePet(
      pet,
      sampleIdentity({ name: "New", species: "dog", breed: "Poodle" })
    );
    assert.equal(pet.name, "New");
    assert.equal(pet.species, "dog");
    assert.equal(pet.breed, "Poodle");
    assert.equal(pet.visits, visits);
    assert.equal(pet.meds, meds);
    assert.equal(pet.visits.length, 1);
    assert.equal(pet.visits[0].id, "v1");
  });

  it("archivePet moves pet, sets memorial fields, and returns nextCurrentPetId", () => {
    const { api } = loadPetsDomain();
    const a = { id: "a", name: "A", visits: [{ id: "v" }] };
    const b = { id: "b", name: "B" };
    const pets = [a, b];
    const archivedPets = [];
    const life = api.domains.pets.createLifecycle({ pets, archivedPets });

    const missing = life.archivePet("a", { memorialNote: "x" });
    assert.equal(missing.ok, false);
    assert.equal(missing.reason, "missing_passed_away_date");
    assert.equal(pets.length, 2);

    const result = life.archivePet("a", {
      passedAwayDate: "2026-08-01",
      memorialNote: "rest",
      currentPetId: "a",
    });
    assert.equal(result.ok, true);
    assert.equal(result.archived, a);
    assert.equal(a.passedAwayDate, "2026-08-01");
    assert.equal(a.memorialNote, "rest");
    assert.equal(a.visits.length, 1);
    assert.equal(a.visits[0].id, "v");
    assert.equal(pets.length, 1);
    assert.equal(pets[0].id, "b");
    assert.equal(archivedPets[0], a);
    assert.equal(result.nextCurrentPetId, "b");
  });

  it("archivePet keeps current when archiving a non-current pet", () => {
    const { api } = loadPetsDomain();
    const pets = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ];
    const archivedPets = [];
    const life = api.domains.pets.createLifecycle({ pets, archivedPets });
    const result = life.archivePet("b", {
      passedAwayDate: "2026-08-01",
      currentPetId: "a",
    });
    assert.equal(result.ok, true);
    assert.equal(result.nextCurrentPetId, undefined);
    assert.equal(pets.length, 1);
    assert.equal(pets[0].id, "a");
  });

  it("removePet splices active list and applies next-id rule", () => {
    const { api } = loadPetsDomain();
    const pets = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ];
    const life = api.domains.pets.createLifecycle({
      pets,
      archivedPets: [],
    });

    const keep = life.removePet("b", { currentPetId: "a" });
    assert.equal(keep.ok, true);
    assert.equal(keep.nextCurrentPetId, undefined);
    assert.equal(pets.length, 1);
    assert.equal(pets[0].id, "a");

    const last = life.removePet("a", { currentPetId: "a" });
    assert.equal(last.ok, true);
    assert.equal(last.nextCurrentPetId, null);
    assert.equal(pets.length, 0);
  });
});

describe("PL-02 pets media helpers", () => {
  it("set/get/hydrate sync pet.photo via injected slot", () => {
    const { api, storage } = loadPetsDomain();
    const pets = [{ id: "p1", name: "A", photo: "" }];
    const slot = api.storage.createJsonSlot({
      key: "pet-photos",
      fallback: () => ({}),
      validate: (value) => value && typeof value === "object",
      coalesceMs: 0,
    });
    const media = api.domains.pets.createMedia({ photosSlot: slot, pets });

    assert.equal(media.setPetPhoto("p1", "data:img"), true);
    assert.equal(media.getPetPhoto("p1"), "data:img");
    assert.equal(pets[0].photo, "data:img");

    pets[0].photo = "";
    media.hydratePetPhotos(pets);
    assert.equal(pets[0].photo, "data:img");

    assert.equal(media.setPetPhoto("p1", null), true);
    assert.equal(media.getPetPhoto("p1"), null);
    assert.equal(pets[0].photo, "");
    assert.ok(storage.sets >= 1);
  });

  it("flush and hasPendingWrite passthrough to the slot", () => {
    const { api, timers } = loadPetsDomain();
    const slot = api.storage.createJsonSlot({
      key: "pet-photos-pending",
      fallback: () => ({}),
      validate: (value) => value && typeof value === "object",
      coalesceMs: 50,
    });
    const media = api.domains.pets.createMedia({ photosSlot: slot, pets: [] });
    assert.equal(media.hasPendingWrite(), false);
    assert.equal(media.setPetPhoto("p1", "x"), true);
    assert.equal(media.hasPendingWrite(), true);
    assert.equal(timers.length, 1);
    assert.equal(media.flush(), true);
    assert.equal(media.hasPendingWrite(), false);
  });

  it("pure crop metrics, clamp, and export source rect", () => {
    const { api } = loadPetsDomain();
    const media = api.domains.pets.createMedia({
      photosSlot: {
        read: () => ({}),
        scheduleWrite: () => true,
        flush: () => true,
        hasPendingWrite: () => false,
      },
    });

    const metrics = media.computeCropMetrics({
      view: 200,
      naturalW: 400,
      naturalH: 200,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
    assert.equal(metrics.scale, 1);
    assert.equal(metrics.width, 400);
    assert.equal(metrics.height, 200);

    const clamped = media.clampCropOffset(
      { offsetX: 500, offsetY: -500 },
      metrics
    );
    assert.equal(clamped.offsetX, 100);
    assert.equal(Object.is(clamped.offsetY, -0) || clamped.offsetY === 0, true);

    const rect = media.exportCropSourceRect({
      ...metrics,
      left: 0,
      top: 0,
    });
    assert.ok(rect);
    assert.equal(rect.sw > 0, true);
    assert.equal(rect.sh > 0, true);
  });
});

describe("PL pets domain boundaries", () => {
  it("does not touch document or localStorage from domain factories directly", () => {
    const { api, storage, context } = loadPetsDomain();
    let docTouched = false;
    context.document.querySelector = () => {
      docTouched = true;
      return null;
    };
    const pets = [{ id: "p1", name: "A" }];
    const archivedPets = [];
    const life = api.domains.pets.createLifecycle({ pets, archivedPets });
    life.createPet(sampleIdentity());
    life.archivePet("missing", { passedAwayDate: "2026-01-01" });

    const media = api.domains.pets.createMedia({
      photosSlot: {
        read: () => ({}),
        scheduleWrite: () => true,
        flush: () => true,
        hasPendingWrite: () => false,
      },
      pets,
    });
    media.setPetPhoto("p1", "data:x");
    media.computeCropMetrics({
      view: 100,
      naturalW: 100,
      naturalH: 100,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });

    assert.equal(docTouched, false);
    assert.equal(storage.gets, 0);
    assert.equal(storage.sets, 0);
  });

  it("does not require modules/pet and leaves selection controller intact", () => {
    const { api, context } = loadPetsDomain();
    assert.equal(context.PetLive, undefined);
    assert.equal(typeof api.domains.pets.createController, "function");
    assert.equal(typeof api.domains.pets.createLifecycle, "function");
    assert.equal(typeof api.domains.pets.createMedia, "function");
  });
});
