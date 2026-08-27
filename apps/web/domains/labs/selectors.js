(function initPetLiveWebLabsSelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.labs = root.domains.labs || {};

  const LAB_PHOTOS_MAX = 6;
  const LAB_TYPE_ORDER = [
    "blood",
    "chemistry",
    "urine",
    "fecal",
    "snap",
    "other",
  ];
  const LAB_TYPE_I18N = {
    blood: "labTypeBlood",
    chemistry: "labTypeChem",
    urine: "labTypeUrine",
    fecal: "labTypeFecal",
    snap: "labTypeSnap",
    other: "labTypeOther",
  };

  function createSelectors({ visitClinicLabel } = {}) {
    const clinicLabel =
      typeof visitClinicLabel === "function"
        ? visitClinicLabel
        : (visit) => visit?.clinic || "";

    function isValidLabType(type) {
      return Boolean(type && LAB_TYPE_I18N[type]);
    }

    function filterLabTypes(types) {
      return (types || []).filter(isValidLabType);
    }

    function sortLabReports(rows) {
      return (rows || [])
        .filter((row) => row && Array.isArray(row.photos) && row.photos.length)
        .slice()
        .sort((a, b) => {
          const da = String(a.date || "");
          const db = String(b.date || "");
          if (da !== db) return da < db ? 1 : -1;
          return String(b.createdAt || b.id || "").localeCompare(
            String(a.createdAt || a.id || "")
          );
        });
    }

    function reportMatchesVisit(report, visit) {
      if (!report?.visitDate || !visit?.date) return false;
      if (report.visitDate !== visit.date) return false;
      if (report.visitClinicId && visit.clinicId) {
        return report.visitClinicId === visit.clinicId;
      }
      const reportClinic = report.clinic || "";
      if (!reportClinic && !report.visitClinicId) return true;
      return (
        reportClinic === clinicLabel(visit) || reportClinic === visit.clinic
      );
    }

    function visitHasLinkedLabs(reports, visit) {
      return sortLabReports(reports).some((report) =>
        reportMatchesVisit(report, visit)
      );
    }

    function latestLabSummary(reports) {
      const sorted = sortLabReports(reports);
      if (!sorted.length) return null;
      const latest = sorted[0];
      return {
        date: latest.date,
        types: latest.types || [],
      };
    }

    return {
      LAB_PHOTOS_MAX,
      LAB_TYPE_ORDER,
      LAB_TYPE_I18N,
      isValidLabType,
      filterLabTypes,
      sortLabReports,
      reportMatchesVisit,
      visitHasLinkedLabs,
      latestLabSummary,
    };
  }

  root.domains.labs.LAB_PHOTOS_MAX = LAB_PHOTOS_MAX;
  root.domains.labs.LAB_TYPE_ORDER = LAB_TYPE_ORDER;
  root.domains.labs.LAB_TYPE_I18N = LAB_TYPE_I18N;
  root.domains.labs.createSelectors = createSelectors;
})(typeof window !== "undefined" ? window : globalThis);
