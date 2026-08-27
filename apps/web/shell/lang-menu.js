(function initPetLiveWebShellLangMenu(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function closeLangMenu(els = {}) {
    const { langMenu, langFab } = els;
    if (!langMenu || !langFab) return;
    langMenu.hidden = true;
    langFab.setAttribute("aria-expanded", "false");
  }

  /**
   * Language fab/menu open-close + pick. Facade injects setLanguage / toast.
   * Does not own onLanguageChange / renderCoordinator.refreshLanguage.
   */
  function initLangMenu(els = {}, hooks = {}) {
    const { langFab, langMenu, doc } = els;
    if (!langFab || !langMenu) return { closeLangMenu: () => {} };

    const { onPickLang, onToast, switcherSelector = "#lang-switcher" } = hooks;
    const documentRef =
      doc ||
      (typeof document !== "undefined" ? document : null);

    function close() {
      closeLangMenu({ langMenu, langFab });
    }

    langFab.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = langMenu.hidden;
      langMenu.hidden = !open;
      langFab.setAttribute("aria-expanded", open ? "true" : "false");
    });

    langMenu.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-lang]");
      if (!btn) return;
      if (typeof onPickLang === "function") onPickLang(btn.dataset.lang);
      close();
      if (typeof onToast === "function") onToast();
    });

    if (documentRef && typeof documentRef.addEventListener === "function") {
      documentRef.addEventListener("click", (event) => {
        if (event.target.closest(switcherSelector)) return;
        close();
      });
    }

    return { closeLangMenu: close };
  }

  root.shell.closeLangMenu = closeLangMenu;
  root.shell.initLangMenu = initLangMenu;
})(typeof window !== "undefined" ? window : globalThis);
