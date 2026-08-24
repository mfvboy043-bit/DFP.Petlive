import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getPetById } from "../../modules/pet/index.js";
import { getVisitsByPetId, createVisit } from "../../modules/visit/index.js";
import { getAlertsByPetId, __setAlertForceFail } from "../../modules/medical-alert/index.js";
import { generateEmergencyCard } from "../../modules/emergency-card/index.js";
import { resetAllModules, seedDemoPet } from "./helpers.js";

describe("Fault isolation across modules", () => {
  beforeEach(() => {
    resetAllModules();
    seedDemoPet();
    createVisit({
      id: "visit_ok",
      petId: "pet_demo",
      visitDate: "2026-08-09",
      clinicName: "幸福動物醫院",
      weightAtVisit: 6.8,
      symptomTags: ["checkup"],
      createdBy: "owner_1",
    });
  });

  it("Alert module failure does not break Pet or Visit access", () => {
    __setAlertForceFail(true);

    const alerts = getAlertsByPetId("pet_demo");
    assert.equal(alerts.ok, false);
    assert.equal(alerts.error.code, "ALERT_INJECTED_FAILURE");

    const pet = getPetById("pet_demo");
    assert.equal(pet.ok, true);
    assert.equal(pet.data.name, "米醬");

    const visits = getVisitsByPetId("pet_demo");
    assert.equal(visits.ok, true);
    assert.equal(visits.data.length, 1);
  });

  it("Emergency card degrades alerts section instead of total failure", () => {
    __setAlertForceFail(true);
    const card = generateEmergencyCard("pet_demo", {
      name: "王小明",
      phone: "0912",
    });
    assert.equal(card.ok, true);
    assert.equal(card.data.alerts.length, 0);
    assert.equal(card.data._degraded.alerts, true);
    assert.equal(card.data.pet.name, "米醬");
    assert.equal(card.data.latestWeight.weight, 6.8);
  });

  it("Snapshot + injectFail degrades without wiping sibling sections", () => {
    __setAlertForceFail(false);
    const card = generateEmergencyCard(
      "pet_demo",
      { name: "王小明", phone: "0912" },
      "2026-08-09",
      {
        snapshot: {
          pet: { id: "pet_demo", name: "米醬" },
          latestWeight: { weight: 6.8, recordedDate: "2026-08-01" },
          alerts: [{ id: "a1", alertType: "drug_allergy", description: "Penicillin" }],
          currentMedications: [{ id: "m1", unrecognizedDrugName: "DemoMed" }],
        },
        injectFail: { alerts: true },
      }
    );
    assert.equal(card.ok, true);
    assert.equal(card.data._degraded.alerts, true);
    assert.equal(card.data.alerts.length, 0);
    assert.equal(card.data._degraded.medications, false);
    assert.equal(card.data.currentMedications.length, 1);
    assert.equal(card.data.latestWeight.weight, 6.8);
  });
});
