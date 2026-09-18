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

    function syncFromActiveProject() {
      const project = projects.getActive();
      if (!project) return null;
      if (project.metricId && metrics.get(project.metricId)) {
        state.metric = project.metricId;
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

    function setMetric(metricId) {
      if (metrics.get(metricId)) state.metric = metricId;
      const project = projects.getActive();
      if (project && project.metricId !== state.metric) {
        projects.setMetricId(project.id, state.metric);
      }
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

    function addCustomMetric(name) {
      const id = metrics.addCustom(name);
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

      if (Number.isFinite(cfg.value) && Number.isInteger(cfg.index)) {
        const project = projects.getActive();
        const modeData =
          project && obs.isVisitLinkedKind(project.kind)
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
      return project;
    }

    function createProject(cfg) {
      const optsIn = cfg || {};
      let metricId = optsIn.metricId || "";
      if (obs.isSelfMetricKind(optsIn.kind) && !metricId) {
        const created = addCustomMetric(optsIn.metricName || optsIn.name);
        if (!created) return null;
        metricId = created;
      }
      if (obs.isVisitLinkedKind(optsIn.kind) && !metricId) {
        metricId = state.metric || metrics.listIds()[0] || "";
      }
      const project = projects.create({
        name: optsIn.name,
        kind: optsIn.kind,
        visitIds: optsIn.visitIds,
        metricId: metricId,
        id: optsIn.id,
        createdAt: optsIn.createdAt,
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
      const project = projects.rename(id, name);
      return project;
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
        return String(p.metricId || "") === key;
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
      return true;
    }

    function deleteProject(id) {
      const key = String(id || "");
      const doomed = projects.get(key);
      if (!doomed) return false;
      const metricId = doomed.metricId ? String(doomed.metricId) : "";

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
      pruneOrphanedMetric(metricId);

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

    return {
      getState: getState,
      setMode: setMode,
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
      createProject: createProject,
      renameProject: renameProject,
      relinkProjectVisits: relinkProjectVisits,
      deleteProject: deleteProject,
      seedDemoProjects: seedDemoProjects,
      hidesModeToolbar: hidesModeToolbar,
      hidesCompare: hidesCompare,
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
