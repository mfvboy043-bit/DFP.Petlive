(function initPetLiveWebParasiteRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.parasite = root.domains.parasite || {};

  function createRenderer(deps = {}) {
    const { label, parasiteStatusLabel } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (typeof parasiteStatusLabel !== "function") {
      throw new TypeError("createRenderer requires parasiteStatusLabel(status)");
    }

    function buildKindStripPresentation({ record, status, productLabel }) {
      if (status === "optional") {
        return {
          rowClass: "is-optional",
          metaText: label("parasiteHeartwormOptional"),
          statusText: parasiteStatusLabel("optional"),
        };
      }

      const rowClass = `is-${status}`;
      const metaText =
        !record?.nextDue
          ? label("parasiteNotSet")
          : label("parasiteStripMeta", {
              product: productLabel,
              date: record.nextDue,
            });

      return {
        rowClass,
        metaText,
        statusText: parasiteStatusLabel(status),
      };
    }

    function buildEmptyStripRowPresentation(kind) {
      return {
        rowClass: "is-unprotected",
        metaText: kind === "vaccine" ? label("vaccineNotSet") : label("parasiteNotSet"),
        statusText: label("parasiteUnprotected"),
      };
    }

    return {
      buildKindStripPresentation,
      buildEmptyStripRowPresentation,
    };
  }

  root.domains.parasite.createRenderer = createRenderer;
})(typeof globalThis !== "undefined" ? globalThis : window);
