export type UUID = string;
export type ISODate = string; // "2026-08-09"
export type ISODateTime = string; // "2026-08-09T14:30:00Z"

export type InputSource = "owner" | "owner_proof" | "clinic_ref";
export type NeuterStatus = "yes" | "no" | "unknown";

export type SymptomTag =
  | "gastrointestinal"
  | "urinary"
  | "respiratory"
  | "dermatology"
  | "ear"
  | "eye"
  | "neurology"
  | "orthopedic"
  | "autoimmune"
  | "checkup"
  | "vaccine";

export type MedicationStatus = "complete" | "pending_drug_name";
export type MedicationKind =
  | "single"
  | "compound_ingredient"
  | "compound_bundle"
  | "photo_bundle";
export type CompoundForm =
  | "liquid_a"
  | "liquid_b"
  | "liquid_c"
  | "capsule_a"
  | "capsule_b"
  | "capsule_c";

export type VaccineProtectionStatus = "protected" | "approaching" | "expired";
export type ParasiteKind = "external" | "heartworm";
export type ParasiteSlotStatus =
  | "protected"
  | "approaching"
  | "unprotected"
  | "optional";
export type AlertSource = "linked" | "owner";
export type AlertSeverity = "critical" | "caution";
