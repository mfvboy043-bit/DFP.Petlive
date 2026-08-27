# QA — alerts view render

Scope: AL-05 C candidate (`proposal/alerts-view-render`).

## Checks

- Item / flat / sections builders in `domains/alerts/render.js`
- Escape on alert id; section `is-editing` + `aria-pressed`
- Regression: `web-alerts.test.js`

## Result

pass — `node --test qa/tests/web-alerts-render.test.js`
