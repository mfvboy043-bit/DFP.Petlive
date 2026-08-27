# Contrast — 20260828-facade-wire-tidy

Mainline vs candidate (C surface). Formal B unchanged in this candidate.

## Mainline (before)

1. Timeline list click/submit mega-listeners live inline in `apps/web/c/app.js`.
2. Language menu open/close/outside-click live in facade.
3. Vaccine help overlay open/outside/Escape live in facade.
4. Drug search results paint + select live in facade.
5. `openVisitImaging` + `confirmArchivePet` orchestration live in facade.

## Candidate (after)

1. Timeline list routes via `shell/timeline-list-wire.js` (`bindTimelineList`); facade injects callbacks only.
2. Language menu via `shell/lang-menu.js` (`initLangMenu`).
3. Vaccine help via `shell/vax-help.js` (owns Escape + closes proof lightbox).
4. Drug search via `shell/drug-search.js` (`bindDrugSearch` / `renderDrugResults`).
5. Imaging open + archive confirm via `shell/imaging-proof.js` + `shell/archive-pet.js`.

## Files touched (candidate worktree)

- CREATE `apps/web/shell/timeline-list-wire.js`
- CREATE `apps/web/shell/lang-menu.js`
- CREATE `apps/web/shell/vax-help.js`
- CREATE `apps/web/shell/drug-search.js`
- CREATE `apps/web/shell/imaging-proof.js`
- CREATE `apps/web/shell/archive-pet.js`
- EDIT `apps/web/c/app.js`, `apps/web/c/index.html`
- CREATE `qa/tests/web-shell-facade-wire-tidy.test.js`
- Proposal meta under `proposals/20260828-facade-wire-tidy/`
