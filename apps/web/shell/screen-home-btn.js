(function initPetLiveWebShellScreenHomeBtn(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Compact house control — icon + 主頁 label under it.
   * Place leftmost inside `.screen-head-actions` (e.g. left of copy-card).
   */
  function screenHomeBtnMarkup() {
    return `
<button
  class="screen-home-btn"
  type="button"
  data-go="home"
  data-screen-home-btn
  data-i18n-aria="dockHome"
  data-i18n-title="dockHome"
  aria-label="主頁"
  title="主頁"
>
  <span class="screen-home-btn-ico" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="14" height="14" focusable="false">
      <path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M4 11.5 12 4.5l8 7" />
      <path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M7 10.5V19h10v-8.5" />
    </svg>
  </span>
  <span class="screen-home-btn-label" data-i18n="dockHome">主頁</span>
</button>`;
  }

  function shouldSkipScreen(screenId) {
    const id = String(screenId || "");
    return !id || id === "home" || id === "intro";
  }

  /**
   * Ensure every non-home / non-intro screen-head has a home control
   * at the start of `.screen-head-actions` (creates the actions row if needed).
   * @param {Document} doc
   * @param {{ onGo?: (screen: string) => void }} [hooks]
   */
  function ensureScreenHomeBtns(doc, hooks = {}) {
    if (!doc || typeof doc.querySelectorAll !== "function") return;
    const { onGo } = hooks;

    doc.querySelectorAll("[data-screen] > .screen-head").forEach((head) => {
      const screen = head.parentElement?.getAttribute?.("data-screen") || "";
      if (shouldSkipScreen(screen)) {
        head.querySelectorAll("[data-screen-home-btn]").forEach((el) => el.remove());
        return;
      }

      let actions = head.querySelector(".screen-head-actions");
      if (!actions) {
        actions = doc.createElement("div");
        actions.className = "screen-head-actions";
        actions.setAttribute("data-glass-chrome", "");
        head.appendChild(actions);
      }

      let btn = actions.querySelector("[data-screen-home-btn]");
      if (!btn) {
        actions.insertAdjacentHTML("afterbegin", screenHomeBtnMarkup());
        btn = actions.querySelector("[data-screen-home-btn]");
      } else {
        if (!btn.querySelector(".screen-home-btn-label")) {
          const wired = btn.getAttribute("data-nav-wired");
          btn.outerHTML = screenHomeBtnMarkup();
          btn = actions.querySelector("[data-screen-home-btn]");
          if (wired) btn.setAttribute("data-nav-wired", wired);
        }
        if (actions.firstElementChild !== btn) {
          actions.insertBefore(btn, actions.firstElementChild);
        }
      }

      if (btn && typeof onGo === "function" && btn.getAttribute("data-nav-wired") !== "1") {
        btn.setAttribute("data-nav-wired", "1");
        btn.addEventListener("click", (event) => {
          event.preventDefault();
          onGo("home");
        });
      }
    });
  }

  root.shell.screenHomeBtnMarkup = screenHomeBtnMarkup;
  root.shell.ensureScreenHomeBtns = ensureScreenHomeBtns;
})(typeof window !== "undefined" ? window : globalThis);
