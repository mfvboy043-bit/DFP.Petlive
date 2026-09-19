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

  function seriesFinite(series, compare) {
    const values = (series && series.current ? series.current : []).concat(
      compare && series && series.previous ? series.previous : []
    );
    return values.filter(function (v) {
      return Number.isFinite(v);
    });
  }

  function niceCountMax(n) {
    const padded = Math.max(0, Number(n) || 0) * 1.12;
    if (padded <= 5) return 5;
    if (padded <= 10) return 10;
    if (padded <= 20) return 20;
    if (padded <= 25) return 25;
    if (padded <= 30) return 30;
    if (padded <= 40) return 40;
    if (padded <= 50) return 50;
    if (padded <= 100) return Math.ceil(padded / 10) * 10;
    const mag = Math.pow(10, Math.floor(Math.log10(padded)));
    return Math.ceil(padded / mag) * mag;
  }

  function countScale(finite) {
    if (!finite.length) return { min: 0, max: 10, ticks: [0, 5, 10] };
    const max = niceCountMax(Math.max.apply(null, finite));
    const mid = max / 2;
    return { min: 0, max: max, ticks: [0, mid, max] };
  }

  function yScaleFor(meta, series, compare) {
    const finite = seriesFinite(series, compare);
    const overflowFixed =
      meta &&
      meta.scale === "fixed10" &&
      finite.some(function (v) {
        return v > 10 || v < 0;
      });
    if (meta && meta.scale === "fixed10" && !overflowFixed) {
      return { min: 0, max: 10, ticks: [0, 2, 4, 6, 8, 10] };
    }
    if ((meta && meta.scale === "count") || overflowFixed) {
      return countScale(finite);
    }
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

  function yScaleForTracks(tracks) {
    const list = Array.isArray(tracks) ? tracks.filter(Boolean) : [];
    const values = [];
    const metas = [];
    list.forEach(function (track) {
      const series = track.series || {};
      (series.current || []).forEach(function (value) {
        if (Number.isFinite(value)) values.push(value);
      });
      if (track.meta) metas.push(track.meta);
    });
    if (!list.length) return yScaleFor({ scale: "count" }, { current: [] }, false);
    const dummy = { current: values };
    if (metas.length < 2) return yScaleFor(metas[0] || {}, dummy, false);
    const unit = String(metas[0].unit || "");
    const sameUnit = metas.every(function (meta) {
      return String(meta.unit || "") === unit;
    });
    if (sameUnit) return yScaleFor(metas[0], dummy, false);
    return yScaleFor({ scale: values.some(function (v) { return v > 10; }) ? "count" : "open" }, dummy, false);
  }

  root.domains.observations.isEmptySeries = isEmptySeries;
  root.domains.observations.yScaleForTracks = yScaleForTracks;
  root.domains.observations.emptySeries = emptySeries;
  root.domains.observations.ensureSeriesShape = ensureSeriesShape;
  root.domains.observations.yScaleFor = yScaleFor;
})(typeof window !== "undefined" ? window : globalThis);
