// Drug seed: modules/drug/seed.js via runtime/petlive.js → window.drugs
// Clinic / visit-tag catalogs: domains/clinics + domains/visits/labels

function speciesLabelOf(pet) {
  return t(pet.species) || pet.speciesLabel || t("other");
}

function breedLabelOf(pet) {
  const breedKey = pet.breedKey;
  if (breedKey && breedKey !== BREED_CUSTOM_VALUE) {
    const list = getBreedListForSpecies(pet.species);
    const found = list.find((breed) => breed.value === breedKey);
    if (found) return breedOptionLabel(found);
  }
  return pet.breed || "";
}

function ageLabelOf(pet) {
  if (pet.birthDate) return formatAgeLabel(pet.birthDate);
  return pet.ageLabel || t("ageUnknown");
}

function genderLabelOf(pet) {
  if (pet.gender) {
    return formatGenderLabel(pet.gender, pet.isNeutered || "unknown");
  }
  return pet.genderLabel || "";
}

/** Localized demo/content field: plain string or { "zh-Hant"|en|ja|ko: "..." }. */
function locField(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const lang =
      (typeof getCurrentLang === "function" && getCurrentLang()) || "zh-Hant";
    return (
      value[lang] ||
      value["zh-Hant"] ||
      value.zh ||
      value.en ||
      value.ja ||
      value.ko ||
      ""
    );
  }
  return String(value);
}

const clinicsCatalog = PetLiveWeb.domains.clinics.createCatalog({
  label: (key) => t(key),
  locField,
});
const visitLabels = PetLiveWeb.domains.visits.createLabels({
  label: (key) => t(key),
});

function clinicNameOf(clinic) {
  return clinicsCatalog.clinicNameOf(clinic);
}
function getAnonymousClinic() {
  return clinicsCatalog.getAnonymousClinic();
}
function getClinicDirectory() {
  return clinicsCatalog.getClinicDirectory(pets);
}
function visitClinicLabel(visit) {
  return clinicsCatalog.visitClinicLabel(visit);
}
function getSourceTags() {
  return visitLabels.getSourceTags();
}
function visitTagLabel(tag) {
  return visitLabels.visitTagLabel(tag);
}


const pets = [];
const archivedPets = [];

const PETS_GRAPH_KEY = "petlive-pets-graph";
const SYNC_META_KEY = "petlive-sync-meta";
const INTRO_SEEN_KEY = "petlive-intro-seen";
const DEMO_TOUR_SEEN_KEY = "petlive-demo-tour-seen";

function isFreshBootMode() {
  try {
    return new URLSearchParams(window.location.search || "").get("fresh") === "1";
  } catch {
    return false;
  }
}

function isRestoreBootMode() {
  try {
    return new URLSearchParams(window.location.search || "").get("restore") === "1";
  } catch {
    return false;
  }
}

const FRESH_BOOT = isFreshBootMode();
const RESTORE_BOOT = isRestoreBootMode();

function clearLocalPetliveData() {
  const keys = [
    PETS_GRAPH_KEY,
    SYNC_META_KEY,
    INTRO_SEEN_KEY,
    DEMO_TOUR_SEEN_KEY,
    "petlive-pet-alerts",
    "petlive-suppressed-alerts",
    "petlive-pet-photos",
    "petlive-lab-reports",
    "petlive-owner-profile",
  ];
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    sessionStorage.removeItem("petlive-google-token");
    sessionStorage.removeItem("petlive-google-profile");
  } catch {
    /* ignore */
  }
}

if (FRESH_BOOT) {
  clearLocalPetliveData();
}

function isDemoMode() {
  try {
    return new URLSearchParams(window.location.search || "").get("demo") === "1";
  } catch {
    return false;
  }
}

const DEMO_MODE = isDemoMode();

function cloneSeedPets() {
  return PetLiveWeb.domains.pets.cloneSeedPets();
}

function isPetsGraphShape(value) {
  return (
    value &&
    typeof value === "object" &&
    Array.isArray(value.pets) &&
    Array.isArray(value.archivedPets)
  );
}

const petsGraphSlot = PetLiveWeb.storage.createJsonSlot({
  key: PETS_GRAPH_KEY,
  fallback: () => ({
    version: 1,
    pets: [],
    archivedPets: [],
    currentPetId: null,
  }),
  validate: isPetsGraphShape,
  coalesceMs: 220,
});

function hasStoredPetsGraph() {
  try {
    return Boolean(localStorage.getItem(PETS_GRAPH_KEY));
  } catch {
    return false;
  }
}

function hasStoredSyncMeta() {
  try {
    return localStorage.getItem(SYNC_META_KEY) != null;
  } catch {
    return false;
  }
}

const syncMetaSlot = PetLiveWeb.storage.createJsonSlot({
  key: SYNC_META_KEY,
  fallback: () => ({
    localRevision: 0,
    lastSyncedRevision: 0,
    lastCloudUpdatedAt: null,
  }),
  validate: (value) =>
    Boolean(value && typeof value === "object" && !Array.isArray(value)),
});

const cloudSelectors = PetLiveWeb.domains.cloud.createSelectors({
  getSeedPetIds: () => PetLiveWeb.domains.pets.SEED_PETS.map((pet) => pet.id),
  hasStoredPetsGraph,
  readPetsGraphSnapshot: () => petsGraphSlot.read(),
  readSyncMeta: () => syncMetaSlot.read(),
});

let cloudController = null;

function isSeedOnlyPets(petList) {
  return cloudSelectors.isSeedOnlyPets(petList);
}

function isSeedOnlyCloudPayload(payload) {
  return cloudSelectors.isSeedOnlyCloudPayload(payload);
}

const petsGraph = PetLiveWeb.core.createPetsGraph({
  pets,
  archivedPets,
  slot: petsGraphSlot,
  // B never auto-seeds via the door (empty stored graph stays empty).
  cloneSeedPets: () => [],
  getCurrentPetId: () =>
    typeof appState !== "undefined" && appState?.getCurrentPetId
      ? appState.getCurrentPetId()
      : currentPetId,
  onAfterScheduleWrite: () => {
    if (
      typeof cloudController !== "undefined" &&
      cloudController &&
      typeof cloudController.bumpLocalDataRevision === "function"
    ) {
      cloudController.bumpLocalDataRevision();
    } else if (typeof scheduleCloudBackup === "function") {
      scheduleCloudBackup();
    }
  },
});

function hydratePetsGraphFromStorage() {
  if (DEMO_MODE) {
    petsGraph.replaceGraph({ pets: cloneSeedPets(), archivedPets: [] });
    return pets[0]?.id || null;
  }
  if (!hasStoredPetsGraph()) {
    petsGraph.clearGraph();
    return null;
  }
  const currentId = petsGraph.hydrate();
  // Drop leftover prototype seed graphs left from unsigned browsing.
  if (isSeedOnlyPets(pets) && !DEMO_MODE) {
    petsGraph.clearGraph();
    try {
      petsGraphSlot.write({
        version: 1,
        pets: [],
        archivedPets: [],
        currentPetId: null,
      });
    } catch {
      /* ignore */
    }
    return null;
  }
  return currentId;
}

function loadSeedPetsIntoMemory() {
  petsGraph.replaceGraph({ pets: cloneSeedPets(), archivedPets: [] });
  const nextId = pets[0]?.id || null;
  if (nextId) {
    currentPetId = nextId;
    appState.setCurrentPetId(nextId);
  }
  return nextId;
}

function schedulePetsGraphPersist() {
  if (DEMO_MODE) return;
  petsGraph.schedulePersist();
}

hydratePetsGraphFromStorage();

const app = document.getElementById("app");
const toastEl = document.getElementById("toast");
const petPicker = document.getElementById("pet-picker");
const petSwitcher = document.getElementById("pet-switcher");
const petSwitcherHint = document.getElementById("pet-switcher-hint");
const petManageBtn = document.getElementById("pet-manage-btn");
const petAddBtn = document.getElementById("pet-add-btn");
const petNameEl = document.getElementById("pet-name");
const petSubEl = document.getElementById("pet-sub");
const petCurrentEl = document.getElementById("pet-current");
const alertCountBtn = document.getElementById("alert-count-btn");
const archiveList = document.getElementById("archive-list");
const archiveBtn = document.getElementById("archive-btn");
const timelineSub = document.getElementById("timeline-sub");
const timelineList = document.getElementById("timeline-list");
const alertList = document.getElementById("alert-list");
const alertSections = document.getElementById("alert-sections");
const alertForm = document.getElementById("alert-form");
const alertTypeChips = document.getElementById("alert-type-chips");
const alertSeverityChips = document.getElementById("alert-severity-chips");
const alertDescriptionInput = document.getElementById("alert-description");
const alertSeverityInput = document.getElementById("alert-severity-note");
const alertEditIdInput = document.getElementById("alert-edit-id");
const alertSubmitBtn = document.getElementById("alert-submit-btn");
const alertCancelEditBtn = document.getElementById("alert-cancel-edit");
let selectedAlertType = "drug_allergy";
let selectedAlertSeverity = "critical";
const vaccineList = document.getElementById("vaccine-list");
const vaccineSub = document.getElementById("vaccine-sub");
const vaccineForm = document.getElementById("vaccine-form");
const vaccineChipsEl = document.getElementById("vaccine-chips");
const vaccineCustomName = document.getElementById("vaccine-custom-name");
const vaccineGivenInput = document.getElementById("vaccine-given");
const vaccineNextDueInput = document.getElementById("vaccine-next-due");
const selectedVaccineKeys = new Set();
const visitFormSub = document.getElementById("visit-form-sub");
const eName = document.getElementById("e-name");
const eSub = document.getElementById("e-sub");
const eBirthLine = document.getElementById("e-birth-line");
const eChipLine = document.getElementById("e-chip-line");
const eWeight = document.getElementById("e-weight");
const eAlerts = document.getElementById("e-alerts");
const eMeds = document.getElementById("e-meds");

const selectedTags = new Set();
let selectedDrug = null;
let selectedClinic = null;
let currentPetId = pets[0]?.id || null;
const appState = PetLiveWeb.state.createAppState({
  pets,
  archivedPets,
  initialPetId: currentPetId,
});
currentPetId = appState.getCurrentPetId();
let isManagingPets = false;
let pendingRemovePetId = null;
let removeStep = 1;
let pendingArchivePetId = null;
let pendingProofMed = null;
let pendingProofVisitIndex = null;
let pendingBagPhoto = null;
let pendingRxPhoto = null;
let pendingDrugPhoto = null;
let pendingImagingVisitIndex = null;
let pendingXrayPhotos = [];
let pendingUsPhotos = [];
/** In-flight `readAndCompressImage` ops for imaging-proof; Save must wait while > 0. */
let imagingCompressInFlight = 0;
let pendingVisitImagingIndex = null;
/** User collapsed the latest visit’s 藥單 this timeline visit; skip auto-expand until leave. */
let latestRxUserCollapsed = false;
let pendingMeds = [];
let medEntryMode = "photo";
let liveBagPhoto = null;
let liveRxPhoto = null;
let liveDrugPhoto = null;
/** When set, structured med saves append to this visit instead of creating from the visit form. */
let completingVisitRef = null;
/** Session overrides: compoundGroup → hex */
const compoundColorByGroup = Object.create(null);

function showToast(message) {
  toastEl.hidden = false;
  toastEl.textContent = message;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toastEl.hidden = true;
  }, 2200);
}

function showPersistenceFailure() {
  const language = document.documentElement.lang || "zh-Hant";
  const message = language.startsWith("en")
    ? "Could not save—please try again"
    : language.startsWith("ja")
      ? "保存できませんでした。もう一度お試しください"
      : language.startsWith("ko")
        ? "저장하지 못했습니다. 다시 시도해 주세요"
        : "儲存失敗，請再試一次";
  showToast(message);
}

function notifyDemoReadOnly() {
  showToast(t("demoReadOnlyToast"));
}

function demoBlocksWrite() {
  if (!DEMO_MODE) return false;
  notifyDemoReadOnly();
  return true;
}

function getCurrentPet() {
  const pet = appState.getCurrentPet();
  currentPetId = appState.getCurrentPetId();
  return pet;
}

function formatShortDate(isoDate) {
  const [, month, day] = isoDate.split("-");
  return `${month}/${day}`;
}

const { addDays, daysUntil, todayIsoLocal } = PetLiveWeb.core.dates;

function getMedEndDate(med) {
  return addDays(med.startDate, med.durationDays - 1);
}

function formatMedDose(med) {
  return medicationsSelectors.formatMedDose(med);
}

function formatMedCourse(med) {
  return medicationsSelectors.formatMedCourse(med);
}

function formatMedLine(med) {
  const dose = formatMedDose(med);
  const course = formatMedCourse(med);
  return [med.name, dose, course].filter(Boolean).join(" · ");
}

function formatDraftDoseLine(draft) {
  return medicationsSelectors.formatDraftDoseLine(draft);
}

function renderEmergencyMeds(pet) {
  drugNotesMedByPanelId.clear();
  const active = deriveActiveEmergencyMeds(pet);
  if (!active.length) {
    eMeds.innerHTML = emergencyRenderer.buildEmptyMedListHtml();
    return;
  }
  const { html, drugNotePanels } = emergencyRenderer.buildActiveMedListHtml(
    active,
    pet.id
  );
  drugNotePanels.forEach(({ notesId, med }) => {
    drugNotesMedByPanelId.set(notesId, med);
  });
  eMeds.innerHTML = html;
}

function findDrugByMedName(name) {
  if (typeof drugs === "undefined") return null;
  return PetLiveWeb.domains.timeline.findDrugByNameInCatalog(drugs, name);
}

/** Med payload keyed by panel id; cleared on each timeline/emergency re-render. */
const drugNotesMedByPanelId = new Map();

function hydrateDrugNotesPanel(panel) {
  if (!panel || !timelineRenderer) return;
  const med = drugNotesMedByPanelId.get(panel.id);
  if (
    !timelineRenderer.shouldHydrateDrugNotesPanel({
      hydrated: panel.dataset.drugNotesHydrated,
      hasMed: Boolean(med),
    })
  ) {
    return;
  }
  if (!timelineViewHelpers) return;
  const model = timelineViewHelpers.hydrateDrugNoteModel(med);
  const slotSpec = timelineRenderer.buildDrugNotesHydrateSlot(model);
  const slot = document.createElement("div");
  slot.className = slotSpec.className;
  slot.innerHTML = slotSpec.html;
  panel.appendChild(slot);
  panel.dataset.drugNotesHydrated = "true";
}

function renderTimelineDrugNotes(med, notesId) {
  drugNotesMedByPanelId.set(notesId, med);
  return timelineRenderer.buildDrugNotesShellHtml(notesId);
}

function collectVisitProofPhotos(visit) {
  return visitsController.collectVisitProofPhotos(visit);
}

function visitHasAnyProof(visit) {
  return visitsController.visitHasAnyProof(visit);
}

function clearVisitProofSlot(visit, slot) {
  visitsController.clearVisitProofSlot(visit, slot);
}

function getVisitImaging(visit) {
  return imagingController.getVisitImaging(visit);
}

function ensureVisitImaging(visit) {
  return imagingController.ensureVisitImaging(visit);
}

function visitHasImaging(visit) {
  return imagingController.visitHasImaging(visit);
}

function formatImagingTypes(visit) {
  const captionByKey = {
    xray: "imagingXrayCaption",
    us: "imagingUsCaption",
  };
  return imagingController
    .imagingTypeKeys(visit)
    .map((key) => t(captionByKey[key] || key))
    .join("／");
}

function getImagingVisitEntries(pet) {
  return imagingController.getImagingVisitEntries(pet);
}

function clearVisitImagingPhoto(visit, slot, index) {
  imagingController.clearVisitImagingPhoto(visit, slot, index);
}

function getProofLightboxEls() {
  return {
    root: document.getElementById("proof-lightbox"),
    img: document.getElementById("proof-lightbox-img"),
    title: document.getElementById("proof-lightbox-title"),
  };
}

function closeProofLightbox() {
  const { root, img, title } = getProofLightboxEls();
  if (!root || root.hidden) return;
  root.hidden = true;
  document.documentElement.classList.remove("is-proof-lightbox-open");
  if (img) {
    img.removeAttribute("src");
    img.alt = "";
  }
  if (title) title.textContent = t("proofLightboxTitle");
}

function openProofLightbox(src, captionKey) {
  const { root, img, title } = getProofLightboxEls();
  if (!root || !img || !src) return;
  const caption = captionKey ? t(captionKey) : t("proofLightboxTitle");
  img.src = src;
  img.alt = caption;
  if (title) title.textContent = caption;
  root.querySelectorAll("[data-proof-lightbox-close]").forEach((el) => {
    if (el.classList.contains("proof-lightbox-scrim")) {
      el.setAttribute("aria-label", t("proofLightboxClose"));
    }
  });
  root.hidden = false;
  document.documentElement.classList.add("is-proof-lightbox-open");
  root.querySelector(".proof-lightbox-close")?.focus?.();
}

function visitWeightKg(visit) {
  return visitsController.visitWeightKg(visit);
}

/** Calendar-day gap between ISO dates (same day → 0). */
function calendarDaysBetween(fromIso, toIso) {
  return visitsController.calendarDaysBetween(fromIso, toIso);
}

/**
 * Previous visit = immediately prior in chronological order.
 * Newest-first display list: same-day ties use higher index as older.
 */
function buildPreviousVisitByIndex(visits) {
  return visitsController.buildPreviousVisitByIndex(visits);
}

function formatWeightDeltaKg(delta) {
  return visitsController.formatWeightDeltaKg(delta);
}

const ALERT_TYPE_ORDER = PetLiveWeb.domains.alerts.ALERT_TYPE_ORDER;

const ALERT_SECTION_DEFS = [
  {
    id: "allergy",
    titleKey: "alertsSectionAllergy",
    emptyKey: "alertsSectionAllergyEmpty",
    types: [
      "drug_allergy",
      "food_allergy",
      "adverse_drug_reaction",
      "vaccine_reaction",
    ],
  },
  {
    id: "chronic",
    titleKey: "alertsSectionChronic",
    emptyKey: "alertsSectionChronicEmpty",
    types: ["chronic_disease"],
  },
  {
    id: "owner",
    titleKey: "alertsSectionOwner",
    emptyKey: "alertsSectionOwnerEmpty",
    types: ["special_note"],
  },
];

const OWNER_ALERTS_KEY = "petlive-pet-alerts";
const SUPPRESSED_ALERTS_KEY = "petlive-suppressed-alerts";
const isStorageMap = (value) =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));
const ownerAlertsSlot = PetLiveWeb.storage.createJsonSlot({
  key: OWNER_ALERTS_KEY,
  fallback: () => ({}),
  validate: isStorageMap,
});
const suppressedAlertsSlot = PetLiveWeb.storage.createJsonSlot({
  key: SUPPRESSED_ALERTS_KEY,
  fallback: () => ({}),
  validate: isStorageMap,
});
const alertsController = PetLiveWeb.domains.alerts.createController({
  ownerAlertsSlot,
  suppressedAlertsSlot,
});
const alertsSelectors = PetLiveWeb.domains.alerts.createSelectors({
  alerts: alertsController,
});
const editingAlertSectionIds = new Set();

function defaultSeverityForType(alertType) {
  return alertsController.defaultSeverityForType(alertType);
}

function normalizeSeverity(value, alertType) {
  return alertsController.normalizeSeverity(value, alertType);
}

function highestAlertSeverity(alerts) {
  return alertsSelectors.highestAlertSeverity(alerts);
}

function escapeAlertHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function alertTypeLabel(alertType) {
  const map = {
    drug_allergy: "alertTypeDrugAllergy",
    food_allergy: "alertTypeFoodAllergy",
    adverse_drug_reaction: "alertTypeAdr",
    vaccine_reaction: "alertTypeVaccineReaction",
    chronic_disease: "alertTypeChronic",
    special_note: "alertTypeSpecialNote",
  };
  return t(map[alertType] || "alertTypeSpecialNote");
}

function inferAlertType(alert) {
  return alertsController.inferAlertType(alert);
}

function normalizeAlert(alert, fallbackSource = "linked") {
  const base = alertsController.normalizeAlert(alert, fallbackSource);
  return { ...base, type: alertTypeLabel(base.alertType) };
}

function loadOwnerAlertsMap() {
  return alertsController.loadOwnerAlertsMap();
}

function saveOwnerAlertsMap(map) {
  if (DEMO_MODE) return false;
  const ok = alertsController.saveOwnerAlertsMap(map);
  if (ok) bumpLocalDataRevision();
  return ok;
}

function loadSuppressedAlertsMap() {
  return alertsController.loadSuppressedAlertsMap();
}

function saveSuppressedAlertsMap(map) {
  if (DEMO_MODE) return false;
  const ok = alertsController.saveSuppressedAlertsMap(map);
  if (ok) bumpLocalDataRevision();
  return ok;
}

function getSuppressedAlertIds(petId) {
  return alertsController.getSuppressedAlertIds(petId);
}

function suppressLinkedAlert(petId, alertId) {
  if (DEMO_MODE) return false;
  const ok = alertsController.suppressLinkedAlert(petId, alertId);
  if (ok) bumpLocalDataRevision();
  return ok;
}

function getLinkedAlerts(pet) {
  return alertsController.getLinkedAlerts(pet).map((alert) => ({
    ...alert,
    type: alertTypeLabel(alert.alertType),
  }));
}

function getOwnerAlerts(petId) {
  return alertsController.getOwnerAlerts(petId).map((alert) => ({
    ...alert,
    type: alertTypeLabel(alert.alertType),
  }));
}

function persistOwnerAlertsForPet(petId, ownerAlerts) {
  if (DEMO_MODE) return false;
  const ok = alertsController.persistOwnerAlertsForPet(petId, ownerAlerts);
  if (ok) bumpLocalDataRevision();
  return ok;
}

function sortAlerts(alerts) {
  return alertsSelectors.sortAlerts(alerts);
}

function getAlertsForPet(pet) {
  return alertsController.getAlertsForPet(pet).map((alert) => ({
    ...alert,
    type: alertTypeLabel(alert.alertType),
  }));
}

const emergencyAdapter = PetLiveWeb.domains.emergency.createAdapter({
  getAlertsForPet,
  todayISODate: todayIsoLocal,
});
const emergencySelectors = PetLiveWeb.domains.emergency.createSelectors({
  adapter: emergencyAdapter,
});

/** Active courses for emergency card / copy — visits only; domain adapter. */
function deriveActiveEmergencyMeds(pet, today) {
  return emergencyAdapter.deriveActiveEmergencyMeds(pet, today);
}

function buildEmergencySnapshot(pet) {
  return emergencyAdapter.buildSnapshot(pet);
}

function alertLineText(alert) {
  return (
    locField(alert.desc) ||
    locField(alert.text) ||
    locField(alert.description) ||
    ""
  );
}

function formatAlertSince(sinceDate) {
  return alertsController.formatAlertSince(sinceDate);
}

function toMonthInputValue(sinceDate) {
  return alertsController.toMonthInputValue(sinceDate);
}

function chronicSinceLine(alert) {
  if (alert?.alertType !== "chronic_disease") return "";
  const since = formatAlertSince(alert.sinceDate);
  if (since) return t("alertChronicOngoing", { since });
  return t("alertChronicOngoingUnknown");
}

function syncAlertSinceFieldVisibility() {
  const field = document.getElementById("alert-since-field");
  if (!field) return;
  field.hidden = selectedAlertType !== "chronic_disease";
}

function setSelectedAlertSeverity(severity) {
  selectedAlertSeverity = severity === "critical" ? "critical" : "caution";
  alertSeverityChips?.querySelectorAll("[data-alert-severity]").forEach((chip) => {
    chip.classList.toggle("is-on", chip.dataset.alertSeverity === selectedAlertSeverity);
  });
}

function setSelectedAlertType(type, { keepSeverity = false } = {}) {
  selectedAlertType = ALERT_TYPE_ORDER.includes(type) ? type : "special_note";
  alertTypeChips?.querySelectorAll("[data-alert-type]").forEach((chip) => {
    chip.classList.toggle("is-on", chip.dataset.alertType === selectedAlertType);
  });
  if (!keepSeverity) setSelectedAlertSeverity(defaultSeverityForType(selectedAlertType));
  syncAlertSinceFieldVisibility();
  if (selectedAlertType !== "chronic_disease") {
    const sinceInput = document.getElementById("alert-since-date");
    if (sinceInput) sinceInput.value = "";
  }
}

function resetAlertForm({ keepType = null } = {}) {
  if (alertEditIdInput) alertEditIdInput.value = "";
  if (alertDescriptionInput) alertDescriptionInput.value = "";
  if (alertSeverityInput) alertSeverityInput.value = "";
  const sinceInput = document.getElementById("alert-since-date");
  if (sinceInput) sinceInput.value = "";
  setSelectedAlertType(
    ALERT_TYPE_ORDER.includes(keepType) ? keepType : "drug_allergy"
  );
  syncAlertSubmitLabel();
  syncAlertComposeChrome();
  if (alertCancelEditBtn) alertCancelEditBtn.hidden = true;
}

function syncAlertSubmitLabel() {
  if (!alertSubmitBtn) return;
  const editing = Boolean(alertEditIdInput?.value);
  alertSubmitBtn.textContent = t(editing ? "updateAlert" : "saveAlert");
}

function syncAlertComposeChrome() {
  const title = document.querySelector(".alert-compose-title");
  const hint = document.querySelector(".alert-compose > .field-hint");
  const editing = Boolean(alertEditIdInput?.value);
  if (title) title.textContent = t(editing ? "alertComposeTitleEdit" : "alertComposeTitle");
  if (hint) hint.textContent = t(editing ? "alertComposeHintEdit" : "alertComposeHint");
}

function startNewAlert(alertType) {
  const type = ALERT_TYPE_ORDER.includes(alertType) ? alertType : "special_note";
  resetAlertForm({ keepType: type });
  document.querySelector(".alert-compose")?.scrollIntoView({ behavior: "smooth", block: "start" });
  alertDescriptionInput?.focus({ preventScroll: true });
}

function beginEditAlert(alert) {
  if (!alert) return;
  setSelectedAlertType(alert.alertType, { keepSeverity: true });
  setSelectedAlertSeverity(normalizeSeverity(alert.severity, alert.alertType));
  if (alertEditIdInput) alertEditIdInput.value = alert.id;
  if (alertDescriptionInput) {
    alertDescriptionInput.value = alertLineText(alert);
  }
  if (alertSeverityInput) alertSeverityInput.value = locField(alert.note) || "";
  const sinceInput = document.getElementById("alert-since-date");
  if (sinceInput) sinceInput.value = toMonthInputValue(alert.sinceDate);
  syncAlertSinceFieldVisibility();
  syncAlertSubmitLabel();
  syncAlertComposeChrome();
  if (alertCancelEditBtn) alertCancelEditBtn.hidden = false;
  document.querySelector(".alert-compose")?.scrollIntoView({ behavior: "smooth", block: "start" });
  alertDescriptionInput?.focus({ preventScroll: true });
}

function renderAlerts(pet) {
  const alertsTitle = document.getElementById("alerts-title");
  const alertsSub = document.getElementById("alerts-sub");
  if (alertsTitle) alertsTitle.textContent = t("alertsTitleFor", { name: pet.name });
  if (alertsSub) alertsSub.textContent = t("alertsSubFor", { name: pet.name });

  const alerts = getAlertsForPet(pet);
  if (!alertSections) {
    if (!alertList) return;
    alertList.innerHTML = alertsRenderer.buildFlatListHtml(alerts);
    return;
  }

  alertSections.innerHTML = alertsRenderer.buildSectionsHtml({
    alerts,
    sections: ALERT_SECTION_DEFS,
    editingSectionIds: editingAlertSectionIds,
  });
}

function saveAlertFromForm() {
  if (demoBlocksWrite()) return;
  const pet = getCurrentPet();
  if (!pet) return;
  const description = alertDescriptionInput?.value.trim() || "";
  const note = alertSeverityInput?.value.trim() || "";
  const sinceInput = document.getElementById("alert-since-date");
  const sinceDate =
    selectedAlertType === "chronic_disease"
      ? formatAlertSince(sinceInput?.value || "") || null
      : null;
  const draft = {
    alertType: selectedAlertType,
    description,
    note,
    severityNote: note,
    severity: selectedAlertSeverity,
    sinceDate,
  };
  PetLiveWeb.shell.saveAlertFromForm({
    pet,
    draft,
    editId: alertEditIdInput?.value || "",
    selectedAlertType,
    validateOwnerDraft: (d) => alertsController.validateOwnerDraft(d),
    updateOwnerAlert: (petId, id, payload) => {
      const result = alertsController.updateOwnerAlert(petId, id, payload);
      if (result.ok) bumpLocalDataRevision();
      return result;
    },
    createOwnerAlert: (petId, d) => {
      const result = alertsController.createOwnerAlert(petId, d);
      if (result.ok) bumpLocalDataRevision();
      return result;
    },
    findBaseAlert: (editId) => {
      const ownerAlerts = getOwnerAlerts(pet.id);
      const index = ownerAlerts.findIndex((alert) => alert.id === editId);
      if (index >= 0) return ownerAlerts[index];
      return getAlertsForPet(pet).find((alert) => alert.id === editId) || {};
    },
    showToast,
    t,
    showPersistenceFailure,
    resetAlertForm,
    applySelectedPet,
  });
}

function deleteAlertById(alertId) {
  if (demoBlocksWrite()) return;
  PetLiveWeb.shell.deleteAlertById({
    pet: getCurrentPet(),
    alertId,
    deleteOrSuppressAlert: (pet, id) => {
      const result = alertsController.deleteOrSuppressAlert(pet, id);
      if (result.ok && result.kind !== "none") bumpLocalDataRevision();
      return result;
    },
    isEditingAlertId: alertEditIdInput?.value === alertId,
    showPersistenceFailure,
    resetAlertForm,
    showToast,
    t,
    applySelectedPet,
  });
}

function parasiteTodayISODate() {
  return todayIsoLocal();
}

const parasiteController = PetLiveWeb.domains.parasite.createController({
  daysUntil,
  addDays,
  todayISODate: todayIsoLocal,
  labelOf: (key) => t(key),
});
const parasiteSelectors = PetLiveWeb.domains.parasite.createSelectors({
  parasite: parasiteController,
});
const parasiteLabels = PetLiveWeb.domains.parasite.createLabels({
  label: (key, params) => t(key, params),
});

const PARASITE_APPROACHING_DAYS = parasiteController.APPROACHING_DAYS;
const PARASITE_KINDS = parasiteController.KINDS;
const PARASITE_PRODUCT_CATALOG = parasiteController.PRODUCT_CATALOG;
const PARASITE_PRODUCTS = {
  external: parasiteController.productsForKind("external"),
  heartworm: parasiteController.productsForKind("heartworm"),
};

let pendingParasiteFocus = null;
const selectedParasiteProduct = { external: "", heartworm: "" };

function isParasiteDualProduct(productKey) {
  return parasiteController.isParasiteDualProduct(productKey);
}

function parasiteProductChipLabel(item) {
  const name = t(item.key);
  return isParasiteDualProduct(item.key)
    ? `${name}（${t("parasiteDualTag")}）`
    : name;
}

function ensureParasitePrevention(pet) {
  return parasiteController.ensureParasitePrevention(pet);
}

/** @returns {"protected"|"approaching"|"unprotected"} */
function getParasiteStatus(nextDue) {
  return parasiteController.getParasiteStatus(nextDue);
}

function getParasiteSlotStatus(pet, kind) {
  return parasiteSelectors.getParasiteSlotStatus(pet, kind);
}

function parasiteStatusLabel(status) {
  if (status === "protected") return t("parasiteProtected");
  if (status === "approaching") return t("parasiteApproaching");
  if (status === "optional") return t("parasiteOptional");
  return t("parasiteUnprotected");
}

function parasiteKindTitle(kind) {
  return kind === "heartworm" ? t("parasiteHeartworm") : t("parasiteExternal");
}

function getParasiteRecord(pet, kind) {
  return parasiteController.getParasiteRecord(pet, kind);
}

function resolveParasiteProductName(kind, productKey, customValue) {
  return parasiteController.resolveProductName({ productKey, customValue });
}

function syncParasiteNextFromLast(kind) {
  const lastEl = document.getElementById(`parasite-last-${kind}`);
  const intervalEl = document.getElementById(`parasite-interval-${kind}`);
  const nextEl = document.getElementById(`parasite-next-${kind}`);
  if (!lastEl?.value || !intervalEl?.value || !nextEl) return;
  const nextDue = parasiteController.computeNextDue(
    lastEl.value,
    Number(intervalEl.value)
  );
  if (!nextDue) return;
  nextEl.value = nextDue;
  syncDateProxies(document.getElementById(`parasite-form-${kind}`) || document);
}

function renderParasiteProductChips(kind) {
  const el = document.getElementById(`parasite-chips-${kind}`);
  if (!el || !parasiteRenderer) return;
  el.innerHTML = parasiteRenderer.buildProductChipsHtml({
    kind,
    products: PARASITE_PRODUCTS[kind] || [],
    selectedKey: selectedParasiteProduct[kind] || "",
  });
}

function fillParasiteKindForm(pet, kind) {
  const record = getParasiteRecord(pet, kind);
  selectedParasiteProduct[kind] = record?.productKey || "";
  renderParasiteProductChips(kind);

  const customEl = document.getElementById(`parasite-custom-${kind}`);
  const lastEl = document.getElementById(`parasite-last-${kind}`);
  const intervalEl = document.getElementById(`parasite-interval-${kind}`);
  const nextEl = document.getElementById(`parasite-next-${kind}`);

  if (customEl) {
    customEl.value =
      record && !record.productKey && record.product ? record.product : "";
  }
  if (lastEl) lastEl.value = record?.lastGiven || "";
  if (intervalEl) intervalEl.value = record?.intervalDays || 30;
  if (nextEl) nextEl.value = record?.nextDue || "";
  syncDateProxies(document.getElementById(`parasite-form-${kind}`) || document);
}

function fillParasiteScreen(pet) {
  if (!pet) return;
  const sub = document.getElementById("parasite-sub");
  if (sub) sub.textContent = t("parasiteSubFor", { name: pet.name });
  PARASITE_KINDS.forEach((kind) => fillParasiteKindForm(pet, kind));

  const hwHint = document.getElementById("parasite-heartworm-hint");
  if (hwHint) {
    const show = pet.species === "cat";
    hwHint.hidden = !show;
    if (show) hwHint.textContent = t("parasiteHeartwormCatHint");
  }

  if (pendingParasiteFocus) {
    const block = document.getElementById(`parasite-form-${pendingParasiteFocus}`);
    block?.scrollIntoView({ behavior: "smooth", block: "start" });
    pendingParasiteFocus = null;
  }
}

function paintParasiteStripRowEmpty(kind) {
  const row = document.getElementById(`parasite-row-${kind}`);
  const meta = document.getElementById(`parasite-meta-${kind}`);
  const statusEl = document.getElementById(`parasite-status-${kind}`);
  if (!row || !meta || !statusEl) return;
  row.classList.remove(
    "is-protected",
    "is-approaching",
    "is-unprotected",
    "is-optional"
  );
  const presentation = parasiteRenderer.buildEmptyStripRowPresentation(kind);
  row.classList.add(presentation.rowClass);
  meta.textContent = presentation.metaText;
  statusEl.textContent = presentation.statusText;
}

/** No pet (or shell only): same CTA cues as unset records on a pet. */
function paintParasiteStripEmpty() {
  if (!document.getElementById("parasite-strip")) return;
  paintParasiteStripRowEmpty("vaccine");
  paintParasiteStripRowEmpty("external");
  paintParasiteStripRowEmpty("heartworm");
}

function renderParasiteStrip(pet) {
  ensureParasitePrevention(pet);
  PARASITE_KINDS.forEach((kind) => {
    const row = document.getElementById(`parasite-row-${kind}`);
    const meta = document.getElementById(`parasite-meta-${kind}`);
    const statusEl = document.getElementById(`parasite-status-${kind}`);
    if (!row || !meta || !statusEl) return;

    const record = getParasiteRecord(pet, kind);
    row.classList.remove(
      "is-protected",
      "is-approaching",
      "is-unprotected",
      "is-optional"
    );

    const status = getParasiteSlotStatus(pet, kind);
    const productLabel = record?.productKey
      ? t(record.productKey)
      : record?.product || t("parasiteProductFallback");
    const presentation = parasiteRenderer.buildKindStripPresentation({
      record,
      status,
      productLabel,
    });
    row.classList.add(presentation.rowClass);
    meta.textContent = presentation.metaText;
    statusEl.textContent = presentation.statusText;
  });
  renderVaccineStrip(pet);
}

function renderVaccineStrip(pet) {
  const row = document.getElementById("parasite-row-vaccine");
  const meta = document.getElementById("parasite-meta-vaccine");
  const statusEl = document.getElementById("parasite-status-vaccine");
  if (!row || !meta || !statusEl) return;

  row.classList.remove(
    "is-protected",
    "is-approaching",
    "is-unprotected",
    "is-optional"
  );

  const presentation = vaccineRenderer.buildStripPresentation(getNextVaccine(pet));
  row.classList.add(presentation.rowClass);
  meta.textContent = presentation.metaText;
  statusEl.textContent = presentation.statusText;
}

function readParasiteForm(kind) {
  const productKey = selectedParasiteProduct[kind] || "";
  const custom = document.getElementById(`parasite-custom-${kind}`)?.value || "";
  const lastGiven = document.getElementById(`parasite-last-${kind}`)?.value || "";
  const intervalRaw = document.getElementById(`parasite-interval-${kind}`)?.value;
  const nextDue = document.getElementById(`parasite-next-${kind}`)?.value || "";

  return parasiteController.normalizeDraft({
    productKey,
    customValue: custom,
    lastGiven,
    intervalDays: Number(intervalRaw),
    nextDue,
  });
}

function saveParasiteKind(kind, { dosedToday = false, quiet = false } = {}) {
  if (demoBlocksWrite()) return false;
  return PetLiveWeb.shell.saveParasiteKind({
    pet: getCurrentPet(),
    kind,
    dosedToday,
    quiet,
    readParasiteForm,
    applyDosedToday: (draft, opts) =>
      parasiteController.applyDosedToday(draft, opts),
    getDosedTodayEls: (k) => ({
      lastEl: document.getElementById(`parasite-last-${k}`),
      intervalEl: document.getElementById(`parasite-interval-${k}`),
      nextEl: document.getElementById(`parasite-next-${k}`),
    }),
    saveParasiteKind: (pet, k, draft) =>
      parasiteController.saveParasiteKind(pet, k, draft),
    fillParasiteKindForm,
    renderParasiteStrip,
    showToast,
    t,
    isParasiteDualProduct,
    parasiteKindTitle,
    parasiteTodayISODate,
  });
}

/** Recompute next due from last given + interval (does not mark dosed today). */
function prepareParasiteNextDueFromLast(kind) {
  const lastEl = document.getElementById(`parasite-last-${kind}`);
  const intervalEl = document.getElementById(`parasite-interval-${kind}`);
  const nextEl = document.getElementById(`parasite-next-${kind}`);
  const lastGiven = lastEl?.value || "";
  if (!lastGiven) {
    showToast(t("toastParasiteNeedLast"));
    return false;
  }
  let days = Number(intervalEl?.value);
  if (!Number.isFinite(days) || days < 1) {
    days = 30;
    if (intervalEl) intervalEl.value = "30";
  }
  const nextDue = parasiteController.computeNextDue(lastGiven, days);
  if (!nextDue) return false;
  if (nextEl) nextEl.value = nextDue;
  syncDateProxies(document.getElementById(`parasite-form-${kind}`) || document);
  return true;
}

function buildParasiteCalendarPayload(pet, kind) {
  if (!pet) return null;
  const kindTitle = parasiteKindTitle(kind);
  const record = getParasiteRecord(pet, kind);
  const copy = parasiteLabels.buildCalendarTitleDetails({
    pet,
    kindTitle,
    record,
  });
  if (!copy) return null;
  return parasiteController.buildParasiteCalendarPayload(pet, kind, copy);
}

function closeCalendarChooser() {
  const overlay = document.getElementById("parasite-cal-chooser");
  if (!calendarChooserShell) {
    if (overlay) {
      overlay.hidden = true;
      delete overlay.dataset.parasiteKind;
    }
    return;
  }
  calendarChooserShell.close({ overlay });
}

function showCalendarChooser(payload, metaText) {
  const overlay = document.getElementById("parasite-cal-chooser");
  const meta = document.getElementById("parasite-cal-chooser-meta");
  if (!calendarChooserShell?.canShow(payload)) {
    showToast(t("toastParasiteNeedNext"));
    return false;
  }
  const ok = calendarChooserShell.show({
    overlay,
    metaEl: meta,
    payload,
    metaText: metaText || t("parasiteCalChooserMeta", { date: payload.nextDue }),
  });
  if (!ok) {
    showToast(t("toastParasiteNeedNext"));
    return false;
  }
  return true;
}

function showParasiteCalendarChooser(kind) {
  const pet = getCurrentPet();
  const payload = buildParasiteCalendarPayload(pet, kind);
  if (!payload) {
    showToast(t("toastParasiteNeedNext"));
    return false;
  }
  const overlay = document.getElementById("parasite-cal-chooser");
  if (overlay) overlay.dataset.parasiteKind = kind;
  return showCalendarChooser(payload, t("parasiteCalChooserMeta", { date: payload.nextDue }));
}

/** Past dose: require last-given date, recompute next, save, then offer calendar. */
function saveParasitePastAndOfferCalendar(kind) {
  if (!prepareParasiteNextDueFromLast(kind)) return false;
  if (!saveParasiteKind(kind, { quiet: true })) return false;
  return showParasiteCalendarChooser(kind);
}

/** Dosed today: mark today in-app, then offer calendar for next due. */
function saveParasiteDosedTodayAndOfferCalendar(kind) {
  if (!saveParasiteKind(kind, { dosedToday: true, quiet: true })) return false;
  return showParasiteCalendarChooser(kind);
}

function buildVaccineCalendarPayload(pet, { vaccines, given, next }) {
  const copy = vaccinesLabels.buildCalendarTitleDetails({
    pet,
    vaccines,
    given,
    next,
    vaccineFallbackLabel: t("vaccine"),
  });
  if (!copy) return null;
  return vaccinesController.buildVaccineCalendarPayload(
    pet,
    { vaccines, given, next },
    copy
  );
}

function openGoogleCalendar(payload) {
  if (!payload?.nextDue) {
    showToast(t("toastParasiteNeedNext"));
    return;
  }
  const url = PetLiveWeb.domains.calendar.buildGoogleCalendarUrl(payload, { addDays });
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

function openAppleCalendar(payload) {
  if (!payload?.nextDue) {
    showToast(t("toastParasiteNeedNext"));
    return;
  }
  const uid = payload.uid || `event-${PetLiveWeb.domains.calendar.isoToCompactDate(payload.nextDue)}`;
  const ics = PetLiveWeb.domains.calendar.buildAppleIcsDocument(payload, {
    todayISO: todayISODate(),
    addDays,
    uid,
  });
  if (!ics) return;
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `petlive-${uid}.ics`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 2000);
}

function closeParasiteCalendarChooser() {
  closeCalendarChooser();
}

function openParasiteGoogleCalendar(kind) {
  const pet = getCurrentPet();
  openGoogleCalendar(buildParasiteCalendarPayload(pet, kind));
}

function openParasiteAppleCalendar(kind) {
  const pet = getCurrentPet();
  const payload = buildParasiteCalendarPayload(pet, kind);
  if (payload) {
    payload.uid = `parasite-${kind}-${PetLiveWeb.domains.calendar.isoToCompactDate(payload.nextDue)}`;
  }
  openAppleCalendar(payload);
}

function vaccineLabelOf(vaccine) {
  const key = resolveVaccineKey(vaccine);
  if (key) return t(key);
  return vaccine?.name || "";
}

function syncVaccineFormHint(pet) {
  const hint = document.querySelector('[data-i18n="vaccineMultiHint"]');
  if (!hint) return;
  if (pet?.species === "cat") {
    hint.textContent = t("vaccineMultiHintCat");
  } else if (pet?.species === "dog") {
    hint.textContent = t("vaccineMultiHintDog");
  } else {
    hint.textContent = t("vaccineMultiHint");
  }
}

function fillVaccineNameOptions(pet) {
  if (!vaccineChipsEl || !vaccineRenderer) return;
  const groups = PetLiveWeb.domains.vaccines.getPresetGroups(pet.species);
  selectedVaccineKeys.clear();
  vaccineChipsEl.innerHTML = vaccineRenderer.buildFormChipsHtml(groups);
  if (vaccineCustomName) vaccineCustomName.value = "";
  syncVaccineFormHint(pet);
}

function getSelectedVaccineEntries() {
  const entries = [...selectedVaccineKeys].map((key) => ({
    key,
    name: t(key),
  }));
  const custom = vaccineCustomName?.value.trim() || "";
  if (custom) entries.push({ key: "", name: custom });
  return entries;
}

function syncVaccineNextDueFromGiven() {
  if (!vaccineGivenInput.value) return;
  vaccineNextDueInput.value = addYears(vaccineGivenInput.value, 1);
  syncDateProxies(vaccineForm || document);
}

function resetVaccineForm(pet) {
  vaccineForm.reset();
  fillVaccineNameOptions(pet);
  vaccineGivenInput.value = todayISODate();
  syncVaccineNextDueFromGiven();
  syncDateProxies(vaccineForm || document);
}

let vaccineFormPetId = null;

function refreshVaccineForm(pet) {
  if (vaccineFormPetId !== pet.id) {
    resetVaccineForm(pet);
    vaccineFormPetId = pet.id;
    return;
  }

  const draft = {
    selectedKeys: [...selectedVaccineKeys],
    customName: vaccineCustomName?.value || "",
    given: vaccineGivenInput.value,
    nextDue: vaccineNextDueInput.value,
  };
  fillVaccineNameOptions(pet);
  draft.selectedKeys.forEach((key) => selectedVaccineKeys.add(key));
  vaccineChipsEl?.querySelectorAll("[data-vaccine-key]").forEach((chip) => {
    chip.classList.toggle("is-on", selectedVaccineKeys.has(chip.dataset.vaccineKey));
  });
  if (vaccineCustomName) vaccineCustomName.value = draft.customName;
  vaccineGivenInput.value = draft.given;
  vaccineNextDueInput.value = draft.nextDue;
  syncDateProxies(vaccineForm || document);
}

function renderVaccineList(pet) {
  if (!pet.vaccines?.length) {
    vaccineList.innerHTML = vaccineRenderer.buildEmptyListHtml();
    return;
  }
  vaccineList.innerHTML = vaccineRenderer.buildVaccineListHtml(pet, pet.vaccines);
}

function syncVaccineNavLights(status) {
  const lights = document.getElementById("e-vax-lights");
  if (!lights) return;
  const titleByStatus = {
    protected: t("vaxLightGreen"),
    approaching: t("vaxLightOrange"),
    expired: t("vaxLightRed"),
  };
  lights.querySelectorAll(".e-vax-dot").forEach((dot) => {
    const key = dot.dataset.status;
    const on = status && key === status;
    dot.classList.toggle("is-on", Boolean(on));
    if (titleByStatus[key]) dot.title = titleByStatus[key];
  });
  lights.setAttribute(
    "aria-label",
    status ? titleByStatus[status] : t("noVaccineNext")
  );
}

function renderEmergencyVaccineNav(pet) {
  const nextEl = document.getElementById("e-vaccine-next");
  const vaccineBtn = document.getElementById("e-vaccine-btn");
  if (!nextEl || !vaccineBtn) return;

  vaccineBtn.classList.remove("is-protected", "is-approaching", "is-expired");

  const presentation = vaccineRenderer.buildEmergencyNavPresentation(getNextVaccine(pet));
  nextEl.textContent = presentation.nextText;
  nextEl.className = presentation.nextClassName;
  vaccineBtn.classList.add(presentation.btnClass);
  syncVaccineNavLights(presentation.lightStatus);
}

function renderVaccines(pet) {
  renderVaccineList(pet);
  renderEmergencyVaccineNav(pet);
  renderVaccineStrip(pet);
}

function setManageMode(on) {
  isManagingPets = on;
  petSwitcher.classList.toggle("is-managing", on);
  petManageBtn.textContent = on ? t("done") : t("manage");
  petSwitcherHint.textContent = on ? t("petHintManage") : t("petHint");
  renderPetPicker();
}

const PET_PHOTOS_KEY = "petlive-pet-photos";
const PET_PHOTOS_COALESCE_MS = 80;
const petPhotosSlot = PetLiveWeb.storage.createJsonSlot({
  key: PET_PHOTOS_KEY,
  fallback: () => ({}),
  validate: isStorageMap,
  coalesceMs: PET_PHOTOS_COALESCE_MS,
  onFlushResult: (ok) => {
    if (!ok) showPersistenceFailure();
  },
});

/** B-only: demo blocks writes; sync meta bumps on successful photo map writes. */
const petsMedia = PetLiveWeb.domains.pets.createMedia({
  photosSlot: {
    read: () => petPhotosSlot.read(),
    scheduleWrite: (map) => {
      if (DEMO_MODE) return false;
      const ok = petPhotosSlot.scheduleWrite(map);
      if (ok) bumpLocalDataRevision();
      return ok;
    },
    flush: () => petPhotosSlot.flush(),
    hasPendingWrite: () => petPhotosSlot.hasPendingWrite(),
  },
  pets,
});

const LAB_REPORTS_KEY = "petlive-lab-reports";
const labsSelectors = PetLiveWeb.domains.labs.createSelectors({
  visitClinicLabel,
});
const labReportsSlot = PetLiveWeb.storage.createJsonSlot({
  key: LAB_REPORTS_KEY,
  fallback: () => ({}),
  validate: isStorageMap,
});
const labsController = PetLiveWeb.domains.labs.createController({
  labReportsSlot,
  selectors: labsSelectors,
  isDemoMode: () => DEMO_MODE,
  onAfterWrite: () => {
    if (typeof bumpLocalDataRevision === "function") bumpLocalDataRevision();
  },
});
const LAB_PHOTOS_MAX = labsSelectors.LAB_PHOTOS_MAX;
const LAB_TYPE_ORDER = labsSelectors.LAB_TYPE_ORDER;
const LAB_TYPE_I18N = labsSelectors.LAB_TYPE_I18N;
let pendingLabPhotos = [];
let labAddBoundPetId = null;
let selectedLabClinic = null;
const selectedLabTypes = new Set();

function labTypeLabel(type) {
  return t(LAB_TYPE_I18N[type] || "labTypeOther");
}

function formatLabTypes(types) {
  const list = (types || []).filter((type) => LAB_TYPE_I18N[type]);
  if (!list.length) return t("labNoTypes");
  return list.map(labTypeLabel).join("／");
}

function visitLinkValue(visit) {
  return visitsController.visitLinkValue(visit);
}

function parseVisitLinkValue(value) {
  return visitsController.parseVisitLinkValue(value);
}

function findVisitByLink(pet, value) {
  return visitsController.findVisitByLink(pet, value);
}

function reportMatchesVisit(report, visit) {
  return labsSelectors.reportMatchesVisit(report, visit);
}

function getLabReportsForPet(petId) {
  return labsController.getLabReportsForPet(petId);
}

function writeLabReportsForPet(petId, reports) {
  return labsController.writeLabReportsForPet(petId, reports);
}

function renderEmergencyLabNav(pet) {
  const sub = document.getElementById("e-lab-sub");
  if (!sub) return;
  const presentation = labsRenderer.buildEmergencyNavPresentation(
    getLabReportsForPet(pet?.id)
  );
  if (presentation.i18nMode === "empty") {
    sub.setAttribute("data-i18n", presentation.i18nKey);
  } else {
    sub.removeAttribute("data-i18n");
  }
  sub.textContent = presentation.subText;
}

function renderEmergencyImagingNav(pet) {
  const sub = document.getElementById("e-xray-sub");
  if (!sub) return;
  const presentation = imagingRenderer.buildEmergencyNavPresentation(
    getImagingVisitEntries(pet)
  );
  if (presentation.i18nMode === "empty") {
    sub.setAttribute("data-i18n", presentation.i18nKey);
  } else {
    sub.removeAttribute("data-i18n");
  }
  sub.textContent = presentation.subText;
}

function renderImagingList(pet) {
  const list = document.getElementById("imaging-list");
  if (!list) return;
  list.innerHTML = imagingRenderer.buildImagingListHtml(getImagingVisitEntries(pet));
}

function renderLabList(pet) {
  const list = document.getElementById("lab-list");
  if (!list) return;
  list.innerHTML = labsRenderer.buildLabListHtml(getLabReportsForPet(pet?.id));
}

function renderLabPhotoPreviews() {
  const root = document.getElementById("lab-photo-previews");
  if (!root || !labsRenderer) return;
  root.innerHTML = labsRenderer.buildPhotoPreviewsHtml(pendingLabPhotos);
}

function setSelectedLabClinic(clinic) {
  selectedLabClinic = clinic;
  const search = document.getElementById("lab-clinic-search");
  const nameInput = document.getElementById("lab-clinic-name");
  const idInput = document.getElementById("lab-clinic-id");
  const selectedEl = document.getElementById("lab-selected-clinic");
  const results = document.getElementById("lab-clinic-results");
  if (!search || !nameInput || !idInput || !selectedEl) return;
  if (!clinic) {
    nameInput.value = "";
    idInput.value = "";
    selectedEl.hidden = true;
    selectedEl.textContent = "";
    selectedEl.classList.remove("is-anonymous");
    return;
  }
  const name = clinicNameOf(clinic);
  search.value = name;
  nameInput.value = name;
  idInput.value = clinic.id || "";
  selectedEl.hidden = false;
  selectedEl.classList.toggle("is-anonymous", Boolean(clinic.anonymous));
  selectedEl.textContent = clinic.anonymous
    ? t("selectedClinicAnon")
    : t("selectedClinic", { name });
  if (results) results.hidden = true;
}

function renderLabClinicResults(list) {
  const results = document.getElementById("lab-clinic-results");
  if (!results || !labsRenderer) return;
  const built = labsRenderer.buildClinicResultsHtml(list);
  results.hidden = built.hidden;
  results.innerHTML = built.html;
}

function syncLabTypeChips() {
  document.querySelectorAll("#lab-type-chips [data-lab-type]").forEach((chip) => {
    chip.classList.toggle("is-on", selectedLabTypes.has(chip.dataset.labType));
  });
}

function fillLabVisitOptions(pet) {
  const select = document.getElementById("lab-visit-link");
  if (!select) return;
  const previous = select.value;
  const visits = (pet?.visits || []).slice();
  const options = [
    `<option value="">${t("labVisitNone")}</option>`,
    ...visits.map((visit) => {
      const value = visitLinkValue(visit);
      const label = t("labVisitOption", {
        date: visit.date,
        clinic: visitClinicLabel(visit),
      });
      return `<option value="${escapeAlertHtml(value)}">${escapeAlertHtml(
        label
      )}</option>`;
    }),
  ];
  select.innerHTML = options.join("");
  if (previous && [...select.options].some((opt) => opt.value === previous)) {
    select.value = previous;
  }
}

function resetLabAddForm(pet) {
  pendingLabPhotos = [];
  selectedLabTypes.clear();
  labAddBoundPetId = pet?.id || null;
  const form = document.getElementById("lab-add-form");
  form?.reset();
  const dateInput = document.getElementById("lab-date");
  if (dateInput) dateInput.value = todayISODate();
  const photoInput = document.getElementById("lab-photos-input");
  if (photoInput) photoInput.value = "";
  const note = document.getElementById("lab-note");
  if (note) note.value = "";
  const search = document.getElementById("lab-clinic-search");
  if (search) search.value = "";
  setSelectedLabClinic(null);
  renderLabClinicResults([]);
  renderLabPhotoPreviews();
  syncLabTypeChips();
  fillLabVisitOptions(pet);
}

function refreshLabAddChrome(pet) {
  fillLabVisitOptions(pet);
  syncLabTypeChips();
  if (selectedLabClinic) setSelectedLabClinic(selectedLabClinic);
  renderLabPhotoPreviews();
}

function ensureLabAddForPet(pet) {
  if (!pet) return;
  if (labAddBoundPetId !== pet.id) resetLabAddForm(pet);
  else refreshLabAddChrome(pet);
}

function loadPetPhotosMap() {
  return petsMedia.loadMap();
}

function savePetPhotosMap(map) {
  if (DEMO_MODE) return false;
  const ok = petPhotosSlot.scheduleWrite(map);
  if (ok) bumpLocalDataRevision();
  return ok;
}

function flushPetPhotosMap() {
  return petsMedia.flush();
}

function getPetPhoto(petId) {
  return petsMedia.getPetPhoto(petId);
}

function setPetPhoto(petId, dataUrl) {
  return petsMedia.setPetPhoto(petId, dataUrl);
}

function flushPetPhotosOrToast() {
  if (!petsMedia.hasPendingWrite()) return true;
  if (flushPetPhotosMap()) return true;
  showPersistenceFailure();
  return false;
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushPetPhotosOrToast();
});
window.addEventListener("pagehide", () => {
  flushPetPhotosOrToast();
});

function hydratePetPhotos() {
  petsMedia.hydratePetPhotos(pets);
}

const PROOF_PHOTO_MAX_EDGE = 1280;

function resizeImageDataUrl(dataUrl, maxEdge = 480) {
  return PetLiveWeb.domains.pets.resizeImageDataUrl(dataUrl, maxEdge);
}

function renderEmergencyPetPhoto(pet) {
  const frameLabel = document.getElementById("e-pet-photo");
  const frame = document.getElementById("e-pet-photo-preview");
  if (!frameLabel || !frame || !petsRenderer) return;
  const view = petsRenderer.buildEmergencyPhotoFrame(pet);
  const labelText = t(view.labelKey);
  frameLabel.title = labelText;
  frameLabel.setAttribute("aria-label", labelText);
  frame.classList.toggle("has-photo", view.hasPhoto);
  frame.style.backgroundImage = view.backgroundImage;
  frame.innerHTML = view.frameInnerHtml;
}

const photoCropEls = {
  root: document.getElementById("photo-crop"),
  viewport: document.getElementById("photo-crop-viewport"),
  img: document.getElementById("photo-crop-img"),
  zoom: document.getElementById("photo-crop-zoom"),
  cancel: document.getElementById("photo-crop-cancel"),
  save: document.getElementById("photo-crop-save"),
};

const photoCropState = {
  open: false,
  petId: null,
  naturalW: 0,
  naturalH: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  dragging: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
};

function loadImageFromUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function getPhotoCropViewportSize() {
  const vp = photoCropEls.viewport;
  if (!vp) return 280;
  return vp.clientWidth || 280;
}

function getPhotoCropMetrics() {
  return petsMedia.computeCropMetrics({
    view: getPhotoCropViewportSize(),
    naturalW: photoCropState.naturalW,
    naturalH: photoCropState.naturalH,
    zoom: photoCropState.zoom,
    offsetX: photoCropState.offsetX,
    offsetY: photoCropState.offsetY,
  });
}

function clampPhotoCropOffset() {
  const next = petsMedia.clampCropOffset(photoCropState, getPhotoCropMetrics());
  photoCropState.offsetX = next.offsetX;
  photoCropState.offsetY = next.offsetY;
}

function renderPhotoCropTransform() {
  if (!photoCropEls.img || !photoCropShell) return;
  clampPhotoCropOffset();
  const styles = photoCropShell.buildCropImageStyles(getPhotoCropMetrics());
  photoCropEls.img.style.width = styles.width;
  photoCropEls.img.style.height = styles.height;
  photoCropEls.img.style.transform = styles.transform;
}

function applyPhotoCropOverlay(flags) {
  if (!photoCropEls.root || !flags) return;
  photoCropEls.root.hidden = flags.rootHidden;
  document.documentElement.classList.toggle(flags.htmlClass, flags.htmlClassOn);
  document.body.style.overflow = flags.bodyOverflow;
  if (flags.clearImg && photoCropEls.img) {
    photoCropEls.img.removeAttribute("src");
    photoCropEls.img.removeAttribute("style");
  }
  if (flags.zoomValue != null && photoCropEls.zoom) {
    photoCropEls.zoom.value = flags.zoomValue;
  }
}

function closePetPhotoCrop() {
  if (!photoCropEls.root || !photoCropShell) return;
  const flags = photoCropShell.applyClose(photoCropState);
  applyPhotoCropOverlay(flags);
}

async function openPetPhotoCrop(dataUrl, petId) {
  if (!photoCropEls.root || !photoCropEls.img || !photoCropEls.zoom || !photoCropShell) {
    return;
  }
  const prepared = await resizeImageDataUrl(dataUrl, 1600);
  const img = await loadImageFromUrl(prepared);
  const flags = photoCropShell.applyOpen(photoCropState, {
    petId,
    naturalW: img.naturalWidth,
    naturalH: img.naturalHeight,
  });
  photoCropEls.img.src = prepared;
  applyPhotoCropOverlay(flags);
  requestAnimationFrame(() => {
    renderPhotoCropTransform();
  });
}

function exportPetPhotoCrop(outputSize = 480) {
  const metrics = getPhotoCropMetrics();
  if (!photoCropEls.img?.src) return null;
  return (
    petsMedia.exportCroppedJpegDataUrl(photoCropEls.img, metrics, {
      outputSize,
      quality: 0.86,
      fillStyle: "#e8f1ed",
    }) || null
  );
}

function bindPetPhotoCropUi() {
  if (!photoCropEls.viewport || !photoCropEls.zoom || !photoCropShell) return;
  photoCropShell.bindPhotoCropUi(photoCropEls, photoCropState, {
    win: window,
    onRender: renderPhotoCropTransform,
    onCancel: closePetPhotoCrop,
    onSave: () => {
      const pet =
        pets.find((p) => p.id === photoCropState.petId) || getCurrentPet();
      if (!pet) {
        closePetPhotoCrop();
        return;
      }
      const dataUrl = exportPetPhotoCrop(480);
      if (!dataUrl) {
        showToast(t("toastPetPhotoFail"));
        return;
      }
      if (!setPetPhoto(pet.id, dataUrl)) {
        showPersistenceFailure();
        return;
      }
      renderEmergencyPetPhoto(pet);
      renderPetPicker();
      closePetPhotoCrop();
      showToast(t("toastPetPhotoSaved", { name: pet.name }));
    },
  });
}

function renderPetPicker() {
  if (!petPicker || !petsRenderer) return;
  petPicker.innerHTML = petsRenderer.buildPetPickerHtml({
    pets,
    currentPetId,
  });
}

/** Toggle selection without wiping pet-picker DOM (keeps CSS lift transition). */
function syncPetPickerSelection() {
  if (!petPicker) return;
  petPicker.querySelectorAll(".pet-option[data-pet-id]").forEach((btn) => {
    const selected = btn.dataset.petId === currentPetId;
    btn.classList.toggle("is-selected", selected);
    btn.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function petPickerNeedsRebuild() {
  if (!petPicker) return true;
  if (!petPicker.querySelector("#add-pet-btn")) return true;
  const buttons = [...petPicker.querySelectorAll(".pet-option[data-pet-id]")];
  if (buttons.length !== pets.length) return true;
  return pets.some((pet, i) => buttons[i]?.dataset.petId !== pet.id);
}

function renderArchiveList() {
  if (archiveBtn) {
    archiveBtn.setAttribute("aria-label", t("rainbowArchive"));
    archiveBtn.setAttribute("title", t("rainbowArchive"));
  }
  if (!petsRenderer) return;
  archiveList.innerHTML = petsRenderer.buildArchiveListHtml(archivedPets);
}

function getPendingArchivePet() {
  return pets.find((pet) => pet.id === pendingArchivePetId) || null;
}

function openArchivePetFlow(petId) {
  const pet = pets.find((item) => item.id === petId);
  if (!pet) return;
  pendingArchivePetId = petId;
  document.getElementById("archive-pet-name").textContent = pet.name;
  document.getElementById("archive-pet-meta").textContent =
    `${speciesLabelOf(pet)} · ${breedLabelOf(pet)} · ${ageLabelOf(pet)}`;
  document.getElementById("archive-pet-sub").textContent = t("archiveSubFor", {
    name: pet.name,
  });
  const form = document.getElementById("archive-pet-form");
  form.reset();
  document.getElementById("archive-passed-date").value = todayISODate();
  go("archive-pet");
}

function cancelArchivePetFlow() {
  pendingArchivePetId = null;
  setManageMode(false);
  go("home", { replace: true });
  clearNavigationHistory();
}

function confirmArchivePet(event) {
  event.preventDefault();
  const pet = getPendingArchivePet();
  if (!pet) return;

  const passedAwayDate = document.getElementById("archive-passed-date").value;
  const memorialNote = document
    .getElementById("archive-memorial-note")
    .value.trim();
  if (!passedAwayDate) {
    showToast(t("toastNeedPassedDate"));
    return;
  }

  const result = petsLifecycle.archivePet(pet.id, {
    passedAwayDate,
    memorialNote,
    currentPetId,
  });
  if (!result.ok) return;

  pendingArchivePetId = null;
  setManageMode(false);
  if (result.nextCurrentPetId !== undefined) {
    currentPetId = result.nextCurrentPetId;
    appState.setCurrentPetId(currentPetId);
  }
  applySelectedPet();
  renderArchiveList();
  showToast(t("toastArchived", { name: result.archived.name }));
  clearNavigationHistory();
  go("archive", { replace: true });
}

function getPendingRemovePet() {
  return pets.find((pet) => pet.id === pendingRemovePetId) || null;
}

function setRemoveStep(step) {
  removeStep = step;
  document.querySelectorAll(".remove-step").forEach((el) => {
    const n = Number(el.dataset.step);
    el.classList.toggle("is-active", n === step);
    el.classList.toggle("is-done", n < step);
  });
  document.querySelectorAll("[data-remove-step]").forEach((card) => {
    card.hidden = Number(card.dataset.removeStep) !== step;
  });

  const pet = getPendingRemovePet();
  if (!pet) return;
  document.getElementById("remove-pet-name-1").textContent = pet.name;
  document.getElementById("remove-pet-name-3").textContent = pet.name;
  document.getElementById("remove-pet-sub").textContent = t("removeStepSub", {
    name: pet.name,
    step,
  });

  if (step === 3) {
    const input = document.getElementById("remove-pet-confirm-input");
    const confirmBtn = document.getElementById("remove-pet-confirm-btn");
    input.value = "";
    confirmBtn.disabled = true;
    requestAnimationFrame(() => input.focus());
  }
}

function openRemovePetFlow(petId) {
  const pet = pets.find((item) => item.id === petId);
  if (!pet) return;
  pendingRemovePetId = petId;
  setRemoveStep(1);
  go("remove-pet");
}

function cancelRemovePetFlow() {
  pendingRemovePetId = null;
  removeStep = 1;
  setManageMode(false);
  go("home", { replace: true });
  clearNavigationHistory();
}

function confirmRemovePet() {
  const pet = getPendingRemovePet();
  if (!pet) return;

  const input = document.getElementById("remove-pet-confirm-input");
  if (input.value.trim() !== pet.name) {
    showToast(t("toastNameMismatch"));
    return;
  }

  const result = petsLifecycle.removePet(pet.id, { currentPetId });
  if (!result.ok) return;

  const removedName = result.removed.name;
  pendingRemovePetId = null;
  setManageMode(false);

  if (result.nextCurrentPetId !== undefined) {
    currentPetId = result.nextCurrentPetId;
    appState.setCurrentPetId(currentPetId);
  }
  applySelectedPet();
  showToast(t("toastRemoved", { name: removedName }));
  clearNavigationHistory();
  go("home", { replace: true });
}

function safeRender(sectionName, fn, onError) {
  if (window.PetLiveSafeUI?.safeRender) {
    return window.PetLiveSafeUI.safeRender(sectionName, fn, onError);
  }
  try {
    fn();
    return true;
  } catch (error) {
    console.warn(`[safeRender:${sectionName}]`, error);
    if (typeof onError === "function") onError(error);
    return false;
  }
}

function renderPetHeader(pet) {
  petCurrentEl.classList.remove("is-updating");
  void petCurrentEl.offsetWidth;
  petCurrentEl.classList.add("is-updating");
  requestAnimationFrame(() => {
    petCurrentEl.classList.remove("is-updating");
  });

  if (!petsRenderer) return;
  const copy = petsRenderer.buildPetHeaderCopy(pet);
  if (!pet) {
    petNameEl.textContent = copy.nameText;
    petSubEl.textContent = copy.subText;
    if (timelineSub) timelineSub.textContent = copy.timelineSub;
    if (visitFormSub) visitFormSub.textContent = copy.visitFormSub;
    if (vaccineSub) vaccineSub.textContent = copy.vaccineSub;
    return;
  }

  petNameEl.textContent = copy.nameText;
  petSubEl.textContent = copy.subText;
  timelineSub.textContent = copy.timelineSub;
  visitFormSub.textContent = copy.visitFormSub;
  vaccineSub.textContent = copy.vaccineSub;
}

function syncAlertNavTone(alerts) {
  const highest = highestAlertSeverity(alerts);
  const nav = document.querySelector(".e-nav-alerts");
  [alertCountBtn, nav].forEach((el) => {
    if (!el) return;
    el.classList.toggle("is-critical", highest === "critical");
    el.classList.toggle("is-caution", highest === "caution");
  });
  const block = eAlerts?.closest(".e-alerts");
  if (block) {
    block.classList.toggle("is-critical", highest === "critical");
    block.classList.toggle("is-caution", highest === "caution");
  }
}

function renderAlertBadge(pet) {
  const alerts = getAlertsForPet(pet);
  if (alertCountBtn && alertsRenderer) {
    const badge = alertsRenderer.buildHomeBadgePresentation(pet, alerts);
    alertCountBtn.textContent = badge.text;
    alertCountBtn.setAttribute("aria-label", badge.ariaLabel);
  }
  syncAlertNavTone(alerts);
}

const OWNER_PROFILE_KEY = "petlive-owner-profile";

const ownerSelectors = PetLiveWeb.domains.owner.createSelectors();

function demoOwnerProfile() {
  return ownerSelectors.demoProfile();
}

function emptyOwnerProfile() {
  return ownerSelectors.emptyProfile();
}

const ownerProfileSlot = PetLiveWeb.storage.createJsonSlot({
  key: OWNER_PROFILE_KEY,
  fallback: () => ownerSelectors.emptyProfile(),
  validate: isStorageMap,
});

const ownerController = PetLiveWeb.domains.owner.createController({
  selectors: ownerSelectors,
  ownerProfileSlot,
  isDemoMode: () => DEMO_MODE,
  onAfterSave: () => {
    if (typeof bumpLocalDataRevision === "function") bumpLocalDataRevision();
  },
});

function loadOwnerProfile() {
  if (!DEMO_MODE) scrubDemoOwnerProfileFromStorage();
  return ownerController.load();
}

/** Remove leftover showcase owner written by older prototype builds. */
function scrubDemoOwnerProfileFromStorage() {
  try {
    const raw = localStorage.getItem(OWNER_PROFILE_KEY);
    if (!raw) return;
    const profile = JSON.parse(raw);
    if (!ownerSelectors.isDemoShowcase(profile)) return;
    localStorage.removeItem(OWNER_PROFILE_KEY);
    ownerProfileSlot.clear?.();
    ownerProfileSlot.invalidate?.();
  } catch {
    /* ignore */
  }
}

function saveOwnerProfile(profile) {
  return ownerController.save(profile);
}

function ownerProfileHasAny(profile) {
  return ownerController.hasAny(profile);
}

function formatPetShareLines(pet) {
  if (!emergencyRenderer) return [];
  return emergencyRenderer.buildPetShareLines(pet, {
    speciesLabelOf,
    breedLabelOf,
    genderLabelOf,
    ageLabelOf,
  });
}

/** D: copy-card join already in emergencyRenderer.buildCopyCardText; facade wires only. */
function buildEmergencyCopyText(pet) {
  const payload = emergencySelectors.copyPayload(pet, {
    profile: loadOwnerProfile(),
    labelOfAlertType: alertTypeLabel,
    formatMedLine,
    noneLabel: t("none"),
    lineTextOfAlert: alertLineText,
  });
  const ownerLines = formatOwnerCopyLines(payload.owner);
  return emergencyRenderer.buildCopyCardText({
    petLines: formatPetShareLines(pet),
    alertsText: payload.alertsText,
    medsText: payload.medsText,
    ownerLines,
  });
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  if (!ok) throw new Error("copy failed");
}

function formatOwnerCopyLines(profile) {
  if (!emergencyRenderer) return [];
  return emergencyRenderer.buildOwnerCopyLines(ownerSelectors.copyRows(profile));
}

function fillOwnerSettingsForm(profile = loadOwnerProfile()) {
  const map = {
    "owner-name": profile.name,
    "owner-phone": profile.phone,
    "owner-email": profile.email,
    "owner-emergency-name": profile.emergencyName,
    "owner-emergency-phone": profile.emergencyPhone,
    "owner-address": profile.address,
  };
  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  });
}

function readOwnerSettingsForm() {
  return {
    name: document.getElementById("owner-name")?.value.trim() || "",
    phone: document.getElementById("owner-phone")?.value.trim() || "",
    email: document.getElementById("owner-email")?.value.trim() || "",
    emergencyName: document.getElementById("owner-emergency-name")?.value.trim() || "",
    emergencyPhone: document.getElementById("owner-emergency-phone")?.value.trim() || "",
    address: document.getElementById("owner-address")?.value.trim() || "",
  };
}

function renderEmergencyOwner() {
  const el = document.getElementById("e-owner");
  if (!el) return;
  el.innerHTML = emergencyRenderer.buildOwnerBlockHtml(loadOwnerProfile());
}

function renderEmergencyAlertsList(alerts) {
  eAlerts.innerHTML = emergencyRenderer.buildAlertsListHtml(alerts);
}

function renderEmergencyMedsFromList(meds) {
  drugNotesMedByPanelId.clear();
  if (!meds.length) {
    eMeds.innerHTML = emergencyRenderer.buildEmptyMedListHtml();
    return;
  }
  const { html, drugNotePanels } = emergencyRenderer.buildMedListHtml(meds, {
    emergencyPrefix: "",
    variant: "module",
  });
  drugNotePanels.forEach(({ notesId, med }) => {
    drugNotesMedByPanelId.set(notesId, med);
  });
  eMeds.innerHTML = html;
}

function paintEmergencyIdentity(pet) {
  eName.textContent = pet.name;
  eSub.textContent = t("eSub", {
    species: speciesLabelOf(pet),
    breed: breedLabelOf(pet),
    gender: genderLabelOf(pet),
  });
  paintEmergencyBirth(pet);
  paintEmergencyChip(pet);
}

function paintEmergencyBirth(pet) {
  if (!eBirthLine) return;
  const birth = String(pet?.birthDate || "").trim();
  if (!birth) {
    eBirthLine.hidden = true;
    eBirthLine.textContent = "";
    return;
  }
  eBirthLine.hidden = false;
  const age = ageLabelOf(pet);
  eBirthLine.textContent =
    age && age !== t("ageUnknown")
      ? t("eBirthLineAge", { birth, age })
      : t("eBirthLine", { birth });
}

function paintEmergencyChip(pet) {
  if (!eChipLine) return;
  const chip = String(pet?.chipNumber || "").trim() || t("eChipEmpty");
  eChipLine.textContent = t("eChipLine", { chip });
}

function paintEmergencyCardDegradedShell() {
  const alertsBlock = eAlerts?.closest(".e-alerts");
  alertsBlock?.classList.remove("is-critical", "is-caution");
  alertsBlock?.classList.add("is-degraded");
  if (eAlerts) {
    eAlerts.innerHTML = emergencyRenderer.buildDegradedListHtml(
      t("emergencyDegradedAlerts")
    );
  }
  if (eMeds) {
    eMeds.innerHTML = emergencyRenderer.buildDegradedListHtml(
      t("emergencyDegradedMeds")
    );
  }
  if (eWeight) {
    eWeight.textContent = t("emergencyDegradedWeight");
  }
}

/** Local fallback when PetLive / emergency module is unavailable. */
function renderEmergencyCardLocal(pet) {
  PetLiveWeb.shell.renderEmergencyCardLocal({
    pet,
    paintEmergencyIdentity,
    buildWeightHtml: (opts) => emergencyRenderer.buildWeightHtml(opts),
    getAlertsForPet,
    syncAlertNavTone,
    getAlertsBlock: () => eAlerts?.closest(".e-alerts"),
    renderEmergencyAlertsList,
    renderEmergencyMeds,
    renderEmergencyOwner,
    renderEmergencyPetPhoto,
    setWeightHtml: (html) => {
      eWeight.innerHTML = html;
    },
  });
}

/**
 * Prefer modules/emergency-card composition (building-block).
 * Snapshot keeps prototype pets[] as source of truth; injectFail demos degrade.
 */
function renderEmergencyCard(pet) {
  PetLiveWeb.shell.renderEmergencyCard({
    pet,
    generateEmergencyCard: window.PetLive?.emergency?.generateEmergencyCard,
    loadOwnerProfile,
    buildEmergencySnapshot,
    readInjectFail: () =>
      typeof window.PetLive.readInjectFail === "function"
        ? window.PetLive.readInjectFail()
        : {},
    callModule: (fn, fallback) => window.PetLive.call(fn, fallback),
    paintEmergencyIdentity,
    setNameText: (text) => {
      eName.textContent = text;
    },
    degradedSections: (result) => emergencySelectors.degradedSections(result),
    getAlertsForPet,
    syncAlertNavTone,
    getAlertsBlock: () => eAlerts?.closest(".e-alerts"),
    setWeightText: (text) => {
      eWeight.textContent = text;
    },
    setWeightHtml: (html) => {
      eWeight.innerHTML = html;
    },
    buildWeightHtml: (opts) => emergencyRenderer.buildWeightHtml(opts),
    setAlertsHtml: (html) => {
      eAlerts.innerHTML = html;
    },
    buildDegradedListHtml: (msg) => emergencyRenderer.buildDegradedListHtml(msg),
    renderEmergencyAlertsList,
    setMedsHtml: (html) => {
      eMeds.innerHTML = html;
    },
    renderEmergencyMedsFromList,
    renderEmergencyMeds,
    renderEmergencyOwner,
    renderEmergencyPetPhoto,
    t,
  });
}

function applySelectedPet() {
  latestRxUserCollapsed = false;
  renderCoordinator.refreshSelection();
  schedulePetsGraphPersist();
}

const renderCoordinator = PetLiveWeb.shell.createRenderCoordinator({
  safeRender,
  getCurrentPet,
  getActiveScreen: () =>
    app.querySelector(".screen.is-active")?.dataset.screen || "home",
});

renderCoordinator.register("home", "petPicker", () => {
  if (petPickerNeedsRebuild()) renderPetPicker();
  else syncPetPickerSelection();
});
renderCoordinator.register("home", "petHeader", (pet) => {
  renderPetHeader(pet);
});
renderCoordinator.register("home", "parasiteStrip", (pet) => {
  if (pet) renderParasiteStrip(pet);
  else paintParasiteStripEmpty();
});
renderCoordinator.register(
  "home",
  "alertBadge",
  (pet) => {
    if (pet) renderAlertBadge(pet);
    else if (alertCountBtn) alertCountBtn.textContent = t("noAlerts");
  },
  () => {
    if (alertCountBtn) alertCountBtn.textContent = t("noAlerts");
  }
);
renderCoordinator.register(
  "emergency",
  "emergencyCard",
  (pet) => {
    if (pet) renderEmergencyCard(pet);
  },
  paintEmergencyCardDegradedShell
);
renderCoordinator.register("emergency", "emergencyVaccineNav", (pet) => {
  if (pet) renderEmergencyVaccineNav(pet);
});
renderCoordinator.register("emergency", "emergencyLabNav", (pet) => {
  if (pet) renderEmergencyLabNav(pet);
});
renderCoordinator.register("emergency", "emergencyImagingNav", (pet) => {
  if (pet) renderEmergencyImagingNav(pet);
});
renderCoordinator.register(
  "labs",
  "labList",
  (pet) => {
    if (pet) renderLabList(pet);
  },
  () => {
    const list = document.getElementById("lab-list");
    if (list) {
      list.innerHTML = `<li class="lab-list-empty">${t("labEmpty")}</li>`;
    }
  }
);
renderCoordinator.register(
  "imaging",
  "imagingList",
  (pet) => {
    if (pet) renderImagingList(pet);
  },
  () => {
    const list = document.getElementById("imaging-list");
    if (list) {
      list.innerHTML = `<li class="imaging-list-empty"><p>${t(
        "imagingEmpty"
      )}</p></li>`;
    }
  }
);
renderCoordinator.register("lab-add", "labAddForm", (pet) => {
  if (pet) ensureLabAddForPet(pet);
});
renderCoordinator.register(
  "timeline",
  "timeline",
  (pet) => {
    if (pet) renderTimeline(pet);
  },
  () => {
    timelineList.innerHTML = `<li class="tl-item"><div class="tl-body"><p class="tl-note">${t(
      "noVisits"
    )}</p></div></li>`;
  }
);
renderCoordinator.register(
  "alerts",
  "alerts",
  (pet) => {
    if (pet) renderAlerts(pet);
  },
  () => {
    if (alertSections) {
      alertSections.innerHTML = `<p class="alert-section-empty">${t("noAlertItems")}</p>`;
    } else if (alertList) {
      alertList.innerHTML = alertsRenderer.buildFlatEmptyListHtml();
    }
  }
);
renderCoordinator.register("vaccines", "vaccineForm", (pet) => {
  if (pet) refreshVaccineForm(pet);
});
renderCoordinator.register(
  "vaccines",
  "vaccines",
  (pet) => {
    if (pet) renderVaccineList(pet);
  },
  () => {
    vaccineList.innerHTML = vaccineRenderer.buildEmptyListHtml();
  }
);
renderCoordinator.register("archive", "archiveList", () => renderArchiveList());

const PET_TONES = [
  "linear-gradient(160deg, #7fafa0, #355f54)",
  "linear-gradient(160deg, #5c6b74, #243039)",
  "linear-gradient(160deg, #d4a06a, #8a5a2b)",
  "linear-gradient(160deg, #8aa6c1, #3a5166)",
  "linear-gradient(160deg, #c4a0b0, #6b4558)",
  "linear-gradient(160deg, #9bb87a, #4a6435)",
];

const petsLifecycle = PetLiveWeb.domains.pets.createLifecycle({
  pets,
  archivedPets,
  tones: PET_TONES,
});

const petsLabels = PetLiveWeb.domains.pets.createLabels({
  label: (key, params) => t(key, params),
});

function formatAgeLabel(birthDate) {
  return petsLabels.formatAgeLabel(birthDate);
}

function formatGenderLabel(gender, isNeutered) {
  return petsLabels.formatGenderLabel(gender, isNeutered);
}

const breedSelectors = PetLiveWeb.domains.breed.createSelectors({
  CUSTOM_VALUE: BREED_CUSTOM_VALUE,
  getListForSpecies: getBreedListForSpecies,
  getGroupsForSpecies: getBreedGroupsForSpecies,
  getCommonGroupId: getCommonBreedGroupId,
  findByValue: findBreedByValue,
  search: searchBreeds,
  labelOf: breedOptionLabel,
});
const breedController = PetLiveWeb.domains.breed.createController();

function toggleBreedCustomField() {
  const speciesEl = document.getElementById("pet-species");
  const breedSelectField = document.getElementById("breed-select-field");
  const breedSearchField = document.getElementById("breed-search-field");
  const breedSelect = document.getElementById("breed-select");
  const breedSearch = document.getElementById("breed-search");
  const breedExpandToggle = document.getElementById("breed-expand-toggle");
  if (!speciesEl || !breedSelect || !breedSearch) return;

  if (speciesEl.value === "other") {
    if (breedSelectField) breedSelectField.hidden = true;
    if (breedSearchField) breedSearchField.hidden = false;
    breedSearch.required = true;
    if (breedExpandToggle) breedExpandToggle.hidden = true;
    hideBreedResults();
    return;
  }

  const showCustom = breedSelect.value === BREED_CUSTOM_VALUE;
  if (breedSelectField) breedSelectField.hidden = false;
  if (breedSearchField) breedSearchField.hidden = false;
  breedSearch.required = showCustom;
  if (breedExpandToggle) breedExpandToggle.hidden = false;
}

let suppressBreedSearchInput = false;
let breedResultsBlurTimer = 0;

function hideBreedResults() {
  const breedResults = document.getElementById("breed-results");
  if (!breedResults) return;
  breedResults.hidden = true;
  breedResults.innerHTML = "";
}

function updateBreedSearchFace(value) {
  const breedSearch = document.getElementById("breed-search");
  if (!breedSearch) return;
  const speciesEl = document.getElementById("pet-species");
  const species = speciesEl ? speciesEl.value : "";

  suppressBreedSearchInput = true;
  const resolved = breedSelectors.resolveSearchFaceValue(value, species);
  if (resolved.setValue) {
    breedSearch.value = resolved.display;
  }
  // Custom / empty: leave typed text (caller may set value explicitly).
  suppressBreedSearchInput = false;
}

function renderBreedResults(list, query) {
  const breedResults = document.getElementById("breed-results");
  if (!breedResults || !breedRenderer) return;
  const built = breedRenderer.buildBreedResultsHtml(list, query);
  if (built.hidden) {
    hideBreedResults();
    return;
  }
  breedResults.hidden = false;
  breedResults.innerHTML = built.html;
}

function updateBreedExpandToggle() {
  const toggle = document.getElementById("breed-expand-toggle");
  if (!toggle) return;
  const speciesEl = document.getElementById("pet-species");
  const species = speciesEl ? speciesEl.value : "";
  const show = species === "dog" || species === "cat";
  toggle.hidden = !show;
  toggle.setAttribute(
    "aria-expanded",
    breedController.isExpanded() ? "true" : "false"
  );
  const label = toggle.querySelector("[data-i18n]") || toggle;
  const key = breedController.isExpanded() ? "breedCollapse" : "breedExpandAll";
  label.setAttribute("data-i18n", key);
  label.textContent = typeof t === "function" ? t(key) : label.textContent;
}

function renderCollapsedBreedChips(species, selectedValue) {
  return breedRenderer.buildCollapsedChipsHtml(species, selectedValue);
}

function renderExpandedBreedChips(species) {
  return breedRenderer.buildExpandedGroupsHtml(species);
}

function setSelectedBreed(value) {
  const breedSelect = document.getElementById("breed-select");
  const breedChips = document.getElementById("breed-chips");
  if (!breedSelect || !breedChips) return;

  breedSelect.value = value || "";

  // Collapsed preview = common ∪ current selected ∪ __custom__ (deduped).
  // Rebuild on every selection change so a previously pinned non-common chip
  // is dropped when the user picks another visible chip (QA-001).
  if (!breedController.isExpanded() && typeof getBreedGroupsForSpecies === "function") {
    const speciesEl = document.getElementById("pet-species");
    const species = speciesEl ? speciesEl.value : "";
    if (species && species !== "other") {
      breedChips.innerHTML = renderCollapsedBreedChips(species, value || "");
      breedChips.classList.add("is-collapsed");
      breedChips.classList.remove("is-expanded");
    }
  }

  breedChips.querySelectorAll(".chip").forEach((chip) => {
    const on = chip.dataset.breed === value;
    chip.classList.toggle("is-on", on);
    chip.setAttribute("aria-selected", on ? "true" : "false");
  });
  updateBreedSearchFace(value);
  toggleBreedCustomField();
}

function syncBreedFields({ keepSelection = true, resetExpanded = false } = {}) {
  PetLiveWeb.shell.syncBreedFields({
    speciesEl: document.getElementById("pet-species"),
    breedSelect: document.getElementById("breed-select"),
    breedSearch: document.getElementById("breed-search"),
    breedChips: document.getElementById("breed-chips"),
    keepSelection,
    resetExpanded,
    resetExpandState: () => breedController.reset(),
    getBreedListForSpecies,
    getBreedGroupsForSpecies,
    isExpanded: () => breedController.isExpanded(),
    isValidSelection: (species, previous) =>
      breedSelectors.isValidSelection(species, previous),
    customValue: BREED_CUSTOM_VALUE,
    renderExpandedBreedChips,
    renderCollapsedBreedChips,
    buildBreedChipHtml: (breed) => breedRenderer.buildBreedChipHtml(breed),
    setSelectedBreed,
    hideBreedResults,
    updateBreedExpandToggle,
    toggleBreedCustomField,
  });
}

function resolveBreedFromForm(form) {
  return breedSelectors.resolveDisplayName({
    species: form.species.value,
    breedSelectValue: form.breedSelect.value,
    customText: form.breedCustom.value,
  });
}

function resolveBreedKeyFromForm(form) {
  return breedSelectors.resolveKey({
    species: form.species.value,
    breedSelectValue: form.breedSelect.value,
  });
}

function readPetIdentityFromForm(form) {
  return PetLiveWeb.domains.pets.buildPetIdentity(
    {
      name: form.petName.value.trim(),
      species: form.species.value,
      breedKey: resolveBreedKeyFromForm(form),
      breed: resolveBreedFromForm(form),
      gender: form.gender.value,
      isNeutered: form.isNeutered.value,
      birthDate: form.birthDate.value,
      weight: form.weight.value,
      weightDate: form.weightDate.value,
      chipNumber: form.chipNumber.value.trim(),
    },
    { label: (key) => t(key) }
  );
}

function validatePetFormFields(form) {
  return PetLiveWeb.domains.pets.validatePetIdentityFields({
    name: form.petName.value.trim(),
    breed: resolveBreedFromForm(form),
    weight: Number(form.weight.value),
    birthDate: form.birthDate.value,
    weightDate: form.weightDate.value,
    todayISO: todayISODate(),
  });
}

/** Keep visible date faces in sync; native type=date stays for iOS picker + form values. */
function syncDateProxies(root = document) {
  root.querySelectorAll(".date-proxy").forEach((proxy) => {
    const native = proxy.querySelector("input.date-proxy-native, input[type='date']");
    const face = proxy.querySelector("input.date-proxy-face");
    if (!native || !face) return;
    const sync = () => {
      face.value = native.value || "";
    };
    if (proxy.dataset.proxyBound !== "1") {
      native.addEventListener("input", sync);
      native.addEventListener("change", sync);
      proxy.dataset.proxyBound = "1";
    }
    sync();
  });
}

function createPetFromForm(form) {
  return petsLifecycle.createPet(readPetIdentityFromForm(form));
}

let editingPetId = null;

function paintPetFormMode() {
  const title = document.getElementById("pet-form-title");
  const sub = document.getElementById("pet-form-sub");
  const submit = document.getElementById("pet-form-submit");
  const screen = document.querySelector('[data-screen="add-pet"]');
  const editing = Boolean(editingPetId);
  if (title) title.textContent = t(editing ? "editPetTitle" : "addPetTitle");
  if (sub) sub.textContent = t(editing ? "editPetSub" : "addPetSub");
  if (submit) submit.textContent = t(editing ? "savePet" : "createPet");
  if (screen) {
    const ariaKey = editing ? "editPetTitle" : "addPetTitle";
    screen.setAttribute("aria-label", t(ariaKey));
  }
}

function fillPetFormFromPet(pet) {
  const form = document.getElementById("pet-form");
  if (!form || !pet) return;
  form.petName.value = pet.name || "";
  form.species.value = pet.species || "dog";
  form.gender.value = pet.gender || "unknown";
  form.isNeutered.value = pet.isNeutered || "unknown";
  form.birthDate.value = pet.birthDate || "";
  form.weight.value = pet.weight ?? "";
  form.weightDate.value = pet.weightDate || todayISODate();
  form.chipNumber.value = pet.chipNumber || "";
  syncDateProxies(form);
  syncBreedFields({ keepSelection: false, resetExpanded: true });
  const breedKey = pet.breedKey || "";
  if (pet.species === "other" || breedKey === BREED_CUSTOM_VALUE) {
    setSelectedBreed(BREED_CUSTOM_VALUE);
    form.breedCustom.value = pet.breed || "";
  } else {
    setSelectedBreed(breedKey);
    if (!form.breedSelect.value && pet.breed) {
      setSelectedBreed(BREED_CUSTOM_VALUE);
      form.breedCustom.value = pet.breed;
    }
  }
}

function applyPetFromForm(pet, form) {
  return petsLifecycle.updatePet(pet, readPetIdentityFromForm(form));
}

function openCreatePetForm() {
  editingPetId = null;
  const form = document.getElementById("pet-form");
  form.reset();
  form.weightDate.value = todayISODate();
  form.birthDate.value = "";
  syncDateProxies(form);
  syncBreedFields({ keepSelection: false, resetExpanded: true });
  paintPetFormMode();
  go("add-pet");
}

function openEditCurrentPet() {
  const pet = getCurrentPet();
  if (!pet) return;
  editingPetId = pet.id;
  fillPetFormFromPet(pet);
  paintPetFormMode();
  go("add-pet");
}

function selectPet(petId) {
  return petsController.select(petId);
  // No toast on switch — selection chrome is enough; toast felt like lag on phone.
}

function selectPetForced(petId) {
  return petsController.selectForced(petId);
}

const petSelectionPaintSamples = [];
let petSelectionStartedAt = null;
const petsController = PetLiveWeb.domains.pets.createController({
  state: appState,
  beforeSelect: () => {
    resetAlertForm();
    petSelectionStartedAt =
      typeof performance !== "undefined" ? performance.now() : null;
  },
  afterSelect: (pet) => {
    currentPetId = pet?.id || appState.getCurrentPetId();
    // Drop in-flight med session so Pet A pending / complete-drugs cannot write onto Pet B.
    pendingMeds = [];
    completingVisitRef = null;
    pendingImagingVisitIndex = null;
    pendingXrayPhotos = [];
    pendingUsPhotos = [];
    Object.keys(compoundColorByGroup).forEach((key) => {
      delete compoundColorByGroup[key];
    });
    applySelectedPet();
    if (typeof renderPendingMeds === "function") renderPendingMeds();
    if (typeof updateMedModeHint === "function") updateMedModeHint();
    if (petSelectionStartedAt != null) {
      const startedAt = petSelectionStartedAt;
      requestAnimationFrame(() => {
        petSelectionPaintSamples.push(performance.now() - startedAt);
        if (petSelectionPaintSamples.length > 100) {
          petSelectionPaintSamples.shift();
        }
      });
    }
  },
});

const visitsController = PetLiveWeb.domains.visits.createController({
  clinicLabelOf: (visit) => visitClinicLabel(visit),
});
const imagingController = PetLiveWeb.domains.imaging.createController();
const drugsAdapter = PetLiveWeb.domains.drugs.createAdapter({
  searchDrugsApi: (query) => window.PetLive?.drug?.searchDrugs?.(query),
  getDrugByIdApi: (id) => window.PetLive?.drug?.getDrugById?.(id),
  localDrugs: () => (typeof drugs !== "undefined" ? drugs : []),
});
const timelineSelectors = PetLiveWeb.domains.timeline.createSelectors({
  visits: visitsController,
  imaging: imagingController,
});
const timelineViewHelpers = PetLiveWeb.domains.timeline.createViewHelpers({
  findDrugByName: findDrugByMedName,
});
const medicationsLabels = PetLiveWeb.domains.medications.createLabels({
  label: (key, params) => t(key, params),
});
function formatFrequencyLabel(frequency) {
  return medicationsLabels.formatFrequencyLabel(frequency);
}
function expandFrequencyInText(text) {
  return medicationsLabels.expandFrequencyInText(text);
}
function compoundFormLabel(form) {
  return medicationsLabels.compoundFormLabel(form);
}
function compoundFormBadge(form) {
  return medicationsLabels.compoundFormBadge(form);
}
function compoundChipToneClass(form) {
  return medicationsLabels.compoundChipToneClass(form);
}
const medicationsSelectors = PetLiveWeb.domains.medications.createSelectors({
  formatFrequencyLabelOf: formatFrequencyLabel,
  formatDosageUnitLabelOf: formatDosageUnitLabel,
  durationDaysLabelOf: (n) => t("durationDaysCount", { n }),
  pendingDoseLabelOf: () => t("medDetailsPending"),
  formatShortDateOf: formatShortDate,
  getMedEndDate,
  medCourseOf: ({ start, days, end }) => t("medCourse", { start, days, end }),
  expandFrequencyInTextOf: expandFrequencyInText,
});
const medicationsController = PetLiveWeb.domains.medications.createController({
  visits: visitsController,
  searchDrugs: (query) => drugsAdapter.searchDrugs(query),
  resolveEnrichedDrug: (drugOrId) => drugsAdapter.resolveEnrichedDrug(drugOrId),
  formatFrequencyLabelOf: formatFrequencyLabel,
  durationDaysLabelOf: (n) => t("durationDaysCount", { n }),
  compoundFormLabelOf: compoundFormLabel,
  formatDraftDoseLineOf: (draft) =>
    medicationsSelectors.formatDraftDoseLine(draft),
});

const VACCINE_PROTECTION_META = PetLiveWeb.domains.vaccines.PROTECTION_META;

function findKeyByLocalizedName(name) {
  if (!name || typeof I18N !== "object") return "";
  for (const table of Object.values(I18N)) {
    for (const key of Object.keys(VACCINE_PROTECTION_META)) {
      if (table[key] === name) return key;
    }
  }
  return "";
}

function isRabiesLocalizedName(name) {
  const lower = String(name || "").trim().toLowerCase();
  if (!lower) return false;
  if (lower === "狂犬病" || lower.includes("狂犬")) return true;
  if (lower.includes("rabies")) return true;
  if (lower.includes("광견병")) return true;
  if (typeof I18N === "object") {
    for (const table of Object.values(I18N)) {
      const label = String(table?.vRabies || "").trim().toLowerCase();
      if (label && lower === label) return true;
    }
  }
  return false;
}

const vaccinesSelectors = PetLiveWeb.domains.vaccines.createSelectors({
  daysUntil,
  findKeyByLocalizedName,
  isRabiesLocalizedName,
});
const vaccinesController = PetLiveWeb.domains.vaccines.createController({
  selectors: vaccinesSelectors,
});
const vaccinesLabels = PetLiveWeb.domains.vaccines.createLabels({
  label: (key, params) => t(key, params),
});

function getNextVaccine(pet) {
  return vaccinesSelectors.getNextVaccine(pet);
}
function getVaccineProtectionStatus(nextDate) {
  return vaccinesSelectors.getVaccineProtectionStatus(nextDate);
}
function isVaccineApproaching(nextDate) {
  return vaccinesSelectors.isVaccineApproaching(nextDate);
}
function addYears(isoDate, years) {
  return vaccinesSelectors.addYears(isoDate, years);
}
function todayISODate() {
  return vaccinesSelectors.todayISODate();
}
function resolveVaccineKey(vaccine) {
  return vaccinesSelectors.resolveVaccineKey(vaccine);
}
function getVaccineProtectionGroup(vaccine) {
  return vaccinesSelectors.getVaccineProtectionGroup(vaccine);
}
function getVaccineTier(vaccine) {
  return vaccinesSelectors.getVaccineTier(vaccine);
}
function getVaccineDisplayRank(vaccine) {
  return vaccinesSelectors.getVaccineDisplayRank(vaccine);
}
function compareVaccineCurrency(a, b) {
  return vaccinesSelectors.compareVaccineCurrency(a, b);
}
function getCurrentVaccinesByGroup(pet) {
  return vaccinesSelectors.getCurrentVaccinesByGroup(pet);
}
function getVaccineSuccessor(pet, vaccine) {
  return vaccinesSelectors.getVaccineSuccessor(pet, vaccine);
}
function vaccineStatusUrgency(nextDate) {
  return vaccinesSelectors.vaccineStatusUrgency(nextDate);
}
function compareVaccinesForStatusDisplay(a, b) {
  return vaccinesSelectors.compareVaccinesForStatusDisplay(a, b);
}
function compareVaccinesForList(pet, a, b) {
  return vaccinesSelectors.compareVaccinesForList(pet, a, b);
}
function isRabiesVaccineEntry(entry) {
  return vaccinesSelectors.isRabiesVaccineEntry(entry);
}
function vaccineAllowedForPet(pet, entry) {
  return vaccinesSelectors.vaccineAllowedForPet(pet, entry);
}
function vaccineStatusForNext(next) {
  return vaccinesSelectors.vaccineStatusForNext(next);
}
function upsertPetVaccines(pet, entries) {
  return vaccinesController.upsertPetVaccines(pet, entries);
}

const IMAGING_PHOTOS_MAX = imagingController.IMAGING_PHOTOS_MAX;

const VIEWPORT_DEFAULT =
  "width=device-width, initial-scale=1, viewport-fit=cover";
const VIEWPORT_LOCKED =
  "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

function resetPageScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  if (window.visualViewport) {
    window.scrollTo(0, Math.max(0, window.visualViewport.offsetTop || 0));
  }
}

function resetPetPickerScroll() {
  if (!petPicker) return;
  const selected = currentPetId
    ? petPicker.querySelector(`.pet-option[data-pet-id="${currentPetId}"]`)
    : null;
  const addBtn = petPicker.querySelector("#add-pet-btn");
  if (selected) {
    let target =
      selected.offsetLeft -
      (petPicker.clientWidth - selected.offsetWidth) / 2;
    // Keep the trailing “+ 新增” card reachable (don’t scroll it fully away).
    if (addBtn) {
      const maxKeepAdd =
        addBtn.offsetLeft + addBtn.offsetWidth - petPicker.clientWidth + 12;
      if (maxKeepAdd > 0) target = Math.min(target, maxKeepAdd);
    }
    petPicker.scrollLeft = Math.max(0, target);
  } else {
    petPicker.scrollLeft = 0;
  }
}

/**
 * Every SPA screen change must land at the default page width (scale=1),
 * not the user's previous pinch-zoom. iOS/Android keep zoom across
 * show/hide screens; briefly locking the viewport meta forces a reset.
 * Zoom is re-enabled after so pinch still works on the new screen.
 */
function resetViewportZoom() {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    resetPageScroll();
    return;
  }

  meta.setAttribute("content", VIEWPORT_LOCKED);
  resetPageScroll();

  window.setTimeout(() => {
    meta.setAttribute("content", VIEWPORT_DEFAULT);
    resetPageScroll();
  }, 300);
}

const shellNavigation = PetLiveWeb.shell.createNavigation({
  app,
  beforeLeave: (currentScreen, nextScreen) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    closePetPhotoCrop();
    closeProofLightbox();
    setVaxHelpOpen(false);

    if (currentScreen === "timeline" && nextScreen !== "timeline") {
      latestRxUserCollapsed = false;
    }

    // Fresh visit flow should not inherit an abandoned pending Rx list.
    if (nextScreen === "add-visit" && currentScreen !== "add-med") {
      pendingMeds = [];
      clearLiveProofPhotos();
      completingVisitRef = null;
      clearMedDrugFields();
      renderPendingMeds();
      setMedEntryMode("photo");
    }
  },
  onEnter: (screen) => {
    renderCoordinator.flush(screen);
    if (screen === "home") {
      closeAppNavMenu();
      closeAccountMenu();
      resetPageScroll();
      resetPetPickerScroll();
    }
    if (screen === "parasite") {
      const pet = getCurrentPet();
      if (pet) safeRender("parasiteScreen", () => fillParasiteScreen(pet));
    }
    if (screen === "owner-settings") fillOwnerSettingsForm();
    if (screen === "manual") paintManualScreen();
  },
});

function isDebugAppHatch() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    return params.get("app") === "1" || params.get("screen") === "home";
  } catch {
    return false;
  }
}

function go(screen, options = {}) {
  // Google gate: unsigned users stay on A (intro), except demo / debug hatch.
  if (
    !DEMO_MODE &&
    !isDebugAppHatch() &&
    screen !== "intro" &&
    !liveGoogleSignedIn()
  ) {
    if (shellNavigation.getActiveScreen?.() === "intro") return false;
    screen = "intro";
    options = { ...options, replace: true };
  }
  const needsPet = [
    "emergency",
    "add-visit",
    "timeline",
    "alerts",
    "vaccines",
    "parasite",
    "labs",
    "imaging",
    "add-med",
    "med-proof",
    "imaging-proof",
    "lab-add",
  ];
  if (!DEMO_MODE && needsPet.includes(screen) && !getCurrentPet()) {
    showToast(t("toastNeedPetFirst"));
    return false;
  }
  closeAppNavMenu();
  closeAccountMenu();
  const changed = shellNavigation.go(screen, options);
  if (!changed) return false;
  // Instant jump — smooth scroll made every screen change feel delayed on phone.
  resetPageScroll();
  resetViewportZoom();
  return true;
}

function goBack() {
  const active = app.querySelector(".screen.is-active")?.dataset.screen;
  if (active === "add-pet" && editingPetId) {
    editingPetId = null;
    paintPetFormMode();
  }
  const changed = shellNavigation.back();
  if (changed) {
    resetPageScroll();
    resetViewportZoom();
  }
  return changed;
}

function clearNavigationHistory() {
  shellNavigation.clearHistory();
}

function glassChromeNavAccountMarkup() {
  return PetLiveWeb.shell.glassChromeNavAccountMarkup();
}

function glassChromeActionsMarkup() {
  return PetLiveWeb.shell.glassChromeActionsMarkup();
}

function enhanceGlassScreenHeads() {
  document
    .querySelectorAll('[data-screen]:not([data-screen="home"]) > .screen-head')
    .forEach((head) => {
      const existing = head.querySelector("[data-glass-chrome]");
      if (existing) {
        if (!existing.querySelector(".app-nav-menu")) {
          existing.insertAdjacentHTML("beforeend", glassChromeNavAccountMarkup());
        }
        return;
      }
      head.insertAdjacentHTML("beforeend", glassChromeActionsMarkup());
    });
}

function syncAppNavBtnIcons(open) {
  PetLiveWeb.shell.syncAppNavBtnIcons(document, open);
}

function closeAppNavMenu() {
  PetLiveWeb.shell.closeAppNavMenu(document);
}

function setAppNavMenuOpen(open, anchorBtn) {
  PetLiveWeb.shell.setAppNavMenuOpen(document, window, open, anchorBtn);
}

function paintManualScreen() {
  const empty = !pets.length || isSeedOnlyPets(pets);
  const primary = document.getElementById("manual-cta-primary");
  const addAlt = document.getElementById("manual-cta-add-alt");
  if (primary) {
    primary.setAttribute("data-go", empty ? "add-pet" : "home");
    primary.setAttribute("data-i18n", empty ? "manualCtaAddPet" : "manualCtaHome");
    primary.textContent = t(empty ? "manualCtaAddPet" : "manualCtaHome");
  }
  if (addAlt) {
    // When account is empty, primary already goes to add-pet; offer home as alt.
    addAlt.setAttribute("data-go", empty ? "home" : "add-pet");
    addAlt.setAttribute("data-i18n", empty ? "manualCtaHome" : "manualCtaAddPet");
    addAlt.textContent = t(empty ? "manualCtaHome" : "manualCtaAddPet");
  }
}

function initAppNavMenu() {
  // #nav-manual-btn already has data-go="manual"; shell closes panel on click.
  PetLiveWeb.shell.initAppNavMenu(document, {
    win: window,
    closeAccountMenu,
  });
}

document.querySelectorAll("[data-go]").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    if (event.target.closest(".e-vax-help, .e-vax-help-pop")) return;
    if (btn.dataset.parasiteKind) {
      pendingParasiteFocus = btn.dataset.parasiteKind;
    }
    go(btn.getAttribute("data-go"));
  });
  if (btn.id === "e-vaccine-btn") {
    btn.addEventListener("keydown", (event) => {
      if (event.target.closest?.(".e-vax-help")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      go(btn.getAttribute("data-go"));
    });
  }
});

function setVaxHelpOpen(open) {
  const helpBtn = document.getElementById("e-vax-help");
  const pop = document.getElementById("e-vax-help-pop");
  if (!helpBtn || !pop) return;
  pop.hidden = !open;
  helpBtn.setAttribute("aria-expanded", open ? "true" : "false");
}

document.getElementById("e-vax-help")?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  const pop = document.getElementById("e-vax-help-pop");
  setVaxHelpOpen(Boolean(pop?.hidden));
});

document.getElementById("e-vax-help-pop")?.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", (event) => {
  if (event.target.closest("#e-vax-help, #e-vax-help-pop")) return;
  setVaxHelpOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProofLightbox();
    setVaxHelpOpen(false);
  }
});

document.getElementById("proof-lightbox")?.addEventListener("click", (event) => {
  if (event.target.closest("[data-proof-lightbox-close]")) {
    closeProofLightbox();
  }
});

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", goBack);
});

petManageBtn.addEventListener("click", () => {
  setManageMode(!isManagingPets);
});

petAddBtn?.addEventListener("click", () => {
  if (isManagingPets) return;
  openCreatePetForm();
});

petPicker.addEventListener("click", (event) => {
  const archiveBtnOnPet = event.target.closest("[data-archive-pet-id]");
  if (archiveBtnOnPet) {
    event.preventDefault();
    event.stopPropagation();
    openArchivePetFlow(archiveBtnOnPet.dataset.archivePetId);
    return;
  }

  const removeBtn = event.target.closest("[data-remove-pet-id]");
  if (removeBtn) {
    event.preventDefault();
    event.stopPropagation();
    openRemovePetFlow(removeBtn.dataset.removePetId);
    return;
  }

  const addBtn = event.target.closest("#add-pet-btn");
  if (addBtn) {
    if (isManagingPets) return;
    openCreatePetForm();
    return;
  }

  if (isManagingPets) {
    showToast(t("toastManageMode"));
    return;
  }

  const option = event.target.closest("[data-pet-id]");
  if (!option) return;
  selectPet(option.dataset.petId);
});

document.getElementById("archive-pet-back").addEventListener("click", () => {
  cancelArchivePetFlow();
});

document.getElementById("archive-pet-cancel").addEventListener("click", () => {
  cancelArchivePetFlow();
});

document
  .getElementById("archive-pet-form")
  .addEventListener("submit", confirmArchivePet);

document.getElementById("remove-pet-back").addEventListener("click", () => {
  if (removeStep > 1) {
    setRemoveStep(removeStep - 1);
    return;
  }
  cancelRemovePetFlow();
});

document.querySelectorAll("[data-remove-cancel]").forEach((btn) => {
  btn.addEventListener("click", cancelRemovePetFlow);
});

document.querySelectorAll("[data-remove-prev]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (removeStep > 1) setRemoveStep(removeStep - 1);
  });
});

document.querySelectorAll("[data-remove-next]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (removeStep < 3) setRemoveStep(removeStep + 1);
  });
});

document
  .getElementById("remove-pet-confirm-input")
  .addEventListener("input", (event) => {
    const pet = getPendingRemovePet();
    const confirmBtn = document.getElementById("remove-pet-confirm-btn");
    confirmBtn.disabled = !pet || event.target.value.trim() !== pet.name;
  });

document
  .getElementById("remove-pet-confirm-btn")
  .addEventListener("click", confirmRemovePet);

petPicker.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const options = [...petPicker.querySelectorAll("[data-pet-id]")];
  const index = options.findIndex((el) => el.dataset.petId === currentPetId);
  if (index < 0) return;

  event.preventDefault();
  let nextIndex = index;
  if (event.key === "ArrowRight") nextIndex = Math.min(index + 1, options.length - 1);
  if (event.key === "ArrowLeft") nextIndex = Math.max(index - 1, 0);
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = options.length - 1;
  selectPet(options[nextIndex].dataset.petId);
  options[nextIndex].focus();
});

document.querySelectorAll("#symptom-chips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const tag = chip.dataset.tag;
    if (selectedTags.has(tag)) {
      selectedTags.delete(tag);
      chip.classList.remove("is-on");
    } else {
      selectedTags.add(tag);
      chip.classList.add("is-on");
    }
  });
});

document.querySelectorAll("#unit-chips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const unit = chip.dataset.unit || "unrecorded";
    // Always keep one selection; re-clicking a concrete unit returns to 未紀錄.
    if (chip.classList.contains("is-on") && unit !== "unrecorded") {
      setMedUnitChip("unrecorded");
      return;
    }
    setMedUnitChip(unit);
  });
});

document.querySelectorAll("#freq-chips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const freq = chip.dataset.freq || "unrecorded";
    if (chip.classList.contains("is-on") && freq !== "unrecorded") {
      setMedFreqChip("unrecorded");
      return;
    }
    setMedFreqChip(freq);
  });
});

document.querySelectorAll("#compound-chips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const next = chip.classList.contains("is-on") ? "" : chip.dataset.compound;
    setMedCompoundChip(next);
  });
});

document.getElementById("compound-color-swatches")?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-compound-color]");
  if (!btn) return;
  setMedCompoundColor(btn.dataset.compoundColor);
});

const drugSearch = document.getElementById("drug-search");
const drugResults = document.getElementById("drug-results");
const selectedDrugEl = document.getElementById("selected-drug");
const drugInfoCard = document.getElementById("drug-info-card");
const drugInfoPurpose = document.getElementById("drug-info-purpose");
const drugInfoSideEffects = document.getElementById("drug-info-side-effects");
const drugInfoPrecautions = document.getElementById("drug-info-precautions");
const clinicSearch = document.getElementById("clinic-search");
const clinicResults = document.getElementById("clinic-results");
const selectedClinicEl = document.getElementById("selected-clinic");
const clinicNameInput = document.getElementById("clinic-name");
const clinicAnonymousInput = document.getElementById("clinic-anonymous");

function searchClinics(query) {
  return clinicsCatalog.searchClinics(query, pets);
}

function renderClinicResults(list) {
  if (!medicationsRenderer) return;
  const built = medicationsRenderer.buildClinicResultsHtml(list);
  clinicResults.hidden = built.hidden;
  clinicResults.innerHTML = built.html;
}

function setSelectedClinic(clinic) {
  selectedClinic = clinic;
  if (!clinic) {
    clinicNameInput.value = "";
    clinicAnonymousInput.value = "false";
    selectedClinicEl.hidden = true;
    selectedClinicEl.textContent = "";
    selectedClinicEl.classList.remove("is-anonymous");
    return;
  }

  const name = clinicNameOf(clinic);
  clinicSearch.value = name;
  clinicNameInput.value = name;
  clinicAnonymousInput.value = clinic.anonymous ? "true" : "false";
  selectedClinicEl.hidden = false;
  selectedClinicEl.classList.toggle("is-anonymous", clinic.anonymous);
  selectedClinicEl.textContent = clinic.anonymous
    ? t("selectedClinicAnon")
    : t("selectedClinic", { name });
  clinicResults.hidden = true;
}

clinicSearch.addEventListener("focus", () => {
  renderClinicResults(searchClinics(clinicSearch.value));
});

clinicSearch.addEventListener("input", () => {
  const query = clinicSearch.value;
  selectedClinic = null;
  clinicNameInput.value = "";
  clinicAnonymousInput.value = "false";
  selectedClinicEl.hidden = true;
  selectedClinicEl.classList.remove("is-anonymous");
  renderClinicResults(searchClinics(query));
});

clinicResults.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-clinic-id]");
  if (!btn) return;
  const clinic = getClinicDirectory().find((item) => item.id === btn.dataset.clinicId);
  if (!clinic) return;
  setSelectedClinic(clinic);
});

function searchDrugs(query) {
  return medicationsController.searchDrugs(query);
}

/** Prefer the enriched local seed so side effects / precautions always show. */
function resolveEnrichedDrug(drugOrId) {
  return medicationsController.resolveEnrichedDrug(drugOrId);
}

function renderDrugInfoCard(drug) {
  if (!drugInfoCard || !medicationsRenderer) return;
  const full = drug ? resolveEnrichedDrug(drug) : null;
  const built = medicationsRenderer.buildDrugInfoListsHtml(full);
  if (!built.visible) {
    drugInfoCard.hidden = true;
    if (drugInfoPurpose) drugInfoPurpose.textContent = "";
    if (drugInfoSideEffects) drugInfoSideEffects.innerHTML = "";
    if (drugInfoPrecautions) drugInfoPrecautions.innerHTML = "";
    return;
  }

  drugInfoPurpose.textContent = built.purposeText;
  drugInfoSideEffects.innerHTML = built.sideEffectsHtml;
  drugInfoPrecautions.innerHTML = built.precautionsHtml;
  drugInfoCard.hidden = false;
  drugInfoCard.removeAttribute("hidden");
  drugInfoCard.classList.add("is-visible");
  requestAnimationFrame(() => {
    drugInfoCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function renderDrugResults(list) {
  if (!medicationsRenderer) return;
  const built = medicationsRenderer.buildDrugResultsHtml(list);
  drugResults.hidden = built.hidden;
  drugResults.innerHTML = built.html;
}

let suppressDrugSearchInput = false;

drugSearch.addEventListener("input", () => {
  if (suppressDrugSearchInput) return;
  selectedDrug = null;
  selectedDrugEl.hidden = true;
  renderDrugInfoCard(null);
  renderDrugResults(searchDrugs(drugSearch.value));
});

drugResults.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-drug-id]");
  if (!btn) return;
  selectedDrug = resolveEnrichedDrug(btn.dataset.drugId);
  if (!selectedDrug && window.PetLive?.drug?.getDrugById) {
    const result = window.PetLive.drug.getDrugById(btn.dataset.drugId);
    if (result?.ok) selectedDrug = resolveEnrichedDrug(result.data) || result.data;
  }
  if (!selectedDrug) return;
  drugResults.hidden = true;
  suppressDrugSearchInput = true;
  drugSearch.value = selectedDrug.genericName;
  suppressDrugSearchInput = false;
  selectedDrugEl.hidden = false;
  selectedDrugEl.textContent = t("selectedDrug", {
    name: `${selectedDrug.genericName}${
      selectedDrug.brandNameZh ? ` / ${selectedDrug.brandNameZh}` : ""
    }`,
  });
  // Stay on manual entry so the safety card is visible
  if (medEntryMode !== "manual") setMedEntryMode("manual");
  renderDrugInfoCard(selectedDrug);
});

document.getElementById("visit-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const clinicGate = PetLiveWeb.domains.visits.validateClinicGate({
    selectedClinic,
    clinicName: clinicNameInput.value,
    clinicSearch: clinicSearch.value,
  });
  if (!clinicGate.ok) {
    if (clinicGate.reason === "pick_clinic") {
      showToast(t("toastPickClinic"));
      renderClinicResults(searchClinics(clinicSearch.value));
      clinicSearch.focus();
    } else if (clinicGate.reason === "pick_clinic_list") {
      showToast(t("toastPickClinicList"));
      renderClinicResults(searchClinics(clinicSearch.value));
    }
    return;
  }
  const symptomGate = PetLiveWeb.domains.visits.validateSymptomGate(selectedTags);
  if (!symptomGate.ok) {
    showToast(t("toastNeedSymptom"));
    return;
  }
  // Keep pending meds when returning from add-med → visit → next again.
  // Only reset when starting a brand-new med entry from an empty list.
  if (!pendingMeds.length) {
    clearMedDrugFields();
    clearLiveProofPhotos();
    setMedEntryMode("photo");
  }
  completingVisitRef = null;
  go("add-med");
});

document.getElementById("pet-species").addEventListener("change", () => {
  const search = document.getElementById("breed-search");
  if (search) {
    suppressBreedSearchInput = true;
    search.value = "";
    suppressBreedSearchInput = false;
  }
  hideBreedResults();
  syncBreedFields({ keepSelection: false, resetExpanded: true });
});

document.getElementById("breed-chips").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-breed]");
  if (!chip) return;
  const value = chip.dataset.breed;
  const breedSelect = document.getElementById("breed-select");
  const previous = breedSelect ? breedSelect.value : "";
  setSelectedBreed(value);
  hideBreedResults();
  if (value === BREED_CUSTOM_VALUE) {
    const search = document.getElementById("breed-search");
    if (search) {
      if (previous && previous !== BREED_CUSTOM_VALUE) {
        suppressBreedSearchInput = true;
        search.value = "";
        suppressBreedSearchInput = false;
      }
      search.focus();
    }
  }
});

document.getElementById("breed-expand-toggle")?.addEventListener("click", () => {
  breedController.toggle();
  syncBreedFields({ keepSelection: true });
});

(() => {
  const breedSearch = document.getElementById("breed-search");
  const breedResults = document.getElementById("breed-results");
  if (!breedSearch || !breedResults) return;

  breedSearch.addEventListener("input", () => {
    if (suppressBreedSearchInput) return;
    const speciesEl = document.getElementById("pet-species");
    const species = speciesEl ? speciesEl.value : "";
    // Free text without clicking a suggestion → custom path (no silent coerce).
    setSelectedBreed(BREED_CUSTOM_VALUE);
    if (species === "other" || typeof searchBreeds !== "function") {
      hideBreedResults();
      return;
    }
    renderBreedResults(breedSelectors.search(breedSearch.value, species), breedSearch.value);
  });

  breedSearch.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideBreedResults();
      breedSearch.blur();
    }
  });

  breedSearch.addEventListener("blur", () => {
    window.clearTimeout(breedResultsBlurTimer);
    breedResultsBlurTimer = window.setTimeout(() => {
      hideBreedResults();
    }, 180);
  });

  breedSearch.addEventListener("focus", () => {
    window.clearTimeout(breedResultsBlurTimer);
    const speciesEl = document.getElementById("pet-species");
    const species = speciesEl ? speciesEl.value : "";
    if (species === "other" || typeof searchBreeds !== "function") return;
    const q = breedSearch.value.trim();
    if (!q) return;
    const breedSelect = document.getElementById("breed-select");
    // Only reopen suggestions while on the free-text / custom path.
    if (breedSelect && breedSelect.value === BREED_CUSTOM_VALUE) {
      renderBreedResults(breedSelectors.search(q, species), q);
    }
  });

  function commitBreedSuggestion(btn) {
    const value = btn?.dataset?.breedSuggest;
    if (!value) return;
    window.clearTimeout(breedResultsBlurTimer);
    setSelectedBreed(value);
    hideBreedResults();
  }

  // pointerdown (not only mousedown): on touch, blur schedules hide at 180ms and
  // can clear the list before the delayed synthetic click, leaving __custom__.
  breedResults.addEventListener("pointerdown", (event) => {
    const btn = event.target.closest("[data-breed-suggest]");
    if (!btn) return;
    event.preventDefault();
    commitBreedSuggestion(btn);
  });

  breedResults.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-breed-suggest]");
    if (!btn) return;
    // Keyboard activation / fallback if pointerdown did not commit.
    commitBreedSuggestion(btn);
  });
})();

document.getElementById("pet-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const validation = validatePetFormFields(form);
  if (!validation.ok) {
    const toastByReason = {
      need_name: "toastNeedPetName",
      need_breed: "toastNeedBreed",
      weight: "toastWeight",
      need_birth: "toastNeedBirth",
      birth_future: "toastBirthFuture",
      need_weight_date: "toastNeedWeightDate",
    };
    showToast(t(toastByReason[validation.reason] || "toastNeedPetName"));
    return;
  }

  const pet = createPetFromForm(form);
  if (editingPetId) {
    const current = pets.find((item) => item.id === editingPetId);
    if (!current) {
      editingPetId = null;
      paintPetFormMode();
      showToast(t("toastNeedPetName"));
      return;
    }
    applyPetFromForm(current, form);
    editingPetId = null;
    paintPetFormMode();
    selectPetForced(current.id);
    showToast(t("toastPetUpdated", { name: current.name }));
    go("emergency");
    return;
  }

  petsGraph.pushPet(pet);
  selectPetForced(pet.id);
  showToast(t("toastPetAdded", { name: pet.name }));
  clearNavigationHistory();
  go("home", { replace: true });
});

function setMedUnitChip(unit) {
  const next = unit || "unrecorded";
  const input = document.getElementById("dosage-unit");
  if (input) input.value = next;
  document.querySelectorAll("#unit-chips .chip").forEach((chip) => {
    chip.classList.toggle("is-on", chip.dataset.unit === next);
  });
}

function formatDosageUnitLabel(unit) {
  const value = (unit || "").trim();
  if (!value || value === "unrecorded") return "";
  if (value === "unknown") return t("unitUnknown");
  return value;
}

function normalizeMedUnitForStore(unit) {
  return medicationsController.normalizeMedUnitForStore(unit);
}

function normalizeMedFreqForStore(frequency) {
  return medicationsController.normalizeMedFreqForStore(frequency);
}

function setMedFreqChip(frequency) {
  const next = frequency || "unrecorded";
  const input = document.getElementById("med-frequency");
  if (input) input.value = next;
  document.querySelectorAll("#freq-chips .chip").forEach((chip) => {
    chip.classList.toggle("is-on", chip.dataset.freq === next);
  });
}

/** Macaron-inspired swatches (max 6), deepened slightly for badge contrast */
const COMPOUND_COLOR_SWATCHES = [
  { hex: "#E8655A", labelKey: "compoundColorRose" },
  { hex: "#E38A6C", labelKey: "compoundColorPeach" },
  { hex: "#C9A227", labelKey: "compoundColorLemon" },
  { hex: "#6BAA8E", labelKey: "compoundColorPistachio" },
  { hex: "#6DA6C3", labelKey: "compoundColorSky" },
  { hex: "#9B8BC4", labelKey: "compoundColorLavender" },
];

function defaultCompoundColor(group) {
  return medicationsController.defaultCompoundColor(group);
}

function resolveCompoundColor(group, explicit) {
  return medicationsController.resolveCompoundColor(
    group,
    explicit,
    compoundColorByGroup
  );
}

function applyCompoundChipColors() {
  const selected = document.getElementById("compound-group")?.value || "";
  document.querySelectorAll("#compound-chips .chip[data-compound]").forEach((chip) => {
    const group = chip.dataset.compound;
    // Only the selected chip gets an inline override (custom swatch or resolved).
    // Others keep each group’s default tone from CSS classes.
    if (selected && group === selected) {
      chip.style.setProperty("--compound-chip-color", resolveCompoundColor(group));
    } else {
      chip.style.removeProperty("--compound-chip-color");
    }
  });
}

function renderCompoundColorSwatches(group) {
  const field = document.getElementById("compound-color-field");
  const wrap = document.getElementById("compound-color-swatches");
  const colorInput = document.getElementById("compound-color");
  if (!field || !wrap || !colorInput || !medicationsRenderer) return;

  const built = medicationsRenderer.buildCompoundColorSwatchesHtml(
    group,
    group ? resolveCompoundColor(group) : ""
  );
  if (built.hidden) {
    field.hidden = true;
    wrap.innerHTML = "";
    colorInput.value = "";
    return;
  }

  colorInput.value = built.colorValue;
  field.hidden = false;
  wrap.innerHTML = built.html;
}

function setMedCompoundColor(hex, { persistGroup = true } = {}) {
  const groupInput = document.getElementById("compound-group");
  const colorInput = document.getElementById("compound-color");
  const group = groupInput?.value || "";
  if (!group || !hex) return;
  if (persistGroup) {
    medicationsController.setCompoundColorOverride(
      compoundColorByGroup,
      group,
      hex
    );
  }
  if (colorInput) colorInput.value = hex;
  applyCompoundChipColors();
  renderCompoundColorSwatches(group);
}

function setMedCompoundChip(group) {
  const value = group || "";
  const input = document.getElementById("compound-group");
  if (input) input.value = value;
  document.querySelectorAll("#compound-chips .chip").forEach((chip) => {
    chip.classList.toggle("is-on", Boolean(value) && chip.dataset.compound === value);
  });
  if (value) {
    const color = resolveCompoundColor(value);
    medicationsController.setCompoundColorOverride(
      compoundColorByGroup,
      value,
      color
    );
    const colorInput = document.getElementById("compound-color");
    if (colorInput) colorInput.value = color;
  } else {
    const colorInput = document.getElementById("compound-color");
    if (colorInput) colorInput.value = "";
  }
  applyCompoundChipColors();
  renderCompoundColorSwatches(value);
}

applyCompoundChipColors();

function readMedDraftFromForm(form) {
  const compoundGroup = (form.compoundGroup?.value || "").trim();
  const compoundColor = compoundGroup
    ? resolveCompoundColor(compoundGroup, (form.compoundColor?.value || "").trim())
    : "";
  const drugName = selectedDrug
    ? selectedDrug.genericName
    : drugSearch.value.trim();
  return medicationsController.draftFromFields({
    dosageAmount: form.dosageAmount.value.trim(),
    durationDays: form.durationDays.value.trim(),
    dosageUnit: form.dosageUnit.value,
    frequency: form.frequency.value,
    compoundGroup,
    compoundColor,
    sourcePreset: form.sourcePreset.value,
    drugName,
  });
}

function hasAnyMedDraftInput(form) {
  const { amount, days, drugName, unit, frequency } = readMedDraftFromForm(form);
  return Boolean(
    drugName ||
      form.dosageAmount.value.trim() ||
      form.durationDays.value.trim() ||
      unit ||
      frequency ||
      amount ||
      days
  );
}

function validateMedDraft(draft, { silent = false } = {}) {
  const result = medicationsController.validateMedDraft(draft);
  if (!result.ok && !silent) {
    if (result.reason === "need_drug") showToast(t("toastNeedDrug"));
    else if (result.reason === "dose") showToast(t("toastDose"));
    else if (result.reason === "days") showToast(t("toastDays"));
  }
  return result.ok;
}

function clearMedDrugFields() {
  const form = document.getElementById("med-form");
  if (!form) return;
  form.dosageAmount.value = "";
  form.durationDays.value = "";
  setMedUnitChip("unrecorded");
  setMedFreqChip("unrecorded");
  setMedCompoundChip("");
  drugSearch.value = "";
  selectedDrug = null;
  selectedDrugEl.hidden = true;
  drugResults.hidden = true;
  drugResults.innerHTML = "";
  renderDrugInfoCard(null);
}

function pendingMedScheduleKey(med) {
  return medicationsController.pendingMedScheduleKey(med);
}

function compoundFormClass(form) {
  return medicationsSelectors.compoundFormClass(form);
}

function compoundIconKind(form) {
  return medicationsSelectors.compoundIconKind(form);
}
function hasLinkedLabsForVisit(visit) {
  const pet = getCurrentPet();
  if (!pet || !visit) return false;
  return getLabReportsForPet(pet.id).some((report) =>
    reportMatchesVisit(report, visit)
  );
}

let emergencyRenderer;
let vaccineRenderer;
let parasiteRenderer;
let labsRenderer;
let imagingRenderer;
let alertsRenderer;
let petsRenderer;
let photoCropShell;
let calendarChooserShell;
let breedRenderer;
let medicationsRenderer;
let proofPreviewShell;

timelineRenderer = PetLiveWeb.domains.timeline.createRenderer({
  label: (key, params) => t(key, params),
  locField,
  formatShortDate,
  visitClinicLabel,
  visitTagLabel,
  getSourceTags,
  expandFrequencyInText,
  compoundFormClass,
  compoundChipToneClass,
  compoundFormBadge,
  compoundIconKind,
  timelineSelectors,
  timelineViewHelpers,
  visits: visitsController,
  imaging: imagingController,
  hasLinkedLabs: hasLinkedLabsForVisit,
});

emergencyRenderer = PetLiveWeb.domains.emergency.createRenderer({
  label: (key, params) => t(key, params),
  escapeHtml: escapeAlertHtml,
  alertTypeLabel,
  alertLineText,
  locField,
  formatMedDose,
  formatMedCourse,
  expandFrequencyInText,
  notesIdForMed: (args) => timelineViewHelpers.notesIdForMed(args),
  buildDrugNotesShellHtml: (notesId) =>
    timelineRenderer.buildDrugNotesShellHtml(notesId),
  ownerProfileHasAny,
});

vaccineRenderer = PetLiveWeb.domains.vaccines.createRenderer({
  label: (key, params) => t(key, params),
  compareVaccinesForList,
  getVaccineSuccessor,
  getVaccineProtectionStatus,
  vaccineLabelOf,
});

parasiteRenderer = PetLiveWeb.domains.parasite.createRenderer({
  label: (key, params) => t(key, params),
  parasiteStatusLabel,
  productChipLabel: parasiteProductChipLabel,
  isDualProduct: isParasiteDualProduct,
});

labsRenderer = PetLiveWeb.domains.labs.createRenderer({
  label: (key, params) => t(key, params),
  escapeHtml: escapeAlertHtml,
  formatLabTypes,
});

imagingRenderer = PetLiveWeb.domains.imaging.createRenderer({
  label: (key, params) => t(key, params),
  escapeHtml: escapeAlertHtml,
  visitClinicLabel,
  formatImagingTypes,
});

alertsRenderer = PetLiveWeb.domains.alerts.createRenderer({
  label: (key, params) => t(key, params),
  escapeHtml: escapeAlertHtml,
  alertTypeLabel,
  alertLineText,
  locField,
  chronicSinceLine,
});

petsRenderer = PetLiveWeb.domains.pets.createRenderer({
  label: (key, params) => t(key, params),
  getPetPhoto,
  speciesLabelOf,
  breedLabelOf,
  ageLabelOf,
});

photoCropShell = PetLiveWeb.shell.createPhotoCrop();
bindPetPhotoCropUi();
calendarChooserShell = PetLiveWeb.shell.createCalendarChooser();

breedRenderer = PetLiveWeb.domains.breed.createRenderer({
  label: (key, params) => t(key, params),
  breedOptionLabel,
  breedSelectors,
});

proofPreviewShell = PetLiveWeb.shell.createProofPreview();

let lastTimelineItemSignatures = [];
let lastTimelineVisitsSnapshot = [];

function applyTimelineDrugNotePanels(drugNotePanels) {
  drugNotesMedByPanelId.clear();
  drugNotePanels.forEach(({ notesId, med }) => {
    drugNotesMedByPanelId.set(notesId, med);
  });
}

function applyPartialTimelineRows(html, indices) {
  if (!timelineList || typeof document === "undefined") return false;
  const tmp = document.createElement("ul");
  tmp.innerHTML = html;
  for (const index of indices) {
    const next = tmp.querySelector(`li[data-visit-index="${index}"]`);
    const cur = timelineList.querySelector(`li[data-visit-index="${index}"]`);
    if (!next || !cur) return false;
    cur.replaceWith(next);
  }
  return true;
}

function applyMorphTimelinePatches(patches) {
  if (!timelineList || typeof document === "undefined") return false;
  if (!Array.isArray(patches) || !patches.length) return false;
  for (const patch of patches) {
    const li = timelineList.querySelector(
      `li[data-visit-index="${patch.index}"]`
    );
    if (!li) return false;
    const clinic = li.querySelector(".tl-clinic");
    if (clinic) clinic.textContent = patch.clinicText || "";
    let note = li.querySelector(".tl-note");
    if (patch.hasNote) {
      if (!note) {
        const body = li.querySelector(".tl-body");
        if (!body) return false;
        note = document.createElement("p");
        note.className = "tl-note";
        body.appendChild(note);
      }
      note.textContent = patch.noteText || "";
    } else if (note) {
      note.remove();
    }
  }
  return true;
}

function renderTimeline(pet) {
  const lang =
    (typeof getCurrentLang === "function" && getCurrentLang()) || "zh-Hant";
  const nextVisits = pet?.visits || [];
  const nextItemSignatures = timelineRenderer.buildItemSignatures(pet, { lang });
  const visitDates = nextVisits.map((visit) => visit?.date || "");
  const plan = timelineRenderer.planKeyedListReconcile(
    lastTimelineItemSignatures,
    nextItemSignatures,
    {
      visitDates,
      previousVisits: lastTimelineVisitsSnapshot,
      nextVisits,
    }
  );
  if (plan.mode === "skip") {
    const imagingPending = pendingVisitImagingIndex;
    applyPendingVisitImagingExpand();
    if (imagingPending == null) expandLatestVisitRx();
    return;
  }

  if (
    plan.mode === "morph" &&
    plan.patches?.length &&
    applyMorphTimelinePatches(plan.patches)
  ) {
    lastTimelineItemSignatures = nextItemSignatures;
    lastTimelineVisitsSnapshot = nextVisits.slice();
    const imagingPending = pendingVisitImagingIndex;
    applyPendingVisitImagingExpand();
    if (imagingPending == null) expandLatestVisitRx();
    return;
  }

  const { html, drugNotePanels } = timelineRenderer.buildTimelineListHtml(pet);
  applyTimelineDrugNotePanels(drugNotePanels);

  if (
    plan.mode === "partial" &&
    pet?.visits?.length &&
    applyPartialTimelineRows(html, plan.indices)
  ) {
    lastTimelineItemSignatures = nextItemSignatures;
  } else {
    timelineList.innerHTML = html;
    lastTimelineItemSignatures = nextItemSignatures;
  }
  lastTimelineVisitsSnapshot = nextVisits.slice();

  const imagingPending = pendingVisitImagingIndex;
  applyPendingVisitImagingExpand();
  if (imagingPending == null) expandLatestVisitRx();
}

const COMPOUND_FORM_OPTIONS = [
  ["liquid_a", "compoundLiquidA"],
  ["liquid_b", "compoundLiquidB"],
  ["liquid_c", "compoundLiquidC"],
  ["capsule_a", "compoundCapsuleA"],
  ["capsule_b", "compoundCapsuleB"],
  ["capsule_c", "compoundCapsuleC"],
];

medicationsRenderer = PetLiveWeb.domains.medications.createRenderer({
  label: (key, params) => t(key, params),
  compoundFormOptions: COMPOUND_FORM_OPTIONS,
  compoundColorSwatches: COMPOUND_COLOR_SWATCHES,
  compoundChipToneClass,
  compoundIconKind,
  resolveCompoundColor,
});

function pendingMedHasCompoundTag(med) {
  return medicationsController.pendingMedHasCompoundTag(med);
}

function renderPendingMeds() {
  const list = document.getElementById("pending-med-list");
  const countEl = document.getElementById("pending-meds-count");
  const hintEl = document.getElementById("pending-compound-hint");
  if (!list || !countEl || !medicationsRenderer) return;

  const built = medicationsRenderer.buildPendingMedsListHtml(pendingMeds);

  if (!pendingMeds.length) {
    list.innerHTML = built.listHtml;
    countEl.textContent = built.countText;
    countEl.setAttribute("data-i18n", built.countI18nKey);
    countEl.removeAttribute("data-i18n-vars");
    if (hintEl) hintEl.hidden = true;
    return;
  }

  countEl.removeAttribute("data-i18n");
  countEl.removeAttribute("data-i18n-vars");
  countEl.textContent = built.countText;

  if (hintEl) {
    hintEl.hidden = !built.showCompoundHint;
    if (built.showCompoundHint) hintEl.textContent = t("compoundHint");
  }

  list.innerHTML = built.listHtml;
}

function pushPendingMed(draft) {
  const item = medicationsController.pushPendingMed(pendingMeds, draft);
  renderPendingMeds();
  return item;
}

function buildVisitMedicationsFromPending(petId) {
  return medicationsController.buildVisitMedicationsFromPending(
    pendingMeds,
    petId
  );
}

function tryAddCurrentMedToList({ toastOnSuccess = true } = {}) {
  const form = document.getElementById("med-form");
  const draft = readMedDraftFromForm(form);
  if (!validateMedDraft(draft)) return false;
  pushPendingMed(draft);
  clearMedDrugFields();
  if (toastOnSuccess) showToast(t("toastMedAddedToList"));
  return true;
}

function clearLiveProofPhotos() {
  liveBagPhoto = null;
  liveRxPhoto = null;
  liveDrugPhoto = null;
  ["live-bag-photo", "live-rx-photo", "live-drug-photo"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  renderProofPreview(document.getElementById("live-bag-preview"), null);
  renderProofPreview(document.getElementById("live-rx-preview"), null);
  renderProofPreview(document.getElementById("live-drug-preview"), null);
}

function updateMedModeHint() {
  const hint = document.getElementById("med-mode-hint");
  const banner = document.getElementById("med-complete-banner");
  if (!hint) return;
  if (completingVisitRef) {
    hint.textContent = t("medModeHintComplete");
    if (banner) {
      banner.hidden = false;
      banner.textContent = t("medModeHintComplete");
    }
    return;
  }
  if (banner) banner.hidden = true;
  hint.textContent =
    medEntryMode === "photo" ? t("medModeHintPhoto") : t("medModeHintManual");
}

function setMedEntryMode(mode) {
  medEntryMode = mode === "photo" ? "photo" : "manual";
  const manual = document.getElementById("med-mode-manual");
  const photo = document.getElementById("med-mode-photo");
  if (manual) manual.hidden = medEntryMode !== "manual";
  if (photo) photo.hidden = medEntryMode !== "photo";
  document.querySelectorAll("[data-med-mode]").forEach((btn) => {
    const on = btn.dataset.medMode === medEntryMode;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  updateMedModeHint();
}

function getOrCreateVisitForMedSave() {
  const pet = getCurrentPet();
  if (completingVisitRef) {
    const visit = medicationsController.findVisitForMedSave(pet, {
      date: completingVisitRef.date,
      clinicId: completingVisitRef.clinicId,
      clinicName: completingVisitRef.clinic,
    });
    if (visit) return { pet, visit };
  }

  const visitForm = document.getElementById("visit-form");
  const visitDate = visitForm?.visitDate?.value || todayISODate();
  const clinicId = selectedClinic?.id || "";
  const clinicName =
    clinicNameInput?.value ||
    clinicNameOf(selectedClinic) ||
    t("anonymousClinic");
  const weightRaw = visitForm?.weightAtVisit?.value?.trim() || "";
  const weightAtVisit = weightRaw === "" ? null : Number(weightRaw);
  const weightValue = weightAtVisit > 0 ? weightAtVisit : null;
  let visit = medicationsController.findVisitForMedSave(pet, {
    date: visitDate,
    clinicId,
    clinicName,
  });
  if (!visit) {
    visit = {
      date: visitDate,
      clinicId: clinicId || undefined,
      clinic: clinicName,
      tags: [...selectedTags],
      note: visitForm?.notes?.value?.trim() || "",
      weightAtVisit: null,
      medications: [],
    };
    pet.visits.unshift(visit);
  }
  if (weightValue != null) {
    medicationsController.applyVisitWeightOnMedSave(pet, visit, weightValue);
  }
  return { pet, visit };
}

function finishMedFlowAfterSave(pet, toastKey, toastVars) {
  selectedTags.clear();
  document.querySelectorAll("#symptom-chips .chip.is-on").forEach((chip) => {
    chip.classList.remove("is-on");
  });
  const form = document.getElementById("med-form");
  form?.reset();
  clearMedDrugFields();
  pendingMeds = [];
  renderPendingMeds();
  clearLiveProofPhotos();
  completingVisitRef = null;
  setMedEntryMode("photo");
  setSelectedClinic(null);
  if (clinicSearch) clinicSearch.value = "";
  showToast(t(toastKey, toastVars));
  applySelectedPet();
  go("timeline");
}

document.querySelectorAll("[data-med-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (completingVisitRef && btn.dataset.medMode === "photo") {
      setMedEntryMode("manual");
      return;
    }
    setMedEntryMode(btn.dataset.medMode);
  });
});

function bindLivePhotoInput(inputId, previewId, assign) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readAndCompressImage(file);
    assign(dataUrl);
    renderProofPreview(document.getElementById(previewId), dataUrl);
  });
}

bindLivePhotoInput("live-bag-photo", "live-bag-preview", (url) => {
  liveBagPhoto = url;
});
bindLivePhotoInput("live-rx-photo", "live-rx-preview", (url) => {
  liveRxPhoto = url;
});
bindLivePhotoInput("live-drug-photo", "live-drug-preview", (url) => {
  liveDrugPhoto = url;
});

document.getElementById("save-photo-rx-btn")?.addEventListener("click", () => {
  const { pet, visit } = getOrCreateVisitForMedSave();
  medicationsController.appendPhotoBundleToVisit(visit, pet, {
    bagPhoto: liveBagPhoto,
    rxPhoto: liveRxPhoto,
    drugPhoto: liveDrugPhoto,
    name: t("photoRxName", { date: formatShortDate(visit.date) }),
    dosePendingText: t("photoRxDosePending"),
  });
  finishMedFlowAfterSave(pet, "toastPhotoRxSaved", { name: pet.name });
});

document.getElementById("add-med-to-list").addEventListener("click", () => {
  tryAddCurrentMedToList();
});

document.getElementById("pending-med-list").addEventListener("click", (event) => {
  const clearBtn = event.target.closest("[data-compound-clear]");
  if (clearBtn) {
    const id = clearBtn.getAttribute("data-compound-clear");
    medicationsController.setPendingCompoundGroup(
      pendingMeds,
      id,
      "",
      compoundColorByGroup
    );
    renderPendingMeds();
    return;
  }

  const btn = event.target.closest("[data-remove-pending]");
  if (!btn) return;
  const id = btn.getAttribute("data-remove-pending");
  pendingMeds = medicationsController.removePendingMed(pendingMeds, id);
  renderPendingMeds();
});

document.getElementById("pending-med-list").addEventListener("change", (event) => {
  const input = event.target.closest("[data-compound-for]");
  if (!input) return;
  const id = input.getAttribute("data-compound-for");
  medicationsController.setPendingCompoundGroup(
    pendingMeds,
    id,
    input.value || "",
    compoundColorByGroup
  );
  renderPendingMeds();
});

document.getElementById("med-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (medEntryMode === "photo") return;

  const form = event.currentTarget;

  if (hasAnyMedDraftInput(form)) {
    if (!tryAddCurrentMedToList({ toastOnSuccess: false })) return;
  }

  if (!pendingMeds.length) {
    showToast(t("toastNeedPendingMeds"));
    return;
  }

  const { pet, visit } = getOrCreateVisitForMedSave();
  const units = buildVisitMedicationsFromPending(pet.id);
  medicationsController.appendUnitsToVisit(visit, units);

  finishMedFlowAfterSave(pet, "toastMedSaved", {
    name: pet.name,
    n: units.length,
  });
});

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Camera originals are huge; shrink before keeping in memory. */
async function readAndCompressImage(file, maxEdge = PROOF_PHOTO_MAX_EDGE) {
  const raw = await readFileAsDataUrl(file);
  return resizeImageDataUrl(raw, maxEdge);
}

function renderProofPreview(container, dataUrl, clearKey = "") {
  if (!container || !proofPreviewShell) return;
  const built = proofPreviewShell.buildProofPreviewHtml(dataUrl, {
    label: (key, params) => t(key, params),
    clearKey,
  });
  container.hidden = built.hidden;
  container.innerHTML = built.html;
}

function openVisitProof(visitIndex) {
  const pet = getCurrentPet();
  const visit = pet.visits[visitIndex];
  if (!visit) return;

  pendingProofMed = null;
  pendingProofVisitIndex = visitIndex;
  pendingBagPhoto = visit.bagPhoto || null;
  pendingRxPhoto = visit.rxPhoto || null;
  pendingDrugPhoto = visit.drugPhoto || null;

  document.getElementById("med-proof-name").textContent = visitClinicLabel(visit);
  document.getElementById("med-proof-meta").textContent = visit.date;
  document.getElementById("med-proof-sub").textContent = t("timelineVisitRxProofSub");
  const targetKicker = document.querySelector("#med-proof-form .archive-pet-kicker");
  if (targetKicker) {
    targetKicker.setAttribute("data-i18n", "timelineVisitRxTarget");
    targetKicker.textContent = t("timelineVisitRxTarget");
  }
  document.getElementById("med-bag-photo").value = "";
  const rxInput = document.getElementById("med-rx-photo");
  if (rxInput) rxInput.value = "";
  document.getElementById("med-drug-photo").value = "";
  renderProofPreview(document.getElementById("med-bag-preview"), pendingBagPhoto, "bag");
  renderProofPreview(document.getElementById("med-rx-preview"), pendingRxPhoto, "rx");
  renderProofPreview(document.getElementById("med-drug-preview"), pendingDrugPhoto, "drug");
  go("med-proof");
}

function toggleVisitRxButton(toggle) {
  const panelId = toggle.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel || !timelineRenderer) return;
  const open = panel.hasAttribute("hidden");
  const view = timelineRenderer.buildVisitRxTogglePresentation(open);
  if (view.panelHidden) panel.setAttribute("hidden", "");
  else panel.removeAttribute("hidden");
  toggle.setAttribute("aria-expanded", view.ariaExpanded);
  toggle.textContent = view.text;
  toggle.classList.toggle("is-open", view.isOpen);
  if (panelId === "visit-rx-0") {
    latestRxUserCollapsed = !open;
  }
}

function expandLatestVisitRx() {
  if (!timelineRenderer?.shouldAutoExpandLatestRx(latestRxUserCollapsed)) return;
  const toggle = document.querySelector(
    '[data-visit-rx-toggle][aria-controls="visit-rx-0"]'
  );
  if (!toggle) return;
  const panel = document.getElementById("visit-rx-0");
  if (panel?.hasAttribute("hidden")) toggleVisitRxButton(toggle);
}

function toggleVisitImagingButton(toggle) {
  const panelId = toggle.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel || !timelineRenderer) return;
  const open = panel.hasAttribute("hidden");
  const view = timelineRenderer.buildVisitImagingTogglePresentation(open);
  if (view.panelHidden) panel.setAttribute("hidden", "");
  else panel.removeAttribute("hidden");
  toggle.setAttribute("aria-expanded", view.ariaExpanded);
  toggle.textContent = view.text;
  toggle.classList.toggle("is-open", view.isOpen);
}

function revealVisitImagingPanel(visitIndex, { scroll = false } = {}) {
  const toggle = document.querySelector(
    `[data-visit-imaging-toggle][aria-controls="visit-imaging-${visitIndex}"]`
  );
  if (!toggle) return;
  const panel = document.getElementById(`visit-imaging-${visitIndex}`);
  if (panel?.hasAttribute("hidden")) toggleVisitImagingButton(toggle);
  if (scroll) {
    panel?.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

function applyPendingVisitImagingExpand() {
  if (pendingVisitImagingIndex == null) return;
  const visitIndex = pendingVisitImagingIndex;
  pendingVisitImagingIndex = null;
  revealVisitImagingPanel(visitIndex);
}

function goTimelineWithImaging(visitIndex) {
  pendingVisitImagingIndex = visitIndex;
  if (!go("timeline")) {
    const pet = getCurrentPet();
    if (pet) renderTimeline(pet);
  }
  requestAnimationFrame(() => {
    revealVisitImagingPanel(visitIndex, { scroll: true });
  });
}

function renderImagingSlotPreviews(slot) {
  const root = document.getElementById(
    slot === "us" ? "imaging-us-previews" : "imaging-xray-previews"
  );
  if (!root || !imagingRenderer) return;
  const photos = slot === "us" ? pendingUsPhotos : pendingXrayPhotos;
  root.innerHTML = imagingRenderer.buildSlotPreviewsHtml(photos, slot);
}

function syncImagingProofSubmitEnabled() {
  const btn = document.querySelector(
    "#imaging-proof-form button[type='submit']"
  );
  if (!btn) return;
  const busy = imagingCompressInFlight > 0;
  btn.disabled = busy;
  btn.setAttribute("aria-disabled", busy ? "true" : "false");
}

async function appendImagingFiles(files, slot) {
  let hitCap = false;
  imagingCompressInFlight += 1;
  syncImagingProofSubmitEnabled();
  try {
    for (const file of files) {
      const before =
        slot === "us" ? pendingUsPhotos : pendingXrayPhotos;
      if (before.length >= IMAGING_PHOTOS_MAX) {
        hitCap = true;
        break;
      }
      try {
        const dataUrl = await readAndCompressImage(file);
        // Re-resolve after await — never push onto a stale bucket reference.
        const current =
          slot === "us" ? pendingUsPhotos : pendingXrayPhotos;
        if (current.length >= IMAGING_PHOTOS_MAX) {
          hitCap = true;
          break;
        }
        if (dataUrl) {
          if (slot === "us") pendingUsPhotos.push(dataUrl);
          else pendingXrayPhotos.push(dataUrl);
        }
      } catch {
        showToast(t("toastPetPhotoFail"));
      }
    }
  } finally {
    imagingCompressInFlight = Math.max(0, imagingCompressInFlight - 1);
    syncImagingProofSubmitEnabled();
  }
  if (hitCap) showToast(t("toastImagingCap"));
  renderImagingSlotPreviews(slot);
}

function openVisitImaging(visitIndex) {
  const pet = getCurrentPet();
  const visit = pet?.visits?.[visitIndex];
  if (!visit) return;

  pendingImagingVisitIndex = visitIndex;
  const imaging = getVisitImaging(visit);
  pendingXrayPhotos = [...imaging.xrayPhotos];
  pendingUsPhotos = [...imaging.usPhotos];

  document.getElementById("imaging-proof-name").textContent =
    visitClinicLabel(visit);
  document.getElementById("imaging-proof-meta").textContent = visit.date;
  document.getElementById("imaging-proof-sub").textContent = t(
    "timelineVisitImagingProofSub"
  );
  const targetKicker = document.querySelector(
    "#imaging-proof-form .archive-pet-kicker"
  );
  if (targetKicker) {
    targetKicker.setAttribute("data-i18n", "timelineVisitImagingTarget");
    targetKicker.textContent = t("timelineVisitImagingTarget");
  }
  const xrayInput = document.getElementById("imaging-xray-photo");
  const usInput = document.getElementById("imaging-us-photo");
  if (xrayInput) xrayInput.value = "";
  if (usInput) usInput.value = "";
  renderImagingSlotPreviews("xray");
  renderImagingSlotPreviews("us");
  go("imaging-proof");
}

function openCompleteDrugs(visitIndex) {
  const pet = getCurrentPet();
  const visit = pet.visits[visitIndex];
  if (!visit) return;
  completingVisitRef = {
    date: visit.date,
    clinicId: visit.clinicId,
    clinic: visitClinicLabel(visit),
  };
  pendingMeds = [];
  clearMedDrugFields();
  clearLiveProofPhotos();
  setMedEntryMode("manual");
  go("add-med");
}

function toggleDrugNotesButton(notesToggle) {
  const panelId = notesToggle.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;
  const open = panel.hasAttribute("hidden");
  if (open) {
    hydrateDrugNotesPanel(panel);
    panel.removeAttribute("hidden");
    notesToggle.setAttribute("aria-expanded", "true");
    notesToggle.textContent = t("timelineDrugNotesHide");
    notesToggle.classList.add("is-open");
  } else {
    panel.setAttribute("hidden", "");
    notesToggle.setAttribute("aria-expanded", "false");
    notesToggle.textContent = t("timelineDrugNotesBtn");
    notesToggle.classList.remove("is-open");
  }
}

function toggleMedDetailButton(toggle) {
  const panelId = toggle.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;
  const action = toggle.querySelector(".tl-med-summary-action");
  const open = panel.hasAttribute("hidden");
  if (open) {
    panel.removeAttribute("hidden");
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("is-open");
    if (action) action.textContent = t("timelineMedCollapse");
  } else {
    panel.setAttribute("hidden", "");
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("is-open");
    if (action) action.textContent = t("timelineMedExpand");
  }
}

function toggleVisitWeightButton(toggle) {
  const panelId = toggle.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;
  const open = panel.hasAttribute("hidden");
  if (open) {
    panel.removeAttribute("hidden");
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("is-open");
    const input = panel.querySelector('input[name="weightAtVisit"]');
    input?.focus();
  } else {
    panel.setAttribute("hidden", "");
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("is-open");
  }
}

function saveVisitWeightAtIndex(visitIndex) {
  if (demoBlocksWrite()) return false;
  const pet = getCurrentPet();
  const input = document.getElementById(`visit-weight-input-${visitIndex}`);
  const weight = Number(input?.value?.trim() || "");
  const result = visitsController.saveVisitWeight(pet, visitIndex, weight);
  if (!result.ok) {
    showToast(t("toastWeight"));
    return false;
  }
  showToast(t("toastVisitWeightSaved", { weight }));
  applySelectedPet();
  return true;
}

timelineList.addEventListener("click", (event) => {
  const notesToggle = event.target.closest("[data-drug-notes-toggle]");
  if (notesToggle) {
    toggleDrugNotesButton(notesToggle);
    return;
  }
  const medDetailToggle = event.target.closest("[data-med-detail-toggle]");
  if (medDetailToggle) {
    toggleMedDetailButton(medDetailToggle);
    return;
  }
  const visitWeightToggle = event.target.closest("[data-visit-weight-toggle]");
  if (visitWeightToggle) {
    toggleVisitWeightButton(visitWeightToggle);
    return;
  }
  const visitLabsBtn = event.target.closest("[data-open-labs]");
  if (visitLabsBtn) {
    go("labs");
    return;
  }
  const visitRxToggle = event.target.closest("[data-visit-rx-toggle]");
  if (visitRxToggle) {
    toggleVisitRxButton(visitRxToggle);
    return;
  }
  const visitImagingToggle = event.target.closest("[data-visit-imaging-toggle]");
  if (visitImagingToggle) {
    toggleVisitImagingButton(visitImagingToggle);
    return;
  }
  const proofLightboxBtn = event.target.closest("[data-proof-lightbox]");
  if (proofLightboxBtn) {
    const img = proofLightboxBtn.querySelector("img");
    openProofLightbox(img?.currentSrc || img?.src, proofLightboxBtn.dataset.proofCaption);
    return;
  }
  const clearSlotBtn = event.target.closest("[data-visit-proof-clear-slot]");
  if (clearSlotBtn) {
    const pet = getCurrentPet();
    const visitIndex = Number(clearSlotBtn.dataset.visitIndex);
    const visit = pet.visits[visitIndex];
    const slot = clearSlotBtn.dataset.visitProofClearSlot;
    if (!visit || !slot) return;
    clearVisitProofSlot(visit, slot);
    showToast(t("toastProofCleared"));
    applySelectedPet();
    const toggle = document.querySelector(
      `[data-visit-rx-toggle][aria-controls="visit-rx-${visitIndex}"]`
    );
    if (toggle) toggleVisitRxButton(toggle);
    return;
  }
  const clearImagingBtn = event.target.closest("[data-visit-imaging-clear-slot]");
  if (clearImagingBtn) {
    const pet = getCurrentPet();
    const visitIndex = Number(clearImagingBtn.dataset.visitIndex);
    const visit = pet?.visits?.[visitIndex];
    const slot = clearImagingBtn.dataset.visitImagingClearSlot;
    const photoIndex = Number(clearImagingBtn.dataset.visitImagingClearIndex);
    if (!visit || !slot) return;
    clearVisitImagingPhoto(visit, slot, photoIndex);
    showToast(t("toastImagingCleared"));
    applySelectedPet();
    const toggle = document.querySelector(
      `[data-visit-imaging-toggle][aria-controls="visit-imaging-${visitIndex}"]`
    );
    if (toggle) toggleVisitImagingButton(toggle);
    return;
  }
  const visitUpload = event.target.closest("[data-visit-proof-upload]");
  if (visitUpload) {
    openVisitProof(Number(visitUpload.dataset.visitProofUpload));
    return;
  }
  const imagingUpload = event.target.closest("[data-visit-imaging-upload]");
  if (imagingUpload) {
    openVisitImaging(Number(imagingUpload.dataset.visitImagingUpload));
    return;
  }
  const completeBtn = event.target.closest("[data-complete-visit]");
  if (completeBtn) {
    openCompleteDrugs(Number(completeBtn.dataset.completeVisit));
  }
});

timelineList.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-visit-weight-form]");
  if (!form) return;
  event.preventDefault();
  saveVisitWeightAtIndex(Number(form.dataset.visitWeightForm));
});

if (eMeds) {
  eMeds.addEventListener("click", (event) => {
    const notesToggle = event.target.closest("[data-drug-notes-toggle]");
    if (!notesToggle) return;
    toggleDrugNotesButton(notesToggle);
  });
}

document.getElementById("med-bag-photo").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  pendingBagPhoto = await readAndCompressImage(file);
  renderProofPreview(document.getElementById("med-bag-preview"), pendingBagPhoto, "bag");
});

document.getElementById("med-rx-photo")?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  pendingRxPhoto = await readAndCompressImage(file);
  renderProofPreview(document.getElementById("med-rx-preview"), pendingRxPhoto, "rx");
});

document.getElementById("med-drug-photo").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  pendingDrugPhoto = await readAndCompressImage(file);
  renderProofPreview(document.getElementById("med-drug-preview"), pendingDrugPhoto, "drug");
});

document.getElementById("med-proof-form").addEventListener("click", (event) => {
  const clearBtn = event.target.closest("[data-proof-clear]");
  if (!clearBtn) return;
  const key = clearBtn.getAttribute("data-proof-clear");
  if (key === "bag") {
    pendingBagPhoto = null;
    document.getElementById("med-bag-photo").value = "";
    renderProofPreview(document.getElementById("med-bag-preview"), null);
  } else if (key === "rx") {
    pendingRxPhoto = null;
    const rxInput = document.getElementById("med-rx-photo");
    if (rxInput) rxInput.value = "";
    renderProofPreview(document.getElementById("med-rx-preview"), null);
  } else if (key === "drug") {
    pendingDrugPhoto = null;
    document.getElementById("med-drug-photo").value = "";
    renderProofPreview(document.getElementById("med-drug-preview"), null);
  }
});

document.getElementById("med-proof-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (pendingProofVisitIndex == null) {
    showToast(t("toastProofMissingVisit"));
    return;
  }

  const pet = getCurrentPet();
  const visit = pet.visits[pendingProofVisitIndex];
  if (!visit) return;

  // Assign pending as-is so cleared slots stay cleared.
  visit.bagPhoto = pendingBagPhoto || null;
  visit.rxPhoto = pendingRxPhoto || null;
  visit.drugPhoto = pendingDrugPhoto || null;
  (visit.medications || []).forEach((med) => {
    med.bagPhoto = visit.bagPhoto;
    med.rxPhoto = visit.rxPhoto;
    med.drugPhoto = visit.drugPhoto;
  });

  pendingProofVisitIndex = null;
  pendingProofMed = null;
  pendingBagPhoto = null;
  pendingRxPhoto = null;
  pendingDrugPhoto = null;

  showToast(t("toastProofSaved"));
  applySelectedPet();
  go("timeline");
});

document.getElementById("imaging-xray-photo")?.addEventListener("change", async (event) => {
  const files = [...(event.target.files || [])];
  event.target.value = "";
  if (!files.length) return;
  await appendImagingFiles(files, "xray");
});

document.getElementById("imaging-us-photo")?.addEventListener("change", async (event) => {
  const files = [...(event.target.files || [])];
  event.target.value = "";
  if (!files.length) return;
  await appendImagingFiles(files, "us");
});

document.getElementById("imaging-proof-form")?.addEventListener("click", (event) => {
  const clearBtn = event.target.closest("[data-imaging-photo-remove]");
  if (!clearBtn) return;
  const raw = clearBtn.getAttribute("data-imaging-photo-remove") || "";
  const sep = raw.indexOf(":");
  if (sep < 0) return;
  const slot = raw.slice(0, sep);
  const index = Number(raw.slice(sep + 1));
  const bucket = slot === "us" ? pendingUsPhotos : pendingXrayPhotos;
  if (!Number.isInteger(index)) return;
  bucket.splice(index, 1);
  renderImagingSlotPreviews(slot);
});

document.getElementById("imaging-proof-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (imagingCompressInFlight > 0) {
    showToast(t("toastImagingBusy"));
    return;
  }
  if (pendingImagingVisitIndex == null) {
    showToast(t("toastImagingMissingVisit"));
    return;
  }

  const pet = getCurrentPet();
  const visitIndex = pendingImagingVisitIndex;
  const visit = pet?.visits?.[visitIndex];
  if (!visit) return;

  imagingController.setVisitImaging(visit, {
    xrayPhotos: pendingXrayPhotos,
    usPhotos: pendingUsPhotos,
  });

  // Clear pendings only after write; compress-guard above blocks mid-append Save.
  pendingImagingVisitIndex = null;
  pendingXrayPhotos = [];
  pendingUsPhotos = [];

  showToast(t("toastImagingSaved"));
  applySelectedPet();
  goTimelineWithImaging(visitIndex);
});

document.getElementById("imaging-list")?.addEventListener("click", (event) => {
  const goTimeline = event.target.closest("[data-go-timeline-from-imaging]");
  if (goTimeline) {
    go("timeline");
    return;
  }
  const item = event.target.closest("[data-open-visit-imaging]");
  if (!item) return;
  goTimelineWithImaging(Number(item.dataset.openVisitImaging));
});

document.getElementById("lab-type-chips")?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-lab-type]");
  if (!chip) return;
  const type = chip.dataset.labType;
  if (!LAB_TYPE_I18N[type]) return;
  if (selectedLabTypes.has(type)) selectedLabTypes.delete(type);
  else selectedLabTypes.add(type);
  syncLabTypeChips();
});

document.getElementById("lab-photos-input")?.addEventListener("change", async (event) => {
  const files = [...(event.target.files || [])];
  event.target.value = "";
  for (const file of files) {
    if (pendingLabPhotos.length >= LAB_PHOTOS_MAX) break;
    try {
      const dataUrl = await readAndCompressImage(file);
      if (dataUrl) pendingLabPhotos.push(dataUrl);
    } catch {
      showToast(t("toastPetPhotoFail"));
    }
  }
  renderLabPhotoPreviews();
});

document.getElementById("lab-photo-previews")?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-lab-photo-remove]");
  if (!btn) return;
  const index = Number(btn.dataset.labPhotoRemove);
  if (!Number.isInteger(index)) return;
  pendingLabPhotos.splice(index, 1);
  renderLabPhotoPreviews();
});

document.getElementById("lab-clinic-search")?.addEventListener("focus", (event) => {
  renderLabClinicResults(searchClinics(event.target.value));
});

document.getElementById("lab-clinic-search")?.addEventListener("input", (event) => {
  selectedLabClinic = null;
  const nameInput = document.getElementById("lab-clinic-name");
  const idInput = document.getElementById("lab-clinic-id");
  const selectedEl = document.getElementById("lab-selected-clinic");
  if (nameInput) nameInput.value = "";
  if (idInput) idInput.value = "";
  if (selectedEl) {
    selectedEl.hidden = true;
    selectedEl.textContent = "";
    selectedEl.classList.remove("is-anonymous");
  }
  renderLabClinicResults(searchClinics(event.target.value));
});

document.getElementById("lab-clinic-results")?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-lab-clinic-id]");
  if (!btn) return;
  const clinic = getClinicDirectory().find(
    (item) => item.id === btn.dataset.labClinicId
  );
  if (!clinic) return;
  setSelectedLabClinic(clinic);
});

document.getElementById("lab-visit-link")?.addEventListener("change", (event) => {
  const pet = getCurrentPet();
  const visit = findVisitByLink(pet, event.target.value);
  if (!visit) return;
  const dateInput = document.getElementById("lab-date");
  if (dateInput && (!dateInput.value || dateInput.value === todayISODate())) {
    dateInput.value = visit.date;
  }
  const preset = visit.clinicId
    ? getClinicDirectory().find((item) => item.id === visit.clinicId)
    : null;
  if (preset) {
    setSelectedLabClinic(preset);
  } else {
    const search = document.getElementById("lab-clinic-search");
    const name = visitClinicLabel(visit);
    if (search) search.value = name;
    selectedLabClinic = null;
    const nameInput = document.getElementById("lab-clinic-name");
    const idInput = document.getElementById("lab-clinic-id");
    if (nameInput) nameInput.value = name;
    if (idInput) idInput.value = visit.clinicId || "";
  }
});

document.getElementById("lab-add-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const pet = getCurrentPet();
  if (!pet) return;
  if (!pendingLabPhotos.length) {
    showToast(t("toastNeedLabPhoto"));
    return;
  }
  const dateInput = document.getElementById("lab-date");
  const date = dateInput?.value || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

  const visit = findVisitByLink(
    pet,
    document.getElementById("lab-visit-link")?.value || ""
  );
  const typedClinic = (
    document.getElementById("lab-clinic-search")?.value || ""
  ).trim();
  const clinicName = selectedLabClinic
    ? clinicNameOf(selectedLabClinic)
    : document.getElementById("lab-clinic-name")?.value.trim() || typedClinic;
  const clinicId = selectedLabClinic?.id || (visit?.clinicId && !typedClinic
    ? visit.clinicId
    : document.getElementById("lab-clinic-id")?.value || "");

  const report = labsController.buildLabReport({
    petId: pet.id,
    date,
    types: LAB_TYPE_ORDER.filter((type) => selectedLabTypes.has(type)),
    clinic: clinicName || "",
    clinicId,
    visitDate: visit?.date || "",
    visitClinicId: visit?.clinicId || "",
    note: document.getElementById("lab-note")?.value.trim() || "",
    photos: [...pendingLabPhotos],
  });

  if (!labsController.addLabReport(pet.id, report)) {
    showPersistenceFailure();
    showToast(t("toastLabSaveFail"));
    return;
  }

  labAddBoundPetId = null;
  showToast(t("toastLabSaved"));
  applySelectedPet();
  go("labs");
});

document.getElementById("lab-list")?.addEventListener("click", (event) => {
  const removeBtn = event.target.closest("[data-lab-remove]");
  if (removeBtn) {
    const pet = getCurrentPet();
    if (!pet) return;
    const id = removeBtn.dataset.labRemove;
    if (!labsController.removeLabReport(pet.id, id)) {
      showPersistenceFailure();
      showToast(t("toastLabSaveFail"));
      return;
    }
    showToast(t("toastLabRemoved"));
    applySelectedPet();
    return;
  }
  const proofLightboxBtn = event.target.closest("[data-proof-lightbox]");
  if (proofLightboxBtn) {
    const img = proofLightboxBtn.querySelector("img");
    openProofLightbox(
      img?.currentSrc || img?.src,
      proofLightboxBtn.dataset.proofCaption
    );
  }
});

vaccineChipsEl?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-vaccine-key]");
  if (!chip || !vaccineChipsEl.contains(chip)) return;
  const key = chip.dataset.vaccineKey;
  const exclusiveGroups = new Set(["coreCombo", "felineCore"]);

  if (selectedVaccineKeys.has(key)) {
    selectedVaccineKeys.delete(key);
  } else {
    const group = VACCINE_PROTECTION_META[key]?.group || "";
    if (exclusiveGroups.has(group)) {
      [...selectedVaccineKeys].forEach((selectedKey) => {
        if (VACCINE_PROTECTION_META[selectedKey]?.group === group) {
          selectedVaccineKeys.delete(selectedKey);
        }
      });
    }
    selectedVaccineKeys.add(key);
  }

  vaccineChipsEl.querySelectorAll("[data-vaccine-key]").forEach((el) => {
    el.classList.toggle("is-on", selectedVaccineKeys.has(el.dataset.vaccineKey));
  });
});

alertTypeChips?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-alert-type]");
  if (!chip) return;
  setSelectedAlertType(chip.dataset.alertType);
});

alertSeverityChips?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-alert-severity]");
  if (!chip) return;
  setSelectedAlertSeverity(chip.dataset.alertSeverity);
});

alertForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveAlertFromForm();
});

alertCancelEditBtn?.addEventListener("click", () => {
  const keepType = selectedAlertType;
  resetAlertForm({ keepType });
});

alertSections?.addEventListener("click", (event) => {
  const sectionEditBtn = event.target.closest("[data-alert-section-edit]");
  if (sectionEditBtn) {
    event.stopPropagation();
    const sectionId = sectionEditBtn.dataset.alertSectionEdit;
    const section = sectionEditBtn.closest(".alert-section");
    if (!section || !sectionId) return;
    const on = !editingAlertSectionIds.has(sectionId);
    if (on) editingAlertSectionIds.add(sectionId);
    else editingAlertSectionIds.delete(sectionId);
    section.classList.toggle("is-editing", on);
    sectionEditBtn.setAttribute("aria-pressed", on ? "true" : "false");
    sectionEditBtn.textContent = t(on ? "alertSectionEditDone" : "alertSectionEdit");
    return;
  }
  const addBtn = event.target.closest("[data-alert-add-type]");
  if (addBtn) {
    event.stopPropagation();
    startNewAlert(addBtn.dataset.alertAddType);
    return;
  }
  const editBtn = event.target.closest("[data-alert-edit]");
  if (editBtn) {
    event.stopPropagation();
    const pet = getCurrentPet();
    const alert = getAlertsForPet(pet).find((item) => item.id === editBtn.dataset.alertEdit);
    beginEditAlert(alert);
    return;
  }
  const deleteBtn = event.target.closest("[data-alert-delete]");
  if (deleteBtn) {
    event.stopPropagation();
    deleteAlertById(deleteBtn.dataset.alertDelete);
  }
});

alertSections?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const editBtn = event.target.closest("[data-alert-edit]");
  if (!editBtn) return;
  event.preventDefault();
  const pet = getCurrentPet();
  const alert = getAlertsForPet(pet).find((item) => item.id === editBtn.dataset.alertEdit);
  beginEditAlert(alert);
});

vaccineGivenInput.addEventListener("change", syncVaccineNextDueFromGiven);

vaccineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const pet = getCurrentPet();
  const selected = getSelectedVaccineEntries();
  const given = vaccineGivenInput.value;
  const next = vaccineNextDueInput.value;

  const saveResult = vaccinesController.buildSaveEntries({
    pet,
    selected,
    given,
    next,
  });
  if (!saveResult.ok) {
    if (saveResult.reason === "need_name") {
      showToast(t("toastNeedVaccineName"));
    } else if (saveResult.reason === "species_blocked") {
      showToast(t("toastVaccineNotForCat", { name: saveResult.blocked.name }));
    } else if (saveResult.reason === "need_dates") {
      showToast(t("toastNeedVaccineDates"));
    } else if (saveResult.reason === "date_order") {
      showToast(t("toastVaccineOrder"));
    }
    return;
  }

  upsertPetVaccines(pet, saveResult.entries);

  const calPayload = buildVaccineCalendarPayload(pet, {
    vaccines: selected,
    given,
    next,
  });

  renderVaccines(pet);
  resetVaccineForm(pet);
  vaccineFormPetId = pet.id;
  showToast(
    t(saveResult.updated ? "toastVaccinesUpdated" : "toastVaccinesAdded", {
      name: pet.name,
      count: selected.length,
      vaccines: selected.map((entry) => entry.name).join("、"),
    })
  );
  if (calPayload) {
    showCalendarChooser(calPayload, t("vaccineCalChooserMeta", { date: next }));
  }
});

document.getElementById("parasite-chips-external")?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-parasite-product]");
  if (!chip) return;
  const key = chip.dataset.parasiteProduct;
  selectedParasiteProduct.external =
    selectedParasiteProduct.external === key ? "" : key;
  renderParasiteProductChips("external");
  if (selectedParasiteProduct.external) {
    const custom = document.getElementById("parasite-custom-external");
    if (custom) custom.value = "";
    const intervalEl = document.getElementById("parasite-interval-external");
    if (intervalEl && chip.dataset.interval) {
      intervalEl.value = chip.dataset.interval;
      syncParasiteNextFromLast("external");
    }
  }
});

document.getElementById("parasite-chips-heartworm")?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-parasite-product]");
  if (!chip) return;
  const key = chip.dataset.parasiteProduct;
  selectedParasiteProduct.heartworm =
    selectedParasiteProduct.heartworm === key ? "" : key;
  renderParasiteProductChips("heartworm");
  if (selectedParasiteProduct.heartworm) {
    const custom = document.getElementById("parasite-custom-heartworm");
    if (custom) custom.value = "";
    const intervalEl = document.getElementById("parasite-interval-heartworm");
    if (intervalEl && chip.dataset.interval) {
      intervalEl.value = chip.dataset.interval;
      syncParasiteNextFromLast("heartworm");
    }
  }
});

PARASITE_KINDS.forEach((kind) => {
  document
    .getElementById(`parasite-last-${kind}`)
    ?.addEventListener("change", () => syncParasiteNextFromLast(kind));
  document
    .getElementById(`parasite-interval-${kind}`)
    ?.addEventListener("input", () => syncParasiteNextFromLast(kind));
  document
    .getElementById(`parasite-interval-${kind}`)
    ?.addEventListener("change", () => syncParasiteNextFromLast(kind));
});

document.getElementById("parasite-form-external")?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveParasitePastAndOfferCalendar("external");
});

document.getElementById("parasite-form-heartworm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveParasitePastAndOfferCalendar("heartworm");
});

document.querySelectorAll("[data-parasite-dosed]").forEach((btn) => {
  btn.addEventListener("click", () => {
    saveParasiteDosedTodayAndOfferCalendar(btn.dataset.parasiteDosed);
  });
});

document.getElementById("parasite-cal-chooser")?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target === event.currentTarget || target.closest("[data-parasite-cal-close]")) {
    closeCalendarChooser();
    return;
  }
  const providerBtn = target.closest("[data-parasite-cal-provider]");
  if (!providerBtn) return;
  const provider = providerBtn.getAttribute("data-parasite-cal-provider");
  const payload = calendarChooserShell?.getPending?.() || null;
  closeCalendarChooser();
  if (!payload) return;
  if (provider === "apple") openAppleCalendar(payload);
  else if (provider === "google") openGoogleCalendar(payload);
});

document.getElementById("copy-card").addEventListener("click", async () => {
  const pet = getCurrentPet();
  if (!pet) return;
  try {
    await copyTextToClipboard(buildEmergencyCopyText(pet));
    showToast(t("toastCopied"));
  } catch {
    showToast(t("toastCopyFail"));
  }
});

document.getElementById("owner-settings-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = readOwnerSettingsForm();
  if (!saveOwnerProfile(profile)) {
    showPersistenceFailure();
    return;
  }
  renderEmergencyOwner();
  showToast(t("toastOwnerSaved"));
  goBack();
});

document.getElementById("e-pet-photo-edit")?.addEventListener("click", () => {
  openEditCurrentPet();
});

document.getElementById("e-pet-photo-input")?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const pet = getCurrentPet();
  if (!pet) return;
  try {
    const raw = await readFileAsDataUrl(file);
    await openPetPhotoCrop(raw, pet.id);
  } catch {
    showToast(t("toastPetPhotoFail"));
  }
});

const langFab = document.getElementById("lang-fab");
const langMenu = document.getElementById("lang-menu");

function closeLangMenu() {
  if (!langMenu || !langFab) return;
  langMenu.hidden = true;
  langFab.setAttribute("aria-expanded", "false");
}

if (langFab && langMenu) {
  langFab.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = langMenu.hidden;
    langMenu.hidden = !open;
    langFab.setAttribute("aria-expanded", open ? "true" : "false");
  });

  langMenu.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-lang]");
    if (!btn) return;
    setLanguage(btn.dataset.lang);
    closeLangMenu();
    showToast(t("langChanged"));
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("#lang-switcher")) return;
    closeLangMenu();
  });
}

let dynamicLanguageRefreshes = 0;
window.onLanguageChange = () => {
  dynamicLanguageRefreshes += 1;
  syncAlertSubmitLabel();
  syncBreedFields();
  petManageBtn.textContent = isManagingPets ? t("done") : t("manage");
  petSwitcherHint.textContent = isManagingPets
    ? t("petHintManage")
    : t("petHint");
  paintPetFormMode();
  // Force picker chrome without full applySelectedPet.
  renderPetPicker();
  // Home (+ active non-home) only; inactive groups stay dirty until go()/flush.
  renderCoordinator.refreshLanguage();
  paintCloudChrome();
  if (app.querySelector('[data-screen="manual"]')?.classList.contains("is-active")) {
    paintManualScreen();
  }
  if (DEMO_MODE && demoTourIndex >= 0) paintDemoTourStep();
  const activeScreen =
    app.querySelector(".screen.is-active")?.dataset.screen || "home";
  if (activeScreen === "parasite") {
    const pet = getCurrentPet();
    if (pet) fillParasiteScreen(pet);
  }
  renderPendingMeds();
  updateMedModeHint();
  if (pendingRemovePetId) setRemoveStep(removeStep);
  const archivePet = getPendingArchivePet();
  if (archivePet) {
    document.getElementById("archive-pet-name").textContent = archivePet.name;
    document.getElementById("archive-pet-meta").textContent =
      `${speciesLabelOf(archivePet)} · ${breedLabelOf(archivePet)} · ${ageLabelOf(
        archivePet
      )}`;
    document.getElementById("archive-pet-sub").textContent = t("archiveSubFor", {
      name: archivePet.name,
    });
  }
  if (selectedLabClinic) {
    setSelectedLabClinic(
      selectedLabClinic.anonymous || selectedLabClinic.id === "anonymous"
        ? getAnonymousClinic()
        : selectedLabClinic
    );
  }
  if (selectedClinic) {
    setSelectedClinic(
      selectedClinic.anonymous || selectedClinic.id === "anonymous"
        ? getAnonymousClinic()
        : selectedClinic
    );
  }
};

/* ---------- Intro + Google Drive backup ---------- */

const googleDriveAuth =
  (typeof PetLiveWeb !== "undefined" && PetLiveWeb.auth && PetLiveWeb.auth.googleDrive) ||
  null;
let cloudBackupTimer = null;
let lastCloudBackupAt = null;
let cloudBusy = false;
let suppressSyncMetaBump = false;
let cloudReconcileState = "idle";
let cloudReconcilePhase = "";
let cloudSyncConflict = false;
let cloudReconcileTimeout = null;

cloudController = PetLiveWeb.domains.cloud.createController({
  selectors: cloudSelectors,
  getPets: () => pets,
  getArchivedPets: () => archivedPets,
  getCurrentPetId: () => appState.getCurrentPetId(),
  setCurrentPetId: (id) => {
    currentPetId = id;
    appState.setCurrentPetId(id);
  },
  petsGraph,
  petsGraphSlot,
  ownerProfileSlot,
  ownerAlertsSlot,
  suppressedAlertsSlot,
  petPhotosSlot,
  labReportsSlot,
  syncMetaSlot,
  isDemoMode: () => DEMO_MODE,
  getSuppressSyncMetaBump: () => suppressSyncMetaBump,
  setSuppressSyncMetaBump: (value) => {
    suppressSyncMetaBump = Boolean(value);
  },
  hasStoredSyncMeta,
  hasStoredPetsGraph,
  readPetsGraphSnapshot: () => petsGraphSlot.read(),
  onAfterApply: () => {
    hydratePetPhotos();
    applySelectedPet();
  },
  scheduleCloudBackup: () => {
    if (typeof scheduleCloudBackup === "function") scheduleCloudBackup();
  },
});

function stripHeavyMedia(value) {
  return cloudController.stripHeavyMedia(value);
}

function buildCloudPayload() {
  return cloudController.buildCloudPayload();
}

function applyCloudPayload(payload) {
  return cloudController.applyCloudPayload(payload);
}

function bumpLocalDataRevision() {
  if (!cloudController) return;
  return cloudController.bumpLocalDataRevision();
}

function markCloudSynced(cloudUpdatedAt) {
  return cloudController.markCloudSynced(cloudUpdatedAt);
}

function clearSeedPetsFromMemory() {
  return cloudController.clearSeedPetsFromMemory();
}

function isFreshDevice() {
  return cloudSelectors.isFreshDevice({
    meta: cloudController.readSyncMeta(),
    hasStoredGraph: hasStoredPetsGraph(),
  });
}

function hasRealLocalData() {
  return cloudSelectors.hasRealLocalData({
    meta: cloudController.readSyncMeta(),
    memoryPets: pets,
  });
}

function localCloudGraphFingerprint(petList) {
  return cloudSelectors.localCloudGraphFingerprint(petList);
}

function cloudPayloadGraphFingerprint(payload) {
  return cloudSelectors.cloudPayloadGraphFingerprint(payload);
}

function hasCloudGraphConflict(payload) {
  return cloudSelectors.hasCloudGraphConflict({
    localPets: pets,
    payload,
    meta: cloudController.readSyncMeta(),
    hasStoredGraph: hasStoredPetsGraph(),
    memoryPets: pets,
  });
}

function isLocalDirty() {
  return cloudSelectors.isLocalDirty(cloudController.readSyncMeta());
}

function readSyncMeta() {
  return cloudController.readSyncMeta();
}

function writeSyncMeta(meta) {
  return cloudController.writeSyncMeta(meta);
}

function accountSyncStatusText() {
  const key = cloudSelectors.accountSyncStatusKey({
    signedIn: liveGoogleSignedIn(),
    reconcileState: cloudReconcileState,
    reconcilePhase: cloudReconcilePhase,
    conflict: cloudSyncConflict,
    meta: cloudController.readSyncMeta(),
    lastBackupAt: lastCloudBackupAt,
    hasRealLocal: hasRealLocalData(),
  });
  return t(key);
}

function isCloudReconcileBusy() {
  return cloudReconcileState === "running";
}

function setCloudReconcileState(next, { phase } = {}) {
  cloudReconcileState = next;
  cloudReconcilePhase = phase || "";
  paintReconcileUi();
}

function paintReconcileUi() {
  const bar = document.getElementById("cloud-reconcile-status");
  if (!bar) return;
  if (FRESH_BOOT && liveGoogleSignedIn() && cloudReconcileState !== "running") {
    bar.hidden = false;
    bar.textContent = t("freshBootHint");
    return;
  }
  if (RESTORE_BOOT && liveGoogleSignedIn() && cloudReconcileState !== "running") {
    bar.hidden = false;
    bar.textContent = t("restoreBootHint");
    return;
  }
  if (
    !liveGoogleSignedIn() ||
    cloudReconcileState === "idle" ||
    cloudReconcileState === "done"
  ) {
    bar.hidden = true;
    bar.textContent = "";
    return;
  }
  bar.hidden = false;
  if (cloudReconcileState === "running") {
    bar.textContent =
      cloudReconcilePhase === "restoring"
        ? t("accountSyncRestoring")
        : t("accountSyncChecking");
  } else if (cloudReconcileState === "error") {
    bar.textContent = t("accountSyncError");
  }
}

async function reconcileCloudOnBoot({ silent, skipAutoPull } = {}) {
  if (DEMO_MODE || !googleDriveAuth?.getSession?.().signedIn) return;
  if (skipAutoPull || FRESH_BOOT) {
    cloudSyncConflict = false;
    setCloudReconcileState("done");
    paintCloudChrome();
    return;
  }
  if (cloudReconcileTimeout) {
    clearTimeout(cloudReconcileTimeout);
    cloudReconcileTimeout = null;
  }
  cloudSyncConflict = false;
  setCloudReconcileState("running", { phase: "checking" });
  paintCloudChrome();

  cloudReconcileTimeout = setTimeout(() => {
    if (cloudReconcileState === "running") {
      setCloudReconcileState("error");
      paintCloudChrome();
    }
  }, 15000);

  let didPull = false;
  try {
    if (isFreshDevice() || isSeedOnlyPets(pets)) {
      clearSeedPetsFromMemory();
    }

    const payload = await googleDriveAuth.downloadJson();
    if (!payload || isSeedOnlyCloudPayload(payload)) {
      if (hasRealLocalData()) {
        await pushCloudBackup({ silent: true });
      }
      setCloudReconcileState("done");
      return;
    }

    if (isLocalDirty()) {
      setCloudReconcileState("done");
      return;
    }

    const cloudAt = String(payload.updatedAt || "");
    const lastCloud = String(readSyncMeta().lastCloudUpdatedAt || "");
    const cloudNewer = cloudAt && (!lastCloud || cloudAt > lastCloud);

    if (hasCloudGraphConflict(payload) && !cloudNewer) {
      cloudSyncConflict = true;
      setCloudReconcileState("done");
      return;
    }

    if (cloudNewer) {
      setCloudReconcileState("running", { phase: "restoring" });
      paintCloudChrome();
      suppressSyncMetaBump = true;
      try {
        const applied = applyCloudPayload(payload);
        if (applied) {
          markCloudSynced(cloudAt);
          lastCloudBackupAt = Date.now();
          didPull = true;
          if (!silent) showToast(t("cloudRestoreOk"));
        }
      } finally {
        suppressSyncMetaBump = false;
      }
    }

    setCloudReconcileState("done");
  } catch {
    setCloudReconcileState("error");
  } finally {
    if (cloudReconcileTimeout) {
      clearTimeout(cloudReconcileTimeout);
      cloudReconcileTimeout = null;
    }
    if (didPull || cloudReconcileState === "done") {
      applySelectedPet();
    }
    paintCloudChrome();
  }
}

function setIntroStatus(message) {
  const el = document.getElementById("intro-status");
  if (el) el.textContent = message || "";
}

function closeAccountMenu() {
  PetLiveWeb.shell.closeAccountMenu(document);
}

function getAccountSessionForChrome() {
  const live = googleDriveAuth?.getSession?.();
  if (live) return live;
  return {
    configured: false,
    signedIn: false,
    profile: null,
  };
}

function setAccountAvatar(imgEl, fallbackEl, picture, initial) {
  PetLiveWeb.shell.setAccountAvatar(imgEl, fallbackEl, picture, initial);
}

function positionAccountPopover(anchorChip) {
  PetLiveWeb.shell.positionAccountPopover(document, window, anchorChip);
}

function paintAccountMenu(session) {
  const view = PetLiveWeb.shell.buildAccountChromePresentation(session, {
    fallbackLabel: t("accountFallback"),
  });
  PetLiveWeb.shell.applyAccountMenuPaint(document, view, {
    syncStatusText: view.signedIn ? accountSyncStatusText() : "",
    chipAriaLabel: t("accountChipAria"),
  });
  if (!view.signedIn) return;

  // B: keep live reconcile busy/conflict chrome (shell defaults clear these).
  const busy = isCloudReconcileBusy();
  const popSyncBtn = document.getElementById("account-popover-edit");
  const popRestoreBtn = document.getElementById("account-popover-restore");
  const conflictHint = document.getElementById("account-popover-conflict-hint");
  if (popSyncBtn) popSyncBtn.disabled = busy;
  if (popRestoreBtn) popRestoreBtn.disabled = busy;
  if (conflictHint) {
    conflictHint.hidden = !cloudSyncConflict || busy;
    conflictHint.textContent = cloudSyncConflict
      ? t("accountSyncConflictHint")
      : "";
  }
}

function liveGoogleSignedIn() {
  return Boolean(googleDriveAuth?.getSession?.().signedIn);
}

function paintCloudChrome() {
  const session = getAccountSessionForChrome();
  const origin = window.location.origin || "";
  const busy = Boolean(
    session.authBusy || googleDriveAuth?.isAuthBusy?.()
  );

  paintAccountMenu(session);
  paintReconcileUi();

  PetLiveWeb.shell.applyIntroCloudVisibility(
    {
      loginBtn: document.getElementById("intro-login-btn"),
      account: document.getElementById("intro-account"),
      avatar: document.getElementById("intro-avatar"),
    },
    session
  );

  PetLiveWeb.shell.applyAuthBusyState?.(document, busy);

  const loginLabel = document.querySelector("#intro-login-btn .intro-login-label");
  if (loginLabel && !session.signedIn) {
    const key = session.remembered
      ? "loginContinueWithGoogle"
      : "loginWithGoogle";
    loginLabel.setAttribute("data-i18n", key);
    loginLabel.textContent = t(key);
    const loginBtn = document.getElementById("intro-login-btn");
    if (loginBtn) {
      loginBtn.setAttribute("data-i18n-aria", key);
      loginBtn.setAttribute("aria-label", t(key));
    }
  }

  const originHint = document.getElementById("intro-origin-hint");
  if (originHint) {
    const hint = PetLiveWeb.shell.resolveOriginHint(
      { configured: session.configured, origin },
      {
        needConfig: t("cloudBackupNeedConfig"),
        lanBlocked: t("oauthLanBlocked", { origin }),
        originHint: "",
      }
    );
    // B: hide generic OAuth origin reminder on Pages/localhost; show config/LAN only.
    if (!session.configured || hint.text) {
      originHint.hidden = false;
      originHint.textContent = hint.text;
    } else {
      originHint.hidden = true;
      originHint.textContent = "";
    }
  }
}

function scheduleCloudBackup() {
  if (DEMO_MODE) return;
  if (!googleDriveAuth?.getSession?.().signedIn) return;
  if (cloudBackupTimer) clearTimeout(cloudBackupTimer);
  cloudBackupTimer = setTimeout(() => {
    cloudBackupTimer = null;
    pushCloudBackup({ silent: true });
  }, 1800);
}

async function pushCloudBackup({ silent } = {}) {
  if (DEMO_MODE) return false;
  if (!googleDriveAuth) return false;
  const session = googleDriveAuth.getSession();
  if (!session.configured) {
    if (!silent) {
      setIntroStatus(t("cloudBackupNeedConfig"));
      showToast(t("cloudBackupNeedConfig"));
    }
    paintCloudChrome();
    return false;
  }
  if (!session.signedIn) {
    if (!silent) setIntroStatus(t("cloudBackupPending"));
    return false;
  }
  if (cloudBusy) return false;
  if (!hasRealLocalData()) {
    if (!silent) showToast(t("accountSyncFirstBackup"));
    paintCloudChrome();
    return false;
  }
  cloudBusy = true;
  try {
    const payload = buildCloudPayload();
    await googleDriveAuth.uploadJson(payload);
    lastCloudBackupAt = Date.now();
    markCloudSynced(payload.updatedAt);
    cloudSyncConflict = false;
    if (!silent) {
      setIntroStatus(t("cloudBackupOk"));
      showToast(t("cloudBackupOk"));
    }
    paintCloudChrome();
    return true;
  } catch {
    if (!silent) {
      setIntroStatus(t("cloudBackupFail"));
      showToast(t("cloudBackupFail"));
    }
    paintCloudChrome();
    return false;
  } finally {
    cloudBusy = false;
  }
}

async function pullCloudBackup({ silent } = {}) {
  if (!googleDriveAuth) return false;
  try {
    const payload = await googleDriveAuth.downloadJson();
    if (!payload) return false;
    suppressSyncMetaBump = true;
    let applied = false;
    try {
      applied = applyCloudPayload(payload);
      if (applied) markCloudSynced(payload.updatedAt);
    } finally {
      suppressSyncMetaBump = false;
    }
    if (!applied) {
      paintCloudChrome();
      return false;
    }
    lastCloudBackupAt = Date.now();
    cloudSyncConflict = false;
    if (!silent) showToast(t("cloudRestoreOk"));
    paintCloudChrome();
    return true;
  } catch {
    if (!silent) showToast(t("cloudBackupFail"));
    return false;
  }
}

async function handleGoogleSignIn({ enterApp } = {}) {
  if (!googleDriveAuth) {
    setIntroStatus(t("cloudBackupNeedConfig"));
    return;
  }
  if (googleDriveAuth.isAuthBusy?.()) {
    return;
  }
  if (!googleDriveAuth.getSession().configured) {
    setIntroStatus(t("cloudBackupNeedConfig"));
    showToast(t("cloudBackupNeedConfig"));
    paintCloudChrome();
    return;
  }
  try {
    setIntroStatus("…");
    paintCloudChrome();
    await googleDriveAuth.signIn();
    const session = googleDriveAuth.getSession();
    setIntroStatus(
      t("cloudSignedInAs", { email: session.profile?.email || "" })
    );
    paintCloudChrome();
    // Enter app immediately after the single login popup.
    if (enterApp !== false) {
      enterAppFromIntro();
    }
    // Silent backup only — never opens another Google popup.
    window.setTimeout(() => {
      Promise.resolve()
        .then(async () => {
          try {
            if (isFreshDevice() || isSeedOnlyPets(pets)) {
              clearSeedPetsFromMemory();
            }
            await reconcileCloudOnBoot({ silent: true, skipAutoPull: FRESH_BOOT });
          } catch {
            /* Drive may need explicit Sync later; do not re-prompt here */
          }
          paintCloudChrome();
        })
        .catch(() => {
          paintCloudChrome();
        });
    }, 400);
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg === "auth_busy") {
      paintCloudChrome();
      return;
    }
    if (msg === "missing_client_id") {
      setIntroStatus(t("cloudBackupNeedConfig"));
    } else if (
      msg.includes("popup_closed") ||
      msg.includes("access_denied") ||
      msg.includes("popup_failed") ||
      msg.includes("auth_timeout")
    ) {
      setIntroStatus(t("cloudLoginCancelled"));
      showToast(t("cloudLoginCancelled"));
    } else {
      setIntroStatus(t("cloudBackupFail"));
      showToast(t("cloudBackupFail"));
    }
    paintCloudChrome();
  }
}

function markIntroSeen() {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

function enterAppFromIntro() {
  markIntroSeen();
  go("home", { replace: true });
}

function initIntroAndCloud() {
  function doSignOut() {
    closeAccountMenu();
    googleDriveAuth?.signOut?.();
    lastCloudBackupAt = null;
    setIntroStatus("");
    paintCloudChrome();
    showToast(t("logout"));
    // Google gate: unsigned users must not stay on B.
    const introEl = app.querySelector('[data-screen="intro"]');
    if (introEl) go("intro", { replace: true });
  }

  function openOwnerSettingsFromAccount() {
    closeAccountMenu();
    go("owner-settings");
  }

  function startWithGoogleOrEnter() {
    if (googleDriveAuth?.isAuthBusy?.()) return;
    if (googleDriveAuth?.getSession?.().signedIn) {
      enterAppFromIntro();
      return;
    }
    handleGoogleSignIn({ enterApp: true });
  }

  function showSurface(enterB) {
    const intro = app.querySelector('[data-screen="intro"]');
    const home = app.querySelector('[data-screen="home"]');
    if (!intro || !home) return;
    if (enterB) {
      intro.classList.remove("is-active");
      intro.hidden = true;
      home.hidden = false;
      home.classList.add("is-active");
      markIntroSeen();
    } else {
      home.classList.remove("is-active");
      home.hidden = true;
      intro.hidden = false;
      intro.classList.add("is-active");
    }
  }

  PetLiveWeb.shell.bindIntroCloudListeners(document, window, {
    onLogin: startWithGoogleOrEnter,
    onLogout: doSignOut,
    onOpenOwnerSettings: openOwnerSettingsFromAccount,
    onSync: async () => {
      if (isCloudReconcileBusy()) return;
      if (googleDriveAuth?.isAuthBusy?.()) return;
      closeAccountMenu();
      try {
        await googleDriveAuth?.ensureDriveAccess?.();
      } catch (err) {
        if (String(err?.message || err) === "auth_busy") return;
        showToast(t("cloudBackupFail"));
        return;
      }
      await pushCloudBackup({ silent: false });
    },
    onRestore: async () => {
      if (isCloudReconcileBusy()) return;
      if (googleDriveAuth?.isAuthBusy?.()) return;
      if (!window.confirm(t("accountRestoreConfirm"))) return;
      closeAccountMenu();
      try {
        await googleDriveAuth?.ensureDriveAccess?.();
      } catch (err) {
        if (String(err?.message || err) === "auth_busy") return;
        showToast(t("cloudBackupFail"));
        return;
      }
      await pullCloudBackup({ silent: false });
    },
    onGoHome: () => go("home"),
    onSwitchPreview: () => {
      if (googleDriveAuth?.isAuthBusy?.()) return;
      if (googleDriveAuth) {
        handleGoogleSignIn({ enterApp: false });
      } else {
        showToast(t("accountSwitchPreview"));
      }
    },
    onPaint: paintCloudChrome,
    closeAccountMenu,
    closeAppNavMenu,
    positionAccountPopover: (doc, win, chip) => {
      PetLiveWeb.shell.positionAccountPopover(doc, win, chip);
    },
    registerSessionChange: (paintFn) => {
      googleDriveAuth?.onSessionChange?.(paintFn);
    },
  });

  // Boot: A (intro) by default → Google login enters B.
  // Live token → B. Remembered intent → await silent restore; success → B; fail → A + CTA.
  // Escape hatch: ?app=1 / screen=home / ?demo=1.
  // Do NOT skip A for INTRO_SEEN, remembered profile alone, or hasRealLocalData.
  // Do NOT use C bootSurfaceToHome — preserves B Google-gate / local-first.
  void (async () => {
    try {
      const params = new URLSearchParams(window.location.search || "");
      const forceApp =
        DEMO_MODE ||
        params.get("app") === "1" ||
        params.get("screen") === "home";

      if (forceApp) {
        showSurface(true);
        paintCloudChrome();
        return;
      }

      let session = googleDriveAuth?.getSession?.() || {
        signedIn: false,
        remembered: false,
      };

      // Hold on A while silent restore runs — never flash B then kick back.
      if (!session.signedIn && session.remembered && googleDriveAuth?.trySilentRestore) {
        setIntroStatus(t("cloudRestoringSession"));
        showSurface(false);
        paintCloudChrome();
        try {
          await googleDriveAuth.trySilentRestore();
        } catch {
          /* stay unsigned; interactive CTA below */
        }
        session = googleDriveAuth.getSession();
      }

      if (session.signedIn) {
        showSurface(true);
        paintCloudChrome();
        if (!DEMO_MODE) {
          reconcileCloudOnBoot({ silent: true, skipAutoPull: FRESH_BOOT });
        }
        return;
      }

      showSurface(false);
      if (session.remembered) {
        setIntroStatus(
          t("cloudRememberedNeedGoogle", {
            email: session.profile?.email || "",
          })
        );
      }
      paintCloudChrome();
    } catch {
      showSurface(false);
      paintCloudChrome();
    }
  })();
  // Formal B: never inject prototype seed pets except ?demo=1.
}


/* —— Demo mode (?demo=1): browse-only seed + optional tour —— */

let demoTourIndex = -1;
let demoTourTargetEl = null;

function getDemoTourSteps() {
  return [
    {
      screen: "home",
      selector: "#pet-picker",
      textKey: "demoTourStepPet",
    },
    {
      screen: "home",
      selector: '.cta-row [data-go="emergency"]',
      textKey: "demoTourStepCard",
      allowGo: "emergency",
    },
    {
      screen: "emergency",
      selector: 'button[data-go="timeline"]',
      textKey: "demoTourStepTimeline",
      allowGo: "timeline",
    },
    {
      screen: "home",
      selector: '.cta-row [data-go="add-visit"]',
      textKey: "demoTourStepVisit",
      allowGo: "add-visit",
    },
    {
      screen: "home",
      selector: "#demo-banner",
      textKey: "demoTourStepDone",
    },
  ];
}

function resetDemoSeed() {
  petsGraph.replaceGraph({ pets: cloneSeedPets(), archivedPets: [] });
  const nextId = pets[0]?.id || null;
  currentPetId = nextId;
  if (nextId) appState.setCurrentPetId(nextId);
  pendingMeds = [];
  if (typeof clearLiveProofPhotos === "function") clearLiveProofPhotos();
  completingVisitRef = null;
  latestRxUserCollapsed = false;
  hydratePetPhotos();
  applySelectedPet();
  go("home", { replace: true });
  showToast(t("demoResetDone"));
}

function clearDemoTourHighlight() {
  demoTourTargetEl?.classList.remove("demo-tour-target");
  demoTourTargetEl = null;
  const spot = document.getElementById("demo-tour-spot");
  if (spot) spot.hidden = true;
}

function positionDemoTourSpot(el) {
  const spot = document.getElementById("demo-tour-spot");
  if (!spot || !el) {
    if (spot) spot.hidden = true;
    return;
  }
  const rect = el.getBoundingClientRect();
  const pad = 8;
  spot.hidden = false;
  spot.style.top = `${Math.max(0, rect.top - pad)}px`;
  spot.style.left = `${Math.max(0, rect.left - pad)}px`;
  spot.style.width = `${rect.width + pad * 2}px`;
  spot.style.height = `${rect.height + pad * 2}px`;
}

function endDemoTour({ markSeen = true } = {}) {
  demoTourIndex = -1;
  clearDemoTourHighlight();
  const overlay = document.getElementById("demo-tour");
  if (overlay) overlay.hidden = true;
  document.body.classList.remove("demo-tour-active");
  if (markSeen) {
    try {
      sessionStorage.setItem(DEMO_TOUR_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }
}

function paintDemoTourStep() {
  const steps = getDemoTourSteps();
  const overlay = document.getElementById("demo-tour");
  const textEl = document.getElementById("demo-tour-text");
  const stepEl = document.getElementById("demo-tour-step");
  const nextBtn = document.getElementById("demo-tour-next");
  if (!overlay || demoTourIndex < 0) return;

  if (demoTourIndex >= steps.length) {
    endDemoTour();
    return;
  }

  const step = steps[demoTourIndex];
  clearDemoTourHighlight();
  if (step.screen) go(step.screen, { replace: true });

  window.requestAnimationFrame(() => {
    const target = step.selector
      ? document.querySelector(step.selector)
      : null;
    if (target) {
      demoTourTargetEl = target;
      target.classList.add("demo-tour-target");
      target.scrollIntoView({ block: "nearest", behavior: "smooth" });
      positionDemoTourSpot(target);
    } else {
      positionDemoTourSpot(null);
    }
    if (textEl) textEl.textContent = t(step.textKey);
    if (stepEl) {
      stepEl.textContent = t("demoTourProgress", {
        current: String(demoTourIndex + 1),
        total: String(steps.length),
      });
    }
    if (nextBtn) {
      nextBtn.textContent =
        demoTourIndex >= steps.length - 1 ? t("demoTourDone") : t("demoTourNext");
    }
    overlay.hidden = false;
    document.body.classList.add("demo-tour-active");
  });
}

function startDemoTour() {
  if (!DEMO_MODE) return;
  demoTourIndex = 0;
  paintDemoTourStep();
}

function advanceDemoTour() {
  if (demoTourIndex < 0) return;
  demoTourIndex += 1;
  paintDemoTourStep();
}

function initDemoMode() {
  if (!DEMO_MODE) return;

  document.documentElement.classList.add("is-demo-mode");
  document.body.classList.add("is-demo-mode");

  const banner = document.getElementById("demo-banner");
  if (banner) banner.hidden = false;

  document.getElementById("demo-reset-btn")?.addEventListener("click", () => {
    endDemoTour({ markSeen: false });
    resetDemoSeed();
  });
  document.getElementById("demo-tour-btn")?.addEventListener("click", () => {
    startDemoTour();
  });
  document.getElementById("demo-tour-skip")?.addEventListener("click", () => {
    endDemoTour();
  });
  document.getElementById("demo-tour-next")?.addEventListener("click", () => {
    advanceDemoTour();
  });

  window.addEventListener(
    "resize",
    () => {
      if (demoTourTargetEl) positionDemoTourSpot(demoTourTargetEl);
    },
    { passive: true }
  );

  document.addEventListener(
    "submit",
    (event) => {
      if (!DEMO_MODE) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      notifyDemoReadOnly();
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      if (!DEMO_MODE) return;
      const writeBtn = event.target.closest?.(
        "#save-photo-rx-btn, #photo-crop-save, [data-parasite-dosed]"
      );
      if (!writeBtn) return;
      if (writeBtn.closest("#demo-banner, #demo-tour")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      notifyDemoReadOnly();
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      if (!DEMO_MODE || demoTourIndex < 0) return;
      if (event.target.closest("#demo-tour, #demo-banner")) return;
      const steps = getDemoTourSteps();
      const step = steps[demoTourIndex];
      const target = demoTourTargetEl;
      const onTarget = target && target.contains(event.target);
      if (onTarget) {
        const goTo = event.target
          .closest?.("[data-go]")
          ?.getAttribute("data-go");
        if (step?.allowGo && goTo === step.allowGo) {
          window.setTimeout(() => advanceDemoTour(), 280);
        }
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );

  let tourSeen = false;
  try {
    tourSeen = sessionStorage.getItem(DEMO_TOUR_SEEN_KEY) === "1";
  } catch {
    tourSeen = false;
  }
  if (!tourSeen) {
    window.setTimeout(() => startDemoTour(), 480);
  }
}


applyI18n();
syncAlertSubmitLabel();
syncBreedFields();
syncDateProxies();
hydratePetPhotos();
applySelectedPet();
setMedEntryMode("photo");
setMedUnitChip("unrecorded");
setMedFreqChip("unrecorded");
enhanceGlassScreenHeads();
applyI18n();
initAppNavMenu();
initIntroAndCloud();
initDemoMode();

if (typeof PetLiveWeb?.storage?.markBootComplete === "function") {
  const storageBackend = PetLiveWeb.storage.getBackend?.();
  PetLiveWeb.storage.markBootComplete().then(() => {
    if (storageBackend !== "idb") return;
    const nextId = hydratePetsGraphFromStorage();
    if (nextId) {
      currentPetId = nextId;
      appState.setCurrentPetId(nextId);
    }
    applySelectedPet();
  });
}

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  closeAppNavMenu();
  closeAccountMenu();
  resetPageScroll();
  if (app.querySelector('[data-screen="home"]')?.classList.contains("is-active")) {
    resetPetPickerScroll();
  }
});

PetLiveWeb.metrics = {
  getSnapshot() {
    return {
      renders: renderCoordinator.getMetrics(),
      storage: {
        ownerAlerts: ownerAlertsSlot.getStats(),
        suppressedAlerts: suppressedAlertsSlot.getStats(),
        petPhotos: petPhotosSlot.getStats(),
        labReports: labReportsSlot.getStats(),
        ownerProfile: ownerProfileSlot.getStats(),
        petsGraph: petsGraphSlot.getStats(),
      },
      i18n: { dynamicLanguageRefreshes },
      timelineHtmlBytes: timelineList?.innerHTML.length || 0,
      petSelectionPaintSamples: [...petSelectionPaintSamples],
    };
  },
};
