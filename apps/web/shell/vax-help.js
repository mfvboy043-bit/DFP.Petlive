(function initPetLiveWebShellVaxHelp(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function setVaxHelpOpen(els, open) {
    const helpBtn = els?.helpBtn;
    const pop = els?.pop;
    if (!helpBtn || !pop) return;
    pop.hidden = !open;
    helpBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  /**
   * Vaccine help overlay chrome. One Escape owner: closes help + injected
   * closeProofLightbox so lightbox + popover stay bit-for-bit.
   */
  function initVaxHelp(els = {}, hooks = {}) {
    const { helpBtn, pop, doc } = els;
    const documentRef =
      doc ||
      (typeof document !== "undefined" ? document : null);
    if (!helpBtn || !pop) {
      return {
        setVaxHelpOpen: () => {},
        close: () => {},
      };
    }

    const { closeProofLightbox, helpSelector = "#e-vax-help, #e-vax-help-pop" } =
      hooks;

    function setOpen(open) {
      setVaxHelpOpen({ helpBtn, pop }, open);
    }

    function close() {
      setOpen(false);
    }

    helpBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(Boolean(pop.hidden));
    });

    pop.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    if (documentRef && typeof documentRef.addEventListener === "function") {
      documentRef.addEventListener("click", (event) => {
        if (event.target.closest(helpSelector)) return;
        close();
      });

      documentRef.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (typeof closeProofLightbox === "function") closeProofLightbox();
        close();
      });
    }

    return { setVaxHelpOpen: setOpen, close };
  }

  root.shell.setVaxHelpOpen = setVaxHelpOpen;
  root.shell.initVaxHelp = initVaxHelp;
})(typeof window !== "undefined" ? window : globalThis);
