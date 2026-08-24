import { ok, fail, guard } from "../../packages/shared/result.js";
import { getPetById, getLatestWeight } from "../pet/index.js";
import { getAlertsByPetId } from "../medical-alert/index.js";
import { getCurrentMedications } from "../medication/index.js";

/**
 * @typedef {{
 *   pet?: object,
 *   latestWeight?: object | null,
 *   alerts?: object[],
 *   currentMedications?: object[],
 * }} EmergencySnapshot
 *
 * @typedef {{
 *   snapshot?: EmergencySnapshot,
 *   injectFail?: { weight?: boolean, alerts?: boolean, medications?: boolean },
 * }} EmergencyCardOptions
 */

/**
 * Read-only composition view. Partial upstream failure degrades that section
 * instead of failing the whole card when possible.
 *
 * Prototype UI may pass `options.snapshot` (from apps/web pets[]) so the card
 * stays in sync without dual-writing every store. `injectFail` simulates
 * upstream ModuleResult failure for isolation demos.
 *
 * @param {string} petId
 * @param {{ name?: string, phone?: string }} [ownerContact]
 * @param {string} [asOfDate]
 * @param {EmergencyCardOptions} [options]
 */
export function generateEmergencyCard(
  petId,
  ownerContact = { name: "", phone: "" },
  asOfDate,
  options = {}
) {
  return guard(() => {
    const inject = options.injectFail || {};
    const snap = options.snapshot || null;

    let pet;
    if (snap?.pet) {
      pet = { ...snap.pet };
    } else {
      const petResult = getPetById(petId);
      if (!petResult.ok) {
        throw new Error(petResult.error.message);
      }
      pet = petResult.data;
    }

    let weightOk = true;
    let latestWeight = null;
    if (inject.weight) {
      weightOk = false;
      latestWeight = null;
    } else if (snap && "latestWeight" in snap) {
      latestWeight = snap.latestWeight ?? null;
      weightOk = true;
    } else {
      const weightResult = getLatestWeight(petId);
      weightOk = weightResult.ok;
      latestWeight = weightResult.ok ? weightResult.data : null;
    }

    let alertsOk = true;
    let alerts = [];
    if (inject.alerts) {
      alertsOk = false;
      alerts = [];
    } else if (snap && Array.isArray(snap.alerts)) {
      alerts = snap.alerts.map((a) => ({ ...a }));
      alertsOk = true;
    } else {
      const alertsResult = getAlertsByPetId(petId);
      alertsOk = alertsResult.ok;
      alerts = alertsResult.ok ? alertsResult.data : [];
    }

    let medsOk = true;
    let currentMedications = [];
    if (inject.medications) {
      medsOk = false;
      currentMedications = [];
    } else if (snap && Array.isArray(snap.currentMedications)) {
      currentMedications = snap.currentMedications.map((m) => ({ ...m }));
      medsOk = true;
    } else {
      const medsResult = getCurrentMedications(petId, asOfDate);
      medsOk = medsResult.ok;
      currentMedications = medsResult.ok ? medsResult.data : [];
    }

    return {
      pet,
      latestWeight,
      alerts,
      currentMedications,
      ownerContact: {
        name: ownerContact.name || "",
        phone: ownerContact.phone || "",
      },
      generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      /** Degradation flags for UI — not part of strict contract type, additive */
      _degraded: {
        weight: !weightOk,
        alerts: !alertsOk,
        medications: !medsOk,
      },
    };
  }, "EMERGENCY_CARD_FAILED");
}
