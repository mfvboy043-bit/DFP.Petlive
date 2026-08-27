# Contrast — Wave 1 small brains (adopted; B covered)

## Mainline (before Gate A)

| Piece | Location |
|---|---|
| Parasite calendar title/details `t(...)` | Inline in `c/app.js` / `app.js` `buildParasiteCalendarPayload` |
| Vaccine calendar title/details + name join | Inline in facades `buildVaccineCalendarPayload` |
| `formatFrequencyLabel` / `expandFrequencyInText` | Inline in facades |
| `compoundFormLabel` / `Badge` / `compoundChipToneClass` | Inline in facades |
| Breed search-face resolve | Inline in `updateBreedSearchFace` |
| Emergency copy-card join | Already `emergencyRenderer.buildCopyCardText` (leftover-abcd) |

## Candidate → adopted (`cursor/small-brains-6f84`)

| Piece | Location |
|---|---|
| Parasite calendar copy | `domains/parasite/labels.js` → `createLabels().buildCalendarTitleDetails` |
| Vaccine calendar copy + join | `domains/vaccines/labels.js` → `createLabels().buildCalendarTitleDetails` |
| Med frequency + compound presentation | `domains/medications/labels.js` → `createLabels()` |
| Breed search-face value | `domains/breed/selectors.js` → `resolveSearchFaceValue` (+ standalone export) |
| Emergency copy assemble | Verified already in `domains/emergency/render.js`; C + B facades thin wire only |
| Chooser / open / clipboard / DOM / suppress flag | Still thin facades in `c/app.js` and `app.js` |
| Formal B script tags | `index.html` loads labels + bumped `?v=20260827-small-brains` |

## Gate B cover (Victor 採用，覆蓋)

- Wired formal B the same as C for A–D presentation helpers
- B-specific Google auth / `config.public.js` / Drive chrome unchanged
