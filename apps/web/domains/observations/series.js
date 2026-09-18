(function initPetLiveWebObservationsSeries(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  function isEmptySeries(series) {
    if (!series || !Array.isArray(series.current)) return true;
    return !series.current.some(function (v) {
      return Number.isFinite(v);
    });
  }

  function emptySeries(len) {
    const n = Math.max(0, Number(len) || 0);
    return {
      current: Array(n).fill(null),
      previous: Array(n).fill(null),
      sources: Array(n).fill(null),
    };
  }

  function ensureSeriesShape(modeData, metricId) {
    if (!modeData || !metricId) return null;
    if (!modeData[metricId]) {
      const len = Array.isArray(modeData.labels) ? modeData.labels.length : 0;
      modeData[metricId] = emptySeries(len);
    }
    return modeData[metricId];
  }

  function yScaleFor(meta, series, compare) {
    if (meta && meta.scale === "fixed10") {
      return { min: 0, max: 10, ticks: [0, 2, 4, 6, 8, 10] };
    }
    const values = (series && series.current ? series.current : []).concat(
      compare && series && series.previous ? series.previous : []
    );
    const finite = values.filter(function (v) {
      return Number.isFinite(v);
    });
    if (!finite.length) return { min: 0, max: 10, ticks: [0, 5, 10] };
    let min = Math.min.apply(null, finite);
    let max = Math.max.apply(null, finite);
    if (min === max) {
      min = Math.max(0, min - 1);
      max = max + 1;
    }
    const pad = (max - min) * 0.12;
    min = Math.floor((min - pad) * 10) / 10;
    max = Math.ceil((max + pad) * 10) / 10;
    const mid = Math.round(((min + max) / 2) * 10) / 10;
    return { min: min, max: max, ticks: [min, mid, max] };
  }

  root.domains.observations.isEmptySeries = isEmptySeries;
  root.domains.observations.emptySeries = emptySeries;
  root.domains.observations.ensureSeriesShape = ensureSeriesShape;
  root.domains.observations.yScaleFor = yScaleFor;
})(typeof window !== "undefined" ? window : globalThis);
