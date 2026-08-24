# Arbiter review — iteration 1

Decision: `candidate_ready` (conditional)

## Reconciliation

- `QA-002` and `UI-001` describe the same cascade defect: the dual-class visit prescription control receives the later amber medication-notes hover border. Canonical ownership remains `UI-001`; `QA-002` is recorded as a duplicate.
- `QA-001` is a proposal-relevant regression because the candidate removes established weight-comparison layout and semantic-color rules, conflicting with the requirement to keep current shared contexts visually consistent. Its submitted severity is medium, and it does not create medical-safety or user-data loss, so the review protocol classifies it as non-blocking.
- `UI-002` is an accessibility/usability improvement, but expanding touch targets would change the dimensions the approved proposal explicitly says to preserve. It is non-blocking and requires a separately approved scope change.

## Blocking issues

None.

## Non-blocking issues

- `QA-001` — restore the removed weight-comparison presentation in a future approved change.
- `UI-001` (duplicate: `QA-002`) — keep the combined visit prescription hover border in the green semantic family.
- `UI-002` — consider larger mobile hit areas under separately approved scope.

## Routing

- `rerun`: none
- `builder_scope`: none
- Next step: proceed to Gate B with the non-blocking limitations disclosed; Victor decides whether to adopt, reject, or request a new/modified proposal.
