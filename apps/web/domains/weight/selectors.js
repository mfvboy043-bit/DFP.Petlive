(function initPetLiveWebWeightSelectors(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.weight = root.domains.weight || {};

  const KG_TO_LB = 2.2046226218;
  const SOURCE_PRIORITY = { manual: 3, visit: 2, profile: 1 };

  function toKg(value, unit) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    return unit === "lb" ? Math.round(n * (1 / KG_TO_LB) * 1000) / 1000 : n;
  }

  function fromKg(weightKg, unit) {
    const n = Number(weightKg);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (unit === "lb") return Math.round(n * KG_TO_LB * 10) / 10;
    return Math.round(n * 100) / 100;
  }

  function formatWeight(weightKg, unit) {
    const display = fromKg(weightKg, unit);
    if (display == null) return "—";
    return unit === "lb" ? `${display} lb` : `${display} kg`;
  }

  function normalizeDateKey(value) {
    const raw = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
  }

  function bucketKey(dateKey, granularity) {
    if (granularity === "year") return dateKey.slice(0, 4);
    if (granularity === "month") return dateKey.slice(0, 7);
    return dateKey;
  }

  function dedupePointsByDate(points) {
    const byDate = new Map();
    for (const point of points) {
      const existing = byDate.get(point.date);
      if (
        !existing ||
        (SOURCE_PRIORITY[point.source] || 0) > (SOURCE_PRIORITY[existing.source] || 0) ||
        ((SOURCE_PRIORITY[point.source] || 0) === (SOURCE_PRIORITY[existing.source] || 0) &&
          String(point.id || "") > String(existing.id || ""))
      ) {
        byDate.set(point.date, point);
      }
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  function collectWeightPoints(pet, visitWeightKg) {
    if (!pet) return [];
    const visitWeight =
      typeof visitWeightKg === "function"
        ? visitWeightKg
        : (visit) => {
            const n = Number(visit?.weightAtVisit);
            return n > 0 ? n : null;
          };
    const points = [];

    for (const log of pet.weightLogs || []) {
      const date = normalizeDateKey(log?.date);
      const weightKg = Number(log?.weightKg);
      if (date && Number.isFinite(weightKg) && weightKg > 0) {
        points.push({
          id: log.id || `manual-${date}`,
          date,
          weightKg,
          source: "manual",
        });
      }
    }

    for (const visit of pet.visits || []) {
      const weightKg = visitWeight(visit);
      const date = normalizeDateKey(visit?.date || visit?.visitDate);
      if (date && weightKg != null) {
        points.push({
          id: `visit-${visit.id || date}`,
          date,
          weightKg,
          source: "visit",
        });
      }
    }

    const profileDate = normalizeDateKey(pet.weightDate);
    const profileWeight = Number(pet.weight);
    if (profileDate && Number.isFinite(profileWeight) && profileWeight > 0) {
      points.push({
        id: "profile",
        date: profileDate,
        weightKg: profileWeight,
        source: "profile",
      });
    }

    return dedupePointsByDate(points);
  }

  function latestMonthFocus(points) {
    const latest = points[points.length - 1];
    if (!latest) return { year: null, month: null };
    const [year, month] = latest.date.split("-");
    return { year: Number(year), month: Number(month) };
  }

  function filterPointsForView(points, granularity, focus = {}) {
    if (!points.length) return [];

    if (granularity === "year") {
      return points;
    }

    if (granularity === "month") {
      if (focus.year) {
        return points.filter((point) => point.date.startsWith(String(focus.year)));
      }
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 11, 1);
      const cutKey = cutoff.toISOString().slice(0, 10);
      return points.filter((point) => point.date >= cutKey);
    }

    const resolved =
      focus.year && focus.month ? focus : { ...focus, ...latestMonthFocus(points) };
    if (!resolved.year || !resolved.month) return points;
    const prefix = `${resolved.year}-${String(resolved.month).padStart(2, "0")}`;
    return points.filter((point) => point.date.startsWith(prefix));
  }

  function aggregateForChart(points, granularity, focus = {}) {
    const scoped = filterPointsForView(points, granularity, focus);
    const buckets = new Map();

    for (const point of scoped) {
      const key = bucketKey(point.date, granularity);
      const existing = buckets.get(key);
      if (!existing || point.date >= existing.date) {
        buckets.set(key, {
          ...point,
          bucketKey: key,
        });
      }
    }

    return Array.from(buckets.values()).sort((a, b) =>
      String(a.bucketKey).localeCompare(String(b.bucketKey))
    );
  }

  function bucketLabel(bucketKey, granularity, locale = "zh-Hant") {
    if (granularity === "year") return String(bucketKey);
    if (granularity === "month") {
      const [year, month] = String(bucketKey).split("-");
      if (locale.startsWith("en")) return `${year}-${month}`;
      return `${Number(month)}月`;
    }
    const [, month, day] = String(bucketKey).split("-");
    if (locale.startsWith("en")) return `${Number(month)}/${Number(day)}`;
    return `${Number(month)}/${Number(day)}`;
  }

  root.domains.weight.KG_TO_LB = KG_TO_LB;
  root.domains.weight.toKg = toKg;
  root.domains.weight.fromKg = fromKg;
  root.domains.weight.formatWeight = formatWeight;
  root.domains.weight.normalizeDateKey = normalizeDateKey;
  root.domains.weight.bucketKey = bucketKey;
  root.domains.weight.collectWeightPoints = collectWeightPoints;
  root.domains.weight.filterPointsForView = filterPointsForView;
  root.domains.weight.aggregateForChart = aggregateForChart;
  root.domains.weight.bucketLabel = bucketLabel;
  root.domains.weight.latestMonthFocus = latestMonthFocus;
})(typeof window !== "undefined" ? window : globalThis);
