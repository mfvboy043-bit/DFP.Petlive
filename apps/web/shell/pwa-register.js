(function initPetLiveWebPwaRegister(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  const earlyRoot = global.__petlivePwa || {};
  let deferredInstallPrompt = earlyRoot.deferredInstallPrompt || null;

  function syncEarlyPrompt(value) {
    deferredInstallPrompt = value;
    if (global.__petlivePwa) {
      global.__petlivePwa.deferredInstallPrompt = value;
    }
  }

  if (global.window && typeof global.window.addEventListener === "function") {
    global.window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      syncEarlyPrompt(event);
    });
    global.window.addEventListener("appinstalled", () => {
      syncEarlyPrompt(null);
    });
  }

  function getDeferredInstallPrompt() {
    return deferredInstallPrompt || global.__petlivePwa?.deferredInstallPrompt || null;
  }

  function takeDeferredInstallPrompt() {
    const snap = getDeferredInstallPrompt();
    syncEarlyPrompt(null);
    return snap;
  }

  async function registerServiceWorker() {
    if (!global.navigator?.serviceWorker) return false;
    try {
      await global.navigator.serviceWorker.register("./sw.js?v=20260902-a2hs-v5", {
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
