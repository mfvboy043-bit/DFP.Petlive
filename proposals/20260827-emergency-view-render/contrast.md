# Contrast — emergency view render (C only)

## Mainline (before)

| Piece | Location |
|---|---|
| Alerts / meds / owner HTML | Inline in `c/app.js` |
| Snapshot / copy / degraded flags | `domains/emergency/adapters.js`, `selectors.js` |

## Candidate (`proposal/emergency-view-render`)

| Piece | Location |
|---|---|
| Card list HTML builders | `domains/emergency/render.js` |
| Module bridge + DOM paints | Thin facades in `c/app.js` |

## Not in this candidate

- Formal B cover
- Nav sub-lines (vaccine/lab/imaging)
- Photo crop shell
