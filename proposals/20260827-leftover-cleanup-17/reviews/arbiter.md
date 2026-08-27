# Arbiter

**decision:** `revision_required`

## Reviews present
- pharmacist: pass
- qa: reject (QA-1 high, QA-2 medium)
- ui: pass

## Blocking
- QA-1 — Timeline morph treats in-place structural edits as clinic/note-only patches (same visit object refs → false morph)

## Non-blocking
- QA-2 — clears with QA-1 fix on structural paths

## rerun
- qa

## builder_scope
- QA-1
- QA-2

## Notes
Victor already signaled Gate B adopt + B cover after fix. Parent: fix morph, re-QA smoke, then cover B / push.
