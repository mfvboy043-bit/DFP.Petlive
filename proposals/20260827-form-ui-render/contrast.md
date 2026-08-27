# Contrast: main vs `proposal/form-ui-render`

## Moved to building blocks

| UI | Module |
|---|---|
| Breed search + chips | `domains/breed/render.js` |
| Clinic/drug search, pending meds, compound swatches | `domains/medications/render.js` |
| Lab photo previews + clinic results | `domains/labs/render.js` (extend) |
| Imaging slot previews | `domains/imaging/render.js` (extend) |
| Parasite product chips | `domains/parasite/render.js` (extend) |
| Proof photo preview | `shell/proof-preview.js` |

## Still in facade

Form read/validate, search algorithms, chip sync (`setSelectedBreed`, `syncLabTypeChips`), event listeners.

## Verify

```bash
node --check apps/web/c/app.js
node --test qa/tests/web-breed-render.test.js qa/tests/web-medications-render.test.js qa/tests/web-shell-proof-preview.test.js qa/tests/web-labs-render.test.js qa/tests/web-imaging-render.test.js qa/tests/web-parasite-render.test.js
```
