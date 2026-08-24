(function initPetLiveWebNavigation(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function createNavigation({ app, beforeLeave, onEnter }) {
    if (!app || typeof app.querySelector !== "function") {
      throw new TypeError("createNavigation requires an app shell");
    }

    const history = [];

    function getActiveScreen() {
      return app.querySelector(".screen.is-active")?.dataset.screen || null;
    }

    function go(screen, options = {}) {
      const { replace = false } = options;
      const next = app.querySelector(`[data-screen="${screen}"]`);
      if (!next) return false;

      const current = app.querySelector(".screen.is-active");
      const currentScreen = current?.dataset.screen || null;
      if (currentScreen === screen) return false;

      if (typeof beforeLeave === "function") {
        beforeLeave(currentScreen, screen, options);
      }
      if (currentScreen && !replace) history.push(currentScreen);

      // Flush dirty dynamic content before the destination is exposed.
      if (typeof onEnter === "function") onEnter(screen, currentScreen, options);

      app.querySelectorAll(".screen").forEach((element) => {
        element.classList.remove("is-active");
        element.hidden = true;
      });
      next.hidden = false;
      next.classList.add("is-active");
      return true;
    }

    function back() {
      return go(history.pop() || "home", { replace: true, back: true });
    }

    function clearHistory() {
      history.length = 0;
    }

    return { go, back, getActiveScreen, clearHistory };
  }

  root.shell.createNavigation = createNavigation;
})(typeof window !== "undefined" ? window : globalThis);
