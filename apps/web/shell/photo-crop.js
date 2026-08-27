(function initPetLiveWebShellPhotoCrop(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

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

    return {
      buildCropImageStyles,
    };
  }

  root.shell.createPhotoCrop = createPhotoCrop;
})(typeof window !== "undefined" ? window : globalThis);
