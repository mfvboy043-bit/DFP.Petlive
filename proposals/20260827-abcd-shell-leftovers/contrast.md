# Contrast: main vs `cursor/abcd-shell-leftovers-8ec1`

## Summary

| | Main | Candidate (C) |
|---|---|---|
| A Vaccine form chips HTML | inline in `fillVaccineNameOptions` | `vaccines/render.js` `buildFormChipsHtml` |
| B Calendar chooser pending/show/close | `pendingCalendarPayload` + DOM in facade | `shell/calendar-chooser.js` |
| C Home alert badge copy | inline `t()` in `renderAlertBadge` | `alerts/render.js` `buildHomeBadgePresentation` |
| D Timeline RX/imaging toggles | inline open/close strings in facade | `timeline/render.js` toggle presentation helpers |
| B surface | unchanged | **not covered** — ask Victor |

## Unchanged

- `VACCINE_PRESETS` catalog in facade
- Google/Apple `window.open` / ICS download
- Photo crop open/save
- `syncAlertNavTone`

## Verify

```bash
node --check apps/web/c/app.js
node --test qa/tests/web-vaccines-render.test.js qa/tests/web-alerts-render.test.js qa/tests/web-timeline-render.test.js qa/tests/web-shell-calendar-chooser.test.js
```
