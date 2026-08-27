# QA review
Verdict: pass

## Method
- Static read of candidate shell A–E (`timeline-list-wire`, `lang-menu`, `vax-help`, `drug-search`, `imaging-proof`, `archive-pet`) vs thinned `apps/web/c/app.js` injects and former mainline C bodies.
- Checked for double-bind leftovers, Escape ownership, clear-slot toast/refresh/re-expand order, drug select enrich→manual→info card, imaging pending copies + kicker `data-i18n`, archive gate/success toast/`go(..., { replace })`/manage off.
- Ran `node --test qa/tests/web-shell-facade-wire-tidy.test.js` from worktree: **7/7 pass**. `node --check` clean on touched shell + `c/app.js`.
- Formal B (`apps/web/app.js` etc.) not in candidate delta; C-only scripts load before `c/app.js` with `?v=20260828-facade-wire-tidy`.

## Findings
None.

## Scope checklist (no defects)
| Cluster | Result |
|---|---|
| A Timeline list | Single `bindTimelineList`; toggle/clear/open/labs/weight routes match prior order (clear → toast → `applySelectedPet` → re-toggle). No leftover `timelineList.addEventListener`. |
| B Lang menu | Single `initLangMenu`; fab open/close, outside `#lang-switcher`, pick → `setLanguage` + toast. |
| C Vax help | Single Escape owner in shell closes lightbox then help; outside click + help btn toggle preserved. No duplicate facade Escape. |
| D Drug search | Input clears selection/card; select uses enrich + `getDrugById` fallback, forces manual mode, paints selected label + info card. |
| E Imaging + archive | Pending photo array copies, inputs cleared, previews + `go("imaging-proof")`; archive gates `toastNeedPassedDate`, success toast + manage off + `go("archive", { replace: true })`. |
