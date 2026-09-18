(function initPetLiveWebObservationsDiary(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  function createNote(opts) {
    const input = opts || {};
    const text = String(input.text != null ? input.text : input.note || "");
    return {
      at: input.at || new Date().toISOString(),
      metricId: input.metricId || null,
      value: Number.isFinite(input.value) ? input.value : null,
      visitId: input.visitId || null,
      text: text,
      note: text,
    };
  }

  function applyDiaryPoint(series, index, value) {
    if (!series || !Array.isArray(series.current)) return series;
    const i = Number(index);
    if (!Number.isInteger(i) || i < 0 || i >= series.current.length) return series;
    series.current[i] = value;
    if (!Array.isArray(series.sources) || series.sources.length !== series.current.length) {
      series.sources = Array(series.current.length).fill(null);
    }
    series.sources[i] = "diary";
    return series;
  }

  root.domains.observations.createNote = createNote;
  root.domains.observations.applyDiaryPoint = applyDiaryPoint;
})(typeof window !== "undefined" ? window : globalThis);
