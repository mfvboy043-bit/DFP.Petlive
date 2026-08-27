(function initPetLiveWebShellDrugSearch(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Apply drug results list HTML to the results container.
   */
  function renderDrugResults(els, list, hooks = {}) {
    const { drugResults } = els || {};
    const { buildDrugResultsHtml } = hooks;
    if (!drugResults || typeof buildDrugResultsHtml !== "function") return false;
    const built = buildDrugResultsHtml(list);
    drugResults.hidden = built.hidden;
    drugResults.innerHTML = built.html;
    return true;
  }

  /**
   * Drug search input + results click-select wire. Catalog/enrich stay injected.
   */
  function bindDrugSearch(els = {}, hooks = {}) {
    const { drugSearch, drugResults, selectedDrugEl } = els;
    if (!drugSearch || !drugResults) return { getSuppress: () => false };

    const {
      searchDrugs,
      resolveEnrichedDrug,
      getDrugById,
      renderDrugInfoCard,
      setMedEntryMode,
      getMedEntryMode,
      t,
      onSelectedDrug,
      buildDrugResultsHtml,
    } = hooks;

    let suppressDrugSearchInput = false;

    function paintResults(list) {
      renderDrugResults(
        { drugResults },
        list,
        { buildDrugResultsHtml }
      );
    }

    drugSearch.addEventListener("input", () => {
      if (suppressDrugSearchInput) return;
      if (typeof onSelectedDrug === "function") onSelectedDrug(null);
      if (selectedDrugEl) selectedDrugEl.hidden = true;
      if (typeof renderDrugInfoCard === "function") renderDrugInfoCard(null);
      const list =
        typeof searchDrugs === "function"
          ? searchDrugs(drugSearch.value)
          : [];
      paintResults(list);
    });

    drugResults.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-drug-id]");
      if (!btn) return;
      let selected =
        typeof resolveEnrichedDrug === "function"
          ? resolveEnrichedDrug(btn.dataset.drugId)
          : null;
      if (!selected && typeof getDrugById === "function") {
        const result = getDrugById(btn.dataset.drugId);
        if (result?.ok) {
          selected =
            (typeof resolveEnrichedDrug === "function"
              ? resolveEnrichedDrug(result.data)
              : null) || result.data;
        }
      }
      if (!selected) return;
      drugResults.hidden = true;
      suppressDrugSearchInput = true;
      drugSearch.value = selected.genericName;
      suppressDrugSearchInput = false;
      if (selectedDrugEl) {
        selectedDrugEl.hidden = false;
        if (typeof t === "function") {
          selectedDrugEl.textContent = t("selectedDrug", {
            name: `${selected.genericName}${
              selected.brandNameZh ? ` / ${selected.brandNameZh}` : ""
            }`,
          });
        }
      }
      // Stay on manual entry so the safety card is visible
      const mode =
        typeof getMedEntryMode === "function" ? getMedEntryMode() : null;
      if (mode !== "manual" && typeof setMedEntryMode === "function") {
        setMedEntryMode("manual");
      }
      if (typeof onSelectedDrug === "function") onSelectedDrug(selected);
      if (typeof renderDrugInfoCard === "function") {
        renderDrugInfoCard(selected);
      }
    });

    return {
      renderDrugResults: paintResults,
      getSuppress: () => suppressDrugSearchInput,
    };
  }

  root.shell.renderDrugResults = renderDrugResults;
  root.shell.bindDrugSearch = bindDrugSearch;
})(typeof window !== "undefined" ? window : globalThis);
