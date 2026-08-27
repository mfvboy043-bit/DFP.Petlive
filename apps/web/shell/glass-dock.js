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
   * Single markup source for C + B (passportGo differs: home vs emergency).
   * @param {{ passportGo?: string, startHidden?: boolean }} [opts]
   */
  function glassDockMarkup(opts = {}) {
    const passportGo = String(opts.passportGo || "home");
    const hiddenAttr = opts.startHidden ? " hidden" : "";
    return `
<nav
  class="glass-dock"
  id="glass-dock"
  data-i18n-aria="glassDockAria"
  aria-label="主選單"${hiddenAttr}
>
  <span class="glass-dock-thumb" id="glass-dock-thumb" aria-hidden="true"></span>
  <button class="glass-dock-item" type="button" data-go="timeline" data-dock="timeline">
    <span class="glass-dock-ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4 7h16M4 12h12M4 17h8" />
      </svg>
    </span>
    <span class="glass-dock-label" data-i18n="dockTimeline">時間軸</span>
  </button>
  <button class="glass-dock-item" type="button" data-go="alerts" data-dock="alerts">
    <span class="glass-dock-ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 4 3.5 19h17L12 4z" />
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 10v4M12 16.5v.5" />
      </svg>
    </span>
    <span class="glass-dock-label" data-i18n="dockAlerts">警示</span>
  </button>
  <button class="glass-dock-item" type="button" data-go="${passportGo}" data-dock="home">
    <span class="glass-dock-ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
        <rect x="5" y="4" width="14" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
      </svg>
    </span>
    <span class="glass-dock-label" data-i18n="dockPassport">護照</span>
  </button>
  <button class="glass-dock-item" type="button" data-go="imaging" data-dock="imaging">
    <span class="glass-dock-ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
        <rect x="3.5" y="6" width="17" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" />
        <circle cx="9" cy="12" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="m12.5 14.5 2.2-2.2 3.3 3.2" />
      </svg>
    </span>
    <span class="glass-dock-label" data-i18n="dockImaging">影像</span>
  </button>
  <button class="glass-dock-item" type="button" data-go="labs" data-dock="labs">
    <span class="glass-dock-ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M9 3.5h6v5.2l3.5 8.3A2.2 2.2 0 0 1 16.5 20.5h-9a2.2 2.2 0 0 1-2-3.5L9 8.7z" />
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9 3.5h6" />
      </svg>
    </span>
    <span class="glass-dock-label" data-i18n="dockLabs">報告</span>
  </button>
</nav>`;
  }

  /**
   * Mount dock once (replace stale inline copy if present).
   * @param {Document} doc
   * @param {{ passportGo?: string, startHidden?: boolean }} [opts]
   */
  function ensureGlassDock(doc, opts = {}) {
    if (!doc || typeof doc.getElementById !== "function") return null;
    const existing = doc.getElementById("glass-dock");
    if (existing) existing.remove();
    const html = glassDockMarkup(opts);
    const lang = doc.getElementById("lang-switcher");
    if (lang && typeof lang.insertAdjacentHTML === "function") {
      lang.insertAdjacentHTML("beforebegin", html);
    } else if (doc.body && typeof doc.body.insertAdjacentHTML === "function") {
      doc.body.insertAdjacentHTML("beforeend", html);
    }
    return doc.getElementById("glass-dock");
  }

  function wireGlassDockClicks(doc, onGo) {
    const dock = doc.getElementById("glass-dock");
    if (!dock || dock.dataset.navWired === "1") return;
    dock.dataset.navWired = "1";
    dock.addEventListener("click", (event) => {
      const btn = event.target?.closest?.("[data-go]");
      if (!btn || !dock.contains(btn)) return;
      const screen = btn.getAttribute("data-go");
      if (!screen) return;
      if (typeof onGo === "function") onGo(screen, btn);
    });
  }

  /**
   * Paint bottom glass dock: active tab, sliding thumb, optional icon jump.
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
   * Mount markup, wire clicks, boot paint + resize.
   */
  function initGlassDock(doc, hooks = {}) {
    const {
      win = global,
      getActiveScreen,
      hideOnScreens = [],
      passportGo = "home",
      startHidden = false,
      onGo,
      onMounted,
    } = hooks;
    const state = { thumbPrimed: false };

    ensureGlassDock(doc, { passportGo, startHidden });
    wireGlassDockClicks(doc, onGo);
    if (typeof onMounted === "function") onMounted(doc.getElementById("glass-dock"));

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
  root.shell.glassDockMarkup = glassDockMarkup;
  root.shell.ensureGlassDock = ensureGlassDock;
  root.shell.paintGlassDock = paintGlassDock;
  root.shell.initGlassDock = initGlassDock;
})(typeof window !== "undefined" ? window : globalThis);
