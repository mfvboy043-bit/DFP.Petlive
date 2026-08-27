# QA review
Verdict: reject

Checked: `cursor/leftover-cleanup-c-7855` — `apps/web/c`, `apps/web/domains` (timeline keyed plan), related `qa/tests`. Formal B / `apps/web/app.js` untouched. Ran `node --check apps/web/c/app.js` and `node --test` on clinics-catalog / vaccines-presets / pets-seed / timeline-render / shell-photo-crop — 17/17 pass. Catalogs, vaccine presets (cat omits rabies), seed clone, crop JPEG defaults look behavior-preserving.

Revision notes: QA-001 empty `[]→[]` skip is fixed (`!next.length` → `full`). QA-002 neighbor bump is only array `i+1`; `previousVisit` is chronological via `buildPreviousVisitByIndex`, and surface C stores visits newest-first (`unshift` + seed). That leaves weight-vs dependents stale on the real path.

## Findings

### Empty visit list skipped on first paint / reload
- ID: QA-001
- Severity: high
- Status: fixed
- Steps:
  1. On surface C, add a new pet (or delete every visit) so `visits` is `[]`.
  2. Call `renderTimeline` while `lastTimelineItemSignatures` is `[]` (reload / first paint).
  3. Open the timeline screen; optionally switch language on an empty list.
- Expected: Timeline list rebuilds and shows localized no-visits empty row (legacy `shouldSkipListRebuild` does not skip empty previous).
- Actual (prior): `planKeyedListReconcile([], [])` returned `skip`; empty/`wrong-lang` copy never painted.
- Actual (now): `planKeyedListReconcile([], [])` returns `{ mode: "full" }`; empty next always forces full rebuild. Covered by unit assert.

### Partial row replace leaves chronological weight-vs dependent stale
- ID: QA-002
- Severity: medium
- Status: open (partial fix insufficient)
- Steps:
  1. Open a pet with newest-first visits (seed or after `unshift`), both with weights — e.g. index0 = 2026-02-01 / 6 kg, index1 = 2026-01-01 / 5 kg so index0 shows ↑ 1 kg vs chronological previous.
  2. Edit only the older visit (index1) weight to 5.5 kg and save so timeline re-renders.
  3. Inspect index0’s weight-vs without a full list rebuild.
- Expected: Index0’s comparison updates (↑ 0.5 kg), same as mainline full rebuild.
- Actual: `planKeyedListReconcile` expands changed indices with array `i+1` only. Newest-first plan is `partial` with indices `[1]` (no `0`). Index0 DOM / delta stays stale. Oldest-first arrays match `i+1` and often promote to `full` on short lists, so the unit test does not catch the production ordering. Date edits that reshuffle chronological previous pointers have the same gap.

### Item signatures omit tags (and clinicId-only) — skip leaves UI stale
- ID: QA-003
- Severity: low
- Status: open (unchanged; pre-existing fingerprint gap)
- Steps:
  1. With an existing visit list rendered, change only visit tags (or only `clinicId` while `clinic` string is unchanged).
  2. Trigger `renderTimeline` without changing date/clinic string/note/weight/meds/proof counts.
- Expected: Tag / clinic label UI refreshes.
- Actual: `visitFingerprint` still ignores `tags` and `clinicId`, so plan mode is `skip` and the list DOM is unchanged. Same gap existed on mainline list-signature skip; called out because partial/skip is now the primary path.
