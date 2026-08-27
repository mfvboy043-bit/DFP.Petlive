# Contrast — labs + imaging view render (C only)

## Mainline (before)

| Behavior | Location |
|---|---|
| Lab list HTML inline | `c/app.js` `renderLabList` (~48 lines) |
| Imaging list HTML inline | `c/app.js` `renderImagingList` (~34 lines) |
| Emergency lab/imaging sub-lines | facade (~32 lines) |
| Lab CRUD / imaging entries brain | `domains/labs/*`, `domains/imaging/controller.js` ✅ |

## Candidate

| Behavior | Location |
|---|---|
| Lab list + emergency nav | `domains/labs/render.js` |
| Imaging list + emergency nav | `domains/imaging/render.js` |
| Form previews / clinic search | facade (unchanged) |

## Files touched

- `apps/web/domains/labs/render.js` (new)
- `apps/web/domains/imaging/render.js` (new)
- `apps/web/c/app.js`
- `apps/web/c/index.html`
- `qa/tests/web-labs-render.test.js`
- `qa/tests/web-imaging-render.test.js`
