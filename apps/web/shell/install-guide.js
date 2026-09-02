(function initPetLiveWebShellInstallGuide(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function createInstallGuide() {
    let deferredPrompt = null;

    function setDeferredPrompt(event) {
      event.preventDefault();
      deferredPrompt = event;
    }

    function clearDeferredPrompt() {
      deferredPrompt = null;
    }

    async function triggerInstall() {
      if (!deferredPrompt) return false;
      try {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } catch {
        /* ignore */
      } finally {
        deferredPrompt = null;
      }
      return true;
    }

    function stepKeysForPlatform(platform) {
      if (platform === "android") {
        return [
          "a2hsGuideStepAndroid1",
          "a2hsGuideStepAndroid2",
          "a2hsGuideStepAndroid3",
        ];
      }
      if (platform === "ios") {
        return ["a2hsGuideStepIos1", "a2hsGuideStepIos2", "a2hsGuideStepIos3"];
      }
      return [
        "a2hsGuideStepGeneric1",
        "a2hsGuideStepGeneric2",
        "a2hsGuideStepGeneric3",
      ];
    }

    function renderSteps(stepsEl, platform, label) {
      if (!stepsEl || typeof label !== "function") return;
      stepsEl.replaceChildren();
      stepKeysForPlatform(platform).forEach((key, index) => {
        const li = document.createElement("li");
        li.className = "install-guide-step";
        const num = document.createElement("span");
        num.className = "install-guide-step-num";
        num.textContent = String(index + 1);
        num.setAttribute("aria-hidden", "true");
        const text = document.createElement("span");
        text.className = "install-guide-step-text";
        text.textContent = label(key);
        li.append(num, text);
        stepsEl.appendChild(li);
      });
    }

    function show({ overlay, stepsEl, installBtn, platform, label } = {}) {
      if (!overlay) return false;
      renderSteps(stepsEl, platform, label);
      if (installBtn) {
        installBtn.hidden = platform !== "android" || !deferredPrompt;
      }
      overlay.hidden = false;
      return true;
    }

    function close({ overlay } = {}) {
      if (overlay) overlay.hidden = true;
    }

    function bind({
      overlay,
      stepsEl,
      installBtn,
      onClose,
      getPlatform,
      label,
    } = {}) {
      if (!overlay) return false;

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          close({ overlay });
          if (typeof onClose === "function") onClose();
        }
      });

      overlay.querySelectorAll("[data-install-guide-close]").forEach((btn) => {
        btn.addEventListener("click", () => {
          close({ overlay });
          if (typeof onClose === "function") onClose();
        });
      });

      if (installBtn) {
        installBtn.addEventListener("click", () => {
          void triggerInstall().then(() => {
            close({ overlay });
            if (typeof onClose === "function") onClose();
          });
        });
      }

      const openBtn = global.document?.getElementById?.("intro-add-home-btn");
      openBtn?.addEventListener("click", () => {
        const platform =
          typeof getPlatform === "function"
            ? getPlatform()
            : root.shell.detectPlatform?.() || "other";
        show({ overlay, stepsEl, installBtn, platform, label });
      });

      if (global.window && typeof global.window.addEventListener === "function") {
        global.window.addEventListener("beforeinstallprompt", (event) => {
          setDeferredPrompt(event);
        });
        global.window.addEventListener("appinstalled", () => {
          clearDeferredPrompt();
        });
      }

      return true;
    }

    return {
      show,
      close,
      bind,
      setDeferredPrompt,
      clearDeferredPrompt,
      triggerInstall,
      stepKeysForPlatform,
    };
  }

  root.shell.createInstallGuide = createInstallGuide;
})(typeof window !== "undefined" ? window : globalThis);
