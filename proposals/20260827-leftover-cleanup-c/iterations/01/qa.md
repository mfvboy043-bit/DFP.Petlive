# QA review
Verdict: reject

Checked: `origin/main...cursor/leftover-cleanup-c-7855` for `apps/web/c`, `apps/web/domains`, related `qa/tests`. Formal B / `apps/web/app.js` untouched. Ran `node --check apps/web/c/app.js` and `node --test` on clinics/vaccines/pets-seed/timeline-render/shell-photo-crop — 17/17 pass. Catalogs, vaccine presets (cat omits rabies), seed clone, crop JPEG defaults (0.86 / `#e8f1ed`) look behavior-preserving. Defects are in PERF-03 keyed timeline facade wiring.

## Findings

### Empty visit list skipped on first paint / reload
- ID: QA-001
- Severity: high
- Steps:
  1. On surface C, add a new pet (or delete every visit on a pet) so `visits` is `[]`.
  2. Confirm timeline can show the empty/no-visits copy after a full rebuild.
  3. Reload the page with that pet selected (or call `renderTimeline` while `lastTimelineItemSignatures` is still `[]`).
  4. Open the timeline screen.
- Expected: Timeline list rebuilds and shows the localized no-visits empty row (same as mainline `shouldSkipListRebuild`, which does not skip when previous signature is empty).
- Actual: `buildItemSignatures` returns `[]` for empty visits; `planKeyedListReconcile([], [])` returns `{ mode: "skip" }`, so `renderTimeline` returns without writing `timelineList.innerHTML`. After reload the `<ol id="timeline-list">` stays blank. Language changes on an already-empty list also skip, so empty copy can stay on the wrong language.

### Partial row replace leaves neighbor weight-vs stale
- ID: QA-002
- Severity: medium
- Steps:
  1. Open a pet with at least two dated visits that both have weights (e.g. visit0 = 5 kg, visit1 = 6 kg so visit1 shows ↑ 1 kg).
  2. Edit only visit0’s weight to 5.5 kg and save so timeline re-renders.
  3. Inspect visit1’s weight-vs delta without a full list rebuild.
- Expected: Visit1’s comparison vs previous updates (↑ 0.5 kg), as on mainline where any fingerprint change forced a full list rebuild.
- Actual: `planKeyedListReconcile` returns `partial` with only index `0`. Visit1’s signature is unchanged, so its DOM (and shown delta / days-since if date moved) stays stale until a later full rebuild.

### Item signatures omit tags (and clinicId-only) — skip leaves UI stale
- ID: QA-003
- Severity: low
- Steps:
  1. With an existing visit list rendered, change only visit tags (or only `clinicId` while `clinic` string is unchanged).
  2. Trigger `renderTimeline` without changing date/clinic string/note/weight/meds/proof counts.
- Expected: Tag / clinic label UI refreshes.
- Actual: `visitFingerprint` still ignores `tags` and `clinicId`, so plan mode is `skip` and the list DOM is unchanged. Same fingerprint gap existed on mainline list-signature skip; called out because partial/skip is now the primary path. Not introduced solely by this PR’s data move.
