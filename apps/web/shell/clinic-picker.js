(function initPetLiveWebShellClinicPicker(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Apply clinic results HTML from a domain renderer build.
   * @param {HTMLElement|null} resultsEl
   * @param {{ hidden?: boolean, html?: string }|null} built
   */
  function applyClinicResults(resultsEl, built) {
    if (!resultsEl || !built) return;
    resultsEl.hidden = Boolean(built.hidden);
    resultsEl.innerHTML = built.html || "";
  }

  /**
   * Sync visit-clinic selected chrome + hidden inputs.
   * @param {object|null} clinic
   * @param {object} els
   * @param {{ clinicNameOf: (c: object) => string, t: Function }} hooks
   */
  function applySelectedClinic(clinic, els, hooks = {}) {
    const {
      search,
      nameInput,
      anonymousInput,
      selectedEl,
      results,
    } = els || {};
    const { clinicNameOf, t } = hooks;
    if (!nameInput || !anonymousInput || !selectedEl) return;

    if (!clinic) {
      nameInput.value = "";
      anonymousInput.value = "false";
      selectedEl.hidden = true;
      selectedEl.textContent = "";
      selectedEl.classList.remove("is-anonymous");
      return;
    }

    const name =
      typeof clinicNameOf === "function" ? clinicNameOf(clinic) : clinic.name || "";
    if (search) search.value = name;
    nameInput.value = name;
    anonymousInput.value = clinic.anonymous ? "true" : "false";
    selectedEl.hidden = false;
    selectedEl.classList.toggle("is-anonymous", Boolean(clinic.anonymous));
    selectedEl.textContent =
      typeof t === "function"
        ? clinic.anonymous
          ? t("selectedClinicAnon")
          : t("selectedClinic", { name })
        : name;
    if (results) results.hidden = true;
  }

  /**
   * Bind visit clinic search / results listeners.
   * Inject catalog / store / toast via hooks — shell does no persistence.
   */
  function bindClinicPicker(els, hooks = {}) {
    const { search, results } = els || {};
    if (!search || !results) return null;

    const {
      searchClinics,
      buildResultsHtml,
      getClinicDirectory,
      removeSavedClinic,
      applyFreeTextClinic,
      onSelectClinic,
      showToast,
      t,
      clearSelectionChrome,
    } = hooks;

    function paintResults(query) {
      if (typeof searchClinics !== "function" || typeof buildResultsHtml !== "function") {
        return;
      }
      applyClinicResults(results, buildResultsHtml(searchClinics(query)));
    }

    search.addEventListener("focus", () => {
      paintResults(search.value);
    });

    search.addEventListener("input", () => {
      if (typeof clearSelectionChrome === "function") clearSelectionChrome();
      paintResults(search.value);
    });

    results.addEventListener("click", (event) => {
      const deleteBtn = event.target.closest("[data-clinic-delete]");
      if (deleteBtn) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof removeSavedClinic === "function") {
          removeSavedClinic(deleteBtn.dataset.clinicDelete);
        }
        paintResults(search.value);
        if (typeof showToast === "function" && typeof t === "function") {
          showToast(t("toastClinicRemoved"));
        }
        return;
      }
      const btn = event.target.closest("[data-clinic-id]");
      if (!btn) return;
      if (btn.dataset.clinicId === "__add__") {
        const name = btn.dataset.clinicAddName || search.value.trim();
        if (typeof applyFreeTextClinic === "function") applyFreeTextClinic(name);
        return;
      }
      const directory =
        typeof getClinicDirectory === "function" ? getClinicDirectory() : [];
      const clinic = (directory || []).find(
        (item) => item.id === btn.dataset.clinicId
      );
      if (!clinic) return;
      if (typeof onSelectClinic === "function") onSelectClinic(clinic);
    });

    return { paintResults };
  }

  root.shell.applyClinicResults = applyClinicResults;
  root.shell.applySelectedClinic = applySelectedClinic;
  root.shell.bindClinicPicker = bindClinicPicker;
})(typeof window !== "undefined" ? window : globalThis);
