(function initPetLiveWebShellInstallGuide(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function createInstallGuide() {
    let deferredPrompt = null;

    function stepKeysForProvider(provider) {
      if (provider === "safari") {
        return ["a2hsGuideStepIos1", "a2hsGuideStepIos2", "a2hsGuideStepIos3"];
      }
      return [
        "a2hsGuideStepChrome1",
        "a2hsGuideStepChrome2",
        "a2hsGuideStepChrome3",
      ];
    }

    function renderSteps(stepsEl, provider, label) {
      if (!stepsEl || typeof label !== "function") return;
      stepsEl.replaceChildren();
      stepKeysForProvider(provider).forEach((key, index) => {
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

    function showChooser({
      overlay,
      chooserEl,
      stepsPanelEl,
      installBtn,
    } = {}) {
      if (!overlay) return false;
      if (chooserEl) chooserEl.hidden = false;
      if (stepsPanelEl) stepsPanelEl.hidden = true;
      if (installBtn) installBtn.hidden = true;
      overlay.hidden = false;
      return true;
    }

    function showSteps({
      overlay,
      chooserEl,
      stepsPanelEl,
      stepsEl,
      stepsTitleEl,
      installBtn,
      provider,
      label,
    } = {}) {
      if (!overlay || !provider) return false;
      renderSteps(stepsEl, provider, label);
      if (stepsTitleEl && typeof label === "function") {
        stepsTitleEl.textContent = label(
          provider === "safari" ? "a2hsGuideSafari" : "a2hsGuideChrome"
        );
      }
      if (chooserEl) chooserEl.hidden = true;
      if (stepsPanelEl) stepsPanelEl.hidden = false;
      if (installBtn) {
        installBtn.hidden =
          provider !== "chrome" ||
          !deferredPrompt ||
          root.shell.detectPlatform?.() !== "android";
      }
      overlay.hidden = false;
      return true;
    }

    function close({ overlay, chooserEl, stepsPanelEl, installBtn } = {}) {
      if (overlay) overlay.hidden = true;
      if (chooserEl) chooserEl.hidden = false;
      if (stepsPanelEl) stepsPanelEl.hidden = true;
      if (installBtn) installBtn.hidden = true;
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

    function bind({
      overlay,
      chooserEl,
      stepsPanelEl,
      stepsEl,
      stepsTitleEl,
      installBtn,
      openBtn,
      label,
      onClose,
    } = {}) {
      if (!overlay) return false;

      const closeAll = () => {
        close({ overlay, chooserEl, stepsPanelEl, installBtn });
        if (typeof onClose === "function") onClose();
      };

      openBtn?.addEventListener("click", () => {
        showChooser({ overlay, chooserEl, stepsPanelEl, installBtn });
      });

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeAll();
      });

      overlay.querySelectorAll("[data-install-guide-close]").forEach((btn) => {
        btn.addEventListener("click", closeAll);
      });

      overlay.querySelectorAll("[data-install-guide-back]").forEach((btn) => {
        btn.addEventListener("click", () => {
          showChooser({ overlay, chooserEl, stepsPanelEl, installBtn });
        });
      });

      overlay.querySelectorAll("[data-install-guide-provider]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const provider = btn.getAttribute("data-install-guide-provider");
          if (!provider) return;
          showSteps({
            overlay,
            chooserEl,
            stepsPanelEl,
            stepsEl,
            stepsTitleEl,
            installBtn,
            provider,
            label,
          });
        });
      });

      installBtn?.addEventListener("click", () => {
        void triggerInstall().then(closeAll);
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
      showSteps,
      close,
      bind,
      stepKeysForProvider,
    };
  }

  root.shell.createInstallGuide = createInstallGuide;
})(typeof window !== "undefined" ? window : globalThis);
