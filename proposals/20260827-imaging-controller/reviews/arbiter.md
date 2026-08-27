# Arbiter — 20260827-imaging-controller (iteration 1)

**Decision:** `candidate_ready`

## Issue map

| ID | Source | Severity | Classification | Notes |
|---|---|---|---|---|
| QA-001 | QA iter0 | high | **resolved** | `c/index.html` loads `domains/imaging/controller.js`. |
| QA-002 | QA iter0 | high | **resolved** | Timeline accepts `visits.visitHasImaging` fallback; visits imaging kept for formal B until cover. |
| QA-003 | QA iter0 | medium | **resolved** | Pet switch clears imaging pending buckets in `afterSelect`. |
| QA-004 | QA iter0 | medium | non_blocking | Commit at adopt. |
| UI-001 | UI | low | non_blocking | `formatImagingTypes` → keys + `t()`; no chrome drift. |

## Decision rationale

C wired to imaging domain with `setVisitImaging`. Shared timeline backward-compat preserves formal B while C uses imaging inject. Visits duplicate deferred to B cover per contrast — documented, not blocking C adopt.
