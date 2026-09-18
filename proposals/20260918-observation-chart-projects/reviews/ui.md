# UI review — `20260918-observation-chart-projects`

- **Reviewer:** UI (independent)
- **Candidate:** `apps/web/tryouts/observation-chart/` + `apps/web/domains/observations/` (projects layer)
- **Gate A locked:** P1 Q1 R1 S1 T2
- **Live check:** `http://127.0.0.1:5173/apps/web/tryouts/observation-chart/?v=20260918-projects` → **200** (smoke at ~390px phone column)
- **Date:** 2026-09-18

## Verdict

**conditional**

## Summary

The project layer reads clearly at the chart head: **`#chartTitle` is the active project name** (demo seeds show「9/1 就診追蹤（示範）」), the **⋯ overflow menu** exposes 選擇／新建／編輯／刪除, and **bottom sheets** cover create (name → kind A/B → visits or metric), select, and edit (rename + kind A relink, kind locked). **Kind A** hides day/week/month/year and compare; subtitle states visit-date X axis. **Kind B** keeps mode segmented control (code + CSS). **`#metricSelect` is hidden**; bound metric shows as read-only「此專案指標」. Zero-project empty CTA **新建專案** and delete confirm copy match proposal intent. **Non-diagnostic disclaimer** unchanged and appropriate.

Victor can likely **新建 A/B and switch projects from the title row** without treating the old metric picker as “the chart.” The main confusion risk is the **unchanged side panel**, which still teaches “先新增自己的指標” and offers **新增我的指標** as if it were the primary chart-creation path—parallel to **新建專案 → B · 自主觀察指標**, not wired as one mental model (P1).

## Issues

### UI-1 — Side panel still metric-first; fights「一專案＝一張圖」
- **Severity:** medium
- **Where:** `.side-title` / `.side-tools` copy; `#metricCards`; `#addMetricBtn` block in `index.html`
- **Observation:** Story banner and chart subtitle say 專案／選單新建, but side panel headline remains「先新增自己的指標，再記分數」and「新增我的指標」with template metric cards above the diary form. Metric cards scroll-focus the diary but do **not** switch projects (wire comment: P1 bound metric).
- **Why it matters:** On a long phone scroll, users may create metrics or tap template cards expecting a new chart, while the real chart switcher is only on the title ⋯ menu—undermines Gate A P1/S1 clarity.

### UI-2 — Two paths to “new 0–10 metric” (sidebar vs create sheet B)
- **Severity:** medium
- **Where:** `tryout-wire.js` `addCustomMetric()` vs `openCreateSheet()` kind `self-metric`
- **Observation:** Sidebar **新增** calls `controller.addCustomMetric` on the **active** project’s metric registry; **新建專案 → B** creates a **new project** + metric. No UI explains that sidebar add does not open a new project.
- **Why it matters:** Path B create flow is correct in the sheet, but sidebar duplicate entry point makes「專案」feel like a rename layer over the old notebook, not the unit of chart ownership.

### UI-3 — Delete confirm uses native `window.confirm`
- **Severity:** low
- **Where:** `confirmDeleteProject()` in `tryout-wire.js`
- **Observation:** Copy is good (scores/notes removed; visits kept). Pattern differs from create/edit **bottom sheets** and can feel abrupt on mobile Safari.
- **Why it matters:** Not blocking for tryout v1; polish / consistency with sheet CRUD.

### UI-4 — Overflow control slightly under common touch target
- **Severity:** low
- **Where:** `.project-menu-btn` 40×40px; menu items ~padding 10px
- **Observation:** Meets visual clarity; a few px shy of 44px HIG-style targets. Menu dismisses on outside tap (expected); automated menuitem click was flaky once (possible race with document listener)—worth a quick manual tap pass on device.
- **Why it matters:** Title-row CRUD is the primary control; marginal miss on small phones.

### UI-5 — Zero-project h2 placeholder「新建專案」
- **Severity:** low
- **Where:** `paintTitle()` when no active project; empty state `#emptyCreateProjectCta`
- **Observation:** h2 reads like a button label while CTA also says 新建專案; acceptable with empty copy「尚未有專案…」.
- **Why it matters:** Minor; only on last-delete / cleared store.

## Gate A UX checks (S1 / R1 / Q1 + P1 / T2)

| Check | Result | Notes |
|-------|--------|-------|
| **S1** Project name **is** `#chartTitle` h2 | **pass** | Demo + user names via `textContent`; no primary auto `{metric}｜{mode}` |
| **S1** Overflow 選擇／新建／編輯／刪除 | **pass** | Menu uses 選擇專案／新建專案 (minor wording vs proposal slash list) |
| **S1** Create sheet: name required, kind A/B | **pass** | Visit checklist (A); metric name field (B); validation messages zh-Hant |
| **S1** Select sheet lists projects, current highlighted | **pass** | `aria-current` on active row |
| **T2** Edit: rename; A relink visits; kind locked | **pass** | Kind shown as locked hint; visit block for visit-linked only |
| **R1** Kind A: hide mode segmented + compare | **pass** | `.toolbar[data-kind="visit-linked"]` + `hidesCompare()`; live smoke on demo A |
| **R1** Kind B: keep mode + compare | **pass** | Controller + CSS; switch via 選擇專案 (code path) |
| **Q1** Seed two demo projects with（示範） | **pass** | `demo-seed.js` names; story banner calls out 示範 |
| **P1** `#metricSelect` demoted | **pass** | `#metricSelectField` hidden; bound label only |
| **P1** Switch project swaps chart chrome + series | **pass** | Wire re-renders on `setActiveProject`; kind chrome repaints |
| Zero projects → CTA 新建專案 | **pass** | Empty state toggles CTA vs 記第一筆 |
| Project with no points → 記第一筆 | **pass** | Baseline empty copy retained |
| zh-Hant copy | **pass** | Consistent Traditional Chinese in chrome and sheets |
| Non-diagnostic disclaimer | **pass** | `.medical-note` unchanged; no 療效 claim |
| **Can Victor grasp 專案 = independent chart?** | **conditional** | Chart head + banner yes; side panel still old notebook (UI-1, UI-2) |

## Notes

- Did **not** read other `reviews/*` or iteration reviewer files.
- Did **not** edit `apps/web` product code.
- Visual smoke: active demo visit-linked project, chart with visit-date X labels, ⋯ menu four actions; full create/switch/delete loop verified in code; device tap on menu items recommended for UI-4.
