# Arbiter — 20260825-account-menu (iteration 1)

## Decision
`candidate_ready`

## Reviews present
- pharmacist: skipped (no med)
- qa: conditional (`reviews/qa.md`)
- ui: conditional (`reviews/ui.md`)

## Blocking
None.

| ID | Why not blocking |
|---|---|
| — | No high / P1 / reject items. No medium finding breaks medical safety or loses user data. |

## Non-blocking
| ID | Severity | Note |
|---|---|---|
| QA-001 | medium | Chip + language overlays can both stay open (`stopPropagation`). Chrome UX; no data loss. |
| QA-002 | medium | Desktop `.pet-switcher` stack change is outside account-menu proposal text. Victor separately asked for this desktop fix; treat as intentional extra on the branch — **Gate B note**, not a revision blocker for account chrome. |
| QA-003 | low | Avatar `onerror` / letter fallback missing when `picture` URL fails. |
| UI-001 | P2 | Narrow topbar crowding (chip vs brand-mark ~320–360px). |
| UI-002 | P2 | Popover action rows below `--tap` (~33–36px). |
| UI-003 | P3 | Same avatar broken-image gap as QA-003. |
| UI-004 | P3 | Hover-only affordance; weak `:focus-visible` / `:active`. |
| UI-005 | P3 | Same out-of-scope desktop pet-switcher as QA-002 — confirm at Gate B before adopt. |

## Rerun
`[]` — no blocking IDs.

## Builder scope
`[]` — no revision required this iteration.

## Halt
N/A (`iteration` 1 < `max_iterations` 3; no blockers).

## Gate B handoff (parent)
Parent may present candidate for Victor adopt. Surface non-blocking list; call out **QA-002 / UI-005** so Victor knowingly adopts or strips the desktop pet-switcher CSS when merging. Arbiter does not decide Gate B.
