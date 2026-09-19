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
    syncPets: "syncPets",
    setActivePet: "setActivePet",
    flushObservations: "flushObservations",
  };

  function resolveTargetOrigin(win) {
    try {
      const origin = win && win.location && win.location.origin;
      if (origin && origin !== "null") return origin;
    } catch (_err) {
      /* cross-origin: fall through */
    }
    try {
      if (
        typeof location !== "undefined" &&
        location.origin &&
        location.origin !== "null"
      ) {
        return location.origin;
      }
    } catch (_err2) {
      /* ignore */
    }
    return "*";
  }

  function normalizeVisitEntry(raw) {
    if (!raw || typeof raw !== "object") return null;
    const date = raw.date != null ? String(raw.date).slice(0, 10) : "";
    const clinic = String(raw.clinicName || raw.clinic || "").trim().slice(0, 80);
    const entry = {
      date: date,
      clinic: clinic || "就診",
    };
    if (raw.id != null && String(raw.id).trim()) {
      entry.id = String(raw.id).trim().slice(0, 64);
    }
    if (raw.clinicId != null && String(raw.clinicId).trim()) {
      entry.clinicId = String(raw.clinicId).trim().slice(0, 64);
    }
    return entry;
  }

  function normalizePetEntry(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (raw.id == null || raw.id === "") return null;
    const entry = {
      id: String(raw.id),
      name: raw.name != null ? String(raw.name) : String(raw.id),
    };
    if (raw.observations != null && typeof raw.observations === "object") {
      entry.observations = raw.observations;
    }
    if (Array.isArray(raw.visits)) {
      entry.visits = raw.visits.map(normalizeVisitEntry).filter(Boolean);
    }
    return entry;
  }

  /**
   * Normalize syncPets payload. Never invents tryout pet-a / pet-b.
   */
  function normalizeSyncPetsPayload(payload) {
    const body = payload && typeof payload === "object" ? payload : {};
    const list = [];
    const seen = {};
    const rawPets = Array.isArray(body.pets) ? body.pets : [];
    rawPets.forEach(function (raw) {
      const entry = normalizePetEntry(raw);
      if (!entry || seen[entry.id]) return;
      seen[entry.id] = true;
      list.push(entry);
    });
    let activePetId = body.activePetId != null ? String(body.activePetId) : "";
    if (activePetId && !seen[activePetId]) {
      activePetId = list[0] ? list[0].id : "";
    } else if (!activePetId && list[0]) {
      activePetId = list[0].id;
    }
    return { pets: list, activePetId: activePetId };
  }

  function buildMessage(action, payload) {
    const body = payload && typeof payload === "object" ? payload : {};
    const msg = {
      type: MESSAGE_TYPE,
      action: String(action || ""),
      visitId: body.visitId != null ? String(body.visitId) : "",
      visitIndex: Number.isInteger(body.visitIndex) ? body.visitIndex : null,
      title: body.title != null ? String(body.title) : "",
    };

    if (body.petId != null && body.petId !== "") {
      msg.petId = String(body.petId);
    }

    const actionKey = String(action || "");
    if (actionKey === ACTIONS.syncPets) {
      const normalized = normalizeSyncPetsPayload(body);
      msg.pets = normalized.pets;
      msg.activePetId = normalized.activePetId;
    } else if (actionKey === ACTIONS.setActivePet) {
      if (body.petId != null) msg.petId = String(body.petId);
    } else if (actionKey === ACTIONS.flushObservations) {
      if (body.petId != null) msg.petId = String(body.petId);
      if (body.observations != null && typeof body.observations === "object") {
        msg.observations = body.observations;
      }
    }

    return msg;
  }

  function parseMessage(data) {
    if (!data || data.type !== MESSAGE_TYPE) return null;
    if (!data.action) return null;
    const action = String(data.action);
    const parsed = {
      type: MESSAGE_TYPE,
      action: action,
      visitId: data.visitId != null ? String(data.visitId) : "",
      visitIndex: Number.isInteger(data.visitIndex) ? data.visitIndex : null,
      title: data.title != null ? String(data.title) : "",
    };

    if (data.petId != null && data.petId !== "") {
      parsed.petId = String(data.petId);
    }

    if (action === ACTIONS.syncPets) {
      const normalized = normalizeSyncPetsPayload(data);
      parsed.pets = normalized.pets;
      parsed.activePetId = normalized.activePetId;
    } else if (action === ACTIONS.flushObservations) {
      if (data.observations != null && typeof data.observations === "object") {
        parsed.observations = data.observations;
      } else {
        parsed.observations = null;
      }
    }

    return parsed;
  }

  function postToParent(win, action, payload) {
    const target = win || (typeof window !== "undefined" ? window : null);
    if (!target || !target.parent || target.parent === target) return false;
    try {
      target.parent.postMessage(
        buildMessage(action, payload),
        resolveTargetOrigin(target)
      );
      return true;
    } catch (_err) {
      return false;
    }
  }

  function postToFrame(frameWin, action, payload) {
    if (!frameWin || typeof frameWin.postMessage !== "function") return false;
    try {
      frameWin.postMessage(
        buildMessage(action, payload),
        resolveTargetOrigin(frameWin)
      );
      return true;
    } catch (_err) {
      return false;
    }
  }

  root.domains.observations.BRIDGE_TYPE = MESSAGE_TYPE;
  root.domains.observations.BRIDGE_ACTIONS = ACTIONS;
  root.domains.observations.buildBridgeMessage = buildMessage;
  root.domains.observations.parseBridgeMessage = parseMessage;
  root.domains.observations.normalizeSyncPetsPayload = normalizeSyncPetsPayload;
  root.domains.observations.resolveBridgeTargetOrigin = resolveTargetOrigin;
  root.domains.observations.postBridgeToParent = postToParent;
  root.domains.observations.postBridgeToFrame = postToFrame;
})(typeof window !== "undefined" ? window : globalThis);
