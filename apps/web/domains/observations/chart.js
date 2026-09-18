(function initPetLiveWebObservationsChart(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  const NS = "http://www.w3.org/2000/svg";
  const obs = root.domains.observations;

  function node(name, attrs, text) {
    const el = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(function (entry) {
      el.setAttribute(entry[0], String(entry[1]));
    });
    if (text != null && text !== "") el.textContent = text;
    return el;
  }

  function linePath(values, x, y) {
    let started = false;
    return values
      .map(function (value, index) {
        if (!Number.isFinite(value)) return "";
        const cmd = started ? "L" : "M";
        started = true;
        return cmd + " " + x(index) + " " + y(value);
      })
      .filter(Boolean)
      .join(" ");
  }

  function createRenderer(deps) {
    const options = deps || {};
    const escapeHtml =
      typeof options.escapeHtml === "function"
        ? options.escapeHtml
        : function (text) {
            return String(text);
          };

    function renderMain(svg, opts) {
      const cfg = opts || {};
      if (!svg) return { empty: true };

      const labels = Array.isArray(cfg.labels) ? cfg.labels : [];
      const series = cfg.series || { current: [], previous: [], sources: [] };
      const meta = cfg.meta || {};
      const events = Array.isArray(cfg.events) ? cfg.events : [];
      const compare = !!cfg.compare;
      const modeLabel = cfg.modeLabel || "";
      const formatValue =
        typeof cfg.formatValue === "function" ? cfg.formatValue : obs.formatValue;
      const onShowTooltip = typeof cfg.onShowTooltip === "function" ? cfg.onShowTooltip : null;
      const onHideTooltip = typeof cfg.onHideTooltip === "function" ? cfg.onHideTooltip : null;

      const empty = obs.isEmptySeries(series);
      svg.replaceChildren();
      if (empty) return { empty: true };

      const width = 360;
      const height = 420;
      const margin = { top: 52, right: 10, bottom: 48, left: 34 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;
      const scale = obs.yScaleFor(meta, series, compare);
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);

      const x = function (index) {
        return margin.left + (index / Math.max(1, labels.length - 1)) * innerW;
      };
      const y = function (value) {
        return margin.top + innerH - ((value - scale.min) / (scale.max - scale.min)) * innerH;
      };

      const bands = [
        { start: 0, end: 0.18, fill: "#eef1f3" },
        { start: 0.18, end: 0.68, fill: "#e8f4ed" },
        { start: 0.68, end: 1, fill: "#fbe9ed" },
      ];
      bands.forEach(function (band) {
        svg.append(
          node("rect", {
            x: margin.left + innerW * band.start,
            y: margin.top,
            width: innerW * (band.end - band.start),
            height: innerH,
            fill: band.fill,
          })
        );
      });

      scale.ticks.forEach(function (tick) {
        svg.append(
          node("line", {
            x1: margin.left,
            y1: y(tick),
            x2: width - margin.right,
            y2: y(tick),
            class: "grid-line",
          })
        );
        const label = meta.scale === "weight" ? String(Math.round(tick * 10) / 10) : String(tick);
        svg.append(
          node(
            "text",
            {
              x: margin.left - 15,
              y: y(tick) + 4,
              "text-anchor": "end",
              class: "axis-label",
            },
            label
          )
        );
      });

      labels.forEach(function (label, index) {
        if (index > 0 && index < labels.length - 1) {
          svg.append(
            node("line", {
              x1: x(index),
              y1: margin.top,
              x2: x(index),
              y2: margin.top + innerH,
              class: "grid-line",
              opacity: "0.55",
            })
          );
        }
        const skipLabel =
          labels.length > 8 &&
          index !== 0 &&
          index !== labels.length - 1 &&
          index % 2 !== 0;
        if (skipLabel) return;
        svg.append(
          node(
            "text",
            {
              x: x(index),
              y: height - 18,
              "text-anchor": "middle",
              class: "axis-label",
            },
            label
          )
        );
      });

      svg.append(
        node("line", {
          x1: margin.left,
          y1: margin.top + innerH,
          x2: width - margin.right,
          y2: margin.top + innerH,
          class: "axis-line",
        })
      );
      svg.append(
        node("line", {
          x1: margin.left,
          y1: margin.top,
          x2: margin.left,
          y2: margin.top + innerH,
          class: "axis-line",
        })
      );
      svg.append(
        node(
          "text",
          {
            x: margin.left,
            y: 16,
            "text-anchor": "start",
            class: "axis-title",
          },
          meta.unit || ""
        )
      );
      svg.append(
        node(
          "text",
          {
            x: margin.left + innerW / 2,
            y: height - 4,
            "text-anchor": "middle",
            class: "axis-title",
          },
          modeLabel === "每日" ? "一天內時段" : modeLabel
        )
      );

      const planned = obs.planEventLabels(events);
      planned.forEach(function (event) {
        const eventX = x(event.index);
        svg.append(
          node("line", {
            x1: eventX,
            y1: margin.top,
            x2: eventX,
            y2: margin.top + innerH,
            class: "event-line",
          })
        );
        svg.append(
          node("circle", {
            cx: eventX,
            cy: margin.top + 5,
            r: 5,
            fill: event.tone,
            stroke: "#fff",
            "stroke-width": 2,
          })
        );
        if (event.showLabel) {
          svg.append(
            node(
              "text",
              {
                x: Math.min(Math.max(eventX + 6, margin.left), width - margin.right - 4),
                y: 30,
                class: "event-label",
              },
              event.shortLabel
            )
          );
        }
      });

      if (compare) {
        const prevPath = linePath(series.previous || [], x, y);
        if (prevPath) {
          svg.append(
            node("path", {
              d: prevPath,
              fill: "none",
              stroke: "#db1f64",
              "stroke-width": 3.2,
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              opacity: "0.9",
            })
          );
        }
      }

      const currPath = linePath(series.current || [], x, y);
      if (currPath) {
        svg.append(
          node("path", {
            d: currPath,
            fill: "none",
            stroke: meta.color || "#1487bd",
            "stroke-width": 4,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
          })
        );
      }

      function addPoints(values, sources, color, groupLabel, forceSquare) {
        (values || []).forEach(function (value, index) {
          if (!Number.isFinite(value)) return;
          const source = sources && sources[index];
          const asSquare = forceSquare || source === "visit";
          const sourceLabel =
            source === "visit" ? "就診帶出" : source === "diary" ? "日記" : "紀錄";
          let point;
          if (asSquare) {
            point = node("rect", {
              x: x(index) - 5,
              y: y(value) - 5,
              width: 10,
              height: 10,
              rx: 1,
              fill: color,
              stroke: "#fff",
              "stroke-width": 2,
              tabindex: "0",
            });
          } else {
            point = node("circle", {
              cx: x(index),
              cy: y(value),
              r: 6,
              fill: color,
              stroke: "#fff",
              "stroke-width": 2,
              tabindex: "0",
            });
          }
          point.setAttribute("role", "button");
          point.setAttribute(
            "aria-label",
            groupLabel +
              " " +
              labels[index] +
              " " +
              (meta.label || "") +
              " " +
              value +
              (meta.unit || "") +
              "（" +
              sourceLabel +
              "）"
          );
          const show = function (event) {
            if (!onShowTooltip) return;
            onShowTooltip(
              event,
              groupLabel + "・" + labels[index],
              (meta.label || "") + "：" + formatValue(value, meta) + "（" + sourceLabel + "）"
            );
          };
          if (onShowTooltip) {
            point.addEventListener("mouseenter", show);
            point.addEventListener("mousemove", show);
            point.addEventListener("focus", show);
          }
          if (onHideTooltip) {
            point.addEventListener("mouseleave", onHideTooltip);
            point.addEventListener("blur", onHideTooltip);
          }
          svg.append(point);
        });
      }

      if (compare) addPoints(series.previous, null, "#db1f64", "上一期間", true);
      addPoints(series.current, series.sources, meta.color || "#1487bd", "本期", false);

      return { empty: false, escapeHtml: escapeHtml };
    }

    function renderMini(svg, opts) {
      const cfg = opts || {};
      if (!svg) return { empty: true };

      const labels = Array.isArray(cfg.labels) ? cfg.labels : [];
      const series = cfg.series || { current: [] };
      const meta = cfg.meta || {};
      const width = 360;
      const height = 140;
      const margin = { top: 12, right: 10, bottom: 28, left: 32 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;
      const scale = obs.yScaleFor(meta, series, false);
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.replaceChildren();

      if (obs.isEmptySeries(series)) {
        svg.append(
          node(
            "text",
            {
              x: width / 2,
              y: height / 2,
              "text-anchor": "middle",
              class: "axis-label",
            },
            "尚無資料"
          )
        );
        return { empty: true };
      }

      const x = function (index) {
        return margin.left + (index / Math.max(1, labels.length - 1)) * innerW;
      };
      const y = function (value) {
        return margin.top + innerH - ((value - scale.min) / (scale.max - scale.min)) * innerH;
      };

      scale.ticks.forEach(function (tick) {
        svg.append(
          node("line", {
            x1: margin.left,
            y1: y(tick),
            x2: width - margin.right,
            y2: y(tick),
            class: "grid-line",
          })
        );
        const label = meta.scale === "weight" ? String(Math.round(tick * 10) / 10) : String(tick);
        svg.append(
          node(
            "text",
            {
              x: margin.left - 10,
              y: y(tick) + 4,
              "text-anchor": "end",
              class: "axis-label",
            },
            label
          )
        );
      });

      const path = linePath(series.current || [], x, y);
      if (path) {
        svg.append(
          node("path", {
            d: path,
            fill: "none",
            stroke: meta.color || "#1487bd",
            "stroke-width": 3,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
          })
        );
      }
      (series.current || []).forEach(function (value, index) {
        if (!Number.isFinite(value)) return;
        svg.append(
          node("circle", {
            cx: x(index),
            cy: y(value),
            r: 4,
            fill: meta.color || "#1487bd",
            stroke: "#fff",
            "stroke-width": 1.5,
          })
        );
      });

      const labelIndexes = [0, Math.floor((labels.length - 1) / 2), labels.length - 1].filter(
        function (v, i, arr) {
          return arr.indexOf(v) === i;
        }
      );
      labelIndexes.forEach(function (index) {
        svg.append(
          node(
            "text",
            {
              x: x(index),
              y: height - 8,
              "text-anchor": "middle",
              class: "axis-label",
            },
            labels[index]
          )
        );
      });

      return { empty: false };
    }

    return {
      renderMain: renderMain,
      renderMini: renderMini,
      node: node,
      linePath: linePath,
    };
  }

  root.domains.observations.createRenderer = createRenderer;
  root.domains.observations.node = node;
  root.domains.observations.linePath = linePath;
})(typeof window !== "undefined" ? window : globalThis);
