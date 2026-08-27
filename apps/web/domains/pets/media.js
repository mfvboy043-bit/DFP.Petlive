(function initPetLiveWebPetsMedia(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.pets = root.domains.pets || {};

  function computeCropMetrics({
    view,
    naturalW,
    naturalH,
    zoom,
    offsetX,
    offsetY,
  }) {
    const nw = naturalW;
    const nh = naturalH;
    if (!nw || !nh) {
      return { view, scale: 1, left: 0, top: 0, width: view, height: view };
    }
    const cover = Math.max(view / nw, view / nh);
    const scale = cover * (zoom || 1);
    const width = nw * scale;
    const height = nh * scale;
    const left = view / 2 - width / 2 + (offsetX || 0);
    const top = view / 2 - height / 2 + (offsetY || 0);
    return { view, scale, left, top, width, height, nw, nh };
  }

  function clampCropOffset(state, metrics) {
    const view = metrics.view;
    const width = metrics.width;
    const height = metrics.height;
    const maxX = Math.max(0, (width - view) / 2);
    const maxY = Math.max(0, (height - view) / 2);
    return {
      offsetX: Math.min(maxX, Math.max(-maxX, state.offsetX || 0)),
      offsetY: Math.min(maxY, Math.max(-maxY, state.offsetY || 0)),
    };
  }

  function exportCropSourceRect(metrics) {
    const { view, scale, left, top, nw, nh } = metrics;
    if (!nw || !nh) return null;
    const srcSize = view / scale;
    const sx = Math.max(0, Math.min(nw - srcSize, -left / scale));
    const sy = Math.max(0, Math.min(nh - srcSize, -top / scale));
    const sw = Math.min(srcSize, nw - sx);
    const sh = Math.min(srcSize, nh - sy);
    return { sx, sy, sw, sh };
  }

  /**
   * Draw cropped JPEG from an image + metrics. Browser-only (needs canvas).
   * @param {CanvasImageSource} image
   * @param {object} metrics from computeCropMetrics / exportCropSourceRect inputs
   * @param {{ outputSize?: number, quality?: number, fillStyle?: string, createCanvas?: Function }} [options]
   */
  function exportCroppedJpegDataUrl(image, metrics, options = {}) {
    const outputSize = options.outputSize ?? 480;
    const quality = options.quality ?? 0.86;
    const fillStyle = options.fillStyle ?? "#e8f1ed";
    const rect = exportCropSourceRect(metrics);
    if (!rect || !metrics?.nw || !metrics?.nh || !image) return null;
    const createCanvas =
      options.createCanvas ||
      (typeof document !== "undefined"
        ? () => document.createElement("canvas")
        : null);
    if (!createCanvas) return null;
    const canvas = createCanvas();
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, outputSize, outputSize);
    ctx.drawImage(
      image,
      rect.sx,
      rect.sy,
      rect.sw,
      rect.sh,
      0,
      0,
      outputSize,
      outputSize
    );
    if (typeof canvas.toDataURL !== "function") return null;
    return canvas.toDataURL("image/jpeg", quality);
  }

  function createMedia({ photosSlot, pets } = {}) {
    if (
      !photosSlot ||
      typeof photosSlot.read !== "function" ||
      typeof photosSlot.scheduleWrite !== "function" ||
      typeof photosSlot.flush !== "function" ||
      typeof photosSlot.hasPendingWrite !== "function"
    ) {
      throw new TypeError("createMedia requires photosSlot");
    }

    function loadMap() {
      return photosSlot.read();
    }

    function getPetPhoto(petId) {
      const map = loadMap();
      return map[petId] || null;
    }

    function setPetPhoto(petId, dataUrl) {
      const map = loadMap();
      if (dataUrl) map[petId] = dataUrl;
      else delete map[petId];
      if (!photosSlot.scheduleWrite(map)) return false;
      if (Array.isArray(pets)) {
        const pet = pets.find((p) => p.id === petId);
        if (pet) pet.photo = dataUrl || "";
      }
      return true;
    }

    function hydratePetPhotos(petsArray) {
      const list = Array.isArray(petsArray) ? petsArray : pets;
      if (!Array.isArray(list)) return;
      const map = loadMap();
      list.forEach((pet) => {
        if (map[pet.id]) pet.photo = map[pet.id];
      });
    }

    function flush() {
      return photosSlot.flush();
    }

    function hasPendingWrite() {
      return photosSlot.hasPendingWrite();
    }

    return {
      loadMap,
      getPetPhoto,
      setPetPhoto,
      hydratePetPhotos,
      flush,
      hasPendingWrite,
      computeCropMetrics,
      clampCropOffset,
      exportCropSourceRect,
      exportCroppedJpegDataUrl,
    };
  }

  root.domains.pets.computeCropMetrics = computeCropMetrics;
  root.domains.pets.clampCropOffset = clampCropOffset;
  root.domains.pets.exportCropSourceRect = exportCropSourceRect;
  root.domains.pets.exportCroppedJpegDataUrl = exportCroppedJpegDataUrl;
  root.domains.pets.createMedia = createMedia;
})(typeof window !== "undefined" ? window : globalThis);
