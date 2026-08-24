import { ok, fail, guard } from "../../packages/shared/result.js";
import { drugs as seedDrugs } from "./seed.js";

/** @type {Map<string, object>} */
const drugMap = new Map(seedDrugs.map((d) => [d.id, d]));

export function getDrugById(drugId) {
  return guard(() => {
    const drug = drugMap.get(drugId);
    if (!drug) throw new Error(`Drug not found: ${drugId}`);
    return { ...drug, commonAliases: [...drug.commonAliases], commonSideEffects: [...drug.commonSideEffects], precautions: [...drug.precautions] };
  }, "DRUG_NOT_FOUND");
}

export function searchDrugs(query) {
  return guard(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];
    return [...drugMap.values()]
      .filter((drug) => {
        const hay = [
          drug.genericName,
          drug.brandNameZh,
          drug.brandNameEn,
          drug.drugClass,
          drug.purpose,
          ...drug.commonAliases,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .map((drug) => ({
        ...drug,
        commonAliases: [...drug.commonAliases],
        commonSideEffects: [...drug.commonSideEffects],
        precautions: [...drug.precautions],
      }));
  }, "DRUG_SEARCH_FAILED");
}

export function listDrugs() {
  return guard(() => [...drugMap.values()].map((d) => ({ ...d })), "DRUG_LIST_FAILED");
}

export function __resetDrugStore() {
  drugMap.clear();
  for (const d of seedDrugs) drugMap.set(d.id, d);
  return ok(true);
}

/** Fault-injection for QA */
let __forceFail = false;
export function __setDrugForceFail(on) {
  __forceFail = Boolean(on);
  return ok(__forceFail);
}

const _search = searchDrugs;
export function searchDrugsGuarded(query) {
  if (__forceFail) return fail("DRUG_INJECTED_FAILURE", "Injected drug module failure");
  return _search(query);
}
