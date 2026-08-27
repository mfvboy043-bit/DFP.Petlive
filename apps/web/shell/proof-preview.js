(function initPetLiveWebShellProofPreview(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function createProofPreview() {
    function buildProofPreviewHtml(dataUrl, { label, clearKey = "" } = {}) {
      if (!dataUrl) return { hidden: true, html: "" };
      const clearBtn = clearKey
        ? `<button type="button" class="proof-clear-btn" data-proof-clear="${clearKey}">${label(
            "proofPhotoClear"
          )}</button>`
        : "";
      return {
        hidden: false,
        html: `<img src="${dataUrl}" alt="" />${clearBtn}`,
      };
    }

    function buildPhotoFiguresHtml(urls, { label, removeAttr, removePrefix }) {
      const list = Array.isArray(urls) ? urls : [];
      return list
        .map(
          (url, index) => `
      <figure class="lab-photo-fig">
        <img src="${url}" alt="" />
        <button type="button" class="proof-clear-btn" ${removeAttr}="${removePrefix}${index}">
          ${label("proofPhotoClear")}
        </button>
      </figure>`
        )
        .join("");
    }

    return {
      buildProofPreviewHtml,
      buildPhotoFiguresHtml,
    };
  }

  root.shell.createProofPreview = createProofPreview;
})(typeof window !== "undefined" ? window : globalThis);
