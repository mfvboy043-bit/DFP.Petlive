# Contrast: main vs `cursor/leftover-abcd-8ec1`

## Summary

| | Main (before) | Candidate (adopted + B cover) |
|---|---|---|
| A Crop session / drag | inline in `open/close/bindPetPhotoCropUi` | `shell/photo-crop.js` session helpers |
| B Drug-note hydrate | inline className + skip flag | `shouldHydrateDrugNotesPanel` + slot payload |
| C Copy card join | inline array join in facade | `emergency/render.js` `buildCopyCardText` |
| D Timeline rebuild | always `innerHTML` | skip-noop when signature+lang match |
| Surfaces | C only pre-Gate B | **C + formal B covered** |

## Unchanged

- Canvas crop export, `setPetPhoto`, pointer `addEventListener`
- Clipboard write
- Full keyed `.tl-item` patch (PERF-03 steps 2–3)

## Verify

```bash
node --check apps/web/c/app.js apps/web/app.js
node --test qa/tests/web-shell-photo-crop.test.js qa/tests/web-timeline-render.test.js qa/tests/web-emergency-render.test.js
```
