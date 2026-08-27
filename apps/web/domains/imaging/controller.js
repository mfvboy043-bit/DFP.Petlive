(function initPetLiveWebImagingController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.imaging = root.domains.imaging || {};

  const IMAGING_PHOTOS_MAX = 4;

  function normalizePhotoList(list) {
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }

  function createController() {
    function getVisitImaging(visit) {
      const img = visit?.imaging;
      return {
        xrayPhotos: normalizePhotoList(img?.xrayPhotos),
        usPhotos: normalizePhotoList(img?.usPhotos),
      };
    }

    function ensureVisitImaging(visit) {
      if (!visit) return { xrayPhotos: [], usPhotos: [] };
      const current = getVisitImaging(visit);
      visit.imaging = {
        xrayPhotos: [...current.xrayPhotos],
        usPhotos: [...current.usPhotos],
      };
      return visit.imaging;
    }

    function visitHasImaging(visit) {
      const img = getVisitImaging(visit);
      return Boolean(img.xrayPhotos.length || img.usPhotos.length);
    }

    function imagingTypeKeys(visit) {
      const img = getVisitImaging(visit);
      const keys = [];
      if (img.xrayPhotos.length) keys.push("xray");
      if (img.usPhotos.length) keys.push("us");
      return keys;
    }

    function getImagingVisitEntries(pet) {
      return (pet?.visits || [])
        .map((visit, index) => ({ visit, index }))
        .filter(({ visit }) => visitHasImaging(visit))
        .sort((a, b) => {
          const da = String(a.visit.date || "");
          const db = String(b.visit.date || "");
          if (da !== db) return da < db ? 1 : -1;
          return b.index - a.index;
        });
    }

    function clearVisitImagingPhoto(visit, slot, index) {
      const imaging = ensureVisitImaging(visit);
      const key = slot === "us" ? "usPhotos" : "xrayPhotos";
      if (!Number.isInteger(index) || index < 0 || index >= imaging[key].length) {
        return;
      }
      imaging[key].splice(index, 1);
    }

    function appendVisitImagingPhoto(visit, slot, dataUrl) {
      const imaging = ensureVisitImaging(visit);
      const key = slot === "us" ? "usPhotos" : "xrayPhotos";
      if (imaging[key].length >= IMAGING_PHOTOS_MAX) {
        return { ok: false, reason: "cap" };
      }
      if (!dataUrl) {
        return { ok: false, reason: "empty" };
      }
      imaging[key].push(dataUrl);
      return { ok: true };
    }

    function setVisitImaging(visit, { xrayPhotos, usPhotos } = {}) {
      const imaging = ensureVisitImaging(visit);
      if (xrayPhotos !== undefined) {
        imaging.xrayPhotos = normalizePhotoList(xrayPhotos).slice(
          0,
          IMAGING_PHOTOS_MAX
        );
      }
      if (usPhotos !== undefined) {
        imaging.usPhotos = normalizePhotoList(usPhotos).slice(
          0,
          IMAGING_PHOTOS_MAX
        );
      }
      return imaging;
    }

    return {
      IMAGING_PHOTOS_MAX,
      getVisitImaging,
      ensureVisitImaging,
      visitHasImaging,
      imagingTypeKeys,
      getImagingVisitEntries,
      clearVisitImagingPhoto,
      appendVisitImagingPhoto,
      setVisitImaging,
    };
  }

  root.domains.imaging.createController = createController;
  root.domains.imaging.IMAGING_PHOTOS_MAX = IMAGING_PHOTOS_MAX;
})(typeof window !== "undefined" ? window : globalThis);
