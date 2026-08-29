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
    if (id === "emergency") return "passport";
    return null;
  }

  function shouldHideDock(screen, hideOnScreens) {
    const list = Array.isArray(hideOnScreens) ? hideOnScreens : [];
    return list.includes(String(screen || ""));
  }

  /**
   * Single markup source for C + B.
   * Home jump lives in screen-head (`shell/screen-home-btn.js`), not the dock.
   * Timeline / alerts / imaging / labs live in feature-buttons hub (`shell/feature-hub.js`).
   * 護照 → passportGo (usually emergency).
   * @param {{ passportGo?: string, startHidden?: boolean }} [opts]
   */
  function glassDockMarkup(opts = {}) {
    const passportGo = String(opts.passportGo || "emergency");
    const hiddenAttr = opts.startHidden ? " hidden" : "";
    return `
<nav
  class="glass-dock glass-dock--solo"
  id="glass-dock"
  data-i18n-aria="glassDockAria"
  aria-label="主選單"${hiddenAttr}
>
  <span class="glass-dock-thumb" id="glass-dock-thumb" aria-hidden="true"></span>
  <div class="glass-dock-lens" id="glass-dock-lens" hidden aria-hidden="true">
    <span class="glass-dock-lens-face">
      <span class="glass-dock-lens-ico"></span>
      <span class="glass-dock-lens-label"></span>
    </span>
  </div>
  <button class="glass-dock-item" type="button" data-go="${passportGo}" data-dock="passport">
    <span class="glass-dock-ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
        <rect x="5" y="4" width="14" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
      </svg>
    </span>
    <span class="glass-dock-label" data-i18n="dockPassport">護照</span>
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

  /**
   * Press-hold transparent glass magnifier: hold, then slide a bubble across tabs.
   * Bubble tracks the finger (with light snap to the nearest tab). Quick tap skips lens.
   */
  function wireGlassDockClicks(doc, onGo, state = {}) {
    const dock = doc.getElementById("glass-dock");
    if (!dock || dock.dataset.navWired === "1") return;
    dock.dataset.navWired = "1";

    const HOLD_MS = 55;
    let press = null;
    let slideRaf = 0;

    function lensEl() {
      return doc.getElementById("glass-dock-lens");
    }

    function clearPressClasses() {
      dock.classList.remove("is-pressing");
      dock.querySelectorAll(".glass-dock-item.is-pressing").forEach((el) => {
        el.classList.remove("is-pressing");
      });
    }

    function hideLens() {
      const lens = lensEl();
      if (lens) {
        lens.classList.remove("is-visible", "is-sliding", "is-switching");
        lens.hidden = true;
        lens.style.left = "";
        lens.style.top = "";
      }
      clearPressClasses();
      if (slideRaf) {
        global.cancelAnimationFrame(slideRaf);
        slideRaf = 0;
      }
    }

    function fillLensContent(btn) {
      const lens = lensEl();
      if (!lens || !btn) return;
      const ico = btn.querySelector(".glass-dock-ico");
      const label = btn.querySelector(".glass-dock-label");
      const lensIco = lens.querySelector(".glass-dock-lens-ico");
      const lensLabel = lens.querySelector(".glass-dock-lens-label");
      if (lensIco) lensIco.innerHTML = ico ? ico.innerHTML : "";
      if (lensLabel) {
        lensLabel.textContent = label ? label.textContent : "";
      }
    }

    function nearestItem(clientX) {
      const items = Array.from(dock.querySelectorAll(".glass-dock-item"));
      if (!items.length) return null;
      let best = items[0];
      let bestDist = Infinity;
      for (const btn of items) {
        const r = btn.getBoundingClientRect();
        const mid = r.left + r.width / 2;
        const d = Math.abs(clientX - mid);
        if (d < bestDist) {
          bestDist = d;
          best = btn;
        }
      }
      return best;
    }

    function placeLensBubble(clientX, btn, opts = {}) {
      const lens = lensEl();
      if (!lens || !btn || !dock.contains(btn)) return;
      const { reveal = false, sliding = false } = opts;

      const dockRect = dock.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const btnCx = btnRect.left + btnRect.width / 2 - dockRect.left;
      const fingerX = clientX - dockRect.left;
      // Follow finger, gently pulled toward tab center (bubble magnet).
      const cx = fingerX * 0.72 + btnCx * 0.28;
      const minX = 28;
      const maxX = Math.max(minX, dockRect.width - 28);
      const clamped = Math.min(maxX, Math.max(minX, cx));
      const cy = btnRect.top + btnRect.height / 2 - dockRect.top - 14;

      clearPressClasses();
      dock.classList.add("is-pressing");
      btn.classList.add("is-pressing");

      const switched = press && press.contentBtn && press.contentBtn !== btn;
      if (!press?.contentBtn || switched) {
        fillLensContent(btn);
        if (press) press.contentBtn = btn;
        if (switched) {
          lens.classList.remove("is-switching");
          void lens.offsetWidth;
          lens.classList.add("is-switching");
        }
      }

      lens.style.left = `${clamped}px`;
      lens.style.top = `${cy}px`;
      lens.hidden = false;
      if (reveal) {
        void lens.offsetWidth;
        lens.classList.add("is-visible");
      }
      lens.classList.toggle("is-sliding", Boolean(sliding));
    }

    function itemFromPoint(clientX, clientY) {
      const stack =
        typeof doc.elementsFromPoint === "function"
          ? doc.elementsFromPoint(clientX, clientY)
          : [doc.elementFromPoint(clientX, clientY)];
      for (const el of stack) {
        if (!el || typeof el.closest !== "function") continue;
        const btn = el.closest(".glass-dock-item");
        if (btn && dock.contains(btn)) return btn;
      }
      return nearestItem(clientX);
    }

    function endPress(event, commit) {
      if (!press) return;
      const { pointerId, btn, timer, lensShown } = press;
      if (timer) global.clearTimeout(timer);
      try {
        if (dock.hasPointerCapture?.(pointerId)) {
          dock.releasePointerCapture(pointerId);
        }
      } catch {
        /* ignore */
      }
      const target =
        itemFromPoint(event.clientX, event.clientY) ||
        (lensShown ? btn : null);
      hideLens();
      press = null;
      if (commit && target) {
        const screen = target.getAttribute("data-go");
        if (screen && typeof onGo === "function") {
          state.suppressClickUntil = Date.now() + 450;
          onGo(screen, target);
        }
      }
    }

    dock.addEventListener("pointerdown", (event) => {
      if (event.button != null && event.button !== 0) return;
      const btn = event.target?.closest?.(".glass-dock-item");
      if (!btn || !dock.contains(btn)) return;
      event.preventDefault();
      if (press?.timer) global.clearTimeout(press.timer);
      press = {
        btn,
        contentBtn: null,
        pointerId: event.pointerId,
        lensShown: false,
        lastX: event.clientX,
        timer: global.setTimeout(() => {
          if (!press || press.btn !== btn) return;
          press.lensShown = true;
          press.contentBtn = null;
          placeLensBubble(press.lastX, btn, { reveal: true, sliding: false });
        }, HOLD_MS),
      };
      try {
        dock.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    });

    dock.addEventListener("pointermove", (event) => {
      if (!press || event.pointerId !== press.pointerId) return;
      press.lastX = event.clientX;
      const over =
        itemFromPoint(event.clientX, event.clientY) || press.btn;
      if (!over) return;
      press.btn = over;
      if (!press.lensShown) {
        // If finger already moved before hold fires, keep target current.
        return;
      }

      if (slideRaf) global.cancelAnimationFrame(slideRaf);
      slideRaf = global.requestAnimationFrame(() => {
        slideRaf = 0;
        if (!press?.lensShown) return;
        placeLensBubble(press.lastX, press.btn, {
          reveal: false,
          sliding: true,
        });
      });
    });

    dock.addEventListener("pointerup", (event) => {
      if (!press || event.pointerId !== press.pointerId) return;
      const held = press.lensShown;
      const btn = press.btn;
      endPress(event, held);
      if (!held && btn && typeof onGo === "function") {
        const screen = btn.getAttribute("data-go");
        if (screen) {
          state.suppressClickUntil = Date.now() + 450;
          onGo(screen, btn);
        }
      }
    });

    dock.addEventListener("pointercancel", (event) => {
      if (!press || event.pointerId !== press.pointerId) return;
      endPress(event, false);
    });

    dock.addEventListener("click", (event) => {
      const btn = event.target?.closest?.("[data-go]");
      if (!btn || !dock.contains(btn)) return;
      if (state.suppressClickUntil && Date.now() < state.suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const screen = btn.getAttribute("data-go");
      if (!screen) return;
      if (typeof onGo === "function") onGo(screen, btn);
    });
  }

  /**
   * Paint bottom glass dock: active tab, amplify-then-leap thumb, icon jump.
   * Motion: highlight pops bigger on the old tab, then leaps to the new one
   * (LINE-like), while the destination icon scales up.
   */
  function prefersReducedMotion(doc) {
    try {
      return Boolean(doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    } catch {
      return false;
    }
  }

  function cancelThumbAnim(state) {
    if (state?.thumbAnim && typeof state.thumbAnim.cancel === "function") {
      try {
        state.thumbAnim.cancel();
      } catch {
        /* ignore */
      }
    }
    state.thumbAnim = null;
  }

  function setThumbPose(thumb, left, width, scale) {
    thumb.style.width = `${width}px`;
    thumb.style.transform = `translateX(${left}px) scale(${scale})`;
  }

  function animateThumbLeap(thumb, from, to, state) {
    if (!thumb || typeof thumb.animate !== "function") {
      setThumbPose(thumb, to.left, to.width, 1);
      return;
    }
    cancelThumbAnim(state);
    thumb.classList.add("is-animating");

    const midLeft = from.left + (to.left - from.left) * 0.52;
    const midWidth = Math.max(from.width, to.width) * 1.08;

    const anim = thumb.animate(
      [
        {
          offset: 0,
          width: `${from.width}px`,
          transform: `translateX(${from.left}px) scale(1)`,
        },
        {
          /* Amplify highlight on the current tab first */
          offset: 0.22,
          width: `${from.width * 1.12}px`,
          transform: `translateX(${from.left - from.width * 0.06}px) scale(1.28)`,
        },
        {
          /* Leap / stretch toward the next tab */
          offset: 0.55,
          width: `${midWidth}px`,
          transform: `translateX(${midLeft}px) scale(1.18)`,
        },
        {
          offset: 0.82,
          width: `${to.width * 1.06}px`,
          transform: `translateX(${to.left - to.width * 0.03}px) scale(1.12)`,
        },
        {
          offset: 1,
          width: `${to.width}px`,
          transform: `translateX(${to.left}px) scale(1)`,
        },
      ],
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      }
    );
    state.thumbAnim = anim;

    const settle = () => {
      if (state.thumbAnim !== anim) return;
      setThumbPose(thumb, to.left, to.width, 1);
      thumb.classList.remove("is-animating");
      try {
        anim.cancel();
      } catch {
        /* ignore */
      }
      state.thumbAnim = null;
    };

    anim.addEventListener("finish", settle, { once: true });
    anim.addEventListener("cancel", () => {
      thumb.classList.remove("is-animating");
    }, { once: true });
  }

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
      cancelThumbAnim(state);
      return;
    }
    dock.hidden = false;
    doc.documentElement?.classList?.add("has-glass-dock");

    const dockKey = dockKeyForScreen(screen);
    let activeBtn = null;
    const prevBtn =
      state.lastDockKey != null
        ? dock.querySelector(`.glass-dock-item[data-dock="${state.lastDockKey}"]`)
        : dock.querySelector(".glass-dock-item.is-active");

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
      const reduce = prefersReducedMotion(doc);

      if (!state.thumbPrimed || reduce || !animateJump || !prevBtn || prevBtn === activeBtn) {
        cancelThumbAnim(state);
        thumb.classList.remove("is-animating");
        if (!state.thumbPrimed) {
          thumb.style.transition = "none";
          setThumbPose(thumb, left, width, 1);
          thumb.classList.add("is-ready");
          void thumb.offsetWidth;
          thumb.style.transition = "";
          state.thumbPrimed = true;
        } else {
          setThumbPose(thumb, left, width, 1);
          thumb.classList.add("is-ready");
        }
      } else {
        const from = {
          left: prevBtn.offsetLeft,
          width: prevBtn.offsetWidth,
        };
        const to = { left, width };
        thumb.classList.add("is-ready");
        animateThumbLeap(thumb, from, to, state);
      }
      state.lastDockKey = dockKey;
    } else if (thumb) {
      cancelThumbAnim(state);
      thumb.classList.remove("is-ready");
      state.lastDockKey = null;
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
    const state = {
      thumbPrimed: false,
      lastDockKey: null,
      thumbAnim: null,
      suppressClickUntil: 0,
    };

    ensureGlassDock(doc, { passportGo, startHidden });
    wireGlassDockClicks(doc, onGo, state);
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
