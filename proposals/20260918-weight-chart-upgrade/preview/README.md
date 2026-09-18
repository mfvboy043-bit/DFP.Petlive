# 健康觀察圖表｜試用版（Tier 2 blocks）

Standalone tryout for proposal `20260918-weight-chart-upgrade`.  
Demo seed only (H1). **Layout:** phone-first (~430px column).

Brains live under `apps/web/domains/observations/` (IIFE → `PetLiveWeb.domains.observations.*`).  
Preview wire is thin DOM only — do **not** dump algorithms into `apps/web/app.js` / `c/app.js`.  
`domains/weight` stays independent; weight appears only as a demo metric entry.

## Block map

| File | Owns |
|------|------|
| `metrics.js` | Registry: `createRegistry`, `listIds`, `get`, `addCustom` (0–10), `formatValue` |
| `series.js` | `isEmptySeries`, `emptySeries`, `ensureSeriesShape`, `yScaleFor` |
| `events.js` | `shortLabelFor`, `toneForKind`, `planEventLabels` (density / first-per-index) |
| `diary.js` | `createNote`, `applyDiaryPoint` |
| `summary.js` | `computePeriodSummary` |
| `chart.js` | SVG only: `createRenderer` → `renderMain` / `renderMini` (viewBox 360) |
| `demo-seed.js` | `getDefaultMetricMeta`, `getDemoVisits`, `createDemoViewData` |
| `controller.js` | `createController` — mode/metric/secondary/compare + addCustom / addDiaryPoint |
| `preview/tryout-wire.js` | Selects, cards, listeners, tooltip DOM — calls controller + chart |
| `shell/observation-tryout.css` | iframe host chrome only (C/B) |

## Open locally

From repo root (`/Users/victorwu/Desktop/petlive`):

```bash
python3 -m http.server 5173 --bind 0.0.0.0 --directory /Users/victorwu/Desktop/petlive
```

Then open:

```text
http://127.0.0.1:5173/proposals/20260918-weight-chart-upgrade/preview/observation-chart.html?v=20260918-blocks
```

## Locked decisions (Gate A)

| ID | Choice | Meaning in this tryout |
|----|--------|------------------------|
| A1 | Standalone preview HTML | This folder + shared domain blocks |
| B2 | Human examples | 頭痛／睡眠／腸胃／泌尿等 |
| C1 | Weight is one Y metric | 「體重」in demo metric list only |
| D2 | Free diary + optional visit link | 日記區＋「連結就診（選填）」 |
| E1 | 0–10 metrics; weight exception | Non-weight = 0–10；體重 Y = data-driven kg |
| F3 | Diary + visit-derived points | Circles = 日記；squares = 就診帶出 |
| G2 | Visit + med markers | 就診／用藥開始／劑量調整 |
| H1 | Demo seed only | No `pets[]` / localStorage product writes |
| I1 | zh-Hant only | UI strings Traditional Chinese |

## Disclaimer

Page shows a non-diagnostic medical note. Charts describe recorded change only — not diagnosis or treatment advice.

## Verify

```bash
node --test qa/tests/web-observations-blocks.test.js
```

Script order in `observation-chart.html`: metrics → series → events → diary → summary → demo-seed → chart → controller → tryout-wire (`?v=20260918-blocks`).
