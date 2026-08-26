(function initPetLiveWebAlertsSelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.alerts = root.domains.alerts || {};

  function createSelectors({ alerts } = {}) {
    if (!alerts || typeof alerts.sortAlerts !== "function") {
      throw new TypeError("createSelectors requires alerts controller with sortAlerts");
    }

    function sortAlerts(list) {
      return alerts.sortAlerts(list);
    }

    function highestAlertSeverity(list) {
      if ((list || []).some((alert) => alert.severity === "critical")) return "critical";
      if ((list || []).some((alert) => alert.severity === "caution")) return "caution";
      return null;
    }

    function alertCount(list) {
      return (list || []).length;
    }

    function hasCritical(list) {
      return (list || []).some((alert) => alert.severity === "critical");
    }

    function filterByTypes(list, types) {
      const allowed = new Set(types || []);
      return (list || []).filter((alert) => allowed.has(alert.alertType));
    }

    return {
      sortAlerts,
      highestAlertSeverity,
      alertCount,
      hasCritical,
      filterByTypes,
    };
  }

  root.domains.alerts.createSelectors = createSelectors;
})(typeof window !== "undefined" ? window : globalThis);
