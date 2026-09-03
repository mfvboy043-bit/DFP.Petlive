(function initPetLiveWebCoreLocField(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.core = root.core || {};

  /**
   * Localized demo/content field: plain string or
   * { "zh-Hant"|en|ja|ko: "..." }.
   * @param {{ getCurrentLang?: () => string }} [options]
   */
  function createLocField({ getCurrentLang } = {}) {
    return function locField(value) {
      if (value == null) return "";
      if (typeof value === "string") return value;
      if (typeof value === "object") {
        const lang =
          (typeof getCurrentLang === "function" && getCurrentLang()) ||
          "zh-Hant";
        return (
          value[lang] ||
          value["zh-Hant"] ||
          value.zh ||
          value.en ||
          value.ja ||
          value.ko ||
          ""
        );
      }
      return String(value);
    };
  }

  root.core.createLocField = createLocField;
})(typeof window !== "undefined" ? window : globalThis);
