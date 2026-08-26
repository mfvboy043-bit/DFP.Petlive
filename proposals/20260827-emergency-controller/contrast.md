# Contrast: mainline vs Emergency candidate

## Candidate

- Branch: `proposal/emergency-controller`
- Path: `proposals/20260827-emergency-controller`
- Surface: **C only** + shared `domains/emergency`
- Status: `candidate_ready` (iteration 1)

## Mainline behaviors

1. `buildEmergencySnapshot` / `deriveActiveEmergencyMeds` / copy text builders inline in `c/app.js`.
2. C prefers `PetLive.emergency.generateEmergencyCard` with pets[] snapshot + injectFail.
3. `_degraded` drives temporary-unavailable chrome; empty lists use different copy.
4. Formal B unchanged by this Gate A scope.

## Candidate behaviors

1. Thin adapter builds snapshot + active meds; selectors for copy payload + degraded flags.
2. C facades still call existing `PetLive.emergency` bridge — no second composition engine.
3. Copy-card stays on local pets[] truth (not module-degraded empties).
4. All `renderEmergency*` HTML remains in C.

## Files to adopt (this proposal only)

### Add
- `apps/web/domains/emergency/adapters.js`
- `apps/web/domains/emergency/selectors.js`
- `qa/tests/web-emergency.test.js`

### Change
- `apps/web/c/app.js` — emergency compose + facades
- `apps/web/c/index.html` — emergency script tags + cache `?v=`

### Exclude
- Unrelated C WIP (UI-001)
- Formal B until Victor confirms C → B cover
- MED-001 compound dose display (advisory; pre-existing parity)

## Reviewer verdicts

- Pharmacist: conditional (MED-001 medium advisory; MED-002/003 low) — Arbiter: non-blocking
- QA: conditional → QA-001 commit hygiene; QA-002 low
- UI: pass
- Arbiter: `candidate_ready`

## Merge checklist (after 採用 only)

- [x] Victor said 採用
- [x] Cherry-pick onto main (scoped; index conflicts kept main UI WIP)
- [x] Set proposal `status: adopted`
- [ ] C → B cover — ask Victor separately (not auto)
