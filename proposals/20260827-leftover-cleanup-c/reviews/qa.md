# QA review
Verdict: pass

Checked: `cursor/leftover-cleanup-c-7855` — `planKeyedListReconcile` in `apps/web/domains/timeline/render.js`, `renderTimeline` in `apps/web/c/app.js` (passes `visitDates`), related leftover tests. Formal B / `apps/web/app.js` untouched. Ran `node --test` on `web-timeline-render`, `web-clinics-catalog`, `web-pets-seed`, `web-shell-photo-crop` — 16/16 pass.

Revision notes: QA-001 empty `[]→[]` forces `full`. QA-002 neighbor expansion uses chronological next via `visitDates` (not array `i+1`); `renderTimeline` supplies dates; newest-first covered by unit assert. Only QA-003 (fingerprint tags/`clinicId`) remains — low, non-blocking.

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
- Actual (now): `!next.length` returns `{ mode: "full" }`; empty next always forces full rebuild. Covered by unit assert.

### Partial row replace leaves chronological weight-vs dependent stale
- ID: QA-002
- Severity: medium
- Status: fixed
- Steps:
  1. Open a pet with newest-first visits (seed or after `unshift`), both with weights — e.g. index0 = 2026-02-01 / 6 kg, index1 = 2026-01-01 / 5 kg so index0 shows ↑ 1 kg vs chronological previous.
  2. Edit only the older visit (index1) weight to 5.5 kg and save so timeline re-renders.
  3. Inspect index0’s weight-vs without a full list rebuild.
- Expected: Index0’s comparison updates (↑ 0.5 kg), same as mainline full rebuild.
- Actual (prior): Neighbor bump was array `i+1` only; newest-first plan left chronological dependent (index0) out of partial indices.
- Actual (now): When `visitDates` length matches the list, changed indices also refresh the chronological next visit (`dj > di`, earliest such). `renderTimeline` passes `visitDates` from `pet.visits`. Newest-first unit case asserts changed older row and chrono next both appear in `indices`. Fallback remains `i+1` only when dates are absent.

### Item signatures omit tags (and clinicId-only) — skip leaves UI stale
- ID: QA-003
- Severity: low
- Status: open (unchanged; pre-existing fingerprint gap; non-blocking)
- Steps:
  1. With an existing visit list rendered, change only visit tags (or only `clinicId` while `clinic` string is unchanged).
  2. Trigger `renderTimeline` without changing date/clinic string/note/weight/meds/proof counts.
- Expected: Tag / clinic label UI refreshes.
- Actual: `visitFingerprint` still ignores `tags` and `clinicId`, so plan mode is `skip` and the list DOM is unchanged. Same gap existed on mainline list-signature skip; called out because partial/skip is now the primary path.
