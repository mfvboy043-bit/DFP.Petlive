import type {
  UUID,
  ISODate,
  ISODateTime,
  InputSource,
  SymptomTag,
  NeuterStatus,
  MedicationStatus,
  MedicationKind,
  CompoundForm,
  VaccineProtectionStatus,
  ParasiteKind,
  ParasiteSlotStatus,
  AlertSource,
  AlertSeverity,
} from "./shared-types.js";

export type {
  UUID,
  ISODate,
  ISODateTime,
  InputSource,
  SymptomTag,
  NeuterStatus,
  MedicationStatus,
  MedicationKind,
  CompoundForm,
  VaccineProtectionStatus,
  ParasiteKind,
  ParasiteSlotStatus,
  AlertSource,
  AlertSeverity,
};

export interface Pet {
  id: UUID;
  ownerId?: UUID;
  name: string;
  species: "dog" | "cat" | "other";
  breedKey?: string;
  breed: string;
  gender: "male" | "female" | "unknown";
  isNeutered: NeuterStatus;
  birthDate: ISODate;
  chipNumber?: string;
  photo?: string;
  createdAt?: ISODateTime;
}

export interface PetWeight {
  id: UUID;
  petId: UUID;
  weight: number;
  recordedDate: ISODate;
  sourceVisitId?: UUID;
}

export interface Drug {
  id: UUID;
  genericName: string;
  brandNameZh?: string;
  brandNameEn?: string;
  drugClass: string;
  commonAliases: string[];
  purpose: string;
  commonSideEffects: string[];
  precautions: string[];
}

export interface Visit {
  id: UUID;
  petId: UUID;
  visitDate: ISODate;
  clinicId?: string;
  clinicName: string;
  weightAtVisit?: number;
  symptomTags: SymptomTag[];
  notes?: string;
  bagPhoto?: string;
  rxPhoto?: string;
  drugPhoto?: string;
  createdBy?: UUID;
  createdAt?: ISODateTime;
}

export interface Medication {
  id: UUID;
  visitId: UUID;
  kind: MedicationKind;
  status: MedicationStatus;
  drugId: UUID | null;
  unrecognizedDrugName?: string;
  dosageAmount?: number;
  dosageUnit?: "mg" | "ml" | "tablet";
  frequency?: string;
  durationDays?: number;
  startDate?: ISODate;
  inputSource: InputSource;
  hasDisclaimer?: boolean;
  bagPhoto?: string;
  rxPhoto?: string;
  drugPhoto?: string;
  attachmentUrl?: string;
  compoundForm?: CompoundForm;
  compoundColor?: string;
  compoundGroup?: string;
  ingredients?: Array<{ name: string; dose?: string; source?: InputSource }>;
  createdAt?: ISODateTime;
}

export interface MedicalAlert {
  id: UUID;
  petId: UUID;
  alertType:
    | "drug_allergy"
    | "food_allergy"
    | "vaccine_reaction"
    | "adverse_drug_reaction"
    | "chronic_disease"
    | "special_note";
  source: AlertSource;
  severity: AlertSeverity;
  description: string;
  severityNote?: string;
  createdAt?: ISODateTime;
}

export interface VaccineRecord {
  id: UUID;
  petId: UUID;
  vaccineKey?: string;
  vaccineName: string;
  administeredDate: ISODate;
  nextDueDate?: ISODate;
  visitId?: UUID;
}

export interface ParasiteRecord {
  productKey?: string;
  product?: string;
  lastGiven?: ISODate;
  intervalDays: number;
  nextDue?: ISODate;
}

export interface ParasitePrevention {
  external: ParasiteRecord | null;
  heartworm: ParasiteRecord | null;
}

export interface OwnerProfile {
  name: string;
  phone: string;
  email?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  address?: string;
}

export interface EmergencyCardData {
  pet: Pet;
  latestWeight: PetWeight | null;
  alerts: MedicalAlert[];
  currentMedications: Medication[];
  vaccinesSummary?: { nextDue?: ISODate; status?: VaccineProtectionStatus };
  parasiteSummary?: ParasitePrevention;
  ownerContact: OwnerProfile;
  generatedAt: ISODateTime;
}
