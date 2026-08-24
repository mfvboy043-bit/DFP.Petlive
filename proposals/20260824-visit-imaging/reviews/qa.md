# QA review
Verdict: conditional

## Findings

### Back after save reopens a dead imaging-proof screen
- ID: QA-001
- Severity: medium
- Steps: 1. Open a visit’s 影像 panel → 補傳影像照片. 2. Add at least one still and tap 儲存影像. 3. Confirm timeline opens with that panel expanded. 4. Tap ←. 5. Tap 儲存影像 again.
- Expected: After a successful save, Back stays on timeline (or returns to the imaging summary / emergency card). The editor is not still in history.
- Actual: Unchanged. Save calls `go("timeline")`, which pushes `imaging-proof` onto shell history. `pendingImagingVisitIndex` was cleared on save, so Back reopens the editor and Save shows「找不到對應就診…」. Previews can still show the photos just saved even though they are no longer pending.

### Save during compress drops the new stills but toasts success
- ID: QA-002
- Severity: medium
- Status: fixed
- Steps: 1. Open 補傳影像照片 on a visit with no imaging (or only a few stills). 2. Choose several camera / large images so compression takes a moment (previews not on screen yet). 3. Immediately tap 儲存影像. 4. Check the timeline 影像 panel.
- Expected: Either wait until stills are in the pending list before save, or keep Save disabled until compress finishes. A success toast means those files are on `visit.imaging`.
- Actual (iteration 2): Fixed. `imagingCompressInFlight` disables the submit control and the submit handler returns with「請稍候」while compress is in flight (no write, no success toast). After `await`, append re-resolves `pendingXrayPhotos` / `pendingUsPhotos` instead of pushing onto a stale array; pendings clear only after a successful write.

### Leftover expand index reopens imaging after a later timeline render (including pet switch)
- ID: QA-003
- Severity: medium
- Steps: 1. On 米醬, visit 時間軸 once (so timeline has already flushed). 2. Upload imaging on a visit that is not index 0 (e.g. 綠葉 / 2026-04-22). 3. From 急診卡 → X-Ray&超音波 影像, tap that visit so timeline opens with its 影像 panel expanded. 4. Collapse 影像. 5. Home → switch to 豆豆 → 時間軸. (Same leftover also re-expands if you stay on 米醬 and save a visit weight / change language.)
- Expected: Summary → timeline expand is one-shot for that pet and visit. Switching pets does not open another pet’s 影像 panel. An unrelated timeline re-render does not force the panel open again.
- Actual: Still present. `goTimelineWithImaging` sets `pendingVisitImagingIndex`, then `go("timeline")`. When the screen change succeeds but timeline is not dirty, `flush` skips `renderTimeline`, so `applyPendingVisitImagingExpand` never clears the index. The rAF `revealVisitImagingPanel` opens the panel for this navigation, but the leftover index remains and the next timeline render (pet switch, weight save, language) expands `visit-imaging-{index}` on whatever pet is current.

### Language change resets imaging-proof subtitle
- ID: QA-004
- Severity: low
- Steps: 1. Open 補傳影像照片. Subtitle is「照片會掛在這次就診下…」. 2. Switch language via the FAB. 3. Look at the subtitle and preview「移除」buttons.
- Expected: Chrome on this screen recomputes in the new locale and keeps the visit-proof subtitle (`timelineVisitImagingProofSub`).
- Actual: Unchanged. `#imaging-proof-sub` still has `data-i18n="imagingProofSub"`, so `applyI18n` overwrites it with the generic「到家後再補…」string. Preview remove labels are static innerHTML and do not update.
