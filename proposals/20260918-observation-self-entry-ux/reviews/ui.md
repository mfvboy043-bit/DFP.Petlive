# UI review — `20260918-observation-self-entry-ux`

- **Reviewer:** UI (independent)
- **Candidate:** `apps/web/tryouts/observation-chart/` + `apps/web/domains/observations/`
- **Gate A locked:** J1 K1 L1 M1 N2 O1
- **Live check:** `http://127.0.0.1:5173/apps/web/tryouts/observation-chart/` → **200** (reviewed at ~390×844)
- **Date:** 2026-09-18

## Verdict

**conditional**

## Summary

Phase 1 declutter lands: fixed clinical phase bands are gone, legend is short (本期 / 上一期間 / 日記點), and the chart shows a single「開始追蹤」marker — a clear step away from the Botox-band look. DIY self-entry exists (新增我的指標 + 分數／時間點 form + empty CTA → focus diary), and disclaimer copy stays calm / non-diagnostic.

The blocking UX hazard is **體重 (kg) still selectable in the diary form while the control is hard-locked to 0–10** (HTML `max=10` + copy「分數（0–10）」), so realistic kg values cannot be entered. On phone-width, DIY tools are also **far below the fold** (after chart / mini / summary / disclaimer + template metric cards), so “obvious beside” self-entry is weaker than the Gate A DIY story implies. Empty-state still leaves a full legend under a hidden chart.

## Issues

### UI-1 — Weight chart vs 0–10 diary form (mismatch)
- **Severity:** high
- **Where:** diary form `#diaryValue` / label「分數（0–10）」; metric「體重」in `#diaryMetric` / `#metricSelect`
- **Observation:** Chart Y-axis for 體重 is kg (~62–63). Form stays `min=0 max=10` with label「分數（0–10）」. Entering `62` fails native validity (`值必須小於或等於 10。`). Hazard is visible whenever 體重 is chosen in the fill form.
- **Why it matters:** Users can pick the weight series and are then blocked from logging a plausible value — undermines self-fill credibility even though custom 0–10 metrics work.

### UI-2 — DIY add + fill form hard to find on ~390px
- **Severity:** medium
- **Where:** `.side-panel` / `.side-tools` after `.metricCards`; phone-first single column
- **Observation:** At 390×844,「新增我的指標」sits ~2400px down (~2300px scroll). Template metric cards render **above** the DIY add block. Story/subtitle still say「側欄」though layout is stacked below the chart, not beside it.
- **Why it matters:** Gate A wants DIY prominence; L1 keeps demo first paint, but mobile findability of the primary self-entry path is weak until long scroll.

### UI-3 — Empty metric still shows full legend
- **Severity:** low
- **Where:** `.legend-row` while `#emptyState[data-show=true]` / `#mainChartWrap[data-empty=true]`
- **Observation:** Empty custom metric correctly hides the SVG and shows「記第一筆觀察」CTA (focuses `#diaryValue`). Legend remains visible:「本期 / 上一期間 / 日記點」with no series on screen. Compare-off correctly hides「上一期間」when a chart is shown.
- **Why it matters:** Empty state should teach “no points yet”; leftover legend reads as leftover chrome.

### UI-4 — Demo「開始追蹤」shared onto DIY custom series
- **Severity:** low
- **Where:** shared `modeData.events` → chart event label when custom metric has points
- **Observation:** Empty custom clears the chart (no event). After the first diary point, the demo「開始追蹤」dashed marker can still appear on a user-named metric.
- **Why it matters:** Slightly reintroduces clinic/demo story onto a personal notebook series; not as loud as old 調劑／回診 clutter, but dilutes DIY purity.

## Checks

| Check | Result | Notes |
|-------|--------|-------|
| Visual declutter vs Botox bands | **pass** | No phase wash / band legend; grid-only background (J1) |
| Legend length | **pass** | Slim kid-readable set; no 基準觀察／治療追蹤／調整與回診 |
| Empty-state legend behavior | **fail** | Full legend remains while chart hidden (UI-3) |
| Event label clarity (single start) | **pass** | Only「開始追蹤」; no 調劑／回診 (K1) |
| DIY prominence — desktop (~phone column) | **conditional** | Controls present & labeled; buried under templates + long page (UI-2) |
| DIY prominence — ~390px mobile | **fail** | Add-metric + value/index form below fold; not “beside” (UI-2) |
| Empty CTA usability | **pass** | CTA visible; focuses diary score field |
| Mobile chart overflow | **pass** | No horizontal page overflow at 390; SVG scales in column |
| Copy: DIY language, no fake 治療階段 | **pass** | Notebook framing; no 治療階段／調劑／回診 story |
| Disclaimer calm | **pass** | Non-diagnostic; no treatment-effect claim |
| Weight + 0–10 form mismatch | **fail** | Visible hazard; kg blocked by 0–10 control (UI-1) |

## Gate A alignment (UI lens)

| Decision | UI read |
|----------|---------|
| J1 bands off | Met |
| K1 one start marker | Met |
| L1 demo first + DIY obvious | Demo first paint OK; DIY “obvious” weak on mobile |
| M1 side form value+index | Present; phone stack ≠ side |
| N2 hide visit squares | Met in legend/current series (diary circles) |
| O1 prior frozen | Not re-reviewed; candidate path only |

## Notes

- Did **not** read `reviews/qa.md` or other review files.
- Did **not** edit `apps/web` product code.
- No code patches in this review.
