(function initPetLiveWebObservationsEvents(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  function shortLabelFor(event) {
    if (!event) return "";
    if (event.shortLabel) return String(event.shortLabel);
    const label = String(event.label || "");
    if (label.length > 8) return label.slice(0, 7) + "…";
    return label;
  }

  function toneForKind(kind) {
    return kind === "visit" ? "#db1f64" : "#1487bd";
  }

  function planEventLabels(events) {
    const seen = Object.create(null);
    return (events || []).map(function (event) {
      const index = event && event.index != null ? event.index : -1;
      const showLabel = !seen[index];
      seen[index] = true;
      return {
        index: index,
        label: event && event.label != null ? event.label : "",
        kind: event && event.kind != null ? event.kind : "",
        visitId: event && event.visitId != null ? String(event.visitId) : "",
        shortLabel: shortLabelFor(event),
        tone: toneForKind(event && event.kind),
        showLabel: showLabel,
      };
    });
  }

  root.domains.observations.shortLabelFor = shortLabelFor;
  root.domains.observations.toneForKind = toneForKind;
  root.domains.observations.planEventLabels = planEventLabels;
})(typeof window !== "undefined" ? window : globalThis);
