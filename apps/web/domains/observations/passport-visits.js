(function initPetLiveWebObservationsPassportVisits(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  function pad2(n) {
    const s = String(n);
    return s.length < 2 ? "0" + s : s;
  }

  function shortVisitDate(iso) {
    const raw = String(iso || "").trim().slice(0, 10);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!m) return raw;
    return pad2(Number(m[2])) + "/" + pad2(Number(m[3]));
  }

  function visitIdForPetVisit(petId, visit, index) {
    const date = String((visit && visit.date) || "").slice(0, 10) || "undated";
    const clinicKey = String((visit && (visit.clinicId || visit.clinic)) || index || "visit")
      .replace(/\s+/g, "")
      .slice(0, 24);
    return "v-" + String(petId || "pet") + "-" + date + "-" + clinicKey;
  }

  function toObservationVisit(petId, visit, index) {
    const date = String((visit && visit.date) || "").slice(0, 10);
    const clinic = String((visit && visit.clinic) || "就診").trim() || "就診";
    const shortDate = shortVisitDate(date);
    return {
      id: visitIdForPetVisit(petId, visit, index),
      date: date,
      clinic: clinic,
      label: (shortDate ? shortDate + " · " : "") + clinic,
    };
  }

  function seedPetById(petId) {
    const pets = root.domains.pets;
    const list = pets && Array.isArray(pets.SEED_PETS) ? pets.SEED_PETS : [];
    const id = String(petId || "");
    for (let i = 0; i < list.length; i += 1) {
      if (list[i] && String(list[i].id) === id) return list[i];
    }
    return null;
  }

  function rawVisitsForPet(pet) {
    if (pet && Array.isArray(pet.visits) && pet.visits.length) return pet.visits;
    const seed = seedPetById(pet && pet.id);
    return seed && Array.isArray(seed.visits) ? seed.visits : [];
  }

  function observationVisitsForPet(pet) {
    const petId = pet && pet.id ? pet.id : "";
    return rawVisitsForPet(pet)
      .map(function (visit, index) {
        return toObservationVisit(petId, visit, index);
      })
      .filter(function (visit) {
        return !!visit.id;
      });
  }

  function visitProjectName(visit) {
    return visit && visit.label ? String(visit.label).slice(0, 32) : "就診觀察";
  }

  function formatLinkedVisitLabel(project, findVisit) {
    const ids = project && Array.isArray(project.visitIds) ? project.visitIds : [];
    if (!ids.length) return "";
    const parts = [];
    ids.forEach(function (id) {
      const visit = typeof findVisit === "function" ? findVisit(id) : null;
      if (!visit) return;
      const text = visitProjectName(visit);
      if (text) parts.push(String(text));
    });
    return parts.join("、");
  }

  root.domains.observations.shortVisitDate = shortVisitDate;
  root.domains.observations.visitIdForPetVisit = visitIdForPetVisit;
  root.domains.observations.toObservationVisit = toObservationVisit;
  root.domains.observations.observationVisitsForPet = observationVisitsForPet;
  root.domains.observations.visitProjectName = visitProjectName;
  root.domains.observations.formatLinkedVisitLabel = formatLinkedVisitLabel;
})(typeof window !== "undefined" ? window : globalThis);
