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

const PERSIST_FILES = [
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
];

test("persist empty observations for real pets (T1)", () => {
  const obs = loadObservations(PERSIST_FILES);
  const empty = obs.emptyObservations();
  assert.equal(empty.version, 1);
  assert.deepEqual(Object.keys(empty.metrics), []);
  assert.equal(obs.isObservationsEmpty(null), true);
  assert.equal(obs.isObservationsEmpty(empty), true);

  const hydrated = obs.hydrateObservations(null);
  assert.deepEqual(Object.keys(hydrated.metrics), []);
  assert.ok(hydrated.viewData.week);
  assert.ok(hydrated.viewData.week.labels.length > 0);
});

test("serialize → hydrate round-trip keeps custom metric + series point", () => {
  const obs = loadObservations(PERSIST_FILES);
  const metrics = obs.createRegistry({});
  const viewData = obs.createEmptyViewData([]);
  const controller = obs.createController({
    metrics: metrics,
    viewData: viewData,
    visits: [],
  });

  const customId = controller.addCustomMetric("疲勞程度");
  assert.ok(customId);
  controller.addDiaryPoint({
    metricId: customId,
    value: 7,
    index: 2,
    visitId: "v-1",
    text: "下午較累",
  });

  const slice = obs.serializeObservations(controller.exportPersistState());
  assert.equal(slice.metrics[customId].label, "疲勞程度");
  assert.equal(slice.seriesByMode.week[customId].current[2], 7);
  assert.equal(slice.notes.length, 1);
  assert.equal(slice.notes[0].visitId, "v-1");

  const pet = { id: "pet-a", observations: null };
  assert.equal(obs.writeObservationsToPet(pet, slice, { isDemoMode: false }), true);
  assert.ok(pet.observations);

  const again = obs.hydrateObservations(pet.observations);
  assert.equal(again.metrics[customId].label, "疲勞程度");
  assert.equal(again.viewData.week[customId].current[2], 7);

  const metrics2 = obs.createRegistry(again.metrics);
  assert.equal(metrics2.getCustomCount(), 1);
  const nextId = metrics2.addCustom("第二個");
  assert.equal(nextId, "custom_2");
});

test("demo mode blocks writeObservationsToPet (I1)", () => {
  const obs = loadObservations(PERSIST_FILES);
  const pet = { id: "real-pet", observations: obs.emptyObservations() };
  const slice = obs.serializeObservations({
    metrics: { custom_1: { label: "不該寫入", scale: "fixed10", unit: "分" } },
    viewData: obs.createEmptyViewData(["custom_1"]),
    notes: [],
    ui: {},
  });

  assert.equal(obs.writeObservationsToPet(pet, slice, { isDemoMode: true }), false);
  assert.equal(Object.keys(pet.observations.metrics || {}).length, 0);

  assert.equal(
    obs.writeObservationsToPet(pet, slice, {
      isDemoMode: function () {
        return true;
      },
    }),
    false
  );
});

test("controller flushToPet / loadFromPet pet-scoped; no cross-pet leak", () => {
  const obs = loadObservations(PERSIST_FILES);

  const petA = { id: "pet-a", observations: obs.emptyObservations() };
  const petB = { id: "pet-b", observations: obs.emptyObservations() };

  const metricsA = obs.createRegistry({});
  const controllerA = obs.createController({
    metrics: metricsA,
    viewData: obs.createEmptyViewData([]),
    visits: [],
    isDemoMode: false,
  });
  const idA = controllerA.addCustomMetric("A指標");
  controllerA.addDiaryPoint({ metricId: idA, value: 4, index: 1 });
  assert.equal(controllerA.flushToPet(petA), true);

  const metricsB = obs.createRegistry({});
  const controllerB = obs.createController({
    metrics: metricsB,
    viewData: obs.createEmptyViewData([]),
    visits: [],
    isDemoMode: false,
  });
  const idB = controllerB.addCustomMetric("B指標");
  controllerB.addDiaryPoint({ metricId: idB, value: 9, index: 3 });
  assert.equal(controllerB.flushToPet(petB), true);

  const reloadA = obs.createController({
    metrics: obs.createRegistry({}),
    viewData: obs.createEmptyViewData([]),
    visits: [],
  });
  // Both empty registries mint custom_1 — isolation is by pet.observations content, not id string.
  assert.equal(idA, "custom_1");
  assert.equal(idB, "custom_1");

  reloadA.loadFromPet(petA);
  assert.equal(reloadA.metrics.listIds().length, 1);
  assert.equal(reloadA.metrics.get("custom_1").label, "A指標");
  assert.equal(reloadA.getSeries("custom_1", "week").current[1], 4);
  assert.equal(reloadA.getSeries("custom_1", "week").current[3], null);

  reloadA.loadFromPet(petB);
  assert.equal(reloadA.metrics.listIds().length, 1);
  assert.equal(reloadA.metrics.get("custom_1").label, "B指標");
  assert.equal(reloadA.getSeries("custom_1", "week").current[3], 9);
  assert.equal(reloadA.getSeries("custom_1", "week").current[1], null);
});

test("controller flush blocked when demo flag on", () => {
  const obs = loadObservations(PERSIST_FILES);
  const pet = { id: "pet-x", observations: obs.emptyObservations() };
  const controller = obs.createController({
    metrics: obs.createRegistry({}),
    viewData: obs.createEmptyViewData([]),
    visits: [],
    isDemoMode: true,
  });
  controller.addCustomMetric("不該存");
  assert.equal(controller.flushToPet(pet), false);
  assert.equal(obs.isObservationsEmpty(pet.observations), true);
});

test("reload paint smoke: custom metric listed and series non-empty after hydrate", () => {
  const obs = loadObservations(PERSIST_FILES);
  const metrics = obs.createRegistry({});
  const controller = obs.createController({
    metrics: metrics,
    viewData: obs.createEmptyViewData([]),
    visits: obs.getDemoVisits(),
  });
  const id = controller.addCustomMetric("腸胃觀察");
  controller.addDiaryPoint({ metricId: id, value: 6, index: 0 });

  const pet = { id: "pet-a" };
  controller.flushToPet(pet);

  const hydrated = obs.hydrateObservations(pet.observations);
  const registry = obs.createRegistry(hydrated.metrics);
  const ids = registry.listIds();
  assert.ok(ids.indexOf(id) >= 0);
  assert.equal(registry.get(id).label, "腸胃觀察");
  assert.equal(obs.isEmptySeries(hydrated.viewData.week[id]), false);
  assert.equal(hydrated.viewData.week[id].current[0], 6);
});
