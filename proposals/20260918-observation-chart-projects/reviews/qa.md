# QA review — `20260918-observation-chart-projects` (iteration 2)

- **Reviewer:** QA (independent rerun — QA-1 scope only)
- **Candidate:** `apps/web/domains/observations/*` + `apps/web/tryouts/observation-chart/`
- **Locked Gate A:** P1 Q1 R1 S1 T2
- **Date:** 2026-09-18
- **URL smoke:** `http://127.0.0.1:5173/apps/web/tryouts/observation-chart/` → **HTTP 200**
- **Node tests:** `node` **not available** in reviewer environment — **not executed**. Static review + new test case in `qa/tests/web-observations-projects.test.js`.

## Verdict

**pass**

Iteration 2 resolves blocking **QA-1**: `deleteProject` now drops project-tagged notes, prunes orphaned custom metrics/series via `pruneOrphanedMetric`, and retains shared metrics/notes while another project still references the same `metricId`. Acceptance **#6** is satisfied at domain layer. Remaining QA-2 / QA-3 / QA-4 are non-blocking.

## Acceptance checks

| # | Criterion | Result |
|---|---|---|
| 1 | 新建專案: required name + kind A/B; kind locked in edit | **pass** — unchanged from iteration 1 (static + prior evidence) |
| 2 | Kind A: ≥1 demo visits; X = visit dates (R1) | **pass** — unchanged |
| 3 | Kind B: one 0–10 metric; diary fill-in plots | **pass** — unchanged |
| 4 | Title row: name = h2; select / edit / delete | **pass** — unchanged |
| 5 | Switch project swaps series + title + kind chrome | **pass** — unchanged |
| 6 | Delete confirms; series/notes gone; visits remain | **pass** — `deleteProject` removes `projectAxes[id]`; filters notes by `projectId`; `pruneOrphanedMetric` removes orphaned `metricId` notes, `viewData` series, and registry entry; visits array untouched. Test `delete purges orphaned notes/metric; shared metric kept; visits remain` |
| 7 | Zero projects → empty CTA 新建專案 | **pass** — unchanged |
| 8 | Persist bag `projects` + `activeProjectId`; demo write blocked | **pass** — unchanged |
| 9 | Tryout-only; brain in `projects.js`; thin wire | **pass** — unchanged |
| 10 | Disclaimer zh-Hant; names escaped | **pass** — unchanged |

## Locked-decision spot checks

| ID | Check | Result |
|----|---|---|
| P1 | 1 project = 1 chart = 1 metric | **pass** — unchanged |
| Q1 | Seed visit-linked + self-metric | **pass** — unchanged |
| R1 | Kind A visit-date X; B segmented + compare | **pass** — unchanged |
| S1 | Project name is h2; overflow CRUD | **pass** — unchanged |
| T2 | Rename + kind A relink; kind locked | **pass** — unchanged |

## Issues

### Blockers

None.

### Resolved (iteration 2)

#### QA-1 — Delete purge notes + orphaned metric/series (**resolved**)

**Was:** `diaryNotes` filter stub kept all notes; custom series/metrics lingered after self-metric project delete.

**Now:** `deleteProject` (1) deletes store row + `projectAxes[id]`, (2) filters notes where `note.projectId ===` deleted id (forward-compatible), (3) calls `pruneOrphanedMetric(metricId)` which skips when `metricStillReferenced`, else filters notes by `metricId`, clears `viewData` modes, `metrics.replaceAll` without orphaned id, and rebinds active metric/secondary. Shared `headache` across two projects: delete one project keeps note + metric; delete last referencing project purges headache notes. Visits never mutated.

Evidence: `controller.js` `deleteProject` / `pruneOrphanedMetric`; test case lines 125–228 in `web-observations-projects.test.js`.

### Non-blocking (still relevant)

#### QA-2 — Empty-state copy in a11y tree when chart has data (low)

Unchanged from iteration 1 — CSS-only hide; suggest `hidden` / `aria-hidden` when not empty (UI polish).

#### QA-3 — Node suite not run in reviewer env (info)

Run before Gate B:

`node --test qa/tests/web-observations-*.test.js`

Expect **7** projects cases (including new delete-purge case) + sibling suites.

#### QA-4 — Shared `metricId` on Q1 demo seeds (info)

Both samples bind `headache`; acceptable for demo; user-created B projects get unique `custom_*` ids.

### Building blocks

#### BB-1 — Domain brain + thin tryout facade (pass)

Delete cleanup lives in controller orchestration calling store + `pruneOrphanedMetric`; no new app.js brain. **No BB blocker.**

## Security (light)

Unchanged from iteration 1 — XSS paint, I1 demo block, tryout storage only. **pass**

## Evidence

- curl **HTTP 200** tryout root
- Static: `deleteProject` + `pruneOrphanedMetric` + `metricStillReferenced` in `controller.js`
- New regression test: shared vs orphaned metric delete paths; visits count stable
- Prior iteration 1 browser/UI evidence still applies to criteria not re-smoked this rerun

## Unverified

- Full Node test pass count (no `node` binary)
- Tryout delete confirm UX manual click (domain logic covered by tests statically)
- Phone layout (UI reviewer)

## Gate recommendation

**QA pass for Arbiter:** blocking **QA-1** cleared; candidate meets acceptance **#6** and prior QA pass rows. Victor should run Node suite locally; QA-2 remains optional polish.
