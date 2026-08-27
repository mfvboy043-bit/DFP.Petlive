(function initPetLiveWebShellAppNav(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function syncAppNavBtnIcons(doc, open) {
    if (!doc || typeof doc.querySelectorAll !== "function") return;
    doc.querySelectorAll(".js-app-nav-btn").forEach((btn) => {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      const closed = btn.querySelector(".app-nav-label-closed");
      const opened = btn.querySelector(".app-nav-label-open");
      if (closed) closed.hidden = !!open;
      if (opened) opened.hidden = !open;
    });
  }

  function closeAppNavMenu(doc) {
    if (!doc || typeof doc.getElementById !== "function") return;
    const panel = doc.getElementById("app-nav-panel");
    if (panel) panel.hidden = true;
    syncAppNavBtnIcons(doc, false);
  }

  function setAppNavMenuOpen(doc, win, open, anchorBtn) {
    if (!doc || typeof doc.getElementById !== "function") return;
    const panel = doc.getElementById("app-nav-panel");
    if (!panel) return;
    panel.hidden = !open;
    syncAppNavBtnIcons(doc, open);
    if (open && anchorBtn) {
      const rect = anchorBtn.getBoundingClientRect();
      const innerWidth =
        (win && typeof win.innerWidth === "number" && win.innerWidth) ||
        rect.right;
      panel.style.top = `${Math.max(rect.bottom + 10, 12)}px`;
      panel.style.right = `${Math.max(12, innerWidth - rect.right)}px`;
      panel.style.left = "auto";
      panel.style.marginRight = "0";
    }
  }

  /**
   * Glass app-nav panel open/close wires. Inject onManualNav + closeAccountMenu
   * so shell does not own screen go or auth chrome.
   */
  function initAppNavMenu(doc, hooks = {}) {
    const {
      onManualNav,
      closeAccountMenu,
      win = typeof global !== "undefined" && global.window
        ? global.window
        : globalThis,
    } = hooks;
    if (!doc || typeof doc.getElementById !== "function") return false;
    const panel = doc.getElementById("app-nav-panel");
    if (!panel) return false;

    doc.getElementById("nav-manual-btn")?.addEventListener("click", () => {
      closeAppNavMenu(doc);
      if (typeof onManualNav === "function") onManualNav();
    });

    doc.addEventListener("click", (event) => {
      const btn = event.target.closest?.(".js-app-nav-btn");
      if (btn) {
        event.stopPropagation();
        const willOpen = panel.hidden;
        if (willOpen && typeof closeAccountMenu === "function") {
          closeAccountMenu();
        }
        setAppNavMenuOpen(doc, win, willOpen, btn);
        return;
      }
      if (panel.hidden) return;
      if (event.target.closest("#app-nav-panel")) return;
      closeAppNavMenu(doc);
    });

    doc.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (panel.hidden) return;
      closeAppNavMenu(doc);
    });

    return true;
  }

  root.shell.syncAppNavBtnIcons = syncAppNavBtnIcons;
  root.shell.closeAppNavMenu = closeAppNavMenu;
  root.shell.setAppNavMenuOpen = setAppNavMenuOpen;
  root.shell.initAppNavMenu = initAppNavMenu;
})(typeof window !== "undefined" ? window : globalThis);
