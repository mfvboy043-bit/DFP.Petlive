# Contrast — Wave 2 wire-thin-forms (adopted; B covered)

## Mainline (before Gate A / C candidate)

| Cluster | Location |
|---|---|
| A Alert form save | Inline `saveAlertFromForm` / `deleteAlertById` in `c/app.js` + `app.js` |
| B Parasite form save | Inline `saveParasiteKind` (dosedToday + dual toast) in facades |
| C Breed form sync | Inline `syncBreedFields` chip expand/collapse in facades |
| D Emergency card paint | Inline `renderEmergencyCard` / `Local` generate→degrade→DOM |

## Candidate → adopted (`cursor/wire-thin-forms-6f84`)

| Cluster | Location |
|---|---|
| A | `shell/alert-form.js` → `saveAlertFromForm` / `deleteAlertById` |
| B | `shell/parasite-form.js` → `saveParasiteKind` |
| C | `shell/breed-form.js` → `syncBreedFields` |
| D | `shell/emergency-paint.js` → `renderEmergencyCard` / `Local` |
| Facades | C + B compose + inject controllers/toasts/render; no domain algorithm moves |
| Formal B | **covered** — `apps/web/app.js` + `index.html` (`?v=20260827-wire-thin-forms`) |

## Gate B cover (Victor 採用，覆蓋)

- Wired formal B the same as C for A–D orchestration
- B keeps `demoBlocksWrite` gates and `bumpLocalDataRevision` on alert create/update/delete
- B-specific Google auth / Drive / reconcile chrome unchanged
