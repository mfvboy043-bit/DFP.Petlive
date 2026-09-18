# UI review — 20260918-weight-chart-upgrade (iteration 1)

- verdict: **conditional**
- reviewer: UI (independent; did not read qa.md / other reviews)
- candidate: `proposals/20260918-weight-chart-upgrade/preview/observation-chart.html`
- reference: `/Users/victorwu/Documents/Codex/2026-09-18/new-chat/outputs/健康觀察圖表_試用版.html`
- URL: `http://127.0.0.1:5173/proposals/20260918-weight-chart-upgrade/preview/observation-chart.html`
- locked: A1 B2 C1 D2 E1 F3 G2 H1 I1
- method: HTML/CSS/JS read + live open (desktop ~1280, phone ~390)

## Summary

Tryout chrome is **visually close** to the reference: same token palette, panel radius/shadow, segmented day/week/month/year, compare toggle, banded SVG chart, mini + summary lower grid, sticky side metrics, zh-Hant only. Locked extras (weight metric, diary/visit point legend, story banner, custom metric + empty state, diary form) read as intentional Gate A scope, not random drift.

Blocking visual gap for this iteration: **event-label density** on month/year (and long week labels) when visit + med share an index — stagger helps, but labels still collide into one unread line at the left/top of the chart.

## Issues

### UI-1 — Event labels too dense on co-located markers (month / year)

- severity: **medium**
- where: main SVG event layer; `viewData.month.events` / `viewData.year.events` (also long week copy)
- evidence:
  - Month: two markers at index `0` → labels `9/1 就診・開立處方` @ y=28 and `開始用藥` @ y=46, same x. Live phone/desktop paint reads as one concatenated red string over the first dashed line.
  - Year: same pattern at Sep (`9月就診・開始追蹤` + `用藥開始`).
  - Week: single markers but longer than reference (`用藥開始（接續 9/1）` vs reference `開始用藥`), so early-axis chrome feels heavier.
- vs reference: reference uses short labels and **one event per index** (week/month/year), alternating y only by event order — no same-x stack.
- ask: shorten labels and/or avoid stacking two full titles on one x (combine into one marker, or tuck secondary into tooltip / abbreviated second line with clearer separation).

### UI-2 — Empty custom metric: chart hidden, legend still painted

- severity: **low**
- where: `#emptyState` + `.legend-row` when `data-empty="true"`
- evidence: add「疲勞程度」→ empty dashed panel + summary `—` / `0%` work; `#mainChartWrap` correctly `display: none`; `.legend-row` remains `display: flex` under the empty box (本期／上一期間／日記點…).
- ask: hide or mute legend while empty so the empty state is the only chart chrome.

### UI-3 — Empty-state copy says「右側」on stacked mobile layout

- severity: **low**
- where: `#emptyState` copy
- evidence: at ~390px `.workspace` is single column; side tools sit **below** the chart, not to the right.
- ask: viewport-neutral wording (e.g.「側欄／下方指標積木」) or omit direction.

## Checks (requested focus)

| Focus | Result |
|-------|--------|
| Visual closeness to reference | **Mostly pass** — shell/toolbar/chart/bands/compare/legend language match; story banner + diary/custom tools are expected A1/D2/F3 expansions |
| Mobile overflow (chart scroll) | **Pass** — `@media (max-width: 760px)` sets `.chart-wrap { overflow-x: auto }` and `#mainChart { min-width: 690px }`; at 390px wrap `clientWidth≈368` / `scrollWidth≈698`, `canScroll: true` |
| Tooltip | **Pass** — absolute card in wrap; focus/hover shows title + value + source (日記／就診帶出); clamped inside wrap; matches reference interaction model |
| Segmented control | **Pass** — 4-col pill group, full-width on ≤760px, `aria-pressed` paint identical to reference |
| Summary / mini / side layout | **Pass** on desktop (`workspace` ~915+300, `lower-grid` ~1fr+220). Mid-width: candidate stacks side column (1100px) instead of reference’s 4-col metric strip — acceptable given extra side tools; not filed as a defect |
| Empty custom metric | **Pass** functionally (empty panel + cleared summary); polish → UI-2 / UI-3 |
| Event label density | **Fail polish** → **UI-1** |

## Locked-decision UI notes (non-issues)

- **B2 / I1:** Human symptom labels (頭痛等) + zh-Hant only — aligned.
- **C1 / E1:** Weight as metric with data-driven kg Y — present; side card notes「Y 軸依資料範圍」.
- **F3 / G2:** Legend distinguishes 日記點 / 就診帶出; dashed visit+med markers present.
- **H1:** Demo badge / story banner make demo-seed clear.
- Disclaimer medical note visible under lower grid.

## Verdict rationale

**conditional** — ship-quality tryout chrome and layout fidelity are good enough for Gate B discussion, but **UI-1** should be tightened before calling the candidate visually finished against the reference. UI-2 / UI-3 are non-blocking polish.

No code patched (review only).
