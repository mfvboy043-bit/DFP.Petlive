(function initPetLiveWebObservationsTitles(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  /**
   * Title priority: project.name → customTitle → "{metric}｜{mode}觀察趨勢"
   */
  function resolveChartTitle(opts) {
    const cfg = opts || {};
    const projectName = String(cfg.projectName || (cfg.project && cfg.project.name) || "").trim();
    if (projectName) return projectName;
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
