(function initObservationChartTryoutWire() {
  "use strict";

  const obs = (window.PetLiveWeb && window.PetLiveWeb.domains && window.PetLiveWeb.domains.observations) || null;
  if (!obs) {
    console.error("[observation-tryout] PetLiveWeb.domains.observations missing — check script order");
    return;
  }

  /** Tryout-only storage (not production petlive-* passport keys). */
  const TRYOUT_STORE_KEY = "petlive-obs-tryout-store";
  const TRYOUT_STORE_VERSION = 1;

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function defaultPets() {
    return {
      "pet-a": { id: "pet-a", name: "試用寵物 A", observations: obs.emptyObservations() },
      "pet-b": { id: "pet-b", name: "試用寵物 B", observations: obs.emptyObservations() },
    };
  }

  function readTryoutStore() {
    try {
      const raw = window.localStorage.getItem(TRYOUT_STORE_KEY);
      if (!raw) {
        return { version: TRYOUT_STORE_VERSION, activePetId: "pet-a", pets: defaultPets() };
      }
      const parsed = JSON.parse(raw);
      const pets = parsed && parsed.pets && typeof parsed.pets === "object" ? parsed.pets : defaultPets();
      Object.keys(defaultPets()).forEach(function (id) {
        if (!pets[id]) pets[id] = defaultPets()[id];
        if (!pets[id].observations) pets[id].observations = obs.emptyObservations();
      });
      const activePetId =
        parsed && pets[parsed.activePetId] ? parsed.activePetId : Object.keys(pets)[0] || "pet-a";
      return { version: TRYOUT_STORE_VERSION, activePetId: activePetId, pets: pets };
    } catch (_err) {
      return { version: TRYOUT_STORE_VERSION, activePetId: "pet-a", pets: defaultPets() };
    }
  }

  function writeTryoutStore(store) {
    try {
      window.localStorage.setItem(
        TRYOUT_STORE_KEY,
        JSON.stringify({
          version: TRYOUT_STORE_VERSION,
          activePetId: store.activePetId,
          pets: store.pets,
        })
      );
      return true;
    } catch (_err) {
      return false;
    }
  }

  let demoMode = false;
  let usedDemoSeedOverlay = false;
  let store = readTryoutStore();

  function getActivePet() {
    return store.pets[store.activePetId] || null;
  }

  function buildRuntimeForPet(pet) {
    const empty = !pet || obs.isObservationsEmpty(pet.observations);
    let metrics;
    let viewData;
    let notes = [];
    let ui = {};
    let projects = [];
    let activeProjectId = "";
    let projectAxes = {};

    if (!empty) {
      const hydrated = obs.hydrateObservations(pet.observations);
      metrics = obs.createRegistry(hydrated.metrics);
      viewData = hydrated.viewData;
      notes = hydrated.notes;
      ui = hydrated.ui;
      projects = hydrated.projects || [];
      activeProjectId = hydrated.activeProjectId || "";
      projectAxes = hydrated.projectAxes || {};
      usedDemoSeedOverlay = false;
    } else {
      const metricMeta = obs.getDefaultMetricMeta();
      metrics = obs.createRegistry(metricMeta);
      viewData = obs.createDemoViewData();
      notes = [];
      ui = { mode: "week", metric: "headache", secondary: "sleep", compare: true };
      usedDemoSeedOverlay = true;
    }

    const ctrl = obs.createController({
      metrics: metrics,
      viewData: viewData,
      visits: obs.getDemoVisits(),
      notes: notes,
      ui: ui,
      projects: projects,
      activeProjectId: activeProjectId,
      projectAxes: projectAxes,
      isDemoMode: function () {
        return demoMode;
      },
    });

    if (usedDemoSeedOverlay || !ctrl.getProjects().length) {
      ctrl.seedDemoProjects();
    }
    return ctrl;
  }

  let controller = buildRuntimeForPet(getActivePet());
  let metrics = controller.metrics;
  let visits = controller.getVisits();
  const renderer = obs.createRenderer({ escapeHtml: escapeHtml });

  const mainSvg = document.getElementById("mainChart");
  const tooltip = document.getElementById("tooltip");
  const chartWrap = document.getElementById("mainChartWrap");
  const emptyState = document.getElementById("emptyState");
  const emptyStateCopy = document.getElementById("emptyStateCopy");
  const metricSelect = document.getElementById("metricSelect");
  const diaryMetric = document.getElementById("diaryMetric");
  const diaryVisit = document.getElementById("diaryVisit");
  const diaryIndex = document.getElementById("diaryIndex");
  const diaryValue = document.getElementById("diaryValue");
  const metricCards = document.getElementById("metricCards");
  const visitJump = document.getElementById("visitJump");
  const visitJumpLabel = document.getElementById("visitJumpLabel");
  const visitJumpBtn = document.getElementById("visitJumpBtn");
  const emptyAddPointCta = document.getElementById("emptyAddPointCta");
  const emptyCreateProjectCta = document.getElementById("emptyCreateProjectCta");
  const petSelect = document.getElementById("tryoutPetSelect");
  const persistStatus = document.getElementById("persistStatus");
  const demoModeToggle = document.getElementById("demoModeToggle");
  const clearPersistBtn = document.getElementById("clearPersistBtn");
  const chartToolbar = document.getElementById("chartToolbar");
  const compareControl = document.getElementById("compareControl");
  const boundMetricLabel = document.getElementById("boundMetricLabel");
  const projectMenuBtn = document.getElementById("projectMenuBtn");
  const projectMenu = document.getElementById("projectMenu");
  const projectSheet = document.getElementById("projectSheet");
  const projectSheetTitle = document.getElementById("projectSheetTitle");
  const projectSheetBody = document.getElementById("projectSheetBody");
  const projectSheetActions = document.getElementById("projectSheetActions");
  let activeVisitId = "";
  let sheetMode = "";

  function setPersistStatus(text, ok) {
    if (!persistStatus) return;
    persistStatus.textContent = text || "";
    persistStatus.style.color = ok === false ? "#b45309" : "#146d65";
  }

  function persistActivePet(reason) {
    const pet = getActivePet();
    if (!pet) {
      setPersistStatus("沒有作用中寵物", false);
      return false;
    }
    const ok = controller.flushToPet(pet, { isDemoMode: demoMode });
    if (!ok) {
      setPersistStatus(
        demoMode ? "示範模式：未寫入試用儲存（I1）" : "寫入失敗",
        false
      );
      return false;
    }
    usedDemoSeedOverlay = false;
    store.pets[pet.id] = pet;
    writeTryoutStore(store);
    setPersistStatus(
      "已存入試用儲存（" +
        (reason || "更新") +
        "）・重整後會還原・鍵名 " +
        TRYOUT_STORE_KEY,
      true
    );
    return true;
  }

  function setMenuOpen(open) {
    if (!projectMenu || !projectMenuBtn) return;
    projectMenu.setAttribute("data-open", open ? "true" : "false");
    projectMenuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeSheet() {
    if (!projectSheet) return;
    projectSheet.setAttribute("data-open", "false");
    projectSheet.hidden = true;
    sheetMode = "";
  }

  function openSheet(title) {
    if (!projectSheet) return;
    projectSheetTitle.textContent = title;
    projectSheet.hidden = false;
    projectSheet.setAttribute("data-open", "true");
    setMenuOpen(false);
  }

  function paintTitle() {
    const project = controller.getActiveProject();
    const titleEl = document.getElementById("chartTitle");
    if (!project) {
      titleEl.textContent = "新建專案";
      return;
    }
    titleEl.textContent = controller.resolveTitle();
  }

  function paintKindChrome() {
    const project = controller.getActiveProject();
    const hideMode = controller.hidesModeToolbar();
    const hideCompare = controller.hidesCompare();
    if (chartToolbar) {
      chartToolbar.setAttribute("data-kind", project ? project.kind : "");
    }
    const segmented = document.getElementById("modeSegmented");
    if (segmented) {
      segmented.hidden = hideMode;
      segmented.setAttribute("aria-hidden", hideMode ? "true" : "false");
    }
    if (compareControl) {
      compareControl.hidden = hideCompare;
    }
    const meta = metrics.get(controller.getState().metric);
    if (boundMetricLabel) {
      boundMetricLabel.textContent = meta ? meta.label : "—";
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
      if (!select) return;
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
    fill(diaryMetric, state.metric);
  }

  function rebuildVisitSelect() {
    if (!diaryVisit) return;
    diaryVisit.replaceChildren();
    visits.forEach(function (visit) {
      const opt = document.createElement("option");
      opt.value = visit.id;
      opt.textContent = visit.label;
      diaryVisit.appendChild(opt);
    });
  }

  function rebuildPetSelect() {
    if (!petSelect) return;
    petSelect.replaceChildren();
    Object.keys(store.pets).forEach(function (id) {
      const pet = store.pets[id];
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = (pet && pet.name) || id;
      petSelect.appendChild(opt);
    });
    petSelect.value = store.activePetId;
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
      const color = document.createElement("span");
      color.className = "metric-color " + (meta.colorClass || "");
      const textWrap = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = meta.label || id;
      const span = document.createElement("span");
      span.textContent = scaleNote;
      textWrap.appendChild(strong);
      textWrap.appendChild(span);
      btn.appendChild(color);
      btn.appendChild(textWrap);
      btn.addEventListener("click", function () {
        /* P1: metric is bound to project; cards are reference only. */
        focusDiaryForm();
      });
      metricCards.appendChild(btn);
    });
  }

  function renderMainChart() {
    const project = controller.getActiveProject();
    const state = controller.getState();
    paintTitle();
    paintKindChrome();

    if (!project) {
      emptyState.setAttribute("data-show", "true");
      chartWrap.setAttribute("data-empty", "true");
      if (emptyStateCopy) emptyStateCopy.textContent = "尚未有專案。新建一個專案開始觀察。";
      if (emptyAddPointCta) emptyAddPointCta.hidden = true;
      if (emptyCreateProjectCta) emptyCreateProjectCta.hidden = false;
      mainSvg.replaceChildren();
      document.getElementById("chartSubtitle").textContent = "用標題旁選單新建專案。";
      return;
    }

    if (emptyCreateProjectCta) emptyCreateProjectCta.hidden = true;
    if (emptyAddPointCta) emptyAddPointCta.hidden = false;
    if (emptyStateCopy) {
      emptyStateCopy.textContent = "此指標尚無觀察點。記第一筆分數後，折線就會出現。";
    }

    const modeData = controller.getModeData();
    const meta = metrics.get(state.metric);
    if (!meta || !modeData) {
      emptyState.setAttribute("data-show", "true");
      chartWrap.setAttribute("data-empty", "true");
      mainSvg.replaceChildren();
      return;
    }
    const series = controller.getSeries(state.metric);
    const empty = obs.isEmptySeries(series);

    emptyState.setAttribute("data-show", empty ? "true" : "false");
    chartWrap.setAttribute("data-empty", empty ? "true" : "false");
    document.getElementById("chartSubtitle").textContent =
      (meta.direction || "") +
      (obs.isVisitLinkedKind(project.kind)
        ? "。X 軸為串接的就診日期。"
        : "。在側欄記分數後，圖上的日記點與折線會更新。");
    const previousLegend = document.getElementById("previousLegend");
    if (previousLegend) previousLegend.hidden = !state.compare || controller.hidesCompare();

    if (empty) {
      mainSvg.replaceChildren();
      return;
    }

    renderer.renderMain(mainSvg, {
      labels: modeData.labels,
      modeLabel: modeData.label,
      events: modeData.events,
      series: series,
      meta: meta,
      compare: state.compare && !controller.hidesCompare(),
      formatValue: metrics.formatValue,
      onShowTooltip: showTooltip,
      onHideTooltip: hideTooltip,
      onEventActivate: activateVisitFromChart,
    });
  }

  function renderAll() {
    rebuildCards();
    rebuildSelects();
    rebuildDiaryIndexSelect();
    renderMainChart();
  }

  function switchPet(petId) {
    if (!store.pets[petId]) return;
    store.activePetId = petId;
    writeTryoutStore(store);
    controller = buildRuntimeForPet(getActivePet());
    metrics = controller.metrics;
    visits = controller.getVisits();
    rebuildPetSelect();
    rebuildVisitSelect();
    const compareToggle = document.getElementById("compareToggle");
    if (compareToggle) compareToggle.checked = controller.getState().compare;
    renderAll();
    setPersistStatus(
      usedDemoSeedOverlay
        ? "已切換寵物・示範專案僅記憶體（未寫入直到你編輯／記分）"
        : "已切換寵物並還原該寵物的 observations",
      true
    );
  }

  function collectVisitChecks(rootEl) {
    const ids = [];
    rootEl.querySelectorAll('input[type="checkbox"][data-visit-id]').forEach(function (box) {
      if (box.checked) ids.push(box.getAttribute("data-visit-id"));
    });
    return ids;
  }

  function buildVisitCheckList(selectedIds) {
    const wrap = document.createElement("div");
    wrap.className = "visit-check-list";
    const selected = {};
    (selectedIds || []).forEach(function (id) {
      selected[id] = true;
    });
    visits.forEach(function (visit) {
      if (!visit.id) return;
      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.setAttribute("data-visit-id", visit.id);
      box.checked = !!selected[visit.id];
      const text = document.createElement("span");
      text.textContent = visit.label;
      label.appendChild(box);
      label.appendChild(text);
      wrap.appendChild(label);
    });
    return wrap;
  }

  function openSelectSheet() {
    sheetMode = "select";
    openSheet("選擇專案");
    projectSheetBody.replaceChildren();
    projectSheetActions.replaceChildren();
    const list = document.createElement("div");
    list.className = "project-pick-list";
    const active = controller.getActiveProject();
    controller.getProjects().forEach(function (project) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = project.name;
      btn.setAttribute("aria-current", active && active.id === project.id ? "true" : "false");
      btn.addEventListener("click", function () {
        controller.setActiveProject(project.id);
        closeSheet();
        renderAll();
      });
      list.appendChild(btn);
    });
    if (!controller.getProjects().length) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "尚無專案。請新建。";
      projectSheetBody.appendChild(empty);
    } else {
      projectSheetBody.appendChild(list);
    }
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn secondary";
    cancel.textContent = "關閉";
    cancel.addEventListener("click", closeSheet);
    projectSheetActions.appendChild(cancel);
  }

  function openCreateSheet() {
    sheetMode = "create";
    openSheet("新建專案");
    projectSheetBody.replaceChildren();
    projectSheetActions.replaceChildren();

    const nameField = document.createElement("div");
    nameField.className = "field";
    const nameLabel = document.createElement("label");
    nameLabel.setAttribute("for", "projectNameInput");
    nameLabel.textContent = "專案名稱（必填）";
    const nameInput = document.createElement("input");
    nameInput.id = "projectNameInput";
    nameInput.type = "text";
    nameInput.maxLength = 32;
    nameInput.placeholder = "例如：9月腸胃觀察";
    nameInput.autocomplete = "off";
    nameField.appendChild(nameLabel);
    nameField.appendChild(nameInput);

    const kindWrap = document.createElement("div");
    kindWrap.className = "kind-pick";
    kindWrap.setAttribute("role", "radiogroup");
    kindWrap.setAttribute("aria-label", "專案類型");

    function kindOption(value, title, desc, selected) {
      const label = document.createElement("label");
      label.setAttribute("data-selected", selected ? "true" : "false");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "projectKind";
      radio.value = value;
      radio.checked = !!selected;
      const text = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = title;
      const span = document.createElement("span");
      span.textContent = desc;
      text.appendChild(strong);
      text.appendChild(span);
      label.appendChild(radio);
      label.appendChild(text);
      radio.addEventListener("change", function () {
        kindWrap.querySelectorAll("label").forEach(function (el) {
          el.setAttribute("data-selected", "false");
        });
        label.setAttribute("data-selected", "true");
        visitBlock.hidden = value !== "visit-linked";
        metricBlock.hidden = value !== "self-metric";
      });
      kindWrap.appendChild(label);
    }

    kindOption("visit-linked", "A · 串接就診日期", "X 軸用就診日；隱藏日／週／月／年", true);
    kindOption("self-metric", "B · 自主觀察指標", "自訂 0–10 指標；保留時間尺度", false);

    const visitBlock = document.createElement("div");
    visitBlock.className = "field";
    const visitLabel = document.createElement("span");
    visitLabel.className = "chart-title-edit-label";
    visitLabel.textContent = "選擇就診（至少一筆）";
    visitBlock.appendChild(visitLabel);
    visitBlock.appendChild(buildVisitCheckList(["v-2025-09-01"]));

    const metricBlock = document.createElement("div");
    metricBlock.className = "field";
    metricBlock.hidden = true;
    const metricLabel = document.createElement("label");
    metricLabel.setAttribute("for", "projectMetricName");
    metricLabel.textContent = "指標名稱（0–10）";
    const metricInput = document.createElement("input");
    metricInput.id = "projectMetricName";
    metricInput.type = "text";
    metricInput.maxLength = 24;
    metricInput.placeholder = "例如：疲勞程度";
    metricBlock.appendChild(metricLabel);
    metricBlock.appendChild(metricInput);

    const err = document.createElement("p");
    err.className = "hint";
    err.style.color = "#b45309";
    err.style.minHeight = "1.2em";

    projectSheetBody.appendChild(nameField);
    projectSheetBody.appendChild(kindWrap);
    projectSheetBody.appendChild(visitBlock);
    projectSheetBody.appendChild(metricBlock);
    projectSheetBody.appendChild(err);

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn secondary";
    cancel.textContent = "取消";
    cancel.addEventListener("click", closeSheet);

    const save = document.createElement("button");
    save.type = "button";
    save.className = "btn";
    save.textContent = "建立";
    save.addEventListener("click", function () {
      const name = (nameInput.value || "").trim();
      if (!name) {
        err.textContent = "請填專案名稱。";
        nameInput.focus();
        return;
      }
      const kindRadio = kindWrap.querySelector('input[name="projectKind"]:checked');
      const kind = kindRadio ? kindRadio.value : "";
      if (kind === "visit-linked") {
        const visitIds = collectVisitChecks(visitBlock);
        if (!visitIds.length) {
          err.textContent = "請至少勾選一筆就診。";
          return;
        }
        const project = controller.createProject({
          name: name,
          kind: "visit-linked",
          visitIds: visitIds,
          metricId: controller.getState().metric || "headache",
        });
        if (!project) {
          err.textContent = "建立失敗，請檢查名稱與就診。";
          return;
        }
      } else if (kind === "self-metric") {
        const metricName = (metricInput.value || "").trim() || name;
        const project = controller.createProject({
          name: name,
          kind: "self-metric",
          metricName: metricName,
        });
        if (!project) {
          err.textContent = "建立失敗（指標名稱需 1–24 字）。";
          return;
        }
      } else {
        err.textContent = "請選擇專案類型。";
        return;
      }
      persistActivePet("新建專案");
      closeSheet();
      renderAll();
      focusDiaryForm();
    });

    projectSheetActions.appendChild(cancel);
    projectSheetActions.appendChild(save);
    nameInput.focus();
  }

  function openEditSheet() {
    const project = controller.getActiveProject();
    if (!project) {
      openCreateSheet();
      return;
    }
    sheetMode = "edit";
    openSheet("編輯專案");
    projectSheetBody.replaceChildren();
    projectSheetActions.replaceChildren();

    const nameField = document.createElement("div");
    nameField.className = "field";
    const nameLabel = document.createElement("label");
    nameLabel.setAttribute("for", "projectEditName");
    nameLabel.textContent = "專案名稱";
    const nameInput = document.createElement("input");
    nameInput.id = "projectEditName";
    nameInput.type = "text";
    nameInput.maxLength = 32;
    nameInput.value = project.name;
    nameField.appendChild(nameLabel);
    nameField.appendChild(nameInput);

    const kindNote = document.createElement("p");
    kindNote.className = "hint";
    kindNote.textContent =
      "類型：" +
      (obs.isVisitLinkedKind(project.kind) ? "就診串接（鎖定）" : "自主指標（鎖定）");

    let visitBlock = null;
    if (obs.isVisitLinkedKind(project.kind)) {
      visitBlock = document.createElement("div");
      visitBlock.className = "field";
      const visitLabel = document.createElement("span");
      visitLabel.className = "chart-title-edit-label";
      visitLabel.textContent = "串接就診";
      visitBlock.appendChild(visitLabel);
      visitBlock.appendChild(buildVisitCheckList(project.visitIds));
    }

    const err = document.createElement("p");
    err.className = "hint";
    err.style.color = "#b45309";

    projectSheetBody.appendChild(nameField);
    projectSheetBody.appendChild(kindNote);
    if (visitBlock) projectSheetBody.appendChild(visitBlock);
    projectSheetBody.appendChild(err);

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn secondary";
    cancel.textContent = "取消";
    cancel.addEventListener("click", closeSheet);

    const save = document.createElement("button");
    save.type = "button";
    save.className = "btn";
    save.textContent = "儲存";
    save.addEventListener("click", function () {
      const renamed = controller.renameProject(project.id, nameInput.value);
      if (!renamed) {
        err.textContent = "名稱不可空白（最多 32 字）。";
        return;
      }
      if (visitBlock) {
        const visitIds = collectVisitChecks(visitBlock);
        if (!visitIds.length) {
          err.textContent = "請至少勾選一筆就診。";
          return;
        }
        controller.relinkProjectVisits(project.id, visitIds);
      }
      persistActivePet("編輯專案");
      closeSheet();
      renderAll();
    });

    projectSheetActions.appendChild(cancel);
    projectSheetActions.appendChild(save);
    nameInput.focus();
  }

  function confirmDeleteProject() {
    const project = controller.getActiveProject();
    if (!project) return;
    const ok = window.confirm(
      "刪除專案「" + project.name + "」？此專案的分數／備註會一併移除，就診紀錄不會刪除。"
    );
    if (!ok) return;
    controller.deleteProject(project.id);
    persistActivePet("刪除專案");
    setMenuOpen(false);
    renderAll();
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
    persistActivePet("新增指標");
    rebuildSelects();
    renderAll();
  }

  if (projectMenuBtn) {
    projectMenuBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      const open = projectMenu.getAttribute("data-open") === "true";
      setMenuOpen(!open);
    });
  }

  if (projectMenu) {
    projectMenu.addEventListener("click", function (event) {
      const btn = event.target.closest("[data-project-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-project-action");
      if (action === "select") openSelectSheet();
      else if (action === "create") openCreateSheet();
      else if (action === "edit") openEditSheet();
      else if (action === "delete") confirmDeleteProject();
    });
  }

  document.addEventListener("click", function (event) {
    if (!projectMenu || projectMenu.getAttribute("data-open") !== "true") return;
    if (projectMenu.contains(event.target) || (projectMenuBtn && projectMenuBtn.contains(event.target))) {
      return;
    }
    setMenuOpen(false);
  });

  if (projectSheet) {
    projectSheet.addEventListener("click", function (event) {
      if (event.target === projectSheet) closeSheet();
    });
  }

  if (emptyCreateProjectCta) {
    emptyCreateProjectCta.addEventListener("click", openCreateSheet);
  }

  document.querySelectorAll(".segment").forEach(function (button) {
    button.addEventListener("click", function () {
      if (controller.hidesModeToolbar()) return;
      controller.setMode(button.dataset.mode);
      document.querySelectorAll(".segment").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === button));
      });
      renderAll();
    });
  });

  if (metricSelect) {
    metricSelect.addEventListener("change", function (event) {
      controller.setMetric(event.target.value);
      if (diaryMetric) diaryMetric.value = event.target.value;
      renderAll();
    });
  }

  const compareToggle = document.getElementById("compareToggle");
  if (compareToggle) {
    compareToggle.addEventListener("change", function (event) {
      controller.setCompare(event.target.checked);
      renderMainChart();
    });
  }

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

  if (petSelect) {
    petSelect.addEventListener("change", function (event) {
      switchPet(event.target.value);
    });
  }

  if (demoModeToggle) {
    demoModeToggle.addEventListener("change", function (event) {
      demoMode = !!event.target.checked;
      setPersistStatus(
        demoMode ? "示範模式開啟：新增／記分不會寫入試用儲存" : "示範模式關閉：可寫入試用儲存",
        !demoMode
      );
    });
  }

  if (clearPersistBtn) {
    clearPersistBtn.addEventListener("click", function () {
      store = { version: TRYOUT_STORE_VERSION, activePetId: "pet-a", pets: defaultPets() };
      writeTryoutStore(store);
      switchPet("pet-a");
      setPersistStatus("已清除試用儲存，兩隻寵物 observations 皆空", true);
    });
  }

  document.getElementById("diaryForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const feedback = document.getElementById("diaryFeedback");
    if (!controller.getActiveProject()) {
      feedback.textContent = "請先新建或選擇專案。";
      feedback.style.color = "#b45309";
      openCreateSheet();
      return;
    }
    const metricId = diaryMetric.value || controller.getState().metric;
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
    const saved = persistActivePet("記一筆觀察");
    renderAll();

    const bucketLabel =
      modeData && modeData.labels && modeData.labels[index] != null
        ? modeData.labels[index]
        : String(index);
    feedback.style.color = saved ? "#146d65" : "#b45309";
    feedback.textContent =
      "已寫上圖表：「" +
      (meta ? meta.label : metricId) +
      "」" +
      value +
      "（" +
      bucketLabel +
      "）" +
      (visitId ? "・已連結 " + (visitLabel ? visitLabel.label : visitId) : "") +
      (saved ? "・已存入試用儲存（重整可還原）" : "・示範模式未持久化");
    if (diaryValue) diaryValue.value = "";
    document.getElementById("diaryNote").value = "";
  });

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
    }
  });

  rebuildPetSelect();
  rebuildVisitSelect();
  rebuildSelects();
  if (compareToggle) compareToggle.checked = controller.getState().compare;
  renderAll();
  setPersistStatus(
    usedDemoSeedOverlay
      ? "首次／空寵物：示範專案僅記憶體。編輯／記分後寫入 " + TRYOUT_STORE_KEY
      : "已從試用儲存還原 observations 並自動畫圖",
    true
  );
})();
