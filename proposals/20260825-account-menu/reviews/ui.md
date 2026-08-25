# UI review
Verdict: conditional

## Summary
Signed-in chip + compact popover stay in topbar chrome, use existing Petlive cream/sage tokens, and do not invade the home hero. Long names/emails ellipsis correctly; signed-out silhouette path is preserved. Conditional on mobile topbar crowding and short popover tap targets.

## Findings
- [UI-001] [P2] home topbar (narrow phones) — Signed-in actions become alerts + rainbow + name pill (`max-width: min(38vw, 148px)`). That can starve `.brand-mark` on ~320–360px widths (net wider than the silhouette it replaces). — Cap tighter under a small breakpoint, or collapse to avatar-only (name via `title` / popover) below ~360px.
- [UI-002] [P2] account popover actions — `.account-popover-action` uses `padding: 10px` with no `min-height`, so rows land ~33–36px, below Petlive `--tap` / comfortable mobile targets. — Use `min-height: 44px` (or `--tap`) and keep the quiet leaf-pale hover.
- [UI-003] [P3] chip / popover avatar — No broken-image fallback if the Google `picture` URL fails; a dead `<img>` can flash beside the name. — On `error`, hide the image and show the initial fallback.
- [UI-004] [P3] popover actions focus/touch — Affordance is `:hover` only; keyboard/touch get little pressed/focused feedback. — Mirror hover with `:focus-visible` / `:active`.
- [UI-005] [P3] `styles.css` desktop home — Same candidate diff also switches large-desktop `.pet-switcher` from 2-column to stacked. Outside this proposal’s account chrome; confirm intentional before Gate B so home composition isn’t an accidental adopt.

## Notes (non-issues)
- Brand / hero: change is topbar-only; home hero brand hierarchy unchanged.
- Card restraint: popover is an interaction menu, not a decorative hero card — OK.
- Anti-AI-default: uses `--leaf-*`, `--paper`, `--line`, existing shadows; no purple/indigo or new Inter stack.
- Truncation: chip name, popover name, and email use ellipsis + `min-width: 0`; chip `title` carries the full display string.
- Motion: none added — fine for this chrome pattern.
