(function initPetLiveWebImagingRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.imaging = root.domains.imaging || {};

  function createRenderer(deps = {}) {
    const { label, escapeHtml, visitClinicLabel, formatImagingTypes } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (typeof escapeHtml !== "function") {
      throw new TypeError("createRenderer requires escapeHtml");
    }
    if (typeof visitClinicLabel !== "function") {
      throw new TypeError("createRenderer requires visitClinicLabel");
    }
    if (typeof formatImagingTypes !== "function") {
      throw new TypeError("createRenderer requires formatImagingTypes");
    }

    function buildEmptyListHtml() {
      return `<li class="imaging-list-empty">
      <p>${label("imagingEmpty")}</p>
      <button type="button" class="btn btn-ghost" data-go-timeline-from-imaging>${label(
        "imagingEmptyGoTimeline"
      )}</button>
    </li>`;
    }

    function buildImagingListHtml(entries) {
      if (!entries?.length) return buildEmptyListHtml();
      return entries
        .map(({ visit, index }) => {
          const clinic = escapeHtml(visitClinicLabel(visit));
          return `<li class="imaging-item">
        <button
          type="button"
          class="imaging-item-btn"
          data-open-visit-imaging="${index}"
        >
          <time datetime="${escapeHtml(visit.date)}">${escapeHtml(
            visit.date
          )}</time>
          <span class="imaging-item-clinic">${clinic}</span>
          <span class="imaging-item-types">${escapeHtml(
            formatImagingTypes(visit)
          )}</span>
        </button>
      </li>`;
        })
        .join("");
    }

    function buildEmergencyNavPresentation(entries) {
      if (!entries?.length) {
        return {
          i18nMode: "empty",
          i18nKey: "eXraySubEmpty",
          subText: label("eXraySubEmpty"),
        };
      }
      const latest = entries[0].visit;
      return {
        i18nMode: "dynamic",
        subText: label("eXraySubLatest", {
          date: latest.date,
          types: formatImagingTypes(latest),
        }),
      };
    }

    function buildSlotPreviewsHtml(urls, slot) {
      return (urls || [])
        .map(
          (url, index) => `
      <figure class="lab-photo-fig">
        <img src="${url}" alt="" />
        <button type="button" class="proof-clear-btn" data-imaging-photo-remove="${slot}:${index}">
          ${label("proofPhotoClear")}
        </button>
      </figure>`
        )
        .join("");
    }

    return {
      buildEmptyListHtml,
      buildImagingListHtml,
      buildEmergencyNavPresentation,
      buildSlotPreviewsHtml,
    };
  }

  root.domains.imaging.createRenderer = createRenderer;
})(typeof globalThis !== "undefined" ? globalThis : window);
