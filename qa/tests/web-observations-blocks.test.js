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

const CORE_FILES = ["metrics.js", "series.js", "events.js", "diary.js", "summary.js"];

test("metrics addCustom creates 0–10 fixed scale entry", () => {
  const obs = loadObservations(CORE_FILES);
  const registry = obs.createRegistry({});
  const id = registry.addCustom("疲勞程度");
  assert.ok(id);
  assert.equal(id, "custom_1");
  const meta = registry.get(id);
  assert.equal(meta.label, "疲勞程度");
  assert.equal(meta.scale, "fixed10");
  assert.equal(meta.max, 10);
  assert.equal(registry.addCustom(""), null);
  assert.equal(registry.addCustom("x".repeat(25)), null);
  assert.equal(registry.formatValue(7, meta), "7 分");
});

test("series empty / ensure / yScaleFor", () => {
  const obs = loadObservations(CORE_FILES);
  const empty = obs.emptySeries(3);
  assert.equal(empty.current.length, 3);
  assert.equal(obs.isEmptySeries(empty), true);

  const modeData = { labels: ["a", "b", "c"] };
  const shaped = obs.ensureSeriesShape(modeData, "custom_x");
  assert.ok(modeData.custom_x);
  assert.equal(shaped.current.length, 3);

  const fixed = obs.yScaleFor({ scale: "fixed10" }, { current: [1, 2] }, false);
  assert.equal(fixed.min, 0);
  assert.equal(fixed.max, 10);
  assert.equal(fixed.ticks.join(","), "0,2,4,6,8,10");

  const weight = obs.yScaleFor(
    { scale: "weight" },
    { current: [62, 64], previous: [60, 61] },
    true
  );
  assert.ok(weight.min < 62);
  assert.ok(weight.max > 64);
  assert.equal(weight.ticks.length, 3);
});

test("summary computePeriodSummary math", () => {
  const obs = loadObservations(CORE_FILES);
  const formatValue = obs.formatValue;
  const meta = { unit: "分", scale: "fixed10" };
  const summary = obs.computePeriodSummary(
    [8, null, 6, 4],
    ["一", "二", "三", "四"],
    meta,
    formatValue
  );
  assert.equal(summary.latestText, "4 分");
  assert.equal(summary.latestNote, "四");
  assert.equal(summary.changeText, "−4");
  assert.equal(summary.completionText, "75%");

  const blank = obs.computePeriodSummary([], [], meta, formatValue);
  assert.equal(blank.latestText, "—");
  assert.equal(blank.completionText, "0%");
});

test("events planEventLabels densifies first-per-index only", () => {
  const obs = loadObservations(CORE_FILES);
  const planned = obs.planEventLabels([
    { index: 0, label: "9/1 就診・開立處方", shortLabel: "9/1 就診", kind: "visit" },
    { index: 0, label: "開始用藥", shortLabel: "用藥", kind: "med" },
    { index: 5, label: "劑量調整", kind: "med" },
  ]);
  assert.equal(planned.length, 3);
  assert.equal(planned[0].showLabel, true);
  assert.equal(planned[0].tone, "#db1f64");
  assert.equal(planned[1].showLabel, false);
  assert.equal(planned[1].tone, "#1487bd");
  assert.equal(planned[2].showLabel, true);
  assert.equal(planned[2].shortLabel, "劑量調整");
});

test("diary applyDiaryPoint mutates current and sources", () => {
  const obs = loadObservations(CORE_FILES);
  const series = obs.emptySeries(4);
  obs.applyDiaryPoint(series, 2, 6);
  assert.equal(series.current[2], 6);
  assert.equal(series.sources[2], "diary");
  assert.equal(obs.isEmptySeries(series), false);

  const note = obs.createNote({
    metricId: "headache",
    value: 6,
    visitId: "v1",
    text: "下午較悶",
  });
  assert.equal(note.metricId, "headache");
  assert.equal(note.text, "下午較悶");
  assert.equal(note.visitId, "v1");
  assert.equal(note.value, 6);
});
