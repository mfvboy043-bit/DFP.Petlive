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

const PROJECT_FILES = [
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

test("create visit-linked and self-metric projects; kind locked", () => {
  const obs = loadObservations(PROJECT_FILES);
  const store = obs.createProjectStore();

  const a = store.create({
    name: "  9/1 就診追蹤  ",
    kind: "visit-linked",
    visitIds: ["v-2025-09-01", "v-2025-09-15"],
    metricId: "headache",
  });
  assert.ok(a);
  assert.equal(a.name, "9/1 就診追蹤");
  assert.equal(a.kind, "visit-linked");
  assert.equal(a.visitIds.join(","), "v-2025-09-01,v-2025-09-15");

  const b = store.create({
    name: "頭痛程度",
    kind: "self-metric",
    metricId: "headache",
  });
  assert.ok(b);
  assert.equal(b.kind, "self-metric");
  assert.equal(b.visitIds.length, 0);

  assert.equal(store.list().length, 2);
  assert.equal(store.getActive().id, b.id);

  // kind cannot be changed via rename/relink APIs
  assert.equal(store.rename(a.id, "改名仍是就診").kind, "visit-linked");
  assert.equal(store.relinkVisits(b.id, ["v-2025-09-01"]), null);
  assert.equal(store.get(b.id).kind, "self-metric");
});

test("rename + relink visits (A only); name clamp 32", () => {
  const obs = loadObservations(PROJECT_FILES);
  const store = obs.createProjectStore();
  const a = store.create({
    name: "追蹤",
    kind: "visit-linked",
    visitIds: ["v-2025-09-01"],
    metricId: "headache",
  });

  assert.equal(obs.normalizeProjectName("x".repeat(40)).length, 32);
  assert.equal(store.rename(a.id, ""), null);
  assert.equal(store.rename(a.id, "  " + "長".repeat(40)).name.length, 32);

  const relinked = store.relinkVisits(a.id, ["v-2025-09-29", "v-2025-09-01"]);
  assert.ok(relinked);
  assert.equal(relinked.visitIds.join(","), "v-2025-09-29,v-2025-09-01");
  assert.equal(store.relinkVisits(a.id, []), null);
});

test("delete project keeps visits; last delete → empty", () => {
  const obs = loadObservations(PROJECT_FILES);
  const visits = obs.getDemoVisits();
  const metrics = obs.createRegistry(obs.getDefaultMetricMeta());
  const controller = obs.createController({
    metrics: metrics,
    viewData: obs.createDemoViewData(),
    visits: visits,
  });

  controller.seedDemoProjects();
  assert.equal(controller.getProjects().length, 2);
  const visitCountBefore = controller.getVisits().filter(function (v) {
    return v.id;
  }).length;

  const first = controller.getProjects()[0];
  controller.deleteProject(first.id);
  assert.equal(controller.getProjects().length, 1);
  assert.equal(
    controller.getVisits().filter(function (v) {
      return v.id;
    }).length,
    visitCountBefore
  );

  const last = controller.getProjects()[0];
  controller.deleteProject(last.id);
  assert.equal(controller.getProjects().length, 0);
  assert.equal(controller.getActiveProject(), null);
  assert.equal(
    controller.getVisits().filter(function (v) {
      return v.id;
    }).length,
    visitCountBefore
  );
});

test("delete purges orphaned notes/metric; shared metric kept; visits remain", () => {
  const obs = loadObservations(PROJECT_FILES);
  const visits = obs.getDemoVisits();
  const metrics = obs.createRegistry(obs.getDefaultMetricMeta());
  const controller = obs.createController({
    metrics: metrics,
    viewData: obs.createDemoViewData(),
    visits: visits,
  });

  const visitCountBefore = controller.getVisits().filter(function (v) {
    return v.id;
  }).length;

  // Shared demo metric across two projects (Q1 pattern).
  const sharedA = controller.createProject({
    name: "就診追蹤",
    kind: "visit-linked",
    visitIds: ["v-2025-09-01"],
    metricId: "headache",
  });
  const sharedB = controller.createProject({
    name: "頭痛程度",
    kind: "self-metric",
    metricId: "headache",
  });
  assert.ok(sharedA && sharedB);
  controller.addDiaryPoint({
    metricId: "headache",
    value: 6,
    index: 0,
    text: "共享指標筆記",
  });
  assert.equal(controller.getNotes().length, 1);

  controller.deleteProject(sharedA.id);
  assert.equal(controller.getNotes().length, 1, "shared metric notes stay while another project refs it");
  assert.ok(metrics.get("headache"), "shared demo metric kept");
  assert.equal(
    controller.getVisits().filter(function (v) {
      return v.id;
    }).length,
    visitCountBefore
  );

  // Orphaned custom metric on a dedicated self-metric project.
  const custom = controller.createProject({
    name: "疲勞專案",
    kind: "self-metric",
    metricName: "疲勞程度",
  });
  assert.ok(custom);
  const customMetricId = custom.metricId;
  assert.ok(customMetricId);
  assert.ok(metrics.get(customMetricId));
  controller.setActiveProject(custom.id);
  controller.addDiaryPoint({
    metricId: customMetricId,
    value: 8,
    index: 1,
    text: "自訂指標筆記",
  });
  const notesBeforeCustomDelete = controller.getNotes().length;
  assert.ok(notesBeforeCustomDelete >= 2);

  controller.deleteProject(custom.id);
  assert.equal(metrics.get(customMetricId), null, "orphaned custom metric pruned");
  assert.equal(
    controller.getNotes().filter(function (n) {
      return n.metricId === customMetricId;
    }).length,
    0,
    "orphaned custom notes removed"
  );
  assert.equal(
    controller.getViewData().week[customMetricId],
    undefined,
    "orphaned custom series cleared from viewData"
  );
  assert.ok(metrics.get("headache"), "headache still referenced by remaining project");
  assert.equal(
    controller.getNotes().filter(function (n) {
      return n.metricId === "headache";
    }).length,
    1
  );

  // Last shared project → orphaned headache notes purged; visits untouched.
  controller.deleteProject(sharedB.id);
  assert.equal(
    controller.getNotes().filter(function (n) {
      return n.metricId === "headache";
    }).length,
    0,
    "notes gone when metric becomes orphaned"
  );
  assert.equal(
    controller.getVisits().filter(function (v) {
      return v.id;
    }).length,
    visitCountBefore,
    "visits never deleted"
  );
});

test("resolveChartTitle prefers project.name", () => {
  const obs = loadObservations(["titles.js"]);
  assert.equal(
    obs.resolveChartTitle({
      projectName: "9/1 就診追蹤（示範）",
      customTitle: "不該出現",
      metricLabel: "頭痛程度",
      modeLabel: "每週",
    }),
    "9/1 就診追蹤（示範）"
  );
  assert.equal(
    obs.resolveChartTitle({
      project: { name: "頭痛程度（示範）" },
      metricLabel: "頭痛程度",
      modeLabel: "每週",
    }),
    "頭痛程度（示範）"
  );
});

test("kind A visit axis labels from visit dates; kind B keeps mode", () => {
  const obs = loadObservations(PROJECT_FILES);
  const metrics = obs.createRegistry(obs.getDefaultMetricMeta());
  const controller = obs.createController({
    metrics: metrics,
    viewData: obs.createDemoViewData(),
    visits: obs.getDemoVisits(),
  });
  controller.seedDemoProjects();

  const visitProj = controller.getProjects().find(function (p) {
    return p.kind === "visit-linked";
  });
  controller.setActiveProject(visitProj.id);
  assert.equal(controller.hidesModeToolbar(), true);
  assert.equal(controller.hidesCompare(), true);
  const axis = controller.getModeData();
  assert.ok(axis.labels.length >= 1);
  assert.equal(axis.labels[0], "9/1");
  assert.equal(controller.resolveTitle(), visitProj.name);

  const selfProj = controller.getProjects().find(function (p) {
    return p.kind === "self-metric";
  });
  controller.setActiveProject(selfProj.id);
  assert.equal(controller.hidesModeToolbar(), false);
  assert.equal(controller.hidesCompare(), false);
  controller.setMode("week");
  assert.equal(controller.getModeData().label, "每週");
  assert.equal(controller.resolveTitle(), selfProj.name);
});

test("persist bag includes projects; demo mode blocks write", () => {
  const obs = loadObservations(PROJECT_FILES);
  const metrics = obs.createRegistry(obs.getDefaultMetricMeta());
  const controller = obs.createController({
    metrics: metrics,
    viewData: obs.createDemoViewData(),
    visits: obs.getDemoVisits(),
    isDemoMode: true,
  });
  controller.seedDemoProjects();
  const slice = obs.serializeObservations(controller.exportPersistState());
  assert.equal(slice.projects.length, 2);
  assert.ok(slice.activeProjectId);
  assert.ok(slice.projectAxes);

  const pet = { id: "pet-a", observations: obs.emptyObservations() };
  assert.equal(controller.flushToPet(pet), false);
  assert.equal((pet.observations.projects || []).length, 0);

  assert.equal(
    obs.writeObservationsToPet(pet, slice, { isDemoMode: false }),
    true
  );
  assert.equal(pet.observations.projects.length, 2);
  const hydrated = obs.hydrateObservations(pet.observations);
  assert.equal(hydrated.projects.length, 2);
  assert.equal(hydrated.activeProjectId, slice.activeProjectId);
});
