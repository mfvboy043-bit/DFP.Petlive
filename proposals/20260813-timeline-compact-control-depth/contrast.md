# Mainline vs candidate

## Mainline

- Compact timeline controls use flatter solid or translucent fills with lighter borders.
- Weight comparison rows retain the current wrapping layout and semantic up/down/same colors.
- Visit prescription controls remain green across their existing states.
- Static `.tl-tag` items use the existing low-contrast edge treatment.

## Candidate

- Pending weight, visit prescription, and medication-note controls gain restrained gradients, inset highlights, shadows, and short lift/press transitions.
- Hover-capable, touch `:active`, keyboard `:focus-visible`, open-state, and reduced-motion behavior are covered.
- Static `.tl-tag` items gain a clearer flat border without hover, shadow, movement, or focus cues.
- Current mainline weight-comparison wrapping and semantic up/down/same colors are preserved (`QA-001` resolved).
- The combined visit prescription control remains green on hover (`UI-001`, duplicate `QA-002`, resolved).
- Existing 28–32 px hit areas remain unchanged as an out-of-scope, non-blocking limitation (`UI-002`).

## Files touched

- Candidate only: `proposals/20260813-timeline-compact-control-depth/preview/apps/web/styles.css`
- Proposal records: `proposal.md`, `state.yaml`, `contrast.md`, and `reviews/*.md`
- Mainline product file adopted: `apps/web/styles.css`

## Adoption note

Adopted by applying only the reviewed dimensional/tag declarations to the current mainline CSS; unrelated concurrent work and current weight-comparison styles were preserved.
