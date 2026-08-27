# Contrast: leftover cleanup 1–7 (C + B cover)

## Before

- Shared date helpers (`daysUntil` / `addDays` / `todayIsoLocal`) lived inline in surface facades.
- Clinic search, age label, image resize, and account chrome presentation lived in facades.
- Timeline had skip + partial keyed rebuild only (no clinic/note morph), and morph (on C) wrongly trusted shallow visit snapshots.
- Pets graph hydrate/persist/push were scattered; form pet validate / med draft parsing duplicated controller logic.

## After (C + formal B)

- `core/dates.js` — shared date helpers; vaccines/parasite inject from core.
- `core/pets-graph.js` — single write door (still `pets[]` backed; B key `petlive-pets-graph`, C key `petlive-c-pets-graph`).
- `shell/account-chrome.js` — nav markup + `buildAccountChromePresentation`.
- `domains/pets/{labels,form,media}.js` — age label, pet identity validate, resize JPEG.
- `domains/clinics/catalog.js` — `searchClinics` (anonymous pinned).
- Timeline PERF-03 step 3 morph for clinic/note surface only; structural compare uses **prior item signatures** (QA-1 fixed).
- Med draft via `medicationsController.draftFromFields`; visit clinic/symptom gates in visits controller.
- Both `apps/web/c/*` and formal `apps/web/app.js` + `index.html` wired (`?v=20260827-leftover-17`).

## Files touched (cover round)

- Shared: `core/dates.js`, `core/pets-graph.js`, `shell/account-chrome.js`, domains as above, `domains/timeline/render.js`, tests
- C: `apps/web/c/app.js`, `apps/web/c/index.html`
- B: `apps/web/app.js`, `apps/web/index.html`
- Meta: `proposals/20260827-leftover-cleanup-17/*`
