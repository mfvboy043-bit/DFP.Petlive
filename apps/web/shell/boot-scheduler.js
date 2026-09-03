(function initPetLiveWebBootScheduler(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function runTasks(tasks) {
    if (!Array.isArray(tasks)) return;
    for (let i = 0; i < tasks.length; i += 1) {
      try {
        const fn = tasks[i];
        if (typeof fn === "function") fn();
      } catch (err) {
        console.error("[PetLive boot]", err);
      }
    }
  }

  function scheduleSoon(tasks, delayMs) {
    const delay = typeof delayMs === "number" ? delayMs : 0;
    global.setTimeout(() => runTasks(tasks), delay);
  }

  function scheduleIdle(tasks, options) {
    const opts = options || {};
    const timeout = typeof opts.timeout === "number" ? opts.timeout : 2000;
    const run = () => runTasks(tasks);

    if (typeof global.requestIdleCallback === "function") {
      global.requestIdleCallback(run, { timeout });
      return;
    }
    global.setTimeout(run, 1);
  }

  function runBootPhases(phases) {
    const p = phases || {};
    runTasks(p.critical);
    if (Array.isArray(p.soon) && p.soon.length) {
      scheduleSoon(p.soon, p.soonDelayMs);
    }
    if (Array.isArray(p.idle) && p.idle.length) {
      scheduleIdle(p.idle, { timeout: p.idleTimeoutMs });
    }
  }

  root.shell.runBootTasks = runTasks;
  root.shell.scheduleBootSoon = scheduleSoon;
  root.shell.scheduleBootIdle = scheduleIdle;
  root.shell.runBootPhases = runBootPhases;
})(typeof window !== "undefined" ? window : globalThis);
