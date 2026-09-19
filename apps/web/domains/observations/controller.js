(function initPetLiveWebObservationsController(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  const obs = root.domains.observations;

  function createController(deps) {
    const input = deps || {};
    const metrics = input.metrics;
    const viewData = input.viewData || {};
    const visits = Array.isArray(input.visits) ? input.visits : [];
    let diaryNotes = Array.isArray(input.notes) ? input.notes.slice() : [];
    const projectAxes = input.projectAxes && typeof input.projectAxes === "object" ? input.projectAxes : {};
    const isDemoMode =
      typeof input.isDemoMode === "function"
        ? input.isDemoMode
        : function () {
            return !!input.isDemoMode;
          };

    if (!metrics || typeof metrics.listIds !== "function") {
      throw new TypeError("createController requires metrics registry");
    }
    if (typeof obs.createProjectStore !== "function") {
      throw new TypeError("createController requires observations.projects helpers");
    }

    const projects = input.projectStore || obs.createProjectStore({
      projects: input.projects,
      activeProjectId: input.activeProjectId,
    });

    const state = {
      mode: "week",
      metric: "headache",
      secondary: "sleep",
      compare: true,
      customCount: typeof metrics.getCustomCount === "function" ? metrics.getCustomCount() : 0,
      customTitle: "",
      focusVisitId: "",
      overlayMetricIds: [],
      overview: false,
    };

    function applyUi(ui) {
      const next = ui && typeof ui === "object" ? ui : {};
      if (next.mode && viewData[next.mode]) state.mode = next.mode;
      if (next.metric && metrics.get(next.metric)) state.metric = next.metric;
      if (next.secondary && metrics.get(next.secondary)) state.secondary = next.secondary;
      if (next.compare != null) state.compare = !!next.compare;
      if (next.customTitle != null) {
        state.customTitle = obs.normalizeCustomTitle
          ? obs.normalizeCustomTitle(next.customTitle)
          : String(next.customTitle || "").trim().slice(0, 48);
      }
      if (next.focusVisitId != null) state.focusVisitId = String(next.focusVisitId || "");
      if (next.customCount != null) {
        state.customCount = Math.max(0, Number(next.customCount) || 0);
        if (typeof metrics.setCustomCount === "function") {
          metrics.setCustomCount(state.customCount);
        }
      }
      if (next.activeProjectId) projects.setActive(next.activeProjectId);
      if (Array.isArray(next.overlayMetricIds)) {
        state.overlayMetricIds = next.overlayMetricIds
          .map(function (id) {
            return String(id || "");
          })
          .filter(function (id) {
            return id && metrics.get(id);
          })
          .slice(0, 8);
      }
      if (next.overview != null) state.overview = !!next.overview;
    }

    function sanitizeOverlayIds() {
      const project = projects.getActive();
      const allowed = notebookMetricIds(project);
      const seen = {};
      const overview = !!state.overview;
      if (project && obs.isVisitLinkedKind(project.kind)) state.overview = false;
      state.overlayMetricIds = (state.overlayMetricIds || []).filter(function (id) {
        const key = String(id || "");
        if (!key || seen[key] || !metrics.get(key)) return false;
        if (!overview && key === state.metric) return false;
        if (allowed.length && allowed.indexOf(key) < 0) return false;
        seen[key] = true;
        return true;
      }).slice(0, 8);
      return state.overlayMetricIds;
    }

    if (input.ui) applyUi(input.ui);

    const ids = metrics.listIds();
    if (ids.indexOf(state.metric) < 0 && ids.length) state.metric = ids[0];
    if (ids.indexOf(state.secondary) < 0) {
      state.secondary =
        ids.find(function (id) {
          return id !== state.metric;
        }) ||
        ids[0] ||
        "";
    }
    if (!ids.length) {
      state.metric = "";
      state.secondary = "";
    }

    function cloneAxis(axis) {
      if (!axis || typeof axis !== "object") return null;
      const out = {
        label: axis.label || "就診",
        labels: Array.isArray(axis.labels) ? axis.labels.slice() : [],
        events: Array.isArray(axis.events)
          ? axis.events.map(function (ev) {
              return Object.assign({}, ev);
            })
          : [],
      };
      Object.keys(axis).forEach(function (key) {
        if (key === "label" || key === "labels" || key === "events" || key === "visitIds") return;
        const series = axis[key];
        if (series && typeof series === "object" && Array.isArray(series.current)) {
          out[key] = {
            current: series.current.slice(),
            previous: Array.isArray(series.previous) ? series.previous.slice() : series.current.map(function () { return null; }),
            sources: Array.isArray(series.sources) ? series.sources.slice() : series.current.map(function () { return null; }),
          };
        }
      });
      return out;
    }

    function ensureVisitAxis(project) {
      if (!project || !obs.isVisitLinkedKind(project.kind)) return null;
      const existing = projectAxes[project.id];
      const axisMeta = obs.buildVisitAxis(visits, project.visitIds);
      const metricId = project.metricId || state.metric;
      if (existing && Array.isArray(existing.labels) && existing.labels.length === axisMeta.labels.length) {
        existing.label = axisMeta.label;
        existing.labels = axisMeta.labels.slice();
        existing.events = axisMeta.events.map(function (ev) {
          return Object.assign({}, ev);
        });
        if (metricId) obs.ensureSeriesShape(existing, metricId);
        return existing;
      }
      const modeData = {
        label: axisMeta.label,
        labels: axisMeta.labels.slice(),
        events: axisMeta.events.map(function (ev) {
          return Object.assign({}, ev);
        }),
      };
      if (metricId) {
        const prev = existing && existing[metricId];
        modeData[metricId] =
          prev && Array.isArray(prev.current) && prev.current.length === modeData.labels.length
            ? {
                current: prev.current.slice(),
                previous: Array.isArray(prev.previous) ? prev.previous.slice() : obs.emptySeries(modeData.labels.length).previous,
                sources: Array.isArray(prev.sources) ? prev.sources.slice() : obs.emptySeries(modeData.labels.length).sources,
              }
            : obs.emptySeries(modeData.labels.length);
      }
      projectAxes[project.id] = modeData;
      return modeData;
    }

    function notebookMetricIds(project) {
      if (!project) return [];
      if (Array.isArray(project.metricIds) && project.metricIds.length) {
        return project.metricIds.slice();
      }
      return project.metricId ? [String(project.metricId)] : [];
    }

    function syncFromActiveProject() {
      const project = projects.getActive();
      if (!project) return null;
      const focus = project.focusMetricId || project.metricId;
      if (focus && metrics.get(focus)) {
        state.metric = focus;
      } else {
        const ids = notebookMetricIds(project);
        const found = ids.find(function (id) {
          return metrics.get(id);
        });
        if (found) state.metric = found;
      }
      if (obs.isVisitLinkedKind(project.kind)) {
        ensureVisitAxis(project);
        state.compare = false;
      }
      return project;
    }

    syncFromActiveProject();

    function getState() {
      const project = projects.getActive();
      return {
        mode: state.mode,
        metric: state.metric,
        secondary: state.secondary,
        compare: state.compare,
        customCount: state.customCount,
        customTitle: state.customTitle,
        focusVisitId: state.focusVisitId,
        overlayMetricIds: (state.overlayMetricIds || []).slice(),
        overview: !!state.overview,
        activeProjectId: project ? project.id : "",
        projectKind: project ? project.kind : "",
      };
    }

    function setCustomTitle(value) {
      state.customTitle = obs.normalizeCustomTitle
        ? obs.normalizeCustomTitle(value)
        : String(value || "").trim().slice(0, 48);
      return state.customTitle;
    }

    function resolveTitle() {
      const project = projects.getActive();
      const meta = metrics.get(state.metric) || {};
      const modeData = getModeData();
      if (typeof obs.resolveChartTitle === "function") {
        return obs.resolveChartTitle({
          projectName: project && project.name,
          project: project,
          customTitle: state.customTitle,
          metricLabel: meta.label,
          modeLabel: modeData && modeData.label,
        });
      }
      if (project && project.name) return project.name;
      return (meta.label || "") + "｜" + ((modeData && modeData.label) || "") + "觀察趨勢";
    }

    function setFocusVisitId(visitId) {
      state.focusVisitId = visitId != null ? String(visitId) : "";
      return state.focusVisitId;
    }

    function findVisit(visitId) {
      const id = String(visitId || "");
      if (!id) return null;
      for (let i = 0; i < visits.length; i += 1) {
        if (String(visits[i].id) === id) return visits[i];
      }
      return null;
    }

    function setMode(mode) {
      const project = projects.getActive();
      if (project && obs.isVisitLinkedKind(project.kind)) return state.mode;
      if (viewData[mode]) state.mode = mode;
      return state.mode;
    }

    function alignModeToAvailableData() {
      const project = projects.getActive();
      if (!project || !obs.isSelfMetricKind(project.kind)) return state.mode;
      const metricId = project.focusMetricId || project.metricId || state.metric;
      if (!metricId) return state.mode;
      const current = getSeries(metricId, state.mode);
      if (current && !obs.isEmptySeries(current)) return state.mode;
      const order = ["week", "month", "year", "day"];
      for (let i = 0; i < order.length; i += 1) {
        const mode = order[i];
        if (mode === state.mode) continue;
        const series = getSeries(metricId, mode);
        if (series && !obs.isEmptySeries(series)) {
          state.mode = mode;
          return mode;
        }
      }
      return state.mode;
    }

    function setMetric(metricId) {
      state.overview = false;
      if (metrics.get(metricId)) state.metric = metricId;
      const project = projects.getActive();
      if (project && obs.isSelfMetricKind(project.kind) && typeof projects.setFocusMetricId === "function") {
        projects.setFocusMetricId(project.id, state.metric);
      } else if (project && project.metricId !== state.metric) {
        projects.setMetricId(project.id, state.metric);
      }
      sanitizeOverlayIds();
      return state.metric;
    }

    function setSecondary(metricId) {
      if (metrics.get(metricId)) state.secondary = metricId;
      return state.secondary;
    }

    function setCompare(flag) {
      const project = projects.getActive();
      if (project && obs.isVisitLinkedKind(project.kind)) {
        state.compare = false;
        return state.compare;
      }
      state.compare = !!flag;
      return state.compare;
    }

    function ensureSecondaryDistinct() {
      if (state.secondary === state.metric) {
        const fallback = metrics.listIds().find(function (id) {
          return id !== state.metric;
        });
        if (fallback) state.secondary = fallback;
      }
      return state.secondary;
    }

    function replaceViewData(nextViewData) {
      Object.keys(viewData).forEach(function (key) {
        delete viewData[key];
      });
      const incoming = nextViewData && typeof nextViewData === "object" ? nextViewData : {};
      Object.keys(incoming).forEach(function (mode) {
        viewData[mode] = incoming[mode];
      });
    }

    function addCustomMetric(name, extras) {
      const id = metrics.addCustom(name, extras);
      if (!id) return null;
      state.customCount =
        typeof metrics.getCustomCount === "function"
          ? metrics.getCustomCount()
          : state.customCount + 1;
      if (typeof metrics.setCustomCount === "function") {
        metrics.setCustomCount(state.customCount);
      }
      ["day", "week", "month", "year"].forEach(function (mode) {
        const modeData = viewData[mode];
        if (!modeData) return;
        const len = Array.isArray(modeData.labels) ? modeData.labels.length : 0;
        modeData[id] = obs.emptySeries(len);
      });
      state.metric = id;
      return id;
    }

    function getModeData(mode) {
      const project = projects.getActive();
      if (project && obs.isVisitLinkedKind(project.kind)) {
        return ensureVisitAxis(project);
      }
      return viewData[mode || state.mode] || null;
    }

    function getSeries(metricId, mode) {
      const modeData = getModeData(mode);
      if (!modeData) return null;
      return obs.ensureSeriesShape(modeData, metricId || state.metric);
    }

    function addDiaryPoint(opts) {
      const cfg = opts || {};
      const note = obs.createNote({
        metricId: cfg.metricId || state.metric,
        value: cfg.value,
        visitId: cfg.visitId,
        text: cfg.text != null ? cfg.text : cfg.note,
        at: cfg.at,
      });
      diaryNotes.push(note);

      const project = projects.getActive();
      const visitLinked = project && obs.isVisitLinkedKind(project.kind);
      if (!visitLinked && cfg.isoDate && typeof obs.applyDatedLog === "function") {
        obs.applyDatedLog(viewData, {
          metricId: note.metricId,
          value: cfg.value,
          isoDate: cfg.isoDate,
          timeHM: cfg.timeHM,
        });
      } else if (Number.isFinite(cfg.value) && Number.isInteger(cfg.index)) {
        const modeData = visitLinked
          ? ensureVisitAxis(project)
          : viewData[cfg.mode || state.mode];
        if (modeData) {
          const series = obs.ensureSeriesShape(modeData, note.metricId);
          obs.applyDiaryPoint(series, cfg.index, cfg.value);
        }
      }
      return note;
    }

    function setActiveProject(id) {
      const project = projects.setActive(id);
      syncFromActiveProject();
      sanitizeOverlayIds();
      return project;
    }

    function setOverview(flag) {
      const project = projects.getActive();
      if (!project || !obs.isSelfMetricKind(project.kind) || notebookMetricIds(project).length < 2) {
        state.overview = false;
        return sanitizeOverlayIds();
      }
      state.overview = !!flag;
      return sanitizeOverlayIds();
    }

    function toggleOverlayMetric(metricId) {
      const key = String(metricId || "");
      const project = projects.getActive();
      if (!project || !obs.isSelfMetricKind(project.kind)) return sanitizeOverlayIds();
      const allowed = notebookMetricIds(project);
      const blocksFocus = !state.overview && key === state.metric;
      if (!key || blocksFocus || !metrics.get(key) || allowed.indexOf(key) < 0) {
        return sanitizeOverlayIds();
      }
      const list = state.overlayMetricIds || [];
      const idx = list.indexOf(key);
      if (idx >= 0) list.splice(idx, 1);
      else {
        if (list.length >= 8) list.shift();
        list.push(key);
      }
      state.overlayMetricIds = list;
      return sanitizeOverlayIds();
    }

    function toggleOverlayProject(projectId) {
      const project = projects.get(projectId) || projects.getActive();
      if (!project || !obs.isSelfMetricKind(project.kind)) return sanitizeOverlayIds();
      const metricId = String(project.focusMetricId || project.metricId || "");
      return toggleOverlayMetric(metricId);
    }

    function listChartTracks() {
      const active = projects.getActive();
      const visitLinked = !!(active && obs.isVisitLinkedKind(active.kind));
      const seen = {};
      const tracks = [];
      function pushTrack(metricId, project, primary) {
        const key = String(metricId || "");
        if (!key || seen[key]) return;
        const meta = metrics.get(key);
        if (!meta) return;
        const series = getSeries(key);
        seen[key] = true;
        tracks.push({
          metricId: key,
          projectId: project && project.id ? String(project.id) : "",
          name: String(meta.label || (project && project.name) || "指標"),
          meta: meta,
          series: series,
          primary: !!primary,
          empty: !series || obs.isEmptySeries(series),
        });
      }
      if (state.overview && !visitLinked) {
        (state.overlayMetricIds || []).forEach(function (id, index) {
          pushTrack(id, active, index === 0);
        });
        return tracks;
      }
      pushTrack(state.metric, active, true);
      if (!visitLinked) {
        (state.overlayMetricIds || []).forEach(function (id) {
          pushTrack(id, active, false);
        });
      }
      return tracks;
    }

    function findNotebookProject() {
      const active = projects.getActive();
      if (active && obs.isSelfMetricKind(active.kind)) return active;
      const list = projects.list();
      for (let i = 0; i < list.length; i += 1) {
        if (obs.isSelfMetricKind(list[i].kind)) return list[i];
      }
      return null;
    }

    function createProject(cfg) {
      const optsIn = cfg || {};
      let metricId = optsIn.metricId || "";
      if (obs.isSelfMetricKind(optsIn.kind) && !optsIn.asNewProject) {
        if (!metricId) {
          const created = addCustomMetric(optsIn.metricName || optsIn.name, {
            unit: optsIn.metricUnit,
            scale: optsIn.metricScale,
            color: optsIn.metricColor || optsIn.color,
          });
          if (!created) return null;
          metricId = created;
        }
        let notebook = findNotebookProject();
        if (!notebook) {
          notebook = projects.create({
            name: optsIn.projectName || obs.DEFAULT_NOTEBOOK_NAME || "觀察專案",
            kind: "notebook",
            metricIds: [metricId],
            focusMetricId: metricId,
            caption: optsIn.caption,
          });
        } else {
          if (typeof projects.addMetricId === "function") {
            projects.addMetricId(notebook.id, metricId);
          }
          if (typeof projects.setFocusMetricId === "function") {
            projects.setFocusMetricId(notebook.id, metricId);
          }
          projects.setActive(notebook.id);
        }
        syncFromActiveProject();
        return projects.getActive();
      }
      if (obs.isSelfMetricKind(optsIn.kind) && !metricId) {
        const created = addCustomMetric(optsIn.metricName || optsIn.name, {
          unit: optsIn.metricUnit,
          scale: optsIn.metricScale,
          color: optsIn.metricColor || optsIn.color,
        });
        if (!created) return null;
        metricId = created;
      }
      if (obs.isVisitLinkedKind(optsIn.kind) && !metricId) {
        const created = addCustomMetric(optsIn.metricName || optsIn.name, {
          unit: optsIn.metricUnit,
          scale: optsIn.metricScale,
          color: optsIn.metricColor || optsIn.color,
        });
        metricId = created || state.metric || metrics.listIds()[0] || "";
      }
      const project = projects.create({
        name: optsIn.name,
        kind: optsIn.kind,
        visitIds: optsIn.visitIds,
        metricId: metricId,
        id: optsIn.id,
        createdAt: optsIn.createdAt,
        caption: optsIn.caption,
      });
      if (!project) return null;
      if (obs.isVisitLinkedKind(project.kind)) {
        const axis = ensureVisitAxis(project);
        if (optsIn.seedSeries && axis && project.metricId) {
          axis[project.metricId] = {
            current: optsIn.seedSeries.current.slice(),
            previous: (optsIn.seedSeries.previous || []).slice(),
            sources: (optsIn.seedSeries.sources || []).slice(),
          };
        }
      }
      syncFromActiveProject();
      return project;
    }

    function renameProject(id, name) {
      return projects.rename(id, name);
    }

    function updateSelfMetricProject(id, cfg) {
      const opts = cfg || {};
      const current = projects.get(id);
      if (!current || !obs.isSelfMetricKind(current.kind)) return null;
      if (opts.projectName) {
        if (!projects.rename(id, opts.projectName)) return null;
      }
      if (opts.caption != null && typeof projects.setCaption === "function") {
        projects.setCaption(id, opts.caption);
      }
      const metricId = opts.metricId || current.focusMetricId || current.metricId;
      const metricLabel = opts.metricName || opts.label || "";
      if (metricId && metrics && typeof metrics.update === "function") {
        const patch = {
          unit: opts.metricUnit,
          scale: opts.metricScale,
          color: opts.metricColor || opts.color,
        };
        if (metricLabel) patch.label = metricLabel;
        const updated = metrics.update(metricId, patch);
        if (!updated) return null;
      }
      syncFromActiveProject();
      return projects.get(id);
    }

    function relinkProjectVisits(id, visitIds) {
      const project = projects.relinkVisits(id, visitIds);
      if (project) ensureVisitAxis(project);
      syncFromActiveProject();
      return project;
    }

    function metricStillReferenced(metricId) {
      const key = String(metricId || "");
      if (!key) return false;
      return projects.list().some(function (p) {
        const ids = notebookMetricIds(p);
        return ids.indexOf(key) >= 0 || String(p.metricId || "") === key;
      });
    }

    function clearMetricSeriesFromViewData(metricId) {
      const key = String(metricId || "");
      if (!key) return;
      ["day", "week", "month", "year"].forEach(function (mode) {
        const modeData = viewData[mode];
        if (modeData && Object.prototype.hasOwnProperty.call(modeData, key)) {
          delete modeData[key];
        }
      });
    }

    function pruneOrphanedMetric(metricId) {
      const key = String(metricId || "");
      if (!key || metricStillReferenced(key)) return false;

      diaryNotes = diaryNotes.filter(function (note) {
        return String(note.metricId || "") !== key;
      });
      clearMetricSeriesFromViewData(key);

      if (typeof metrics.replaceAll === "function" && typeof metrics.listIds === "function") {
        const next = {};
        metrics.listIds().forEach(function (id) {
          if (String(id) === key) return;
          const meta = metrics.get(id);
          if (meta) next[id] = Object.assign({}, meta);
        });
        metrics.replaceAll(next);
      }

      if (state.metric === key) {
        const ids = metrics.listIds();
        state.metric = ids[0] || "";
      }
      if (state.secondary === key) {
        const ids = metrics.listIds();
        state.secondary =
          ids.find(function (id) {
            return id !== state.metric;
          }) ||
          ids[0] ||
          "";
      }
      sanitizeOverlayIds();
      return true;
    }

    function deleteMetric(projectId, metricId) {
      const project = projects.get(projectId);
      if (!project || !obs.isSelfMetricKind(project.kind)) return false;
      const key = String(metricId || "");
      if (!key) return false;
      if (typeof projects.removeMetricId !== "function") return false;
      const next = projects.removeMetricId(project.id, key);
      if (!next) return false;
      pruneOrphanedMetric(key);
      sanitizeOverlayIds();
      syncFromActiveProject();
      return true;
    }

    function deleteProject(id) {
      const key = String(id || "");
      const doomed = projects.get(key);
      if (!doomed) return false;
      const doomedIds = notebookMetricIds(doomed);

      const ok = projects.delete(key);
      if (!ok) return false;

      delete projectAxes[key];

      // Drop notes tagged to this project id (forward-compatible); metric notes
      // only when the metric is no longer referenced by any remaining project.
      diaryNotes = diaryNotes.filter(function (note) {
        if (note && note.projectId != null && String(note.projectId) === key) {
          return false;
        }
        return true;
      });
      doomedIds.forEach(function (metricId) {
        pruneOrphanedMetric(metricId);
      });

      syncFromActiveProject();
      if (!projects.getActive()) {
        state.customTitle = "";
      }
      return true;
    }

    function seedDemoProjects() {
      if (projects.list().length) return projects.list();
      const seeds =
        typeof obs.createDemoProjects === "function" ? obs.createDemoProjects() : [];
      seeds.forEach(function (seed) {
        const created = projects.create(seed);
        if (!created) return;
        if (obs.isVisitLinkedKind(created.kind) && typeof obs.createDemoVisitSeries === "function") {
          const demoAxis = obs.createDemoVisitSeries(created.metricId || "headache");
          projectAxes[created.id] = cloneAxis(demoAxis);
        }
      });
      if (seeds[0]) projects.setActive(seeds[0].id);
      syncFromActiveProject();
      return projects.list();
    }

    function exportPersistState() {
      const projectState = projects.exportState();
      return {
        metrics: metrics,
        viewData: viewData,
        notes: diaryNotes.slice(),
        ui: Object.assign({}, getState(), { activeProjectId: projectState.activeProjectId }),
        projects: projectState.projects,
        activeProjectId: projectState.activeProjectId,
        projectAxes: Object.keys(projectAxes).reduce(function (acc, key) {
          acc[key] = cloneAxis(projectAxes[key]);
          return acc;
        }, {}),
        projectStore: projects,
      };
    }

    function loadFromPet(pet) {
      if (typeof obs.hydrateObservations !== "function") {
        throw new TypeError("loadFromPet requires observations.persist helpers");
      }
      const hydrated = obs.hydrateObservations(pet && pet.observations);
      if (typeof metrics.replaceAll === "function") {
        metrics.replaceAll(hydrated.metrics);
      }
      replaceViewData(hydrated.viewData);
      diaryNotes = hydrated.notes.slice();
      Object.keys(projectAxes).forEach(function (key) {
        delete projectAxes[key];
      });
      const axes = hydrated.projectAxes || {};
      Object.keys(axes).forEach(function (key) {
        projectAxes[key] = cloneAxis(axes[key]);
      });
      projects.replaceAll(hydrated.projects || [], hydrated.activeProjectId || "");
      applyUi(hydrated.ui);
      const nextIds = metrics.listIds();
      if (nextIds.indexOf(state.metric) < 0) state.metric = nextIds[0] || "";
      if (nextIds.indexOf(state.secondary) < 0) {
        state.secondary =
          nextIds.find(function (id) {
            return id !== state.metric;
          }) ||
          nextIds[0] ||
          "";
      }
      state.customCount =
        typeof metrics.getCustomCount === "function"
          ? metrics.getCustomCount()
          : hydrated.ui.customCount || 0;
      syncFromActiveProject();
      sanitizeOverlayIds();
      alignModeToAvailableData();
      return hydrated;
    }

    function flushToPet(pet, opts) {
      if (typeof obs.writeObservationsToPet !== "function") {
        throw new TypeError("flushToPet requires observations.persist helpers");
      }
      const options = Object.assign({ isDemoMode: isDemoMode }, opts || {});
      return obs.writeObservationsToPet(pet, exportPersistState(), options);
    }

    function hidesModeToolbar() {
      const project = projects.getActive();
      return !!(project && obs.isVisitLinkedKind(project.kind));
    }

    function hidesCompare() {
      return hidesModeToolbar();
    }

    function listSelfMetricBoardRows() {
      if (typeof obs.listSelfMetricBoardRows !== "function") return [];
      const project = projects.getActive();
      const notebook = project && obs.isSelfMetricKind(project.kind) ? project : null;
      return obs.listSelfMetricBoardRows({
        projects: notebook ? [notebook] : [],
        metricIds: notebook ? notebookMetricIds(notebook) : [],
        projectId: notebook ? notebook.id : "",
        metrics: metrics,
        viewData: viewData,
        mode: state.mode,
        activeProjectId: notebook ? notebook.id : "",
        focusMetricId: notebook ? notebook.focusMetricId || state.metric : "",
        overlayMetricIds: state.overlayMetricIds || [],
        overview: !!state.overview,
        allowOverlay: !!notebook,
        formatValue: metrics.formatValue,
      });
    }

    sanitizeOverlayIds();
    alignModeToAvailableData();

    return {
      getState: getState,
      setMode: setMode,
      alignModeToAvailableData: alignModeToAvailableData,
      setMetric: setMetric,
      setSecondary: setSecondary,
      setCompare: setCompare,
      setCustomTitle: setCustomTitle,
      resolveTitle: resolveTitle,
      setFocusVisitId: setFocusVisitId,
      findVisit: findVisit,
      ensureSecondaryDistinct: ensureSecondaryDistinct,
      addCustomMetric: addCustomMetric,
      addDiaryPoint: addDiaryPoint,
      getModeData: getModeData,
      getSeries: getSeries,
      getViewData: function () {
        return viewData;
      },
      getVisits: function () {
        return visits;
      },
      getNotes: function () {
        return diaryNotes.slice();
      },
      getProjects: function () {
        return projects.list();
      },
      getActiveProject: function () {
        return projects.getActive();
      },
      setActiveProject: setActiveProject,
      setFocusMetric: setMetric,
      setOverview: setOverview,
      toggleOverlayProject: toggleOverlayProject,
      toggleOverlayMetric: toggleOverlayMetric,
      listChartTracks: listChartTracks,
      deleteMetric: deleteMetric,
      createProject: createProject,
      renameProject: renameProject,
      setProjectCaption: function (id, caption) {
        return typeof projects.setCaption === "function"
          ? projects.setCaption(id, caption)
          : null;
      },
      updateSelfMetricProject: updateSelfMetricProject,
      relinkProjectVisits: relinkProjectVisits,
      deleteProject: deleteProject,
      seedDemoProjects: seedDemoProjects,
      hidesModeToolbar: hidesModeToolbar,
      hidesCompare: hidesCompare,
      listSelfMetricBoardRows: listSelfMetricBoardRows,
      projects: projects,
      exportPersistState: exportPersistState,
      loadFromPet: loadFromPet,
      flushToPet: flushToPet,
      isDemoMode: isDemoMode,
      metrics: metrics,
    };
  }

  root.domains.observations.createController = createController;
})(typeof window !== "undefined" ? window : globalThis);
