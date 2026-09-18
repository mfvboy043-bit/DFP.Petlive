(function initPetLiveWebObservationsSummary(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  function computePeriodSummary(values, labels, meta, formatValue) {
    const list = Array.isArray(values) ? values : [];
    const axis = Array.isArray(labels) ? labels : [];
    const format =
      typeof formatValue === "function"
        ? formatValue
        : function (value) {
            return Number.isFinite(value) ? String(value) : "—";
          };

    const valid = list.filter(function (value) {
      return Number.isFinite(value);
    });

    if (!valid.length) {
      return {
        latestText: "—",
        latestNote: "無有效點",
        changeText: "—",
        completionText: "0%",
      };
    }

    const latest = valid[valid.length - 1];
    const first = valid[0];
    const change = Math.round((latest - first) * 10) / 10;
    const completion = Math.round((valid.length / Math.max(1, list.length)) * 100);
    let lastIndex = list.length - 1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (Number.isFinite(list[i])) {
        lastIndex = i;
        break;
      }
    }

    const sign = change > 0 ? "+" : change < 0 ? "−" : "";
    return {
      latestText: format(latest, meta),
      latestNote: axis[lastIndex] != null ? String(axis[lastIndex]) : "—",
      changeText: sign + Math.abs(change),
      completionText: completion + "%",
    };
  }

  root.domains.observations.computePeriodSummary = computePeriodSummary;
})(typeof window !== "undefined" ? window : globalThis);
