(function initPetLiveWebShellTimelineListWire(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Timeline list click/submit routing. Domain toggles, clears, and HTML
   * builders stay on injected callbacks — this module only routes data-*.
   */
  function bindTimelineList(listEl, hooks = {}) {
    if (!listEl || typeof listEl.addEventListener !== "function") return false;

    const {
      toggleDrugNotesButton,
      toggleMedDetailButton,
      toggleVisitWeightButton,
      toggleVisitRxButton,
      toggleVisitImagingButton,
      go,
      openProofLightbox,
      getCurrentPet,
      clearVisitProofSlot,
      clearVisitImagingPhoto,
      showToast,
      t,
      applySelectedPet,
      querySelector,
      openVisitProof,
      openVisitImaging,
      openCompleteDrugs,
      saveVisitWeightAtIndex,
    } = hooks;

    const docQuery =
      typeof querySelector === "function"
        ? querySelector
        : (sel) =>
            (typeof document !== "undefined" && document.querySelector
              ? document.querySelector(sel)
              : null);

    listEl.addEventListener("click", (event) => {
      const notesToggle = event.target.closest("[data-drug-notes-toggle]");
      if (notesToggle) {
        if (typeof toggleDrugNotesButton === "function") {
          toggleDrugNotesButton(notesToggle);
        }
        return;
      }
      const medDetailToggle = event.target.closest("[data-med-detail-toggle]");
      if (medDetailToggle) {
        if (typeof toggleMedDetailButton === "function") {
          toggleMedDetailButton(medDetailToggle);
        }
        return;
      }
      const visitWeightToggle = event.target.closest(
        "[data-visit-weight-toggle]"
      );
      if (visitWeightToggle) {
        if (typeof toggleVisitWeightButton === "function") {
          toggleVisitWeightButton(visitWeightToggle);
        }
        return;
      }
      const visitLabsBtn = event.target.closest("[data-open-labs]");
      if (visitLabsBtn) {
        if (typeof go === "function") go("labs");
        return;
      }
      const visitRxToggle = event.target.closest("[data-visit-rx-toggle]");
      if (visitRxToggle) {
        if (typeof toggleVisitRxButton === "function") {
          toggleVisitRxButton(visitRxToggle);
        }
        return;
      }
      const visitImagingToggle = event.target.closest(
        "[data-visit-imaging-toggle]"
      );
      if (visitImagingToggle) {
        if (typeof toggleVisitImagingButton === "function") {
          toggleVisitImagingButton(visitImagingToggle);
        }
        return;
      }
      const proofLightboxBtn = event.target.closest("[data-proof-lightbox]");
      if (proofLightboxBtn) {
        const img = proofLightboxBtn.querySelector("img");
        if (typeof openProofLightbox === "function") {
          openProofLightbox(
            img?.currentSrc || img?.src,
            proofLightboxBtn.dataset.proofCaption
          );
        }
        return;
      }
      const clearSlotBtn = event.target.closest(
        "[data-visit-proof-clear-slot]"
      );
      if (clearSlotBtn) {
        const pet =
          typeof getCurrentPet === "function" ? getCurrentPet() : null;
        const visitIndex = Number(clearSlotBtn.dataset.visitIndex);
        const visit = pet.visits[visitIndex];
        const slot = clearSlotBtn.dataset.visitProofClearSlot;
        if (!visit || !slot) return;
        if (typeof clearVisitProofSlot === "function") {
          clearVisitProofSlot(visit, slot);
        }
        if (typeof showToast === "function" && typeof t === "function") {
          showToast(t("toastProofCleared"));
        }
        if (typeof applySelectedPet === "function") applySelectedPet();
        const toggle = docQuery(
          `[data-visit-rx-toggle][aria-controls="visit-rx-${visitIndex}"]`
        );
        if (toggle && typeof toggleVisitRxButton === "function") {
          toggleVisitRxButton(toggle);
        }
        return;
      }
      const clearImagingBtn = event.target.closest(
        "[data-visit-imaging-clear-slot]"
      );
      if (clearImagingBtn) {
        const pet =
          typeof getCurrentPet === "function" ? getCurrentPet() : null;
        const visitIndex = Number(clearImagingBtn.dataset.visitIndex);
        const visit = pet?.visits?.[visitIndex];
        const slot = clearImagingBtn.dataset.visitImagingClearSlot;
        const photoIndex = Number(
          clearImagingBtn.dataset.visitImagingClearIndex
        );
        if (!visit || !slot) return;
        if (typeof clearVisitImagingPhoto === "function") {
          clearVisitImagingPhoto(visit, slot, photoIndex);
        }
        if (typeof showToast === "function" && typeof t === "function") {
          showToast(t("toastImagingCleared"));
        }
        if (typeof applySelectedPet === "function") applySelectedPet();
        const toggle = docQuery(
          `[data-visit-imaging-toggle][aria-controls="visit-imaging-${visitIndex}"]`
        );
        if (toggle && typeof toggleVisitImagingButton === "function") {
          toggleVisitImagingButton(toggle);
        }
        return;
      }
      const visitUpload = event.target.closest("[data-visit-proof-upload]");
      if (visitUpload) {
        if (typeof openVisitProof === "function") {
          openVisitProof(Number(visitUpload.dataset.visitProofUpload));
        }
        return;
      }
      const imagingUpload = event.target.closest(
        "[data-visit-imaging-upload]"
      );
      if (imagingUpload) {
        if (typeof openVisitImaging === "function") {
          openVisitImaging(Number(imagingUpload.dataset.visitImagingUpload));
        }
        return;
      }
      const completeBtn = event.target.closest("[data-complete-visit]");
      if (completeBtn && typeof openCompleteDrugs === "function") {
        openCompleteDrugs(Number(completeBtn.dataset.completeVisit));
      }
    });

    listEl.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-visit-weight-form]");
      if (!form) return;
      event.preventDefault();
      if (typeof saveVisitWeightAtIndex === "function") {
        saveVisitWeightAtIndex(Number(form.dataset.visitWeightForm));
      }
    });

    return true;
  }

  root.shell.bindTimelineList = bindTimelineList;
})(typeof window !== "undefined" ? window : globalThis);
