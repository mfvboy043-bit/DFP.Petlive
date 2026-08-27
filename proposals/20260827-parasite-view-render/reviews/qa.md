# QA — parasite view render

Scope: PA-05 C candidate (`proposal/parasite-view-render`).

## Checks

- Strip presentation in `domains/parasite/render.js` (no DOM / literal `t()`)
- Optional cat heartworm + unset + protected/approaching tones
- Existing `web-parasite.test.js` regression

## Result

pass — `node --test qa/tests/web-parasite-render.test.js`
