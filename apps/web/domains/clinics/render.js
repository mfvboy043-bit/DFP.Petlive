(function initPetLiveWebClinicsRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.clinics = root.domains.clinics || {};

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function createRenderer({ label } = {}) {
    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, vars?)");
    }

    function buildClinicResultsHtml(list) {
      if (!list.length) return { hidden: true, html: "" };
      return {
        hidden: false,
        html: list
          .map((clinic) => {
            const classes = [
              clinic.anonymous ? "is-anonymous" : "",
              clinic.isAddSuggestion ? "is-add-suggestion" : "",
            ]
              .filter(Boolean)
              .join(" ");
            const deleteBtn = clinic.deletable
              ? `<button
          type="button"
          class="clinic-result-delete"
          data-clinic-delete="${escapeHtml(clinic.id)}"
          data-i18n-aria="clinicDeleteAria"
          aria-label="${escapeHtml(label("clinicDeleteAria"))}"
        >×</button>`
              : "";
            const addNameAttr = clinic.isAddSuggestion
              ? ` data-clinic-add-name="${escapeHtml(clinic.name)}"`
              : "";
            return `
      <li class="clinic-result-item${clinic.deletable ? " has-delete" : ""}">
        <button
          type="button"
          data-clinic-id="${escapeHtml(clinic.id)}"
          class="${classes}"${addNameAttr}
        >
          <strong>${escapeHtml(clinic.name)}</strong>
          <small>${escapeHtml(clinic.note || "")}</small>
        </button>
        ${deleteBtn}
      </li>`;
          })
          .join(""),
      };
    }

    function buildLabClinicResultsHtml(list) {
      if (!list.length) return { hidden: true, html: "" };
      return {
        hidden: false,
        html: list
          .map((clinic) => {
            const classes = [
              clinic.anonymous ? "is-anonymous" : "",
              clinic.isAddSuggestion ? "is-add-suggestion" : "",
            ]
              .filter(Boolean)
              .join(" ");
            const deleteBtn = clinic.deletable
              ? `<button
          type="button"
          class="clinic-result-delete"
          data-lab-clinic-delete="${escapeHtml(clinic.id)}"
          data-i18n-aria="clinicDeleteAria"
          aria-label="${escapeHtml(label("clinicDeleteAria"))}"
        >×</button>`
              : "";
            const addNameAttr = clinic.isAddSuggestion
              ? ` data-lab-clinic-add-name="${escapeHtml(clinic.name)}"`
              : "";
            return `
      <li class="clinic-result-item${clinic.deletable ? " has-delete" : ""}">
        <button
          type="button"
          data-lab-clinic-id="${escapeHtml(clinic.id)}"
          class="${classes}"${addNameAttr}
        >
          <strong>${escapeHtml(clinic.name)}</strong>
          <small>${escapeHtml(clinic.note || "")}</small>
        </button>
        ${deleteBtn}
      </li>`;
          })
          .join(""),
      };
    }

    return { buildClinicResultsHtml, buildLabClinicResultsHtml };
  }

  root.domains.clinics.createRenderer = createRenderer;
})(typeof window !== "undefined" ? window : globalThis);
