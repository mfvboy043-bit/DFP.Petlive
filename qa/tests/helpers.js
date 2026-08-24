import { __resetPetStore, __seedPet, createPet, recordWeight } from "../../modules/pet/index.js";
import { __resetDrugStore } from "../../modules/drug/index.js";
import { __resetVisitStore } from "../../modules/visit/index.js";
import { __resetAlertStore, __seedAlert, __setAlertForceFail } from "../../modules/medical-alert/index.js";
import { __resetVaccineStore } from "../../modules/vaccine/index.js";
import { __resetMedicationStore } from "../../modules/medication/index.js";

export function resetAllModules() {
  __resetPetStore();
  __resetDrugStore();
  __resetVisitStore();
  __resetAlertStore();
  __resetVaccineStore();
  __resetMedicationStore();
  __setAlertForceFail(false);
}

export function seedDemoPet() {
  const petResult = createPet({
    id: "pet_demo",
    ownerId: "owner_1",
    name: "米醬",
    species: "dog",
    breed: "米克斯",
    gender: "female",
    isNeutered: true,
    birthDate: "2023-01-01",
  });
  if (!petResult.ok) throw new Error(petResult.error.message);
  return petResult.data;
}

export { __seedPet, recordWeight, __seedAlert, __setAlertForceFail };
