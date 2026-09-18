(function initObservationChartTryoutWire() {
  "use strict";

  const obs = (window.PetLiveWeb && window.PetLiveWeb.domains && window.PetLiveWeb.domains.observations) || null;
  if (!obs) {
    console.error("[observation-tryout] PetLiveWeb.domains.observations missing — check script order");
    return;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const metricMeta = obs.getDefaultMetricMeta();
  const metrics = obs.createRegistry(metricMeta);
  const viewData = obs.createDemoViewData();
  const visits = obs.getDemoVisits();
  const controller = obs.createController({
    metrics: metrics,
    viewData: viewData,
    visits: visits,
  });
  const renderer = obs.createRenderer({ escapeHtml: escapeHtml });

  const mainSvg = document.getElementById("mainChart");
  const miniSvg = document.getElementById("miniChart");
  const tooltip = document.getElementById("tooltip");
  const chartWrap = document.getElementById("mainChartWrap");
  const emptyState = document.getElementById("emptyState");
  const metricSelect = document.getElementById("metricSelect");
  const secondarySelect = document.getElementById("secondarySelect");
  const diaryMetric = document.getElementById("diaryMetric");
  const diaryVisit = document.getElementById("diaryVisit");
  const diaryIndex = document.getElementById("diaryIndex");
  const diaryValue = document.getElementById("diaryValue");
  const metricCards = document.getElementById("metricCards");
  const chartTitleInput = document.getElementById("chartTitleInput");
  const visitJump = document.getElementById("visitJump");
  const visitJumpLabel = document.getElementById("visitJumpLabel");
  const visitJumpBtn = document.getElementById("visitJumpBtn");
  const emptyAddPointCta = document.getElementById("emptyAddPointCta");
  let activeVisitId = "";

  function paintTitle() {
    const title = controller.resolveTitle();
    document.getElementById("chartTitle").textContent = title;
    if (chartTitleInput && document.activeElement !== chartTitleInput) {
      const state = controller.getState();
      chartTitleInput.value = state.customTitle || "";
      chartTitleInput.placeholder = title;
    }
  }

  function showVisitJump(visitId, label) {
    activeVisitId = visitId || "";
    if (!visitJump) return;
    if (!activeVisitId) {
      visitJump.hidden = true;
      return;
    }
    const visit = controller.findVisit(activeVisitId);
    visitJumpLabel.textContent = label || (visit && visit.label) || activeVisitId;
    visitJump.hidden = false;
  }

  function activateVisitFromChart(eventInfo) {
    const info = eventInfo || {};
    const visitId = info.visitId || "";
    controller.setFocusVisitId(visitId);
    showVisitJump(visitId, info.label);
    if (visitId && typeof obs.postBridgeToParent === "function") {
      obs.postBridgeToParent(window, obs.BRIDGE_ACTIONS.openVisit, {
        visitId: visitId,
        title: controller.resolveTitle(),
      });
    }
  }

  function showTooltip(event, title, value) {
    tooltip.innerHTML = "<strong>" + escapeHtml(title) + "</strong>" + escapeHtml(value);
    tooltip.style.display = "block";
    const rect = chartWrap.getBoundingClientRect();
    const pointX = "clientX" in event ? event.clientX - rect.left : rect.width / 2;
    const pointY = "clientY" in event ? event.clientY - rect.top : 80;
    tooltip.style.left = Math.min(Math.max(pointX + 12, 8), rect.width - 180) + "px";
    tooltip.style.top = Math.max(pointY - 48, 8) + "px";
  }

  function hideTooltip() {
    tooltip.style.display = "none";
  }

  function focusDiaryForm() {
    const form = document.getElementById("diaryForm");
    if (form && typeof form.scrollIntoView === "function") {
      form.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    if (diaryValue) diaryValue.focus();
  }

  function rebuildDiaryIndexSelect() {
    if (!diaryIndex) return;
    const modeData = controller.getModeData();
    const labels = (modeData && modeData.labels) || [];
    const prev = diaryIndex.value;
    diaryIndex.replaceChildren();
    labels.forEach(function (label, index) {
      const opt = document.createElement("option");
      opt.value = String(index);
      opt.textContent = label;
      diaryIndex.appendChild(opt);
    });
    if (prev !== "" && Number(prev) >= 0 && Number(prev) < labels.length) {
      diaryIndex.value = prev;
    } else if (labels.length) {
      diaryIndex.value = "0";
    }
  }

  function rebuildSelects() {
    const state = controller.getState();
    const ids = metrics.listIds();

    function fill(select, selected) {
      select.replaceChildren();
      ids.forEach(function (id) {
        const meta = metrics.get(id);
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = meta ? meta.label : id;
        select.appendChild(opt);
      });
      if (ids.indexOf(selected) >= 0) select.value = selected;
      else if (ids.length) select.value = ids[0];
    }

    fill(metricSelect, state.metric);
    fill(secondarySelect, state.secondary);
    fill(diaryMetric, state.metric);
    controller.setMetric(metricSelect.value);
    controller.setSecondary(secondarySelect.value);
  }

  function rebuildVisitSelect() {
    diaryVisit.replaceChildren();
    visits.forEach(function (visit) {
      const opt = document.createElement("option");
      opt.value = visit.id;
      opt.textContent = visit.label;
      diaryVisit.appendChild(opt);
    });
  }

  function rebuildCards() {
    const state = controller.getState();
    metricCards.replaceChildren();
    metrics.listIds().forEach(function (id) {
      const meta = metrics.get(id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "metric-card";
      btn.setAttribute("data-metric", id);
      btn.setAttribute("aria-current", id === state.metric ? "true" : "false");
      const scaleNote =
        meta.scale === "weight"
          ? "公斤・Y 軸依資料範圍"
          : "0–10 分・" + (id === "sleep" ? "越高越好" : "越高越明顯");
      btn.innerHTML =
        '<span class="metric-color ' +
        escapeHtml(meta.colorClass || "") +
        '"></span>' +
        "<div><strong>" +
        escapeHtml(meta.label) +
        "</strong><span>" +
        escapeHtml(scaleNote) +
        "</span></div>";
      btn.addEventListener("click", function () {
        controller.setMetric(id);
        metricSelect.value = id;
        if (diaryMetric) diaryMetric.value = id;
        renderAll();
      });
      metricCards.appendChild(btn);
    });
  }

  function syncSecondaryOptions() {
    const state = controller.getState();
    Array.prototype.forEach.call(secondarySelect.options, function (option) {
      option.disabled = option.value === state.metric;
    });
    const next = controller.ensureSecondaryDistinct();
    if (secondarySelect.value !== next) secondarySelect.value = next;
  }

  function paintSummary(summary) {
    document.getElementById("latestValue").textContent = summary.latestText;
    document.getElementById("latestNote").textContent = summary.latestNote;
    document.getElementById("changeValue").textContent = summary.changeText;
    document.getElementById("completionValue").textContent = summary.completionText;
  }

  function renderMainChart() {
    const state = controller.getState();
    const modeData = controller.getModeData();
    const meta = metrics.get(state.metric);
    const series = controller.getSeries(state.metric);
    const empty = obs.isEmptySeries(series);

    emptyState.setAttribute("data-show", empty ? "true" : "false");
    chartWrap.setAttribute("data-empty", empty ? "true" : "false");
    paintTitle();
    document.getElementById("chartSubtitle").textContent =
      (meta.direction || "") + "。在側欄記分數後，圖上的日記點與折線會更新。";
    document.getElementById("previousLegend").hidden = !state.compare;

    if (empty) {
      paintSummary(
        obs.computePeriodSummary([], modeData.labels, meta, metrics.formatValue)
      );
      mainSvg.replaceChildren();
      return;
    }

    renderer.renderMain(mainSvg, {
      labels: modeData.labels,
      modeLabel: modeData.label,
      events: modeData.events,
      series: series,
      meta: meta,
      compare: state.compare,
      formatValue: metrics.formatValue,
      onShowTooltip: showTooltip,
      onHideTooltip: hideTooltip,
      onEventActivate: activateVisitFromChart,
    });

    paintSummary(
      obs.computePeriodSummary(series.current, modeData.labels, meta, metrics.formatValue)
    );
  }

  function renderMiniChart() {
    const state = controller.getState();
    const modeData = controller.getModeData();
    const meta = metrics.get(state.secondary);
    const series = controller.getSeries(state.secondary);
    renderer.renderMini(miniSvg, {
      labels: modeData.labels,
      series: series,
      meta: meta,
    });
  }

  function renderAll() {
    rebuildCards();
    rebuildDiaryIndexSelect();
    syncSecondaryOptions();
    renderMainChart();
    renderMiniChart();
  }

  function addCustomMetric() {
    const input = document.getElementById("customMetricName");
    const raw = (input.value || "").trim();
    if (!raw) {
      input.focus();
      return;
    }
    if (raw.length > 24) return;
    const id = controller.addCustomMetric(raw);
    if (!id) return;
    input.value = "";
    rebuildSelects();
    metricSelect.value = id;
    diaryMetric.value = id;
    renderAll();
    focusDiaryForm();
  }

  document.querySelectorAll(".segment").forEach(function (button) {
    button.addEventListener("click", function () {
      controller.setMode(button.dataset.mode);
      document.querySelectorAll(".segment").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === button));
      });
      renderAll();
    });
  });

  metricSelect.addEventListener("change", function (event) {
    controller.setMetric(event.target.value);
    if (diaryMetric) diaryMetric.value = event.target.value;
    renderAll();
  });

  secondarySelect.addEventListener("change", function (event) {
    controller.setSecondary(event.target.value);
    renderMiniChart();
  });

  document.getElementById("compareToggle").addEventListener("change", function (event) {
    controller.setCompare(event.target.checked);
    renderMainChart();
  });

  document.getElementById("addMetricBtn").addEventListener("click", addCustomMetric);
  document.getElementById("customMetricName").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomMetric();
    }
  });

  if (emptyAddPointCta) {
    emptyAddPointCta.addEventListener("click", function () {
      focusDiaryForm();
    });
  }

  document.getElementById("diaryForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const feedback = document.getElementById("diaryFeedback");
    const metricId = diaryMetric.value;
    const meta = metrics.get(metricId);
    const noteText = (document.getElementById("diaryNote").value || "").trim();
    const visitId = diaryVisit.value;
    const visitLabel = visits.find(function (v) {
      return v.id === visitId;
    });
    const rawValue = diaryValue ? diaryValue.value : "";
    const value = Number(rawValue);
    const index = diaryIndex ? Number(diaryIndex.value) : NaN;
    const modeData = controller.getModeData();
    const labelCount = modeData && Array.isArray(modeData.labels) ? modeData.labels.length : 0;
    const indexOk = Number.isInteger(index) && index >= 0 && index < labelCount;

    if (!Number.isFinite(value) || value < 0 || value > 10) {
      feedback.textContent = "請輸入 0–10 的分數。";
      feedback.style.color = "#b45309";
      if (diaryValue) diaryValue.focus();
      return;
    }
    if (!indexOk) {
      feedback.textContent = "請選擇有效的時間點。";
      feedback.style.color = "#b45309";
      if (diaryIndex) diaryIndex.focus();
      return;
    }

    controller.addDiaryPoint({
      metricId: metricId,
      value: value,
      index: index,
      visitId: visitId || null,
      text: noteText,
    });

    controller.setMetric(metricId);
    metricSelect.value = metricId;
    renderAll();

    const bucketLabel =
      modeData && modeData.labels && modeData.labels[index] != null
        ? modeData.labels[index]
        : String(index);
    feedback.style.color = "#146d65";
    feedback.textContent =
      "已寫上圖表：「" +
      (meta ? meta.label : metricId) +
      "」" +
      value +
      "（" +
      bucketLabel +
      "）" +
      (visitId ? "・已連結 " + (visitLabel ? visitLabel.label : visitId) : "") +
      "（記憶體暫存，重整後消失）";
    if (diaryValue) diaryValue.value = "";
    document.getElementById("diaryNote").value = "";
  });

  if (chartTitleInput) {
    chartTitleInput.addEventListener("input", function () {
      controller.setCustomTitle(chartTitleInput.value);
      paintTitle();
    });
  }

  if (visitJumpBtn) {
    visitJumpBtn.addEventListener("click", function () {
      if (!activeVisitId) return;
      obs.postBridgeToParent(window, obs.BRIDGE_ACTIONS.openVisit, {
        visitId: activeVisitId,
        title: controller.resolveTitle(),
      });
    });
  }

  window.addEventListener("message", function (event) {
    const msg = obs.parseBridgeMessage(event && event.data);
    if (!msg) return;
    if (msg.action === obs.BRIDGE_ACTIONS.focusVisit) {
      controller.setFocusVisitId(msg.visitId || "");
      showVisitJump(msg.visitId, msg.title || msg.visitId);
      if (msg.title) {
        controller.setCustomTitle(msg.title);
        paintTitle();
      }
    }
  });

  rebuildVisitSelect();
  rebuildSelects();
  document.getElementById("compareToggle").checked = controller.getState().compare;
  renderAll();
})();
