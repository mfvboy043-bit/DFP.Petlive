(function initPetLiveWebObservationsBridge(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  const MESSAGE_TYPE = "petlive-obs-bridge";
  const ACTIONS = {
    openVisit: "openVisit",
    openChart: "openChart",
    focusVisit: "focusVisit",
  };

  function buildMessage(action, payload) {
    const body = payload && typeof payload === "object" ? payload : {};
    return {
      type: MESSAGE_TYPE,
      action: String(action || ""),
      visitId: body.visitId != null ? String(body.visitId) : "",
      visitIndex: Number.isInteger(body.visitIndex) ? body.visitIndex : null,
      title: body.title != null ? String(body.title) : "",
    };
  }

  function parseMessage(data) {
    if (!data || data.type !== MESSAGE_TYPE) return null;
    if (!data.action) return null;
    return {
      type: MESSAGE_TYPE,
      action: String(data.action),
      visitId: data.visitId != null ? String(data.visitId) : "",
      visitIndex: Number.isInteger(data.visitIndex) ? data.visitIndex : null,
      title: data.title != null ? String(data.title) : "",
    };
  }

  function postToParent(win, action, payload) {
    const target = win || (typeof window !== "undefined" ? window : null);
    if (!target || !target.parent || target.parent === target) return false;
    try {
      target.parent.postMessage(buildMessage(action, payload), "*");
      return true;
    } catch (_err) {
      return false;
    }
  }

  function postToFrame(frameWin, action, payload) {
    if (!frameWin || typeof frameWin.postMessage !== "function") return false;
    try {
      frameWin.postMessage(buildMessage(action, payload), "*");
      return true;
    } catch (_err) {
      return false;
    }
  }

  root.domains.observations.BRIDGE_TYPE = MESSAGE_TYPE;
  root.domains.observations.BRIDGE_ACTIONS = ACTIONS;
  root.domains.observations.buildBridgeMessage = buildMessage;
  root.domains.observations.parseBridgeMessage = parseMessage;
  root.domains.observations.postBridgeToParent = postToParent;
  root.domains.observations.postBridgeToFrame = postToFrame;
})(typeof window !== "undefined" ? window : globalThis);
