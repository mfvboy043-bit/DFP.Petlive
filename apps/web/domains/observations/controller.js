(function initPetLiveWebObservationsController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  const obs = root.domains.observations;

  function createController(deps) {
    const input = deps || {};
    const metrics = input.metrics;
    const viewData = input.viewData || {};
    const visits = Array.isArray(input.visits) ? input.visits : [];
    const diaryNotes = [];

    if (!metrics || typeof metrics.listIds !== "function") {
      throw new TypeError("createController requires metrics registry");
    }

    const state = {
      mode: "week",
      metric: "headache",
      secondary: "sleep",
      compare: true,
      customCount: 0,
    };

    const ids = metrics.listIds();
    if (ids.indexOf(state.metric) < 0 && ids.length) state.metric = ids[0];
    if (ids.indexOf(state.secondary) < 0) {
      state.secondary = ids.find(function (id) {
        return id !== state.metric;
      }) || ids[0] || "";
    }

    function getState() {
      return {
        mode: state.mode,
        metric: state.metric,
        secondary: state.secondary,
        compare: state.compare,
        customCount: state.customCount,
      };
    }

    function setMode(mode) {
      if (viewData[mode]) state.mode = mode;
      return state.mode;
    }

    function setMetric(metricId) {
      if (metrics.get(metricId)) state.metric = metricId;
      return state.metric;
    }

    function setSecondary(metricId) {
      if (metrics.get(metricId)) state.secondary = metricId;
      return state.secondary;
    }

    function setCompare(flag) {
      state.compare = !!flag;
      return state.compare;
    }

    function ensureSecondaryDistinct() {
      if (state.secondary === state.metric) {
        const fallback = metrics.listIds().find(function (id) {
          return id !== state.metric;
        });
        if (fallback) state.secondary = fallback;
      }
      return state.secondary;
    }

    function addCustomMetric(name) {
      const id = metrics.addCustom(name);
      if (!id) return null;
      state.customCount += 1;
      if (typeof metrics.setCustomCount === "function") {
        metrics.setCustomCount(state.customCount);
      }
      ["day", "week", "month", "year"].forEach(function (mode) {
        const modeData = viewData[mode];
        if (!modeData) return;
        const len = Array.isArray(modeData.labels) ? modeData.labels.length : 0;
        modeData[id] = obs.emptySeries(len);
      });
      state.metric = id;
      return id;
    }

    function addDiaryPoint(opts) {
      const cfg = opts || {};
      const note = obs.createNote({
        metricId: cfg.metricId || state.metric,
        value: cfg.value,
        visitId: cfg.visitId,
        text: cfg.text != null ? cfg.text : cfg.note,
        at: cfg.at,
      });
      diaryNotes.push(note);

      if (Number.isFinite(cfg.value) && Number.isInteger(cfg.index)) {
        const mode = cfg.mode || state.mode;
        const modeData = viewData[mode];
        if (modeData) {
          const series = obs.ensureSeriesShape(modeData, note.metricId);
          obs.applyDiaryPoint(series, cfg.index, cfg.value);
        }
      }
      return note;
    }

    function getModeData(mode) {
      return viewData[mode || state.mode] || null;
    }

    function getSeries(metricId, mode) {
      const modeData = getModeData(mode);
      if (!modeData) return null;
      return obs.ensureSeriesShape(modeData, metricId || state.metric);
    }

    return {
      getState: getState,
      setMode: setMode,
      setMetric: setMetric,
      setSecondary: setSecondary,
      setCompare: setCompare,
      ensureSecondaryDistinct: ensureSecondaryDistinct,
      addCustomMetric: addCustomMetric,
      addDiaryPoint: addDiaryPoint,
      getModeData: getModeData,
      getSeries: getSeries,
      getViewData: function () {
        return viewData;
      },
      getVisits: function () {
        return visits;
      },
      getNotes: function () {
        return diaryNotes.slice();
      },
      metrics: metrics,
    };
  }

  root.domains.observations.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
