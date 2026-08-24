/**
 * Classic-script helpers for per-section UI isolation (no bundler).
 * One section failing must not stop sibling renders.
 */
(function (global) {
  function safeRender(sectionName, fn, onError) {
    try {
      fn();
      return true;
    } catch (error) {
      console.warn(`[safeRender:${sectionName}]`, error);
      if (typeof onError === "function") {
        try {
          onError(error);
        } catch (inner) {
          console.warn(`[safeRender:${sectionName}:onError]`, inner);
        }
      }
      return false;
    }
  }

  global.PetLiveSafeUI = { safeRender };
})(window);
