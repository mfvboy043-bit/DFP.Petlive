(function initPetLiveWebShellGlassDock(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Map active screen id → dock tab key (data-dock).
   * Pure — no DOM. Child screens highlight their parent tab.
   */
  function dockKeyForScreen(screen) {
    const id = String(screen || "");
    if (id === "timeline" || id === "add-visit" || id === "add-med") {
      return "timeline";
    }
    if (id === "alerts") return "alerts";
    if (id === "imaging" || id === "imaging-proof") return "imaging";
    if (id === "labs" || id === "lab-add") return "labs";
    if (id === "home" || id === "emergency") return "home";
    return null;
  }

  function shouldHideDock(screen, hideOnScreens) {
    const list = Array.isArray(hideOnScreens) ? hideOnScreens : [];
    return list.includes(String(screen || ""));
  }

  /**
   * Paint bottom glass dock: active tab, sliding thumb, optional icon jump.
   * @param {Document} doc
   * @param {{
   *   getActiveScreen?: () => string|null,
   *   animateJump?: boolean,
   *   hideOnScreens?: string[],
   *   state?: { thumbPrimed?: boolean },
   * }} [opts]
   */
  function paintGlassDock(doc, opts = {}) {
    if (!doc || typeof doc.getElementById !== "function") return;
    const {
      getActiveScreen,
      animateJump = false,
      hideOnScreens = [],
      state = {},
    } = opts;

    const dock = doc.getElementById("glass-dock");
    if (!dock) return;
    const thumb = doc.getElementById("glass-dock-thumb");
    const screen =
      (typeof getActiveScreen === "function" && getActiveScreen()) ||
      doc.querySelector?.(".screen.is-active")?.dataset?.screen ||
      "home";

    if (shouldHideDock(screen, hideOnScreens)) {
      dock.hidden = true;
      doc.documentElement?.classList?.remove("has-glass-dock");
      return;
    }
    dock.hidden = false;
    doc.documentElement?.classList?.add("has-glass-dock");

    const dockKey = dockKeyForScreen(screen);
    let activeBtn = null;

    dock.querySelectorAll(".glass-dock-item").forEach((btn) => {
      const on = dockKey != null && btn.getAttribute("data-dock") === dockKey;
      const wasOn = btn.classList.contains("is-active");
      btn.classList.toggle("is-active", on);
      if (on) {
        activeBtn = btn;
        btn.setAttribute("aria-current", "page");
        if (animateJump && !wasOn) {
          btn.classList.remove("is-jumping");
          void btn.offsetWidth;
          btn.classList.add("is-jumping");
          const clearJump = () => btn.classList.remove("is-jumping");
          btn.addEventListener("animationend", clearJump, { once: true });
        }
      } else {
        btn.removeAttribute("aria-current");
        btn.classList.remove("is-jumping");
      }
    });

    if (thumb && activeBtn) {
      const left = activeBtn.offsetLeft;
      const width = activeBtn.offsetWidth;
      if (!state.thumbPrimed) {
        thumb.style.transition = "none";
        thumb.style.width = `${width}px`;
        thumb.style.transform = `translateX(${left}px)`;
        thumb.classList.add("is-ready");
        void thumb.offsetWidth;
        thumb.style.transition = "";
        state.thumbPrimed = true;
      } else {
        thumb.style.width = `${width}px`;
        thumb.style.transform = `translateX(${left}px)`;
        thumb.classList.add("is-ready");
      }
    } else if (thumb) {
      thumb.classList.remove("is-ready");
    }
  }

  /**
   * Boot paint + resize remeasure. Returns state bag shared across paints.
   */
  function initGlassDock(doc, hooks = {}) {
    const {
      win = global,
      getActiveScreen,
      hideOnScreens = [],
    } = hooks;
    const state = { thumbPrimed: false };
    const paint = (animateJump) =>
      paintGlassDock(doc, {
        getActiveScreen,
        animateJump: Boolean(animateJump),
        hideOnScreens,
        state,
      });

    paint(false);
    if (win && typeof win.addEventListener === "function") {
      win.addEventListener("resize", () => paint(false));
    }
    return { paint, state };
  }

  root.shell.dockKeyForScreen = dockKeyForScreen;
  root.shell.paintGlassDock = paintGlassDock;
  root.shell.initGlassDock = initGlassDock;
})(typeof window !== "undefined" ? window : globalThis);
