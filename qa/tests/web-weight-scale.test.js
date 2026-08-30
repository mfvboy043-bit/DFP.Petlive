"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

function loadWeightDomain() {
  const sandbox = { PetLiveWeb: { domains: {} } };
  vm.createContext(sandbox);
  for (const file of ["selectors.js", "controller.js"]) {
    const src = require("node:fs").readFileSync(
      require("node:path").join(__dirname, "../../apps/web/domains/weight", file),
      "utf8"
    );
    vm.runInContext(src, sandbox, { filename: file });
  }
  return sandbox.PetLiveWeb.domains.weight;
}

test("collectWeightPoints merges manual, visit, and profile with dedupe", () => {
  const weight = loadWeightDomain();
  const pet = {
    weight: 4.2,
    weightDate: "2026-01-10",
    weightLogs: [{ id: "m1", date: "2026-02-01", weightKg: 4.5 }],
    visits: [{ id: "v1", date: "2026-03-01", weightAtVisit: 4.8 }],
  };
  const points = weight.collectWeightPoints(pet);
  assert.equal(points.length, 3);
  assert.equal(points[0].date, "2026-01-10");
  assert.equal(points[2].source, "visit");
});

test("toKg converts lb to kg for storage", () => {
  const weight = loadWeightDomain();
  const kg = weight.toKg(22, "lb");
  assert.ok(kg > 9.9 && kg < 10.1);
});

test("aggregateForChart buckets by year", () => {
  const weight = loadWeightDomain();
  const points = [
    { date: "2024-06-01", weightKg: 4, source: "manual", id: "a" },
    { date: "2024-12-01", weightKg: 4.5, source: "manual", id: "b" },
    { date: "2025-01-01", weightKg: 4.6, source: "manual", id: "c" },
  ];
  const series = weight.aggregateForChart(points, "year");
  assert.equal(series.length, 2);
  assert.equal(series[0].bucketKey, "2024");
  assert.equal(series[0].weightKg, 4.5);
});

test("addLog stores kg internally regardless of input unit", () => {
  const weight = loadWeightDomain();
  const pet = { weightLogs: [] };
  const result = weight.addLog(pet, { date: "2026-08-28", weight: 22, unit: "lb" });
  assert.equal(result.ok, true);
  assert.ok(result.record.weightKg > 9.9 && result.record.weightKg < 10.1);
});
