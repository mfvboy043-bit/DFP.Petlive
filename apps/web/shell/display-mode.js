(function initPetLiveWebShellDisplayMode(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function isStandalone() {
    try {
      if (global.matchMedia?.("(display-mode: standalone)")?.matches) return true;
      if (global.navigator?.standalone === true) return true;
    } catch {
      /* ignore */
    }
    return false;
  }

  function isBrowserTab() {
    return !isStandalone();
  }

  /** @returns {"ios"|"android"|"other"} */
  function detectPlatform() {
    const ua = String(global.navigator?.userAgent || "");
    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    if (/Android/i.test(ua)) return "android";
    return "other";
  }

  function isLikelyMobile() {
    const ua = String(global.navigator?.userAgent || "");
    if (/iPad|iPhone|iPod|Android/i.test(ua)) return true;
    try {
      if (
        global.matchMedia?.("(pointer: coarse)")?.matches &&
        global.innerWidth < 900
      ) {
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  root.shell.isStandalone = isStandalone;
  root.shell.isBrowserTab = isBrowserTab;
  root.shell.detectPlatform = detectPlatform;
  root.shell.isLikelyMobile = isLikelyMobile;
})(typeof window !== "undefined" ? window : globalThis);
