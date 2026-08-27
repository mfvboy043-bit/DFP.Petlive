import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadLabs() {
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

  ["domains/labs/selectors.js", "domains/labs/controller.js"].forEach((path) => {
    vm.runInContext(readFileSync(new URL(path, WEB_ROOT), "utf8"), context, {
      filename: path,
    });
  });

  const labs = context.PetLiveWeb.domains.labs;
  const store = {};
  const slot = {
    read: () => store.map || {},
    write: (value) => {
      store.map = value;
      return true;
    },
  };
  const selectors = labs.createSelectors({
    visitClinicLabel: (visit) => visit?.clinic || "",
  });
  const controller = labs.createController({
    labReportsSlot: slot,
    selectors,
    isDemoMode: () => false,
  });
  return { labs, selectors, controller, slot };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("LB-01 / LB-02 labs domain", () => {
  it("sortLabReports drops rows without photos and sorts newest date first", () => {
    const { selectors } = loadLabs();
    const sorted = selectors.sortLabReports([
      { id: "a", date: "2026-08-01", photos: ["p1"] },
      { id: "b", date: "2026-08-20", photos: [] },
      { id: "c", date: "2026-08-10", photos: ["p2"], createdAt: "2026-08-10T12:00:00Z" },
      { id: "d", date: "2026-08-20", photos: ["p3"], createdAt: "2026-08-20T09:00:00Z" },
    ]);
    assert.deepEqual(sorted.map((row) => row.id), ["d", "c", "a"]);
  });

  it("reportMatchesVisit matches date + clinic id or label", () => {
    const { selectors } = loadLabs();
    const visit = { date: "2026-08-10", clinicId: "c1", clinic: "Raw" };
    assert.equal(
      selectors.reportMatchesVisit(
        { visitDate: "2026-08-10", visitClinicId: "c1" },
        visit
      ),
      true
    );
    assert.equal(
      selectors.reportMatchesVisit(
        { visitDate: "2026-08-10", clinic: "Walk-in" },
        { date: "2026-08-10", clinic: "Walk-in" }
      ),
      true
    );
    assert.equal(
      selectors.reportMatchesVisit({ visitDate: "2026-08-09", clinic: "Walk-in" }, visit),
      false
    );
  });

  it("buildLabReport + add/remove round-trip via slot", () => {
    const { controller, selectors } = loadLabs();
    const report = controller.buildLabReport({
      petId: "p1",
      date: "2026-08-10",
      types: ["bogus", "urine", "blood"],
      clinic: "Lab A",
      photos: ["photo://1"],
      note: "see originals",
    });
    assert.equal(report.source, "owner_proof");
    assert.deepEqual(report.types, ["blood", "urine"]);
    assert.equal(controller.addLabReport("p1", report), true);
    assert.equal(controller.getLabReportsForPet("p1").length, 1);
    assert.equal(controller.getLabReportsForPet("p2").length, 0);
    assert.equal(controller.removeLabReport("p1", report.id), true);
    assert.equal(controller.getLabReportsForPet("p1").length, 0);
    assert.deepEqual(plain(selectors.latestLabSummary([])), null);
  });

  it("addLabReport rejects empty photos; filterLabTypes keeps LAB_TYPE_ORDER", () => {
    const { controller, selectors, labs } = loadLabs();
    assert.deepEqual(
      selectors.filterLabTypes(["other", "blood", "nope", "blood"]),
      ["blood", "other"]
    );
    const empty = controller.buildLabReport({
      petId: "p1",
      date: "2026-08-10",
      types: ["blood"],
      photos: [],
    });
    assert.equal(controller.addLabReport("p1", empty), false);
    assert.equal(controller.getLabReportsForPet("p1").length, 0);
    assert.equal(labs.LAB_PHOTOS_MAX, 6);
  });

  it("domain files avoid document and localStorage", () => {
    for (const file of ["domains/labs/selectors.js", "domains/labs/controller.js"]) {
      const src = readFileSync(new URL(file, WEB_ROOT), "utf8");
      assert.doesNotMatch(src, /\bdocument\b/);
      assert.doesNotMatch(src, /\blocalStorage\b/);
      assert.doesNotMatch(src, /\bt\s*\(/);
    }
  });
});
