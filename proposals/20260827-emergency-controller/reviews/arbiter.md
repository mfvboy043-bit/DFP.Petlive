# Arbiter — 20260827-emergency-controller (iteration 1)

**Decision:** `candidate_ready`

## Reviews present

| Reviewer | File | Verdict |
|---|---|---|
| QA | `reviews/qa.md` | conditional |
| Pharmacist | `reviews/pharmacist.md` | conditional |
| UI | `reviews/ui.md` | pass |

All assigned reviews present — proceed.

## Issue map

| ID | Source | Severity | Classification | Notes |
|---|---|---|---|---|
| QA-001 | QA | medium | non_blocking | Domain + tests untracked / C wiring uncommitted on `proposal/emergency-controller`. Worktree boots; fresh checkout lacks EM scripts. Candidate hygiene before Gate B — not medical safety or data loss. |
| QA-002 | QA | low | non_blocking | EM-04 locks adapter/selectors only; C → `generateEmergencyCard` / local fallback verified by static read. Coverage gap, not a product defect. |
| MED-001 | Pharmacist | medium | non_blocking | Compound flatten inherits parent `frequency`; free-text `ing.dose` may be omitted by `formatMedDose`. Pre-extract parity; advisory readability — not a new clinical-authority or data-loss regression from EM-01…04. |
| MED-002 | Pharmacist | low | non_blocking | Source tags kept on derived rows but emergency med chrome does not surface them. Residual adjacency; HTML stays in C / out of EM scope. |
| MED-003 | Pharmacist | low | non_blocking | `parseDurationDaysFromDose` still Chinese `天` only. Preserved limitation; do not invent durations without product rules. |
| UI-001 | UI | P3 | non_blocking | Worktree also carries screen-head / copy-summary chrome deltas outside EM builder_scope. Isolate before C→B cover if a pure EM diff is wanted. |

## Blocking

None.

- No high / P1 / reject items.
- No medium finding that breaks medical safety or loses user data vs pre-extract.
- QA parity: snapshot fields, injectFail ≠ empty, local fallback, copy on local truth, other domain boots, no dual-write, coordinator onError shell — pass; `web-emergency.test.js` 9/9.
- MED-001 is medium but pre-extract display parity / advisory; not promoted to blocking.

## Non-blocking

- QA-001
- QA-002
- MED-001
- MED-002
- MED-003
- UI-001

## Decision rationale

Behavior-preserving EM-01…04 thin adapter + selectors on C. Pharmacist and QA conditionals are pre-extract residuals, advisory med readability, and candidate-branch commit hygiene. UI pass with P3 worktree hygiene only. Nothing requires a revision Builder before Gate B presentation.

**Gate B prep (orchestrator / Version Steward):** commit EM artifacts (`domains/emergency/*`, `qa/tests/web-emergency.test.js`, C wiring) onto `proposal/emergency-controller`; write `contrast.md`; present Gate B to Victor. Do not merge or treat this as adopt.

## Rerun

None (no revision Builder).

## Builder scope (if revision)

`[]` — no blocking IDs.

## Halt

N/A (`iteration` 1 < `max_iterations` 3; no blockers).
