# UI review
Verdict: pass

Light compatibility pass on C only (`20260826-parasite-controller` / PA-01..PA-04). No intentional redesign claimed; spot-checked home parasite strip, product chips, calendar chooser, and domain chrome boundary.

## Scope checked (C candidate)

- `renderParasiteStrip` — still in `c/app.js`; clears/adds `is-protected` / `is-approaching` / `is-unprotected` / `is-optional` on `#parasite-row-{kind}`; meta + status text still via `t()` / `parasiteStatusLabel`.
- Slot status — `getParasiteSlotStatus` facade → `parasiteSelectors.getParasiteSlotStatus`; strip applies `is-${status}` (and dedicated `is-optional` branch for cat heartworm unset). Matches existing `.parasite-row.is-*` CSS.
- `renderParasiteProductChips` / `parasiteProductChipMarkup` — still in C: `parasite-chip-row`, `chip` / `is-on`, `data-parasite-product`, `data-interval`; exclusive vs dual rows unchanged; chip labels stay `t()` in view layer.
- Calendar chooser — `#parasite-cal-chooser` markup still in `c/index.html`; `showParasiteCalendarChooser` / `closeParasiteCalendarChooser` / Google·Apple open helpers remain in C; domain only supplies pure `{ title, details, nextDue }` with prebuilt strings from C.
- Domain chrome boundary — `domains/parasite/controller.js` + `selectors.js`: no `t()` / `I18N` / `document` / `window.open` / hard-coded UI copy; product display names via injected `labelOf`; validate/save reasons are machine codes mapped to toasts in C.
- `renderVaccineStrip` — still composed from parasite strip path in C (not moved into parasite domain).
- Parasite CSS lamps — `.parasite-row.is-protected|approaching|unprotected|optional` and chooser/chip rules untouched by this extraction; C `index.html` parasite rows / chips hosts / chooser sheet IDs preserved; only parasite domain script tags + `?v=` added.

## Findings

- [UI-001] [P3] candidate hygiene — same C worktree also carries unrelated emergency chrome deltas (`.e-title-stack` / `.e-copy-summary*` CSS, `emergencyTitleLine*` / `copySummaryLine*` / `eBirthLineAge` i18n). Not parasite strip/chip/chooser regressions; isolate before cover if Victor wants a pure PA diff.
