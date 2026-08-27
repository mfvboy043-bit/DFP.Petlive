(function initPetLiveWebShellPhotoCrop(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function createInitialSession() {
    return {
      open: false,
      petId: null,
      naturalW: 0,
      naturalH: 0,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      dragging: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
    };
  }

  function createPhotoCrop() {
    function buildCropImageStyles(metrics) {
      const left = metrics?.left ?? 0;
      const top = metrics?.top ?? 0;
      const width = metrics?.width ?? 0;
      const height = metrics?.height ?? 0;
      return {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${left}px, ${top}px)`,
      };
    }

    function applyOpen(state, { petId, naturalW, naturalH } = {}) {
      if (!state) return overlayOpenFlags();
      state.open = true;
      state.petId = petId;
      state.naturalW = naturalW || 0;
      state.naturalH = naturalH || 0;
      state.zoom = 1;
      state.offsetX = 0;
      state.offsetY = 0;
      state.dragging = false;
      state.pointerId = null;
      return overlayOpenFlags();
    }

    function applyClose(state) {
      if (state) {
        state.open = false;
        state.petId = null;
        state.dragging = false;
        state.pointerId = null;
      }
      return overlayCloseFlags();
    }

    function overlayOpenFlags() {
      return {
        rootHidden: false,
        htmlClass: "is-photo-crop-open",
        htmlClassOn: true,
        bodyOverflow: "hidden",
        zoomValue: "1",
        clearImg: false,
      };
    }

    function overlayCloseFlags() {
      return {
        rootHidden: true,
        htmlClass: "is-photo-crop-open",
        htmlClassOn: false,
        bodyOverflow: "",
        clearImg: true,
      };
    }

    function beginDrag(state, { pointerId, clientX, clientY } = {}) {
      if (!state || !state.open) return false;
      state.dragging = true;
      state.pointerId = pointerId;
      state.startX = clientX;
      state.startY = clientY;
      state.originX = state.offsetX;
      state.originY = state.offsetY;
      return true;
    }

    function moveDrag(state, { pointerId, clientX, clientY } = {}) {
      if (!state || !state.dragging || pointerId !== state.pointerId) return false;
      state.offsetX = state.originX + (clientX - state.startX);
      state.offsetY = state.originY + (clientY - state.startY);
      return true;
    }

    function endDrag(state, { pointerId } = {}) {
      if (!state || !state.dragging) return false;
      if (
        pointerId != null &&
        state.pointerId != null &&
        pointerId !== state.pointerId
      ) {
        return false;
      }
      state.dragging = false;
      state.pointerId = null;
      return true;
    }

    function setZoom(state, zoom) {
      if (!state || !state.open) return false;
      state.zoom = Number(zoom) || 1;
      return true;
    }

    return {
      createInitialSession,
      buildCropImageStyles,
      applyOpen,
      applyClose,
      overlayOpenFlags,
      overlayCloseFlags,
      beginDrag,
      moveDrag,
      endDrag,
      setZoom,
    };
  }

  root.shell.createPhotoCrop = createPhotoCrop;
})(typeof window !== "undefined" ? window : globalThis);
