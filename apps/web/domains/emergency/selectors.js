(function initPetLiveWebEmergencySelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.emergency = root.domains.emergency || {};

  function createSelectors({ adapter } = {}) {
    if (
      !adapter ||
      typeof adapter.deriveActiveEmergencyMeds !== "function" ||
      typeof adapter.buildSnapshot !== "function"
    ) {
      throw new TypeError(
        "createSelectors requires adapter with buildSnapshot and deriveActiveEmergencyMeds"
      );
    }

    /**
     * Structured copy data from local pets[] truth (not module-degraded lists).
     * Final join + chrome copy-* strings stay in the view facade.
     */
    function copyPayload(
      pet,
      {
        profile = {},
        labelOfAlertType,
        formatMedLine,
        noneLabel = "",
        lineTextOfAlert,
      } = {}
    ) {
      if (typeof labelOfAlertType !== "function") {
        throw new TypeError("copyPayload requires labelOfAlertType");
      }
      if (typeof formatMedLine !== "function") {
        throw new TypeError("copyPayload requires formatMedLine");
      }

      const snapshot = adapter.buildSnapshot(pet);
      const alerts = snapshot.alerts || [];
      const meds = snapshot.currentMedications || [];

      const alertParts = alerts.map((alert) => {
        const typeLabel = labelOfAlertType(alert.alertType);
        const line =
          typeof lineTextOfAlert === "function"
            ? lineTextOfAlert(alert)
            : alert.desc || alert.text || alert.description || "";
        return `${typeLabel} ${line}`.trim();
      });

      const medParts = meds.map((med) => formatMedLine(med));

      return {
        pet: {
          id: pet?.id,
          name: pet?.name,
          species: pet?.species,
          breed: pet?.breed,
          gender: pet?.gender,
          birthDate: pet?.birthDate,
          weight: pet?.weight,
          weightDate: pet?.weightDate,
          chipNumber: pet?.chipNumber || "",
        },
        alerts,
        currentMedications: meds,
        alertsText: alertParts.length ? alertParts.join("；") : noneLabel,
        medsText: medParts.length ? medParts.join("；") : noneLabel,
        owner: {
          name: profile.name || "",
          phone: profile.phone || "",
          email: profile.email || "",
          emergencyName: profile.emergencyName || "",
          emergencyPhone: profile.emergencyPhone || "",
          address: profile.address || "",
        },
      };
    }

    /** Thin read of module result._degraded; defaults false when missing. */
    function degradedSections(result) {
      const degraded = result && result._degraded ? result._degraded : {};
      return {
        weight: Boolean(degraded.weight),
        alerts: Boolean(degraded.alerts),
        medications: Boolean(degraded.medications),
      };
    }

    return {
      copyPayload,
      degradedSections,
    };
  }

  root.domains.emergency.createSelectors = createSelectors;
})(typeof window !== "undefined" ? window : globalThis);
