# QA review
Verdict: conditional

## Summary

Reviewed EM-01..EM-04 against mainline C behavior and the focus checklist. Working-tree candidate wires a thin `domains/emergency` adapter + selectors on C: snapshot/active-meds extraction matches pre-extract field semantics; `renderEmergencyCard` still prefers `PetLive.emergency.generateEmergencyCard` with `{ snapshot, injectFail }`; `_degraded` (via `degradedSections`) still drives `emergencyDegraded*` chrome distinct from `noAlertItem` / `noMeds`; missing/null bridge still falls back to `renderEmergencyCardLocal`; copy-card stays on local pets[] truth through `copyPayload`; domain files have no DOM/`t()`/`PetLive`/module dual-write; other domain script tags remain and emergency scripts are appended only. `node --test qa/tests/web-emergency.test.js` → 9/9 pass.

**Blocker for candidate_ready:** EM artifacts are not committed on `proposal/emergency-controller` — see QA-001.

## Findings

### Candidate branch missing committed emergency artifacts
- ID: QA-001
- Severity: medium
- Steps:
  1. Check out `proposal/emergency-controller` at HEAD.
  2. Inspect `git show HEAD:apps/web/c/index.html` for `domains/emergency` script tags; `git ls-files apps/web/domains/emergency qa/tests/web-emergency.test.js`.
  3. Compare with working tree `git status` for those paths plus `apps/web/c/app.js`.
- Expected: Branch HEAD contains `domains/emergency/{adapters,selectors}.js`, EM-04 tests, and C wiring so a fresh clone cold-loads the emergency extraction.
- Actual: HEAD has no emergency domain scripts/tags; `apps/web/domains/emergency/` and `qa/tests/web-emergency.test.js` are **untracked**; C facade/script deltas are **uncommitted**. Review repro depends on local working-tree files.

### No automated coverage of C → PetLive.emergency bridge path
- ID: QA-002
- Severity: low
- Steps:
  1. Run `node --test qa/tests/web-emergency.test.js`.
  2. Look for a test that loads C facade wiring or asserts `generateEmergencyCard` is invoked with snapshot + injectFail and that null/`!generate` uses local fallback.
- Expected: At least one automated check for the EM-03 call/fallback contract (or documented manual-only).
- Actual: EM-04 covers adapter/selectors only (shape, meds rules, `degradedSections`, copy payload, no-DOM). C bridge path verified by static read of `renderEmergencyCard` / coordinator `onError` only; manual spot-check on C recommended (`?injectFail=` / hide PetLive).

## Focus-area checklist (pass)

| Check | Result |
|---|---|
| Snapshot parity vs pre-extract `buildEmergencySnapshot` | Pass — same pet / latestWeight / alerts / currentMedications fields; meds flatten/skip/window unchanged |
| injectFail / `_degraded` ≠ empty | Pass — degraded uses `emergencyDegradedAlerts\|Meds\|Weight`; empty lists still `noAlertItem` / `noMeds` |
| Local fallback | Pass — `!generate` or `PetLive.call` → null → `renderEmergencyCardLocal` |
| Copy uses local truth | Pass — `copyPayload` → `adapter.buildSnapshot` / active meds; not module-degraded lists |
| `PetLive.emergency` still called from C | Pass — facade still `generate(..., { snapshot, injectFail })` |
| Other domain boots / script order | Pass — pets→…→parasite unchanged; emergency scripts appended before `app.js` |
| No dual-write | Pass — domain read-only; bridge still snapshot-preferring; no module Map writes |
| Domain no DOM | Pass — static + runtime traps in EM-04 |
| Coordinator onError shell | Pass — `paintEmergencyCardDegradedShell` still registered on `emergencyCard` |
| Formal B emergency cover | Pass for this slice — B not wired to `domains/emergency` (out of EM scope) |

## Automated tests

```text
node --test qa/tests/web-emergency.test.js
# 9 pass, 0 fail
```
