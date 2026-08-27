# Contrast: drug catalog single path

## Mainline before

- Seed already single: `modules/drug/seed.js`
- C (and meds) still had a second haystack search copy

## After candidate

- `domains/drugs/adapter.js` owns search + resolveEnrichedDrug
- C/B facades thin; medications injects adapter (no searchLocal)
- Tests: `web-drugs.test.js` + updated `web-medications.test.js`

## Files

- `apps/web/domains/drugs/adapter.js` (new)
- `apps/web/domains/medications/controller.js`
- `apps/web/c/app.js`, `c/index.html`
- `apps/web/app.js`, `index.html`
- `qa/tests/web-drugs.test.js`, `web-medications.test.js`
- `ARCHITECTURE.md`
- `proposals/20260827-drug-catalog-single-path/*`
