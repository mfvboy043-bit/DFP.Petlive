import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadBootScheduler(overrides = {}) {
  const context = vm.createContext({
    console,
    setTimeout: overrides.setTimeout || global.setTimeout,
    requestIdleCallback: overrides.requestIdleCallback,
  });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("shell/boot-scheduler.js", WEB_ROOT), "utf8"),
    context,
    { filename: "shell/boot-scheduler.js" }
  );
  return context.PetLiveWeb.shell;
}

describe("boot-scheduler shell helpers", () => {
  it("runBootTasks runs each function in order", () => {
    const shell = loadBootScheduler();
    const order = [];
    shell.runBootTasks([
      () => order.push("a"),
      () => order.push("b"),
    ]);
    assert.deepEqual(order, ["a", "b"]);
  });

  it("runBootPhases runs critical immediately and soon on timeout", () => {
    const timers = [];
    const shell = loadBootScheduler({
      setTimeout(fn, ms) {
        timers.push({ fn, ms });
      },
    });
    const order = [];
    shell.runBootPhases({
      critical: [() => order.push("critical")],
      soon: [() => order.push("soon")],
      soonDelayMs: 0,
    });
    assert.deepEqual(order, ["critical"]);
    assert.equal(timers.length, 1);
    timers[0].fn();
    assert.deepEqual(order, ["critical", "soon"]);
  });

  it("scheduleBootIdle uses requestIdleCallback when available", () => {
    let idleRan = false;
    const shell = loadBootScheduler({
      requestIdleCallback(fn) {
        idleRan = true;
        fn();
      },
    });
    shell.scheduleBootIdle([() => {}]);
    assert.equal(idleRan, true);
  });
});
