(function initPetLiveWebShellImagingProof(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Open imaging-proof screen for a visit index. Pending photo copies +
   * DOM fill stay orchestrated here; domain getters / go stay injected.
   */
  function openImagingProofScreen(hooks = {}) {
    const {
      visitIndex,
      getCurrentPet,
      getVisitImaging,
      visitClinicLabel,
      setPendingImagingVisitIndex,
      setPendingXrayPhotos,
      setPendingUsPhotos,
      nameEl,
      metaEl,
      subEl,
      kickerEl,
      xrayInput,
      usInput,
      renderImagingSlotPreviews,
      go,
      t,
      imagingProofSubKey = "timelineVisitImagingProofSub",
      imagingTargetKey = "timelineVisitImagingTarget",
    } = hooks;

    const pet = typeof getCurrentPet === "function" ? getCurrentPet() : null;
    const visit = pet?.visits?.[visitIndex];
    if (!visit) return false;

    if (typeof setPendingImagingVisitIndex === "function") {
      setPendingImagingVisitIndex(visitIndex);
    }
    const imaging =
      typeof getVisitImaging === "function" ? getVisitImaging(visit) : null;
    if (typeof setPendingXrayPhotos === "function") {
      setPendingXrayPhotos([...(imaging?.xrayPhotos || [])]);
    }
    if (typeof setPendingUsPhotos === "function") {
      setPendingUsPhotos([...(imaging?.usPhotos || [])]);
    }

    if (nameEl) {
      nameEl.textContent =
        typeof visitClinicLabel === "function"
          ? visitClinicLabel(visit)
          : "";
    }
    if (metaEl) metaEl.textContent = visit.date || "";
    if (subEl && typeof t === "function") {
      subEl.textContent = t(imagingProofSubKey);
    }
    if (kickerEl && typeof t === "function") {
      kickerEl.setAttribute("data-i18n", imagingTargetKey);
      kickerEl.textContent = t(imagingTargetKey);
    }
    if (xrayInput) xrayInput.value = "";
    if (usInput) usInput.value = "";
    if (typeof renderImagingSlotPreviews === "function") {
      renderImagingSlotPreviews("xray");
      renderImagingSlotPreviews("us");
    }
    if (typeof go === "function") go("imaging-proof");
    return true;
  }

  root.shell.openImagingProofScreen = openImagingProofScreen;
})(typeof window !== "undefined" ? window : globalThis);
