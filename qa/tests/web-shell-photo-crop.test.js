import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadPhotoCropShell() {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;

  vm.runInContext(
    readFileSync(new URL("shell/photo-crop.js", WEB_ROOT), "utf8"),
    context,
    { filename: "shell/photo-crop.js" }
  );

  vm.runInContext(
    readFileSync(new URL("domains/pets/media.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/pets/media.js" }
  );

  return {
    photoCrop: context.PetLiveWeb.shell.createPhotoCrop(),
    petsMedia: context.PetLiveWeb.domains.pets.createMedia({
      photosSlot: {
        read: () => ({}),
        scheduleWrite: () => true,
        flush: () => true,
        hasPendingWrite: () => false,
      },
    }),
  };
}

describe("SH-05 shell photo crop styles", () => {
  it("buildCropImageStyles matches facade transform math", () => {
    const { photoCrop, petsMedia } = loadPhotoCropShell();
    const metrics = petsMedia.computeCropMetrics({
      view: 280,
      naturalW: 800,
      naturalH: 600,
      zoom: 1.2,
      offsetX: 12,
      offsetY: -8,
    });
    const styles = photoCrop.buildCropImageStyles(metrics);
    assert.equal(styles.width, `${metrics.width}px`);
    assert.equal(styles.height, `${metrics.height}px`);
    assert.equal(
      styles.transform,
      `translate(${metrics.left}px, ${metrics.top}px)`
    );
  });

  it("clampCropOffset keeps offsets within bounds", () => {
    const { petsMedia } = loadPhotoCropShell();
    const metrics = petsMedia.computeCropMetrics({
      view: 280,
      naturalW: 400,
      naturalH: 400,
      zoom: 2,
      offsetX: 999,
      offsetY: -999,
    });
    const clamped = petsMedia.clampCropOffset(
      { offsetX: 999, offsetY: -999 },
      metrics
    );
    assert.ok(Math.abs(clamped.offsetX) <= (metrics.width - metrics.view) / 2 + 0.001);
    assert.ok(Math.abs(clamped.offsetY) <= (metrics.height - metrics.view) / 2 + 0.001);
  });

  it("photo-crop.js has no document or innerHTML", () => {
    const src = readFileSync(
      new URL("shell/photo-crop.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\binnerHTML\b/.test(src), false);
  });
});
