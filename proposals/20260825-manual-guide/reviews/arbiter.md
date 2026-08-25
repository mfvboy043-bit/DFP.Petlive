# Arbiter — 20260825-manual-guide (iteration 1)

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
| QA-001 | Medium CTA mismatch in demo (seed pets →「去新增寵物」dead-end). No data loss / wrong-pet write; demo read-only already blocks submit. Misleading empty-account framing only. |
| QA-002 | Low — header ← forces `home` vs history pop; chrome inconsistency, not safety. |
| UI-001–UI-005 | P2/P3 hierarchy, float clearance, FAQ polish, type, boundaries cue — no P1 / reject. |

## Non-blocking
| ID | Severity | Note |
|---|---|---|
| QA-001 | medium | `isSeedOnlyPets` treated as empty → primary CTA `add-pet` under `?demo=1`; submit toast-blocked. Prefer `manualCtaHome` when demo seeds present. |
| QA-002 | low | Manual `data-go="home"` always; entered from deep screen, ← does not pop like medical-alert. |
| UI-001 | P2 | Four stacked full-width CTAs flatten hierarchy; demote alt home/add. |
| UI-002 | P2 | Long EN/JA title in pill head can exceed `--e-head-float-h`; lead may tuck under chrome. |
| UI-003 | P2 | FAQ `summary::after` float + `overflow: hidden` clip; tap target under `--tap`. |
| UI-004 | P3 | FAQ answer 13px vs step body 14px. |
| UI-005 | P3 | Boundaries 是／不是 rely on muted color only. |

## Rerun
`[]` — no blocking IDs.

## Builder scope
`[]` — no revision required this iteration.

## Halt
N/A (`iteration` 1 < `max_iterations` 3; no blockers).

## Gate B handoff (parent)
Parent may present candidate for Victor adopt. Surface non-blocking list; call out **QA-001** (demo seed → empty CTA) as the main polish risk if adopted as-is. Arbiter does not decide Gate B.
