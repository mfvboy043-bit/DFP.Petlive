(function initPetLiveWebShellEmergencyPaint(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  /**
   * Local / degraded-free emergency card paint (generate missing or failed).
   */
  function renderEmergencyCardLocal(hooks = {}) {
    const {
      pet,
      paintEmergencyIdentity,
      buildWeightHtml,
      getAlertsForPet,
      syncAlertNavTone,
      getAlertsBlock,
      renderEmergencyAlertsList,
      renderEmergencyMeds,
      renderEmergencyOwner,
      renderEmergencyPetPhoto,
      setWeightHtml,
    } = hooks;
    if (!pet) return false;

    if (typeof paintEmergencyIdentity === "function") {
      paintEmergencyIdentity(pet);
    }
    if (typeof setWeightHtml === "function" && typeof buildWeightHtml === "function") {
      setWeightHtml(
        buildWeightHtml({
          weight: pet.weight,
          date: pet.weightDate,
        })
      );
    }
    const alerts =
      typeof getAlertsForPet === "function" ? getAlertsForPet(pet) : [];
    if (typeof syncAlertNavTone === "function") syncAlertNavTone(alerts);
    const alertsBlock =
      typeof getAlertsBlock === "function" ? getAlertsBlock() : null;
    alertsBlock?.classList.remove("is-degraded");
    if (typeof renderEmergencyAlertsList === "function") {
      renderEmergencyAlertsList(alerts);
    }
    if (typeof renderEmergencyMeds === "function") renderEmergencyMeds(pet);
    if (typeof renderEmergencyOwner === "function") renderEmergencyOwner();
    if (typeof renderEmergencyPetPhoto === "function") {
      renderEmergencyPetPhoto(pet);
    }
    return true;
  }

  /**
   * Emergency card paint: generate → degraded sections → DOM assign.
   * Falls back to local paint when generate is missing or returns null.
   */
  function renderEmergencyCard(hooks = {}) {
    const {
      pet,
      generateEmergencyCard,
      loadOwnerProfile,
      buildEmergencySnapshot,
      readInjectFail,
      callModule,
      paintEmergencyIdentity,
      setNameText,
      degradedSections,
      getAlertsForPet,
      syncAlertNavTone,
      getAlertsBlock,
      setWeightText,
      setWeightHtml,
      buildWeightHtml,
      setAlertsHtml,
      buildDegradedListHtml,
      renderEmergencyAlertsList,
      setMedsHtml,
      renderEmergencyMedsFromList,
      renderEmergencyMeds,
      renderEmergencyOwner,
      renderEmergencyPetPhoto,
      t,
      labels = {},
    } = hooks;
    if (!pet) return false;

    const generate = generateEmergencyCard;
    if (typeof generate !== "function") {
      return renderEmergencyCardLocal(hooks);
    }

    const profile =
      typeof loadOwnerProfile === "function" ? loadOwnerProfile() : {};
    const snapshot =
      typeof buildEmergencySnapshot === "function"
        ? buildEmergencySnapshot(pet)
        : null;
    const injectFail =
      typeof readInjectFail === "function" ? readInjectFail() : {};

    const runGenerate = () =>
      generate(
        pet.id,
        {
          name: profile.name || "",
          phone: profile.phone || "",
        },
        undefined,
        { snapshot, injectFail }
      );

    const result =
      typeof callModule === "function" ? callModule(runGenerate, null) : runGenerate();

    if (!result) {
      return renderEmergencyCardLocal(hooks);
    }

    const cardPet = result.pet || pet;
    if (typeof paintEmergencyIdentity === "function") {
      paintEmergencyIdentity(pet);
    }
    if (cardPet.name && typeof setNameText === "function") {
      setNameText(cardPet.name || pet.name);
    }

    const degraded =
      typeof degradedSections === "function"
        ? degradedSections(result)
        : { weight: false, alerts: false, medications: false };
    const alertsBlock =
      typeof getAlertsBlock === "function" ? getAlertsBlock() : null;

    if (degraded.weight) {
      if (typeof setWeightText === "function" && typeof t === "function") {
        setWeightText(t(labels.degradedWeight || "emergencyDegradedWeight"));
      }
    } else if (result.latestWeight && result.latestWeight.weight != null) {
      if (typeof setWeightHtml === "function" && typeof buildWeightHtml === "function") {
        setWeightHtml(
          buildWeightHtml({
            weight: result.latestWeight.weight,
            date: result.latestWeight.recordedDate || pet.weightDate || "—",
          })
        );
      }
    } else if (
      typeof setWeightHtml === "function" &&
      typeof buildWeightHtml === "function"
    ) {
      setWeightHtml(
        buildWeightHtml({
          weight: pet.weight,
          date: pet.weightDate,
        })
      );
    }

    // Nav tone from local truth; section chrome clears severity when alerts degraded.
    if (typeof syncAlertNavTone === "function" && typeof getAlertsForPet === "function") {
      syncAlertNavTone(getAlertsForPet(pet));
    }

    if (degraded.alerts) {
      alertsBlock?.classList.remove("is-critical", "is-caution");
      alertsBlock?.classList.add("is-degraded");
      if (
        typeof setAlertsHtml === "function" &&
        typeof buildDegradedListHtml === "function" &&
        typeof t === "function"
      ) {
        setAlertsHtml(
          buildDegradedListHtml(
            t(labels.degradedAlerts || "emergencyDegradedAlerts")
          )
        );
      }
    } else {
      alertsBlock?.classList.remove("is-degraded");
      if (typeof renderEmergencyAlertsList === "function") {
        renderEmergencyAlertsList(result.alerts || []);
      }
    }

    if (degraded.medications) {
      if (
        typeof setMedsHtml === "function" &&
        typeof buildDegradedListHtml === "function" &&
        typeof t === "function"
      ) {
        setMedsHtml(
          buildDegradedListHtml(
            t(labels.degradedMeds || "emergencyDegradedMeds")
          )
        );
      }
    } else if (typeof renderEmergencyMedsFromList === "function") {
      renderEmergencyMedsFromList(result.currentMedications || []);
    }

    if (typeof renderEmergencyOwner === "function") renderEmergencyOwner();
    if (typeof renderEmergencyPetPhoto === "function") {
      renderEmergencyPetPhoto(pet);
    }
    return true;
  }

  root.shell.renderEmergencyCardLocal = renderEmergencyCardLocal;
  root.shell.renderEmergencyCard = renderEmergencyCard;
})(typeof window !== "undefined" ? window : globalThis);
