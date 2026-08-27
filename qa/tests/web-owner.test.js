import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadOwner({ demo = false, slotRead, slotWrite } = {}) {
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

  ["domains/owner/selectors.js", "domains/owner/controller.js"].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });

  const owner = context.PetLiveWeb.domains.owner;
  const selectors = owner.createSelectors();
  let stored = slotRead != null ? slotRead : null;
  let afterSaveCount = 0;
  let afterSaveProfile = null;

  const slot = {
    read: () => (stored != null ? stored : {}),
    write: (value) => {
      stored = value;
      if (typeof slotWrite === "function") return slotWrite(value);
      return true;
    },
  };

  const controller = owner.createController({
    selectors,
    ownerProfileSlot: slot,
    isDemoMode: () => demo,
    onAfterSave: (profile) => {
      afterSaveCount += 1;
      afterSaveProfile = profile;
    },
  });

  return {
    selectors,
    controller,
    slot,
    get stored() {
      return stored;
    },
    set stored(value) {
      stored = value;
    },
    get afterSaveCount() {
      return afterSaveCount;
    },
    get afterSaveProfile() {
      return afterSaveProfile;
    },
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("OW-04 owner selectors + controller", () => {
  it("emptyProfile and demoProfile have six known string fields", () => {
    const { selectors } = loadOwner();
    const empty = selectors.emptyProfile();
    assert.deepEqual(empty, {
      name: "",
      phone: "",
      email: "",
      emergencyName: "",
      emergencyPhone: "",
      address: "",
    });
    const demo = selectors.demoProfile();
    assert.equal(demo.name, "王陽明");
    assert.equal(demo.email, "wang.yangming@demo.petlive");
    assert.equal(demo.phone, "0912345678");
  });

  it("normalize strips unknown keys and fills missing fields", () => {
    const { selectors } = loadOwner();
    assert.deepEqual(
      selectors.normalize({ name: "Ada", extra: "drop" }),
      {
        name: "Ada",
        phone: "",
        email: "",
        emergencyName: "",
        emergencyPhone: "",
        address: "",
      }
    );
    assert.deepEqual(selectors.normalize(null), selectors.emptyProfile());
  });

  it("hasAny true when any field truthy; false for empty", () => {
    const { selectors } = loadOwner();
    assert.equal(selectors.hasAny(selectors.emptyProfile()), false);
    assert.equal(selectors.hasAny({ email: "a@b.c" }), true);
    assert.equal(selectors.hasAny({ address: "x" }), true);
  });

  it("copyRows emits kinds for partial profiles only", () => {
    const { selectors } = loadOwner();
    assert.deepEqual(selectors.copyRows({ name: "A", phone: "1" }), [
      { kind: "ownerLine", name: "A", phone: "1" },
    ]);
    assert.deepEqual(selectors.copyRows({ email: "x@y.z" }), [
      { kind: "email", email: "x@y.z" },
    ]);
    assert.deepEqual(
      selectors.copyRows({
        emergencyName: "E",
        address: "Addr",
      }),
      [
        { kind: "emergency", emergencyName: "E" },
        { kind: "address", address: "Addr" },
      ]
    );
    assert.deepEqual(selectors.copyRows({}), []);
  });

  it("isDemoShowcase matches demo email or name+phone pair", () => {
    const { selectors } = loadOwner();
    assert.equal(
      selectors.isDemoShowcase({ email: "wang.yangming@demo.petlive" }),
      true
    );
    assert.equal(
      selectors.isDemoShowcase({ name: "王陽明", phone: "0912345678" }),
      true
    );
    assert.equal(selectors.isDemoShowcase({ name: "Other" }), false);
  });

  it("load merges slot read with empty defaults", () => {
    const harness = loadOwner();
    harness.stored = { name: "Victor", phone: "99" };
    assert.deepEqual(harness.controller.load(), {
      name: "Victor",
      phone: "99",
      email: "",
      emergencyName: "",
      emergencyPhone: "",
      address: "",
    });
  });

  it("save writes normalized profile via slot; onAfterSave when ok", () => {
    const harness = loadOwner();
    const ok = harness.controller.save({
      name: "Victor",
      phone: "1",
      junk: "ignored",
    });
    assert.equal(ok, true);
    assert.deepEqual(plain(harness.stored), {
      name: "Victor",
      phone: "1",
      email: "",
      emergencyName: "",
      emergencyPhone: "",
      address: "",
    });
    assert.equal(harness.afterSaveCount, 1);
    assert.equal(harness.afterSaveProfile.name, "Victor");
  });

  it("demo mode load returns demo without slot write; save is no-op", () => {
    const harness = loadOwner({ demo: true });
    harness.stored = { name: "stored" };
    const loaded = harness.controller.load();
    assert.equal(loaded.name, "王陽明");
    assert.equal(loaded.email, "wang.yangming@demo.petlive");
    assert.equal(harness.controller.save({ name: "nope" }), false);
    assert.deepEqual(harness.stored, { name: "stored" });
    assert.equal(harness.afterSaveCount, 0);
  });

  it("hasAny on controller defaults to load()", () => {
    const harness = loadOwner();
    harness.stored = { email: "a@b.c" };
    assert.equal(harness.controller.hasAny(), true);
    harness.stored = {};
    assert.equal(harness.controller.hasAny(), false);
  });

  it("domain scripts never touch document or localStorage", () => {
    assert.doesNotThrow(() => loadOwner());
  });
});
