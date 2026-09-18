# QA review — `20260918-observation-chart-projects` (iteration 1)

- **Reviewer:** QA (independent)
- **Candidate:** `apps/web/domains/observations/*` + `apps/web/tryouts/observation-chart/`
- **Locked Gate A:** P1 Q1 R1 S1 T2
- **Date:** 2026-09-18
- **URL smoke:** `http://127.0.0.1:5173/apps/web/tryouts/observation-chart/?v=20260918-projects` → **HTTP 200**
- **Node tests:** `node` **not available** in reviewer environment — **not executed**. Static review of `qa/tests/web-observations-projects.test.js` (+ sibling suites: 21 cases across `web-observations-*.test.js`).

## Verdict

**conditional**

Domain + tryout meet most Gate A acceptance (project CRUD, kind lock, R1 axis chrome, S1 title menu, Q1 seed, persist bag, Tier 2 placement, XSS paint). **Delete lifecycle** for diary notes / self-metric shared series is incomplete vs proposal copy (“分數／備註會一併移除”). Recommend one Builder revision before **pass**; not a Tier 1 / security block.

## Acceptance checks

| # | Criterion | Result |
|---|---|---|
| 1 | 新建專案: required name + kind A/B; kind locked in edit | **pass** — `projects.js` create/normalize; edit sheet shows locked kind; `relinkVisits` returns null for self-metric (test + static) |
| 2 | Kind A: ≥1 demo visits; X = visit dates (R1) | **pass** — `buildVisitAxis` + controller `hidesModeToolbar`; browser: visit project → time points `9/1`/`9/15`/`9/29`, mode segmented **hidden** |
| 3 | Kind B: one 0–10 metric; diary fill-in plots | **pass** — create path calls `addCustomMetric`; baseline demo week series; browser switch → 週一…週日 + diary points |
| 4 | Title row: name = h2; select / edit / delete | **pass** — `#chartTitle` + `⋯` menu (選擇／新建／編輯／刪除); picker lists seeded names |
| 5 | Switch project swaps series + title + kind chrome | **pass** — browser: visit ↔ self-metric toggles h2, axis labels, mode toolbar, compare |
| 6 | Delete confirms; series/notes gone; visits remain | **partial** — `window.confirm` with visit-safe copy; `projectAxes[id]` removed; visits untouched (test). **Notes not filtered** (`deleteProject` no-op filter); self-metric series remain in shared `viewData` / metrics registry |
| 7 | Zero projects → empty CTA 新建專案 | **pass** — `renderMainChart` sets h2「新建專案」, `#emptyCreateProjectCta`, no auto metric｜mode title |
| 8 | Persist bag `projects` + `activeProjectId`; demo write blocked | **pass** — `persist.js` fields + `writeObservationsToPet` early return; projects test covers `flushToPet` false when demo |
| 9 | Tryout-only; brain in `projects.js`; thin wire | **pass** — see Building blocks |
| 10 | Disclaimer zh-Hant; names escaped | **pass** — `.medical-note` unchanged; project names via `textContent`; tooltip uses `escapeHtml` |

## Locked-decision spot checks

| ID | Check | Result |
|----|---|---|
| P1 | 1 project = 1 chart = 1 metric; demote `#metricSelect` | **pass** — `#metricSelectField` **hidden**; bound metric label; diary metric **disabled**; side cards comment P1 |
| Q1 | Seed visit-linked (9/1 arc) + 頭痛程度 self-metric | **pass** — `createDemoProjects()` two rows with「（示範）」; first active = visit project |
| R1 | Kind A: visit-date X, hide day/week/month/year; B keeps segmented + compare | **pass** — `hidesModeToolbar` / `hidesCompare`; browser spot check |
| S1 | Project name **is** h2; overflow menu CRUD | **pass** — no `#chartTitleInput`; menu matches S1 list |
| T2 | Rename + kind A relink; kind locked | **pass** — edit sheet relink checkboxes; kind note locked |

## Issues

### Blockers

None (Tier 1 / I1 / XSS).

### Non-blocking (revision recommended)

#### QA-1 — Delete does not remove diary notes or self-metric series (medium)

`controller.deleteProject` removes the project row and visit `projectAxes[id]`, but `diaryNotes` filter is a stub (`return true` for every note). Persisted `viewData` / custom metrics for a deleted self-metric project are not pruned. User-facing confirm promises scores/notes removal — data can linger in the tryout bag and notes list. **Suggest:** filter notes by `metricId` (and/or project id if added later); drop orphaned custom metric + series when last project referencing it is deleted.

#### QA-2 — Empty-state copy stays in accessibility tree when chart has data (low)

Browser a11y snapshot still exposes「此指標尚無觀察點…」while SVG shows 7/4/3 (visit demo). Likely `#emptyState` hidden via CSS only (`data-show="false"`). Consider `hidden` / `aria-hidden` when not empty (UI/a11y polish).

#### QA-3 — Node test suite not run in CI path here (info)

Reviewer shell had no `node` binary. Victor / Arbiter should run locally:

`node --test qa/tests/web-observations-*.test.js`

Expected: prior 9 blocks + 6 persist + **6 new projects** cases.

#### QA-4 — Shared `metricId` across demo seeds (info)

Both Q1 samples bind `headache`. Acceptable for demo; distinct user-created B projects get unique `custom_*` ids via create flow.

### Building blocks

#### BB-1 — Domain brain + thin tryout facade (pass)

CRUD, normalize, visit axis math live in `apps/web/domains/observations/projects.js`. Controller wraps store + `ensureVisitAxis` / sync; tryout-wire is paint/events/sheets/localStorage. No new passport `app.js` / `c/app.js`. **No BB blocker.**

## Security (light)

| Topic | Result |
|---|---|
| XSS / project names | **pass** — h2, menu items, picker buttons use `textContent`; tooltip `innerHTML` only with `escapeHtml` |
| I1 demo write | **pass** — `writeObservationsToPet` + `flushToPet` respect `isDemoMode`; tryout toggle surfaces I1 copy |
| Storage boundary | **pass** — `petlive-obs-tryout-store` only; no formal `pets[]` passport keys |
| Secrets | **pass** — none introduced |

Delete confirm uses string concat in `window.confirm` (not HTML) — OK.

## Evidence

- curl **HTTP 200** for tryout URL (`?v=20260918-projects`)
- Browser: h2「9/1 就診追蹤（示範）」; menu 選擇／新建／編輯／刪除; switch to「頭痛程度（示範）」→ mode segmented + compare visible; visit axis 9/1–9/29
- Static: `projects.js` store APIs; `titles.js` project-first; `demo-seed.js` Q1; `persist.js` projects/projectAxes; `web-observations-projects.test.js` six cases align with acceptance
- Tier 2 script order: `projects.js` before `controller.js` in tryout `index.html`

## Unverified

- Full `node --test qa/tests/web-observations-*.test.js` pass count (no Node in reviewer env)
- Phone layout / sheet polish (UI reviewer)
- Delete-all-projects empty CTA manual path (logic present; not clicked in smoke)
- Pharmacist / Legal (skipped per routing)

## Gate recommendation

**QA conditional for Arbiter:** adopt after **QA-1** delete cleanup (notes + orphaned series/metrics), or Victor explicitly accepts v1 “project row only” delete. Re-run Node suite before Gate B.
