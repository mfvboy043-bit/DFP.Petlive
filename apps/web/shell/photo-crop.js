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

    /**
     * Wire photo-crop overlay listeners. Domain side effects stay in hooks
     * (onSave / onCancel / onRender) — shell never touches pets or persistence.
     */
    function bindPhotoCropUi(els, state, hooks = {}) {
      const { onRender, onCancel, onSave, win } = hooks;
      const targetWin =
        win ||
        (typeof global !== "undefined" && global.window) ||
        (typeof globalThis !== "undefined" ? globalThis : null);
      if (!els?.viewport || !els?.zoom) return false;

      els.zoom.addEventListener("input", () => {
        if (!setZoom(state, els.zoom.value)) return;
        if (typeof onRender === "function") onRender();
      });

      els.viewport.addEventListener("pointerdown", (event) => {
        if (event.button != null && event.button !== 0) return;
        if (
          !beginDrag(state, {
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
          })
        ) {
          return;
        }
        els.viewport.classList.add("is-dragging");
        els.viewport.setPointerCapture?.(event.pointerId);
      });

      els.viewport.addEventListener("pointermove", (event) => {
        if (
          !moveDrag(state, {
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
          })
        ) {
          return;
        }
        if (typeof onRender === "function") onRender();
      });

      const endDragHandler = (event) => {
        if (!endDrag(state, { pointerId: event?.pointerId })) {
          return;
        }
        els.viewport.classList.remove("is-dragging");
      };

      els.viewport.addEventListener("pointerup", endDragHandler);
      els.viewport.addEventListener("pointercancel", endDragHandler);

      els.cancel?.addEventListener("click", () => {
        if (typeof onCancel === "function") onCancel();
      });

      els.save?.addEventListener("click", () => {
        if (typeof onSave === "function") onSave();
      });

      els.root?.addEventListener("click", (event) => {
        if (event.target === els.root && typeof onCancel === "function") {
          onCancel();
        }
      });

      if (targetWin && typeof targetWin.addEventListener === "function") {
        targetWin.addEventListener("resize", () => {
          if (state?.open && typeof onRender === "function") onRender();
        });
      }
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
      bindPhotoCropUi,
    };
  }

  root.shell.createPhotoCrop = createPhotoCrop;
})(typeof window !== "undefined" ? window : globalThis);
