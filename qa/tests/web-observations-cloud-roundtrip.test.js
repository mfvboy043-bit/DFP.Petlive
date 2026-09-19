import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, "../../apps/web");
const OBS_DIR = path.join(WEB_ROOT, "domains/observations");
const CLOUD_DIR = path.join(WEB_ROOT, "domains/cloud");

const OBS_FILES = [
  "metrics.js",
  "series.js",
  "events.js",
  "diary.js",
  "summary.js",
  "titles.js",
  "demo-seed.js",
  "projects.js",
  "persist.js",
  "controller.js",
  "cloud-roundtrip.js",
];

function loadSandbox() {
  const sandbox = {
    console,
    PetLiveWeb: { domains: {} },
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  for (const file of OBS_FILES) {
    const src = readFileSync(path.join(OBS_DIR, file), "utf8");
    vm.runInContext(src, sandbox, { filename: file });
  }
  for (const file of ["selectors.js", "controller.js"]) {
    const src = readFileSync(path.join(CLOUD_DIR, file), "utf8");
    vm.runInContext(src, sandbox, { filename: `cloud/${file}` });
  }

  return sandbox;
}

function makeCloudHarness(sandbox, { demo = false, seedIds = ["seed-a"] } = {}) {
  const cloud = sandbox.PetLiveWeb.domains.cloud;
  const selectors = cloud.createSelectors({
    getSeedPetIds: () => seedIds.slice(),
    getSeedPetsSnapshot: () => seedIds.map((id) => ({ id })),
  });

  const pets = [];
  const archivedPets = [];
  let currentPetId = null;
  const store = {
    petsGraph: null,
    ownerProfile: {},
    petAlerts: {},
    suppressedAlerts: {},
    petPhotos: {},
    labReports: {},
    syncMeta: selectors.emptySyncMeta(),
  };
  let syncMetaPresent = false;

  function slot(key) {
    return {
      read: () => store[key],
      write: (value) => {
        store[key] = value;
        if (key === "syncMeta") syncMetaPresent = true;
        return true;
      },
    };
  }

  const petsGraph = {
    replaceGraph({ pets: nextPets = [], archivedPets: nextArchived = [] } = {}) {
      pets.length = 0;
      archivedPets.length = 0;
      for (const pet of nextPets) pets.push(pet);
      for (const pet of nextArchived) archivedPets.push(pet);
    },
    clearGraph() {
      pets.length = 0;
      archivedPets.length = 0;
    },
  };

  const controller = cloud.createController({
    selectors,
    getPets: () => pets,
    getArchivedPets: () => archivedPets,
    getCurrentPetId: () => currentPetId,
    setCurrentPetId: (id) => {
      currentPetId = id;
    },
    petsGraph,
    petsGraphSlot: slot("petsGraph"),
    ownerProfileSlot: slot("ownerProfile"),
    ownerAlertsSlot: slot("petAlerts"),
    suppressedAlertsSlot: slot("suppressedAlerts"),
    petPhotosSlot: slot("petPhotos"),
    labReportsSlot: slot("labReports"),
    syncMetaSlot: {
      read: () => store.syncMeta,
      write: (value) => {
        store.syncMeta = value;
        syncMetaPresent = true;
        return true;
      },
    },
    isDemoMode: () => demo,
    hasStoredSyncMeta: () => syncMetaPresent,
    hasStoredPetsGraph: () => store.petsGraph != null,
    readPetsGraphSnapshot: () => store.petsGraph,
  });

  return { cloud, selectors, controller, pets, archivedPets, store };
}

function buildPetWithObservations(obs) {
  const metrics = obs.createRegistry({});
  const viewData = obs.createEmptyViewData([]);
  const controller = obs.createController({
    metrics,
    viewData,
    visits: [],
  });
  const customId = controller.addCustomMetric("雲端往返指標");
  controller.addDiaryPoint({
    metricId: customId,
    value: 8,
    index: 1,
    visitId: "v-cloud",
    text: "backup note",
  });
  const slice = obs.serializeObservations(controller.exportPersistState());
  const pet = {
    id: "pet-obs-1",
    name: "Roundtrip Pet",
    bagPhoto: "should-strip",
    observations: slice,
  };
  return { pet, customId, controller };
}

test("observations survive stripHeavyMedia + buildCloudPayload + apply → loadFromPet", () => {
  const sandbox = loadSandbox();
  const obs = sandbox.PetLiveWeb.domains.observations;
  const { controller: cloudCtrl, pets } = makeCloudHarness(sandbox, {
    demo: false,
    seedIds: ["seed-a"],
  });

  const { pet, customId } = buildPetWithObservations(obs);
  pets.push(pet);

  const stripped = cloudCtrl.stripHeavyMedia(pet);
  assert.equal(stripped.bagPhoto, undefined, "heavy media stripped");
  assert.ok(stripped.observations, "observations not in HEAVY_MEDIA_KEYS");
  assert.equal(stripped.observations.metrics[customId].label, "雲端往返指標");

  cloudCtrl.bumpLocalDataRevision();
  const payload = cloudCtrl.buildCloudPayload();
  const check = obs.assertObservationsInPayload(payload);
  assert.equal(check.ok, true);
  assert.equal(check.count, 1);
  assert.equal(payload.pets[0].observations.seriesByMode.week[customId].current[1], 8);
  assert.equal(payload.pets[0].bagPhoto, undefined);

  pets.length = 0;
  pets.push({ id: "local-before", name: "wipe me", observations: obs.emptyObservations() });

  const applied = cloudCtrl.applyCloudPayload(payload);
  assert.equal(applied, true);
  assert.equal(pets.length, 1);
  assert.equal(pets[0].id, "pet-obs-1");
  assert.ok(pets[0].observations);

  const hydrated = obs.hydrateObservations(pets[0].observations);
  assert.equal(hydrated.metrics[customId].label, "雲端往返指標");
  assert.equal(hydrated.viewData.week[customId].current[1], 8);

  const metrics2 = obs.createRegistry({});
  const ctrl2 = obs.createController({
    metrics: metrics2,
    viewData: obs.createEmptyViewData([]),
    visits: [],
  });
  const loaded = obs.onPetsGraphApplied(pets[0], ctrl2);
  assert.ok(loaded);
  assert.equal(metrics2.get(customId).label, "雲端往返指標");
  assert.equal(ctrl2.getSeries(customId).current[1], 8);
});

test("demo mode blocks applyCloudPayload (I1) — local observations untouched", () => {
  const sandbox = loadSandbox();
  const obs = sandbox.PetLiveWeb.domains.observations;
  const { controller: cloudCtrl, pets } = makeCloudHarness(sandbox, {
    demo: true,
    seedIds: ["seed-a"],
  });

  const localSlice = obs.serializeObservations({
    metrics: { custom_1: { label: "本地保留", scale: "fixed10", unit: "分" } },
    viewData: obs.createEmptyViewData(["custom_1"]),
    notes: [],
    ui: {},
  });
  pets.push({ id: "local-keep", observations: localSlice });
  const snapshot = JSON.stringify(pets[0].observations);

  const payload = {
    version: 1,
    localRevision: 2,
    pets: [
      {
        id: "from-cloud",
        observations: obs.serializeObservations({
          metrics: { custom_9: { label: "不該套用", scale: "fixed10", unit: "分" } },
          viewData: obs.createEmptyViewData(["custom_9"]),
          notes: [],
          ui: {},
        }),
      },
    ],
  };

  assert.equal(cloudCtrl.applyCloudPayload(payload), false);
  assert.equal(pets.length, 1);
  assert.equal(pets[0].id, "local-keep");
  assert.equal(JSON.stringify(pets[0].observations), snapshot);
});

test("failed apply (bad payload) does not wipe local observations (A2 smoke)", () => {
  const sandbox = loadSandbox();
  const obs = sandbox.PetLiveWeb.domains.observations;
  const { controller: cloudCtrl, pets } = makeCloudHarness(sandbox, {
    demo: false,
    seedIds: ["seed-a"],
  });

  const { pet, customId } = buildPetWithObservations(obs);
  pets.push(pet);
  const before = JSON.stringify(pets[0].observations);

  assert.equal(cloudCtrl.applyCloudPayload(null), false);
  assert.equal(cloudCtrl.applyCloudPayload({}), false);
  assert.equal(cloudCtrl.applyCloudPayload({ pets: "nope" }), false);
  assert.equal(JSON.stringify(pets[0].observations), before);
  assert.equal(pets[0].observations.metrics[customId].label, "雲端往返指標");
});

test("parity strip matches cloud strip for observations retention", () => {
  const sandbox = loadSandbox();
  const obs = sandbox.PetLiveWeb.domains.observations;
  const { controller: cloudCtrl } = makeCloudHarness(sandbox);

  const pet = {
    id: "p1",
    bagPhoto: "drop",
    observations: {
      version: 1,
      metrics: { custom_1: { label: "留著", scale: "fixed10", unit: "分" } },
      seriesByMode: {},
      notes: [],
      ui: {},
    },
  };

  const viaCloud = cloudCtrl.stripHeavyMedia(pet);
  const viaParity = obs.stripHeavyMediaParity(pet);
  assert.equal(viaCloud.bagPhoto, undefined);
  assert.equal(viaParity.bagPhoto, undefined);
  assert.equal(viaCloud.observations.metrics.custom_1.label, "留著");
  assert.equal(viaParity.observations.metrics.custom_1.label, "留著");

  const sim = obs.buildSimulatedCloudPayload([pet], { localRevision: 3 });
  assert.equal(obs.assertObservationsInPayload(sim).ok, true);
  assert.equal(sim.localRevision, 3);
  assert.equal(sim.pets[0].bagPhoto, undefined);
});

test("shouldBumpLocalDataRevisionAfterFlush documents real-pet bump only", () => {
  const sandbox = loadSandbox();
  const obs = sandbox.PetLiveWeb.domains.observations;
  assert.equal(obs.shouldBumpLocalDataRevisionAfterFlush(true, false), true);
  assert.equal(obs.shouldBumpLocalDataRevisionAfterFlush(true, true), false);
  assert.equal(obs.shouldBumpLocalDataRevisionAfterFlush(false, false), false);
  assert.equal(
    obs.shouldBumpLocalDataRevisionAfterFlush(true, function () {
      return true;
    }),
    false
  );
});
