(function initPetLiveWebLabsRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.labs = root.domains.labs || {};

  function createRenderer(deps = {}) {
    const { label, escapeHtml, formatLabTypes } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (typeof escapeHtml !== "function") {
      throw new TypeError("createRenderer requires escapeHtml");
    }
    if (typeof formatLabTypes !== "function") {
      throw new TypeError("createRenderer requires formatLabTypes");
    }

    function buildEmptyListHtml() {
      return `<li class="lab-list-empty">${label("labEmpty")}</li>`;
    }

    function buildLabListHtml(reports) {
      if (!reports?.length) return buildEmptyListHtml();
      return reports
        .map((report) => {
          const clinic = report.clinic
            ? escapeHtml(report.clinic)
            : label("labNoClinic");
          const note = report.note
            ? `<p class="lab-item-note">${escapeHtml(report.note)}</p>`
            : "";
          const thumbs = (report.photos || [])
            .map(
              (url) => `
        <button
          type="button"
          data-proof-lightbox
          data-proof-caption="labPhotoCaption"
          aria-label="${label("proofLightboxOpen")}"
        >
          <img src="${url}" alt="" />
        </button>`
            )
            .join("");
          return `<li class="lab-item" data-lab-id="${escapeHtml(report.id)}">
        <div class="lab-item-head">
          <time datetime="${escapeHtml(report.date)}">${escapeHtml(
            report.date
          )}</time>
          <button
            type="button"
            class="btn btn-ghost lab-item-remove"
            data-lab-remove="${escapeHtml(report.id)}"
          >${label("labRemove")}</button>
        </div>
        <p class="lab-item-clinic">${clinic}</p>
        <p class="lab-item-types">${escapeHtml(formatLabTypes(report.types))}</p>
        ${note}
        <div class="lab-item-thumbs">${thumbs}</div>
      </li>`;
        })
        .join("");
    }

    function buildEmergencyNavPresentation(reports) {
      if (!reports?.length) {
        return {
          i18nMode: "empty",
          i18nKey: "eLabSubEmpty",
          subText: label("eLabSubEmpty"),
        };
      }
      const latest = reports[0];
      return {
        i18nMode: "dynamic",
        subText: label("eLabSubLatest", {
          date: latest.date,
          types: formatLabTypes(latest.types),
        }),
      };
    }

    return {
      buildEmptyListHtml,
      buildLabListHtml,
      buildEmergencyNavPresentation,
    };
  }

  root.domains.labs.createRenderer = createRenderer;
})(typeof globalThis !== "undefined" ? globalThis : window);
