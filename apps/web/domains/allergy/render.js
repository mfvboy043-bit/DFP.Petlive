(function initPetLiveWebAllergyRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.allergy = root.domains.allergy || {};

  function createRenderer(deps = {}) {
    const { label, escapeHtml, formatMoney, meatLabelOf } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (typeof escapeHtml !== "function") {
      throw new TypeError("createRenderer requires escapeHtml");
    }
    if (typeof formatMoney !== "function") {
      throw new TypeError("createRenderer requires formatMoney");
    }
    if (typeof meatLabelOf !== "function") {
      throw new TypeError("createRenderer requires meatLabelOf(presetId)");
    }

    function formatMeats(meats) {
      const list = (meats || []).map((item) => {
        const preset = String(item || "");
        const localized = meatLabelOf(preset);
        return localized || preset;
      });
      return list.length ? list.join("、") : label("allergyMeatsNone");
    }

    function buildBrandResultsHtml(brands) {
      if (!brands?.length) {
        return { hidden: true, html: "" };
      }
      return {
        hidden: false,
        html: brands
          .map(
            (row) => `<li><button type="button" data-allergy-brand="${escapeHtml(row.name)}">${escapeHtml(row.name)}</button></li>`
          )
          .join(""),
      };
    }

    function buildEmptyListHtml() {
      return `<li class="ah-item ah-item-empty"><p>${label("allergyEmpty")}</p></li>`;
    }

    function buildPurchaseListHtml(purchases) {
      if (!purchases?.length) return buildEmptyListHtml();
      return purchases
        .map((row) => {
          const date = String(row.recordDate || row.createdAt || "").slice(0, 10);
          const unit = row.weightUnit === "lb" ? "lb" : "kg";
          const perUnitKey = unit === "lb" ? "allergyPerLb" : "allergyPerKg";
          const perUnitText = label(perUnitKey, {
            price: formatMoney(row.pricePerUnit),
          });
          const summary = `${label("allergyRecordLine", {
            weight: row.weight,
            unit,
            price: formatMoney(row.price),
          })} ${label("allergyRecordPerUnit", { perUnit: perUnitText })}`;
          return `<li class="ah-item" data-allergy-id="${escapeHtml(row.id)}">
        <div class="ah-item-head">
          <time datetime="${escapeHtml(date)}">${escapeHtml(date)}</time>
          <button
            type="button"
            class="btn btn-ghost ah-item-remove"
            data-allergy-remove="${escapeHtml(row.id)}"
          >${label("allergyRemove")}</button>
        </div>
        <p class="ah-item-brand">${escapeHtml(row.brand || "")}</p>
        <p class="ah-item-meats">${escapeHtml(formatMeats(row.meats))}</p>
        <p class="ah-item-meta">${escapeHtml(summary)}</p>
      </li>`;
        })
        .join("");
    }

    return {
      buildBrandResultsHtml,
      buildEmptyListHtml,
      buildPurchaseListHtml,
    };
  }

  root.domains.allergy.createRenderer = createRenderer;
})(typeof window !== "undefined" ? window : globalThis);
