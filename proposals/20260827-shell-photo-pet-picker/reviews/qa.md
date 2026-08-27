# QA review — SH-05 shell photo + pet picker

**Branch:** `proposal/shell-photo-pet-picker` (`564b2e9`)  
**Surface:** C only (`apps/web/c/`)

## Automated

- [x] `node --check apps/web/c/app.js` — pass
- [x] `web-pets-render.test.js` — 3/3 pass
- [x] `web-shell-photo-crop.test.js` — 3/3 pass

## Manual checklist (Victor)

1. **Pet picker** — open home; confirm avatars (photo + species fallback), selected ring, manage-mode archive/remove targets still work.
2. **Add pet** — `+` row still present with `#add-pet-btn`.
3. **Photo crop** — upload pet photo on emergency card; pan/zoom/save; picker avatar updates.
4. **Selection sync** — switch pet without full rebuild when list unchanged (CSS lift transition).

## Findings

No blocking defects from static review. B cover pending adopt.

**Verdict:** pass (conditional on Victor smoke above)
