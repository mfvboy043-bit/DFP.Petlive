(function initPetLiveWebObservationsMetricBoard(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  const obs = root.domains.observations;

  function finiteValues(list) {
    return (Array.isArray(list) ? list : []).filter(function (value) {
      return Number.isFinite(value);
    });
  }

  function suggestDiaryIndex(values) {
    const list = Array.isArray(values) ? values : [];
    if (!list.length) return 0;
    return list.length - 1;
  }

  function suggestLogDateISO() {
    const dates = root.core && root.core.dates;
    if (dates && typeof dates.todayIsoLocal === "function") {
      return dates.todayIsoLocal();
    }
    if (dates && typeof dates.todayISODate === "function") {
      return dates.todayISODate();
    }
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }

  function suggestLogTimeHM() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return hh + ":" + mm;
  }

  function parseTimeHM(timeHM) {
    const raw = String(timeHM || "").trim();
    const match = /^(\d{1,2}):(\d{2})$/.exec(raw);
    if (!match) return null;
    const h = Number(match[1]);
    const min = Number(match[2]);
    if (!Number.isInteger(h) || !Number.isInteger(min)) return null;
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return { hours: h, minutes: min, hourValue: h + min / 60 };
  }

  function parseIsoLocalDate(isoDate, timeHM) {
    const raw = String(isoDate || "").trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) return null;
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
    const parsedTime = parseTimeHM(timeHM);
    const hours = parsedTime ? parsedTime.hours : 12;
    const minutes = parsedTime ? parsedTime.minutes : 0;
    const date = new Date(y, m - 1, d, hours, minutes, 0, 0);
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) {
      return null;
    }
    return date;
  }

  function parseLabelHours(label) {
    const text = String(label || "").trim();
    const match = /^(\d{1,2}):(\d{2})$/.exec(text);
    if (!match) return null;
    const h = Number(match[1]);
    const min = Number(match[2]);
    if (!Number.isInteger(h) || !Number.isInteger(min)) return null;
    if (h < 0 || h > 24 || min < 0 || min > 59) return null;
    if (h === 24 && min !== 0) return null;
    return h + min / 60;
  }

  function parseLabelDayOfMonth(label) {
    const text = String(label || "").trim();
    const match = /^(\d{1,2})日$/.exec(text);
    if (!match) return null;
    const day = Number(match[1]);
    if (!Number.isInteger(day) || day < 1 || day > 31) return null;
    return day;
  }

  function parseLabelMonth(label) {
    const text = String(label || "").trim();
    const match = /^(\d{1,2})月$/.exec(text);
    if (!match) return null;
    const month = Number(match[1]);
    if (!Number.isInteger(month) || month < 1 || month > 12) return null;
    return month - 1;
  }

  function nearestIndex(targets, value) {
    if (!targets.length || !Number.isFinite(value)) return -1;
    let best = 0;
    let bestDist = Math.abs(targets[0] - value);
    for (let i = 1; i < targets.length; i += 1) {
      const dist = Math.abs(targets[i] - value);
      if (dist < bestDist) {
        best = i;
        bestDist = dist;
      }
    }
    return best;
  }

  function dateToBucketIndex(mode, isoDate, labels, timeHM) {
    const axis = Array.isArray(labels) ? labels : [];
    if (!axis.length) return -1;
    const parsedTime = parseTimeHM(timeHM);
    const date = parseIsoLocalDate(isoDate, parsedTime ? timeHM : null);
    if (!date) return -1;
    const key = String(mode || "week");

    if (key === "week") {
      // JS: Sun=0 … Sat=6 → Mon=0 … Sun=6
      const jsDay = date.getDay();
      const index = jsDay === 0 ? 6 : jsDay - 1;
      return index < axis.length ? index : -1;
    }

    if (key === "year") {
      const targets = axis.map(parseLabelMonth);
      if (targets.every(function (v) {
        return Number.isInteger(v);
      })) {
        return nearestIndex(targets, date.getMonth());
      }
      const index = date.getMonth();
      return index < axis.length ? index : axis.length - 1;
    }

    if (key === "month") {
      const targets = axis.map(parseLabelDayOfMonth);
      if (targets.every(function (v) {
        return Number.isInteger(v);
      })) {
        return nearestIndex(targets, date.getDate());
      }
      const clamped = Math.min(Math.max(date.getDate() - 1, 0), axis.length - 1);
      return clamped;
    }

    if (key === "day") {
      // Daily axis is clock hours. No time recorded → no honest X coordinate.
      if (!parsedTime) return -1;
      const targets = axis.map(parseLabelHours);
      if (!targets.every(function (v) {
        return Number.isFinite(v);
      })) {
        return -1;
      }
      return nearestIndex(targets, parsedTime.hourValue);
    }

    return 0;
  }

  function modesForDatedLog(timeHM) {
    return parseTimeHM(timeHM) ? ["day", "week", "month", "year"] : ["week", "month", "year"];
  }

  function applyDatedLog(viewData, opts) {
    const cfg = opts || {};
    const data = viewData && typeof viewData === "object" ? viewData : {};
    const metricId = String(cfg.metricId || "");
    const value = cfg.value;
    if (!metricId || !Number.isFinite(value)) return [];
    const applied = [];
    modesForDatedLog(cfg.timeHM).forEach(function (mode) {
      const modeData = data[mode] && typeof data[mode] === "object" ? data[mode] : null;
      if (!modeData) return;
      const index = dateToBucketIndex(mode, cfg.isoDate, modeData.labels, cfg.timeHM);
      if (!Number.isInteger(index) || index < 0) return;
      const series =
        typeof obs.ensureSeriesShape === "function"
          ? obs.ensureSeriesShape(modeData, metricId)
          : modeData[metricId];
      if (!series) return;
      if (typeof obs.applyDiaryPoint === "function") {
        obs.applyDiaryPoint(series, index, value);
      }
      applied.push({ mode: mode, index: index });
    });
    return applied;
  }

  function seriesHasPoints(series) {
    if (typeof obs.isEmptySeries === "function") return !obs.isEmptySeries(series);
    const current = series && Array.isArray(series.current) ? series.current : [];
    return finiteValues(current).length > 0;
  }

  function pickBoardSeriesView(viewData, mode, metricId) {
    const data = viewData && typeof viewData === "object" ? viewData : {};
    const key = String(mode || "week");
    const metric = String(metricId || "");

    function viewFor(modeKey) {
      const modeData = data[modeKey] && typeof data[modeKey] === "object" ? data[modeKey] : null;
      if (!modeData) return null;
      return {
        mode: modeKey,
        labels: Array.isArray(modeData.labels) ? modeData.labels : [],
        series:
          metric && modeData[metric] && typeof modeData[metric] === "object"
            ? modeData[metric]
            : { current: [], previous: [], sources: [] },
      };
    }

    const primary = viewFor(key);
    if (key === "day" && primary && !seriesHasPoints(primary.series)) {
      const fallbackModes = ["week", "month", "year"];
      for (let i = 0; i < fallbackModes.length; i += 1) {
        const next = viewFor(fallbackModes[i]);
        if (next && seriesHasPoints(next.series)) return next;
      }
    }
    return (
      primary || {
        mode: key,
        labels: [],
        series: { current: [], previous: [], sources: [] },
      }
    );
  }

  function logDateToAtISO(isoDate, timeHM) {
    const parsedTime = parseTimeHM(timeHM);
    const date = parseIsoLocalDate(isoDate, parsedTime ? timeHM : null);
    if (!date) return null;
    return date.toISOString();
  }

  function sparkPoints(values, meta) {
    const list = Array.isArray(values) ? values : [];
    const finite = finiteValues(list);
    if (!finite.length) return [];
    let min = 0;
    let max = 10;
    if (meta && meta.scale === "fixed10") {
      min = 0;
      max = Number.isFinite(meta.max) ? Number(meta.max) : 10;
    } else {
      min = Math.min.apply(null, finite);
      max = Math.max.apply(null, finite);
      if (min === max) {
        min = Math.max(0, min - 1);
        max = max + 1;
      }
    }
    const span = max - min || 1;
    return list.map(function (value, index) {
      if (!Number.isFinite(value)) return null;
      return {
        index: index,
        x: list.length <= 1 ? 0.5 : index / (list.length - 1),
        y: 1 - (value - min) / span,
        value: value,
      };
    }).filter(Boolean);
  }

  function valueInputSpec(meta) {
    const unit = meta && meta.unit != null ? String(meta.unit) : "分";
    if (meta && meta.scale === "weight") {
      return { min: 0, max: 200, step: 0.1, unit: unit || "kg" };
    }
    if (unit === "次" || (meta && Number.isFinite(meta.max) && meta.max > 10)) {
      return { min: 0, max: Number.isFinite(meta.max) ? Number(meta.max) : 24, step: 1, unit: "次" };
    }
    return { min: 0, max: 10, step: 1, unit: unit || "分" };
  }

  function listSelfMetricBoardRows(input) {
    const cfg = input || {};
    const projects = Array.isArray(cfg.projects) ? cfg.projects : [];
    const metrics = cfg.metrics;
    const viewData = cfg.viewData && typeof cfg.viewData === "object" ? cfg.viewData : {};
    const mode = cfg.mode || "week";
    const activeProjectId = String(cfg.activeProjectId || "");
    const overlayMetricIds = Array.isArray(cfg.overlayMetricIds) ? cfg.overlayMetricIds : [];
    const allowOverlay = cfg.allowOverlay !== false;
    const focusMetricId = String(cfg.focusMetricId || "");
    const formatValue =
      typeof cfg.formatValue === "function"
        ? cfg.formatValue
        : typeof obs.formatValue === "function"
          ? obs.formatValue
          : function (value) {
              return Number.isFinite(value) ? String(value) : "—";
            };

    const items = [];
    if (Array.isArray(cfg.metricIds) && cfg.metricIds.length) {
      const project = projects[0] || { id: cfg.projectId || activeProjectId };
      cfg.metricIds.forEach(function (id) {
        items.push({ project: project, metricId: String(id || "") });
      });
    } else {
      projects
        .filter(function (project) {
          return project && typeof obs.isSelfMetricKind === "function"
            ? obs.isSelfMetricKind(project.kind)
            : String(project && project.kind) === "self-metric" ||
              String(project && project.kind) === "notebook";
        })
        .forEach(function (project) {
          const ids =
            Array.isArray(project.metricIds) && project.metricIds.length
              ? project.metricIds
              : project.metricId
                ? [project.metricId]
                : [];
          ids.forEach(function (id) {
            items.push({ project: project, metricId: String(id || "") });
          });
        });
    }

    return items.map(function (item) {
        const project = item.project || {};
        const metricId = item.metricId;
        const meta =
          metrics && typeof metrics.get === "function" && metricId ? metrics.get(metricId) : null;
        const picked = pickBoardSeriesView(viewData, mode, metricId);
        const labels = picked.labels;
        const series = picked.series;
        const current = Array.isArray(series.current) ? series.current : [];
        const summary =
          typeof obs.computePeriodSummary === "function"
            ? obs.computePeriodSummary(current, labels, meta, formatValue)
            : {
                latestText: "—",
                latestNote: "無有效點",
                changeText: "—",
                completionText: "0%",
              };
        const empty =
          typeof obs.isEmptySeries === "function"
            ? obs.isEmptySeries(series)
            : !finiteValues(current).length;
        const isFocus = focusMetricId
          ? metricId === focusMetricId
          : String(project.id) === activeProjectId && items.length === 1;
        const overview = !!cfg.overview;
        return {
          projectId: String(project.id || cfg.projectId || ""),
          metricId: metricId,
          name: String((meta && meta.label) || "指標"),
          label: meta && meta.label ? String(meta.label) : "指標",
          unit: meta && meta.unit != null ? String(meta.unit) : "",
          color: meta && meta.color ? String(meta.color) : "#1487bd",
          scale: meta && meta.scale ? String(meta.scale) : "fixed10",
          latestText: summary.latestText,
          latestNote: summary.latestNote,
          changeText: summary.changeText,
          completionText: summary.completionText,
          empty: empty,
          active: overview ? false : isFocus,
          overlay: overlayMetricIds.indexOf(metricId) >= 0,
          canOverlay: allowOverlay && (overview || !isFocus),
          overview: overview,
          labels: labels.slice(),
          values: current.slice(),
          spark: sparkPoints(current, meta),
          suggestIndex: suggestDiaryIndex(current),
          input: valueInputSpec(meta),
        };
      });
  }

  obs.listSelfMetricBoardRows = listSelfMetricBoardRows;
  obs.suggestDiaryIndex = suggestDiaryIndex;
  obs.suggestLogDateISO = suggestLogDateISO;
  obs.suggestLogTimeHM = suggestLogTimeHM;
  obs.parseTimeHM = parseTimeHM;
  obs.dateToBucketIndex = dateToBucketIndex;
  obs.modesForDatedLog = modesForDatedLog;
  obs.applyDatedLog = applyDatedLog;
  obs.logDateToAtISO = logDateToAtISO;
  obs.metricBoardSparkPoints = sparkPoints;
  obs.metricBoardValueInputSpec = valueInputSpec;
})(typeof window !== "undefined" ? window : globalThis);
