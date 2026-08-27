# QA review — imaging visits cleanup

Verdict: pass

## Checks

- `node --test qa/tests/web-imaging.test.js qa/tests/web-timeline-visits.test.js` — all pass
- visits domain no longer exports imaging APIs
- C loads `domains/imaging` and injects into timeline
- C save uses `setVisitImaging`
- Timeline requires `imaging.visitHasImaging` (visits fallback removed)

## Findings

(none blocking)
