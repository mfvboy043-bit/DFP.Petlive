# QA review
Verdict: reject
Commit: `bcbcc97`
Scope checked: A–G on C only; formal B / `apps/web/app.js` untouched.

## Summary
Dates, clinics search, resize 0.82, pets-graph door, form toast mapping, script tags, and `node --check` / related qa tests look sound. **PERF-03 morph is not behavior-preserving under the facade’s shallow visit snapshot** — in-place visit mutations are misclassified as surface morph, so weight / meds / proofs / imaging can stay stale on the timeline.

## Findings

### QA-1 Timeline morph treats in-place structural edits as clinic/note-only patches
- Severity: high
- ID: QA-1
- Steps:
  1. On C, open a pet with ≥1 timeline visit; note displayed weight and RX/med lines.
  2. Save a new visit weight via the timeline weight control (`saveVisitWeightAtIndex` → `applySelectedPet` → `renderTimeline`), **or** append a medication / proof / imaging to an existing visit without adding/removing visits.
  3. Observe the same visit row after re-render (stay on or return to timeline).
  4. (Code) After first `renderTimeline`, `lastTimelineVisitsSnapshot = nextVisits.slice()` keeps the same visit object refs; mutate `pet.visits[i]` in place; call `planKeyedListReconcile(prevSigs, nextSigs, { previousVisits: snapshot, nextVisits: pet.visits })`.
- Expected: Plan mode is `partial` or `full`; row HTML rebuilds so weight, meds, proofs, imaging, and drug-note Map match data. Morph only when clinic/note surface changes on **distinct** visit snapshots.
- Actual: With shared refs, `visitStructuralFingerprint(prev) === visitStructuralFingerprint(next)` is always true, so mode becomes `morph` and `applyMorphTimelinePatches` only updates `.tl-clinic` / `.tl-note`. Weight/meds/proofs/imaging DOM and `drugNotesMedByPanelId` stay stale. Reproduced in Node against current `planKeyedListReconcile` + facade snapshot pattern (`mode: "morph"` after weight+med mutate). Unit tests pass only because they pass separate visit objects.

### QA-2 Morph early-return skips drug-note Map refresh (paired with QA-1)
- Severity: medium
- ID: QA-2
- Steps:
  1. Render timeline so `applyTimelineDrugNotePanels` populates `drugNotesMedByPanelId`.
  2. Add/change a medication on an existing visit (in-place), triggering `renderTimeline`.
  3. Open a drug-notes panel for that visit’s med.
- Expected: After structural med change, panels Map is rebuilt from `buildTimelineListHtml` (partial/full path).
- Actual: Wrong `morph` path (QA-1) returns before `applyTimelineDrugNotePanels`; Map keeps prior med refs. Even a “correct” morph intentionally skips Map refresh (OK for clinic/note-only); under QA-1 this becomes user-visible stale notes.

## Checked OK (no finding)
- **A Dates:** `core/dates.js` local-midnight `addDays` / `daysUntil` / `todayIsoLocal` match prior facade; parasite injects `todayISODate: todayIsoLocal`; vaccines get `daysUntil`.
- **C Brains:** `searchClinics` pins anonymous first; `resizeImageDataUrl` JPEG quality `0.82`, default maxEdge `480`; `formatAgeLabel` thresholds/keys preserved via inject `label`.
- **D Account chrome:** markup + `buildAccountChromePresentation` in shell; facade keeps DOM/toast wiring.
- **E Forms:** pet validate reasons → existing toast keys; clinic/symptom gates → toasts; submit listeners remain in facade.
- **F Pets-graph:** hydrate/persist/push via `createPetsGraph`; key `petlive-c-pets-graph`; archive via lifecycle splice + `applySelectedPet` → `schedulePetsGraphPersist`; no `modules/*` dual-write.
- **G Boot:** `c/index.html` loads `core/dates.js` / `core/pets-graph.js` / shell + domain scripts with `?v=20260827-leftover-17` before `c/app.js`; `node --check` clean on touched modules.
- **Tests:** `web-dates`, `web-pets-graph`, `web-timeline-render`, `web-clinics-catalog`, `web-shell-photo-crop`, `web-pets-lifecycle` — 34/34 pass (do not cover QA-1 facade snapshot).
- **Formal B:** no edits to `apps/web/app.js` / Pages in `bcbcc97`.

## Verdict rationale
Reject until QA-1 is fixed (deep-clone / structural fingerprint from last signatures / disable morph when `previousVisits[i] === nextVisits[i]`, or equivalent) and covered by a test that mirrors the facade shallow-snapshot pattern. QA-2 clears with that fix on structural paths.
