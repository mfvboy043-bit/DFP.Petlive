(function initPetLiveWebShellObservationWire(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  let startedApi = null;

  function initObservationChartWire(opts) {
  if (startedApi) return startedApi;

  const input = opts || {};
  const hostHooks = input.hooks && typeof input.hooks === "object" ? input.hooks : {};

  const obs = (root.domains && root.domains.observations) || null;
  if (!obs) {
    console.error("[observation-tryout] PetLiveWeb.domains.observations missing — check script order");
    return null;
  }

  const petPickerShell =
    (root.shell && root.shell.tryoutPetPicker) || null;
  if (!petPickerShell) {
    console.error("[observation-tryout] PetLiveWeb.shell.tryoutPetPicker missing — check script order");
    return null;
  }

  /** Tryout-only storage (not production petlive-* passport keys). */
  const TRYOUT_STORE_KEY = "petlive-obs-tryout-store";
  const TRYOUT_STORE_VERSION = 3;
  const embedded = (function detectPassportEmbed() {
    if (input.embedded != null) return !!input.embedded;
    try {
      return !!(
        global.parent &&
        global.parent !== global &&
        global.parent.PetLiveWeb &&
        global.parent.PetLiveWeb.shell
      );
    } catch (_err) {
      return false;
    }
  })();

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function defaultPets() {
    return petPickerShell.defaultTryoutPets(obs.emptyObservations);
  }

  function emptyEmbeddedStore() {
    return { version: TRYOUT_STORE_VERSION, activePetId: "", pets: {} };
  }

  function freshTryoutStore() {
    return {
      version: TRYOUT_STORE_VERSION,
      activePetId: "p1",
      pets: defaultPets(),
    };
  }

  function readTryoutStore() {
    try {
      const raw = window.localStorage.getItem(TRYOUT_STORE_KEY);
      if (!raw) return freshTryoutStore();
      const parsed = JSON.parse(raw);
      if (!parsed || Number(parsed.version) < TRYOUT_STORE_VERSION) {
        return freshTryoutStore();
      }
      const migrated = petPickerShell.migrateTryoutStore(parsed, obs.emptyObservations);
      migrated.version = TRYOUT_STORE_VERSION;
      return migrated;
    } catch (_err) {
      return freshTryoutStore();
    }
  }

  function writeTryoutStore(nextStore) {
    if (embedded) return false;
    try {
      window.localStorage.setItem(
        TRYOUT_STORE_KEY,
        JSON.stringify({
          version: TRYOUT_STORE_VERSION,
          activePetId: nextStore.activePetId,
          pets: nextStore.pets,
        })
      );
      return true;
    } catch (_err) {
      return false;
    }
  }

  let demoMode = false;
  let usedDemoSeedOverlay = false;
  /** True after saved obs or user create project / metric / diary — legend may use metric names. */
  let chartLegendNamed = false;
  let store = embedded ? emptyEmbeddedStore() : readTryoutStore();
  let awaitingParentSync = embedded;

  function getActivePet() {
    return store.pets[store.activePetId] || null;
  }

  function visitsForPet(pet) {
    if (typeof obs.observationVisitsForPet === "function") {
      return obs.observationVisitsForPet(pet);
    }
    return [];
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
      metrics = obs.createRegistry({});
      viewData = typeof obs.createEmptyViewData === "function" ? obs.createEmptyViewData([]) : {};
      notes = [];
      ui = { mode: "week", metric: "", secondary: "", compare: false };
      usedDemoSeedOverlay = true;
    }

    return obs.createController({
      metrics: metrics,
      viewData: viewData,
      visits: visitsForPet(pet),
      notes: notes,
      ui: ui,
      projects: projects,
      activeProjectId: activeProjectId,
      projectAxes: projectAxes,
      isDemoMode: function () {
        return demoMode;
      },
    });
  }

  let controller = buildRuntimeForPet(getActivePet());
  let metrics = controller.metrics;
  let visits = controller.getVisits();
  const renderer = obs.createRenderer({ escapeHtml: escapeHtml });

  const mainSvg = document.getElementById("mainChart");
  const metricSelect = document.getElementById("metricSelect");
  const visitJumpBtn = document.getElementById("visitJumpBtn");
  const petSelect = document.getElementById("tryoutPetSelect");
  const persistStatus = document.getElementById("persistStatus");
  const demoModeToggle = document.getElementById("demoModeToggle");
  const clearPersistBtn = document.getElementById("clearPersistBtn");
  const simulateCloudRoundtripBtn = document.getElementById("simulateCloudRoundtripBtn");
  let activeVisitId = "";
  if (
    !root.shell.createObservationChrome ||
    !root.shell.createObservationSheets
  ) {
    console.error("[obs-wire] missing shell observation chrome/sheets");
    return null;
  }
  const chrome = root.shell.createObservationChrome(document);
  const sheets = root.shell.createObservationSheets(document, chrome, obs);

  function setPersistStatus(text, ok) {
    if (!persistStatus) return;
    persistStatus.textContent = text || "";
    persistStatus.style.color = ok === false ? "#b45309" : "#146d65";
  }

  function paintEmbedChrome() {
    const label = document.querySelector('label[for="tryoutPetSelect"]');
    const bar = document.querySelector(".persist-bar");
    if (!embedded) return;
    if (label) label.textContent = "寵物";
    if (bar) bar.setAttribute("aria-label", "寵物");
    if (clearPersistBtn) clearPersistBtn.hidden = true;
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
        demoMode
          ? embedded
            ? "示範模式：未寫入護照寵物（I1）"
            : "示範模式：未寫入試用儲存（I1）"
          : "寫入失敗",
        false
      );
      return false;
    }
    usedDemoSeedOverlay = false;
    store.pets[pet.id] = pet;
    if (embedded) {
      if (typeof hostHooks.saveObservations === "function") {
        hostHooks.saveObservations(pet.id, pet.observations);
      } else if (typeof obs.postBridgeToParent === "function") {
        obs.postBridgeToParent(global, obs.BRIDGE_ACTIONS.flushObservations, {
          petId: pet.id,
          observations: pet.observations,
        });
      }
      setPersistStatus(
        "已寫入護照寵物（" + (reason || "更新") + "）・正式寵物 observations",
        true
      );
      return true;
    }
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

  function closeSheet() {
    chrome.closeSheet();
  }

  const projectNameInput = chrome.els.projectNameInput;

  function paintTitle() {
    const project = controller.getActiveProject();
    const isVisitLinked = !!(project && obs.isVisitLinkedKind(project.kind));
    chrome.paintTitle({
      hasProject: !!project,
      isVisitLinked: isVisitLinked,
      title: project ? controller.resolveTitle() : "",
    });
    if (typeof chrome.paintMetricFocus !== "function") return;
    const rows =
      !isVisitLinked && typeof controller.listSelfMetricBoardRows === "function"
        ? controller.listSelfMetricBoardRows()
        : [];
    const overview = !!(controller.getState() && controller.getState().overview);
    chrome.paintMetricFocus({
      hidden: !rows.length,
      overview: overview,
      showOverview: rows.length >= 2,
      chips: rows.map(function (row) {
        return {
          metricId: row.metricId,
          name: row.name,
          active: !overview && !!row.active,
        };
      }),
    });
  }

  function commitProjectNameFromInput() {
    if (!projectNameInput || projectNameInput.disabled) return;
    const project = controller.getActiveProject();
    if (!project) return;
    const next = projectNameInput.value.trim();
    if (!next) {
      paintTitle();
      return;
    }
    if (next === controller.resolveTitle()) return;
    const renamed = controller.renameProject(project.id, next);
    if (!renamed) {
      paintTitle();
      return;
    }
    markChartLegendNamed();
    paintTitle();
    persistActivePet("重新命名專案");
    renderAll();
  }

  function syncChartLegendNamedFromRuntime() {
    chartLegendNamed = !usedDemoSeedOverlay;
  }

  function markChartLegendNamed() {
    chartLegendNamed = true;
  }

  function paintLegend(meta, tracks) {
    const project = controller.getActiveProject();
    chrome.paintLegend({
      project: project,
      meta: meta,
      tracks: tracks,
      isSelfMetric: !!(project && obs.isSelfMetricKind(project.kind)),
    });
  }

  function formatLinkedVisitLabel(project) {
    if (typeof obs.formatLinkedVisitLabel === "function") {
      return obs.formatLinkedVisitLabel(project, function (id) {
        return controller.findVisit(id);
      });
    }
    return "";
  }

  function paintKindChrome() {
    const project = controller.getActiveProject();
    let boundText = "—";
    const isVisitLinked = !!(project && obs.isVisitLinkedKind(project.kind));
    if (isVisitLinked) {
      boundText = formatLinkedVisitLabel(project) || "—";
    } else if (project) {
      const meta = metrics.get(controller.getState().metric);
      boundText = (meta && meta.label) || project.name || "—";
    }
    chrome.paintKindChrome({
      kind: project ? project.kind : "",
      hideMode: controller.hidesModeToolbar(),
      isVisitLinked: isVisitLinked,
      boundText: boundText,
    });
  }

  function paintMetricBoard() {
    const rows =
      typeof controller.listSelfMetricBoardRows === "function"
        ? controller.listSelfMetricBoardRows()
        : [];
    chrome.paintMetricBoard(rows);
    chrome.paintBoardPetNote(currentPetName());
  }

  function showVisitJump(visitId, label) {
    activeVisitId = visitId || "";
    if (!activeVisitId) {
      chrome.paintVisitJump({ hidden: true });
      return;
    }
    const visit = controller.findVisit(activeVisitId);
    chrome.paintVisitJump({
      hidden: false,
      label: label || (visit && visit.label) || activeVisitId,
    });
  }

  function activateVisitFromChart(eventInfo) {
    const info = eventInfo || {};
    const visitId = info.visitId || "";
    controller.setFocusVisitId(visitId);
    showVisitJump(visitId, info.label);
    if (visitId) {
      const payload = {
        visitId: visitId,
        title: controller.resolveTitle(),
      };
      if (typeof hostHooks.onOpenVisit === "function") {
        hostHooks.onOpenVisit(payload);
      } else if (typeof obs.postBridgeToParent === "function") {
        obs.postBridgeToParent(global, obs.BRIDGE_ACTIONS.openVisit, payload);
      }
    }
  }

  function showTooltip(event, title, value) {
    chrome.showTooltip(event, title, value, escapeHtml);
  }

  function hideTooltip() {
    chrome.hideTooltip();
  }

  function rebuildSelects() {
    const state = controller.getState();
    chrome.fillMetricSelect(
      metricSelect,
      metrics.listIds(),
      function (id) {
        const meta = metrics.get(id);
        return meta ? meta.label : id;
      },
      state.metric
    );
  }

  function rebuildVisitSelect() {}

  function listStorePets() {
    const known = (petPickerShell.DEMO_PET_ORDER || []).filter(function (id) {
      return store.pets[id];
    });
    const extra = Object.keys(store.pets).filter(function (id) {
      return known.indexOf(id) === -1;
    });
    return known.concat(extra).map(function (id) {
      const pet = store.pets[id];
      return {
        id: id,
        name: (pet && pet.name) || id,
      };
    });
  }

  function rebuildPetSelect() {
    if (!petSelect) return;
    petSelect.replaceChildren();
    listStorePets().forEach(function (entry) {
      const opt = document.createElement("option");
      opt.value = entry.id;
      opt.textContent = entry.name;
      petSelect.appendChild(opt);
    });
    if (store.activePetId && store.pets[store.activePetId]) {
      petSelect.value = store.activePetId;
    }
  }

  function hydrateFromStore(statusText) {
    const pet = getActivePet();
    if (!pet) {
      controller = buildRuntimeForPet(null);
      metrics = controller.metrics;
      visits = controller.getVisits();
      rebuildPetSelect();
      rebuildVisitSelect();
      renderAll();
      setPersistStatus(statusText || "等待護照同步寵物…", true);
      return;
    }
    controller = buildRuntimeForPet(pet);
    metrics = controller.metrics;
    visits = controller.getVisits();
    rebuildPetSelect();
    rebuildVisitSelect();
    syncChartLegendNamedFromRuntime();
    renderAll();
    if (statusText) setPersistStatus(statusText, true);
  }

  function applySyncPetsMessage(msg) {
    const normalized =
      typeof obs.normalizeSyncPetsPayload === "function"
        ? obs.normalizeSyncPetsPayload(msg)
        : { pets: (msg && msg.pets) || [], activePetId: (msg && msg.activePetId) || "" };
    const nextPets = {};
    (normalized.pets || []).forEach(function (entry) {
      if (!entry || !entry.id) return;
      const profile = petPickerShell.enrichPetForPicker(entry);
      nextPets[entry.id] = {
        id: entry.id,
        name: profile.name,
        species: profile.species,
        tone: profile.tone,
        observations:
          entry.observations && typeof entry.observations === "object"
            ? entry.observations
            : obs.emptyObservations(),
        visits: Array.isArray(entry.visits) ? entry.visits : [],
      };
    });
    store = {
      version: TRYOUT_STORE_VERSION,
      activePetId: normalized.activePetId || "",
      pets: nextPets,
    };
    awaitingParentSync = false;
    hydrateFromStore("已同步護照寵物");
    if (usedDemoSeedOverlay) {
      setPersistStatus("已同步護照寵物・尚無觀察資料（空白）", true);
    } else if (getActivePet()) {
      setPersistStatus("已同步護照寵物並還原 observations", true);
    } else {
      setPersistStatus("護照尚未提供寵物", false);
    }
  }

  function renderMainChart() {
    const project = controller.getActiveProject();
    const state = controller.getState();
    paintTitle();
    paintKindChrome();

    if (!project) {
      paintLegend(null);
      chrome.paintChartFrame({
        showEmpty: true,
        emptyWrap: true,
        copy: "尚未有專案。用 ⋯ 選擇就診或專案，或到下方新增指標。",
        ctaHidden: false,
        subtitle: "",
      });
      mainSvg.replaceChildren();
      return;
    }

    chrome.paintChartFrame({
      ctaHidden: true,
      copy: "此專案尚無觀察點。",
    });

    const modeData = controller.getModeData();
    const meta = metrics.get(state.metric);
    if (!meta || !modeData) {
      paintLegend(null);
      chrome.paintChartFrame({ showEmpty: true, emptyWrap: true });
      mainSvg.replaceChildren();
      return;
    }

    const tracks =
      typeof controller.listChartTracks === "function" ? controller.listChartTracks() : [];
    paintLegend(meta, tracks);
    const series = controller.getSeries(state.metric);
    const drawable = tracks.filter(function (track) {
      return track && !track.empty;
    });
    const overview = !!(state.overview || (controller.getState() && controller.getState().overview));
    const empty = overview
      ? !drawable.length
      : !drawable.length && obs.isEmptySeries(series);
    const dayNeedsTime =
      !overview &&
      state.mode === "day" &&
      empty &&
      obs.isSelfMetricKind(project.kind) &&
      ["week", "month", "year"].some(function (mode) {
        const other = controller.getSeries(state.metric, mode);
        return other && !obs.isEmptySeries(other);
      });
    chrome.paintChartFrame({
      showEmpty: empty,
      emptyWrap: empty,
      copy: empty
        ? overview
          ? "點下方「一起看」，選要放上圖的指標。"
          : dayNeedsTime
            ? "這幾筆只記了日期，沒有幾點。切到每週可以看。"
            : "此專案尚無觀察點。"
        : undefined,
      subtitle: String(project.caption || "").trim(),
    });
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
      tracks: drawable,
      compare: false,
      useMetricSeriesLabels: obs.isSelfMetricKind(project.kind),
      formatValue: metrics.formatValue,
      onShowTooltip: showTooltip,
      onHideTooltip: hideTooltip,
      onEventActivate: activateVisitFromChart,
    });
  }

  function renderAll() {
    rebuildSelects();
    if (typeof chrome.paintModeToolbar === "function") {
      chrome.paintModeToolbar(controller.getState().mode);
    }
    renderMainChart();
    paintMetricBoard();
  }

  function refreshOpenPetSheet() {
    if (typeof chrome.isSheetOpen !== "function" || !chrome.isSheetOpen()) return;
    const kind = chrome.getSheetKind();
    if (kind === "select") openSelectSheet();
    else if (kind === "pick") openPickProjectSheet();
  }

  function switchPet(petId) {
    if (!store.pets[petId]) return;
    store.activePetId = petId;
    if (embedded) {
      if (typeof hostHooks.setActivePet === "function") {
        hostHooks.setActivePet(petId);
      } else if (typeof obs.postBridgeToParent === "function") {
        obs.postBridgeToParent(global, obs.BRIDGE_ACTIONS.setActivePet, {
          petId: petId,
        });
      }
      hydrateFromStore(
        usedDemoSeedOverlay
          ? "已切換護照寵物・尚無觀察資料"
          : "已切換護照寵物並還原該寵物的 observations"
      );
      refreshOpenPetSheet();
      return;
    }
    writeTryoutStore(store);
    hydrateFromStore(
      usedDemoSeedOverlay
        ? "已切換寵物・空白圖表。用 ⋯ 新建專案開始。"
        : "已切換寵物並還原該寵物的 observations"
    );
    refreshOpenPetSheet();
  }

  function findVisitLinkedProject(visitId) {
    const id = String(visitId || "");
    if (!id) return null;
    const list = controller.getProjects();
    for (let i = 0; i < list.length; i += 1) {
      const project = list[i];
      if (!obs.isVisitLinkedKind(project.kind)) continue;
      if ((project.visitIds || []).indexOf(id) >= 0) return project;
    }
    return null;
  }

  function selectVisitAsProject(visit) {
    if (!visit || !visit.id) return false;
    const existing = findVisitLinkedProject(visit.id);
    if (existing) {
      controller.setActiveProject(existing.id);
      closeSheet();
      renderAll();
      return true;
    }
    openNameVisitProjectSheet(visit);
    return true;
  }

  function petSheetContext() {
    const active = controller.getActiveProject();
    return {
      petName: currentPetName(),
      pets: listStorePets(),
      activePetId: store.activePetId,
      visits: visits,
      activeProjectId: active ? active.id : "",
    };
  }

  function openNameVisitProjectSheet(visit) {
    if (!visit || !visit.id) return;
    sheets.openNameVisit({
      visit: visit,
      visitLabel:
        typeof obs.visitProjectName === "function"
          ? obs.visitProjectName(visit)
          : visit.label || visit.id,
      onBack: openSelectSheet,
      onCreate: function (payload) {
        const project = controller.createProject({
          name: payload.name,
          kind: "visit-linked",
          visitIds: [payload.visitId],
          metricName: "就診觀察",
          caption: payload.caption,
        });
        if (!project) return { error: "建立失敗（名稱需 1–32 字）。" };
        markChartLegendNamed();
        persistActivePet("選擇就診");
        closeSheet();
        renderAll();
        if (typeof chrome.startTitleEdit === "function") chrome.startTitleEdit();
        return { ok: true };
      },
    });
  }

  function currentPetName() {
    const pet = getActivePet();
    return (pet && pet.name) || "未選寵物";
  }

  function openSelectSheet() {
    const ctx = petSheetContext();
    sheets.openSelectVisit({
      petName: ctx.petName,
      pets: ctx.pets,
      activePetId: ctx.activePetId,
      visits: ctx.visits,
      activeProjectId: ctx.activeProjectId,
      findLinked: findVisitLinkedProject,
      onSwitch: function (petId) {
        switchPet(petId);
      },
      onPickVisit: selectVisitAsProject,
    });
  }

  function openPickProjectSheet() {
    const ctx = petSheetContext();
    sheets.openPickProject({
      petName: ctx.petName,
      pets: ctx.pets,
      activePetId: ctx.activePetId,
      activeProjectId: ctx.activeProjectId,
      projects: typeof controller.getProjects === "function" ? controller.getProjects() : [],
      formatLinked: formatLinkedVisitLabel,
      onSwitch: function (petId) {
        switchPet(petId);
      },
      onPickProject: activateBoardProject,
    });
  }

  function usedMetricColors() {
    return (typeof metrics.listIds === "function" ? metrics.listIds() : []).map(function (id) {
      const meta = metrics.get(id);
      return meta && meta.color;
    });
  }

  function openCreateSheet() {
    sheets.openCreateMetric({
      defaultColor:
        typeof obs.pickDefaultLineColor === "function"
          ? obs.pickDefaultLineColor(usedMetricColors())
          : obs.LINE_COLOR_DEFAULT || "#1487bd",
      onCreate: function (payload) {
        const project = controller.createProject({
          name: payload.name,
          kind: "self-metric",
          metricName: payload.name,
          metricUnit: payload.unit,
          metricScale: payload.scale,
          metricColor: payload.color,
          caption: payload.caption,
        });
        if (!project) return { error: "建立失敗（名稱需 1–24 字）。" };
        markChartLegendNamed();
        persistActivePet("新建觀察");
        closeSheet();
        renderAll();
        return { ok: true };
      },
    });
  }

  function openLogSheet(projectId, metricId) {
    const rows =
      typeof controller.listSelfMetricBoardRows === "function"
        ? controller.listSelfMetricBoardRows()
        : [];
    const wantedMetric = String(metricId || "");
    const row =
      rows.find(function (item) {
        return wantedMetric && item.metricId === wantedMetric;
      }) ||
      rows.find(function (item) {
        return item.projectId === projectId && item.active;
      }) ||
      rows.find(function (item) {
        return item.projectId === projectId;
      });
    if (!row) return;
    sheets.openLog({
      row: row,
      defaultDate:
        typeof obs.suggestLogDateISO === "function"
          ? obs.suggestLogDateISO()
          : new Date().toISOString().slice(0, 10),
      defaultTime:
        typeof obs.suggestLogTimeHM === "function" ? obs.suggestLogTimeHM() : "12:00",
      onSave: function (payload) {
        const activated = controller.setActiveProject(row.projectId);
        if (!activated) return { error: "找不到這個指標。" };
        if (row.metricId && typeof controller.setFocusMetric === "function") {
          controller.setFocusMetric(row.metricId);
        }
        if (
          payload.unit &&
          typeof controller.updateSelfMetricProject === "function"
        ) {
          const updated = controller.updateSelfMetricProject(row.projectId, {
            metricId: row.metricId,
            metricName: row.name,
            metricUnit: payload.unit,
            metricScale: payload.scale,
          });
          if (!updated) return { error: "單位儲存失敗。" };
        }
        const at =
          typeof obs.logDateToAtISO === "function"
            ? obs.logDateToAtISO(payload.isoDate, payload.timeOn ? payload.timeHM : null)
            : null;
        controller.addDiaryPoint({
          metricId: row.metricId,
          value: payload.value,
          isoDate: payload.isoDate,
          timeHM: payload.timeOn ? payload.timeHM : "",
          mode: controller.getState().mode || "week",
          text: payload.text,
          at: at || undefined,
        });
        if (typeof controller.alignModeToAvailableData === "function") {
          controller.alignModeToAvailableData();
        }
        markChartLegendNamed();
        persistActivePet("記一筆觀察");
        closeSheet();
        renderAll();
        return { ok: true };
      },
    });
  }

  function toggleOverlayMetric(metricId) {
    if (!metricId || typeof controller.toggleOverlayMetric !== "function") return;
    controller.toggleOverlayMetric(metricId);
    persistActivePet("疊圖比較");
    renderAll();
  }

  function openOverviewBoard() {
    if (typeof controller.setOverview !== "function") return;
    controller.setOverview(true);
    persistActivePet("觀察總版");
    renderAll();
    if (typeof chrome.scrollToMetricBoard === "function") chrome.scrollToMetricBoard();
  }

  function focusBoardMetric(metricId) {
    if (!metricId || typeof controller.setFocusMetric !== "function") return;
    controller.setFocusMetric(metricId);
    if (typeof controller.alignModeToAvailableData === "function") {
      controller.alignModeToAvailableData();
    }
    markChartLegendNamed();
    renderAll();
  }

  function activateBoardProject(projectId, metricId) {
    if (controller.getState() && controller.getState().overview && metricId) {
      toggleOverlayMetric(metricId);
      return;
    }
    if (!projectId) return;
    const project = controller.setActiveProject(projectId);
    if (!project) return;
    if (metricId && typeof controller.setFocusMetric === "function") {
      controller.setFocusMetric(metricId);
    }
    if (typeof controller.alignModeToAvailableData === "function") {
      controller.alignModeToAvailableData();
    }
    markChartLegendNamed();
    closeSheet();
    renderAll();
  }

  function findProjectById(projectId) {
    const id = String(projectId || "");
    if (!id) return null;
    const list = controller.getProjects();
    for (let i = 0; i < list.length; i += 1) {
      if (String(list[i].id) === id) return list[i];
    }
    return null;
  }

  function openEditSheet(projectId, metricId) {
    let project = null;
    if (projectId) {
      project = controller.setActiveProject(projectId) || findProjectById(projectId);
    } else {
      project = controller.getActiveProject();
    }
    if (!project) {
      openCreateSheet();
      return;
    }
    if (obs.isSelfMetricKind(project.kind)) {
      const focusId = String(metricId || project.focusMetricId || project.metricId || "");
      if (focusId && typeof controller.setFocusMetric === "function") {
        controller.setFocusMetric(focusId);
      }
      const meta = focusId ? metrics.get(focusId) : null;
      sheets.openEditSelfMetric({
        project: project,
        meta: meta,
        onSave: function (payload) {
          const updated =
            typeof controller.updateSelfMetricProject === "function"
              ? controller.updateSelfMetricProject(project.id, {
                  metricId: focusId,
                  metricName: payload.name,
                  caption: payload.caption,
                  metricUnit: payload.unit,
                  metricScale: payload.scale,
                  metricColor: payload.color,
                })
              : null;
          if (!updated) return { error: "儲存失敗（名稱需 1–24 字）。" };
          markChartLegendNamed();
          persistActivePet("編輯指標");
          closeSheet();
          renderAll();
          return { ok: true };
        },
      });
      return;
    }
    sheets.openEditVisitProject({
      project: project,
      visits: visits,
      onSave: function (payload) {
        const renamed = controller.renameProject(project.id, payload.name);
        if (!renamed) return { error: "名稱不可空白（最多 32 字）。" };
        if (!payload.visitIds.length) return { error: "請至少勾選一筆就診。" };
        controller.relinkProjectVisits(project.id, payload.visitIds);
        if (typeof controller.setProjectCaption === "function") {
          controller.setProjectCaption(project.id, payload.caption);
        }
        markChartLegendNamed();
        persistActivePet("編輯專案");
        closeSheet();
        renderAll();
        return { ok: true };
      },
    });
  }

  function confirmDeleteProject(projectId, metricId) {
    const project = projectId ? findProjectById(projectId) : controller.getActiveProject();
    if (!project) return;
    const isSelfMetric = obs.isSelfMetricKind(project.kind);
    const key = String(metricId || "");
    if (isSelfMetric && key && typeof controller.deleteMetric === "function") {
      const meta = metrics.get(key);
      const label = (meta && meta.label) || "指標";
      const ok = window.confirm("刪除指標「" + label + "」？此指標的分數／備註會一併移除。專案會保留。");
      if (!ok) return;
      controller.deleteMetric(project.id, key);
      persistActivePet("刪除指標");
      chrome.setMenuOpen(false);
      renderAll();
      return;
    }
    const ok = window.confirm(
      "刪除專案「" + project.name + "」？此專案的分數／備註會一併移除，就診紀錄不會刪除。"
    );
    if (!ok) return;
    controller.deleteProject(project.id);
    persistActivePet("刪除專案");
    chrome.setMenuOpen(false);
    renderAll();
  }

  chrome.bind({
    onSelectVisit: openSelectSheet,
    onPickProject: openPickProjectSheet,
    onCreateMetric: openCreateSheet,
    onLog: openLogSheet,
    onEdit: openEditSheet,
    onDelete: confirmDeleteProject,
    onActivate: activateBoardProject,
    onToggleOverlay: toggleOverlayMetric,
    onFocusMetric: focusBoardMetric,
    onOverview: openOverviewBoard,
    onCommitTitle: commitProjectNameFromInput,
    onCancelTitle: paintTitle,
  });

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
      renderAll();
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
        demoMode
          ? embedded
            ? "示範模式開啟：新增／記分不會寫入護照寵物"
            : "示範模式開啟：新增／記分不會寫入試用儲存"
          : embedded
            ? "示範模式關閉：可寫入護照寵物"
            : "示範模式關閉：可寫入試用儲存",
        !demoMode
      );
    });
  }

  if (clearPersistBtn) {
    clearPersistBtn.addEventListener("click", function () {
      if (embedded) return;
      chartLegendNamed = false;
      store = { version: TRYOUT_STORE_VERSION, activePetId: "p1", pets: defaultPets() };
      writeTryoutStore(store);
      switchPet("p1");
      setPersistStatus("已清除試用儲存，三隻寵物 observations 皆空", true);
    });
  }

  /**
   * Phase B Q1: simulate passport Drive backup path (strip → payload → clear → apply).
   * Not a real Drive upload. Uses observations.cloud-roundtrip strip parity.
   */
  function simulateCloudRoundtrip() {
    if (typeof obs.buildSimulatedCloudPayload !== "function") {
      setPersistStatus("缺少 cloud-roundtrip 模組", false);
      return;
    }
    if (demoMode) {
      setPersistStatus("示範模式：不執行雲端往返模擬（I1）", false);
      return;
    }

    const active = getActivePet();
    if (!active) {
      setPersistStatus("沒有作用中寵物", false);
      return;
    }
    if (!persistActivePet("雲端模擬前 flush")) {
      setPersistStatus("flush 失敗，無法模擬備份", false);
      return;
    }

    const petsList = Object.keys(store.pets).map(function (id) {
      return store.pets[id];
    });
    const payload = obs.buildSimulatedCloudPayload(petsList, {
      currentPetId: store.activePetId,
      localRevision: 1,
    });
    const check = obs.assertObservationsInPayload(payload);
    if (!check.ok) {
      setPersistStatus(
        "模擬 payload 沒有 observations（請先新建專案／記分再試）",
        false
      );
      return;
    }

    /* Clear tryout memory (simulates empty device before Drive restore). */
    const emptyPets = defaultPets();
    store = {
      version: TRYOUT_STORE_VERSION,
      activePetId: payload.currentPetId || "p1",
      pets: emptyPets,
    };
    writeTryoutStore(store);

    /* Apply payload pets back (parity with applyCloudPayload replacing pets graph). */
    (payload.pets || []).forEach(function (cloudPet) {
      if (!cloudPet || !cloudPet.id) return;
      const prior = emptyPets[cloudPet.id] || petPickerShell.enrichPetForPicker(cloudPet);
      const priorName = prior.name || cloudPet.name || cloudPet.id;
      store.pets[cloudPet.id] = {
        id: cloudPet.id,
        name: priorName,
        species: prior.species,
        tone: prior.tone,
        observations: cloudPet.observations
          ? obs.normalizeObservations(cloudPet.observations)
          : obs.emptyObservations(),
      };
    });
    if (payload.currentPetId && store.pets[payload.currentPetId]) {
      store.activePetId = payload.currentPetId;
    }
    writeTryoutStore(store);

    controller = buildRuntimeForPet(getActivePet());
    metrics = controller.metrics;
    visits = controller.getVisits();
    if (typeof obs.onPetsGraphApplied === "function") {
      obs.onPetsGraphApplied(getActivePet(), controller);
    }
    rebuildPetSelect();
    rebuildVisitSelect();
    renderAll();
    setPersistStatus(
      "已模擬 Drive 備份往返（strip＋套用）・非真實上傳・還原 " +
        check.count +
        " 隻寵物的 observations",
      true
    );
  }

  if (simulateCloudRoundtripBtn) {
    simulateCloudRoundtripBtn.addEventListener("click", simulateCloudRoundtrip);
  }

  if (visitJumpBtn) {
    visitJumpBtn.addEventListener("click", function () {
      if (!activeVisitId) return;
      const payload = {
        visitId: activeVisitId,
        title: controller.resolveTitle(),
      };
      if (typeof hostHooks.onOpenVisit === "function") {
        hostHooks.onOpenVisit(payload);
      } else if (typeof obs.postBridgeToParent === "function") {
        obs.postBridgeToParent(global, obs.BRIDGE_ACTIONS.openVisit, payload);
      }
    });
  }

  const inPageHost = typeof hostHooks.saveObservations === "function" || typeof hostHooks.getPets === "function";
  if (!inPageHost) {
    global.addEventListener("message", function (event) {
      const msg = obs.parseBridgeMessage(event && event.data);
      if (!msg) return;
      if (msg.action === obs.BRIDGE_ACTIONS.syncPets) {
        applySyncPetsMessage(msg);
        return;
      }
      if (msg.action === obs.BRIDGE_ACTIONS.setActivePet) {
        if (msg.petId && store.pets[msg.petId]) {
          store.activePetId = msg.petId;
          hydrateFromStore("護照已切換作用中寵物");
        }
        return;
      }
      if (msg.action === obs.BRIDGE_ACTIONS.focusVisit) {
        controller.setFocusVisitId(msg.visitId || "");
        showVisitJump(msg.visitId, msg.title || msg.visitId);
      }
    });
  }

  paintEmbedChrome();
  rebuildPetSelect();
  rebuildVisitSelect();
  rebuildSelects();
  syncChartLegendNamedFromRuntime();
  renderAll();
  if (embedded) {
    setPersistStatus(
      awaitingParentSync ? "等待護照同步寵物清單…" : "已就緒（護照寵物）",
      true
    );
  } else {
    setPersistStatus(
      usedDemoSeedOverlay
        ? "純淨試用：空白圖表。用標題旁 ⋯ 新建專案開始。"
        : "已從試用儲存還原 observations 並自動畫圖",
      true
    );
  }

  startedApi = {
    syncPetsFromHost: applySyncPetsMessage,
    focusVisit: function (payload) {
      const info = payload || {};
      controller.setFocusVisitId(info.visitId || "");
      showVisitJump(info.visitId, info.title || info.visitId);
    },
  };
  return startedApi;
  }

  root.shell.initObservationChartWire = initObservationChartWire;

  if (document.body && document.body.getAttribute("data-obs-standalone") === "true") {
    const host = document.getElementById("obs-workspace-host");
    if (host && root.shell.mountObservationWorkspace) {
      root.shell.mountObservationWorkspace(host, { embedded: false });
    }
    initObservationChartWire({ embedded: false });
  }
})(typeof window !== "undefined" ? window : globalThis);
