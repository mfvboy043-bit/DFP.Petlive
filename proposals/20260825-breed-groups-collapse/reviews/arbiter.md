# Arbiter decision

**Decision:** `candidate_ready`  
**Iteration:** 2 / 3  
**Reviewed:** `reviews/qa.md`, `reviews/ui.md` (pharmacist skipped)

## Mapping

| ID | Source | Severity | Class | Rationale |
|---|---|---|---|---|
| QA-001 | QA | medium (was) | **resolved** | Iter 2: `setSelectedBreed` rebuilds collapsed preview via `renderCollapsedBreedChips` on every selection change; stale non-common chip no longer remains. QA verdict `pass`. |
| UI-001 | UI | P2 | non_blocking | Tap target below `--tap`; mobile still usable; does not fail acceptance. Unchanged from iter 1. |
| UI-002 | UI | P2 | non_blocking | Collapse control below fold after expand; discoverability only. Unchanged from iter 1. |
| UI-003 | UI | P3 | non_blocking | Optional pin separator. Unchanged from iter 1. |
| UI-004 | UI | P3 | non_blocking | Optional singleton group headers. Unchanged from iter 1. |

## Blocking

- *(none)*

## Non-blocking

- UI-001, UI-002, UI-003, UI-004

## builder_scope

- *(empty — no revision)*

## rerun

- *(none)*

## Notes

- Pharmacist correctly skipped (no med/dose/diagnostic surface).
- Prior blocking **QA-001** fixed in revision 2; QA re-run only as scoped — pass.
- Residual UI polish may ship later or be accepted at Gate B; do not expand Builder scope without Victor ask.
- **Gate B:** stop for Victor adopt / 採用. Arbiter does not merge or declare adopted.
