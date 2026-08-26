---
id: 20260826-timeline-visits-controller
title: Timeline + Visits controller building blocks
status: adopted
author: planner
candidate_branch: "proposal/timeline-visits-controller"
candidate_path: "proposals/20260826-timeline-visits-controller"
created: 2026-08-26
updated: 2026-08-26
---

# Proposal: Timeline + Visits controller building blocks

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Continue the adopted `20260813-web-layered-building-blocks` later phases (#1–#2 partial) by extracting a **Visits domain controller** and a **Timeline view-model / selectors** layer under `apps/web/domains/`, wired first against surface **C** (`apps/web/c/`). This slice is a behavior-preserving, zero-build extraction: weight / proof / imaging model helpers and timeline entry data move behind `PetLiveWeb.domains.*` public APIs; heavy DOM renderers and med compound / pending-drug orchestration stay in `c/app.js` as thin facades for this build.

`pets[]` / `archivedPets[]` remain the only prototype mutation graph. No dual-write into `modules/visit` in-memory stores. Formal **B** and GitHub Pages stay untouched until Victor separately confirms a C → B cover.

## Surface statement (standing rules)

| Surface | Path | This proposal |
|---|---|---|
| **C** | `apps/web/c/` | **Edit / wire here** — `c/app.js`, `c/index.html` script tags |
| Shared blocks | `apps/web/core\|shell\|domains\|runtime` | **OK to add** `domains/visits`, `domains/timeline` (C already loads `../domains/...`) |
| **B** | `apps/web/` root passport | **Out of scope** — no silent cover |
| **A** | intro / login | Out of scope |

After Gate B adopt onto the candidate path for C: ask Victor whether to **cover C → B** (and then auto-publish Pages). Cover is a separate confirm, not part of this Gate A slice.

## Why two folders (not one)

Prefer **two domains with clear public APIs**:

1. **`apps/web/domains/visits/`** — visit model helpers + mutations on `pet.visits` (weight, proof slots, imaging arrays, link lookup). Controllers must not write DOM.
2. **`apps/web/domains/timeline/`** — pure selectors / view-models that turn a pet’s visits into timeline entry descriptors for `renderTimeline` (previous-weight map, flags for proof / imaging / rx). No persistence, no DOM, no private reach into visits internals — only visits **public** helpers or duplicated pure math where needed.

**Justification:** ARCH dependency direction forbids domains reaching into another domain’s private state. Visits owns write-adjacent visit graph helpers; timeline owns read-only presentation models. A single `domains/timeline-visits` bag would blur mutation vs view-model and invite DOM creep. Meds/compound remain a **follow-up** domain, so timeline must not swallow drug-orchestration state.

## Current codebase facts (audit)

- B `apps/web/app.js` ~9044 lines; C `apps/web/c/app.js` ~8209 lines. C mirrors timeline/visit helpers closely; this slice wires **C only**.
- Already extracted: `core/storage.js`, `core/state.js`, `shell/navigation.js`, `shell/render-coordinator.js`, `domains/pets/controller.js`. Only pets domain controller exists.
- `modules/visit` public API (`createVisit`, `getVisitById`, `getVisitsByPetId`) exists but is **not** UI write truth — do not dual-write.
- C already loads shared scripts via `../core|shell|domains/...` in `c/index.html`.

Still inlined in `c/app.js` (representative):

| Kind | Examples |
|---|---|
| Model helpers | `visitWeightKg`, `buildPreviousVisitByIndex`, `formatWeightDeltaKg`, `collectVisitProofPhotos`, `visitHasAnyProof`, `getVisitImaging`, `ensureVisitImaging`, `visitHasImaging`, `getImagingVisitEntries`, `clearVisitProofSlot`, `clearVisitImagingPhoto`, `visitLinkValue`, `parseVisitLinkValue`, `findVisitByLink` |
| Mutators (DOM-adjacent today) | `saveVisitWeightAtIndex` (reads input then mutates visit + pet weight) |
| Med adjacency (defer) | `getOrCreateVisitForMedSave`, `buildVisitMedicationsFromPending` |
| Views (DOM) | `renderTimeline`, `renderVisitWeightParts`, `renderVisitProofThumbs`, `renderVisitImagingThumbs`, `renderVisitRxBlock`, `renderTimelineMedItem`, lightbox / toggle UI |

## Dependency direction (unchanged)

```text
bootstrap → shell/navigation + render coordinator
  → domain controllers
  → shared state/selectors + persistence adapters
  → runtime module adapters
  → modules/* public APIs → packages/shared

controllers -X-> DOM
views       -X-> localStorage
domains     -X-> another domain's private state
modules/*   -X-> apps/web
```

## Gate A builder scope

Only these IDs are proposed for this build:

### TV-01 — Visits controller (no DOM)

- Add `apps/web/domains/visits/controller.js` (classic IIFE, `PetLiveWeb.domains.visits` namespace; mirror pets controller style).
- Public API sketch (`createController` or flat factory — Builder may choose factory vs controller object if pets pattern fits; prefer `createController({ getCurrentPet, clinicLabelOf })` when mutation needs current pet):

```text
PetLiveWeb.domains.visits.createController({ getCurrentPet, clinicLabelOf? })
  // Pure / model
  .visitWeightKg(visit) → number|null
  .buildPreviousVisitByIndex(visits) → (Visit|null)[]
  .formatWeightDeltaKg(delta) → string
  .calendarDaysBetween(fromIso, toIso) → number|null   // if extracted with weight delta
  .collectVisitProofPhotos(visit) → { bag, rx, drug }
  .visitHasAnyProof(visit) → boolean
  .getVisitImaging(visit) → { xrayPhotos, usPhotos }
  .ensureVisitImaging(visit) → imaging ref on visit
  .visitHasImaging(visit) → boolean
  .getImagingVisitEntries(pet) → { visit, index }[]
  .visitLinkValue(visit) → string
  .parseVisitLinkValue(value) → { date, clinicKey }|null
  .findVisitByLink(pet, value) → visit|null   // uses injected clinicLabelOf
  .findVisitByDateClinic(pet, { date, clinicId?, clinicName? }) → visit|null

  // Mutations on pets[] graph (by reference) — no DOM, no toast, no applySelectedPet
  .saveVisitWeight(pet, visitIndex, weightKg) → { ok, visit?, petWeightUpdated? }
  .clearVisitProofSlot(visit, slot) → void
  .clearVisitImagingPhoto(visit, slot, index) → void
  .appendVisitImagingPhoto(visit, slot, dataUrl) → { ok, reason? }  // enforce IMAGING_PHOTOS_MAX
```

- Move model logic out of `c/app.js`; keep listeners calling thin facades that read DOM / show toasts / call `applySelectedPet`, then delegate mutation to the controller.
- **Do not** call `modules/visit` create/list APIs for writes in this build.

### TV-02 — Timeline view-model / selectors (pure data)

- Add `apps/web/domains/timeline/selectors.js` (or `controller.js` that exposes only selectors — name for clarity: prefer `selectors.js` + `PetLiveWeb.domains.timeline`).
- Public API sketch:

```text
PetLiveWeb.domains.timeline.createSelectors({ visits /* public helpers */ })
  .buildPreviousVisitByIndex(visits)   // may re-export / wrap visits helper
  .buildTimelineEntries(pet) → Entry[]
      // Entry: {
      //   visitIndex, visit, previousVisit,
      //   weightKg, hasProof, hasImaging, hasRx,
      //   year, date, … flags only — no HTML strings
      // }
  .visitTimelineFlags(visit) → { hasProof, hasImaging, hasRx }
```

- `renderTimeline(pet)` in `c/app.js` consumes `buildTimelineEntries` (or previous-map + flags) then keeps existing HTML-string builders / expand-latest / pending imaging expand behavior.
- **Do not** move `renderTimeline`, thumb HTML builders, lightbox, or Rx expand toggles into the domain in this slice (risk of i18n/`t()` and DOM coupling). Pure numeric / boolean / reference data only.

### TV-03 — C wiring + compatibility facades

- Update `apps/web/c/index.html` to load new scripts after pets controller, before `c/app.js`; bump cache `?v=` for touched C scripts only.
- Update `apps/web/c/app.js`:
  - Compose visits controller + timeline selectors at bootstrap (same pattern as pets).
  - Replace inlined helpers with facades of the same function names where listeners / render still expect them (`visitWeightKg`, `saveVisitWeightAtIndex`, `clearVisitProofSlot`, …).
  - `saveVisitWeightAtIndex` remains a facade: read `#visit-weight-input-*`, validate, toast, call `visits.saveVisitWeight`, then `applySelectedPet`.
- Leave formal B (`apps/web/app.js`, `apps/web/index.html`) unchanged.

### TV-04 — Boundary tests

- Add or extend `qa/tests/` (prefer new `qa/tests/web-timeline-visits.test.js`, or extend `web-building-blocks.test.js` if tightly coupled — prefer **new file** to keep ARCH suite focused).
- Style: `node:test` + `vm` load of classic scripts (same as `web-building-blocks.test.js`).
- Cover at least:
  - previous-visit map order (date + same-day index tie-break)
  - weight save updates visit + pet.weight / weightDate rules
  - invalid weight rejected without mutation
  - proof collect / clear slot clears visit + nested med photos
  - imaging ensure / clear / max append
  - visit link parse / find
  - timeline entries: flags + previousVisit alignment
  - domains do not touch `document` / `localStorage`
  - no import of `modules/visit` private Map

## Public API placement summary

| Namespace | Responsibility |
|---|---|
| `PetLiveWeb.domains.visits` | Visit graph helpers + mutations on `pets[].visits` |
| `PetLiveWeb.domains.timeline` | Pure timeline entry / flag selectors for views |
| `c/app.js` facades | DOM read, toasts, `applySelectedPet`, HTML render, listeners |

## Likely files

### Add

- `apps/web/domains/visits/controller.js`
- `apps/web/domains/timeline/selectors.js`
- `qa/tests/web-timeline-visits.test.js`

### Change

- `apps/web/c/app.js` — extract helpers to facades; compose domains; keep render/listeners
- `apps/web/c/index.html` — script tags + cache `?v=` for new/changed C loads

### Read-only in this build

- `apps/web/app.js` / `apps/web/index.html` (formal B)
- `apps/web/c/styles.css`, `apps/web/c/i18n.js` (unless a facade forces a zero-behavior cache bump — prefer avoid)
- `apps/web/core/*`, `apps/web/shell/*`, `apps/web/domains/pets/controller.js` (consume only)
- `modules/*`, `packages/*`, `contracts/*`
- Medical copy / disclaimer strings

If implementation reveals a read-only file must change, stop and return to Gate A with a scope modification; do not expand silently.

## Out of scope / non-goals

- Formal **B** edits or C → B cover / Pages publish (Victor confirm later).
- Full **meds / compound / pending-drug** controller (`buildVisitMedicationsFromPending`, med entry mode, drug search orchestration).
- Moving `getOrCreateVisitForMedSave` wholesale (DOM + form + `completingVisitRef`); optional pure `findVisitByDateClinic` in visits is OK if used by a thin facade — creating visits from the med form stays in `c/app.js`.
- Moving heavy DOM HTML builders (`renderTimeline*`, thumbs, lightbox, Rx/weight toggles) into domains.
- **Lazy drug-note hydration** — **deferred** (non-goal this slice): entangled with `renderTimelineMedItem` / `renderTimelineDrugNotes` and needs measurable HTML-byte / render-time evidence; schedule as follow-up timeline view slice.
- Dual-write to `modules/visit` Map stores; schema / contract changes; IndexedDB; bundler; CSS redesign; medical-copy changes.
- Alerts / vaccines / parasite / emergency extractions.
- Listener-system rewrite solely to cut listener count.

## Risks

- **Weight delta correctness:** wrong previous-visit map (date sort / same-day index) breaks ↑↓/= and days-since chrome — must preserve current chronological rules and unit tests.
- **Proof / imaging data loss:** clear-slot or imaging splice bugs can wipe nested med photos or wrong index; ensure slot keys (`bag`/`rx`/`drug`, `xray`/`us`) and `IMAGING_PHOTOS_MAX` parity.
- **Stale timeline after pet switch:** facades must still go through existing render coordinator / `applySelectedPet`; extraction must not bypass dirty flush for timeline screen.
- **Medical semantics:** source tags, Rx expand, dose display in adjacent med list, and reference-only disclaimer must not change; Pharmacist reviews adjacency even though med orchestration stays in `app.js`.
- **Facade recursion / bootstrap order:** scripts must load visits → timeline → `c/app.js`; wrappers must not call themselves.
- **Clinic label injection:** `findVisitByLink` depends on `visitClinicLabel` / i18n — inject `clinicLabelOf` rather than importing DOM/`t` into the domain.
- **C/B drift:** C-only wiring means B remains on monolith helpers until cover; document clearly so Victor does not expect Pages change.
- **Accidental modules dual-write:** easy mistake if someone “syncs” `createVisit` — forbid in acceptance.

## Acceptance criteria

### Architecture

- [ ] `domains/visits` and `domains/timeline` exist with public APIs only; no DOM / `localStorage` / private cross-domain access.
- [ ] Controllers mutate only via `pets[]` visit references; no `modules/visit` store writes.
- [ ] Dependency direction respected; timeline uses visits public helpers only.
- [ ] Compatibility function names used by listeners remain available in `c/app.js` as thin facades.

### Behavior (C)

- [ ] Timeline weight display, edit/save, delta vs previous, and days-since match pre-extract C behavior.
- [ ] Proof thumbs collect / lightbox / clear-slot still work; nested med photos clear with slot.
- [ ] Visit imaging ensure / thumbs / clear / max append parity preserved.
- [ ] Visit link encode/parse/find parity for existing med-link flows that call those helpers.
- [ ] Pet switch → open timeline shows current pet visits (no stale previous pet).
- [ ] Source tags, Rx block expand, med list, and medical disclaimer semantics unchanged.
- [ ] zh-Hant / en / ja / ko dynamic chrome still refreshes; user-authored notes/clinic names unchanged.

### Surface / tooling

- [ ] Only C + shared `domains/visits|timeline` + QA tests changed; formal B untouched.
- [ ] Zero-build: `c/index.html` script order works under repo-root `python3 -m http.server`.
- [ ] `node --test qa/tests/*.test.js` passes including new timeline/visits boundary tests.

## QA / review routing

- **QA required** — weight save, proof/imaging clear, pet-switch timeline freshness, facade regressions; include automated boundary tests.
- **Pharmacist required** — visit weight and timeline med / Rx display adjacency; confirm no dose/unit/frequency/duration/source-tag/disclaimer drift (even though med orchestration is not extracted).
- **UI light compatibility** — no intentional visual redesign; spot-check timeline chrome parity on C only (not a visual taste pass).

## Rollback

- Candidate stays off mainline (`proposal/timeline-visits-controller` or `proposals/20260826-timeline-visits-controller/preview`).
- Roll back by removing new domain scripts/tags and restoring `c/app.js` helper blocks from the candidate diff.
- No data migration; no Pages publish in this slice.

## Follow-ups (not this Gate A)

1. Lazy drug-note hydration + timeline HTML byte / render-time measurement.
2. Meds / compound / pending-drug controller.
3. Victor-confirmed C → B cover + Pages publish for shared domains + B facades.
4. Optional later: runtime adapter from `pets[]` snapshots → `PetLive.visit` **read** paths only (still no dual-write unless a dedicated proposal).

## Gate

This proposal stops at Gate A. No Builder, candidate product edit, or C/B cover may start until Victor confirms.

## Notes for Victor

Gate A approved 2026-08-26.

**Standing north star (Victor):** 任何功能都應拆成獨立積木，避免在一整盒裡翻找。本 slice 只做 Timeline + Visits；後續 meds／alerts／vaccines／parasite／emergency／pet lifecycle 依同原則一領域一刀繼續拆。本 build 不因此擴大 `builder_scope`。
