# QA — labs + imaging view render

Scope: LI-05 C candidate (`proposal/labs-imaging-view-render`).

## Checks

- List + emergency nav builders in `domains/labs/render.js` and `domains/imaging/render.js`
- HTML escape on lab clinic/note; imaging empty CTA preserved
- Regression: `web-labs.test.js`, `web-imaging.test.js`

## Result

pass — `node --test qa/tests/web-labs-render.test.js qa/tests/web-imaging-render.test.js`
