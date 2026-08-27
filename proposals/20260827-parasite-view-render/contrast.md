# Contrast — parasite view render (C only)

## Mainline (before)

| Behavior | Location |
|---|---|
| External/heartworm strip tone + copy inline | `c/app.js` `renderParasiteStrip` (~42 lines) |
| Slot status incl. cat optional | `domains/parasite/selectors.js` ✅ |
| Record / save / calendar brain | `domains/parasite/controller.js` ✅ |

## Candidate

| Behavior | Location |
|---|---|
| Strip presentation per kind | `domains/parasite/render.js` |
| Empty row presentation (B cover) | `buildEmptyStripRowPresentation` |
| Thin DOM loop | `c/app.js` |
| Product chips / forms | facade (unchanged) |

## Files touched

- `apps/web/domains/parasite/render.js` (new)
- `apps/web/c/app.js`
- `apps/web/c/index.html`
- `qa/tests/web-parasite-render.test.js`
