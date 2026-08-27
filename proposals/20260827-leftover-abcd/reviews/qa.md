# QA review
Verdict: pass

## Findings

(none)

## Checks

| Check | Result |
|---|---|
| A crop session/drag | Pass — open/close flags, pointerId mismatch ignored, zoom gate on `open` |
| B hydrate | Pass — skip when hydrated; slot class `tl-drug-notes-body`; DOM append stays facade |
| C copy card | Pass — join/trim; empty owner line; payload still from selectors |
| D skip-noop | Pass — same signature skips; lang/pet/visit change rebuilds |
| Formal B | Pass — C-only; APIs additive |
| Tests | Pass (19/19 in touched suites) |
