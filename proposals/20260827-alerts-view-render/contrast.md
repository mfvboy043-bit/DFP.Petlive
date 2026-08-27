# Contrast — alerts view render (C only)

## Mainline (before)

| Behavior | Location |
|---|---|
| `renderAlertItem` inline HTML | `c/app.js` (~40 lines) |
| `renderAlerts` flat + sectioned | facade (~48 lines) |
| Alert merge / CRUD | `domains/alerts/controller.js` ✅ |

## Candidate

| Behavior | Location |
|---|---|
| Item + flat + sections HTML | `domains/alerts/render.js` |
| Title/sub + form + badge | facade (unchanged) |

## Files touched

- `apps/web/domains/alerts/render.js` (new)
- `apps/web/c/app.js`
- `apps/web/c/index.html`
- `qa/tests/web-alerts-render.test.js`
