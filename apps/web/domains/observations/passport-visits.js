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

  function clinicLabelOfVisit(visit) {
    if (!visit || typeof visit !== "object") return "";
    return String(visit.clinicName || visit.clinic || "").trim().slice(0, 80);
  }

  function visitIdForPetVisit(petId, visit, index) {
    if (visit && visit.id != null && String(visit.id).trim()) {
      return String(visit.id).trim().slice(0, 64);
    }
    const date = String((visit && visit.date) || "").slice(0, 10) || "undated";
    const clinicKey = String(
      (visit && (visit.clinicId || visit.clinicName || visit.clinic)) || index || "visit"
    )
      .replace(/\s+/g, "")
      .slice(0, 24);
    return "v-" + String(petId || "pet") + "-" + date + "-" + clinicKey;
  }

  function toObservationVisit(petId, visit, index) {
    const date = String((visit && visit.date) || "").slice(0, 10);
    const clinic = clinicLabelOfVisit(visit) || "就診";
    const shortDate = shortVisitDate(date);
    const mapped = {
      id: visitIdForPetVisit(petId, visit, index),
      date: date,
      clinic: clinic,
      label: (shortDate ? shortDate + " · " : "") + clinic,
    };
    if (visit && visit.clinicId != null && String(visit.clinicId).trim()) {
      mapped.clinicId = String(visit.clinicId).trim().slice(0, 64);
    }
    return mapped;
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
    if (pet && Array.isArray(pet.visits)) return pet.visits;
    const seed = seedPetById(pet && pet.id);
    return seed && Array.isArray(seed.visits) ? seed.visits : [];
  }

  function snapshotVisitsForSync(pet) {
    const petId = pet && pet.id ? pet.id : "";
    const raw = Array.isArray(pet && pet.visits) ? pet.visits : [];
    return raw
      .map(function (visit, index) {
        return toObservationVisit(petId, visit, index);
      })
      .filter(function (visit) {
        return !!visit.id;
      });
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
  root.domains.observations.clinicLabelOfVisit = clinicLabelOfVisit;
  root.domains.observations.visitIdForPetVisit = visitIdForPetVisit;
  root.domains.observations.toObservationVisit = toObservationVisit;
  root.domains.observations.snapshotVisitsForSync = snapshotVisitsForSync;
  root.domains.observations.observationVisitsForPet = observationVisitsForPet;
  root.domains.observations.visitProjectName = visitProjectName;
  root.domains.observations.formatLinkedVisitLabel = formatLinkedVisitLabel;
})(typeof window !== "undefined" ? window : globalThis);
