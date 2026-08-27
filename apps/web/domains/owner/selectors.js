(function initPetLiveWebOwnerSelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.owner = root.domains.owner || {};

  const PROFILE_KEYS = [
    "name",
    "phone",
    "email",
    "emergencyName",
    "emergencyPhone",
    "address",
  ];

  const DEMO_EMAIL = "wang.yangming@demo.petlive";
  const DEMO_NAME = "王陽明";
  const DEMO_PHONE = "0912345678";

  function createSelectors() {
    function emptyProfile() {
      return {
        name: "",
        phone: "",
        email: "",
        emergencyName: "",
        emergencyPhone: "",
        address: "",
      };
    }

    /** Showcase / field-demo sample owner (not real PII). */
    function demoProfile() {
      return {
        name: DEMO_NAME,
        phone: DEMO_PHONE,
        email: DEMO_EMAIL,
        emergencyName: "王守仁",
        emergencyPhone: "0987654321",
        address: "那美剋星三丁目 七龍珠巷 42 弄 99 號 B1",
      };
    }

    function normalize(raw) {
      const empty = emptyProfile();
      if (!raw || typeof raw !== "object") return empty;
      const out = { ...empty };
      for (const key of PROFILE_KEYS) {
        out[key] = raw[key] != null ? String(raw[key]) : "";
      }
      return out;
    }

    function hasAny(profile) {
      const p = normalize(profile);
      return PROFILE_KEYS.some((key) => Boolean(p[key]));
    }

    /**
     * Structured copy rows only — facade maps kinds with t().
     */
    function copyRows(profile) {
      const p = normalize(profile);
      const rows = [];
      if (p.name || p.phone) {
        const row = { kind: "ownerLine" };
        if (p.name) row.name = p.name;
        if (p.phone) row.phone = p.phone;
        rows.push(row);
      }
      if (p.email) rows.push({ kind: "email", email: p.email });
      if (p.emergencyName || p.emergencyPhone) {
        const row = { kind: "emergency" };
        if (p.emergencyName) row.emergencyName = p.emergencyName;
        if (p.emergencyPhone) row.emergencyPhone = p.emergencyPhone;
        rows.push(row);
      }
      if (p.address) rows.push({ kind: "address", address: p.address });
      return rows;
    }

    /** Pure helper for later B scrub parity. */
    function isDemoShowcase(profile) {
      const p = normalize(profile);
      if (p.email === DEMO_EMAIL) return true;
      return p.name === DEMO_NAME && p.phone === DEMO_PHONE;
    }

    return {
      emptyProfile,
      demoProfile,
      normalize,
      hasAny,
      copyRows,
      isDemoShowcase,
    };
  }

  root.domains.owner.createSelectors = createSelectors;
})(typeof window !== "undefined" ? window : globalThis);
