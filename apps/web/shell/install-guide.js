(function initPetLiveWebShellInstallGuide(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function createInstallGuide() {
    let deferredPrompt = null;

    function showChooser({ overlay, chooserEl } = {}) {
      if (!overlay) return false;
      if (chooserEl) chooserEl.hidden = false;
      overlay.hidden = false;
      return true;
    }

    function close({ overlay } = {}) {
      if (overlay) overlay.hidden = true;
    }

    async function triggerInstallPrompt() {
      if (!deferredPrompt) return false;
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        return choice?.outcome === "accepted";
      } catch {
        return false;
      } finally {
        deferredPrompt = null;
      }
    }

    async function triggerShareSheet({ title, text, url } = {}) {
      if (!global.navigator?.share) return false;
      try {
        await global.navigator.share({
          title: title || global.document?.title || "",
          text: text || "",
          url: url || global.location?.href || "",
        });
        return true;
      } catch (err) {
        if (err?.name === "AbortError") return null;
        return false;
      }
    }

    /**
     * Direct native action (no text steps):
     * - Android Chrome + beforeinstallprompt → system install / add-to-home dialog
     * - iOS Safari / Chrome → Web Share sheet (user picks「加入主畫面」)
     */
    async function runProviderAction(provider, hooks = {}) {
      const platform = root.shell.detectPlatform?.() || "other";
      const label = hooks.label;
      const onToast = hooks.onToast;
      const getSharePayload =
        typeof hooks.getSharePayload === "function"
          ? hooks.getSharePayload
          : () => ({});

      if (provider === "chrome" && platform === "android" && deferredPrompt) {
        const ok = await triggerInstallPrompt();
        if (ok) return "install";
        if (typeof onToast === "function" && typeof label === "function") {
          onToast(label("a2hsInstallDeclined"));
        }
        return "declined";
      }

      if (platform === "ios" || global.navigator?.share) {
        const payload = getSharePayload(provider) || {};
        const shared = await triggerShareSheet(payload);
        if (shared === true) {
          if (platform === "ios" && typeof onToast === "function" && typeof label === "function") {
            onToast(label("a2hsShareHintIos"));
          }
          return "share";
        }
        if (shared === null) return "cancel";
      }

      if (typeof onToast === "function" && typeof label === "function") {
        if (provider === "safari" && platform === "android") {
          onToast(label("a2hsSafariUseChromeAndroid"));
        } else if (provider === "chrome" && platform === "android") {
          onToast(label("a2hsChromeInstallUnavailable"));
        } else {
          onToast(label("a2hsInstallUnavailable"));
        }
      }
      return "fail";
    }

    function bind({
      overlay,
      chooserEl,
      openBtn,
      label,
      onToast,
      getSharePayload,
      onClose,
    } = {}) {
      if (!overlay) return false;

      const closeAll = () => {
        close({ overlay });
        if (typeof onClose === "function") onClose();
      };

      openBtn?.addEventListener("click", () => {
        showChooser({ overlay, chooserEl });
      });

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeAll();
      });

      overlay.querySelectorAll("[data-install-guide-close]").forEach((btn) => {
        btn.addEventListener("click", closeAll);
      });

      overlay.querySelectorAll("[data-install-guide-provider]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const provider = btn.getAttribute("data-install-guide-provider");
          if (!provider) return;
          closeAll();
          void runProviderAction(provider, {
            label,
            onToast,
            getSharePayload,
          });
        });
      });

      if (global.window && typeof global.window.addEventListener === "function") {
        global.window.addEventListener("beforeinstallprompt", (event) => {
          event.preventDefault();
          deferredPrompt = event;
        });
        global.window.addEventListener("appinstalled", () => {
          deferredPrompt = null;
        });
      }

      return true;
    }

    return {
      showChooser,
      close,
      bind,
      runProviderAction,
    };
  }

  root.shell.createInstallGuide = createInstallGuide;
})(typeof window !== "undefined" ? window : globalThis);
