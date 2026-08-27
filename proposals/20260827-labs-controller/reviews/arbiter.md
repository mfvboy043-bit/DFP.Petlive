# Arbiter — 20260827-labs-controller (iteration 1)

**Decision:** `candidate_ready`

## Issue map

| ID | Source | Severity | Classification | Notes |
|---|---|---|---|---|
| QA-001 | QA iter0 | high | **resolved** | `c/index.html` loads `domains/labs/*` before `app.js`. |
| QA-002 | QA iter0 | medium | non_blocking | Facades delegate read/write to `labsController`; acceptable shell pattern. |
| QA-003 | QA iter0 | medium | non_blocking | Commit artifacts at Gate B adopt. |
| UI-001 | UI | low | non_blocking | Script-order hygiene only. |

## Decision rationale

Iteration-1 fixes script tags. Domain APIs match proposal LB-01..04. C-only; B untouched. No medical-safety regressions.
