(function initPetLiveWebShellObservationBridge(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Parent-frame bridge: timeline ↔ observation chart tryout iframe.
   * Domain protocol lives in domains/observations/bridge.js.
   */
  function initObservationBridge(doc, deps) {
    const input = deps || {};
    const win = input.win || global;
    const obs = root.domains && root.domains.observations;
    if (!obs || typeof obs.parseBridgeMessage !== "function") {
      throw new TypeError("initObservationBridge requires domains.observations.bridge");
    }
    if (typeof input.onOpenVisit !== "function") {
      throw new TypeError("initObservationBridge requires onOpenVisit(msg)");
    }
    if (typeof input.onOpenChart !== "function") {
      throw new TypeError("initObservationBridge requires onOpenChart(msg)");
    }

    function resolveFrame(frameEl) {
      if (frameEl) return frameEl;
      if (typeof input.getFrame === "function") {
        const fromHook = input.getFrame();
        if (fromHook) return fromHook;
      }
      const id = input.frameId || "obs-tryout-frame";
      return doc && typeof doc.getElementById === "function"
        ? doc.getElementById(id)
        : null;
    }

    function isDemoBlocked() {
      if (typeof input.isDemoMode === "function") return !!input.isDemoMode();
      return !!input.isDemoMode;
    }

    function syncPetsToFrame(frameEl) {
      if (typeof input.getPets !== "function") return false;
      const frame = resolveFrame(frameEl);
      const frameWin = frame && frame.contentWindow;
      if (!frameWin) return false;
      const pets = input.getPets() || [];
      const activePetId =
        typeof input.getActivePetId === "function" ? input.getActivePetId() : "";
      return obs.postBridgeToFrame(frameWin, obs.BRIDGE_ACTIONS.syncPets, {
        pets: pets,
        activePetId: activePetId || "",
      });
    }

    function onMessage(event) {
      const msg = obs.parseBridgeMessage(event && event.data);
      if (!msg) return;

      if (msg.action === obs.BRIDGE_ACTIONS.openVisit) {
        input.onOpenVisit(msg);
        return;
      }
      if (msg.action === obs.BRIDGE_ACTIONS.openChart) {
        input.onOpenChart(msg);
        return;
      }
      if (msg.action === obs.BRIDGE_ACTIONS.setActivePet) {
        if (typeof input.setActivePet === "function" && msg.petId) {
          input.setActivePet(msg.petId);
        }
        syncPetsToFrame();
        return;
      }
      if (msg.action === obs.BRIDGE_ACTIONS.flushObservations) {
        if (isDemoBlocked()) return;
        if (typeof input.saveObservations !== "function") return;
        if (!msg.petId || !msg.observations) return;
        input.saveObservations(msg.petId, msg.observations);
      }
    }

    win.addEventListener("message", onMessage);

    function focusChartVisit(frameEl, payload) {
      const frame = resolveFrame(frameEl);
      const frameWin = frame && frame.contentWindow;
      if (!frameWin) return false;
      return obs.postBridgeToFrame(
        frameWin,
        obs.BRIDGE_ACTIONS.focusVisit,
        payload || {}
      );
    }

    function requestOpenChart(payload) {
      input.onOpenChart(payload || {});
    }

    return {
      destroy: function () {
        win.removeEventListener("message", onMessage);
      },
      focusChartVisit: focusChartVisit,
      requestOpenChart: requestOpenChart,
      syncPetsToFrame: syncPetsToFrame,
    };
  }

  root.shell.initObservationBridge = initObservationBridge;
})(typeof window !== "undefined" ? window : globalThis);
