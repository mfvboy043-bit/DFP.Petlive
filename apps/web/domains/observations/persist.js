(function initPetLiveWebObservationsPersist(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  const obs = root.domains.observations;
  const OBSERVATIONS_VERSION = 1;
  const MODE_KEYS = ["day", "week", "month", "year"];

  const DEFAULT_MODE_LABELS = {
    day: "每日",
    week: "每週",
    month: "每月",
    year: "每年",
  };

  const DEFAULT_BUCKET_LABELS = {
    day: [
      "00:00",
      "02:00",
      "04:00",
      "06:00",
      "08:00",
      "10:00",
      "12:00",
      "14:00",
      "16:00",
      "18:00",
      "20:00",
      "22:00",
      "24:00",
    ],
    week: ["週一", "週二", "週三", "週四", "週五", "週六", "週日"],
    month: ["1日", "4日", "7日", "10日", "13日", "16日", "19日", "22日", "25日", "28日", "30日"],
    year: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  };

  function emptyObservations() {
    return {
      version: OBSERVATIONS_VERSION,
      metrics: {},
      seriesByMode: {},
      notes: [],
      ui: {},
      projects: [],
      activeProjectId: "",
      projectAxes: {},
    };
  }

  function clonePlain(value) {
    if (value == null) return value;
    if (typeof structuredClone === "function") {
      try {
        return structuredClone(value);
      } catch (_err) {
        /* fall through */
      }
    }
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeMetricMeta(raw) {
    if (!raw || typeof raw !== "object") return null;
    const label = String(raw.label || "").trim().slice(0, 24);
    if (!label) return null;
    const scale = raw.scale === "weight" ? "weight" : "fixed10";
    return {
      label: label,
      unit: raw.unit != null ? String(raw.unit).slice(0, 16) : scale === "weight" ? "kg" : "分",
      max: scale === "fixed10" ? 10 : raw.max == null ? null : Number(raw.max),
      direction: String(raw.direction || "").slice(0, 120),
      color: String(raw.color || "#1487bd").slice(0, 32),
      colorClass: String(raw.colorClass || "").slice(0, 32),
      scale: scale,
      empty: !!raw.empty,
    };
  }

  function normalizeMetricsMap(raw) {
    const out = {};
    if (!raw || typeof raw !== "object") return out;
    Object.keys(raw).forEach(function (id) {
      const key = String(id || "").trim().slice(0, 64);
      if (!key) return;
      const meta = normalizeMetricMeta(raw[id]);
      if (meta) out[key] = meta;
    });
    return out;
  }

  function normalizeNumberOrNull(value) {
    if (value == null || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function normalizeSeries(raw, len) {
    const n = Math.max(0, Number(len) || 0);
    const empty =
      typeof obs.emptySeries === "function"
        ? obs.emptySeries(n)
        : {
            current: Array(n).fill(null),
            previous: Array(n).fill(null),
            sources: Array(n).fill(null),
          };
    if (!raw || typeof raw !== "object") return empty;

    function fit(arr) {
      const src = Array.isArray(arr) ? arr : [];
      const out = Array(n);
      for (let i = 0; i < n; i += 1) {
        out[i] = i < src.length ? normalizeNumberOrNull(src[i]) : null;
      }
      return out;
    }

    function fitSources(arr) {
      const src = Array.isArray(arr) ? arr : [];
      const out = Array(n);
      for (let i = 0; i < n; i += 1) {
        const v = i < src.length ? src[i] : null;
        out[i] = v == null || v === "" ? null : String(v).slice(0, 32);
      }
      return out;
    }

    return {
      current: fit(raw.current),
      previous: fit(raw.previous),
      sources: fitSources(raw.sources),
    };
  }

  function normalizeEvent(raw) {
    if (!raw || typeof raw !== "object") return null;
    const index = Number(raw.index);
    if (!Number.isInteger(index) || index < 0) return null;
    return {
      index: index,
      label: String(raw.label || "").slice(0, 80),
      shortLabel: String(raw.shortLabel || raw.label || "").slice(0, 40),
      kind: String(raw.kind || "visit").slice(0, 24),
      visitId: raw.visitId != null && raw.visitId !== "" ? String(raw.visitId).slice(0, 64) : null,
    };
  }

  function normalizeNote(raw) {
    if (!raw || typeof raw !== "object") return null;
    const text = String(raw.text != null ? raw.text : raw.note || "").slice(0, 200);
    return {
      at: String(raw.at || "").slice(0, 40) || new Date(0).toISOString(),
      metricId: raw.metricId != null ? String(raw.metricId).slice(0, 64) : null,
      value: normalizeNumberOrNull(raw.value),
      visitId: raw.visitId != null && raw.visitId !== "" ? String(raw.visitId).slice(0, 64) : null,
      text: text,
      note: text,
    };
  }

  function normalizeProjectsList(raw) {
    if (!Array.isArray(raw)) return [];
    const normalize =
      typeof obs.normalizeProject === "function"
        ? obs.normalizeProject
        : function (item) {
            if (!item || typeof item !== "object") return null;
            const name = String(item.name || "").trim().slice(0, 32);
            const kind =
              item.kind === "visit-linked" || item.kind === "self-metric" ? item.kind : "";
            const id = String(item.id || "").trim().slice(0, 64);
            if (!name || !kind || !id) return null;
            return {
              id: id,
              name: name,
              kind: kind,
              createdAt: String(item.createdAt || "").slice(0, 40),
              visitIds: Array.isArray(item.visitIds)
                ? item.visitIds.map(function (v) {
                    return String(v || "").slice(0, 64);
                  }).filter(Boolean)
                : [],
              metricId: item.metricId != null ? String(item.metricId).slice(0, 64) : "",
            };
          };
    return raw.map(normalize).filter(Boolean).slice(0, 100);
  }

  function normalizeProjectAxes(raw, metricsMap) {
    const out = {};
    if (!raw || typeof raw !== "object") return out;
    Object.keys(raw).forEach(function (projectId) {
      const key = String(projectId || "").trim().slice(0, 64);
      if (!key) return;
      const src = raw[key];
      if (!src || typeof src !== "object") return;
      const labels = Array.isArray(src.labels)
        ? src.labels.map(function (label) {
            return String(label).slice(0, 32);
          })
        : [];
      const modeOut = {
        label: String(src.label || "就診").slice(0, 24),
        labels: labels,
        events: Array.isArray(src.events)
          ? src.events.map(normalizeEvent).filter(Boolean).slice(0, 40)
          : [],
      };
      Object.keys(metricsMap || {}).forEach(function (metricId) {
        if (src[metricId] != null) {
          modeOut[metricId] = normalizeSeries(src[metricId], labels.length);
        }
      });
      if (src.metricId && src[src.metricId] != null && !modeOut[src.metricId]) {
        modeOut[src.metricId] = normalizeSeries(src[src.metricId], labels.length);
      }
      out[key] = modeOut;
    });
    return out;
  }

  function normalizeUi(raw) {
    const input = raw && typeof raw === "object" ? raw : {};
    const mode = MODE_KEYS.indexOf(input.mode) >= 0 ? input.mode : "";
    return {
      mode: mode,
      metric: input.metric != null ? String(input.metric).slice(0, 64) : "",
      secondary: input.secondary != null ? String(input.secondary).slice(0, 64) : "",
      compare: input.compare == null ? true : !!input.compare,
      customTitle: String(input.customTitle || "").trim().slice(0, 48),
      customCount: Math.max(0, Number(input.customCount) || 0),
      focusVisitId: input.focusVisitId != null ? String(input.focusVisitId).slice(0, 64) : "",
      activeProjectId:
        input.activeProjectId != null ? String(input.activeProjectId).slice(0, 64) : "",
    };
  }

  function normalizeModeShell(raw, modeKey) {
    const input = raw && typeof raw === "object" ? raw : {};
    const labels = Array.isArray(input.labels) && input.labels.length
      ? input.labels.map(function (label) {
          return String(label).slice(0, 32);
        })
      : (DEFAULT_BUCKET_LABELS[modeKey] || []).slice();
    const events = Array.isArray(input.events)
      ? input.events
          .map(normalizeEvent)
          .filter(Boolean)
          .slice(0, 40)
      : [];
    return {
      label: String(input.label || DEFAULT_MODE_LABELS[modeKey] || modeKey).slice(0, 24),
      labels: labels,
      events: events,
    };
  }

  function normalizeObservations(raw) {
    if (!raw || typeof raw !== "object") return emptyObservations();
    const metrics = normalizeMetricsMap(raw.metrics);
    const seriesByMode = {};
    const rawModes = raw.seriesByMode && typeof raw.seriesByMode === "object" ? raw.seriesByMode : {};
    MODE_KEYS.forEach(function (mode) {
      const shell = normalizeModeShell(rawModes[mode], mode);
      const modeOut = {
        label: shell.label,
        labels: shell.labels,
        events: shell.events,
      };
      const src = rawModes[mode] && typeof rawModes[mode] === "object" ? rawModes[mode] : {};
      Object.keys(metrics).forEach(function (metricId) {
        modeOut[metricId] = normalizeSeries(src[metricId], shell.labels.length);
      });
      seriesByMode[mode] = modeOut;
    });
    const notes = Array.isArray(raw.notes)
      ? raw.notes.map(normalizeNote).filter(Boolean).slice(0, 500)
      : [];
    const projects = normalizeProjectsList(raw.projects);
    let activeProjectId =
      raw.activeProjectId != null ? String(raw.activeProjectId).slice(0, 64) : "";
    if (activeProjectId && !projects.some(function (p) { return p.id === activeProjectId; })) {
      activeProjectId = projects[0] ? projects[0].id : "";
    } else if (!activeProjectId && projects[0]) {
      activeProjectId = projects[0].id;
    }
    return {
      version: OBSERVATIONS_VERSION,
      metrics: metrics,
      seriesByMode: seriesByMode,
      notes: notes,
      ui: normalizeUi(raw.ui),
      projects: projects,
      activeProjectId: activeProjectId,
      projectAxes: normalizeProjectAxes(raw.projectAxes, metrics),
    };
  }

  function exportRegistryMeta(registryOrMap) {
    if (!registryOrMap) return {};
    if (typeof registryOrMap.listIds === "function" && typeof registryOrMap.get === "function") {
      const out = {};
      registryOrMap.listIds().forEach(function (id) {
        const meta = normalizeMetricMeta(registryOrMap.get(id));
        if (meta) out[id] = meta;
      });
      return out;
    }
    return normalizeMetricsMap(registryOrMap);
  }

  function inferCustomCount(metricsMap, uiCustomCount) {
    let maxN = Math.max(0, Number(uiCustomCount) || 0);
    Object.keys(metricsMap || {}).forEach(function (id) {
      const m = /^custom_(\d+)$/.exec(String(id));
      if (m) maxN = Math.max(maxN, Number(m[1]) || 0);
    });
    return maxN;
  }

  function createEmptyViewData(metricIds) {
    const ids = Array.isArray(metricIds) ? metricIds : [];
    const viewData = {};
    MODE_KEYS.forEach(function (mode) {
      const labels = (DEFAULT_BUCKET_LABELS[mode] || []).slice();
      const modeData = {
        label: DEFAULT_MODE_LABELS[mode] || mode,
        labels: labels,
        events: [],
      };
      ids.forEach(function (id) {
        modeData[id] =
          typeof obs.emptySeries === "function"
            ? obs.emptySeries(labels.length)
            : {
                current: Array(labels.length).fill(null),
                previous: Array(labels.length).fill(null),
                sources: Array(labels.length).fill(null),
              };
      });
      viewData[mode] = modeData;
    });
    return viewData;
  }

  function serializeObservations(runtime) {
    const input = runtime || {};
    const metrics = exportRegistryMeta(input.metrics);
    const viewData = input.viewData && typeof input.viewData === "object" ? input.viewData : {};
    const seriesByMode = {};

    MODE_KEYS.forEach(function (mode) {
      const md = viewData[mode] && typeof viewData[mode] === "object" ? viewData[mode] : {};
      const shell = normalizeModeShell(md, mode);
      const modeOut = {
        label: shell.label,
        labels: shell.labels,
        events: shell.events,
      };
      Object.keys(metrics).forEach(function (metricId) {
        modeOut[metricId] = normalizeSeries(md[metricId], shell.labels.length);
      });
      seriesByMode[mode] = modeOut;
    });

    const ui = normalizeUi(input.ui);
    ui.customCount = inferCustomCount(metrics, ui.customCount);

    const notes = Array.isArray(input.notes)
      ? input.notes.map(normalizeNote).filter(Boolean).slice(0, 500)
      : [];

    const projects = normalizeProjectsList(
      input.projects ||
        (input.projectStore && typeof input.projectStore.exportState === "function"
          ? input.projectStore.exportState().projects
          : [])
    );
    let activeProjectId =
      input.activeProjectId != null
        ? String(input.activeProjectId).slice(0, 64)
        : ui.activeProjectId || "";
    if (
      !activeProjectId &&
      input.projectStore &&
      typeof input.projectStore.exportState === "function"
    ) {
      activeProjectId = String(input.projectStore.exportState().activeProjectId || "");
    }
    if (activeProjectId && !projects.some(function (p) { return p.id === activeProjectId; })) {
      activeProjectId = projects[0] ? projects[0].id : "";
    }
    ui.activeProjectId = activeProjectId;

    return {
      version: OBSERVATIONS_VERSION,
      metrics: metrics,
      seriesByMode: seriesByMode,
      notes: notes,
      ui: ui,
      projects: projects,
      activeProjectId: activeProjectId,
      projectAxes: normalizeProjectAxes(input.projectAxes, metrics),
    };
  }

  function hydrateObservations(raw) {
    const slice = normalizeObservations(raw);
    const metricIds = Object.keys(slice.metrics);
    const viewData = {};

    MODE_KEYS.forEach(function (mode) {
      const src = slice.seriesByMode[mode] || normalizeModeShell(null, mode);
      const modeData = {
        label: src.label,
        labels: src.labels.slice(),
        events: (src.events || []).map(clonePlain),
      };
      metricIds.forEach(function (metricId) {
        modeData[metricId] = normalizeSeries(src[metricId], modeData.labels.length);
      });
      viewData[mode] = modeData;
    });

    const ui = normalizeUi(slice.ui);
    ui.customCount = inferCustomCount(slice.metrics, ui.customCount);
    ui.activeProjectId = slice.activeProjectId || ui.activeProjectId || "";

    return {
      version: slice.version,
      metrics: clonePlain(slice.metrics),
      viewData: viewData,
      notes: slice.notes.map(clonePlain),
      ui: ui,
      projects: slice.projects.map(clonePlain),
      activeProjectId: slice.activeProjectId,
      projectAxes: clonePlain(slice.projectAxes),
    };
  }

  function readObservationsFromPet(pet) {
    if (!pet || typeof pet !== "object") return emptyObservations();
    return normalizeObservations(pet.observations);
  }

  function writeObservationsToPet(pet, sliceOrRuntime, opts) {
    const options = opts || {};
    const demoFlag =
      typeof options.isDemoMode === "function" ? options.isDemoMode() : !!options.isDemoMode;
    if (demoFlag) return false;
    if (!pet || typeof pet !== "object") return false;

    const slice =
      sliceOrRuntime &&
      sliceOrRuntime.version != null &&
      sliceOrRuntime.metrics &&
      sliceOrRuntime.seriesByMode &&
      !sliceOrRuntime.viewData
        ? normalizeObservations(sliceOrRuntime)
        : serializeObservations(sliceOrRuntime);

    pet.observations = slice;
    return true;
  }

  function mergeObservations(localRaw, incomingRaw) {
    const local = normalizeObservations(localRaw);
    const incoming = normalizeObservations(incomingRaw);
    const hasIncoming =
      Object.keys(incoming.metrics).length > 0 ||
      incoming.notes.length > 0 ||
      incoming.projects.length > 0;
    if (!hasIncoming) return local;
    const metrics = Object.assign({}, local.metrics, incoming.metrics);
    const seriesByMode = {};
    MODE_KEYS.forEach(function (mode) {
      const localMode = local.seriesByMode[mode] || normalizeModeShell(null, mode);
      const incMode = incoming.seriesByMode[mode] || normalizeModeShell(null, mode);
      const shell = {
        label: incMode.label || localMode.label,
        labels: incMode.labels && incMode.labels.length ? incMode.labels : localMode.labels,
        events: incMode.events && incMode.events.length ? incMode.events : localMode.events,
      };
      const modeOut = {
        label: shell.label,
        labels: shell.labels,
        events: shell.events,
      };
      Object.keys(metrics).forEach(function (metricId) {
        const preferInc = incMode[metricId] != null;
        modeOut[metricId] = normalizeSeries(
          preferInc ? incMode[metricId] : localMode[metricId],
          shell.labels.length
        );
      });
      seriesByMode[mode] = modeOut;
    });
    const projects = incoming.projects.length ? incoming.projects : local.projects;
    let activeProjectId = incoming.activeProjectId || local.activeProjectId || "";
    if (activeProjectId && !projects.some(function (p) { return p.id === activeProjectId; })) {
      activeProjectId = projects[0] ? projects[0].id : "";
    }
    return {
      version: OBSERVATIONS_VERSION,
      metrics: metrics,
      seriesByMode: seriesByMode,
      notes: incoming.notes.length ? incoming.notes : local.notes,
      ui: Object.keys(incoming.ui || {}).some(function (k) {
        return incoming.ui[k] !== "" && incoming.ui[k] !== false;
      })
        ? incoming.ui
        : local.ui,
      projects: projects,
      activeProjectId: activeProjectId,
      projectAxes: Object.assign({}, local.projectAxes, incoming.projectAxes),
    };
  }

  function isObservationsEmpty(raw) {
    const slice = normalizeObservations(raw);
    return (
      Object.keys(slice.metrics).length === 0 &&
      slice.notes.length === 0 &&
      slice.projects.length === 0
    );
  }

  obs.OBSERVATIONS_VERSION = OBSERVATIONS_VERSION;
  obs.MODE_KEYS = MODE_KEYS;
  obs.emptyObservations = emptyObservations;
  obs.normalizeObservations = normalizeObservations;
  obs.serializeObservations = serializeObservations;
  obs.hydrateObservations = hydrateObservations;
  obs.exportRegistryMeta = exportRegistryMeta;
  obs.inferCustomCount = inferCustomCount;
  obs.createEmptyViewData = createEmptyViewData;
  obs.readObservationsFromPet = readObservationsFromPet;
  obs.writeObservationsToPet = writeObservationsToPet;
  obs.mergeObservations = mergeObservations;
  obs.isObservationsEmpty = isObservationsEmpty;
  obs.DEFAULT_BUCKET_LABELS = DEFAULT_BUCKET_LABELS;
  obs.DEFAULT_MODE_LABELS = DEFAULT_MODE_LABELS;
})(typeof window !== "undefined" ? window : globalThis);
