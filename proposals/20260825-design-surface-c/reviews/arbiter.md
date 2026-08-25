# Arbiter — 20260825-design-surface-c (iteration 1)

## Decision
`candidate_ready`

## Reviews present
- pharmacist: skipped (no med / discussion surface only)
- qa: pass (`reviews/qa.md`)
- ui: conditional (`reviews/ui.md`)

## Blocking
None.

| ID | Severity (reviewer) | Arbiter call |
|---|---|---|
| UI-001 | P1 (UI) | **Downgraded to non_blocking.** Discussion-only C for Cursor picker; QA confirms `.surface-c-banner` has `pointer-events: none` so topbar / CTA taps are not intercepted. Overlap / brand-mark clip is visually annoying but does not hide critical chrome or block interaction. Acceptable for Gate B with note; polish before adopt if Victor wants cleaner phone chrome. |

## Non-blocking
| ID | Severity | Note |
|---|---|---|
| UI-001 | P1→non_blocking | Banner and topbar share the same safe-area band; centered chip stacks on chrome and can clip ellipsized `.brand-mark`. Usable for design discussion; fix layout (stack above / corner chip + padding) when polishing C or before covering B. |
| UI-002 | P2 | Cream-glass pill matches topbar language; glanceability of「C · 討論版」could be stronger (ink / rail / top-edge strip). Acceptance “clear C mark” is met in copy; treatment is optional polish. |
| UI-003 | P3 | Banner content restraint is fine; no further chrome needed. |

## Rerun
`[]` — no blocking IDs.

## Builder scope
`[]` — no revision required this iteration.

## Halt
N/A (`iteration` 1 < `max_iterations` 3; no blockers).

## Gate B handoff (parent)
Parent may present candidate for Victor adopt / 採用. Surface non-blocking list; call out **UI-001** so Victor knowingly adopts C with banner/topbar overlap on phone, or asks for a quick polish pass before covering B. Arbiter does not decide Gate B.
