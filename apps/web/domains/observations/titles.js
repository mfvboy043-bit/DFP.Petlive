(function initPetLiveWebObservationsTitles(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  /**
   * Default auto title: "{metric}｜{mode}觀察趨勢"
   * Custom title wins when non-empty trimmed string.
   */
  function resolveChartTitle(opts) {
    const cfg = opts || {};
    const custom = String(cfg.customTitle || "").trim();
    if (custom) return custom;
    const metricLabel = cfg.metricLabel != null ? String(cfg.metricLabel) : "";
    const modeLabel = cfg.modeLabel != null ? String(cfg.modeLabel) : "";
    if (metricLabel && modeLabel) return metricLabel + "｜" + modeLabel + "觀察趨勢";
    return metricLabel || modeLabel || "觀察趨勢";
  }

  function normalizeCustomTitle(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    return raw.slice(0, 48);
  }

  root.domains.observations.resolveChartTitle = resolveChartTitle;
  root.domains.observations.normalizeCustomTitle = normalizeCustomTitle;
})(typeof window !== "undefined" ? window : globalThis);
