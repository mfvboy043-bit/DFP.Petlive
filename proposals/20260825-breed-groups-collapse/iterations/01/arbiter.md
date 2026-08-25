# Arbiter decision

**Decision:** `revision_required`  
**Iteration:** 1 / 3  
**Reviewed:** `reviews/qa.md`, `reviews/ui.md` (pharmacist skipped)

## Mapping

| ID | Source | Severity | Class | Rationale |
|---|---|---|---|---|
| QA-001 | QA | medium | **blocking** | Collapsed preview must be `common-*` ∪ **current** selected ∪ `__custom__`. After reselecting a common/custom chip while collapsed, the prior non-common chip stays visible and unselected — fails acceptance preview rule (not storage corruption). |
| UI-001 | UI | P2 | non_blocking | Tap target below `--tap`; mobile still usable; does not fail acceptance. |
| UI-002 | UI | P2 | non_blocking | Collapse control below fold after expand; discoverability only; expand/collapse still works. |
| UI-003 | UI | P3 | non_blocking | Optional pin separator. |
| UI-004 | UI | P3 | non_blocking | Optional singleton group headers. |

## Blocking

- **QA-001** — Rebuild collapsed chip DOM (or remove stale non-common chips) whenever selection changes while collapsed, including when the new value already exists in the DOM (`setSelectedBreed` path that currently only toggles `selected` / `is-on`).

## Non-blocking

- UI-001, UI-002, UI-003, UI-004

## builder_scope

- QA-001

## rerun

- qa

## Notes

- Pharmacist correctly skipped (no med/dose/diagnostic surface).
- Do not expand scope to UI-001/002 polish in this revision unless Victor asks; Gate B can still accept those as residual.
- After Builder fixes QA-001: snapshot `reviews/` → `iterations/01/`, increment `iteration`, re-run QA only.
