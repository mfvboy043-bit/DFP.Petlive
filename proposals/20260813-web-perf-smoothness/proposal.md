---
id: 20260813-web-perf-smoothness
title: Web performance & smoothness (CSS layers, i18n, timeline, photo writes)
status: adopted
author: planner
candidate_branch: ""
candidate_path: ""
created: 2026-08-13
updated: 2026-08-24
---

# Proposal: Web performance & smoothness

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Improve Petlive `apps/web` interaction smoothness and CSS maintainability **without changing product behavior**: reduce cascade/compat dead weight, stop language switches from full-app re-rendering, avoid unnecessary timeline `innerHTML` rebuilds, and stop pet-photo saves from synchronously jamming the main thread on large `localStorage` writes—while keeping zero-build serving, `pets[]` as write truth, and reusing the adopted layered storage / render-coordinator seams.

## Context (reuse, do not rebuild)

Adopted `20260813-web-layered-building-blocks` already shipped:

- `PetLiveWeb.storage.createJsonSlot` — cached JSON slots for owner alerts, suppressed alerts, **pet photos**, owner profile (`apps/web/core/storage.js`).
- `PetLiveWeb.shell.createRenderCoordinator` — screen-aware dirty/flush (`apps/web/shell/render-coordinator.js`); pet switch already avoids hidden-screen work.
- `PetLiveWeb.metrics.getSnapshot()` — render/storage/i18n counters usable for before/after evidence.
- `qa/tests/web-building-blocks.test.js` — FakeStorage + vm factory load pattern to extend.

This proposal **extends** those seams. It does not re-extract domains, dual-write module stores, or re-open architecture Gate A.

Current hotspots (mainline):

| Area | Evidence | Pain |
|---|---|---|
| CSS | `styles.css` §36 compat (~3750+) plus §37 mobile; §38 folded but dual/triple rules remain for alerts / emergency / pet / parasite | Parse + cascade cost; hard to reason about authority |
| Language | `setLanguage` → `applyI18n()` then `onLanguageChange` → `applySelectedPet()` (= `refreshSelection`) plus pending-med / clinic / archive chrome | Full registered-section re-render on every lang change |
| Timeline | `renderTimeline` always sets `timelineList.innerHTML` to a full map of visits/meds | Costly on flush even when data unchanged; loses open UI state risk on every rebuild |
| Photos | `setPetPhoto` → `petPhotosSlot.write` synchronous `JSON.stringify` + `localStorage.setItem` of data-URL map | Main-thread jank on crop save |

## Conflict & sequence notes

### `20260812-ui-align-optimize` (status: `proposed`, Gate A pending) — **primary CSS conflict**

- **ui-align-optimize** owns visual alignment, trust/urgency polish, dead-name cleanup, and consolidation toward §38 **with intentional visual change**.
- **PERF-01** in this proposal owns **mechanical** duplicate/compat-layer cleanup for maintainability and cascade cost, aiming for **computed-style parity** (no redesign).
- **Do not run both Builder tracks on `styles.css` at once.**
- Recommended sequence:
  1. Victor decides Gate A for `20260812-ui-align-optimize` first **or** explicitly defers it.
  2. If ui-align is **confirmed**: absorb overlapping dead-rule / dual-target deletions into that build; **shrink or skip PERF-01** afterward (only leftover mechanical debt).
  3. If ui-align is **rejected / deferred**: PERF-01 may proceed as mechanical-only (no hero/trust redesign goals from ui-align Findings F5–F10).
- First Gate A build of **this** proposal **excludes PERF-01** so CSS conflict cannot block JS smoothness wins.

### Other proposals

| Proposal | State | Note |
|---|---|---|
| `20260812-ui-html-dock` | `candidate_ready`, Gate B pending (mainline dock path) | CSS baseline already includes dock fold note at §38. Close Gate B when ready; does not block PERF-02/04. |
| `20260813-timeline-weight-delta` | **adopted** | Timeline weight/Δ HTML is settled baseline for PERF-03. |
| `20260813-timeline-edit-recorded-weight` | **adopted** | Weight edit forms must survive any timeline reconcile. |
| `20260813-timeline-compact-control-depth` | **adopted** | Compact controls/classes must not regress. |
| `20260813-web-layered-building-blocks` | **adopted** | Required reuse target for storage + coordinator. |

## Builder scope (ordered IDs)

One proposal; four priorities; **phased first build**.

| ID | Priority | First Gate A build? | Summary |
|---|---|---|---|
| PERF-01 | CSS duplicate/compat cleanup | **No** (after ui-align decision) | Mechanical §36 / dual-layer collapse; computed-style parity |
| PERF-02 | Incremental language switch | **Yes** | Stop full `refreshSelection` on lang change; targeted chrome refresh |
| PERF-03 | Timeline rebuild reduction | **No** (wave 2) | Skip-noop + patch/keyed reconcile; preserve open panels |
| PERF-04 | Pet photo write batching | **Yes** | Debounced/coalesced slot writes; IndexedDB-ready adapter shape only |

### First Gate A build (reviewable size)

**Includes: PERF-02 + PERF-04 only.**

Rationale: highest ROI for felt jank, reuses existing coordinator/storage, no CSS merge conflict, behavior-preserving acceptance is clear. PERF-03 is valuable but higher regression risk (weight forms, med expand, proof buttons). PERF-01 waits on ui-align Gate A.

Victor may Gate-A-modify to add PERF-03 to the first build, or to run PERF-01 alone after rejecting/deferring ui-align.

### PERF-01 — CSS duplicate / compat layers (later wave)

- Inventory dual/triple rules for shared selectors (alerts severity, `.e-card`, `.pet-option`, `.parasite-row`, stamp/badge dead names) across early sections vs §36.
- Collapse **only** where computed style can be shown equivalent (or document intentional keep).
- Prefer deleting dead names / redundant `!important` that §38/component sections already own.
- **Non-goal inside PERF-01:** trust color redesign, emergency “read-first” polish, home hero rhythm (those belong to ui-align if confirmed).
- Files: primarily `apps/web/styles.css`; `index.html` cache bust only.

### PERF-02 — Incremental language switch (first build)

- Keep `i18n.js` `setLanguage` → single `applyI18n()` for static `data-i18n*` chrome.
- Replace `window.onLanguageChange`’s blanket `applySelectedPet()` with a **language refresh path** that:
  - Updates dynamic chrome (species, breed, age, gender, source tags, vaccine names, med course, manage/hint labels, pending-med hints, open archive/remove copy, clinic chrome) **without** forcing a full timeline/alerts/vaccines/archive rebuild when those screens are not active—or rebuilds only dirty/active groups via coordinator.
  - Marks off-screen groups dirty so next `go()` / flush still shows correct language.
- Preserve user-authored names/notes and clinic proper names.
- Prefer extending render-coordinator (e.g. `markAllDirty()` + `flush("home")` + flush active) over ad-hoc DOM walks when possible.
- Files: `apps/web/app.js`, possibly `apps/web/shell/render-coordinator.js`; `index.html` cache bust; tests.

### PERF-03 — Timeline rebuild reduction (wave 2)

Prefer escalating cost only as needed:

1. **Skip noop:** fingerprint (pet id + visit/med structural signature + lang) — if unchanged, do not assign `innerHTML`.
2. **Surgical update:** when a single visit weight / proof / med toggles, patch that node or re-render one `.tl-item` instead of the whole list when safe.
3. **Keyed reconcile (optional stretch):** keyed `.tl-item` by visit identity/index; update text nodes; avoid full wipe when order stable.

Must preserve: weight edit open state, med summary expand/drug notes, visit proof controls, Δ weight copy, empty state, `safeRender` fallback, event model (delegation or re-bind safely).

Reuse coordinator timeline registration; do not bypass dirty/flush semantics.

Files: `apps/web/app.js` (`renderTimeline` and helpers); tests/metrics; cache bust.

### PERF-04 — Pet photo write debounce / adapter (first build)

- Keep key `petlive-pet-photos` and JSON map shape unchanged.
- In-memory: update `pet.photo` and UI immediately on save (current UX).
- Persistence: coalesce writes through an extended storage helper (e.g. `createJsonSlot` option `coalesceMs` / `scheduleWrite`, or `PetLiveWeb.storage.createWriteQueue`) so rapid updates batch; flush on `visibilitychange` / `pagehide` / explicit `flush()`.
- Shape the API so a later IndexedDB backend can swap in **without** migrating pets graph or photo schema in this build (interface/adapter stub only—no IDB implementation required).
- Failure path: still surface persistence failure toast if final flush fails; do not silently drop the last intended map.
- Files: `apps/web/core/storage.js`, `apps/web/app.js` (`setPetPhoto` / `savePetPhotosMap` path), `qa/tests/web-building-blocks.test.js`, cache bust.

## In scope

- Behavior-preserving JS/CSS performance & maintainability work listed under PERF-01…04.
- Reuse/extend `PetLiveWeb.storage` and render coordinator.
- Measurement via existing `PetLiveWeb.metrics` + local Performance samples.
- Candidate off mainline (`proposal/web-perf-smoothness` or `proposals/20260813-web-perf-smoothness/preview`).

## Out of scope (non-goals)

- Bundler, npm runtime build, service worker, TypeScript conversion.
- Full module-store / `modules/*` write-truth migration; dual-write `pets[]`.
- Visual redesign / UI v3 / hero or trust retheme (except if absorbed under separate ui-align proposal).
- Drug seed deduplication.
- Actual IndexedDB / native-file migration (adapter-ready only).
- Medical copy, contracts, dose/frequency/duration semantics changes.
- Broad listener-system rewrite; alerts/vaccines list virtualization (unless forced by PERF-03 acceptance and re-scoped).

## Likely files

### First build (PERF-02 + PERF-04)

| File | Role |
|---|---|
| `apps/web/app.js` | Language callback; photo save path; coordinator wiring |
| `apps/web/core/storage.js` | Coalesced / deferred write API |
| `apps/web/shell/render-coordinator.js` | Optional language/dirty helpers |
| `apps/web/index.html` | Script cache bust only |
| `qa/tests/web-building-blocks.test.js` | Slot coalesce + language dirty/flush tests |

### Wave 2+ (not first build)

| File | Role |
|---|---|
| `apps/web/app.js` | `renderTimeline` skip/patch/keyed |
| `apps/web/styles.css` | PERF-01 mechanical layer cleanup |
| `apps/web/index.html` | Cache bust |

### Read-only unless Gate A modified

- `apps/web/i18n.js` (prefer no change; static apply already correct)
- `modules/*`, `packages/*`, `contracts/*`
- Drug databases

## Risks

- **i18n stale chrome:** skipping full refresh may leave species/breed/age/gender/vaccine/med/source tags in wrong language on hidden screens if dirty marks are missed.
- **Timeline state loss:** any rebuild strategy that still wipes DOM can close open weight panels or collapse med notes unexpectedly.
- **Photo durability:** debounce without `pagehide` flush risks data loss if the tab is killed mid-coalesce.
- **Quota / sync failure:** deferred write must still report failure; UI must not claim “saved” if flush ultimately fails (or must retry-and-toast).
- **CSS conflict:** concurrent ui-align + PERF-01 causes unreviewable diffs and trust-color regressions.
- **Medical misread:** CSS consolidation must not blur `severity-critical` vs caution; JS timeline changes must not alter dose/unit/frequency/duration display strings.
- **Facade / coordinator misuse:** language path must not reintroduce double `applyI18n` or recurse through compatibility wrappers.

## Rollback

- Candidate stays off mainline until Gate B.
- Rollback = remove candidate scripts/API additions and restore prior `onLanguageChange` / `setPetPhoto` / (later) `renderTimeline` / CSS sections from diff.
- No schema migration: photo key/shape unchanged; pets graph unchanged → no user-data conversion.
- If coalesce writes are suspect: feature-flag or one-line bypass to immediate `slot.write` while keeping UI path.

## Acceptance criteria

### Shared / first build

- [ ] Zero-build: `http://127.0.0.1:5173/apps/web/` and LAN phone preview still work.
- [ ] `pets[]` remains sole write truth; no module-store dual write.
- [ ] zh-Hant → en → ja → ko: static chrome + dynamic medical chrome correct; user-authored text unchanged.
- [ ] `node --test qa/tests/*.test.js` passes including extended building-block tests.
- [ ] No intentional visual redesign; no contract/medical-copy change.

### PERF-02

- [ ] One static `applyI18n` per language selection (unchanged contract from layered build).
- [ ] Language change does **not** invoke full timeline/alerts/vaccines/archive render functions when those screens are inactive.
- [ ] Entering a dirty screen after language change shows the new language before content is observably stale.
- [ ] Pet switcher manage/hint, pending meds, open archive/remove, clinic selection chrome update immediately.

### PERF-04

- [ ] Crop save updates on-screen avatar immediately.
- [ ] Multiple rapid `setPetPhoto` calls produce coalesced persistence writes (testable via FakeStorage `sets` count).
- [ ] `pagehide` / explicit flush persists the last map; failure surfaces existing persistence feedback.
- [ ] Storage key and JSON shape unchanged; slot cache semantics remain correct after flush.

### PERF-03 (wave 2)

- [ ] Unchanged timeline fingerprint → no `innerHTML` rewrite.
- [ ] Visit weight edit / med expand / proof controls remain usable after patch path.
- [ ] Weight Δ / empty visits / safeRender fallback unchanged in meaning.

### PERF-01 (after ui-align decision)

- [ ] Documented selector inventory; removed rules are dead or proven equivalent.
- [ ] Alert critical vs caution tones unchanged; no clinic-as-verified mint regression introduced by this ID.
- [ ] Mobile ≤759 and desktop ≥760 smoke unchanged for docked behaviors.

## Performance measurement plan

Same seeded pet, language, viewport, hard-reload; warm-up then N samples; report median + p95 (no single-sample claims).

1. **Language:** count registered section renders via `renderCoordinator.getMetrics()` and `PetLiveWeb.metrics` i18n counter for one switch; `performance.now()` around language callback. Pass: inactive timeline/alerts/vaccines/archive render count = `0` on lang switch from home.
2. **Photos:** FakeStorage/`getStats().writes` under burst setPetPhoto; optional main-thread blocking estimate around flush of a ~100KB+ data URL map. Pass: burst of K updates → writes ≪ K (coalesced), final map correct.
3. **Timeline (wave 2):** `performance.now()` + `timelineList.innerHTML.length` for noop re-flush vs visit mutation. Pass: noop duration clearly below full rebuild baseline.
4. **CSS (later):** optional transfer size / rule count note only; no production analytics SDK.

## QA / reviewer routing

| Reviewer | First build (PERF-02/04) | Wave 2 PERF-03 | PERF-01 |
|---|---|---|---|
| QA | **Required** — lang matrix, dirty-screen entry, photo save/kill-tab flush, persistence failure | **Required** — weight edit, med expand, proof, pet switch into timeline | Light smoke |
| Pharmacist | **Skipped** if dose/unit/freq/duration/disclaimer strings untouched; escalate if timeline HTML builders change | **Required** if med/dose DOM builders touched | Skip unless severity colors change |
| UI | Light compatibility (no redesign expected) | Light — open-panel persistence | **Required** if any cascade visible |

Automated: extend `web-building-blocks.test.js` (coalesce writes; coordinator dirty/flush on simulated language refresh). Desktop + Safari LAN smoke for lang switch and photo crop save.

## Gate

Stops at **Gate A**. No Builder, no `apps/web` mainline edits, until Victor confirms.

### Recommended Gate A confirmation meaning

「確認」= build **PERF-02 + PERF-04** only on a parallel candidate path.

To change first-build contents, reply with 「修改：…」 (e.g. add PERF-03, or sequence PERF-01 after rejecting ui-align).

## Notes for Victor

請確認此提案：回覆「確認」開始平行製作（預設第一輪只做 PERF-02 語系增量更新 + PERF-04 寵物相片寫入合併），「修改：…」調整範圍，或「否決」。

提醒：`20260812-ui-align-optimize` 仍佔 CSS Gate A；PERF-01 不會進入第一輪，避免與對齊優化搶 `styles.css`。
