(function initPetLiveWebMedicationsRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.medications = root.domains.medications || {};

  function createRenderer(deps = {}) {
    const {
      label,
      compoundFormOptions,
      compoundColorSwatches,
      compoundChipToneClass,
      compoundIconKind,
      resolveCompoundColor,
    } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (!Array.isArray(compoundFormOptions)) {
      throw new TypeError("createRenderer requires compoundFormOptions");
    }
    if (!Array.isArray(compoundColorSwatches)) {
      throw new TypeError("createRenderer requires compoundColorSwatches");
    }
    if (typeof compoundChipToneClass !== "function") {
      throw new TypeError("createRenderer requires compoundChipToneClass");
    }
    if (typeof compoundIconKind !== "function") {
      throw new TypeError("createRenderer requires compoundIconKind");
    }
    if (typeof resolveCompoundColor !== "function") {
      throw new TypeError("createRenderer requires resolveCompoundColor");
    }

    function buildClinicResultsHtml(list) {
      if (!list.length) return { hidden: true, html: "" };
      return {
        hidden: false,
        html: list
          .map(
            (clinic) => `
      <li>
        <button
          type="button"
          data-clinic-id="${clinic.id}"
          class="${clinic.anonymous ? "is-anonymous" : ""}"
        >
          <strong>${clinic.name}</strong>
          <small>${clinic.note}</small>
        </button>
      </li>`
          )
          .join(""),
      };
    }

    function buildLabClinicResultsHtml(list) {
      if (!list.length) return { hidden: true, html: "" };
      return {
        hidden: false,
        html: list
          .map(
            (clinic) => `
      <li>
        <button
          type="button"
          data-lab-clinic-id="${clinic.id}"
          class="${clinic.anonymous ? "is-anonymous" : ""}"
        >
          <strong>${clinic.name}</strong>
          <small>${clinic.note}</small>
        </button>
      </li>`
          )
          .join(""),
      };
    }

    function buildDrugResultsHtml(list) {
      if (!list.length) return { hidden: true, html: "" };
      return {
        hidden: false,
        html: list
          .map(
            (drug) => `
      <li>
        <button type="button" data-drug-id="${drug.id}">
          <strong>${drug.genericName}${drug.brandNameZh ? `（${drug.brandNameZh}）` : ""}</strong>
          <small>${drug.drugClass} · ${drug.purpose || ""}</small>
        </button>
      </li>`
          )
          .join(""),
      };
    }

    function buildDrugInfoListsHtml(drug) {
      if (!drug) {
        return {
          purposeText: "",
          sideEffectsHtml: "",
          precautionsHtml: "",
          visible: false,
        };
      }
      const sides = drug.commonSideEffects || [];
      const precautions = drug.precautions || [];
      return {
        purposeText: `${drug.drugClass}｜${drug.purpose || ""}`,
        sideEffectsHtml: sides.length
          ? sides.map((item) => `<li>${item}</li>`).join("")
          : `<li>${label("drugInfoUnavailable")}</li>`,
        precautionsHtml: precautions.length
          ? precautions.map((item) => `<li>${item}</li>`).join("")
          : `<li>${label("drugInfoUnavailable")}</li>`,
        visible: true,
      };
    }

    function buildPendingCompoundOptionsHtml(med, ctx) {
      const group = med.compoundGroup || "";
      const pendingMeds = ctx?.pendingMeds || [];
      const show =
        pendingMeds.length >= 2 ||
        Boolean(group) ||
        pendingMeds.some((item) => Boolean(item.compoundGroup));
      if (!show) return "";

      return `<div class="pending-compound" role="group" aria-label="${label("compoundGroupLabel")}">
    <span class="pending-compound-label">${label("compoundGroupLabel")}</span>
    <div class="pending-compound-options">
      ${compoundFormOptions
        .map(([value, key]) => {
          const tone = compoundChipToneClass(value);
          const icon = compoundIconKind(value);
          const color = resolveCompoundColor(value, med.compoundColor);
          const colorStyle =
            group === value ? ` style="--compound-chip-color:${color}"` : "";
          return `
        <label class="pending-compound-opt compound-chip ${tone}${
          group === value ? " is-on" : ""
        }"${colorStyle}>
          <input
            type="radio"
            name="compound-${med.localId}"
            value="${value}"
            data-compound-for="${med.localId}"
            ${group === value ? "checked" : ""}
          />
          <span>
            <i class="compound-ico compound-ico-${icon}" aria-hidden="true"></i>
            ${label(key)}
          </span>
        </label>`;
        })
        .join("")}
      ${
        group
          ? `<button type="button" class="pending-compound-clear" data-compound-clear="${med.localId}">${label(
              "compoundClear"
            )}</button>`
          : ""
      }
    </div>
  </div>`;
    }

    function buildPendingMedsListHtml(pendingMeds, ctx) {
      const list = Array.isArray(pendingMeds) ? pendingMeds : [];
      if (!list.length) {
        return {
          listHtml: "",
          countText: label("pendingMedsEmpty"),
          countI18nKey: "pendingMedsEmpty",
          showCompoundHint: false,
        };
      }

      const medDetailsPending = label("medDetailsPending");
      const listHtml = list
        .map((med) => {
          const dosePending = !med.dose || med.dose === medDetailsPending;
          return `
      <li class="pending-med-item" data-pending-id="${med.localId}">
        <div class="pending-med-main">
          <div>
            <strong>${med.name}</strong>
            <small class="${dosePending ? "is-pending" : ""}">${med.dose}</small>
          </div>
          <button
            class="pending-med-remove"
            type="button"
            data-remove-pending="${med.localId}"
          >${label("pendingMedRemove")}</button>
        </div>
        ${buildPendingCompoundOptionsHtml(med, { pendingMeds: list, ...ctx })}
      </li>`;
        })
        .join("");

      const showCompoundHint =
        list.length >= 2 || list.some((med) => Boolean(med.compoundGroup));

      return {
        listHtml,
        countText: label("pendingMedsCount", { n: list.length }),
        countI18nKey: null,
        showCompoundHint,
      };
    }

    function buildCompoundColorSwatchesHtml(group, currentHex) {
      if (!group) return { hidden: true, html: "", colorValue: "" };
      const current = currentHex || resolveCompoundColor(group);
      return {
        hidden: false,
        colorValue: current,
        html: compoundColorSwatches
          .map((swatch) => {
            const on = swatch.hex.toLowerCase() === String(current).toLowerCase();
            return `<button
      type="button"
      class="compound-color-swatch${on ? " is-on" : ""}"
      data-compound-color="${swatch.hex}"
      style="--swatch:${swatch.hex}"
      aria-label="${label(swatch.labelKey)}"
      title="${label(swatch.labelKey)}"
    ></button>`;
          })
          .join(""),
      };
    }

    return {
      buildClinicResultsHtml,
      buildLabClinicResultsHtml,
      buildDrugResultsHtml,
      buildDrugInfoListsHtml,
      buildPendingCompoundOptionsHtml,
      buildPendingMedsListHtml,
      buildCompoundColorSwatchesHtml,
    };
  }

  root.domains.medications.createRenderer = createRenderer;
})(typeof window !== "undefined" ? window : globalThis);
