# Arbiter decision

**Decision:** `revision_required`  
**Iteration:** 1 / 3  
**Reviewed:** `reviews/qa.md`, `reviews/ui.md` (pharmacist skipped)

## Mapping

| ID | Source | Severity | Class | Rationale |
|---|---|---|---|---|
| QA-001 | QA | medium | **blocking** | Touch blur clears `#breed-results` before suggestion click commits → form stays `__custom__` with typed query. Breaks acceptance「點選建議 → breedKey」; known-key select fails on primary mobile path. |
| QA-002 | QA | low | non_blocking | Empty `setSelectedBreed("")` can leave stale search face; submit still toasts need-breed via resolve. Confusing chrome, not silent wrong key write. |
| UI-001 | UI | P2 | non_blocking | Dual primary (chips + always-on search); hierarchy polish, acceptance still met on desktop paths. |
| UI-002 | UI | P2 | non_blocking | Editable face after known pick; accidental demote risk is polish, not failed select-on-tap. |
| UI-003 | UI | P2 | non_blocking | Results placement / keyboard bury; usable with scroll; no P1. |
| UI-004 | UI | P3 | non_blocking | Permanent long JA/KO hint weight. |
| UI-005 | UI | P3 | non_blocking | Optional result soft-cap; max-height already bounds dump. |

## Blocking

- **QA-001** — On touch, cancel or delay blur-hide so suggestion `pointer`/`touch`/`click` can call `setSelectedBreed(value)` before the list DOM is cleared (parity with drug-search `mousedown`/`preventDefault` guard, or equivalent timer cancel on `pointerdown`/`touchstart`).

## Non-blocking

- QA-002, UI-001, UI-002, UI-003, UI-004, UI-005

## builder_scope

- QA-001

## rerun

- qa

## Notes

- Pharmacist correctly skipped (no med/dose/diagnostic surface).
- No high / P1 / reject verdicts. QA-001 elevated from medium because it fails the core accept criterion on touch and stores the wrong breed path.
- Do not fold UI-001–005 or QA-002 into this revision unless Victor asks.
- Iteration 1 < `max_iterations` 3 → `revision_required`, not halted.
- Gate B stays pending. Parent: snapshot `reviews/` → `iterations/01/`, set Builder on `builder_scope` only, then rerun QA.
