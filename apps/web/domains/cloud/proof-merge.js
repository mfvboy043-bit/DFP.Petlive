(function initPetLiveWebCloudProofMerge(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.cloud = root.domains.cloud || {};

  /** Keys Drive stripHeavyMedia drops; keep in sync with controller HEAVY_MEDIA_KEYS. */
  const RX_PROOF_KEYS = ["bagPhoto", "rxPhoto", "drugPhoto"];

  function hasProofValue(value) {
    return typeof value === "string" && value.length > 0;
  }

  function visitMatchKey(visit, index) {
    if (!visit || typeof visit !== "object") return `idx:${index}`;
    if (visit.id != null && String(visit.id)) return `id:${visit.id}`;
    const date = String(visit.date || "").slice(0, 10);
    return `date:${date}|${index}`;
  }

  function medMatchKey(med, index) {
    if (!med || typeof med !== "object") return `idx:${index}`;
    if (med.id != null && String(med.id)) return `id:${med.id}`;
    return `idx:${index}`;
  }

  function indexVisits(visits) {
    const map = new Map();
    (Array.isArray(visits) ? visits : []).forEach((visit, index) => {
      map.set(visitMatchKey(visit, index), visit);
    });
    return map;
  }

  function indexMeds(medications) {
    const map = new Map();
    (Array.isArray(medications) ? medications : []).forEach((med, index) => {
      map.set(medMatchKey(med, index), med);
    });
    return map;
  }

  function copyProofSlots(fromNode, toNode) {
    if (!fromNode || !toNode || typeof toNode !== "object") return false;
    let changed = false;
    RX_PROOF_KEYS.forEach((key) => {
      if (hasProofValue(toNode[key])) return;
      if (!hasProofValue(fromNode[key])) return;
      toNode[key] = fromNode[key];
      changed = true;
    });
    return changed;
  }

  /**
   * Mutate cloud/incoming pets in place: restore local Rx proof stills that
   * Drive strip omitted. Match pets by id, visits by id|date+index, meds by id|index.
   * Does not invent proofs for unmatched cloud-only nodes.
   * @returns {{ petsTouched: number, visitsTouched: number, medsTouched: number }}
   */
  function mergeLocalRxProofsInto(incomingPets, localPets) {
    const stats = { petsTouched: 0, visitsTouched: 0, medsTouched: 0 };
    const localById = new Map();
    (Array.isArray(localPets) ? localPets : []).forEach((pet) => {
      if (pet && pet.id != null) localById.set(String(pet.id), pet);
    });

    (Array.isArray(incomingPets) ? incomingPets : []).forEach((pet) => {
      if (!pet || pet.id == null) return;
      const localPet = localById.get(String(pet.id));
      if (!localPet) return;

      let petTouched = false;
      if (copyProofSlots(localPet, pet)) petTouched = true;

      const localVisits = indexVisits(localPet.visits);
      (Array.isArray(pet.visits) ? pet.visits : []).forEach((visit, vIndex) => {
        const localVisit = localVisits.get(visitMatchKey(visit, vIndex));
        if (!localVisit) return;
        if (copyProofSlots(localVisit, visit)) {
          stats.visitsTouched += 1;
          petTouched = true;
        }
        const localMeds = indexMeds(localVisit.medications);
        (Array.isArray(visit.medications) ? visit.medications : []).forEach(
          (med, mIndex) => {
            const localMed = localMeds.get(medMatchKey(med, mIndex));
            if (!localMed) return;
            if (copyProofSlots(localMed, med)) {
              stats.medsTouched += 1;
              petTouched = true;
            }
          }
        );
      });

      if (petTouched) stats.petsTouched += 1;
    });

    return stats;
  }

  /**
   * Pure clone-merge for tests: returns a new pets array (shallow pet/visit/med
   * copies only where needed). Prefer mergeLocalRxProofsInto for apply path.
   */
  function mergeLocalRxProofs(localPets, incomingPets) {
    const clone = JSON.parse(JSON.stringify(incomingPets || []));
    mergeLocalRxProofsInto(clone, localPets || []);
    return clone;
  }

  root.domains.cloud.RX_PROOF_KEYS = RX_PROOF_KEYS;
  root.domains.cloud.mergeLocalRxProofsInto = mergeLocalRxProofsInto;
  root.domains.cloud.mergeLocalRxProofs = mergeLocalRxProofs;
})(typeof window !== "undefined" ? window : globalThis);
