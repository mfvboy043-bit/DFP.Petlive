# Arbiter — 20260826-parasite-controller (iteration 1)

**Decision:** `candidate_ready`

## Reviews present

| Reviewer | File | Verdict |
|---|---|---|
| QA | `reviews/qa.md` | conditional |
| Pharmacist | `reviews/pharmacist.md` | pass |
| UI | `reviews/ui.md` | pass |

All assigned reviews present — proceed.

## Issue map

| ID | Source | Severity | Classification | Notes |
|---|---|---|---|---|
| QA-001 | QA | medium | non_blocking | Domain + tests untracked / C wiring uncommitted on named branch; worktree boots, fresh checkout 404s. Hygiene before Gate B commit — not medical safety or data loss. |
| QA-002 | QA | low | non_blocking | Pets-graph persist skipped after parasite save; pre-extract; proposal follow-up #2. |
| QA-003 | QA | low | non_blocking | Pet-switch while on parasite screen does not re-fill; pre-extract; typical home→enter path OK. |
| MED-001 | Pharmacist | low | non_blocking | Due-today stays `approaching` (`days < 0` unprotected) vs contract `<= 0`; pre-extract; advisory docs/behavior later. |
| UI-001 | UI | P3 | non_blocking | Unrelated emergency chrome deltas in same worktree; isolate before C→B cover if a pure PA diff is wanted. |

## Blocking

None.

- No high / P1 / reject items.
- No medium finding that breaks medical safety or loses user data vs pre-extract.
- QA parity: status lamps, optional cat heartworm, dual sync, dosedToday vs past, calendar payload boundary, multi-pet write isolation, other domain boots — no material regressions; `web-parasite.test.js` 12/12.

## Non-blocking

- QA-001
- QA-002
- QA-003
- MED-001
- UI-001

## Decision rationale

Behavior-preserving PA-01..04 extract. Pharmacist and UI pass; QA conditionals are pre-existing persist/pet-switch residuals plus candidate-branch commit hygiene. Nothing requires a revision Builder before Gate B presentation.

**Gate B prep (orchestrator / Version Steward):** commit PA artifacts onto `proposal/parasite-controller` so the branch alone boots and tests; write `contrast.md`; ask Victor Gate B (採用 / adopt). Do not treat this decision as adopt.

## Rerun

None (no revision Builder).

## Builder scope (if revision)

`[]` — no blocking IDs.

## Halt

N/A (`iteration` 1 < `max_iterations` 3; no blockers).
