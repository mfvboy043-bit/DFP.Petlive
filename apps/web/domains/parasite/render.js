(function initPetLiveWebParasiteRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.parasite = root.domains.parasite || {};

  function createRenderer(deps = {}) {
    const { label, parasiteStatusLabel, productChipLabel, isDualProduct } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (typeof parasiteStatusLabel !== "function") {
      throw new TypeError("createRenderer requires parasiteStatusLabel(status)");
    }
    if (typeof productChipLabel !== "function") {
      throw new TypeError("createRenderer requires productChipLabel(item)");
    }
    if (typeof isDualProduct !== "function") {
      throw new TypeError("createRenderer requires isDualProduct(productKey)");
    }

    function buildProductChipHtml(kind, item, selectedKey) {
      return `<button type="button" class="chip${
        selectedKey === item.key ? " is-on" : ""
      }" data-parasite-product="${item.key}" data-interval="${item.intervalDays}">${productChipLabel(
        item
      )}</button>`;
    }

    function buildProductChipsHtml({ kind, products, selectedKey }) {
      const list = Array.isArray(products) ? products : [];
      const exclusive = list.filter((item) => !isDualProduct(item.key));
      const dual = list.filter((item) => isDualProduct(item.key));
      return `<div class="parasite-chip-row">${exclusive
        .map((item) => buildProductChipHtml(kind, item, selectedKey))
        .join("")}</div><div class="parasite-chip-row">${dual
        .map((item) => buildProductChipHtml(kind, item, selectedKey))
        .join("")}</div>`;
    }

    function stripLightStatusFor(status) {
      if (!status || status === "optional") return null;
      if (status === "unprotected") return "expired";
      return status;
    }

    function buildKindStripPresentation({ record, status, productLabel }) {
      if (status === "optional") {
        return {
          rowClass: "is-optional",
          metaText: label("parasiteHeartwormOptional"),
          statusText: parasiteStatusLabel("optional"),
          lightStatus: null,
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
        lightStatus: stripLightStatusFor(status),
      };
    }

    function buildEmptyStripRowPresentation(kind) {
      return {
        rowClass: "is-unprotected",
        metaText: kind === "vaccine" ? label("vaccineNotSet") : label("parasiteNotSet"),
        statusText: label("parasiteUnprotected"),
        lightStatus: "expired",
      };
    }

    return {
      buildProductChipsHtml,
      buildKindStripPresentation,
      buildEmptyStripRowPresentation,
    };
  }

  root.domains.parasite.createRenderer = createRenderer;
})(typeof globalThis !== "undefined" ? globalThis : window);
