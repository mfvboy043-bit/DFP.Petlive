# Contrast — Wave 1 small brains (C only)

## Mainline (before)

| Piece | Location |
|---|---|
| Parasite calendar title/details `t(...)` | Inline in `c/app.js` `buildParasiteCalendarPayload` |
| Vaccine calendar title/details + name join | Inline in `c/app.js` `buildVaccineCalendarPayload` |
| `formatFrequencyLabel` / `expandFrequencyInText` | Inline in `c/app.js` |
| `compoundFormLabel` / `Badge` / `compoundChipToneClass` | Inline in `c/app.js` |
| Breed search-face resolve | Inline in `updateBreedSearchFace` |
| Emergency copy-card join | Already `emergencyRenderer.buildCopyCardText` (leftover-abcd) |

## Candidate (`cursor/small-brains-6f84`)

| Piece | Location |
|---|---|
| Parasite calendar copy | `domains/parasite/labels.js` → `createLabels().buildCalendarTitleDetails` |
| Vaccine calendar copy + join | `domains/vaccines/labels.js` → `createLabels().buildCalendarTitleDetails` |
| Med frequency + compound presentation | `domains/medications/labels.js` → `createLabels()` |
| Breed search-face value | `domains/breed/selectors.js` → `resolveSearchFaceValue` (+ standalone export) |
| Emergency copy assemble | Verified already in `domains/emergency/render.js`; C facade thin wire only |
| Chooser / open / clipboard / DOM / suppress flag | Still thin facades in `c/app.js` |

## Not in this candidate

- Formal B (`apps/web/app.js` / root `index.html`) — Gate B after Victor 採用
- Wave 2 form wires, Wave 3 CSS/bundler, Wave 4 modules write truth
