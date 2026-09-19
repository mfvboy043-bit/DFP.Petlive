(function initPetLiveWebObservationsMetrics(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  /** Chart line presets — 紅／藍 from existing series, 橘／綠 from workspace + brand sun/safe. */
  const BASE_LINE_COLORS = [
    { id: "red", label: "紅", hex: "#db1f64" },
    { id: "blue", label: "藍", hex: "#1487bd" },
    { id: "orange", label: "橘", hex: "#d8893c" },
    { id: "green", label: "綠", hex: "#4f9d78" },
  ];
  const LINE_COLOR_DEFAULT = "#1487bd";
  const CUSTOM_COLORS = BASE_LINE_COLORS.map(function (swatch) {
    return swatch.hex;
  });

  function normalizeLineColor(raw) {
    const text = String(raw || "").trim();
    const short = /^#([0-9a-fA-F]{3})$/.exec(text);
    if (short) {
      const h = short[1];
      return ("#" + h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2)).toLowerCase();
    }
    const full = /^#([0-9a-fA-F]{6})$/.exec(text);
    if (full) return ("#" + full[1]).toLowerCase();
    return "";
  }

  function colorClassForLine(hex) {
    const normalized = normalizeLineColor(hex);
    const found = BASE_LINE_COLORS.find(function (swatch) {
      return swatch.hex === normalized;
    });
    return found ? found.id : "";
  }

  function pickDefaultLineColor(usedColors) {
    const taken = {};
    (Array.isArray(usedColors) ? usedColors : []).forEach(function (color) {
      const hex = normalizeLineColor(color);
      if (hex) taken[hex] = true;
    });
    for (let i = 0; i < BASE_LINE_COLORS.length; i += 1) {
      if (!taken[BASE_LINE_COLORS[i].hex]) return BASE_LINE_COLORS[i].hex;
    }
    return LINE_COLOR_DEFAULT;
  }

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

    function normalizeStoredMeta(row) {
      if (!row || typeof row !== "object") return row;
      if (String(row.unit || "") === "次" && row.scale === "fixed10") {
        return Object.assign({}, row, {
          scale: "count",
          max: 24,
          direction: "記錄次數",
        });
      }
      return row;
    }

    function get(id) {
      return normalizeStoredMeta(meta[id]) || null;
    }

    function rename(id, nextLabel) {
      const key = String(id || "");
      const raw = String(nextLabel || "").trim();
      if (!key || !raw || raw.length > 32) return null;
      if (!meta[key]) return null;
      meta[key] = Object.assign({}, meta[key], { label: raw });
      return get(key);
    }

    function buildMetaFields(name, extras, previous) {
      const raw = String(name || "").trim();
      if (!raw || raw.length > 24) return null;
      const extra = extras && typeof extras === "object" ? extras : {};
      const prev = previous && typeof previous === "object" ? previous : {};
      const unit =
        String(extra.unit != null ? extra.unit : prev.unit || "分").trim().slice(0, 16) || "分";
      let scale = extra.scale != null ? extra.scale : prev.scale || "";
      if (!scale) {
        if (unit === "kg") scale = "weight";
        else if (unit === "次") scale = "count";
        else if (unit === "分") scale = "fixed10";
        else scale = "open";
      }
      const usedColors = Object.keys(meta).map(function (key) {
        return meta[key] && meta[key].color;
      });
      const color =
        normalizeLineColor(extra.color) ||
        normalizeLineColor(prev.color) ||
        pickDefaultLineColor(usedColors) ||
        LINE_COLOR_DEFAULT;
      let direction = "以「" + unit + "」記錄客觀數值";
      if (scale === "weight") direction = "以公斤顯示；Y 軸依資料範圍調整";
      else if (scale === "count") direction = "記錄次數";
      else if (scale === "fixed10") direction = "0–10 觀察分數";
      return {
        label: raw,
        unit: unit,
        max: scale === "fixed10" ? 10 : scale === "count" ? 24 : null,
        direction: direction,
        color: color,
        colorClass: scale === "weight" ? "weight" : colorClassForLine(color),
        scale: scale === "open" ? "weight" : scale,
        empty: prev.empty != null ? !!prev.empty : true,
      };
    }

    function addCustom(name, extras) {
      const metaRow = buildMetaFields(name, extras, null);
      if (!metaRow) return null;
      customCount += 1;
      const id = "custom_" + customCount;
      meta[id] = metaRow;
      return id;
    }

    function update(id, patch) {
      const key = String(id || "");
      if (!key || !meta[key]) return null;
      const incoming = patch && typeof patch === "object" ? patch : {};
      const nextLabel = incoming.label != null ? incoming.label : meta[key].label;
      const metaRow = buildMetaFields(nextLabel, incoming, meta[key]);
      if (!metaRow) return null;
      meta[key] = metaRow;
      return get(key);
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
      update: update,
      rename: rename,
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

  root.domains.observations.BASE_LINE_COLORS = BASE_LINE_COLORS;
  root.domains.observations.LINE_COLOR_DEFAULT = LINE_COLOR_DEFAULT;
  root.domains.observations.CUSTOM_COLORS = CUSTOM_COLORS;
  root.domains.observations.normalizeLineColor = normalizeLineColor;
  root.domains.observations.colorClassForLine = colorClassForLine;
  root.domains.observations.pickDefaultLineColor = pickDefaultLineColor;
  root.domains.observations.formatValue = formatValue;
  root.domains.observations.createRegistry = createRegistry;
  root.domains.observations.inferCustomCountFromMeta = inferCustomCountFromMeta;
  if (typeof root.domains.observations.exportRegistryMeta !== "function") {
    root.domains.observations.exportRegistryMeta = exportRegistryMetaLocal;
  }
})(typeof window !== "undefined" ? window : globalThis);
