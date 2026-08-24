import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  validateMedicationInput,
  createMedication,
} from "../../modules/medication/index.js";
import { createVisit } from "../../modules/visit/index.js";
import { resetAllModules, seedDemoPet } from "./helpers.js";

describe("Medication validation (contracts §9.1 / §4)", () => {
  beforeEach(() => {
    resetAllModules();
    seedDemoPet();
    createVisit({
      id: "visit_med",
      petId: "pet_demo",
      visitDate: "2026-08-01",
      clinicName: "幸福動物醫院",
      weightAtVisit: 6.5,
      symptomTags: ["dermatology"],
      createdBy: "owner_1",
    });
  });

  it("rejects dosageAmount <= 0", () => {
    const result = validateMedicationInput({
      dosageAmount: 0,
      dosageUnit: "mg",
      durationDays: 5,
      drugId: "d001",
    });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "MED_INVALID_DOSE");
  });

  it("rejects free-text dosageUnit", () => {
    const result = validateMedicationInput({
      dosageAmount: 5,
      dosageUnit: "粒",
      durationDays: 5,
      drugId: "d001",
    });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "MED_INVALID_UNIT");
  });

  it("rejects non-integer durationDays", () => {
    const result = validateMedicationInput({
      dosageAmount: 5,
      dosageUnit: "mg",
      durationDays: 2.5,
      drugId: "d001",
    });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "MED_INVALID_DURATION");
  });

  it("allows pending_drug_name with no drug name (photo-first)", () => {
    const result = validateMedicationInput({
      status: "pending_drug_name",
      kind: "photo_bundle",
      drugId: null,
      unrecognizedDrugName: "",
    });
    assert.equal(result.ok, true);
  });

  it("requires unrecognizedDrugName when drugId is null", () => {
    const result = validateMedicationInput({
      dosageAmount: 5,
      dosageUnit: "mg",
      durationDays: 5,
      drugId: null,
      unrecognizedDrugName: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "MED_DRUG_REQUIRED");
  });

  it("rejects drugId and unrecognizedDrugName together", () => {
    const result = validateMedicationInput({
      dosageAmount: 5,
      dosageUnit: "mg",
      durationDays: 5,
      drugId: "d001",
      unrecognizedDrugName: "普力",
    });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "MED_DRUG_XOR");
  });

  it("creates valid medication with known drugId", () => {
    const result = createMedication({
      visitId: "visit_med",
      drugId: "d001",
      dosageAmount: 5,
      dosageUnit: "mg",
      frequency: "BID",
      durationDays: 5,
      inputSource: "owner",
      hasDisclaimer: false,
    });
    assert.equal(result.ok, true);
    assert.equal(result.data.drugId, "d001");
    assert.equal(result.data.unrecognizedDrugName, null);
  });
});
