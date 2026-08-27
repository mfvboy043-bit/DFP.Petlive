import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadDates() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("core/dates.js", WEB_ROOT), "utf8"),
    context,
    { filename: "core/dates.js" }
  );
  return context.PetLiveWeb.core.dates;
}

describe("core/dates", () => {
  it("addDays keeps local midnight YYYY-MM-DD", () => {
    const dates = loadDates();
    assert.equal(dates.addDays("2026-01-31", 1), "2026-02-01");
    assert.equal(dates.addDays("2026-08-27", 0), "2026-08-27");
    assert.equal(dates.addDays("2026-08-27", -3), "2026-08-24");
  });

  it("daysUntil uses local midnight ceil semantics", () => {
    const dates = loadDates();
    const today = dates.todayIsoLocal();
    assert.equal(dates.daysUntil(today), 0);
    assert.equal(dates.daysUntil(dates.addDays(today, 5)), 5);
    assert.equal(dates.daysUntil(dates.addDays(today, -2)), -2);
  });

  it("todayISODate aliases todayIsoLocal", () => {
    const dates = loadDates();
    assert.equal(dates.todayISODate(), dates.todayIsoLocal());
    assert.match(dates.todayIsoLocal(), /^\d{4}-\d{2}-\d{2}$/);
  });
});
