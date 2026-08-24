import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { searchDrugs, getDrugById } from "../../modules/drug/index.js";
import { resetAllModules } from "./helpers.js";

describe("Drug Database search (contracts §9.4)", () => {
  beforeEach(() => resetAllModules());

  it("hits Prednisolone via English abbreviation Pred", () => {
    const result = searchDrugs("Pred");
    assert.equal(result.ok, true);
    assert.ok(result.data.some((d) => d.genericName === "Prednisolone"));
  });

  it("hits same drug via Chinese alias 普力", () => {
    const result = searchDrugs("普力");
    assert.equal(result.ok, true);
    const hit = result.data.find((d) => d.genericName === "Prednisolone");
    assert.ok(hit);
    const byId = getDrugById(hit.id);
    assert.equal(byId.ok, true);
    assert.equal(byId.data.genericName, "Prednisolone");
  });

  it("hits Apoquel via English brand", () => {
    const result = searchDrugs("Apoquel");
    assert.equal(result.ok, true);
    assert.ok(result.data.some((d) => d.genericName === "Oclacitinib"));
  });

  it("includes purpose and precautions on drug records", () => {
    const result = searchDrugs("普力松");
    assert.equal(result.ok, true);
    const drug = result.data.find((d) => d.id === "d001");
    assert.ok(drug.purpose);
    assert.ok(drug.commonSideEffects.length > 0);
    assert.ok(drug.precautions.length > 0);
  });
});
