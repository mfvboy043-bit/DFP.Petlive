import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createVisit } from "../../modules/visit/index.js";
import { createMedication, getCurrentMedications } from "../../modules/medication/index.js";
import { generateEmergencyCard } from "../../modules/emergency-card/index.js";
import { createAlert } from "../../modules/medical-alert/index.js";
import { resetAllModules, seedDemoPet } from "./helpers.js";

describe("Emergency Card current meds (contracts §9.3)", () => {
  beforeEach(() => {
    resetAllModules();
    seedDemoPet();
  });

  it("includes only non-expired medications by durationDays", () => {
    createVisit({
      id: "visit_old",
      petId: "pet_demo",
      visitDate: "2026-07-01",
      clinicName: "A",
      weightAtVisit: 6.5,
      symptomTags: ["checkup"],
      createdBy: "owner_1",
    });
    createVisit({
      id: "visit_new",
      petId: "pet_demo",
      visitDate: "2026-08-05",
      clinicName: "B",
      weightAtVisit: 6.8,
      symptomTags: ["dermatology"],
      createdBy: "owner_1",
    });

    createMedication({
      id: "med_expired",
      visitId: "visit_old",
      drugId: "d001",
      dosageAmount: 5,
      dosageUnit: "mg",
      frequency: "SID",
      durationDays: 3, // ends 2026-07-03
      inputSource: "owner",
      hasDisclaimer: false,
    });
    createMedication({
      id: "med_active",
      visitId: "visit_new",
      drugId: "d010",
      dosageAmount: 5.4,
      dosageUnit: "mg",
      frequency: "SID",
      durationDays: 10, // ends 2026-08-14
      inputSource: "owner",
      hasDisclaimer: false,
    });

    const current = getCurrentMedications("pet_demo", "2026-08-09");
    assert.equal(current.ok, true);
    assert.equal(current.data.length, 1);
    assert.equal(current.data[0].id, "med_active");

    createAlert({
      petId: "pet_demo",
      alertType: "drug_allergy",
      description: "Penicillin",
    });

    const card = generateEmergencyCard(
      "pet_demo",
      { name: "王小明", phone: "0912" },
      "2026-08-09"
    );
    assert.equal(card.ok, true);
    assert.equal(card.data.currentMedications.length, 1);
    assert.equal(card.data.currentMedications[0].id, "med_active");
    assert.equal(card.data.alerts.length, 1);
    assert.equal(card.data.latestWeight.weight, 6.8);
  });
});
