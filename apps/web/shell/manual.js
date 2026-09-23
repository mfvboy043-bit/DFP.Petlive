(function initPetLiveWebShellManual(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Swap the two CTAs when the account has no real pets yet.
   * Facade supplies empty + label(); shell does not read pets[] or storage.
   */
  function paintManualScreen(doc, { empty, label } = {}) {
    if (!doc || typeof label !== "function") return false;
    const isEmpty = Boolean(empty);
    const primary = doc.getElementById("manual-cta-primary");
    const addAlt = doc.getElementById("manual-cta-add-alt");
    if (primary) {
      primary.setAttribute("data-go", isEmpty ? "add-pet" : "home");
      primary.setAttribute(
        "data-i18n",
        isEmpty ? "manualCtaAddPet" : "manualCtaHome"
      );
      primary.textContent = label(isEmpty ? "manualCtaAddPet" : "manualCtaHome");
    }
    if (addAlt) {
      addAlt.setAttribute("data-go", isEmpty ? "home" : "add-pet");
      addAlt.setAttribute(
        "data-i18n",
        isEmpty ? "manualCtaHome" : "manualCtaAddPet"
      );
      addAlt.textContent = label(isEmpty ? "manualCtaHome" : "manualCtaAddPet");
    }
    return true;
  }

  root.shell.paintManualScreen = paintManualScreen;
})(typeof window !== "undefined" ? window : globalThis);
