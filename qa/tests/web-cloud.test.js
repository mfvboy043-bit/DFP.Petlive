import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadCloud({ seedIds = ["p1", "p2", "p3"], demo = false } = {}) {
  const context = vm.createContext({ console });
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

  ["domains/cloud/selectors.js", "domains/cloud/controller.js"].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });

  const cloud = context.PetLiveWeb.domains.cloud;
  const selectors = cloud.createSelectors({
    getSeedPetIds: () => seedIds.slice(),
  });

  const pets = [];
  const archivedPets = [];
  let currentPetId = null;
  let suppress = false;
  const store = {
    petsGraph: null,
    ownerProfile: {},
    petAlerts: {},
    suppressedAlerts: {},
    petPhotos: {},
    labReports: {},
    syncMeta: selectors.emptySyncMeta(),
  };
  let syncMetaPresent = false;
  let afterApplyCount = 0;
  let scheduleCount = 0;

  function slot(key) {
    return {
      read: () => store[key],
      write: (value) => {
        store[key] = value;
        if (key === "syncMeta") syncMetaPresent = true;
        return true;
      },
    };
  }

  const controller = cloud.createController({
    selectors,
    getPets: () => pets,
    getArchivedPets: () => archivedPets,
    getCurrentPetId: () => currentPetId,
    setCurrentPetId: (id) => {
      currentPetId = id;
    },
    petsGraphSlot: slot("petsGraph"),
    ownerProfileSlot: slot("ownerProfile"),
    ownerAlertsSlot: slot("petAlerts"),
    suppressedAlertsSlot: slot("suppressedAlerts"),
    petPhotosSlot: slot("petPhotos"),
    labReportsSlot: slot("labReports"),
    syncMetaSlot: {
      read: () => store.syncMeta,
      write: (value) => {
        store.syncMeta = value;
        syncMetaPresent = true;
        return true;
      },
    },
    isDemoMode: () => demo,
    getSuppressSyncMetaBump: () => suppress,
    hasStoredSyncMeta: () => syncMetaPresent,
    hasStoredPetsGraph: () => store.petsGraph != null,
    readPetsGraphSnapshot: () => store.petsGraph,
    onAfterApply: () => {
      afterApplyCount += 1;
    },
    scheduleCloudBackup: () => {
      scheduleCount += 1;
    },
  });

  return {
    api: context.PetLiveWeb,
    selectors,
    controller,
    pets,
    archivedPets,
    getCurrentPetId: () => currentPetId,
    store,
    setSuppress: (v) => {
      suppress = v;
    },
    get afterApplyCount() {
      return afterApplyCount;
    },
    get scheduleCount() {
      return scheduleCount;
    },
    setSyncMetaPresent: (v) => {
      syncMetaPresent = v;
    },
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("CL-04 cloud selectors + controller", () => {
  it("isSeedOnlyPets true for empty and exact seed ids; false otherwise", () => {
    const { selectors } = loadCloud({ seedIds: ["p1", "p2", "p3"] });
    assert.equal(selectors.isSeedOnlyPets([]), true);
    assert.equal(
      selectors.isSeedOnlyPets([{ id: "p1" }, { id: "p2" }, { id: "p3" }]),
      true
    );
    assert.equal(selectors.isSeedOnlyPets([{ id: "p1" }]), false);
    assert.equal(
      selectors.isSeedOnlyPets([{ id: "p1" }, { id: "p2" }, { id: "x" }]),
      false
    );
    assert.equal(
      selectors.isSeedOnlyCloudPayload({
        pets: [{ id: "p1" }, { id: "p2" }, { id: "p3" }],
      }),
      true
    );
    assert.equal(
      selectors.isSeedOnlyCloudPayload({ pets: [{ id: "real-1" }] }),
      false
    );
  });

  it("fingerprint equality and conflict when real local ≠ cloud and not fresh", () => {
    const { selectors } = loadCloud();
    const local = [{ id: "a" }, { id: "b" }];
    const payload = { pets: [{ id: "a" }, { id: "b" }] };
    assert.equal(
      selectors.localCloudGraphFingerprint(local),
      selectors.cloudPayloadGraphFingerprint(payload)
    );
    assert.equal(selectors.localCloudGraphFingerprint(local), "2:a");

    const meta = { localRevision: 2, lastSyncedRevision: 2, lastCloudUpdatedAt: null };
    assert.equal(
      selectors.hasCloudGraphConflict({
        localPets: local,
        payload: { pets: [{ id: "z" }] },
        meta,
        hasStoredGraph: true,
        memoryPets: local,
      }),
      true
    );
    assert.equal(
      selectors.hasCloudGraphConflict({
        localPets: local,
        payload,
        meta,
        hasStoredGraph: true,
        memoryPets: local,
      }),
      false
    );
    assert.equal(
      selectors.hasCloudGraphConflict({
        localPets: [{ id: "p1" }, { id: "p2" }, { id: "p3" }],
        payload: { pets: [{ id: "z" }] },
        meta,
        hasStoredGraph: true,
      }),
      false
    );
    assert.equal(
      selectors.hasCloudGraphConflict({
        localPets: local,
        payload: { pets: [{ id: "z" }] },
        meta: selectors.emptySyncMeta(),
        hasStoredGraph: false,
        memoryPets: local,
      }),
      false
    );
  });

  it("sync-meta dirty / bump / markSynced math", () => {
    const { selectors, controller } = loadCloud();
    const empty = selectors.emptySyncMeta();
    assert.equal(selectors.isLocalDirty(empty), false);
    const bumped = selectors.nextBumpMeta(empty);
    assert.deepEqual(plain(bumped), {
      localRevision: 1,
      lastSyncedRevision: 0,
      lastCloudUpdatedAt: null,
    });
    assert.equal(selectors.isLocalDirty(bumped), true);
    const synced = selectors.nextMarkSyncedMeta(bumped, "2026-08-27T00:00:00.000Z");
    assert.deepEqual(plain(synced), {
      localRevision: 1,
      lastSyncedRevision: 1,
      lastCloudUpdatedAt: "2026-08-27T00:00:00.000Z",
    });
    assert.equal(selectors.isLocalDirty(synced), false);

    controller.bumpLocalDataRevision();
    assert.equal(controller.readSyncMeta().localRevision, 1);
    assert.equal(selectors.isLocalDirty(controller.readSyncMeta()), true);
    controller.markCloudSynced("2026-08-27T01:00:00.000Z");
    assert.equal(controller.readSyncMeta().lastSyncedRevision, 1);
    assert.equal(controller.readSyncMeta().lastCloudUpdatedAt, "2026-08-27T01:00:00.000Z");
  });

  it("stripHeavyMedia drops heavy keys and large data-URLs", () => {
    const { controller } = loadCloud();
    const big = `data:image/png;base64,${"A".repeat(9000)}`;
    const stripped = controller.stripHeavyMedia({
      name: "keep",
      bagPhoto: "x",
      rxPhoto: "y",
      drugPhoto: "z",
      xrayPhotos: [],
      usPhotos: [],
      imaging: {},
      attachmentUrl: "u",
      thumb: big,
      nested: { bagPhoto: "nope", ok: 1 },
      list: [{ rxPhoto: "a", id: 2 }],
    });
    assert.deepEqual(plain(stripped), {
      name: "keep",
      nested: { ok: 1 },
      list: [{ id: 2 }],
    });
  });

  it("buildCloudPayload shape and applyCloudPayload guards + replace", () => {
    const env = loadCloud({ seedIds: ["p1", "p2", "p3"] });
    env.pets.push({ id: "real-1", name: "Mochi", bagPhoto: "drop-me" });
    env.store.ownerProfile = { name: "Owner" };
    env.store.petAlerts = { "real-1": [] };
    env.store.labReports = { "real-1": [{ id: "lr1", imaging: "x" }] };

    const payload = env.controller.buildCloudPayload();
    assert.equal(payload.version, 1);
    assert.ok(typeof payload.updatedAt === "string");
    assert.equal(payload.pets.length, 1);
    assert.equal(payload.pets[0].id, "real-1");
    assert.equal(payload.pets[0].bagPhoto, undefined);
    assert.equal(payload.ownerProfile.name, "Owner");
    assert.ok(payload.labReports["real-1"][0]);
    assert.equal(payload.labReports["real-1"][0].imaging, undefined);

    assert.equal(
      env.controller.applyCloudPayload({
        pets: [{ id: "p1" }, { id: "p2" }, { id: "p3" }],
      }),
      false
    );
    assert.equal(env.pets[0].id, "real-1");

    assert.equal(env.controller.applyCloudPayload(null), false);
    assert.equal(env.controller.applyCloudPayload({ pets: "bad" }), false);

    const ok = env.controller.applyCloudPayload({
      pets: [{ id: "cloud-1", name: "Cloud" }],
      archivedPets: [{ id: "arch-1" }],
      currentPetId: "cloud-1",
      ownerProfile: { name: "FromCloud" },
      petAlerts: { "cloud-1": [{ id: "a1" }] },
      suppressedAlerts: {},
      petPhotos: {},
      labReports: {},
    });
    assert.equal(ok, true);
    assert.equal(env.pets.length, 1);
    assert.equal(env.pets[0].id, "cloud-1");
    assert.equal(env.archivedPets[0].id, "arch-1");
    assert.equal(env.getCurrentPetId(), "cloud-1");
    assert.equal(env.store.ownerProfile.name, "FromCloud");
    assert.equal(env.afterApplyCount, 1);
    assert.deepEqual(plain(env.store.petsGraph.pets), [{ id: "cloud-1", name: "Cloud" }]);
  });

  it("applyCloudPayload rejects DEMO_MODE", () => {
    const env = loadCloud({ demo: true });
    env.pets.push({ id: "real-1" });
    assert.equal(
      env.controller.applyCloudPayload({
        pets: [{ id: "cloud-1" }],
      }),
      false
    );
    assert.equal(env.pets[0].id, "real-1");
    env.controller.bumpLocalDataRevision();
    assert.equal(env.controller.readSyncMeta().localRevision, 0);
  });

  it("accountSyncStatusKey matrix", () => {
    const { selectors } = loadCloud();
    const metaClean = {
      localRevision: 1,
      lastSyncedRevision: 1,
      lastCloudUpdatedAt: "2026-08-01T00:00:00.000Z",
    };
    const metaDirty = {
      localRevision: 2,
      lastSyncedRevision: 1,
      lastCloudUpdatedAt: "2026-08-01T00:00:00.000Z",
    };
    assert.equal(
      selectors.accountSyncStatusKey({ signedIn: false, meta: metaClean }),
      "accountPlanLocal"
    );
    assert.equal(
      selectors.accountSyncStatusKey({
        signedIn: true,
        reconcileState: "running",
        reconcilePhase: "restoring",
        meta: metaClean,
      }),
      "accountSyncRestoring"
    );
    assert.equal(
      selectors.accountSyncStatusKey({
        signedIn: true,
        reconcileState: "running",
        reconcilePhase: "checking",
        meta: metaClean,
      }),
      "accountSyncChecking"
    );
    assert.equal(
      selectors.accountSyncStatusKey({
        signedIn: true,
        reconcileState: "error",
        meta: metaClean,
      }),
      "accountSyncError"
    );
    assert.equal(
      selectors.accountSyncStatusKey({
        signedIn: true,
        conflict: true,
        meta: metaClean,
      }),
      "accountSyncConflict"
    );
    assert.equal(
      selectors.accountSyncStatusKey({
        signedIn: true,
        meta: metaDirty,
      }),
      "accountSyncDirty"
    );
    assert.equal(
      selectors.accountSyncStatusKey({
        signedIn: true,
        meta: metaClean,
        lastBackupAt: null,
        hasRealLocal: true,
      }),
      "accountSyncOk"
    );
    assert.equal(
      selectors.accountSyncStatusKey({
        signedIn: true,
        meta: selectors.emptySyncMeta(),
        lastBackupAt: null,
        hasRealLocal: false,
      }),
      "accountSyncFirstBackup"
    );
    assert.equal(
      selectors.accountSyncStatusKey({
        signedIn: true,
        meta: selectors.emptySyncMeta(),
        lastBackupAt: null,
        hasRealLocal: true,
      }),
      "accountSyncPending"
    );
  });

  it("clearSeedPetsFromMemory only when seed-only", () => {
    const env = loadCloud({ seedIds: ["p1", "p2", "p3"] });
    env.pets.push({ id: "p1" }, { id: "p2" }, { id: "p3" });
    env.controller.clearSeedPetsFromMemory();
    assert.equal(env.pets.length, 0);
    assert.equal(env.getCurrentPetId(), null);

    env.pets.push({ id: "real-1" });
    env.controller.clearSeedPetsFromMemory();
    assert.equal(env.pets.length, 1);
  });
});
