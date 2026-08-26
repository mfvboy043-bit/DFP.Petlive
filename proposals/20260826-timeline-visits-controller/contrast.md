# Contrast: mainline vs Timeline + Visits candidate

## Candidate

- Branch: `proposal/timeline-visits-controller`
- Path: `proposals/20260826-timeline-visits-controller`
- Surface: **C only** (`apps/web/c/` + shared `domains/visits|timeline`)
- Status: `candidate_ready` (iteration 2)

## Mainline behaviors

1. Visit weight / proof / imaging / link helpers live inline inside `c/app.js`.
2. Timeline builds previous-visit map and Rx flags inside `renderTimeline`.
3. No `PetLiveWeb.domains.visits` / `timeline` scripts.
4. Formal B and Pages unchanged by this proposal’s intent.
5. Med dose/course helpers remain inline in `c/app.js` (same as main for TV adopt).

## Candidate behaviors

1. Same visit mutations and timeline chrome; logic moved behind `PetLiveWeb.domains.visits` + `timeline` public APIs.
2. `c/app.js` keeps thin facades + HTML renderers; `renderTimeline` consumes `buildTimelineEntries`.
3. `pets[]` still the only write truth; no `modules/visit` dual-write.
4. C loads `../domains/visits/controller.js` and `../domains/timeline/selectors.js` before `app.js`.
5. Boundary tests in `qa/tests/web-timeline-visits.test.js`.

## Files to adopt (this proposal only)

### Add
- `apps/web/domains/visits/controller.js`
- `apps/web/domains/timeline/selectors.js`
- `qa/tests/web-timeline-visits.test.js`

### Change (TV hunks only)
- `apps/web/c/app.js` — visits/timeline compose + facades + `buildTimelineEntries` wiring
- `apps/web/c/index.html` — visits/timeline script tags + `app.js` cache `?v=`

### Explicitly exclude from this adopt (UI-001 / WIP hygiene)
- `apps/web/c/styles.css` (parasite / screen-head WIP — would reflow Timeline「新增」)
- `apps/web/c/i18n.js` (unrelated parasite copy WIP)
- Parasite calendar chooser / dose-label HTML hunks in `c/index.html` if separable; if not, adopt script-tag + TV-related app.js only and leave parasite markup to its own proposal
- `apps/web/domains/medications/*`, `qa/tests/web-medications.test.js`, formal B (`apps/web/app.js`, root `index.html` / `styles.css`)
- No C → B cover / Pages publish until Victor separately confirms cover

## Reviewer verdicts

- Pharmacist: pass
- QA: pass (QA-001 resolved after revision; QA-002/003 non-blocking)
- UI: conditional (UI-001 non-blocking — exclude `styles.css`)
- Arbiter: `candidate_ready`

## Merge checklist (after 採用 only)

- [x] Victor said 採用
- [x] Reviews attached
- [x] Merge/copy into mainline without deleting proposal history (scoped per contrast)
- [x] Set proposal `status: adopted`
- [ ] C → B cover — ask Victor separately (not auto)
