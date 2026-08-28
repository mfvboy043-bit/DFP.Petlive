(function initPetLiveWebShellIntroStories(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  const MOBILE_MQ = "(max-width: 759px)";

  function paintIntroStoryAria(doc, t) {
    if (!doc) return;
    doc.querySelectorAll(".intro-story-disclosure").forEach((details) => {
      const summary = details.querySelector("summary");
      if (!summary) return;
      const titleEl = summary.querySelector(".intro-story-title");
      const title = titleEl?.textContent?.trim() || "";
      const key = details.open ? "introStoryCollapse" : "introStoryExpand";
      const hint = typeof t === "function" ? t(key) : "";
      summary.setAttribute("aria-label", title && hint ? `${title} — ${hint}` : hint || title);
    });
  }

  function syncIntroStoryDisclosures(doc, win, hooks = {}) {
    if (!doc || !win?.matchMedia) return;
    const mobile = win.matchMedia(MOBILE_MQ).matches;
    doc.querySelectorAll(".intro-story-disclosure").forEach((details) => {
      if (details.dataset.userToggled === "1") return;
      details.open = !mobile;
    });
    paintIntroStoryAria(doc, hooks.t);
  }

  function initIntroStories(doc, win, hooks = {}) {
    if (!doc) return;

    doc.querySelectorAll(".intro-story-disclosure").forEach((details) => {
      if (details.dataset.introStoryBound === "1") return;
      details.dataset.introStoryBound = "1";
      details.addEventListener("toggle", () => {
        details.dataset.userToggled = "1";
        paintIntroStoryAria(doc, hooks.t);
      });
    });

    syncIntroStoryDisclosures(doc, win, hooks);

    if (!win || win.__introStoriesMqBound) return;
    win.__introStoriesMqBound = true;
    const mq = win.matchMedia(MOBILE_MQ);
    const resync = () => syncIntroStoryDisclosures(doc, win, hooks);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", resync);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(resync);
    }
  }

  root.shell.initIntroStories = initIntroStories;
  root.shell.syncIntroStoryDisclosures = syncIntroStoryDisclosures;
  root.shell.paintIntroStoryAria = paintIntroStoryAria;
})(typeof window !== "undefined" ? window : globalThis);
