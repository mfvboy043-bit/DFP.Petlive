---
id: 20260827-timeline-view-render
title: Timeline view render — extract HTML builders from app.js
status: proposed
author: planner
candidate_branch: "proposal/timeline-view-render"
candidate_path: "proposals/20260827-timeline-view-render"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Timeline view render building blocks

Companion: `state.yaml`.

## Goal

Move the **timeline visit / med HTML string builders** out of surface `app.js` into `domains/timeline/`, keeping behavior identical. Facades retain DOM write (`innerHTML`), event listeners, lazy drug-note hydrate, and expand/collapse side effects.

Builds on adopted `20260827-timeline-lazy-notes` (selectors + drug-note view models). This slice finishes the **render half** still inline (~450 lines across 10 functions in `c/app.js`).

## Audit (current)

| Piece | Where now | Lines (approx.) |
|---|---|---|
| `buildTimelineEntries` | `domains/timeline/selectors.js` | ✅ extracted |
| Drug-note model / lazy shell contract | `domains/timeline/view.js` | ✅ extracted |
| `buildDrugNotesBodyHtml`, `renderTimelineDrugNotes` | `c/app.js` / `app.js` | ~45 |
| `renderVisitProofThumbs`, `renderVisitImagingThumbs` | facade | ~95 |
| `renderVisitWeightVsPrevious`, `renderVisitWeightParts` | facade | ~90 |
| `renderVisitRxBlock` | facade | ~85 |
| `renderTimelineMedItem` | facade | ~130 |
| `renderTimeline` | facade | ~50 (+ orchestration) |
| `hydrateDrugNotesPanel`, `drugNotesMedByPanelId` | facade | **stay** (DOM + Map) |
| `renderEmergencyMeds` drug-note shells | facade | **stay**; calls shared renderer API |

## In scope

### TL-05-01 — `domains/timeline/render.js`

Add `PetLiveWeb.domains.timeline.createRenderer(deps)` returning pure HTML builders:

- `buildDrugNotesBodyHtml(model, labels)` — purpose / side effects / precautions / disclaimer strings via injected `labels` (no `t()` in domain file)
- `buildDrugNotesShellHtml({ notesId, titleLabel })` — lazy shell only; returns `{ html, notesId }`
- `buildVisitProofThumbsHtml(slots, visitIndex, labels)`
- `buildVisitImagingThumbsHtml(imaging, visitIndex, labels)`
- `buildVisitWeightVsHtml(visit, previousVisit, { visits, labels })`
- `buildVisitWeightPartsHtml(visit, visitIndex, previousVisit, { visits, labels })`
- `buildVisitRxBlockHtml(visit, visitIndex, ctx)` — proof / imaging / weight / labs line / meds block
- `buildTimelineMedItemHtml(med, ctx)` — simple, photo_bundle, compound_bundle paths
- `buildTimelineListHtml(pet, ctx)` — full `<li class="tl-item">…</li>` list or empty state HTML

Inject from facade: `label(key, params)`, `locField`, `formatShortDate`, `visitClinicLabel`, `visitTagLabel`, `getSourceTags`, `expandFrequencyInText`, compound helpers, `timelineSelectors`, `timelineViewHelpers`, `visitsController`, `imagingController`, labs-linked predicate.

No `document`, `innerHTML` assignment, `localStorage`, or literal `t(` in domain file.

### TL-05-02 — Wire C first

- `c/app.js`: thin wrappers — build labels bag once, call renderer, assign `timelineList.innerHTML`, keep `drugNotesMedByPanelId` + `hydrateDrugNotesPanel` + `applyPendingVisitImagingExpand` / `expandLatestVisitRx`
- `renderEmergencyMeds` reuses `buildDrugNotesShellHtml` / shared shell path (no emergency DOM extraction in this proposal)
- Script tag + `?v=` bump in `c/index.html`

### TL-05-03 — Tests

- Extend `qa/tests/web-timeline-view.test.js` or add `web-timeline-render.test.js`:
  - weight delta HTML (`↑` / `↓` / `=`) with stub labels
  - proof / imaging thumb `data-*` attributes preserved
  - compound med expand markup + ingredient notes ids
  - drug-note shell has `data-drug-notes-shell`, no eager body
  - empty timeline HTML

### TL-05-04 — Cover B (after Victor confirms C or with adopt)

- Mirror same wiring onto `apps/web/app.js` + B `index.html` when Victor says 覆蓋 / 採用 cover.

## Out of scope

- **PERF-03** keyed reconcile / skip-noop rebuild (separate wave; optional follow-up)
- Emergency card full render extraction
- Timeline **form** flows (`add-med`, proof upload handlers, med draft)
- Labs list / imaging list screens
- CSS / visual redesign
- Changing medical copy, dose formatting rules, or disclaimer text

## Likely files

| Layer | Path |
|---|---|
| Domain | `apps/web/domains/timeline/render.js` (new) |
| Facade | `apps/web/c/app.js`, later `apps/web/app.js` |
| Load | `apps/web/c/index.html`, later B `index.html` |
| QA | `qa/tests/web-timeline-render.test.js` (or extend view test) |

## Risks

- **HTML drift:** one missed `data-*` hook breaks expand / proof upload / weight edit. Tests lock attribute names.
- **Compound / photo_bundle branches:** three med shapes must stay byte-stable for QA snapshots.
- **Labs line:** `renderVisitLabsLine` uses pet context — inject `hasLinkedLabs(visit)` from facade; do not call `getCurrentPet()` inside domain.
- **i18n:** all user-visible strings flow through injected `label()`; user-authored visit notes stay `locField` injection only.

## Acceptance

- [ ] Timeline HTML builders live under `domains/timeline/render.js`
- [ ] `renderTimeline` in C facade is orchestration only (~30 lines)
- [ ] Lazy drug-note expand + emergency med notes still work
- [ ] Weight edit panel, RX/imaging panels, proof lightbox hooks unchanged
- [ ] `node --test qa/tests/web-timeline-render.test.js` (+ existing timeline tests) pass
- [ ] Follows `.cursor/rules/web-building-blocks.mdc`

## Notes for Victor（白話）

時間軸畫面上「組 HTML 字串」的那一大坨，要搬進 `domains/timeline/`。  
按鈕、展開、lazy 載入藥品說明，還留在 `app.js`。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
