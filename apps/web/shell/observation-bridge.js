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

    function onMessage(event) {
      const msg = obs.parseBridgeMessage(event && event.data);
      if (!msg) return;
      if (msg.action === obs.BRIDGE_ACTIONS.openVisit) {
        input.onOpenVisit(msg);
        return;
      }
      if (msg.action === obs.BRIDGE_ACTIONS.openChart) {
        input.onOpenChart(msg);
      }
    }

    win.addEventListener("message", onMessage);

    function focusChartVisit(frameEl, payload) {
      const frameWin = frameEl && frameEl.contentWindow;
      if (!frameWin) return false;
      return obs.postBridgeToFrame(frameWin, obs.BRIDGE_ACTIONS.focusVisit, payload || {});
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
    };
  }

  root.shell.initObservationBridge = initObservationBridge;
})(typeof window !== "undefined" ? window : globalThis);
