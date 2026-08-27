(function initPetLiveWebAlertsRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.alerts = root.domains.alerts || {};

  function createRenderer(deps = {}) {
    const {
      label,
      escapeHtml,
      alertTypeLabel,
      alertLineText,
      locField,
      chronicSinceLine,
    } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (typeof escapeHtml !== "function") {
      throw new TypeError("createRenderer requires escapeHtml");
    }
    if (typeof alertTypeLabel !== "function") {
      throw new TypeError("createRenderer requires alertTypeLabel");
    }
    if (typeof alertLineText !== "function") {
      throw new TypeError("createRenderer requires alertLineText");
    }
    if (typeof chronicSinceLine !== "function") {
      throw new TypeError("createRenderer requires chronicSinceLine");
    }

    function buildAlertItemHtml(alert) {
      const severity = alert.severity === "critical" ? "critical" : "caution";
      const noteText =
        typeof locField === "function" ? locField(alert.note) : alert.note || "";
      const note = noteText
        ? `<p class="alert-note">${escapeHtml(noteText)}</p>`
        : "";
      const sinceText = chronicSinceLine(alert);
      const since = sinceText
        ? `<p class="alert-since">${escapeHtml(sinceText)}</p>`
        : "";
      const sourceLabel =
        alert.source === "owner"
          ? label("alertSourceOwner")
          : label("alertSourceLinked");
      const sourceClass = alert.source === "owner" ? "is-owner" : "is-linked";
      const severityLabel =
        severity === "critical"
          ? label("alertSeverityCritical")
          : label("alertSeverityCaution");
      const actions = `<div class="alert-item-actions">
          <button type="button" class="text-btn" data-alert-edit="${escapeHtml(
            alert.id
          )}">${label("editAlert")}</button>
          <button type="button" class="text-btn alert-delete" data-alert-delete="${escapeHtml(
            alert.id
          )}">${label("deleteAlert")}</button>
        </div>`;

      return `
    <li class="alert-item severity-${severity}" data-alert-id="${escapeHtml(
      alert.id
    )}">
      <div class="alert-item-top">
        <p class="alert-type">${escapeHtml(alertTypeLabel(alert.alertType))}</p>
        <div class="alert-item-meta">
          <span class="alert-severity-badge is-${severity}">${escapeHtml(severityLabel)}</span>
          <span class="alert-source ${sourceClass}">${escapeHtml(sourceLabel)}</span>
        </div>
      </div>
      <p class="alert-desc">${escapeHtml(alertLineText(alert))}</p>
      ${since}
      ${note}
      ${actions}
    </li>`;
    }

    function buildFlatEmptyListHtml() {
      return `<li class="alert-item"><p class="alert-desc">${label("noAlertItems")}</p></li>`;
    }

    function buildFlatListHtml(alerts) {
      if (!alerts?.length) return buildFlatEmptyListHtml();
      return alerts.map((alert) => buildAlertItemHtml(alert)).join("");
    }

    function buildSectionsHtml({ alerts, sections, editingSectionIds }) {
      const editing =
        editingSectionIds instanceof Set
          ? editingSectionIds
          : new Set(editingSectionIds || []);
      return (sections || [])
        .map((section) => {
          const items = (alerts || []).filter((alert) =>
            section.types.includes(alert.alertType)
          );
          const addType = section.types[0];
          const isEditing = editing.has(section.id);
          const body = items.length
            ? `<ul class="alert-list">${items
                .map((alert) => buildAlertItemHtml(alert))
                .join("")}</ul>`
            : `<p class="alert-section-empty">${label(section.emptyKey)}</p>`;
          return `
      <section class="alert-section${isEditing ? " is-editing" : ""}" data-alert-section="${section.id}">
        <div class="alert-section-head">
          <h3>${label(section.titleKey)}</h3>
          <div class="alert-section-actions">
            <button
              type="button"
              class="text-btn alert-section-edit"
              data-alert-section-edit="${escapeHtml(section.id)}"
              aria-pressed="${isEditing ? "true" : "false"}"
            >${label(isEditing ? "alertSectionEditDone" : "alertSectionEdit")}</button>
            <button
              type="button"
              class="text-btn alert-section-add"
              data-alert-add-type="${escapeHtml(addType)}"
            >${label("alertAddItem")}</button>
          </div>
        </div>
        ${body}
      </section>`;
        })
        .join("");
    }

    return {
      buildAlertItemHtml,
      buildFlatEmptyListHtml,
      buildFlatListHtml,
      buildSectionsHtml,
    };
  }

  root.domains.alerts.createRenderer = createRenderer;
})(typeof globalThis !== "undefined" ? globalThis : window);
