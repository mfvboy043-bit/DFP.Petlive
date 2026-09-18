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

  function inferCustomCountFromMeta(meta) {
    let maxN = 0;
    Object.keys(meta || {}).forEach(function (id) {
      const m = /^custom_(\d+)$/.exec(String(id));
      if (m) maxN = Math.max(maxN, Number(m[1]) || 0);
    });
    return maxN;
  }

  function exportRegistryMetaLocal(registryOrMap) {
    if (!registryOrMap || typeof registryOrMap !== "object") return {};
    if (typeof registryOrMap.listIds === "function" && typeof registryOrMap.get === "function") {
      const out = {};
      registryOrMap.listIds().forEach(function (id) {
        const meta = registryOrMap.get(id);
        if (meta) out[id] = Object.assign({}, meta);
      });
      return out;
    }
    const out = {};
    Object.keys(registryOrMap).forEach(function (id) {
      if (registryOrMap[id] && typeof registryOrMap[id] === "object") {
        out[id] = Object.assign({}, registryOrMap[id]);
      }
    });
    return out;
  }

  function createRegistry(seedMeta) {
    const meta = seedMeta && typeof seedMeta === "object" ? Object.assign({}, seedMeta) : {};
    let customCount = inferCustomCountFromMeta(meta);

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

    function replaceAll(nextMeta) {
      Object.keys(meta).forEach(function (key) {
        delete meta[key];
      });
      const incoming = nextMeta && typeof nextMeta === "object" ? nextMeta : {};
      Object.keys(incoming).forEach(function (id) {
        if (incoming[id] && typeof incoming[id] === "object") {
          meta[id] = Object.assign({}, incoming[id]);
        }
      });
      customCount = inferCustomCountFromMeta(meta);
      return listIds();
    }

    return {
      listIds: listIds,
      get: get,
      addCustom: addCustom,
      replaceAll: replaceAll,
      formatValue: formatValue,
      exportMeta: function () {
        if (typeof root.domains.observations.exportRegistryMeta === "function") {
          return root.domains.observations.exportRegistryMeta({
            listIds: listIds,
            get: get,
          });
        }
        return exportRegistryMetaLocal({ listIds: listIds, get: get });
      },
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
  root.domains.observations.inferCustomCountFromMeta = inferCustomCountFromMeta;
  if (typeof root.domains.observations.exportRegistryMeta !== "function") {
    root.domains.observations.exportRegistryMeta = exportRegistryMetaLocal;
  }
})(typeof window !== "undefined" ? window : globalThis);
