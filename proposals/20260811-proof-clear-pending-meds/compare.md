# Contrast — mainline vs candidate

| | Mainline `apps/web` | Candidate preview |
|---|---|---|
| Visit Rx thumbs | View only | Per-slot「移除」+ persist |
| Med-proof preview | No clear; save can revive old photo via `pending \|\| visit.*` | Clear + save `pending \|\| null` |
| Visit「下一步」with pending meds | Always `pendingMeds = []` | Keeps list if non-empty |
| Fresh add-visit (not from add-med) | May keep abandoned pending | Clears pending |

Adopt = copy preview `app.js` / `i18n.js` / `styles.css` into mainline; set `index.html` `?v=` and keep mainline `./runtime` / DB script paths.
