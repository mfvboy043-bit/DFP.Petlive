(function initPetLiveWebParasiteController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.parasite = root.domains.parasite || {};

  const KINDS = ["external", "heartworm"];
  const APPROACHING_DAYS = 7;

  /** covers: which tracking slots this product can fill; dual = external+heartworm */
  const PRODUCT_CATALOG = {
    ppRevolution: { intervalDays: 30, covers: ["external", "heartworm"] },
    ppFrontline: { intervalDays: 30, covers: ["external"] },
    ppAdvantix: { intervalDays: 30, covers: ["external"] },
    ppNexGardSpectra: { intervalDays: 30, covers: ["external", "heartworm"] },
    ppMilbemax: { intervalDays: 30, covers: ["heartworm"] },
    ppProHeart: { intervalDays: 365, covers: ["heartworm"] },
  };

  const PRODUCT_KEYS_BY_KIND = {
    external: ["ppFrontline", "ppAdvantix", "ppRevolution", "ppNexGardSpectra"],
    heartworm: ["ppRevolution", "ppNexGardSpectra", "ppMilbemax", "ppProHeart"],
  };

  function productsForKind(kind) {
    return (PRODUCT_KEYS_BY_KIND[kind] || []).map((key) => ({
      key,
      ...PRODUCT_CATALOG[key],
    }));
  }

  function createController({ daysUntil, addDays, todayISODate, labelOf } = {}) {
    if (typeof daysUntil !== "function") {
      throw new TypeError("createController requires daysUntil");
    }
    if (typeof addDays !== "function") {
      throw new TypeError("createController requires addDays");
    }
    if (typeof todayISODate !== "function") {
      throw new TypeError("createController requires todayISODate");
    }
    const label =
      typeof labelOf === "function" ? labelOf : (key) => String(key || "");

    function ensureParasitePrevention(pet) {
      if (!pet.parasitePrevention) {
        pet.parasitePrevention = { external: null, heartworm: null };
      }
      return pet.parasitePrevention;
    }

    function getParasiteRecord(pet, kind) {
      const pp = ensureParasitePrevention(pet);
      return pp[kind] || null;
    }

    /** @returns {"protected"|"approaching"|"unprotected"} */
    function getParasiteStatus(nextDue) {
      if (!nextDue) return "unprotected";
      const days = daysUntil(nextDue);
      if (days < 0) return "unprotected";
      if (days <= APPROACHING_DAYS) return "approaching";
      return "protected";
    }

    function isParasiteDualProduct(productKey) {
      const covers = PRODUCT_CATALOG[productKey]?.covers || [];
      return covers.includes("external") && covers.includes("heartworm");
    }

    function computeNextDue(lastGiven, intervalDays) {
      if (!lastGiven) return null;
      const days = Number(intervalDays);
      if (!Number.isFinite(days) || days < 1) return null;
      return addDays(lastGiven, days);
    }

    function resolveProductName({ productKey, customValue } = {}) {
      const custom = (customValue || "").trim();
      if (custom) return custom;
      if (productKey) return label(productKey);
      return "";
    }

    function normalizeDraft(draft) {
      const raw = draft || {};
      const custom = String(raw.customValue || "").trim();
      const productKey = custom
        ? ""
        : String(raw.productKey || "").trim();
      const product =
        typeof raw.product === "string" && raw.product.trim()
          ? raw.product.trim()
          : resolveProductName({
              productKey,
              customValue: custom || raw.product,
            });
      const lastGiven = String(raw.lastGiven || "").trim();
      const intervalRaw = Number(raw.intervalDays);
      const intervalDays =
        Number.isFinite(intervalRaw) && intervalRaw >= 1 ? intervalRaw : 30;
      let nextDue = String(raw.nextDue || "").trim();
      if (lastGiven && !nextDue) {
        const computed = computeNextDue(lastGiven, intervalDays);
        if (computed) nextDue = computed;
      }
      return {
        productKey,
        product,
        lastGiven,
        intervalDays,
        nextDue,
      };
    }

    function validateDraft(draft) {
      const normalized = normalizeDraft(draft);
      if (!normalized.product) {
        return { ok: false, reason: "needProduct" };
      }
      if (!normalized.lastGiven || !normalized.nextDue) {
        return { ok: false, reason: "needDates" };
      }
      if (normalized.nextDue < normalized.lastGiven) {
        return { ok: false, reason: "order" };
      }
      return { ok: true, draft: normalized };
    }

    function applyDosedToday(draft, { today } = {}) {
      const normalized = normalizeDraft(draft);
      const lastGiven = today || todayISODate();
      const intervalDays = normalized.intervalDays || 30;
      const nextDue = computeNextDue(lastGiven, intervalDays);
      return {
        ...normalized,
        lastGiven,
        intervalDays,
        nextDue: nextDue || "",
      };
    }

    function recordFromDraft(draft) {
      return {
        productKey: draft.productKey,
        product: draft.product,
        lastGiven: draft.lastGiven,
        intervalDays: draft.intervalDays,
        nextDue: draft.nextDue,
      };
    }

    function saveParasiteKind(pet, kind, draft, { syncDual = true } = {}) {
      if (!pet || (kind !== "external" && kind !== "heartworm")) {
        return { ok: false, reason: "needDates", pet };
      }
      const validation = validateDraft(draft);
      if (!validation.ok) {
        return { ok: false, reason: validation.reason, pet };
      }
      const normalized = validation.draft;
      const pp = ensureParasitePrevention(pet);
      const record = recordFromDraft(normalized);
      pp[kind] = record;

      let syncedOtherKind = null;
      if (
        syncDual &&
        normalized.productKey &&
        isParasiteDualProduct(normalized.productKey)
      ) {
        const other = kind === "external" ? "heartworm" : "external";
        pp[other] = { ...record };
        syncedOtherKind = other;
      }

      return {
        ok: true,
        pet,
        syncedOtherKind,
        draft: normalized,
      };
    }

    function buildParasiteCalendarPayload(pet, kind, options = {}) {
      const record = getParasiteRecord(pet, kind);
      if (!record?.nextDue) return null;
      let title = options.title;
      let details = options.details;
      if (typeof options.buildTitle === "function") {
        title = options.buildTitle(record, kind, pet);
      }
      if (typeof options.buildDetails === "function") {
        details = options.buildDetails(record, kind, pet);
      }
      return {
        title: title || "",
        details: details || "",
        nextDue: record.nextDue,
      };
    }

    return {
      KINDS,
      APPROACHING_DAYS,
      PRODUCT_CATALOG,
      productsForKind,
      ensureParasitePrevention,
      getParasiteRecord,
      getParasiteStatus,
      isParasiteDualProduct,
      computeNextDue,
      resolveProductName,
      normalizeDraft,
      validateDraft,
      applyDosedToday,
      saveParasiteKind,
      buildParasiteCalendarPayload,
    };
  }

  root.domains.parasite.KINDS = KINDS;
  root.domains.parasite.APPROACHING_DAYS = APPROACHING_DAYS;
  root.domains.parasite.PRODUCT_CATALOG = PRODUCT_CATALOG;
  root.domains.parasite.productsForKind = productsForKind;
  root.domains.parasite.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
