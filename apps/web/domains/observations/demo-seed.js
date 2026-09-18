(function initPetLiveWebObservationsDemoSeed(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.observations = root.domains.observations || {};

  function getDefaultMetricMeta() {
    return {
      headache: {
        label: "頭痛程度",
        unit: "分",
        max: 10,
        direction: "數值越高代表不適越明顯",
        color: "#1487bd",
        colorClass: "",
        scale: "fixed10",
      },
      sleep: {
        label: "睡眠品質",
        unit: "分",
        max: 10,
        direction: "數值越高代表睡眠品質越好",
        color: "#2aa99d",
        colorClass: "green",
        scale: "fixed10",
      },
      gi: {
        label: "腸胃不適程度",
        unit: "分",
        max: 10,
        direction: "數值越高代表腸胃不適越明顯",
        color: "#e8873a",
        colorClass: "orange",
        scale: "fixed10",
      },
      urinary: {
        label: "泌尿不適程度",
        unit: "分",
        max: 10,
        direction: "數值越高代表泌尿不適越明顯",
        color: "#7b6cc7",
        colorClass: "purple",
        scale: "fixed10",
      },
      weight: {
        label: "體重",
        unit: "kg",
        max: null,
        direction: "以公斤顯示；Y 軸依本期／上期資料範圍自動調整",
        color: "#5a7a92",
        colorClass: "weight",
        scale: "weight",
      },
    };
  }

  function getDemoVisits() {
    return [
      { id: "", label: "不連結就診", date: "" },
      { id: "v-2025-09-01", label: "2025-09-01 門診・開始追蹤", date: "2025-09-01" },
      { id: "v-2025-09-15", label: "2025-09-15 門診", date: "2025-09-15" },
      { id: "v-2025-09-29", label: "2025-09-29 門診", date: "2025-09-29" },
    ];
  }

  /**
   * Q1 seed: visit-linked from v-2025-09-01 arc + self-metric 頭痛程度.
   * Labels include 示範 so users know these are samples.
   */
  function createDemoProjects() {
    return [
      {
        id: "proj_demo_visit",
        name: "9/1 就診追蹤（示範）",
        kind: "visit-linked",
        createdAt: "2025-09-01T00:00:00.000Z",
        visitIds: ["v-2025-09-01", "v-2025-09-15", "v-2025-09-29"],
        metricId: "headache",
      },
      {
        id: "proj_demo_headache",
        name: "頭痛程度（示範）",
        kind: "self-metric",
        createdAt: "2025-09-01T00:00:00.000Z",
        visitIds: [],
        metricId: "headache",
      },
    ];
  }

  function createDemoVisitSeries(metricId) {
    const id = metricId || "headache";
    const axis =
      typeof root.domains.observations.buildVisitAxis === "function"
        ? root.domains.observations.buildVisitAxis(getDemoVisits(), [
            "v-2025-09-01",
            "v-2025-09-15",
            "v-2025-09-29",
          ])
        : { label: "就診", labels: ["9/1", "9/15", "9/29"], events: [], visitIds: [] };
    const modeData = {
      label: axis.label,
      labels: axis.labels.slice(),
      events: (axis.events || []).map(function (ev) {
        return Object.assign({}, ev);
      }),
    };
    modeData[id] = {
      current: [7, 4, 3],
      previous: [null, null, null],
      sources: ["visit", "visit", "visit"],
    };
    return modeData;
  }

  function createDemoViewData() {
    return {
      day: {
        label: "每日",
        labels: [
          "00:00",
          "02:00",
          "04:00",
          "06:00",
          "08:00",
          "10:00",
          "12:00",
          "14:00",
          "16:00",
          "18:00",
          "20:00",
          "22:00",
          "24:00",
        ],
        events: [
          {
            index: 4,
            label: "08:00 開始用藥／就診起追蹤",
            shortLabel: "開始追蹤",
            kind: "med",
            visitId: "v-2025-09-01",
          },
        ],
        headache: {
          current: [2, 2, 3, 5, 7, 6, 5, 6, 4, 3, 3, 2, 2],
          previous: [3, 3, 4, 5, 6, 6, 7, 6, 5, 5, 4, 4, 3],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
          ],
        },
        sleep: {
          current: [7, 7, 6, 5, 4, 4, 5, 5, 6, 6, 7, 8, 8],
          previous: [6, 6, 5, 5, 5, 4, 4, 5, 5, 6, 6, 7, 7],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
          ],
        },
        gi: {
          current: [1, 1, 2, 2, 3, 3, 2, 2, 2, 1, 1, 1, 1],
          previous: [2, 2, 2, 3, 3, 4, 3, 3, 2, 2, 2, 2, 1],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
          ],
        },
        urinary: {
          current: [2, 2, 2, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1],
          previous: [3, 3, 3, 3, 4, 3, 3, 2, 2, 2, 2, 2, 2],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
          ],
        },
        weight: {
          current: [62.4, 62.4, 62.4, 62.4, 62.4, 62.4, 62.4, 62.4, 62.4, 62.4, 62.4, 62.4, 62.4],
          previous: [62.8, 62.8, 62.8, 62.8, 62.8, 62.8, 62.8, 62.8, 62.8, 62.8, 62.8, 62.8, 62.8],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
          ],
        },
      },
      week: {
        label: "每週",
        labels: ["週一", "週二", "週三", "週四", "週五", "週六", "週日"],
        events: [
          {
            index: 0,
            label: "開始用藥／就診起追蹤",
            shortLabel: "開始追蹤",
            kind: "med",
            visitId: "v-2025-09-01",
          },
        ],
        headache: {
          current: [7, 6, 5, 3, 4, 3, 3],
          previous: [8, 7, 7, 6, 5, 5, 4],
          sources: ["visit", "diary", "diary", "diary", "diary", "diary", "visit"],
        },
        sleep: {
          current: [4, 5, 5, 7, 6, 7, 8],
          previous: [3, 4, 4, 5, 5, 6, 6],
          sources: ["diary", "diary", "diary", "diary", "diary", "diary", "diary"],
        },
        gi: {
          current: [5, 4, 3, 3, 2, 2, 2],
          previous: [6, 5, 5, 4, 4, 3, 3],
          sources: ["visit", "diary", "diary", "diary", "diary", "diary", "diary"],
        },
        urinary: {
          current: [4, 4, 3, 2, 2, 2, 1],
          previous: [5, 5, 4, 4, 3, 3, 2],
          sources: ["diary", "diary", "diary", "diary", "diary", "diary", "visit"],
        },
        weight: {
          current: [63.1, 62.9, 62.8, 62.6, 62.5, 62.4, 62.3],
          previous: [63.6, 63.5, 63.4, 63.3, 63.2, 63.1, 63.0],
          sources: ["visit", "diary", "diary", "diary", "diary", "diary", "diary"],
        },
      },
      month: {
        label: "每月",
        labels: ["1日", "4日", "7日", "10日", "13日", "16日", "19日", "22日", "25日", "28日", "30日"],
        events: [
          {
            index: 0,
            label: "9/1 開始用藥／就診起追蹤",
            shortLabel: "開始追蹤",
            kind: "med",
            visitId: "v-2025-09-01",
          },
        ],
        headache: {
          current: [8, 6, 4, 3, 3, 4, 3, 2, 3, 4, 3],
          previous: [8, 7, 6, 5, 4, 5, 5, 4, 5, 5, 4],
          sources: [
            "visit",
            "diary",
            "diary",
            "diary",
            "diary",
            "visit",
            "diary",
            "diary",
            "diary",
            "visit",
            "diary",
          ],
        },
        sleep: {
          current: [3, 4, 6, 7, 7, 6, 7, 8, 7, 6, 8],
          previous: [3, 4, 4, 5, 6, 5, 5, 6, 6, 6, 7],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
          ],
        },
        gi: {
          current: [6, 5, 4, 3, 3, 3, 2, 2, 2, 2, 2],
          previous: [7, 6, 5, 5, 4, 4, 4, 3, 3, 3, 3],
          sources: [
            "visit",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
          ],
        },
        urinary: {
          current: [5, 4, 4, 3, 3, 2, 2, 2, 2, 1, 1],
          previous: [6, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "visit",
            "diary",
            "diary",
            "diary",
            "visit",
            "diary",
          ],
        },
        weight: {
          current: [63.8, 63.5, 63.2, 63.0, 62.8, 62.7, 62.6, 62.5, 62.4, 62.3, 62.2],
          previous: [64.2, 64.1, 64.0, 63.9, 63.8, 63.7, 63.6, 63.5, 63.5, 63.4, 63.3],
          sources: [
            "visit",
            "diary",
            "diary",
            "diary",
            "diary",
            "visit",
            "diary",
            "diary",
            "diary",
            "visit",
            "diary",
          ],
        },
      },
      year: {
        label: "每年",
        labels: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        events: [
          {
            index: 8,
            label: "9月 開始用藥／就診起追蹤",
            shortLabel: "開始追蹤",
            kind: "med",
            visitId: "v-2025-09-01",
          },
        ],
        headache: {
          current: [5, 5, 4, 4, 3, 4, 5, 7, 4, 3, 2, 3],
          previous: [5, 5, 5, 4, 4, 4, 5, 5, 6, 5, 4, 4],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "visit",
            "diary",
            "visit",
            "diary",
          ],
        },
        sleep: {
          current: [6, 6, 7, 7, 7, 6, 6, 4, 7, 8, 8, 7],
          previous: [6, 6, 6, 6, 7, 7, 6, 6, 5, 6, 6, 6],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
          ],
        },
        gi: {
          current: [3, 3, 2, 2, 2, 3, 3, 4, 3, 2, 2, 2],
          previous: [3, 3, 3, 3, 2, 2, 3, 3, 4, 3, 3, 3],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "visit",
            "diary",
            "diary",
            "diary",
          ],
        },
        urinary: {
          current: [2, 2, 2, 2, 3, 2, 2, 3, 2, 1, 1, 1],
          previous: [2, 2, 2, 3, 3, 2, 2, 2, 3, 2, 2, 2],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "visit",
            "diary",
            "visit",
            "diary",
          ],
        },
        weight: {
          current: [61.5, 61.7, 61.9, 62.0, 62.2, 62.4, 62.8, 63.4, 62.7, 62.4, 62.2, 62.1],
          previous: [61.2, 61.3, 61.4, 61.5, 61.6, 61.8, 62.0, 62.2, 62.5, 62.6, 62.7, 62.8],
          sources: [
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "diary",
            "visit",
            "diary",
            "visit",
            "diary",
          ],
        },
      },
    };
  }

  root.domains.observations.getDefaultMetricMeta = getDefaultMetricMeta;
  root.domains.observations.getDemoVisits = getDemoVisits;
  root.domains.observations.createDemoViewData = createDemoViewData;
  root.domains.observations.createDemoProjects = createDemoProjects;
  root.domains.observations.createDemoVisitSeries = createDemoVisitSeries;
})(typeof window !== "undefined" ? window : globalThis);
