# QA review

Verdict: conditional

## Findings

### Hint visibility tied to pending count

- Severity: medium
- Steps: 1. Open add-med empty → hint visible. 2. Add drug to list → hint hidden. 3. Remove all → hint visible again. 4. Switch language while empty.
- Expected: `hidden` toggles with `pendingMeds.length`; i18n refreshes hint text.
- Actual (candidate): Relies on calling `syncPendingMedsHint()` at end of `renderPendingMeds()` **and** on language change path — adopt must wire both or hint can stale.

### No save-path regression

- Severity: low
- Steps: Add two drugs, save all.
- Expected: Unchanged save behavior.
- Actual: Fragments do not touch submit handler — OK.

## Notes

Conditional until adopt checklist includes `onLanguageChange` → `renderPendingMeds()` (already present) so hint text updates.
