(function initPetLiveWebObservationsMetrics(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  const CUSTOM_COLORS = ["#6b8cae", "#c47a9a", "#8a9a5b", "#a0785a", "#5c8a8a"];

  function formatValue(value, meta) {
    if (!Number.isFinite(value)) return "—";
    const unit = meta && meta.unit != null ? String(meta.unit) : "";
    if (meta && meta.scale === "weight") {
      return Math.round(value * 10) / 10 + (unit ? " " + unit : "");
    }
    return value + (unit ? " " + unit : "");
  }

  function createRegistry(seedMeta) {
    const meta = seedMeta && typeof seedMeta === "object" ? seedMeta : {};
    let customCount = 0;

    function listIds() {
      return Object.keys(meta);
    }

    function get(id) {
      return meta[id] || null;
    }

    function addCustom(name) {
      const raw = String(name || "").trim();
      if (!raw || raw.length > 24) return null;
      customCount += 1;
      const id = "custom_" + customCount;
      const color = CUSTOM_COLORS[(customCount - 1) % CUSTOM_COLORS.length];
      meta[id] = {
        label: raw,
        unit: "分",
        max: 10,
        direction: "自訂 0–10 觀察指標（示範）",
        color: color,
        colorClass: "",
        scale: "fixed10",
        empty: true,
      };
      return id;
    }

    return {
      listIds: listIds,
      get: get,
      addCustom: addCustom,
      formatValue: formatValue,
      getCustomCount: function () {
        return customCount;
      },
      setCustomCount: function (n) {
        customCount = Math.max(0, Number(n) || 0);
      },
    };
  }

  root.domains.observations.CUSTOM_COLORS = CUSTOM_COLORS;
  root.domains.observations.formatValue = formatValue;
  root.domains.observations.createRegistry = createRegistry;
})(typeof window !== "undefined" ? window : globalThis);
