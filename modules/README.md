# Modules

Each folder is an independent building block. Public functions return `ModuleResult` from `packages/shared/result.js` and must not throw across boundaries.

| Module | Contract APIs |
|---|---|
| `pet` | `getPetById`, `getLatestWeight`, `getWeightHistory`, (+ `createPet`, `recordWeight`) |
| `drug` | `searchDrugs`, `getDrugById` |
| `visit` | `getVisitsByPetId`, `getVisitById`, `createVisit` (syncs PetWeight) |
| `medical-alert` | `getAlertsByPetId`, `createAlert` |
| `vaccine` | `getVaccinesByPetId`, `getUpcomingVaccineReminders`, `createVaccine` |
| `medication` | `getMedicationsByVisitId`, `getMedicationHistory`, `createMedication`, `validateMedicationInput` |
| `emergency-card` | `generateEmergencyCard` (compose-only, no own table) |

Do not import another module’s private store. Use its public API only.
