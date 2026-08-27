# Contrast — vaccines view render (C only)

## Mainline (before)

| Behavior | Location |
|---|---|
| Vaccine list HTML inline | `c/app.js` `renderVaccineList` (~42 lines) |
| Home strip tone + copy inline | `c/app.js` `renderVaccineStrip` (~37 lines) |
| Emergency nav tone inline | `c/app.js` `renderEmergencyVaccineNav` (~33 lines) |
| Protection / sort / successor brain | `domains/vaccines/selectors.js` ✅ |

## Candidate

| Behavior | Location |
|---|---|
| List + strip + emergency nav presentation | `domains/vaccines/render.js` |
| Thin DOM wrappers | `c/app.js` |
| Form chips / save / calendar | facade (unchanged) |

## Files touched

- `apps/web/domains/vaccines/render.js` (new)
- `apps/web/c/app.js`
- `apps/web/c/index.html`
- `qa/tests/web-vaccines-render.test.js`
