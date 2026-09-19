(function initPetLiveWebObservationsProjects(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  const KIND_VISIT_LINKED = "visit-linked";
  const KIND_SELF_METRIC = "self-metric";
  const KIND_NOTEBOOK = "notebook";
  const NAME_MAX = 32;
  const CAPTION_MAX = 80;
  const DEFAULT_NOTEBOOK_NAME = "觀察專案";

  function isVisitLinkedKind(kind) {
    return String(kind || "") === KIND_VISIT_LINKED;
  }

  function isNotebookKind(kind) {
    const key = String(kind || "");
    return key === KIND_NOTEBOOK || key === KIND_SELF_METRIC;
  }

  function isSelfMetricKind(kind) {
    return isNotebookKind(kind);
  }

  function normalizeMetricIds(rawIds, fallbackId) {
    const seen = {};
    const out = [];
    function push(id) {
      const key = String(id || "").trim().slice(0, 64);
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(key);
    }
    if (Array.isArray(rawIds)) rawIds.forEach(push);
    push(fallbackId);
    return out;
  }

  function isLegacySelfMetricRaw(raw) {
    return !!(
      raw &&
      typeof raw === "object" &&
      String(raw.kind || "") === KIND_SELF_METRIC &&
      !Array.isArray(raw.metricIds)
    );
  }

  function normalizeName(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    return raw.slice(0, NAME_MAX);
  }

  function normalizeCaption(value) {
    return String(value == null ? "" : value).trim().slice(0, CAPTION_MAX);
  }

  function extractVisitDate(visit) {
    if (!visit || typeof visit !== "object") return "";
    if (visit.date != null && String(visit.date).trim()) {
      return String(visit.date).trim().slice(0, 32);
    }
    const label = String(visit.label || "");
    const m = label.match(/(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const m2 = label.match(/(\d{1,2})\/(\d{1,2})/);
    if (m2) {
      const mm = String(m2[1]).padStart(2, "0");
      const dd = String(m2[2]).padStart(2, "0");
      return mm + "/" + dd;
    }
    return label.slice(0, 32);
  }

  function shortVisitLabel(visit) {
    const date = extractVisitDate(visit);
    if (!date) return String((visit && visit.label) || visit.id || "").slice(0, 32);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const parts = date.split("-");
      return Number(parts[1]) + "/" + Number(parts[2]);
    }
    return date;
  }

  function normalizeVisitIds(raw) {
    if (!Array.isArray(raw)) return [];
    const seen = {};
    const out = [];
    raw.forEach(function (id) {
      const key = String(id || "").trim().slice(0, 64);
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(key);
    });
    return out;
  }

  function normalizeProject(raw) {
    if (!raw || typeof raw !== "object") return null;
    const kind = isVisitLinkedKind(raw.kind)
      ? KIND_VISIT_LINKED
      : isNotebookKind(raw.kind)
        ? KIND_NOTEBOOK
        : "";
    if (!kind) return null;
    const name = normalizeName(raw.name);
    if (!name) return null;
    const id = String(raw.id || "").trim().slice(0, 64);
    if (!id) return null;
    const metricIds =
      kind === KIND_NOTEBOOK
        ? normalizeMetricIds(raw.metricIds, raw.metricId)
        : normalizeMetricIds(raw.metricId ? [raw.metricId] : [], raw.metricId);
    const focus = String(raw.focusMetricId || "").trim().slice(0, 64);
    return {
      id: id,
      name: name,
      kind: kind,
      createdAt: String(raw.createdAt || "").slice(0, 40) || new Date(0).toISOString(),
      visitIds: kind === KIND_VISIT_LINKED ? normalizeVisitIds(raw.visitIds) : [],
      metricIds: metricIds,
      metricId: metricIds[0] || "",
      focusMetricId: metricIds.indexOf(focus) >= 0 ? focus : metricIds[0] || "",
      caption: normalizeCaption(raw.caption),
    };
  }

  function cloneProject(p) {
    if (!p) return null;
    return Object.assign({}, p, {
      visitIds: Array.isArray(p.visitIds) ? p.visitIds.slice() : [],
      metricIds: Array.isArray(p.metricIds) ? p.metricIds.slice() : [],
    });
  }

  function foldNotebooks(rawList) {
    const visit = [];
    const notes = [];
    let legacy = false;
    (Array.isArray(rawList) ? rawList : []).forEach(function (raw) {
      if (isLegacySelfMetricRaw(raw)) legacy = true;
      const p = normalizeProject(raw);
      if (!p) return;
      if (isVisitLinkedKind(p.kind)) visit.push(p);
      else notes.push(p);
    });
    if (!notes.length) return visit;
    if (notes.length === 1 && !legacy) return visit.concat([cloneProject(notes[0])]);
    const keeper = notes[0];
    const ids = normalizeMetricIds(
      notes.reduce(function (acc, item) {
        return acc.concat(item.metricIds || []);
      }, []),
      ""
    );
    const focus =
      keeper.focusMetricId && ids.indexOf(keeper.focusMetricId) >= 0
        ? keeper.focusMetricId
        : ids[0] || "";
    return visit.concat([
      cloneProject(
        Object.assign({}, keeper, {
          name: normalizeName(DEFAULT_NOTEBOOK_NAME) || DEFAULT_NOTEBOOK_NAME,
          kind: KIND_NOTEBOOK,
          metricIds: ids,
          metricId: ids[0] || "",
          focusMetricId: focus,
        })
      ),
    ]);
  }

  function sortVisitIdsByDate(visitIds, visits) {
    const list = Array.isArray(visits) ? visits : [];
    const byId = {};
    list.forEach(function (v) {
      if (v && v.id) byId[String(v.id)] = v;
    });
    return normalizeVisitIds(visitIds).slice().sort(function (a, b) {
      const da = extractVisitDate(byId[a]) || a;
      const db = extractVisitDate(byId[b]) || b;
      if (da < db) return -1;
      if (da > db) return 1;
      return a < b ? -1 : a > b ? 1 : 0;
    });
  }

  function buildVisitAxis(visits, visitIds) {
    const list = Array.isArray(visits) ? visits : [];
    const byId = {};
    list.forEach(function (v) {
      if (v && v.id) byId[String(v.id)] = v;
    });
    const ordered = sortVisitIdsByDate(visitIds, list);
    const labels = [];
    const events = [];
    ordered.forEach(function (id, index) {
      const visit = byId[id];
      const label = visit ? shortVisitLabel(visit) : id;
      labels.push(label);
      events.push({
        index: index,
        label: visit && visit.label ? String(visit.label).slice(0, 80) : label,
        shortLabel: label,
        kind: index === 0 ? "med" : "visit",
        visitId: id,
      });
    });
    return {
      label: "就診",
      labels: labels,
      events: events,
      visitIds: ordered,
    };
  }

  function createProjectStore(opts) {
    const input = opts || {};
    const projects = [];
    let activeProjectId = "";
    let seq = Math.max(0, Number(input.seq) || 0);

    function nextId() {
      seq += 1;
      return "proj_" + seq;
    }

    function list() {
      return projects.map(cloneProject);
    }

    function get(id) {
      const key = String(id || "");
      for (let i = 0; i < projects.length; i += 1) {
        if (projects[i].id === key) {
          return cloneProject(projects[i]);
        }
      }
      return null;
    }

    function getActive() {
      return get(activeProjectId);
    }

    function setActive(id) {
      const key = String(id || "");
      if (!key) {
        activeProjectId = "";
        return null;
      }
      const found = get(key);
      if (!found) return getActive();
      activeProjectId = key;
      return found;
    }

    function replaceAll(nextProjects, nextActiveId) {
      projects.length = 0;
      const incoming = Array.isArray(nextProjects) ? nextProjects : [];
      foldNotebooks(incoming).forEach(function (p) {
        if (p) projects.push(p);
      });
      let maxSeq = seq;
      projects.forEach(function (p) {
        const m = /^proj_(\d+)$/.exec(p.id);
        if (m) maxSeq = Math.max(maxSeq, Number(m[1]) || 0);
      });
      seq = maxSeq;
      if (nextActiveId != null) {
        const wanted = String(nextActiveId || "");
        activeProjectId = wanted && get(wanted) ? wanted : projects[0] ? projects[0].id : "";
      } else if (!get(activeProjectId)) {
        activeProjectId = projects[0] ? projects[0].id : "";
      }
      return list();
    }

    function create(cfg) {
      const optsIn = cfg || {};
      const name = normalizeName(optsIn.name);
      if (!name) return null;
      const kind = isVisitLinkedKind(optsIn.kind)
        ? KIND_VISIT_LINKED
        : isNotebookKind(optsIn.kind)
          ? KIND_NOTEBOOK
          : "";
      if (!kind) return null;

      const visitIds =
        kind === KIND_VISIT_LINKED ? normalizeVisitIds(optsIn.visitIds) : [];
      if (kind === KIND_VISIT_LINKED && !visitIds.length) return null;

      const metricIds = normalizeMetricIds(optsIn.metricIds, optsIn.metricId);
      const focus = String(optsIn.focusMetricId || "").trim().slice(0, 64);

      const project = {
        id: optsIn.id != null && String(optsIn.id).trim() ? String(optsIn.id).trim().slice(0, 64) : nextId(),
        name: name,
        kind: kind,
        createdAt: optsIn.createdAt ? String(optsIn.createdAt).slice(0, 40) : new Date().toISOString(),
        visitIds: visitIds,
        metricIds: metricIds,
        metricId: metricIds[0] || "",
        focusMetricId: metricIds.indexOf(focus) >= 0 ? focus : metricIds[0] || "",
        caption: normalizeCaption(optsIn.caption),
      };
      projects.push(project);
      activeProjectId = project.id;
      return cloneProject(project);
    }

    function setCaption(id, caption) {
      const key = String(id || "");
      for (let i = 0; i < projects.length; i += 1) {
        if (projects[i].id === key) {
          projects[i].caption = normalizeCaption(caption);
          return get(key);
        }
      }
      return null;
    }

    function rename(id, name) {
      const key = String(id || "");
      const next = normalizeName(name);
      if (!next) return null;
      for (let i = 0; i < projects.length; i += 1) {
        if (projects[i].id === key) {
          projects[i].name = next;
          return get(key);
        }
      }
      return null;
    }

    function relinkVisits(id, visitIds) {
      const key = String(id || "");
      for (let i = 0; i < projects.length; i += 1) {
        if (projects[i].id !== key) continue;
        if (projects[i].kind !== KIND_VISIT_LINKED) return null;
        const nextIds = normalizeVisitIds(visitIds);
        if (!nextIds.length) return null;
        projects[i].visitIds = nextIds;
        return get(key);
      }
      return null;
    }

    function setMetricId(id, metricId) {
      const key = String(id || "");
      for (let i = 0; i < projects.length; i += 1) {
        if (projects[i].id !== key) continue;
        const nextId = metricId != null && metricId !== "" ? String(metricId).slice(0, 64) : "";
        const ids = normalizeMetricIds(projects[i].metricIds, nextId);
        projects[i].metricIds = ids;
        projects[i].metricId = ids[0] || "";
        if (!projects[i].focusMetricId || ids.indexOf(projects[i].focusMetricId) < 0) {
          projects[i].focusMetricId = ids[0] || "";
        }
        return get(key);
      }
      return null;
    }

    function addMetricId(id, metricId) {
      const key = String(id || "");
      const nextId = String(metricId || "").trim().slice(0, 64);
      if (!nextId) return null;
      for (let i = 0; i < projects.length; i += 1) {
        if (projects[i].id !== key) continue;
        if (!isNotebookKind(projects[i].kind)) return null;
        const ids = normalizeMetricIds(projects[i].metricIds, nextId);
        projects[i].metricIds = ids;
        projects[i].metricId = ids[0] || "";
        if (!projects[i].focusMetricId) projects[i].focusMetricId = nextId;
        return get(key);
      }
      return null;
    }

    function removeMetricId(id, metricId) {
      const key = String(id || "");
      const drop = String(metricId || "").trim().slice(0, 64);
      for (let i = 0; i < projects.length; i += 1) {
        if (projects[i].id !== key) continue;
        if (!isNotebookKind(projects[i].kind)) return null;
        const ids = (projects[i].metricIds || []).filter(function (item) {
          return item !== drop;
        });
        projects[i].metricIds = ids;
        projects[i].metricId = ids[0] || "";
        if (projects[i].focusMetricId === drop) {
          projects[i].focusMetricId = ids[0] || "";
        }
        return get(key);
      }
      return null;
    }

    function setFocusMetricId(id, metricId) {
      const key = String(id || "");
      const nextId = String(metricId || "").trim().slice(0, 64);
      for (let i = 0; i < projects.length; i += 1) {
        if (projects[i].id !== key) continue;
        const ids = projects[i].metricIds || [];
        if (nextId && ids.indexOf(nextId) < 0) return get(key);
        projects[i].focusMetricId = nextId || ids[0] || "";
        if (projects[i].focusMetricId) projects[i].metricId = projects[i].focusMetricId;
        return get(key);
      }
      return null;
    }

    function remove(id) {
      const key = String(id || "");
      const idx = projects.findIndex(function (p) {
        return p.id === key;
      });
      if (idx < 0) return false;
      projects.splice(idx, 1);
      if (activeProjectId === key) {
        activeProjectId = projects[0] ? projects[0].id : "";
      }
      return true;
    }

    function exportState() {
      return {
        projects: list(),
        activeProjectId: activeProjectId,
        seq: seq,
      };
    }

    if (Array.isArray(input.projects)) {
      replaceAll(input.projects, input.activeProjectId);
    }

    return {
      list: list,
      get: get,
      getActive: getActive,
      setActive: setActive,
      create: create,
      rename: rename,
      setCaption: setCaption,
      relinkVisits: relinkVisits,
      setMetricId: setMetricId,
      addMetricId: addMetricId,
      removeMetricId: removeMetricId,
      setFocusMetricId: setFocusMetricId,
      delete: remove,
      remove: remove,
      replaceAll: replaceAll,
      exportState: exportState,
      normalizeName: normalizeName,
      isVisitLinkedKind: isVisitLinkedKind,
      isSelfMetricKind: isSelfMetricKind,
      isNotebookKind: isNotebookKind,
    };
  }

  root.domains.observations.KIND_VISIT_LINKED = KIND_VISIT_LINKED;
  root.domains.observations.KIND_SELF_METRIC = KIND_SELF_METRIC;
  root.domains.observations.KIND_NOTEBOOK = KIND_NOTEBOOK;
  root.domains.observations.DEFAULT_NOTEBOOK_NAME = DEFAULT_NOTEBOOK_NAME;
  root.domains.observations.PROJECT_NAME_MAX = NAME_MAX;
  root.domains.observations.PROJECT_CAPTION_MAX = CAPTION_MAX;
  root.domains.observations.normalizeProjectName = normalizeName;
  root.domains.observations.normalizeProjectCaption = normalizeCaption;
  root.domains.observations.normalizeProject = normalizeProject;
  root.domains.observations.isVisitLinkedKind = isVisitLinkedKind;
  root.domains.observations.isSelfMetricKind = isSelfMetricKind;
  root.domains.observations.isNotebookKind = isNotebookKind;
  root.domains.observations.foldNotebooks = foldNotebooks;
  root.domains.observations.extractVisitDate = extractVisitDate;
  root.domains.observations.buildVisitAxis = buildVisitAxis;
  root.domains.observations.sortVisitIdsByDate = sortVisitIdsByDate;
  root.domains.observations.createProjectStore = createProjectStore;
})(typeof window !== "undefined" ? window : globalThis);
