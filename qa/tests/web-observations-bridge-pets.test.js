import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OBS_DIR = path.join(__dirname, "../../apps/web/domains/observations");

function loadObservations(files) {
  const sandbox = { PetLiveWeb: { domains: {} } };
  vm.createContext(sandbox);
  for (const file of files) {
    const src = readFileSync(path.join(OBS_DIR, file), "utf8");
    vm.runInContext(src, sandbox, { filename: file });
  }
  return sandbox.PetLiveWeb.domains.observations;
}

test("bridge syncPets / setActivePet / flushObservations round-trip", () => {
  const obs = loadObservations(["bridge.js"]);

  assert.equal(obs.BRIDGE_ACTIONS.syncPets, "syncPets");
  assert.equal(obs.BRIDGE_ACTIONS.setActivePet, "setActivePet");
  assert.equal(obs.BRIDGE_ACTIONS.flushObservations, "flushObservations");

  const sync = obs.buildBridgeMessage(obs.BRIDGE_ACTIONS.syncPets, {
    pets: [
      { id: "milo", name: "米醬", observations: { version: 1, metrics: {} } },
      { id: "kuro", name: "小黑" },
    ],
    activePetId: "milo",
  });
  const syncParsed = obs.parseBridgeMessage(sync);
  assert.equal(syncParsed.action, "syncPets");
  assert.equal(syncParsed.activePetId, "milo");
  assert.equal(syncParsed.pets.length, 2);
  assert.equal(syncParsed.pets[0].id, "milo");
  assert.equal(syncParsed.pets[0].name, "米醬");
  assert.ok(syncParsed.pets[0].observations);
  assert.equal(syncParsed.pets[1].id, "kuro");

  const setActive = obs.buildBridgeMessage(obs.BRIDGE_ACTIONS.setActivePet, {
    petId: "kuro",
  });
  const setParsed = obs.parseBridgeMessage(setActive);
  assert.equal(setParsed.action, "setActivePet");
  assert.equal(setParsed.petId, "kuro");

  const flush = obs.buildBridgeMessage(obs.BRIDGE_ACTIONS.flushObservations, {
    petId: "milo",
    observations: { version: 1, metrics: { headache: { label: "頭痛" } } },
  });
  const flushParsed = obs.parseBridgeMessage(flush);
  assert.equal(flushParsed.action, "flushObservations");
  assert.equal(flushParsed.petId, "milo");
  assert.equal(flushParsed.observations.metrics.headache.label, "頭痛");

  /* Existing visit actions stay backward compatible */
  const open = obs.buildBridgeMessage(obs.BRIDGE_ACTIONS.openVisit, {
    visitId: "v-2025-09-01",
    visitIndex: 1,
    title: "就診",
  });
  const openParsed = obs.parseBridgeMessage(open);
  assert.equal(openParsed.action, "openVisit");
  assert.equal(openParsed.visitId, "v-2025-09-01");
  assert.equal(openParsed.visitIndex, 1);
  assert.equal(openParsed.title, "就診");
});

test("normalizeSyncPetsPayload never invents pet-a / pet-b", () => {
  const obs = loadObservations(["bridge.js"]);
  const normalized = obs.normalizeSyncPetsPayload({
    pets: [{ id: "milo", name: "米醬" }],
    activePetId: "milo",
  });
  assert.equal(normalized.pets.length, 1);
  assert.equal(normalized.pets[0].id, "milo");
  assert.equal(normalized.activePetId, "milo");
  assert.equal(
    normalized.pets.some((p) => p.id === "pet-a" || p.id === "pet-b"),
    false
  );

  const empty = obs.normalizeSyncPetsPayload({ pets: [], activePetId: "pet-a" });
  assert.equal(empty.pets.length, 0);
  assert.equal(empty.activePetId, "");

  const parsed = obs.parseBridgeMessage(
    obs.buildBridgeMessage(obs.BRIDGE_ACTIONS.syncPets, {
      pets: [{ id: "orange", name: "橘寶" }],
      activePetId: "orange",
    })
  );
  assert.equal(parsed.pets.map((p) => p.id).join(","), "orange");
  assert.equal(parsed.pets.some((p) => p.id === "pet-a"), false);
});

test("flushObservations demo block via writeObservationsToPet (I1)", () => {
  const obs = loadObservations([
    "bridge.js",
    "metrics.js",
    "series.js",
    "events.js",
    "diary.js",
    "summary.js",
    "titles.js",
    "demo-seed.js",
    "projects.js",
    "persist.js",
  ]);
  const pet = { id: "milo", name: "米醬", observations: null };
  const slice = obs.emptyObservations();
  slice.metrics = { headache: { id: "headache", label: "頭痛程度", scale: "fixed10", max: 10 } };

  assert.equal(
    obs.writeObservationsToPet(pet, slice, { isDemoMode: true }),
    false
  );
  assert.equal(pet.observations, null);

  assert.equal(
    obs.writeObservationsToPet(pet, slice, { isDemoMode: false }),
    true
  );
  assert.ok(pet.observations);

  const flushMsg = obs.parseBridgeMessage(
    obs.buildBridgeMessage(obs.BRIDGE_ACTIONS.flushObservations, {
      petId: pet.id,
      observations: pet.observations,
    })
  );
  assert.equal(flushMsg.petId, "milo");
  assert.ok(flushMsg.observations);
});

test("formatLinkedVisitLabel joins visit names from finder", () => {
  const obs = loadObservations(["passport-visits.js"]);
  const visits = {
    "v-1": { id: "v-1", label: "08/02 · 幸福動物醫院" },
    "v-2": { id: "v-2", label: "06/18 · 夜間急診動物醫院" },
  };
  assert.equal(
    obs.formatLinkedVisitLabel({ visitIds: ["v-1", "v-2"] }, function (id) {
      return visits[id];
    }),
    "08/02 · 幸福動物醫院、06/18 · 夜間急診動物醫院"
  );
  assert.equal(obs.formatLinkedVisitLabel({ visitIds: [] }, function () {
    return null;
  }), "");
});
