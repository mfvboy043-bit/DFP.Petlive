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
  assert.equal(b.kind, "notebook");
  assert.equal(b.metricIds.join(","), "headache");
  assert.equal(b.visitIds.length, 0);

  assert.equal(store.list().length, 2);
  assert.equal(store.getActive().id, b.id);

  // kind cannot be changed via rename/relink APIs
  assert.equal(store.rename(a.id, "改名仍是就診").kind, "visit-linked");
  assert.equal(store.relinkVisits(b.id, ["v-2025-09-01"]), null);
  assert.equal(store.get(b.id).kind, "notebook");
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
  assert.equal(obs.normalizeProjectCaption(" 術後體重觀察 ").length, 6);
  assert.equal(obs.normalizeProjectCaption("x".repeat(90)).length, 80);
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

  // Extra metric on the same notebook; deleting it should keep the project.
  const custom = controller.createProject({
    name: "疲勞專案",
    kind: "self-metric",
    metricName: "疲勞程度",
  });
  assert.ok(custom);
  const customMetricId = custom.focusMetricId || controller.getState().metric;
  assert.ok(customMetricId);
  assert.notEqual(customMetricId, "headache");
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

  assert.equal(controller.deleteMetric(custom.id, customMetricId), true);
  assert.equal(controller.getActiveProject().id, custom.id, "notebook stays after metric delete");
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
    return obs.isSelfMetricKind(p.kind);
  });
  controller.setActiveProject(selfProj.id);
  assert.equal(controller.hidesModeToolbar(), false);
  assert.equal(controller.hidesCompare(), false);
  controller.setMode("week");
  assert.equal(controller.getModeData().label, "每週");
  assert.equal(controller.resolveTitle(), selfProj.name);
});

test("updateSelfMetricProject edits metric only; pencil does not rename metric", () => {
  const obs = loadObservations(PROJECT_FILES);
  const metrics = obs.createRegistry({});
  const controller = obs.createController({
    metrics: metrics,
    viewData: obs.createEmptyViewData([]),
    visits: [],
    notes: [],
    ui: { mode: "week", metric: "", compare: false },
    projects: [],
    isDemoMode: false,
  });
  const project = controller.createProject({
    name: "精神",
    kind: "self-metric",
    metricName: "精神",
    metricUnit: "分",
    metricScale: "fixed10",
    metricColor: "#1487bd",
  });
  assert.ok(project);
  assert.equal(project.name, "觀察專案");
  const metricId = project.focusMetricId || project.metricId;
  assert.equal(metrics.get(metricId).label, "精神");
  const renamed = controller.renameProject(project.id, "米醬日記");
  assert.equal(renamed.name, "米醬日記");
  assert.equal(metrics.get(metricId).label, "精神");
  const updated = controller.updateSelfMetricProject(project.id, {
    metricId: metricId,
    metricName: "精神狀態",
    caption: "疼痛次數變化觀察",
    metricUnit: "次",
    metricScale: "count",
    metricColor: "#db1f64",
  });
  assert.ok(updated);
  assert.equal(updated.name, "米醬日記");
  assert.equal(updated.caption, "疼痛次數變化觀察");
  const meta = metrics.get(metricId);
  assert.equal(meta.label, "精神狀態");
  assert.equal(meta.unit, "次");
  assert.equal(meta.color, "#db1f64");
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

test("project caption persists through serialize and hydrate", () => {
  const obs = loadObservations(PROJECT_FILES);
  const metrics = obs.createRegistry({});
  const controller = obs.createController({
    metrics: metrics,
    viewData: obs.createEmptyViewData([]),
    visits: [],
    notes: [],
    ui: { mode: "week", metric: "", compare: false },
    projects: [],
    isDemoMode: false,
  });
  const project = controller.createProject({
    name: "體重",
    kind: "self-metric",
    metricName: "體重",
    metricUnit: "kg",
    caption: "術後體重觀察",
  });
  assert.equal(project.caption, "術後體重觀察");
  const slice = obs.serializeObservations(controller.exportPersistState());
  assert.equal(slice.projects[0].caption, "術後體重觀察");
  const pet = { id: "pet-cap", observations: obs.emptyObservations() };
  assert.equal(obs.writeObservationsToPet(pet, slice, { isDemoMode: false }), true);
  const hydrated = obs.hydrateObservations(pet.observations);
  assert.equal(hydrated.projects[0].caption, "術後體重觀察");
});

test("legacy self-metric projects fold into one notebook", () => {
  const obs = loadObservations(PROJECT_FILES);
  const store = obs.createProjectStore();
  store.replaceAll(
    [
      { id: "proj_1", name: "喝水次數紀錄", kind: "self-metric", metricId: "m-drink" },
      { id: "proj_2", name: "術後紀錄", kind: "self-metric", metricId: "m-post" },
      { id: "proj_3", name: "排尿次數", kind: "self-metric", metricId: "m-pee" },
    ],
    "proj_3"
  );
  const list = store.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].kind, "notebook");
  assert.equal(list[0].name, "觀察專案");
  assert.equal(list[0].metricIds.join(","), "m-drink,m-post,m-pee");
  assert.equal(store.getActive().id, list[0].id);
});

test("setFocusMetric switches chart metric without renaming project", () => {
  const obs = loadObservations(PROJECT_FILES);
  const metrics = obs.createRegistry({});
  const controller = obs.createController({
    metrics: metrics,
    viewData: obs.createEmptyViewData([]),
    visits: [],
    notes: [],
    ui: { mode: "week", metric: "", compare: false },
    projects: [],
    isDemoMode: false,
  });
  const first = controller.createProject({
    name: "喝水",
    kind: "self-metric",
    metricName: "喝水",
    metricUnit: "次",
    metricScale: "count",
  });
  const second = controller.createProject({
    name: "排尿",
    kind: "self-metric",
    metricName: "排尿",
    metricUnit: "次",
    metricScale: "count",
  });
  assert.equal(controller.getProjects().length, 1);
  assert.equal(first.id, second.id);
  const drinkId = first.focusMetricId || first.metricId;
  const peeId = second.focusMetricId || second.metricId;
  assert.notEqual(drinkId, peeId);
  controller.setFocusMetric(drinkId);
  assert.equal(controller.getState().metric, drinkId);
  assert.equal(controller.getActiveProject().name, "觀察專案");
  assert.equal(metrics.get(drinkId).label, "喝水");
  controller.setFocusMetric(peeId);
  assert.equal(controller.getState().metric, peeId);
  assert.equal(controller.resolveTitle(), "觀察專案");
});
