---
id: 20260918-observation-chart-projects
title: Observation chart projects (專案 layer above metric/title)
status: adopted
author: planner
candidate_branch: ""
candidate_path: "apps/web/tryouts/observation-chart/"
created: 2026-09-18
updated: 2026-09-18
# Gate B adopted 2026-09-18 — tryout project layer; ?v=20260918-projects
baseline: 20260918-observation-self-entry-ux
---

# Proposal: Observation chart projects

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Why a new proposal

Adopted `20260918-observation-self-entry-ux` (Gate B) is the **tryout baseline**: DIY metric + fill-in + slim chart. Keep it.

Victor’s evening ask (2026-09-18) is a **new entity**, not a title-string patch: each chart is an independent **project** (專案), with two create paths and title-row CRUD. Today there is no project list — one workspace, many metrics, auto `#chartTitle` `{metric}｜{mode}觀察趨勢` or a free-text `customTitle` overlay.

| | Adopted baseline | This proposal |
|--|--|--|
| Id | `20260918-observation-self-entry-ux` | `20260918-observation-chart-projects` |
| Unit | metric + diary points | **project** = one named chart |
| Title | auto or overlay input | **project.name is the h2** |
| Time | day/week/month/year buckets | kind A uses **visit dates**; kind B keeps DIY buckets |
| Surface | tryout | tryout (no C/B/Pages unless later cover) |

## Goal

On the observation-chart tryout, the user creates, selects, edits, and deletes **projects**. Each project is one chart. Create chooses Path A (visit-linked time backbone) or Path B (self-authored 0–10 metric). The chart-head title chrome is the project switcher, not a leftover auto string.

Success: Victor can tap 新建, name it, pick A or B, and later pick that project from the title row; switching projects swaps the whole chart.

## Entity

```text
ObservationProject {
  id            // e.g. proj_<n>
  name          // chart title; max 32 (phone h2); trim; required
  kind          // "visit-linked" | "self-metric"  — locked after create
  createdAt     // ISO
  visitIds      // kind A: ≥1 demo/timeline visit ids; X from those dates
  metricId      // kind B: one custom 0–10 metric; kind A may also bind one score series
}
```

One project = one chart instance. Active project drives series, title, and kind chrome.

## Recommended product direction (Planner default)

| Area | Direction |
|------|-----------|
| **Cardinality** | **P1** — 1 project = 1 chart = 1 metric. Overlay 2+ metrics = later. |
| **First paint** | **Q1** — seed two samples so the tryout is not empty: visit-linked from `v-2025-09-01`, self-metric 頭痛程度. |
| **Kind A axis** | **R1** — X buckets = linked visit dates (sorted). Hide day/week/month/year for that project. Kind B keeps the current mode segmented. |
| **Title chrome** | **S1** — visible name **is** `#chartTitle` h2; overflow menu = 選擇／新建／編輯／刪除. Drop auto `{metric}｜{mode}` as primary. Fallback only if name missing (should not happen if name is required). |
| **Edit** | **T2** — rename; kind A may relink visits. **Kind locked.** |
| **Metric toolbar** | Bound to the active project. Demote/hide `#metricSelect` as a second “which chart” control (it fights the project switcher). |
| **Compare** | Keep for kind B; hide for kind A (visit backbone has no “上一期間”). |
| **Delete** | Confirm. Remove project + its series/notes. **Never delete visits.** Last project gone → empty-state CTA **新建專案**. |
| **Persist** | Tryout bag only (`petlive-obs-tryout-store` / observations slice). Nest `projects[]` + `activeProjectId`. Demo mode must not write (I1). No formal passport `pets[]`. |

## In scope

1. **Domain** `projects.js`: list, get, create (kind A/B), rename, relink visits (A only), delete, set/get active, name normalize, kind helpers. No DOM.
2. **Controller** thin-wires projects API; switching active project rebuilds chart inputs (series, title, mode chrome). Do not grow CRUD algorithms in the controller.
3. **Titles** resolve h2 from `project.name` (not auto metric｜mode).
4. **Demo seed** (if Q1): 1–2 sample projects; reuse existing demo visits (`v-2025-09-01` etc.).
5. **Persist bag**: serialize projects + active id inside the tryout observations slice. Extend `persist.js` if present at build time; do **not** add a second localStorage key. Demo flag still blocks writes.
6. **Tryout facade**: replace `#chartTitleInput`-only chrome with compact project switcher (name + menu/sheet). Phone-first create flow: 新建 → name required → kind A or B → A: pick visit(s); B: create/bind metric (`metrics.addCustom` or empty series). Edit sheet; delete confirm. Bump `?v=`.
7. **QA** `qa/tests/web-observations-projects.test.js`: CRUD, kind lock, delete does not remove visits, last-delete empty, title from name, name clamp, demo write block if persist path is touched.
8. Empty vs empty-metric: no projects → 新建專案; project with no points → keep baseline 記第一筆觀察.

## Out of scope

- C nav, B cover, GitHub Pages, formal passport productize.
- Real timeline visits from passport `pets[]` (demo visit list only).
- Cloud sync.
- User-defined phase bands.
- Changing `kind` after create.
- Multi-metric overlay on one project (unless Victor picks P2).
- Growing algorithms in `app.js` / `c/app.js` / `tryout-wire.js` as the brain.
- Patching adopted self-entry-ux as if this were leftover polish.

## Create / select / edit / delete (phone-first)

1. **新建** — sheet: name (required, max 32) → kind A or B.
   - **A 串接就診日期:** pick ≥1 from demo visits; chart X = those dates; start-tracking marker on first/selected start visit OK.
   - **B 自主觀察指標:** name a 0–10 metric (reuse `addCustom`) or bind empty series; diary points as today (baseline fill-in).
2. **選擇** — menu/sheet of project names on the title row; current name is the h2.
3. **編輯** — rename; kind A may change `visitIds`; kind stays locked.
4. **刪除** — confirm copy that this chart’s scores/notes go away; visits stay.

## Tier 2 — layers & files

Name the block **before** coding: domain `projects.js`, then controller/titles/seed/persist thin-wire, then tryout chrome.

| Layer | Path | Change |
|-------|------|--------|
| Domain | `apps/web/domains/observations/projects.js` | **New brain** — CRUD, list, active id, kind helpers, name normalize |
| Domain | `apps/web/domains/observations/controller.js` | Thin wrap: active project, switch, create/edit/delete; no list algorithms |
| Domain | `apps/web/domains/observations/titles.js` | Title from `project.name` |
| Domain | `apps/web/domains/observations/demo-seed.js` | Optional sample projects (Q1) |
| Domain | `apps/web/domains/observations/persist.js` | If present: bag fields `projects`, `activeProjectId`; version bump if needed |
| Domain | `apps/web/domains/observations/chart.js` | Kind A: X from visit labels; no new clinical bands |
| Domain | `apps/web/domains/observations/metrics.js` / `series.js` / `diary.js` | Reuse; kind B bind/create custom; do not fork |
| Tryout facade | `apps/web/tryouts/observation-chart/index.html` | Title-row switcher markup; create/edit/delete sheets; script tag for `projects.js` **before** controller/tryout-wire; bump `?v=` |
| Tryout facade | `apps/web/tryouts/observation-chart/tryout-wire.js` | Events + paint only |
| QA | `qa/tests/web-observations-projects.test.js` | New (or extend blocks test if tiny) |

**Not shell:** this chrome lives in the tryout chart panel, not passport floating dock. No `apps/web/shell/*` unless a later C cover.

**Load order:** `projects.js` after metrics/series, before `controller.js` and `tryout-wire.js`.

## Risks

- **Medical disclaimer** — a visit-linked project named like 「治療成效」 can read as outcome tracking. Keep non-diagnostic tryout note; do not add “療效/診斷” copy. Legal only if disclaimer expands.
- **Demo vs real** — seeded projects + demo visits can look like the user’s passport timeline. Label 示範專案 / 試用就診; tryout store ≠ formal `pets[]`.
- **Delete data-loss** — confirm; never delete visits; last project → empty CTA, not a blank broken SVG.
- **XSS** — project names are user text. Paint with `textContent` / existing `escapeHtml`; no `innerHTML` of raw names (menu items included).
- **I1 demo write** — demo mode must not persist projects into the tryout bag.
- **Axis confusion** — if kind A still shows day/week/month/year, Path A fails Victor’s “就診日期當時間軸”. R1 avoids that.
- **Dual pickers** — leaving `#metricSelect` as a second chart switcher undoes the project model (P1).

## Acceptance criteria

- [ ] User can **新建專案** with a required name and kind A or B; kind is stored and not changeable in edit.
- [ ] Kind A: pick ≥1 demo visits; chart X uses those visit dates (if R1) or documents the chosen R letter.
- [ ] Kind B: bind/create one 0–10 metric; diary fill-in still plots dots (baseline).
- [ ] Title row: current project name is the h2; user can select among projects, edit, delete.
- [ ] Switching project swaps series + title + kind chrome (not only the string).
- [ ] Delete confirms; series/notes for that project gone; demo visits remain.
- [ ] Zero projects → empty CTA 新建專案 (not auto title 「頭痛程度｜每週觀察趨勢」).
- [ ] Tryout persist bag holds `projects` + `activeProjectId` when not demo; demo write blocked.
- [ ] No C/B/Pages; brains in `domains/observations/projects.js`; tryout-wire stays thin.
- [ ] Disclaimer still non-diagnostic; zh-Hant; names escaped.

## Review routing (after Gate A + Builder)

| Reviewer | This candidate |
|----------|----------------|
| **UI** | **required** (title switcher, create sheets, empty CTA, phone overflow) |
| **QA** | **required** (CRUD, kind lock, axis by kind, persist/demo, XSS paint smoke) |
| **Pharmacist** | **skip** (no dosing / Rx) |
| **Legal** | **skip** unless disclaimer / claim text expands |
| **Security** | light — escape names; tryout key only; I1 demo block; no secrets |

## Gate A decision list

Reply with letters (e.g. `P1 Q1 R1 S1 T2`) then「確認」, or「修改：…」.

**P — Project : chart : metric**  
P1) 1 project = 1 chart = 1 metric; switch swaps the whole chart (**recommend**)  
P2) 1 project = 1 chart overlaying 2+ metrics  
P3) Project is only a named title; workspace stays many-metrics (weak — not an independent 專案)

**Q — First-open seed**  
Q1) Seed 2 samples: visit-linked from 9/1 visit + self-metric 頭痛程度 (**recommend**)  
Q2) Empty + CTA 新建專案 only  
Q3) Seed 1 self-metric only; visit-linked created by user

**R — Visit-linked time axis**  
R1) Kind A: X = linked visit dates; hide day/week/month/year. Kind B keeps mode segmented (**recommend**)  
R2) Both kinds keep day/week/month/year; visit is start marker / jump only  
R3) Kind A uses visit dates as X **and** still shows mode segmented (heavier; later)

**S — Title chrome**  
S1) Project name **is** the h2; overflow menu = 選擇／新建／編輯／刪除 (**recommend**)  
S2) Separate project `<select>` + h2 still auto/custom  
S3) Keep `#chartTitleInput` and add a picker below

**T — Edit scope**  
T1) Rename only  
T2) Rename + kind A relink visits; kind locked (**recommend**)  
T3) Also allow changing kind after create (out of recommended v1)

---

## Notes for Victor

**Gate B adopted** 2026-09-18. Tryout at `apps/web/tryouts/observation-chart/?v=20260918-projects` is the project-layer baseline. No B cover / Pages in this proposal. Carry-forward polish: UI-1/UI-2 side panel vs project model.
