# QA — vaccines view render

Scope: VA-05 C candidate (`proposal/vaccines-view-render`).

## Checks

- List HTML builders in `domains/vaccines/render.js` (no DOM / literal `t()`)
- Strip + emergency nav presentation objects match prior facade tones
- Existing `web-vaccines.test.js` regression

## Result

pass — `node --test qa/tests/web-vaccines-render.test.js qa/tests/web-vaccines.test.js`
