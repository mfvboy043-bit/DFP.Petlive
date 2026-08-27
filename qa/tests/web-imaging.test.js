import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadImaging() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("domains/imaging/controller.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/imaging/controller.js" }
  );
  return context.PetLiveWeb.domains.imaging.createController();
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("IM-01 imaging domain", () => {
  it("ensureVisitImaging / clear / append enforce max 4", () => {
    const imaging = loadImaging();
    const visit = {};
    const normalized = plain(imaging.ensureVisitImaging(visit));
    assert.ok(visit.imaging);
    assert.deepEqual(normalized.xrayPhotos, []);
    assert.deepEqual(normalized.usPhotos, []);

    for (let i = 0; i < 4; i++) {
      assert.equal(imaging.appendVisitImagingPhoto(visit, "xray", `x${i}`).ok, true);
    }
    assert.deepEqual(plain(imaging.appendVisitImagingPhoto(visit, "xray", "x4")), {
      ok: false,
      reason: "cap",
    });
    assert.deepEqual(plain(imaging.appendVisitImagingPhoto(visit, "us", "")), {
      ok: false,
      reason: "empty",
    });
    assert.equal(visit.imaging.xrayPhotos.length, 4);
    assert.equal(imaging.IMAGING_PHOTOS_MAX, 4);

    imaging.clearVisitImagingPhoto(visit, "xray", 1);
    assert.deepEqual(plain(visit.imaging.xrayPhotos), ["x0", "x2", "x3"]);
    assert.equal(imaging.visitHasImaging(visit), true);
  });

  it("setVisitImaging normalizes, caps, and imagingTypeKeys reflect slots", () => {
    const imaging = loadImaging();
    const visit = {};
    imaging.setVisitImaging(visit, {
      xrayPhotos: ["a", null, "b", "c", "d", "e"],
      usPhotos: ["u1"],
    });
    assert.deepEqual(plain(visit.imaging.xrayPhotos), ["a", "b", "c", "d"]);
    assert.deepEqual(plain(visit.imaging.usPhotos), ["u1"]);
    assert.deepEqual(imaging.imagingTypeKeys(visit), ["xray", "us"]);
  });

  it("getImagingVisitEntries sorts newest visit date first", () => {
    const imaging = loadImaging();
    const pet = {
      visits: [
        { date: "2026-08-01", imaging: { xrayPhotos: ["x"], usPhotos: [] } },
        { date: "2026-08-20", imaging: { xrayPhotos: [], usPhotos: ["u"] } },
        { date: "2026-08-10" },
      ],
    };
    const entries = imaging.getImagingVisitEntries(pet);
    assert.deepEqual(
      entries.map(({ index }) => index),
      [1, 0]
    );
  });
});
