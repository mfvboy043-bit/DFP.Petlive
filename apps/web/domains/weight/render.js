(function initPetLiveWebWeightRender(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.weight = root.domains.weight || {};

  const weightSelectors = root.domains.weight;

  const SOURCE_CLASS = {
    manual: "is-manual",
    visit: "is-visit",
    profile: "is-profile",
  };

  function createRenderer(deps = {}) {
    const { label, escapeHtml, formatWeight, locale } = deps;

    if (typeof label !== "function") {
      throw new TypeError("createRenderer requires label(key, params?)");
    }
    if (typeof escapeHtml !== "function") {
      throw new TypeError("createRenderer requires escapeHtml");
    }
    if (typeof formatWeight !== "function") {
      throw new TypeError("createRenderer requires formatWeight");
    }

    const activeLocale = locale || "zh-Hant";

    function sourceLabel(source) {
      if (source === "visit") return label("petWeightSourceVisit");
      if (source === "profile") return label("petWeightSourceProfile");
      return label("petWeightSourceManual");
    }

    function buildEmptyChartHtml() {
      return `<p class="pws-chart-empty">${label("petWeightChartEmpty")}</p>`;
    }

    function buildChartHtml(series, options = {}) {
      if (!series?.length) return buildEmptyChartHtml();

      const unit = options.unit === "lb" ? "lb" : "kg";
      const granularity = options.granularity || "year";
      const width = 320;
      const height = 200;
      const padL = 42;
      const padR = 12;
      const padT = 16;
      const padB = 34;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      const displayValues = series.map((point) =>
        weightSelectors.fromKg(point.weightKg, unit)
      );
      let minVal = Math.min(...displayValues);
      let maxVal = Math.max(...displayValues);
      if (minVal === maxVal) {
        minVal = Math.max(0, minVal - 1);
        maxVal = maxVal + 1;
      }
      const range = maxVal - minVal || 1;

      const xAt = (index) =>
        padL + (series.length === 1 ? plotW / 2 : (index / (series.length - 1)) * plotW);
      const yAt = (value) => padT + plotH - ((value - minVal) / range) * plotH;

      const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const value = minVal + range * ratio;
        const y = yAt(value);
        return `<line class="pws-grid-line" x1="${padL}" y1="${y}" x2="${
          width - padR
        }" y2="${y}" />
        <text class="pws-axis-label pws-axis-label-y" x="${padL - 8}" y="${
          y + 4
        }" text-anchor="end">${escapeHtml(value.toFixed(1))}</text>`;
      });

      const bandHtml =
        granularity === "month"
          ? series
              .map((point, index) => {
                if (index % 2 !== 0) return "";
                const x0 = index === 0 ? padL : (xAt(index - 1) + xAt(index)) / 2;
                const x1 =
                  index === series.length - 1
                    ? width - padR
                    : (xAt(index) + xAt(index + 1)) / 2;
                return `<rect class="pws-month-band" x="${x0}" y="${padT}" width="${
                  x1 - x0
                }" height="${plotH}" />`;
              })
              .join("")
          : "";

      const linePoints = series
        .map((point, index) => {
          const value = weightSelectors.fromKg(point.weightKg, unit);
          return `${xAt(index)},${yAt(value)}`;
        })
        .join(" ");

      const pointsHtml = series
        .map((point, index) => {
          const value = weightSelectors.fromKg(point.weightKg, unit);
          const x = xAt(index);
          const y = yAt(value);
          const sourceClass = SOURCE_CLASS[point.source] || "is-manual";
          const drillYear = String(point.bucketKey).slice(0, 4);
          const drillMonth = String(point.bucketKey).slice(5, 7);
          const drillAttrs =
            granularity === "year"
              ? ` data-pws-drill-year="${escapeHtml(drillYear)}" tabindex="0" role="button"`
              : granularity === "month"
                ? ` data-pws-drill-year="${escapeHtml(drillYear)}" data-pws-drill-month="${escapeHtml(
                    drillMonth
                  )}" tabindex="0" role="button"`
                : "";
          return `<circle class="pws-point ${sourceClass}" cx="${x}" cy="${y}" r="4.5"${drillAttrs}>
            <title>${escapeHtml(
              `${weightSelectors.bucketLabel(point.bucketKey, granularity, activeLocale)} · ${formatWeight(
                point.weightKg,
                unit
              )} · ${sourceLabel(point.source)}`
            )}</title>
          </circle>`;
        })
        .join("");

      const xLabels = series
        .map((point, index) => {
          const x = xAt(index);
          const text = weightSelectors.bucketLabel(point.bucketKey, granularity, activeLocale);
          const drillYear = String(point.bucketKey).slice(0, 4);
          const drillMonth = String(point.bucketKey).slice(5, 7);
          const drillAttrs =
            granularity === "year"
              ? ` data-pws-drill-year="${escapeHtml(drillYear)}" tabindex="0" role="button"`
              : granularity === "month"
                ? ` data-pws-drill-year="${escapeHtml(drillYear)}" data-pws-drill-month="${escapeHtml(
                    drillMonth
                  )}" tabindex="0" role="button"`
                : "";
          return `<text class="pws-axis-label pws-axis-label-x pws-drill-target" x="${x}" y="${
            height - 10
          }" text-anchor="middle"${drillAttrs}>${escapeHtml(text)}</text>`;
        })
        .join("");

      const unitLabel = unit === "lb" ? "lb" : "kg";

      return `<svg class="pws-chart" viewBox="0 0 ${width} ${height}" aria-hidden="true">
        ${bandHtml}
        ${yTicks.join("")}
        <line class="pws-axis" x1="${padL}" y1="${padT}" x2="${padL}" y2="${height - padB}" />
        <line class="pws-axis" x1="${padL}" y1="${height - padB}" x2="${width - padR}" y2="${
          height - padB
        }" />
        <polyline class="pws-line" points="${linePoints}" />
        ${pointsHtml}
        ${xLabels}
        <text class="pws-unit-tag" x="${padL}" y="${padT - 4}">${escapeHtml(unitLabel)}</text>
      </svg>`;
    }

    function buildLogListHtml(points, unit) {
      if (!points?.length) {
        return `<li class="pws-item pws-item-empty"><p>${label("petWeightLogEmpty")}</p></li>`;
      }

      return points
        .slice()
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
        .map((point) => {
          const removable = point.source === "manual";
          const removeBtn = removable
            ? `<button type="button" class="btn btn-ghost pws-item-remove" data-pws-remove="${escapeHtml(
                point.id
              )}">${label("petWeightRemove")}</button>`
            : "";
          return `<li class="pws-item ${SOURCE_CLASS[point.source] || ""}" data-pws-id="${escapeHtml(
            point.id
          )}">
            <div class="pws-item-head">
              <span class="pws-item-source">${escapeHtml(sourceLabel(point.source))}</span>
              <time datetime="${escapeHtml(point.date)}">${escapeHtml(point.date)}</time>
              ${removeBtn}
            </div>
            <p class="pws-item-weight">${escapeHtml(formatWeight(point.weightKg, unit))}</p>
          </li>`;
        })
        .join("");
    }

    return {
      buildEmptyChartHtml,
      buildChartHtml,
      buildLogListHtml,
    };
  }

  root.domains.weight.createRenderer = createRenderer;
})(typeof window !== "undefined" ? window : globalThis);
