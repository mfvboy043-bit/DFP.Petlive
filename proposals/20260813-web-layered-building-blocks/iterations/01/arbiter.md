# Arbiter — iteration 1

decision: revision_required

## blocking_issues
- QA-001
- QA-002
- QA-004
- UI-001

## non_blocking
- QA-003
- UI-002
- UI-003

## rerun
- qa
- ui

## builder_scope
- QA-001
- QA-002
- QA-004
- UI-001

## Rationale
The candidate cannot proceed while it rolls back the current timeline baseline, reports failed storage writes as successful, and discards an unsaved vaccine draft.
