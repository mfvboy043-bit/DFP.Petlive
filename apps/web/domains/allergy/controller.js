(function initPetLiveWebAllergyController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.allergy = root.domains.allergy || {};

  const FOOD_BRAND_CATALOG = root.domains.allergy.FOOD_BRAND_CATALOG || [];
  const MEAT_PRESETS = root.domains.allergy.MEAT_PRESETS || [];

  function normalizeDateKey(value) {
    const raw = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
  }

  function ensureAllergyPurchases(pet) {
    if (!Array.isArray(pet.allergyPurchases)) {
      pet.allergyPurchases = [];
    }
    return pet.allergyPurchases;
  }

  function ensureCustomBrands(pet) {
    if (!Array.isArray(pet.allergyFoodBrands)) {
      pet.allergyFoodBrands = [];
    }
    return pet.allergyFoodBrands;
  }

  function normalizeBrandName(name) {
    return String(name || "").trim();
  }

  function catalogEntrySearchText(entry) {
    return [entry.name, ...(entry.aliases || [])].join(" ").toLowerCase();
  }

  function searchBrands(query, pet, catalog = FOOD_BRAND_CATALOG) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];

    const custom = ensureCustomBrands(pet || { allergyFoodBrands: [] });
    const hits = [];
    const seen = new Set();

    const push = (item) => {
      const key = `${item.source}:${item.name}`.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      hits.push(item);
    };

    for (const entry of catalog) {
      const hay = catalogEntrySearchText(entry);
      if (hay.includes(q)) {
        push({ id: entry.id, name: entry.name, source: "catalog" });
      }
    }

    for (const name of custom) {
      const trimmed = normalizeBrandName(name);
      if (!trimmed) continue;
      if (trimmed.toLowerCase().includes(q)) {
        push({ id: `custom:${trimmed}`, name: trimmed, source: "custom" });
      }
    }

    return hits.slice(0, 12);
  }

  function addCustomBrand(pet, name) {
    const trimmed = normalizeBrandName(name);
    if (!pet || !trimmed) return { ok: false, reason: "empty" };
    const list = ensureCustomBrands(pet);
    const exists = list.some((row) => row.toLowerCase() === trimmed.toLowerCase());
    if (!exists) list.unshift(trimmed);
    return { ok: true, pet, name: trimmed };
  }

  function removeCustomBrand(pet, name) {
    const trimmed = normalizeBrandName(name);
    if (!pet || !trimmed) return { ok: false, reason: "missing" };
    const before = ensureCustomBrands(pet).length;
    pet.allergyFoodBrands = ensureCustomBrands(pet).filter(
      (row) => row.toLowerCase() !== trimmed.toLowerCase()
    );
    return { ok: pet.allergyFoodBrands.length < before, pet };
  }

  function computePricePerUnit(weight, unit, price) {
    const w = Number(weight);
    const p = Number(price);
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(p) || p < 0) {
      return null;
    }
    const normalizedUnit = unit === "lb" ? "lb" : "kg";
    return {
      unit: normalizedUnit,
      value: Math.round((p / w) * 100) / 100,
    };
  }

  /** @deprecated alias */
  function computePricePerKg(kg, price) {
    const result = computePricePerUnit(kg, "kg", price);
    return result?.value ?? null;
  }

  function normalizeMeats(rawMeats, customMeat) {
    const fromChips = Array.isArray(rawMeats)
      ? rawMeats.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const custom = normalizeBrandName(customMeat);
    const merged = custom ? [...fromChips, custom] : fromChips;
    const unique = [];
    const seen = new Set();
    for (const item of merged) {
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }
    return unique;
  }

  function normalizeDraft(draft) {
    const raw = draft || {};
    const brand = normalizeBrandName(raw.brand);
    const recordDate = normalizeDateKey(raw.recordDate);
    const weight = Number(raw.weight ?? raw.kg);
    const weightUnit = raw.weightUnit === "lb" ? "lb" : "kg";
    const price = Number(raw.price);
    const meats = normalizeMeats(raw.meats, raw.customMeat);
    const pricePerUnit = computePricePerUnit(weight, weightUnit, price);
    return {
      brand,
      recordDate,
      meats,
      weight: Number.isFinite(weight) && weight > 0 ? weight : null,
      weightUnit,
      price: Number.isFinite(price) && price >= 0 ? price : null,
      pricePerUnit: pricePerUnit?.value ?? null,
      pricePerUnitLabel: pricePerUnit?.unit ?? weightUnit,
    };
  }

  function validateDraft(draft) {
    const normalized = normalizeDraft(draft);
    if (!normalized.recordDate) {
      return { ok: false, reason: "needDate" };
    }
    if (!normalized.brand) {
      return { ok: false, reason: "needBrand" };
    }
    if (
      normalized.weight == null ||
      normalized.price == null ||
      normalized.pricePerUnit == null
    ) {
      return { ok: false, reason: "needWeightPrice" };
    }
    return { ok: true, draft: normalized };
  }

  function buildPurchase(draft) {
    const normalized = normalizeDraft(draft);
    return {
      id: `ah-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      recordDate: normalized.recordDate,
      brand: normalized.brand,
      meats: normalized.meats,
      weight: normalized.weight,
      weightUnit: normalized.weightUnit,
      price: normalized.price,
      pricePerUnit: normalized.pricePerUnit,
      pricePerUnitLabel: normalized.pricePerUnitLabel,
      createdAt: new Date().toISOString(),
    };
  }

  function normalizePurchaseRecord(row) {
    if (!row || typeof row !== "object") return row;
    const legacyMeats =
      Array.isArray(row.meats) && row.meats.length
        ? row.meats
        : row.kind === "meat" && row.brand
          ? [row.brand]
          : [];
    return {
      ...row,
      recordDate: normalizeDateKey(row.recordDate) || String(row.createdAt || "").slice(0, 10),
      brand: normalizeBrandName(row.brand),
      meats: legacyMeats,
      weight: row.weight ?? row.kg ?? null,
      weightUnit: row.weightUnit === "lb" ? "lb" : "kg",
      pricePerUnit: row.pricePerUnit ?? row.pricePerKg ?? null,
      pricePerUnitLabel: row.pricePerUnitLabel || row.weightUnit || "kg",
    };
  }

  function sortPurchases(purchases) {
    return (purchases || [])
      .map(normalizePurchaseRecord)
      .sort((a, b) => String(b.recordDate || "").localeCompare(String(a.recordDate || "")));
  }

  function getPurchases(pet) {
    return sortPurchases(ensureAllergyPurchases(pet));
  }

  function getCustomBrands(pet) {
    return ensureCustomBrands(pet).slice();
  }

  function addPurchase(pet, draft, { rememberBrand = true } = {}) {
    if (!pet) return { ok: false, reason: "noPet" };
    const validation = validateDraft(draft);
    if (!validation.ok) {
      return { ok: false, reason: validation.reason };
    }
    const record = buildPurchase(validation.draft);
    ensureAllergyPurchases(pet).unshift(record);
    if (rememberBrand) addCustomBrand(pet, record.brand);
    return { ok: true, record, pet };
  }

  function removePurchase(pet, purchaseId) {
    if (!pet || !purchaseId) return { ok: false, reason: "missing" };
    const list = ensureAllergyPurchases(pet);
    const before = list.length;
    pet.allergyPurchases = list.filter((row) => row.id !== purchaseId);
    return { ok: pet.allergyPurchases.length < before, pet };
  }

  function createController() {
    return {
      MEAT_PRESETS,
      FOOD_BRAND_CATALOG,
      normalizeDateKey,
      ensureAllergyPurchases,
      ensureCustomBrands,
      searchBrands,
      addCustomBrand,
      removeCustomBrand,
      computePricePerUnit,
      computePricePerKg,
      normalizeDraft,
      validateDraft,
      buildPurchase,
      normalizePurchaseRecord,
      sortPurchases,
      getPurchases,
      getCustomBrands,
      addPurchase,
      removePurchase,
    };
  }

  root.domains.allergy.MEAT_PRESETS = MEAT_PRESETS;
  root.domains.allergy.normalizeDateKey = normalizeDateKey;
  root.domains.allergy.ensureAllergyPurchases = ensureAllergyPurchases;
  root.domains.allergy.ensureCustomBrands = ensureCustomBrands;
  root.domains.allergy.searchBrands = searchBrands;
  root.domains.allergy.addCustomBrand = addCustomBrand;
  root.domains.allergy.removeCustomBrand = removeCustomBrand;
  root.domains.allergy.computePricePerUnit = computePricePerUnit;
  root.domains.allergy.computePricePerKg = computePricePerKg;
  root.domains.allergy.normalizeDraft = normalizeDraft;
  root.domains.allergy.validateDraft = validateDraft;
  root.domains.allergy.buildPurchase = buildPurchase;
  root.domains.allergy.getPurchases = getPurchases;
  root.domains.allergy.getCustomBrands = getCustomBrands;
  root.domains.allergy.addPurchase = addPurchase;
  root.domains.allergy.removePurchase = removePurchase;
  root.domains.allergy.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
