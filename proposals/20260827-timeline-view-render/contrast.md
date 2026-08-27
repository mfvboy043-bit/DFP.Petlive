# Contrast — timeline view render (C only)

## Mainline (before)

| Piece | Location |
|---|---|
| Visit/med HTML builders | Inline in `c/app.js` (~450 lines) |
| Timeline selectors + drug-note models | Already `domains/timeline/` |

## Candidate (`proposal/timeline-view-render`)

| Piece | Location |
|---|---|
| Proof/imaging thumbs, weight, RX block, med items, list | `domains/timeline/render.js` |
| DOM write, lazy hydrate, expand side effects | Thin `renderTimeline` in `c/app.js` |

## Not in this candidate

- Formal B cover
- PERF-03 keyed reconcile
- Emergency card DOM extraction
