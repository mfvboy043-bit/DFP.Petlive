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

  /**
   * Apply overlay open/close flags to injected elements (no global doc).
   * @param {{ root?: HTMLElement, img?: HTMLElement, zoom?: HTMLInputElement, htmlEl?: Element, bodyEl?: HTMLElement }} els
   * @param {object} flags from applyOpen / applyClose
   */
  function applyPhotoCropFlags(els, flags) {
    if (!els?.root || !flags) return false;
    els.root.hidden = Boolean(flags.rootHidden);
    if (els.htmlEl && els.htmlEl.classList && flags.htmlClass) {
      els.htmlEl.classList.toggle(flags.htmlClass, Boolean(flags.htmlClassOn));
    }
    if (els.bodyEl && els.bodyEl.style) {
      els.bodyEl.style.overflow = flags.bodyOverflow || "";
    }
    if (flags.clearImg && els.img) {
      els.img.removeAttribute("src");
      els.img.removeAttribute("style");
    }
    if (flags.zoomValue != null && els.zoom) {
      els.zoom.value = flags.zoomValue;
    }
    return true;
  }

  /**
   * @param {HTMLElement|null} imgEl
   * @param {{ width?: string, height?: string, transform?: string }|null} styles
   */
  function applyCropImageTransform(imgEl, styles) {
    if (!imgEl || !styles) return false;
    imgEl.style.width = styles.width || "";
    imgEl.style.height = styles.height || "";
    imgEl.style.transform = styles.transform || "";
    return true;
  }

  /**
   * Paint emergency card pet photo frame from a petsRenderer view.
   * @param {{ frameLabel?: HTMLElement, frame?: HTMLElement }} els
   * @param {{ hasPhoto?: boolean, backgroundImage?: string, frameInnerHtml?: string }} view
   * @param {string} labelText
   */
  function applyEmergencyPetPhotoFrame(els, view, labelText) {
    const { frameLabel, frame } = els || {};
    if (!frameLabel || !frame || !view) return false;
    frameLabel.title = labelText || "";
    frameLabel.setAttribute("aria-label", labelText || "");
    frame.classList.toggle("has-photo", Boolean(view.hasPhoto));
    frame.style.backgroundImage = view.backgroundImage || "";
    frame.innerHTML = view.frameInnerHtml || "";
    return true;
  }

  /**
   * Wire emergency pet photo file input. Persistence / crop open stay in hooks.
   * @param {HTMLInputElement|null} inputEl
   * @param {{ getCurrentPet: Function, readFileAsDataUrl: Function, onOpenCrop: Function, onFail?: Function }} hooks
   */
  function bindPetPhotoFileInput(inputEl, hooks = {}) {
    if (!inputEl || inputEl.getAttribute("data-pet-photo-wired") === "1") {
      return null;
    }
    const {
      getCurrentPet,
      readFileAsDataUrl,
      onOpenCrop,
      onFail,
    } = hooks;
    inputEl.setAttribute("data-pet-photo-wired", "1");
    inputEl.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      const pet =
        typeof getCurrentPet === "function" ? getCurrentPet() : null;
      if (!pet) return;
      try {
        const raw =
          typeof readFileAsDataUrl === "function"
            ? await readFileAsDataUrl(file)
            : null;
        if (!raw) {
          if (typeof onFail === "function") onFail();
          return;
        }
        if (typeof onOpenCrop === "function") await onOpenCrop(raw, pet.id);
      } catch {
        if (typeof onFail === "function") onFail();
      }
    });
    return inputEl;
  }

  root.shell.createPhotoCrop = createPhotoCrop;
  root.shell.applyPhotoCropFlags = applyPhotoCropFlags;
  root.shell.applyCropImageTransform = applyCropImageTransform;
  root.shell.applyEmergencyPetPhotoFrame = applyEmergencyPetPhotoFrame;
  root.shell.bindPetPhotoFileInput = bindPetPhotoFileInput;
})(typeof window !== "undefined" ? window : globalThis);
