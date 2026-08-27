(function initPetLiveWebShellCalendarChooser(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function createCalendarChooser() {
    let pendingPayload = null;

    function getPending() {
      return pendingPayload;
    }

    function canShow(payload) {
      return Boolean(payload?.nextDue);
    }

    function show({ overlay, metaEl, payload, metaText } = {}) {
      if (!overlay || !canShow(payload)) return false;
      pendingPayload = payload;
      if (metaEl) metaEl.textContent = metaText || "";
      overlay.hidden = false;
      return true;
    }

    function close({ overlay } = {}) {
      if (overlay) {
        overlay.hidden = true;
        delete overlay.dataset.parasiteKind;
      }
      pendingPayload = null;
    }

    return {
      getPending,
      canShow,
      show,
      close,
    };
  }

  root.shell.createCalendarChooser = createCalendarChooser;
})(typeof window !== "undefined" ? window : globalThis);
