(function initPetLiveWebEmergencyRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.emergency = root.domains.emergency || {};

  function createRenderer(deps = {}) {
    const {
      label,
      escapeHtml,
      alertTypeLabel,
      alertLineText,
      locField,
      formatMedDose,
      formatMedCourse,
      expandFrequencyInText,
      notesIdForMed,
      buildDrugNotesShellHtml,
      ownerProfileHasAny,
    } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (typeof escapeHtml !== "function") {
      throw new TypeError("createRenderer requires escapeHtml");
    }
    if (typeof notesIdForMed !== "function") {
      throw new TypeError("createRenderer requires notesIdForMed");
    }
    if (typeof buildDrugNotesShellHtml !== "function") {
      throw new TypeError("createRenderer requires buildDrugNotesShellHtml");
    }

    function buildEmptyAlertsListHtml() {
      return `<li>${label("noAlertItem")}</li>`;
    }

    function buildAlertsListHtml(alerts) {
      if (!alerts?.length) return buildEmptyAlertsListHtml();
      return alerts
        .map((alert) => {
          const severity = alert.severity === "critical" ? "critical" : "caution";
          const line =
            (typeof alertLineText === "function" ? alertLineText(alert) : "") ||
            (typeof locField === "function" ? locField(alert.description) : "") ||
            alert.description ||
            "";
          const typeLabel =
            alert.alertType && typeof alertTypeLabel === "function"
              ? alertTypeLabel(alert.alertType)
              : alert.type || "";
          return `<li class="is-${severity}"><strong>${escapeHtml(
            typeLabel
          )}</strong> ${escapeHtml(line)}${
            alert.source === "owner"
              ? ` <span class="e-alert-source">(${escapeHtml(
                  label("alertSourceOwnerShort")
                )})</span>`
              : ""
          }</li>`;
        })
        .join("");
    }

    function buildEmptyMedListHtml() {
      return `<li>${label("noMeds")}</li>`;
    }

    function buildDegradedListHtml(message) {
      return `<li class="is-degraded">${message}</li>`;
    }

    function buildWeightHtml({ weight, date }) {
      return label("eWeight", { weight, date });
    }

    function buildOwnerEmptyHtml() {
      return `<p class="e-owner-empty">${label("ownerContactEmpty")}</p>`;
    }

    function buildOwnerBlockHtml(profile) {
      if (typeof ownerProfileHasAny === "function" && !ownerProfileHasAny(profile)) {
        return buildOwnerEmptyHtml();
      }
      const row = (rowLabel, valueHtml) =>
        `<p class="e-owner-row"><span class="e-owner-k">${rowLabel}</span><span class="e-owner-v">${valueHtml}</span></p>`;
      const rows = [];
      if (profile?.name || profile?.phone) {
        const parts = [];
        if (profile.name) parts.push(`<span class="e-owner-name">${profile.name}</span>`);
        if (profile.phone) parts.push(`<span class="e-owner-phone">${profile.phone}</span>`);
        rows.push(row(label("ownerName"), parts.join("")));
      }
      if (profile?.email) {
        rows.push(row(label("ownerEmailShort"), profile.email));
      }
      if (profile?.emergencyName || profile?.emergencyPhone) {
        const parts = [];
        if (profile.emergencyName) {
          parts.push(`<span class="e-owner-name">${profile.emergencyName}</span>`);
        }
        if (profile.emergencyPhone) {
          parts.push(`<span class="e-owner-phone">${profile.emergencyPhone}</span>`);
        }
        rows.push(row(label("ownerEmergencyLabel"), parts.join("")));
      }
      if (profile?.address) {
        rows.push(row(label("ownerAddressShort"), profile.address));
      }
      return rows.join("");
    }

    function medCourseHtml(view, variant) {
      if (variant === "local") {
        return typeof formatMedCourse === "function" ? formatMedCourse(view) : "";
      }
      if (view.startDate != null && view.durationDays != null) {
        return typeof formatMedCourse === "function" ? formatMedCourse(view) : "";
      }
      if (view.dose && typeof expandFrequencyInText === "function") {
        return escapeHtml(expandFrequencyInText(view.dose));
      }
      return view.dose ? escapeHtml(String(view.dose)) : "";
    }

    function buildMedListHtml(meds, { emergencyPrefix, variant = "module" }, drugNotePanels) {
      if (!meds?.length) {
        return { html: buildEmptyMedListHtml(), drugNotePanels: drugNotePanels || [] };
      }
      const panels = drugNotePanels || [];
      const html = meds
        .map((med, medIndex) => {
          let name = med.name;
          if (variant === "module") {
            name =
              med.name ||
              med.unrecognizedDrugName ||
              med.drugId ||
              label("emergencyMedNameUnknown");
          }
          const view = variant === "module" ? { ...med, name } : med;
          const prefix =
            variant === "local" ? emergencyPrefix : view.id || medIndex;
          const notesId = notesIdForMed({
            emergencyPrefix: prefix,
            medIndex,
          });
          panels.push({ notesId, med: view });
          const nameHtml =
            variant === "local" ? name : escapeHtml(name);
          const doseHtml =
            typeof formatMedDose === "function" ? formatMedDose(view) : "";
          const courseHtml = medCourseHtml(view, variant);
          return `
      <li class="e-med">
        <div class="tl-med-name-row">
          <strong>${nameHtml}</strong>
          <button
            type="button"
            class="tl-drug-notes-btn"
            data-drug-notes-toggle
            aria-expanded="false"
            aria-controls="${notesId}"
          >${label("timelineDrugNotesBtn")}</button>
        </div>
        <span class="e-med-dose">${doseHtml}</span>
        <span class="e-med-course">${courseHtml}</span>
        ${buildDrugNotesShellHtml(notesId)}
        <p class="e-med-detail-hint">${label("emergencyMedDetailHint")}</p>
      </li>`;
        })
        .join("");
      return { html, drugNotePanels: panels };
    }

    function buildActiveMedListHtml(meds, emergencyPrefix) {
      return buildMedListHtml(meds, { emergencyPrefix, variant: "local" });
    }

    return {
      buildAlertsListHtml,
      buildEmptyAlertsListHtml,
      buildMedListHtml,
      buildActiveMedListHtml,
      buildEmptyMedListHtml,
      buildDegradedListHtml,
      buildWeightHtml,
      buildOwnerBlockHtml,
      buildOwnerEmptyHtml,
    };
  }

  root.domains.emergency.createRenderer = createRenderer;
})(typeof window !== "undefined" ? window : globalThis);
