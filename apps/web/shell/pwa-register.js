(function initPetLiveWebPwaRegister(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  let deferredInstallPrompt = null;

  if (global.window && typeof global.window.addEventListener === "function") {
    global.window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
    });
    global.window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
    });
  }

  function getDeferredInstallPrompt() {
    return deferredInstallPrompt;
  }

  function takeDeferredInstallPrompt() {
    const snap = deferredInstallPrompt;
    deferredInstallPrompt = null;
    return snap;
  }

  async function registerServiceWorker() {
    if (!global.navigator?.serviceWorker) return false;
    try {
      await global.navigator.serviceWorker.register("./sw.js?v=20260902-a2hs-v4", {
        scope: "./",
      });
      return true;
    } catch {
      return false;
    }
  }

  root.shell.getDeferredInstallPrompt = getDeferredInstallPrompt;
  root.shell.takeDeferredInstallPrompt = takeDeferredInstallPrompt;
  root.shell.registerServiceWorker = registerServiceWorker;

  void registerServiceWorker();
})(typeof window !== "undefined" ? window : globalThis);
