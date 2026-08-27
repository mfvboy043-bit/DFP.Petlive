(function initPetLiveWebTimelineRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.timeline = root.domains.timeline || {};

  function createRenderer(deps = {}) {
    const {
      label,
      locField,
      formatShortDate,
      visitClinicLabel,
      visitTagLabel,
      getSourceTags,
      expandFrequencyInText,
      compoundFormClass,
      compoundChipToneClass,
      compoundFormBadge,
      compoundIconKind,
      timelineSelectors,
      timelineViewHelpers,
      visits,
      imaging,
      hasLinkedLabs,
    } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (!timelineSelectors || typeof timelineSelectors.buildTimelineEntries !== "function") {
      throw new TypeError("createRenderer requires timelineSelectors.buildTimelineEntries");
    }
    if (!timelineViewHelpers || typeof timelineViewHelpers.notesIdForMed !== "function") {
      throw new TypeError("createRenderer requires timelineViewHelpers.notesIdForMed");
    }
    if (!visits || typeof visits.visitWeightKg !== "function") {
      throw new TypeError("createRenderer requires visits controller helpers");
    }
    if (!imaging || typeof imaging.getVisitImaging !== "function") {
      throw new TypeError("createRenderer requires imaging controller helpers");
    }

    function buildDrugNotesBodyHtml(model) {
      if (model.status === "pending") {
        return `<p class="tl-drug-notes-empty">${label("timelineDrugPendingNotes")}</p>`;
      }
      if (model.status === "unavailable") {
        return `<p class="tl-drug-notes-empty">${label("drugInfoUnavailable")}</p>`;
      }
      const sides = (model.sideEffects || [])
        .map((item) => `<li>${item}</li>`)
        .join("");
      const precautions = (model.precautions || [])
        .map((item) => `<li>${item}</li>`)
        .join("");
      const unavailable = label("drugInfoUnavailable");
      return `
        <p class="tl-drug-purpose"><span>${label("timelineDrugPurpose")}</span>${model.purposeText}</p>
        <div class="tl-drug-block">
          <h4>${label("drugSideEffects")}</h4>
          <ul>${sides || `<li>${unavailable}</li>`}</ul>
        </div>
        <div class="tl-drug-block">
          <h4>${label("drugPrecautions")}</h4>
          <ul>${precautions || `<li>${unavailable}</li>`}</ul>
        </div>
        <p class="tl-drug-disclaimer">${label("timelineDrugSource")}</p>`;
    }

    function buildDrugNotesShellHtml(notesId) {
      return `<div class="tl-drug-notes" id="${notesId}" hidden data-drug-notes-shell>
    <p class="tl-drug-notes-title">${label("timelineDrugNotes")}</p>
  </div>`;
    }

    function buildVisitProofThumbsHtml(slots, visitIndex) {
      const parts = [];
      const fig = (slot, url, labelKey) => `
    <figure class="tl-visit-rx-fig">
      <button
        type="button"
        class="tl-visit-rx-zoom"
        data-proof-lightbox
        data-proof-caption="${labelKey}"
        aria-label="${label("proofLightboxOpen")}"
      >
        <img src="${url}" alt="" />
      </button>
      <figcaption>${label(labelKey)}</figcaption>
      <button
        type="button"
        class="tl-visit-rx-remove"
        data-visit-proof-clear-slot="${slot}"
        data-visit-index="${visitIndex}"
      >${label("proofPhotoClear")}</button>
    </figure>`;

      (slots.bag || []).forEach((url) => {
        parts.push(fig("bag", url, "medBagPhoto"));
      });
      (slots.rx || []).forEach((url) => {
        parts.push(fig("rx", url, "medRxPhoto"));
      });
      (slots.drug || []).forEach((url) => {
        parts.push(fig("drug", url, "medDrugPhoto"));
      });
      return parts.join("");
    }

    function buildVisitImagingThumbsHtml(imagingData, visitIndex) {
      const parts = [];
      const fig = (slot, url, index, labelKey) => `
    <figure class="tl-visit-rx-fig">
      <button
        type="button"
        class="tl-visit-rx-zoom"
        data-proof-lightbox
        data-proof-caption="${labelKey}"
        aria-label="${label("proofLightboxOpen")}"
      >
        <img src="${url}" alt="" />
      </button>
      <figcaption>${label(labelKey)}</figcaption>
      <button
        type="button"
        class="tl-visit-rx-remove"
        data-visit-imaging-clear-slot="${slot}"
        data-visit-imaging-clear-index="${index}"
        data-visit-index="${visitIndex}"
      >${label("proofPhotoClear")}</button>
    </figure>`;

      (imagingData.xrayPhotos || []).forEach((url, index) => {
        parts.push(fig("xray", url, index, "imagingXrayCaption"));
      });
      (imagingData.usPhotos || []).forEach((url, index) => {
        parts.push(fig("us", url, index, "imagingUsCaption"));
      });
      return parts.join("");
    }

    function buildVisitWeightVsHtml(visit, previousVisit) {
      if (!previousVisit) return "";
      const days = visits.calendarDaysBetween(previousVisit.date, visit.date);
      const parts = [];
      if (days != null && days >= 0) {
        parts.push(
          `<span class="tl-weight-days">${label("visitWeightDaysSince", { days })}</span>`
        );
      }
      const cur = visits.visitWeightKg(visit);
      const prev = visits.visitWeightKg(previousVisit);
      if (cur != null && prev != null) {
        const delta = Math.round((cur - prev) * 10) / 10;
        if (delta === 0) {
          parts.push(
            `<span class="tl-weight-delta is-same"><span class="tl-weight-delta-mark" aria-hidden="true">=</span> ${label(
              "visitWeightSame"
            )}</span>`
          );
        } else if (delta > 0) {
          parts.push(
            `<span class="tl-weight-delta is-up"><span class="tl-weight-delta-mark" aria-hidden="true">↑</span> ${label(
              "visitWeightIncreased",
              { kg: visits.formatWeightDeltaKg(delta) }
            )}</span>`
          );
        } else {
          parts.push(
            `<span class="tl-weight-delta is-down"><span class="tl-weight-delta-mark" aria-hidden="true">↓</span> ${label(
              "visitWeightDecreased",
              { kg: visits.formatWeightDeltaKg(delta) }
            )}</span>`
          );
        }
      }
      if (!parts.length) return "";
      return `<span class="tl-weight-vs">${parts.join("")}</span>`;
    }

    function buildVisitWeightPartsHtml(visit, visitIndex, previousVisit = null) {
      const weightPanelId = `visit-weight-${visitIndex}`;
      const weightNum = visits.visitWeightKg(visit);
      const weightVs = buildVisitWeightVsHtml(visit, previousVisit);
      const weightHtml =
        weightNum != null
          ? `<span class="tl-weight">${weightVs}<span class="tl-weight-label">${label(
              "visitWeightLabel"
            )}</span> <button
          type="button"
          class="tl-weight-value"
          data-visit-weight-toggle
          aria-expanded="false"
          aria-controls="${weightPanelId}"
          aria-label="${label("visitWeightEditAria", { weight: weightNum })}"
        >${weightNum} kg</button></span>`
          : `<span class="tl-weight">${weightVs}<button
          type="button"
          class="tl-weight-pending"
          data-visit-weight-toggle
          aria-expanded="false"
          aria-controls="${weightPanelId}"
        >${label("visitWeightPending")}</button></span>`;
      const weightPrefill = weightNum != null ? ` value="${weightNum}"` : "";
      const weightEdit = `<form class="tl-weight-edit" id="${weightPanelId}" hidden data-visit-weight-form="${visitIndex}">
          <label class="tl-weight-edit-field">
            <span data-i18n="visitWeightFillLabel">${label("visitWeightFillLabel")}</span>
            <input
              type="number"
              id="visit-weight-input-${visitIndex}"
              name="weightAtVisit"
              step="0.1"
              min="0.1"
              inputmode="decimal"
              placeholder="6.8"
              required${weightPrefill}
            />
          </label>
          <button class="btn btn-primary tl-weight-save" type="submit">${label(
            "visitWeightSave"
          )}</button>
        </form>`;
      return { weightHtml, weightEdit };
    }

    function buildVisitLabsLineHtml(visit) {
      if (typeof hasLinkedLabs !== "function" || !hasLinkedLabs(visit)) return "";
      return `<p class="tl-visit-labs">
      <button type="button" class="tl-visit-labs-btn" data-open-labs>
        ${label("timelineVisitLabs")}
      </button>
    </p>`;
    }

    function buildTimelineMedItemHtml(med, pet, visitIndex, medIndex, sourceTags, drugNotePanels) {
      const sourceKey = med.source || "owner";
      const source = sourceTags[sourceKey] || sourceTags.owner;
      const isPhotoBundle = med.kind === "photo_bundle";
      const isCompound = med.kind === "compound_bundle";
      const completeBtn = isPhotoBundle
        ? `<button type="button" class="med-proof-btn" data-complete-visit="${visitIndex}">${label(
            "medCompleteDrugs"
          )}</button>`
        : "";
      const detailId = `med-detail-${pet.id}-${visitIndex}-${medIndex}`;

      function shellForMed(noteMed, notesId) {
        drugNotePanels.push({ notesId, med: noteMed });
        return buildDrugNotesShellHtml(notesId);
      }

      if (isCompound) {
        const ingredientNames = (med.ingredients || [])
          .map((ing) => ing.name)
          .filter(Boolean);
        const namesLine = ingredientNames.length ? ingredientNames.join("、") : med.name;
        const ingredients = (med.ingredients || [])
          .map((ing, ingIndex) => {
            const notesId = timelineViewHelpers.notesIdForMed({
              petId: pet.id,
              visitIndex,
              medIndex,
              ingredientIndex: ingIndex,
            });
            return `<li class="tl-ingredient">
          <div class="tl-med-name-row">
            <strong>${ing.name}</strong>
            <button
              type="button"
              class="tl-drug-notes-btn"
              data-drug-notes-toggle
              aria-expanded="false"
              aria-controls="${notesId}"
            >${label("timelineDrugNotesBtn")}</button>
          </div>
          <span class="dose">${expandFrequencyInText(ing.dose)}</span>
          ${shellForMed(ing, notesId)}
        </li>`;
          })
          .join("");

        return `
      <li class="tl-med-unit tl-compound ${compoundFormClass(med.compoundForm)}">
        <button
          type="button"
          class="tl-med-summary"
          data-med-detail-toggle
          aria-expanded="false"
          aria-controls="${detailId}"
        >
          <span class="tl-compound-badge ${compoundChipToneClass(med.compoundForm)}"${
            med.compoundColor ? ` style="background:${med.compoundColor}"` : ""
          }>
            <i class="compound-ico compound-ico-${compoundIconKind(
              med.compoundForm
            )}" aria-hidden="true"></i>
            ${compoundFormBadge(med.compoundForm)}
          </span>
          <span class="tl-med-summary-body">
            <span class="tl-med-summary-names">${namesLine}</span>
            <span class="dose">${expandFrequencyInText(med.dose)}</span>
          </span>
          <span class="tl-med-summary-action">${label("timelineMedExpand")}</span>
        </button>
        <div class="tl-med-detail" id="${detailId}" hidden>
          <span class="tag ${source.className}">${source.label}</span>
          <ul class="tl-ingredients">${ingredients}</ul>
          ${
            completeBtn ? `<div class="med-list-actions">${completeBtn}</div>` : ""
          }
        </div>
      </li>`;
      }

      const notesId = timelineViewHelpers.notesIdForMed({
        petId: pet.id,
        visitIndex,
        medIndex,
      });

      if (isPhotoBundle) {
        return `
    <li class="tl-med-unit">
      <div class="tl-med-summary is-static">
        <span class="tl-med-summary-body">
          <strong class="tl-med-summary-names">${med.name}</strong>
          <span class="dose">${expandFrequencyInText(med.dose)}</span>
        </span>
        <span class="tag ${source.className}">${source.label}</span>
      </div>
      ${completeBtn ? `<div class="med-list-actions">${completeBtn}</div>` : ""}
    </li>`;
      }

      return `
    <li class="tl-med-unit">
      <div class="tl-med-summary is-static">
        <span class="tl-med-summary-body">
          <span class="tl-med-name-row">
            <strong class="tl-med-summary-names">${med.name}</strong>
            <button
              type="button"
              class="tl-drug-notes-btn"
              data-drug-notes-toggle
              aria-expanded="false"
              aria-controls="${notesId}"
            >${label("timelineDrugNotesBtn")}</button>
          </span>
          <span class="dose">${expandFrequencyInText(med.dose)}</span>
        </span>
        <span class="tag ${source.className}">${source.label}</span>
      </div>
      ${shellForMed(med, notesId)}
    </li>`;
    }

    function buildVisitRxBlockHtml(
      visit,
      visitIndex,
      previousVisit = null,
      year = "",
      medsHtml = ""
    ) {
      const panelId = `visit-rx-${visitIndex}`;
      const imagingPanelId = `visit-imaging-${visitIndex}`;
      const slots = visits.collectVisitProofPhotos(visit);
      const hasProof = visits.visitHasAnyProof(visit);
      const imagingData = imaging.getVisitImaging(visit);
      const hasImaging = imaging.visitHasImaging(visit);
      const { weightEdit } = buildVisitWeightPartsHtml(visit, visitIndex, previousVisit);
      const medsBlock = medsHtml
        ? `<p class="tl-visit-rx-kicker">${label("timelineVisitRxMedsTitle")}</p>${medsHtml}`
        : "";
      const body = hasProof
        ? `<div class="tl-visit-rx-thumbs">${buildVisitProofThumbsHtml(
            slots,
            visitIndex
          )}</div>
       <button type="button" class="med-proof-btn" data-visit-proof-upload="${visitIndex}">${label(
            "timelineVisitRxUpdate"
          )}</button>`
        : `<p class="tl-visit-rx-empty">${label("timelineVisitRxEmpty")}</p>
       <button type="button" class="med-proof-btn" data-visit-proof-upload="${visitIndex}">${label(
            "timelineVisitRxUpload"
          )}</button>`;
      const imagingBody = hasImaging
        ? `<div class="tl-visit-rx-thumbs">${buildVisitImagingThumbsHtml(
            imagingData,
            visitIndex
          )}</div>
       <button type="button" class="med-proof-btn" data-visit-imaging-upload="${visitIndex}">${label(
            "timelineVisitImagingUpdate"
          )}</button>`
        : `<p class="tl-visit-rx-empty">${label("timelineVisitImagingEmpty")}</p>
       <button type="button" class="med-proof-btn" data-visit-imaging-upload="${visitIndex}">${label(
            "timelineVisitImagingUpload"
          )}</button>`;
      const yearHtml = year ? `<span class="tl-item-year">${year}</span>` : "";

      return `
    <div class="tl-clinic-row">
      <p class="tl-clinic">${visitClinicLabel(visit)}</p>
      <div class="tl-visit-actions">
        <button
          type="button"
          class="tl-drug-notes-btn tl-visit-rx-btn"
          data-visit-rx-toggle
          aria-expanded="false"
          aria-controls="${panelId}"
        >${label("timelineVisitRxBtn")}</button>
        <button
          type="button"
          class="tl-drug-notes-btn tl-visit-imaging-btn"
          data-visit-imaging-toggle
          aria-expanded="false"
          aria-controls="${imagingPanelId}"
        >${label("timelineVisitImagingBtn")}</button>
      </div>
      ${yearHtml}
    </div>
    ${weightEdit}
    ${buildVisitLabsLineHtml(visit)}
    <div class="tl-visit-rx" id="${panelId}" hidden>
      ${medsBlock}
      <p class="tl-visit-rx-kicker">${label("timelineVisitRxTitle")}</p>
      ${body}
    </div>
    <div class="tl-visit-imaging" id="${imagingPanelId}" hidden>
      <p class="tl-visit-rx-kicker">${label("timelineVisitImagingTitle")}</p>
      ${imagingBody}
      <button type="button" class="med-proof-btn" disabled aria-disabled="true">${label(
        "imagingVideoBtn"
      )}</button>
      <p class="tl-visit-imaging-soon">${label("imagingVideoSoon")}</p>
    </div>`;
    }

    function buildTimelineListHtml(pet) {
      const drugNotePanels = [];
      if (!pet?.visits?.length) {
        return {
          html: `<li class="tl-item tl-item-empty"><div class="tl-body"><p class="tl-note">${label(
            "noVisits"
          )}</p></div></li>`,
          drugNotePanels,
        };
      }

      const sourceTags = getSourceTags();
      const entries = timelineSelectors.buildTimelineEntries(pet);
      const html = entries
        .map((entry) => {
          const { visit, visitIndex, previousVisit, year } = entry;
          const tags = (visit.tags || [])
            .map((tag) => `<span class="tl-tag">${visitTagLabel(tag)}</span>`)
            .join("");
          const noteText = locField(visit.note);
          const note = noteText ? `<p class="tl-note">${noteText}</p>` : "";
          const meds = entry.hasRx
            ? `<ul class="med-list">${visit.medications
                .map((med, medIndex) => {
                  if (!med.id) med.id = `m-${pet.id}-${visitIndex}-${medIndex}`;
                  const hasProof = Boolean(med.bagPhoto || med.rxPhoto || med.drugPhoto);
                  if (hasProof && med.source === "owner") {
                    med.source = "owner_proof";
                  }
                  return buildTimelineMedItemHtml(
                    med,
                    pet,
                    visitIndex,
                    medIndex,
                    sourceTags,
                    drugNotePanels
                  );
                })
                .join("")}</ul>`
            : "";
          const { weightHtml } = buildVisitWeightPartsHtml(
            visit,
            visitIndex,
            previousVisit
          );

          return `
        <li class="tl-item" style="--i:${visitIndex}">
          <header class="tl-item-head">
            <time datetime="${visit.date}">${formatShortDate(visit.date)}</time>
            ${weightHtml}
          </header>
          <div class="tl-body">
            ${buildVisitRxBlockHtml(
              visit,
              visitIndex,
              previousVisit,
              year,
              meds
            )}
            <p class="tl-tags">${tags}</p>
            ${note}
          </div>
        </li>`;
        })
        .join("");

      return { html, drugNotePanels };
    }

    function buildVisitRxTogglePresentation(open) {
      const isOpen = Boolean(open);
      return {
        panelHidden: !isOpen,
        ariaExpanded: isOpen ? "true" : "false",
        text: isOpen ? label("timelineVisitRxHide") : label("timelineVisitRxBtn"),
        isOpen,
      };
    }

    function buildVisitImagingTogglePresentation(open) {
      const isOpen = Boolean(open);
      return {
        panelHidden: !isOpen,
        ariaExpanded: isOpen ? "true" : "false",
        text: isOpen
          ? label("timelineVisitImagingHide")
          : label("timelineVisitImagingBtn"),
        isOpen,
      };
    }

    function shouldAutoExpandLatestRx(userCollapsed) {
      return !userCollapsed;
    }

    function shouldHydrateDrugNotesPanel({ hydrated, hasMed } = {}) {
      return Boolean(hasMed) && hydrated !== "true";
    }

    function buildDrugNotesHydrateSlot(model) {
      return {
        className: "tl-drug-notes-body",
        html: buildDrugNotesBodyHtml(model),
      };
    }

    function visitFingerprint(visit, index) {
      const proofs = visit?.proofPhotos || {};
      const imaging = visit?.imaging || {};
      const meds = Array.isArray(visit?.medications) ? visit.medications : [];
      const bag = Array.isArray(proofs.bag) ? proofs.bag.length : 0;
      const rx = Array.isArray(proofs.rx) ? proofs.rx.length : 0;
      const drug = Array.isArray(proofs.drug) ? proofs.drug.length : 0;
      const xray = Array.isArray(imaging.xrayPhotos) ? imaging.xrayPhotos.length : 0;
      const us = Array.isArray(imaging.usPhotos) ? imaging.usPhotos.length : 0;
      const medKey = meds
        .map((med) =>
          [med?.name || "", med?.dose || "", med?.kind || "", med?.compoundGroup || ""].join(
            ":"
          )
        )
        .join("|");
      return [
        index,
        visit?.date || "",
        visit?.clinic || "",
        visit?.note || "",
        visit?.weightAtVisit ?? visit?.weight ?? "",
        medKey,
        bag,
        rx,
        drug,
        xray,
        us,
      ].join("\u001f");
    }

    function buildListSignature(pet, { lang } = {}) {
      const visits = Array.isArray(pet?.visits) ? pet.visits : [];
      return [
        lang || "",
        pet?.id || "",
        String(visits.length),
        visits.map((visit, index) => visitFingerprint(visit, index)).join("\u001e"),
      ].join("\u001d");
    }

    function shouldSkipListRebuild(previousSignature, nextSignature) {
      return Boolean(previousSignature) && previousSignature === nextSignature;
    }

    return {
      buildDrugNotesBodyHtml,
      buildDrugNotesShellHtml,
      buildVisitProofThumbsHtml,
      buildVisitImagingThumbsHtml,
      buildVisitWeightVsHtml,
      buildVisitWeightPartsHtml,
      buildVisitLabsLineHtml,
      buildVisitRxBlockHtml,
      buildTimelineMedItemHtml,
      buildTimelineListHtml,
      buildVisitRxTogglePresentation,
      buildVisitImagingTogglePresentation,
      shouldAutoExpandLatestRx,
      shouldHydrateDrugNotesPanel,
      buildDrugNotesHydrateSlot,
      buildListSignature,
      shouldSkipListRebuild,
    };
  }

  root.domains.timeline.createRenderer = createRenderer;
})(typeof window !== "undefined" ? window : globalThis);
