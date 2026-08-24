import { ok, fail, guard } from "../../packages/shared/result.js";
import { getPetById } from "../pet/index.js";

/** @type {Map<string, object>} */
const alerts = new Map();
let __forceFail = false;

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createAlert(input) {
  return guard(() => {
    const petResult = getPetById(input.petId);
    if (!petResult.ok) throw new Error(petResult.error.message);
    const alert = {
      id: input.id || newId("alert"),
      petId: input.petId,
      alertType: input.alertType,
      description: input.description,
      severityNote: input.severityNote,
      createdAt: input.createdAt || nowIso(),
    };
    alerts.set(alert.id, alert);
    return { ...alert };
  }, "ALERT_CREATE_FAILED");
}

export function getAlertsByPetId(petId) {
  if (__forceFail) {
    return fail("ALERT_INJECTED_FAILURE", "Injected alert module failure");
  }
  return guard(() => {
    const petResult = getPetById(petId);
    if (!petResult.ok) throw new Error(petResult.error.message);
    return [...alerts.values()]
      .filter((a) => a.petId === petId)
      .map((a) => ({ ...a }));
  }, "ALERT_LIST_FAILED");
}

export function __setAlertForceFail(on) {
  __forceFail = Boolean(on);
  return ok(__forceFail);
}

export function __resetAlertStore() {
  alerts.clear();
  __forceFail = false;
  return ok(true);
}

export function __seedAlert(alert) {
  alerts.set(alert.id, alert);
  return ok(alert);
}
