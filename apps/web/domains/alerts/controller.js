(function initPetLiveWebAlertsController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.alerts = root.domains.alerts || {};

  const ALERT_TYPE_ORDER = [
    "drug_allergy",
    "food_allergy",
    "adverse_drug_reaction",
    "vaccine_reaction",
    "chronic_disease",
    "special_note",
  ];

  const DEFAULT_ALERT_SEVERITY = {
    drug_allergy: "critical",
    adverse_drug_reaction: "critical",
    vaccine_reaction: "critical",
    food_allergy: "caution",
    chronic_disease: "caution",
    special_note: "caution",
  };

  function createController({ ownerAlertsSlot, suppressedAlertsSlot } = {}) {
    if (
      !ownerAlertsSlot ||
      typeof ownerAlertsSlot.read !== "function" ||
      typeof ownerAlertsSlot.write !== "function"
    ) {
      throw new TypeError("createController requires ownerAlertsSlot with read/write");
    }
    if (
      !suppressedAlertsSlot ||
      typeof suppressedAlertsSlot.read !== "function" ||
      typeof suppressedAlertsSlot.write !== "function"
    ) {
      throw new TypeError("createController requires suppressedAlertsSlot with read/write");
    }

    function defaultSeverityForType(alertType) {
      return DEFAULT_ALERT_SEVERITY[alertType] || "caution";
    }

    function normalizeSeverity(value, alertType) {
      if (value === "critical" || value === "high") return "critical";
      if (value === "caution") return "caution";
      return defaultSeverityForType(alertType);
    }

    function inferAlertType(alert) {
      if (ALERT_TYPE_ORDER.includes(alert.alertType)) return alert.alertType;
      const label = String(alert.type || "");
      if (/藥物過敏|drug.?allerg/i.test(label)) return "drug_allergy";
      if (/食物過敏|food.?allerg/i.test(label)) return "food_allergy";
      if (/不良反應|adverse/i.test(label)) return "adverse_drug_reaction";
      if (/疫苗|vaccine/i.test(label)) return "vaccine_reaction";
      if (/慢性|chronic/i.test(label)) return "chronic_disease";
      if (/特別|注意|special|note/i.test(label)) return "special_note";
      return "special_note";
    }

    function normalizeAlert(alert, fallbackSource = "linked") {
      const alertType = inferAlertType(alert);
      const description = alert.desc || alert.text || alert.description || "";
      const note = alert.note || alert.severityNote || "";
      const source = alert.source === "owner" ? "owner" : fallbackSource;
      const sinceRaw = alert.sinceDate || alert.since || "";
      const sinceDate = typeof sinceRaw === "string" ? sinceRaw.trim() : "";
      return {
        id: alert.id || `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        alertType,
        source,
        text: alert.text || description,
        desc: description,
        description,
        note,
        severityNote: note,
        severity: normalizeSeverity(alert.severity, alertType),
        sinceDate: sinceDate || null,
        createdAt: alert.createdAt || null,
      };
    }

    function formatAlertSince(sinceDate) {
      if (!sinceDate) return "";
      const raw = String(sinceDate).trim();
      if (/^\d{4}-\d{2}$/.test(raw)) return raw;
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
      return raw;
    }

    function toMonthInputValue(sinceDate) {
      const formatted = formatAlertSince(sinceDate);
      return /^\d{4}-\d{2}$/.test(formatted) ? formatted : "";
    }

    function loadOwnerAlertsMap() {
      return ownerAlertsSlot.read();
    }

    function saveOwnerAlertsMap(map) {
      return ownerAlertsSlot.write(map);
    }

    function loadSuppressedAlertsMap() {
      return suppressedAlertsSlot.read();
    }

    function saveSuppressedAlertsMap(map) {
      return suppressedAlertsSlot.write(map);
    }

    function getSuppressedAlertIds(petId) {
      const map = loadSuppressedAlertsMap();
      const list = Array.isArray(map[petId]) ? map[petId] : [];
      return new Set(list.map(String));
    }

    function suppressLinkedAlert(petId, alertId) {
      if (!petId || !alertId) return false;
      const map = loadSuppressedAlertsMap();
      const next = new Set(
        Array.isArray(map[petId]) ? map[petId].map(String) : []
      );
      next.add(String(alertId));
      map[petId] = [...next];
      return saveSuppressedAlertsMap(map);
    }

    function getLinkedAlerts(pet) {
      const suppressed = getSuppressedAlertIds(pet.id);
      return (pet.alerts || [])
        .filter((alert) => alert.source !== "owner")
        .filter((alert) => !suppressed.has(String(alert.id)))
        .map((alert) => normalizeAlert(alert, "linked"));
    }

    function getOwnerAlerts(petId) {
      const map = loadOwnerAlertsMap();
      const list = Array.isArray(map[petId]) ? map[petId] : [];
      return list.map((alert) => normalizeAlert(alert, "owner"));
    }

    function persistOwnerAlertsForPet(petId, ownerAlerts) {
      const map = loadOwnerAlertsMap();
      map[petId] = ownerAlerts.map((alert) => ({
        id: alert.id,
        alertType: alert.alertType,
        source: "owner",
        description: alert.description || alert.desc || alert.text,
        text: alert.text || alert.description || alert.desc,
        desc: alert.desc || alert.description || alert.text,
        note: alert.note || alert.severityNote || "",
        severityNote: alert.note || alert.severityNote || "",
        severity: alert.severity,
        sinceDate: alert.sinceDate || null,
        createdAt: alert.createdAt || new Date().toISOString(),
      }));
      if (!map[petId].length) delete map[petId];
      return saveOwnerAlertsMap(map);
    }

    function sortAlerts(alerts) {
      const rank = { critical: 0, caution: 1 };
      return [...alerts].sort((a, b) => {
        const sr = (rank[a.severity] ?? 2) - (rank[b.severity] ?? 2);
        if (sr) return sr;
        const ai = ALERT_TYPE_ORDER.indexOf(a.alertType);
        const bi = ALERT_TYPE_ORDER.indexOf(b.alertType);
        if (ai !== bi) return ai - bi;
        return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      });
    }

    function getAlertsForPet(pet) {
      if (!pet) return [];
      const owner = getOwnerAlerts(pet.id);
      const ownerIds = new Set(owner.map((alert) => String(alert.id)));
      const linked = getLinkedAlerts(pet).filter(
        (alert) => !ownerIds.has(String(alert.id))
      );
      return sortAlerts([...linked, ...owner]);
    }

    function validateOwnerDraft({ alertType, description, sinceDate, severity } = {}) {
      const desc = String(description ?? "").trim();
      if (!desc) return { ok: false, reason: "empty_description" };
      const type = ALERT_TYPE_ORDER.includes(alertType) ? alertType : "special_note";
      if (type === "chronic_disease" && sinceDate != null && sinceDate !== "") {
        const formatted = formatAlertSince(sinceDate);
        if (formatted && !/^\d{4}-\d{2}$/.test(formatted)) {
          return { ok: false, reason: "invalid_since_date" };
        }
      }
      if (severity != null && severity !== "critical" && severity !== "caution" && severity !== "high") {
        return { ok: false, reason: "invalid_severity" };
      }
      return { ok: true };
    }

    function ownerAlertFromDraft(draft, base = {}) {
      const alertType = ALERT_TYPE_ORDER.includes(draft.alertType)
        ? draft.alertType
        : "special_note";
      const description = String(draft.description ?? "").trim();
      const note = String(draft.note ?? draft.severityNote ?? "").trim();
      const sinceDate =
        alertType === "chronic_disease" && draft.sinceDate
          ? formatAlertSince(draft.sinceDate) || null
          : null;
      return normalizeAlert(
        {
          ...base,
          id: draft.id || base.id,
          alertType,
          source: "owner",
          description,
          text: description,
          desc: description,
          note,
          severityNote: note,
          severity: draft.severity ?? base.severity,
          sinceDate,
          createdAt: base.createdAt || draft.createdAt || new Date().toISOString(),
        },
        "owner"
      );
    }

    function createOwnerAlert(petId, draft) {
      if (!petId) return { ok: false, reason: "missing_pet_id" };
      const validation = validateOwnerDraft(draft);
      if (!validation.ok) return validation;
      const alert = ownerAlertFromDraft({
        ...draft,
        id:
          draft.id ||
          `a-owner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      });
      const ownerAlerts = [...getOwnerAlerts(petId), alert];
      if (!persistOwnerAlertsForPet(petId, ownerAlerts)) {
        return { ok: false, reason: "persist_failed" };
      }
      return { ok: true, alert };
    }

    function updateOwnerAlert(petId, alertId, draft) {
      if (!petId || !alertId) return { ok: false, reason: "missing_id" };
      const validation = validateOwnerDraft(draft);
      if (!validation.ok) return validation;
      let ownerAlerts = getOwnerAlerts(petId);
      const index = ownerAlerts.findIndex((alert) => alert.id === alertId);
      const base =
        index >= 0
          ? ownerAlerts[index]
          : {};
      const alert = ownerAlertFromDraft({ ...draft, id: alertId }, base);
      if (index >= 0) ownerAlerts[index] = alert;
      else ownerAlerts = [...ownerAlerts, alert];
      if (!persistOwnerAlertsForPet(petId, ownerAlerts)) {
        return { ok: false, reason: "persist_failed" };
      }
      return { ok: true, alert };
    }

    function deleteOwnerAlert(petId, alertId) {
      if (!petId || !alertId) return { ok: false, reason: "missing_id" };
      const ownerAlerts = getOwnerAlerts(petId);
      const next = ownerAlerts.filter((alert) => alert.id !== alertId);
      if (next.length === ownerAlerts.length) {
        return { ok: false, reason: "not_found" };
      }
      if (!persistOwnerAlertsForPet(petId, next)) {
        return { ok: false, reason: "persist_failed" };
      }
      return { ok: true };
    }

    function deleteOrSuppressAlert(pet, alertId) {
      if (!pet || !alertId) return { ok: false, kind: "none", reason: "missing" };
      const ownerAlerts = getOwnerAlerts(pet.id);
      const inOwner = ownerAlerts.some((alert) => alert.id === alertId);
      const linkedIds = new Set(
        (pet.alerts || [])
          .filter((alert) => alert.source !== "owner")
          .map((alert) => String(alert.id))
      );
      let kind = "none";

      if (inOwner) {
        const saved = persistOwnerAlertsForPet(
          pet.id,
          ownerAlerts.filter((alert) => alert.id !== alertId)
        );
        if (!saved) return { ok: false, kind: "owner", reason: "persist_failed" };
        kind = "owner";
      }
      if (linkedIds.has(String(alertId))) {
        if (!suppressLinkedAlert(pet.id, alertId)) {
          return { ok: false, kind: "linked", reason: "persist_failed" };
        }
        kind = kind === "owner" ? "owner" : "linked";
      }

      return { ok: true, kind };
    }

    return {
      ALERT_TYPE_ORDER,
      DEFAULT_ALERT_SEVERITY,
      defaultSeverityForType,
      normalizeSeverity,
      inferAlertType,
      normalizeAlert,
      formatAlertSince,
      toMonthInputValue,
      loadOwnerAlertsMap,
      saveOwnerAlertsMap,
      loadSuppressedAlertsMap,
      saveSuppressedAlertsMap,
      getSuppressedAlertIds,
      suppressLinkedAlert,
      getLinkedAlerts,
      getOwnerAlerts,
      persistOwnerAlertsForPet,
      sortAlerts,
      getAlertsForPet,
      validateOwnerDraft,
      createOwnerAlert,
      updateOwnerAlert,
      deleteOwnerAlert,
      deleteOrSuppressAlert,
    };
  }

  root.domains.alerts.createController = createController;
  root.domains.alerts.ALERT_TYPE_ORDER = ALERT_TYPE_ORDER;
  root.domains.alerts.DEFAULT_ALERT_SEVERITY = DEFAULT_ALERT_SEVERITY;
})(typeof window !== "undefined" ? window : globalThis);
