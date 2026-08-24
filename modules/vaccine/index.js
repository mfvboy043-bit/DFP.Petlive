import { ok, guard } from "../../packages/shared/result.js";
import { getPetById } from "../pet/index.js";

/** @type {Map<string, object>} */
const vaccines = new Map();

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function daysFromToday(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

export function createVaccine(input) {
  return guard(() => {
    const petResult = getPetById(input.petId);
    if (!petResult.ok) throw new Error(petResult.error.message);
    const record = {
      id: input.id || newId("vac"),
      petId: input.petId,
      vaccineName: input.vaccineName,
      administeredDate: input.administeredDate,
      nextDueDate: input.nextDueDate,
      visitId: input.visitId,
    };
    vaccines.set(record.id, record);
    return { ...record };
  }, "VACCINE_CREATE_FAILED");
}

export function getVaccinesByPetId(petId) {
  return guard(() => {
    const petResult = getPetById(petId);
    if (!petResult.ok) throw new Error(petResult.error.message);
    return [...vaccines.values()]
      .filter((v) => v.petId === petId)
      .map((v) => ({ ...v }));
  }, "VACCINE_LIST_FAILED");
}

/** Upcoming = nextDueDate within 60 days (inclusive) and not past > 0 overdue window of -7 */
export function getUpcomingVaccineReminders(petId) {
  return guard(() => {
    const listResult = getVaccinesByPetId(petId);
    if (!listResult.ok) throw new Error(listResult.error.message);
    return listResult.data.filter((v) => {
      if (!v.nextDueDate) return false;
      const d = daysFromToday(v.nextDueDate);
      return d >= -7 && d <= 60;
    });
  }, "VACCINE_REMINDER_FAILED");
}

export function __resetVaccineStore() {
  vaccines.clear();
  return ok(true);
}

export function __seedVaccine(record) {
  vaccines.set(record.id, record);
  return ok(record);
}
