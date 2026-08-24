import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createVisit, getVisitById } from "../../modules/visit/index.js";
import { getLatestWeight, getWeightHistory } from "../../modules/pet/index.js";
import { resetAllModules, seedDemoPet } from "./helpers.js";

describe("Visit → PetWeight sync (contracts §9.2)", () => {
  beforeEach(() => {
    resetAllModules();
    seedDemoPet();
  });

  it("creates PetWeight with matching weight and sourceVisitId", () => {
    const visitResult = createVisit({
      id: "visit_1",
      petId: "pet_demo",
      visitDate: "2026-08-09",
      clinicName: "幸福動物醫院",
      weightAtVisit: 6.8,
      symptomTags: ["gastrointestinal"],
      createdBy: "owner_1",
    });
    assert.equal(visitResult.ok, true);

    const weightResult = getLatestWeight("pet_demo");
    assert.equal(weightResult.ok, true);
    assert.equal(weightResult.data.weight, 6.8);
    assert.equal(weightResult.data.sourceVisitId, "visit_1");
    assert.equal(weightResult.data.recordedDate, "2026-08-09");

    const history = getWeightHistory("pet_demo");
    assert.equal(history.ok, true);
    assert.equal(history.data.length, 1);

    const again = getVisitById("visit_1");
    assert.equal(again.ok, true);
    assert.equal(again.data.weightAtVisit, weightResult.data.weight);
  });
});
