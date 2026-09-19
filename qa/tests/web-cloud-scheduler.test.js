import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);
const SCHEDULER_SRC = readFileSync(
  new URL("domains/cloud/scheduler.js", WEB_ROOT),
  "utf8"
);

function loadCloudDomain() {
  const context = vm.createContext({ console, setTimeout, clearTimeout });
  context.globalThis = context;
  context.window = context;
  context.document = {
    getElementById() {
      throw new Error("domains must not touch document");
    },
  };
  context.localStorage = {
    getItem() {
      throw new Error("domains must not touch localStorage");
    },
    setItem() {
      throw new Error("domains must not touch localStorage");
    },
  };

  ["domains/cloud/selectors.js", "domains/cloud/controller.js", "domains/cloud/scheduler.js"].forEach(
    (path) => {
      vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
        filename: path,
      });
    }
  );

  return context.PetLiveWeb.domains.cloud;
}

function createFakeClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  return {
    now: () => now,
    setTimeout(fn, ms) {
      const id = nextId++;
      timers.set(id, { fn, at: now + (Number(ms) || 0) });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    async advance(ms) {
      now += Number(ms) || 0;
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.at <= now)
        .sort((a, b) => a[1].at - b[1].at);
      for (const [id, timer] of due) {
        timers.delete(id);
        timer.fn();
      }
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

function createTestScheduler(overrides = {}) {
  const cloud = loadCloudDomain();
  const clock = createFakeClock();
  let drive = Boolean(overrides.drive);
  let busy = Boolean(overrides.busy);
  let demo = Boolean(overrides.demo);
  let realLocal = overrides.realLocal !== false;
  let pendingLocal = Boolean(overrides.pendingLocal);
  const pushes = [];
  const pushSilent =
    overrides.pushSilent ||
    (async () => {
      pushes.push(clock.now());
      return true;
    });

  const scheduler = cloud.createScheduler({
    debounceMs: 1800,
    maxRetries: 3,
    backoffMs: 2000,
    hasDriveSession: () => drive,
    isBusy: () => busy,
    isDemo: () => demo,
    hasRealLocalData: () => realLocal,
    hasPendingLocal: () => pendingLocal,
    pushSilent,
    now: clock.now,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    ...overrides.schedulerOpts,
  });

  return {
    cloud,
    scheduler,
    clock,
    pushes,
    setDrive: (value) => {
      drive = Boolean(value);
    },
    setBusy: (value) => {
      busy = Boolean(value);
    },
    setDemo: (value) => {
      demo = Boolean(value);
    },
    setRealLocal: (value) => {
      realLocal = Boolean(value);
    },
    setPendingLocal: (value) => {
      pendingLocal = Boolean(value);
    },
  };
}

describe("AS-07 cloud scheduler", () => {
  it("never references ensureDriveAccess / requestAccessToken", () => {
    assert.equal(SCHEDULER_SRC.includes("ensureDriveAccess"), false);
    assert.equal(SCHEDULER_SRC.includes("requestAccessToken"), false);
    assert.equal(SCHEDULER_SRC.includes("google.accounts"), false);
  });

  it("demo → schedule no-ops, pushSilent never called", async () => {
    const env = createTestScheduler({ demo: true, drive: true });
    env.scheduler.schedule();
    await env.clock.advance(5000);
    assert.equal(env.pushes.length, 0);
    assert.equal(env.scheduler.getState().pending, false);
    assert.equal(env.scheduler.getState().needDrive, false);
  });

  it("no Drive → pending/needDrive, pushSilent never called", async () => {
    const env = createTestScheduler({ drive: false });
    env.scheduler.schedule();
    await env.clock.advance(5000);
    assert.equal(env.pushes.length, 0);
    assert.equal(env.scheduler.getState().pending, true);
    assert.equal(env.scheduler.getState().needDrive, true);
    assert.equal(env.scheduler.getState().backingUp, false);
  });

  it("Drive → schedule debounce then one pushSilent", async () => {
    const env = createTestScheduler({ drive: true });
    env.scheduler.schedule();
    assert.equal(env.pushes.length, 0);
    await env.clock.advance(1799);
    assert.equal(env.pushes.length, 0);
    await env.clock.advance(1);
    assert.equal(env.pushes.length, 1);
    assert.equal(env.scheduler.getState().pending, false);
    assert.equal(env.scheduler.getState().needDrive, false);
  });

  it("busy then free → retries, not dropped forever", async () => {
    const env = createTestScheduler({ drive: true, busy: true });
    env.scheduler.schedule();
    await env.clock.advance(1800);
    assert.equal(env.pushes.length, 0);
    assert.equal(env.scheduler.getState().pending, true);
    env.setBusy(false);
    await env.clock.advance(2000);
    assert.equal(env.pushes.length, 1);
    assert.equal(env.scheduler.getState().pending, false);
  });

  it("flushPending pushes immediately (fake timers)", async () => {
    const env = createTestScheduler({ drive: true });
    env.scheduler.schedule();
    const ok = await env.scheduler.flushPending();
    assert.equal(ok, true);
    assert.equal(env.pushes.length, 1);
    await env.clock.advance(1800);
    assert.equal(env.pushes.length, 1, "cancelled debounce must not double-push");
  });

  it("notifyDriveReady after grant flushes", async () => {
    const env = createTestScheduler({ drive: false });
    env.scheduler.schedule();
    assert.equal(env.pushes.length, 0);
    assert.equal(env.scheduler.getState().needDrive, true);
    env.setDrive(true);
    const ok = await env.scheduler.notifyDriveReady();
    assert.equal(ok, true);
    assert.equal(env.pushes.length, 1);
    assert.equal(env.scheduler.getState().pending, false);
    assert.equal(env.scheduler.getState().needDrive, false);
  });

  it("accountSyncNeedDrive / accountSyncBackingUp keys", () => {
    const { cloud } = createTestScheduler();
    const selectors = cloud.createSelectors({
      getSeedPetIds: () => ["p1", "p2", "p3"],
    });
    const metaDirty = {
      localRevision: 2,
      lastSyncedRevision: 1,
      lastCloudUpdatedAt: "2026-08-01T00:00:00.000Z",
    };
    assert.equal(
      selectors.accountSyncStatusKey({
        signedIn: true,
        backingUp: true,
        meta: metaDirty,
      }),
      "accountSyncBackingUp"
    );
    assert.equal(
      selectors.accountSyncStatusKey({
        signedIn: true,
        hasDriveSession: false,
        meta: metaDirty,
      }),
      "accountSyncNeedDrive"
    );
  });

  it("dispose clears timers so a later tick does not push", async () => {
    const env = createTestScheduler({ drive: true });
    env.scheduler.schedule();
    env.scheduler.dispose();
    await env.clock.advance(5000);
    assert.equal(env.pushes.length, 0);
  });
});

// Dirty local must not auto-pull (20260825 law). Scheduler only auto-pushes.
// Existing coverage: qa/tests/web-cloud.test.js shouldAutoPullCloud + hasLocalPendingChanges.
describe("dirty hold-pull (selector, not reconcile rewrite)", () => {
  it("hasLocalPendingChanges blocks shouldAutoPullCloud", () => {
    const { cloud } = createTestScheduler();
    const selectors = cloud.createSelectors({
      getSeedPetIds: () => ["p1", "p2", "p3"],
    });
    const dirtyMeta = {
      localRevision: 2,
      lastSyncedRevision: 1,
      lastCloudUpdatedAt: "2026-08-01T00:00:00.000Z",
    };
    assert.equal(selectors.hasLocalPendingChanges(dirtyMeta), true);
    assert.equal(
      selectors.shouldAutoPullCloud({
        meta: dirtyMeta,
        payload: {
          updatedAt: "2026-08-27T02:00:00.000Z",
          pets: [{ id: "cloud-1" }],
        },
        cloudNewer: true,
        localPets: [{ id: "local-1" }],
        hasStoredGraph: true,
        hasRealLocal: true,
      }),
      false
    );
  });
});
