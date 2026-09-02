(function initPetLiveWebShellInstallGuide(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function createInstallGuide() {
    function getDeferredPrompt() {
      return root.shell.getDeferredInstallPrompt?.() || null;
    }

    function takeDeferredPrompt() {
      if (typeof root.shell.takeDeferredInstallPrompt === "function") {
        return root.shell.takeDeferredInstallPrompt();
      }
      const snap = getDeferredPrompt();
      return snap;
    }

    function showChooser({ overlay, chooserEl } = {}) {
      if (!overlay) return false;
      if (chooserEl) chooserEl.hidden = false;
      overlay.hidden = false;
      paintChromeInstallReady(chooserEl);
      return true;
    }

    function paintChromeInstallReady(chooserEl) {
      if (!chooserEl) return;
      const chromeBtn = chooserEl.querySelector(
        '[data-install-guide-provider="chrome"]'
      );
      if (!chromeBtn) return;
      const platform = root.shell.detectPlatform?.() || "other";
      const ready = platform === "android" && Boolean(getDeferredPrompt());
      chromeBtn.disabled = false;
      chromeBtn.classList.toggle("is-install-ready", ready);
    }

    function close({ overlay } = {}) {
      if (overlay) overlay.hidden = true;
    }

    async function triggerInstallPrompt(event) {
      if (!event?.prompt) return false;
      try {
        await event.prompt();
        const choice = await event.userChoice;
        return choice?.outcome === "accepted";
      } catch {
        return false;
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

    async function waitForInstallPrompt(ms) {
      const deadline = Date.now() + ms;
      while (Date.now() < deadline) {
        const prompt = getDeferredPrompt();
        if (prompt) return prompt;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return getDeferredPrompt();
    }

    async function runProviderAction(provider, hooks = {}) {
      const platform = root.shell.detectPlatform?.() || "other";
      const label = hooks.label;
      const onToast = hooks.onToast;
      const getSharePayload =
        typeof hooks.getSharePayload === "function"
          ? hooks.getSharePayload
          : () => ({});

      if (provider === "chrome" && platform === "android") {
        await root.shell.registerServiceWorker?.();
        let promptEvent = getDeferredPrompt() || (await waitForInstallPrompt(1200));
        if (promptEvent) {
          if (typeof root.shell.takeDeferredInstallPrompt === "function") {
            promptEvent = root.shell.takeDeferredInstallPrompt() || promptEvent;
          }
          const ok = await triggerInstallPrompt(promptEvent);
          if (ok) return "install";
          if (typeof onToast === "function" && typeof label === "function") {
            onToast(label("a2hsInstallDeclined"));
          }
          return "declined";
        }
        if (global.navigator?.share) {
          const payload = getSharePayload(provider) || {};
          const shared = await triggerShareSheet(payload);
          if (shared === true) {
            if (typeof onToast === "function" && typeof label === "function") {
              onToast(label("a2hsShareHintAndroid"));
            }
            return "share";
          }
          if (shared === null) return "cancel";
        }
        if (typeof onToast === "function" && typeof label === "function") {
          onToast(label("a2hsChromeInstallUnavailable"));
        }
        return "fail";
      }

      if (provider === "safari" && platform === "android") {
        if (typeof onToast === "function" && typeof label === "function") {
          onToast(label("a2hsSafariUseChromeAndroid"));
        }
        return "fail";
      }

      if (platform === "ios" && global.navigator?.share) {
        const payload = getSharePayload(provider) || {};
        const shared = await triggerShareSheet(payload);
        if (shared === true) {
          if (typeof onToast === "function" && typeof label === "function") {
            onToast(label("a2hsShareHintIos"));
          }
          return "share";
        }
        if (shared === null) return "cancel";
      }

      if (typeof onToast === "function" && typeof label === "function") {
        onToast(label("a2hsInstallUnavailable"));
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
        void root.shell.registerServiceWorker?.().then(() => {
          showChooser({ overlay, chooserEl });
        });
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
        global.window.addEventListener("beforeinstallprompt", () => {
          paintChromeInstallReady(chooserEl);
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
