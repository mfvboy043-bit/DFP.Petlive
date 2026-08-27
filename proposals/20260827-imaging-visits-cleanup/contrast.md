# Contrast: imaging visits cleanup

## Mainline before

- `domains/imaging` exists; B wired
- `domains/visits` still duplicates imaging APIs (compat)
- C facades still call `visitsController.*Imaging*`; no imaging script on C
- Timeline accepts visits.visitHasImaging fallback

## After candidate

- Imaging APIs only on `domains/imaging`
- C + B both inject imaging into timeline
- C save uses `setVisitImaging`
- Timeline requires `imaging.visitHasImaging`

## Files

- `apps/web/domains/visits/controller.js`
- `apps/web/domains/timeline/selectors.js`
- `apps/web/c/app.js`, `c/index.html`
- `qa/tests/web-timeline-visits.test.js`
- `proposals/20260827-imaging-visits-cleanup/*`
