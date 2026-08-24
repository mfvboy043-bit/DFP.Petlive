(function initPetLiveWebRenderCoordinator(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function createRenderCoordinator({ safeRender, getCurrentPet, getActiveScreen }) {
    if (
      typeof safeRender !== "function" ||
      typeof getCurrentPet !== "function" ||
      typeof getActiveScreen !== "function"
    ) {
      throw new TypeError("createRenderCoordinator requires render and selector functions");
    }

    const groups = new Map();
    const dirty = new Set();
    const sectionRuns = Object.create(null);
    const flushRuns = Object.create(null);
    const flushDurations = Object.create(null);
    let selectionRefreshes = 0;
    let languageRefreshes = 0;

    function register(screen, sectionName, render, onError) {
      if (!groups.has(screen)) groups.set(screen, []);
      groups.get(screen).push({ sectionName, render, onError });
      dirty.add(screen);
      return () => {
        const sections = groups.get(screen) || [];
        groups.set(
          screen,
          sections.filter((section) => section.render !== render)
        );
      };
    }

    function markDirty(screen) {
      if (screen) dirty.add(screen);
      else groups.forEach((_sections, name) => dirty.add(name));
    }

    function markAllDirty() {
      markDirty();
    }

    function flush(screen, options = {}) {
      if (!groups.has(screen)) return false;
      if (!options.force && !dirty.has(screen)) return false;

      const pet = getCurrentPet();
      const startedAt =
        typeof global.performance?.now === "function"
          ? global.performance.now()
          : null;
      flushRuns[screen] = (flushRuns[screen] || 0) + 1;
      groups.get(screen).forEach(({ sectionName, render, onError }) => {
        sectionRuns[sectionName] = (sectionRuns[sectionName] || 0) + 1;
        safeRender(sectionName, () => render(pet), onError);
      });
      if (startedAt != null) {
        if (!flushDurations[screen]) flushDurations[screen] = [];
        flushDurations[screen].push(global.performance.now() - startedAt);
      }
      dirty.delete(screen);
      return true;
    }

    function refreshSelection() {
      selectionRefreshes += 1;
      const active = getActiveScreen() || "home";

      groups.forEach((_sections, screen) => {
        if (screen !== "home" && screen !== active) dirty.add(screen);
      });
      dirty.add("home");
      flush("home");

      if (active !== "home") {
        dirty.add(active);
        flush(active);
      }
    }

    /**
     * Language change: refresh home chrome (+ active non-home group) and leave
     * every other registered group dirty for the next go()/flush.
     */
    function refreshLanguage() {
      languageRefreshes += 1;
      markAllDirty();
      flush("home");
      const active = getActiveScreen() || "home";
      if (active !== "home") flush(active);
    }

    function getMetrics() {
      return {
        selectionRefreshes,
        languageRefreshes,
        sectionRuns: { ...sectionRuns },
        flushRuns: { ...flushRuns },
        flushDurations: Object.fromEntries(
          Object.entries(flushDurations).map(([screen, samples]) => [
            screen,
            [...samples],
          ])
        ),
        dirtyScreens: [...dirty],
      };
    }

    return {
      register,
      refreshSelection,
      refreshLanguage,
      markDirty,
      markAllDirty,
      flush,
      getMetrics,
    };
  }

  root.shell.createRenderCoordinator = createRenderCoordinator;
})(typeof window !== "undefined" ? window : globalThis);
