(function initPetLiveWebDrugsAdapter(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.drugs = root.domains.drugs || {};

  /**
   * Single catalog path: prefer PetLive.drug ModuleResult APIs; one local-list
   * fallback (same seed reference). No second seed file; no DOM / t() / storage.
   */
  function createAdapter({
    searchDrugsApi,
    getDrugByIdApi,
    localDrugs,
  } = {}) {
    function resolveLocalDrugs() {
      if (typeof localDrugs === "function") return localDrugs() || [];
      return Array.isArray(localDrugs) ? localDrugs : [];
    }

    function unwrapOk(result) {
      if (result && typeof result === "object" && "ok" in result) {
        return result.ok ? result.data : null;
      }
      return result == null ? null : result;
    }

    function searchLocal(query) {
      const q = String(query || "")
        .trim()
        .toLowerCase();
      if (!q) return [];
      return resolveLocalDrugs().filter((drug) => {
        const hay = [
          drug.genericName,
          drug.brandNameZh,
          drug.brandNameEn,
          drug.drugClass,
          drug.purpose,
          ...(drug.commonAliases || []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    function searchDrugs(query) {
      if (typeof searchDrugsApi === "function") {
        try {
          const result = searchDrugsApi(query);
          if (Array.isArray(result)) return result;
          if (result && typeof result === "object" && "ok" in result) {
            if (result.ok) return result.data || [];
            return [];
          }
          if (result == null) return searchLocal(query);
          return [];
        } catch {
          return searchLocal(query);
        }
      }
      return searchLocal(query);
    }

    function getDrugById(drugId) {
      if (typeof getDrugByIdApi === "function") {
        try {
          const data = unwrapOk(getDrugByIdApi(drugId));
          if (data) return data;
        } catch {
          /* fall through */
        }
      }
      const id = String(drugId || "");
      if (!id) return null;
      return resolveLocalDrugs().find((item) => item.id === id) || null;
    }

    function resolveEnrichedDrug(drugOrId) {
      const id = typeof drugOrId === "string" ? drugOrId : drugOrId?.id;
      const list = resolveLocalDrugs();
      if (id && list.length) {
        const local = list.find((item) => item.id === id);
        if (local) return local;
      }
      if (id) {
        const fromApi = getDrugById(id);
        if (fromApi) return fromApi;
      }
      return typeof drugOrId === "object" && drugOrId ? drugOrId : null;
    }

    return {
      searchDrugs,
      getDrugById,
      resolveEnrichedDrug,
      resolveLocalDrugs,
    };
  }

  root.domains.drugs.createAdapter = createAdapter;
})(typeof window !== "undefined" ? window : globalThis);
