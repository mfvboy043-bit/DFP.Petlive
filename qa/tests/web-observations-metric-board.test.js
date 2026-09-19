import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "path";
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

const FILES = [
  "metrics.js",
  "series.js",
  "events.js",
  "diary.js",
  "summary.js",
  "titles.js",
  "demo-seed.js",
  "projects.js",
  "persist.js",
  "metric-board.js",
  "controller.js",
];

test("self-metric board rows skip visit-linked projects", () => {
  const obs = loadObservations(FILES);
  const metrics = obs.createRegistry({});
  const controller = obs.createController({
    metrics: metrics,
    viewData: obs.createEmptyViewData([]),
    visits: [{ id: "v-1", label: "9/1 診所", date: "2026-09-01" }],
    notes: [],
    ui: { mode: "week", metric: "", compare: false },
    projects: [],
    activeProjectId: "",
    isDemoMode: function () {
      return false;
    },
  });

  controller.createProject({
    name: "9/1 就診",
    kind: "visit-linked",
    visitIds: ["v-1"],
    metricName: "就診觀察",
  });
  controller.createProject({
    name: "喝水次數",
    kind: "self-metric",
    metricName: "喝水次數",
    metricUnit: "次",
    metricScale: "count",
  });

  const rows = controller.listSelfMetricBoardRows();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "喝水次數");
  assert.equal(rows[0].empty, true);
  assert.equal(rows[0].latestText, "—");
  assert.equal(rows[0].active, true);
  assert.ok(rows[0].input.max >= 10);
});

test("board row latest / spark follow diary points; visit project stays off the board", () => {
  const obs = loadObservations(FILES);
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
  });
  assert.ok(project);
  controller.addDiaryPoint({
    metricId: project.metricId,
    value: 4,
    index: 0,
    mode: "week",
  });
  controller.addDiaryPoint({
    metricId: project.metricId,
    value: 8,
    index: 6,
    mode: "week",
  });

  const rows = controller.listSelfMetricBoardRows();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].empty, false);
  assert.equal(rows[0].latestText, "8 分");
  assert.equal(rows[0].changeText, "+4");
  assert.equal(rows[0].spark.length, 2);
  assert.equal(obs.suggestDiaryIndex(rows[0].values), 6);
});

test("dateToBucketIndex maps week / month / year / day axes", () => {
  const obs = loadObservations(FILES);
  const week = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
  // 2026-09-19 is Saturday → index 5
  assert.equal(obs.dateToBucketIndex("week", "2026-09-19", week), 5);
  // 2026-09-14 is Monday → 0; 2026-09-20 is Sunday → 6
  assert.equal(obs.dateToBucketIndex("week", "2026-09-14", week), 0);
  assert.equal(obs.dateToBucketIndex("week", "2026-09-20", week), 6);

  const month = ["1日", "4日", "7日", "10日", "13日", "16日", "19日", "22日", "25日", "28日", "30日"];
  assert.equal(obs.dateToBucketIndex("month", "2026-09-19", month), 6);
  assert.equal(obs.dateToBucketIndex("month", "2026-09-18", month), 6);
  assert.equal(obs.dateToBucketIndex("month", "2026-09-02", month), 0);

  const year = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  assert.equal(obs.dateToBucketIndex("year", "2026-09-19", year), 8);
  assert.equal(obs.dateToBucketIndex("year", "2026-01-01", year), 0);

  const day = [
    "00:00",
    "02:00",
    "04:00",
    "06:00",
    "08:00",
    "10:00",
    "12:00",
    "14:00",
    "16:00",
    "18:00",
    "20:00",
    "22:00",
    "24:00",
  ];
  // No time → daily has no clock coordinate
  assert.equal(obs.dateToBucketIndex("day", "2020-01-01", day), -1);
  assert.equal(obs.dateToBucketIndex("day", "2020-01-01", day, "20:30"), 10);
  assert.equal(obs.dateToBucketIndex("day", "2020-01-01", day, "01:00"), 0);
  assert.equal(obs.modesForDatedLog("").join(","), "week,month,year");
  assert.equal(obs.modesForDatedLog("08:15").join(","), "day,week,month,year");

  assert.equal(obs.dateToBucketIndex("week", "not-a-date", week), -1);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(obs.suggestLogDateISO()));
  assert.ok(/^\d{2}:\d{2}$/.test(obs.suggestLogTimeHM()));
  assert.ok(obs.logDateToAtISO("2026-09-19"));
  assert.ok(obs.logDateToAtISO("2026-09-19", "08:15"));
  assert.equal(obs.logDateToAtISO("bad"), null);
  assert.equal(obs.parseTimeHM("08:15").hours, 8);
  assert.equal(obs.parseTimeHM("25:00"), null);
});

test("untimed log writes week/month/year and skips daily", () => {
  const obs = loadObservations(FILES);
  const metrics = obs.createRegistry({});
  const controller = obs.createController({
    metrics: metrics,
    viewData: obs.createEmptyViewData([]),
    visits: [],
    notes: [],
    ui: { mode: "day", metric: "", compare: false },
    projects: [],
    isDemoMode: false,
  });
  const project = controller.createProject({
    name: "體重",
    kind: "self-metric",
    metricName: "體重",
    metricUnit: "kg",
    metricScale: "weight",
  });
  controller.addDiaryPoint({
    metricId: project.metricId,
    value: 6.8,
    isoDate: "2026-09-19",
    timeHM: "",
  });
  assert.equal(obs.isEmptySeries(controller.getSeries(project.metricId, "day")), true);
  assert.equal(obs.isEmptySeries(controller.getSeries(project.metricId, "week")), false);
  assert.equal(obs.isEmptySeries(controller.getSeries(project.metricId, "month")), false);
  assert.equal(obs.isEmptySeries(controller.getSeries(project.metricId, "year")), false);

  controller.addDiaryPoint({
    metricId: project.metricId,
    value: 7.1,
    isoDate: "2026-09-19",
    timeHM: "08:00",
  });
  assert.equal(obs.isEmptySeries(controller.getSeries(project.metricId, "day")), false);
});

test("alignModeToAvailableData leaves day when empty and week has untimed points", () => {
  const obs = loadObservations(FILES);
  const metrics = obs.createRegistry({});
  const controller = obs.createController({
    metrics: metrics,
    viewData: obs.createEmptyViewData([]),
    visits: [],
    notes: [],
    ui: { mode: "day", metric: "", compare: false },
    projects: [],
    isDemoMode: false,
  });
  const project = controller.createProject({
    name: "排尿次數",
    kind: "self-metric",
    metricName: "排尿次數",
    metricUnit: "次",
    metricScale: "count",
  });
  controller.addDiaryPoint({
    metricId: project.metricId,
    value: 9,
    isoDate: "2026-09-19",
    timeHM: "",
  });
  assert.equal(controller.getState().mode, "day");
  assert.equal(obs.isEmptySeries(controller.getSeries(project.metricId, "day")), true);
  assert.equal(controller.alignModeToAvailableData(), "week");
  assert.equal(controller.getState().mode, "week");
  assert.equal(obs.isEmptySeries(controller.getSeries(project.metricId, "week")), false);

  const snap = controller.exportPersistState();
  snap.ui.mode = "day";
  const hydrated = obs.createController({
    metrics: controller.metrics,
    viewData: snap.viewData,
    visits: [],
    notes: snap.notes,
    ui: snap.ui,
    projects: snap.projects,
    activeProjectId: snap.activeProjectId,
    isDemoMode: false,
  });
  assert.equal(hydrated.getState().mode, "week");
});

test("toggleOverlayMetric stacks a second notebook metric on listChartTracks", () => {
  const obs = loadObservations(FILES);
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
  const pee = controller.createProject({
    name: "排尿次數",
    kind: "self-metric",
    metricName: "排尿次數",
    metricUnit: "次",
    metricScale: "count",
  });
  const drink = controller.createProject({
    name: "喝水次數紀錄",
    kind: "self-metric",
    metricName: "喝水次數紀錄",
    metricUnit: "次",
    metricScale: "count",
  });
  const peeId = pee.focusMetricId || pee.metricId;
  const drinkId = drink.focusMetricId || drink.metricId;
  assert.equal(pee.id, drink.id);
  controller.setFocusMetric(peeId);
  controller.addDiaryPoint({
    metricId: peeId,
    value: 9,
    isoDate: "2026-09-19",
    timeHM: "",
  });
  controller.addDiaryPoint({
    metricId: drinkId,
    value: 6,
    isoDate: "2026-09-19",
    timeHM: "",
  });
  assert.equal(controller.listChartTracks().length, 1);
  controller.toggleOverlayMetric(drinkId);
  const tracks = controller.listChartTracks();
  assert.equal(tracks.length, 2);
  assert.equal(tracks[0].metricId, peeId);
  assert.equal(tracks[0].primary, true);
  assert.equal(tracks[1].metricId, drinkId);
  assert.equal(tracks[1].primary, false);
  const rows = controller.listSelfMetricBoardRows();
  const drinkRow = rows.find(function (row) {
    return row.metricId === drinkId;
  });
  assert.equal(drinkRow.overlay, true);
  assert.equal(drinkRow.canOverlay, true);
  assert.equal(drinkRow.overview, false);
  controller.setFocusMetric(drinkId);
  assert.equal(controller.getState().overlayMetricIds.indexOf(drinkId), -1);
});

test("setOverview lets any notebook metric be checked onto the chart", () => {
  const obs = loadObservations(FILES);
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
  const pee = controller.createProject({
    name: "排尿次數",
    kind: "self-metric",
    metricName: "排尿次數",
    metricUnit: "次",
    metricScale: "count",
  });
  const drink = controller.createProject({
    name: "喝水次數紀錄",
    kind: "self-metric",
    metricName: "喝水次數紀錄",
    metricUnit: "次",
    metricScale: "count",
  });
  const peeId = pee.focusMetricId || pee.metricId;
  const drinkId = drink.focusMetricId || drink.metricId;
  controller.setFocusMetric(peeId);
  controller.addDiaryPoint({
    metricId: peeId,
    value: 9,
    isoDate: "2026-09-19",
    timeHM: "",
  });
  controller.addDiaryPoint({
    metricId: drinkId,
    value: 6,
    isoDate: "2026-09-19",
    timeHM: "",
  });
  controller.setOverview(true);
  assert.equal(controller.getState().overview, true);
  assert.equal(controller.listChartTracks().length, 0);
  controller.toggleOverlayMetric(peeId);
  controller.toggleOverlayMetric(drinkId);
  const tracks = controller.listChartTracks();
  assert.equal(tracks.length, 2);
  const rows = controller.listSelfMetricBoardRows();
  assert.equal(
    rows.every(function (row) {
      return row.canOverlay && row.overlay && row.overview;
    }),
    true
  );
  controller.setFocusMetric(peeId);
  assert.equal(controller.getState().overview, false);
  assert.equal(controller.listChartTracks()[0].metricId, peeId);
});
