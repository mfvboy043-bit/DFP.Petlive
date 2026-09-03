(function initPetLiveWebShellDrugSearch(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Apply drug-info card lists from a domain renderer build.
   */
  function applyDrugInfoCard(els, built, hooks = {}) {
    const {
      card,
      purposeEl,
      sideEffectsEl,
      precautionsEl,
    } = els || {};
    if (!card) return;
    const { scrollIntoView = true } = hooks;

    if (!built || !built.visible) {
      card.hidden = true;
      if (purposeEl) purposeEl.textContent = "";
      if (sideEffectsEl) sideEffectsEl.innerHTML = "";
      if (precautionsEl) precautionsEl.innerHTML = "";
      return;
    }

    if (purposeEl) purposeEl.textContent = built.purposeText || "";
    if (sideEffectsEl) sideEffectsEl.innerHTML = built.sideEffectsHtml || "";
    if (precautionsEl) precautionsEl.innerHTML = built.precautionsHtml || "";
    card.hidden = false;
    card.removeAttribute("hidden");
    card.classList.add("is-visible");
    if (scrollIntoView && typeof card.scrollIntoView === "function") {
      const raf =
        typeof global.requestAnimationFrame === "function"
          ? global.requestAnimationFrame.bind(global)
          : (fn) => fn();
      raf(() => {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }

  /**
   * Apply drug search results list HTML.
   */
  function applyDrugResults(resultsEl, built) {
    if (!resultsEl || !built) return;
    resultsEl.hidden = Boolean(built.hidden);
    resultsEl.innerHTML = built.html || "";
  }

  /**
   * Bind drug search input + results click.
   * Preserves: suppress flag, module getDrugById fallback, manual mode on select.
   */
  function bindDrugSearch(els, hooks = {}) {
    const { search, results, selectedEl } = els || {};
    if (!search || !results) return null;

    const {
      searchDrugs,
      resolveEnrichedDrug,
      buildResultsHtml,
      buildInfoListsHtml,
      getDrugById,
      t,
      getMedEntryMode,
      setMedEntryMode,
      onSelectDrug,
      infoEls,
    } = hooks;

    let suppressInput = false;

    function paintInfo(drug) {
      if (typeof buildInfoListsHtml !== "function") return;
      const full =
        drug && typeof resolveEnrichedDrug === "function"
          ? resolveEnrichedDrug(drug)
          : null;
      applyDrugInfoCard(infoEls || {}, buildInfoListsHtml(full));
    }

    function paintResults(query) {
      if (typeof searchDrugs !== "function" || typeof buildResultsHtml !== "function") {
        return;
      }
      applyDrugResults(results, buildResultsHtml(searchDrugs(query)));
    }

    function clearSelection() {
      if (typeof onSelectDrug === "function") onSelectDrug(null);
      if (selectedEl) selectedEl.hidden = true;
      paintInfo(null);
    }

    search.addEventListener("input", () => {
      if (suppressInput) return;
      clearSelection();
      paintResults(search.value);
    });

    results.addEventListener("click", (event) => {
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

      results.hidden = true;
      suppressInput = true;
      search.value = selected.genericName || "";
      suppressInput = false;
      if (selectedEl) {
        selectedEl.hidden = false;
        selectedEl.textContent =
          typeof t === "function"
            ? t("selectedDrug", {
                name: `${selected.genericName || ""}${
                  selected.brandNameZh ? ` / ${selected.brandNameZh}` : ""
                }`,
              })
            : selected.genericName || "";
      }
      // Stay on manual entry so the safety card is visible
      if (
        typeof getMedEntryMode === "function" &&
        typeof setMedEntryMode === "function" &&
        getMedEntryMode() !== "manual"
      ) {
        setMedEntryMode("manual");
      }
      if (typeof onSelectDrug === "function") onSelectDrug(selected);
      paintInfo(selected);
    });

    return {
      paintResults,
      paintInfo,
      clearSelection,
      setSuppressInput(value) {
        suppressInput = Boolean(value);
      },
      getSuppressInput() {
        return suppressInput;
      },
    };
  }

  root.shell.applyDrugInfoCard = applyDrugInfoCard;
  root.shell.applyDrugResults = applyDrugResults;
  root.shell.bindDrugSearch = bindDrugSearch;
})(typeof window !== "undefined" ? window : globalThis);
