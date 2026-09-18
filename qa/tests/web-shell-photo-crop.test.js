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

  it("photo-crop.js has no document or localStorage", () => {
    const src = readFileSync(
      new URL("shell/photo-crop.js", WEB_ROOT),
      "utf8"
    );
    assert.equal(/\bdocument\b/.test(src), false);
    assert.equal(/\blocalStorage\b/.test(src), false);
  });

  it("applyPhotoCropFlags toggles overlay chrome via injected els", () => {
    const context = vm.createContext({ console });
    context.globalThis = context;
    context.window = context;
    vm.runInContext(
      readFileSync(new URL("shell/photo-crop.js", WEB_ROOT), "utf8"),
      context,
      { filename: "shell/photo-crop.js" }
    );
    const shell = context.PetLiveWeb.shell;
    const htmlClasses = new Set();
    const els = {
      root: { hidden: true },
      img: {
        attrs: new Map([["src", "x"], ["style", "y"]]),
        removeAttribute(name) {
          this.attrs.delete(name);
        },
      },
      zoom: { value: "2" },
      htmlEl: {
        classList: {
          toggle(name, on) {
            if (on) htmlClasses.add(name);
            else htmlClasses.delete(name);
          },
        },
      },
      bodyEl: { style: { overflow: "" } },
    };
    assert.equal(
      shell.applyPhotoCropFlags(els, {
        rootHidden: false,
        htmlClass: "is-photo-crop-open",
        htmlClassOn: true,
        bodyOverflow: "hidden",
        clearImg: true,
        zoomValue: "1",
      }),
      true
    );
    assert.equal(els.root.hidden, false);
    assert.ok(htmlClasses.has("is-photo-crop-open"));
    assert.equal(els.bodyEl.style.overflow, "hidden");
    assert.equal(els.zoom.value, "1");
    assert.equal(els.img.attrs.has("src"), false);
  });

  it("applyCropImageTransform writes width/height/transform", () => {
    const context = vm.createContext({ console });
    context.globalThis = context;
    context.window = context;
    vm.runInContext(
      readFileSync(new URL("shell/photo-crop.js", WEB_ROOT), "utf8"),
      context,
      { filename: "shell/photo-crop.js" }
    );
    const img = { style: {} };
    assert.equal(
      context.PetLiveWeb.shell.applyCropImageTransform(img, {
        width: "10px",
        height: "20px",
        transform: "translate(1px, 2px)",
      }),
      true
    );
    assert.equal(img.style.width, "10px");
    assert.equal(img.style.height, "20px");
    assert.equal(img.style.transform, "translate(1px, 2px)");
  });

  it("bindPetPhotoFileInput opens crop with read file", async () => {
    const context = vm.createContext({ console });
    context.globalThis = context;
    context.window = context;
    vm.runInContext(
      readFileSync(new URL("shell/photo-crop.js", WEB_ROOT), "utf8"),
      context,
      { filename: "shell/photo-crop.js" }
    );
    const calls = [];
    let changeFn = null;
    const input = {
      getAttribute() {
        return null;
      },
      setAttribute() {},
      addEventListener(type, fn) {
        if (type === "change") changeFn = fn;
      },
      files: [{ name: "a.jpg" }],
      value: "x",
    };
    context.PetLiveWeb.shell.bindPetPhotoFileInput(input, {
      getCurrentPet: () => ({ id: "p1" }),
      readFileAsDataUrl: async () => "data:image/jpeg;base64,xx",
      onOpenCrop: async (dataUrl, petId) => {
        calls.push(["open", dataUrl, petId]);
      },
      onFail: () => calls.push(["fail"]),
    });
    await changeFn({ target: input });
    assert.equal(input.value, "");
    assert.deepEqual(calls, [
      ["open", "data:image/jpeg;base64,xx", "p1"],
    ]);
  });

  it("applyEmergencyPetPhotoFrame paints label and frame", () => {
    const context = vm.createContext({ console });
    context.globalThis = context;
    context.window = context;
    vm.runInContext(
      readFileSync(new URL("shell/photo-crop.js", WEB_ROOT), "utf8"),
      context,
      { filename: "shell/photo-crop.js" }
    );
    const frameLabel = {
      title: "",
      attrs: {},
      setAttribute(k, v) {
        this.attrs[k] = v;
      },
    };
    const frame = {
      classList: {
        on: false,
        toggle(_n, v) {
          this.on = v;
        },
      },
      style: { backgroundImage: "" },
      innerHTML: "",
    };
    assert.equal(
      context.PetLiveWeb.shell.applyEmergencyPetPhotoFrame(
        { frameLabel, frame },
        {
          hasPhoto: true,
          backgroundImage: "url(x)",
          frameInnerHtml: "<span></span>",
        },
        "Photo"
      ),
      true
    );
    assert.equal(frameLabel.title, "Photo");
    assert.equal(frameLabel.attrs["aria-label"], "Photo");
    assert.equal(frame.classList.on, true);
    assert.equal(frame.style.backgroundImage, "url(x)");
    assert.equal(frame.innerHTML, "<span></span>");
  });

  it("bindPhotoCropUi registers zoom input and cancel hooks", () => {
    const { photoCrop } = loadPhotoCropShell();
    const state = photoCrop.createInitialSession();
    photoCrop.applyOpen(state, { petId: "p1", naturalW: 40, naturalH: 40 });
    const zoomListeners = [];
    const cancelListeners = [];
    const els = {
      viewport: {
        addEventListener() {},
        classList: { add() {}, remove() {} },
        setPointerCapture() {},
      },
      zoom: {
        value: "2",
        addEventListener(type, fn) {
          if (type === "input") zoomListeners.push(fn);
        },
      },
      cancel: {
        addEventListener(type, fn) {
          if (type === "click") cancelListeners.push(fn);
        },
      },
      save: { addEventListener() {} },
      root: { addEventListener() {} },
    };
    let renders = 0;
    let cancels = 0;
    assert.equal(
      photoCrop.bindPhotoCropUi(els, state, {
        win: { addEventListener() {} },
        onRender: () => {
          renders += 1;
        },
        onCancel: () => {
          cancels += 1;
        },
      }),
      true
    );
    zoomListeners[0]();
    assert.equal(state.zoom, 2);
    assert.equal(renders, 1);
    cancelListeners[0]();
    assert.equal(cancels, 1);
  });

  it("session open/close and drag offsets", () => {
    const { photoCrop } = loadPhotoCropShell();
    const state = photoCrop.createInitialSession();
    assert.equal(state.open, false);

    const openFlags = photoCrop.applyOpen(state, {
      petId: "p1",
      naturalW: 800,
      naturalH: 600,
    });
    assert.equal(state.open, true);
    assert.equal(state.petId, "p1");
    assert.equal(state.zoom, 1);
    assert.equal(openFlags.rootHidden, false);
    assert.equal(openFlags.htmlClassOn, true);

    assert.equal(photoCrop.beginDrag(state, { pointerId: 1, clientX: 10, clientY: 20 }), true);
    assert.equal(
      photoCrop.moveDrag(state, { pointerId: 1, clientX: 18, clientY: 16 }),
      true
    );
    assert.equal(state.offsetX, 8);
    assert.equal(state.offsetY, -4);
    assert.equal(photoCrop.moveDrag(state, { pointerId: 99, clientX: 0, clientY: 0 }), false);
    assert.equal(photoCrop.endDrag(state, { pointerId: 1 }), true);
    assert.equal(state.dragging, false);

    const closeFlags = photoCrop.applyClose(state);
    assert.equal(state.open, false);
    assert.equal(closeFlags.rootHidden, true);
    assert.equal(closeFlags.clearImg, true);
  });

  it("exportCroppedJpegDataUrl draws using inject createCanvas", () => {
    const { petsMedia } = loadPhotoCropShell();
    const calls = [];
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext() {
        return {
          fillStyle: "",
          fillRect(...args) {
            calls.push(["fillRect", ...args]);
          },
          drawImage(...args) {
            calls.push(["drawImage", args.length]);
          },
        };
      },
      toDataURL(type, quality) {
        return `data:${type};q=${quality}`;
      },
    };
    const metrics = petsMedia.computeCropMetrics({
      view: 200,
      naturalW: 400,
      naturalH: 400,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
    const out = petsMedia.exportCroppedJpegDataUrl(
      { fake: true },
      metrics,
      {
        outputSize: 480,
        quality: 0.86,
        fillStyle: "#e8f1ed",
        createCanvas: () => fakeCanvas,
      }
    );
    assert.equal(out, "data:image/jpeg;q=0.86");
    assert.equal(fakeCanvas.width, 480);
    assert.equal(fakeCanvas.height, 480);
    assert.ok(calls.some((c) => c[0] === "fillRect"));
    assert.ok(calls.some((c) => c[0] === "drawImage"));
  });

  it("resizeImageDataUrl uses JPEG 0.82 and maxEdge default 480", async () => {
    const { petsMedia } = loadPhotoCropShell();
    const calls = [];
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext() {
        return {
          drawImage(...args) {
            calls.push(["drawImage", ...args]);
          },
        };
      },
      toDataURL(type, quality) {
        return `data:${type};q=${quality};${this.width}x${this.height}`;
      },
    };
    const out = await petsMedia.resizeImageDataUrl(
      "data:image/png;base64,xx",
      undefined,
      {
        createImage: () => {
          const img = {
            width: 960,
            height: 480,
            onload: null,
            onerror: null,
            set src(_v) {
              queueMicrotask(() => img.onload && img.onload());
            },
          };
          return img;
        },
        createCanvas: () => fakeCanvas,
      }
    );
    assert.equal(out, "data:image/jpeg;q=0.82;480x240");
    assert.equal(fakeCanvas.width, 480);
    assert.equal(fakeCanvas.height, 240);
  });
});
