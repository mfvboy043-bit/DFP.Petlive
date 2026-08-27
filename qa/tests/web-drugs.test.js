import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";
import { searchDrugs as moduleSearch, getDrugById } from "../../modules/drug/index.js";
import { drugs as seedDrugs } from "../../modules/drug/seed.js";

const WEB_ROOT = new URL("../../apps/web/", import.meta.url);

function loadDrugsAdapter(local = seedDrugs, apis = {}) {
  const context = vm.createContext({ console });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(
    readFileSync(new URL("domains/drugs/adapter.js", WEB_ROOT), "utf8"),
    context,
    { filename: "domains/drugs/adapter.js" }
  );
  return context.PetLiveWeb.domains.drugs.createAdapter({
    searchDrugsApi: apis.searchDrugsApi,
    getDrugByIdApi: apis.getDrugByIdApi,
    localDrugs: () => local,
  });
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("DC-01 drugs adapter", () => {
  it("prefers PetLive ModuleResult search; falls back to same seed list", () => {
    const adapter = loadDrugsAdapter(seedDrugs, {
      searchDrugsApi: (q) => moduleSearch(q),
    });
    const hits = adapter.searchDrugs("Pred");
    assert.ok(hits.some((d) => d.genericName === "Prednisolone"));
    const alias = adapter.searchDrugs("普力");
    assert.ok(alias.some((d) => d.genericName === "Prednisolone"));
    assert.ok(
      adapter.searchDrugs("Apoquel").some((d) => d.genericName === "Oclacitinib")
    );
  });

  it("resolveEnrichedDrug prefers local seed row", () => {
    const adapter = loadDrugsAdapter(seedDrugs, {
      getDrugByIdApi: (id) => getDrugById(id),
    });
    const byId = getDrugById("d001");
    assert.equal(byId.ok, true);
    const enriched = adapter.resolveEnrichedDrug("d001");
    assert.equal(enriched.genericName, byId.data.genericName);
    assert.ok(Array.isArray(enriched.commonSideEffects));
  });

  it("degrades to empty when module fails and local empty", () => {
    const adapter = loadDrugsAdapter([], {
      searchDrugsApi: () => ({ ok: false, error: "x" }),
    });
    assert.deepEqual(plain(adapter.searchDrugs("Pred")), []);
  });

  it("no second seed file under apps/web", () => {
    assert.equal(existsSync(new URL("drugs-database.js", WEB_ROOT)), false);
  });
});
