# QA review
Verdict: conditional

Checked candidate `proposals/20260814-lab-reports/preview` vs mainline `apps/web`. Storage key `petlive-lab-reports` is pet-keyed and separate from Rx/avatar photos. Save without a photo toasts `toastNeedLabPhoto`. Clinic widgets are `#lab-clinic-search` / `#lab-clinic-results` (not `#clinic-search`). Pet switch on `lab-add` resets when `labAddBoundPetId` differs. Language change runs `applyI18n` plus `applySelectedPet` so list/type/visit chrome recomputes; clinic names and notes stay as stored. Lightbox reuses `openProofLightbox` from list thumbs. X-ray stays disabled. Empty list shows `labEmpty` plus header 拍照存檔.

## Findings
### Back after save returns to empty lab-add
- ID: QA-001
- Severity: medium
- Steps: 1. Emergency card → 血檢報告／檢驗報告 → 拍照存檔. 2. Add ≥1 photo and tap 儲存報告. 3. List shows the new report. 4. Tap header ←.
- Expected: Back leaves the list toward emergency (or timeline if that was the entry), and does not reopen the add form.
- Actual: `go("labs")` after save pushes `lab-add` onto history instead of `{ replace: true }`. Back opens an empty add form. Another back is needed to reach the list again.

### Enter in clinic search saves the report
- ID: QA-002
- Severity: medium
- Steps: 1. On 新增檢驗報告, add a photo (date defaults to today). 2. Focus 醫院名稱, type a keyword so results appear. 3. Press Enter / keypad Go (intending to search or pick a clinic).
- Expected: Enter confirms a clinic result or does nothing; save only via 儲存報告.
- Actual: Clinic is optional and the field sits inside `#lab-add-form`, so Enter submits. The report is stored and the app navigates to the list, often without the clinic the owner was still choosing.

### Linked report with clinic cleared marks every visit on that date
- ID: QA-003
- Severity: medium
- Steps: 1. Add two visits on the same date (different clinics). 2. Lab-add: photo + link visit A (clinic auto-fills). 3. Clear 醫院名稱. 4. Save. 5. Open 時間軸.
- Expected: 「此就診的檢驗報告」only on the visit the owner picked.
- Actual: Save still writes `visitDate` but empty `clinic` / `visitClinicId`. `reportMatchesVisit` then returns true for every visit with that date (`if (!reportClinic && !report.visitClinicId) return true`). Visit B also gets the line.

### Extra pages over the 6-photo cap are dropped with no toast
- ID: QA-004
- Severity: low
- Steps: 1. On lab-add, pick 7+ images in one file selection (or add until 6, then pick more).
- Expected: A toast that only 6 pages are kept.
- Actual: The loop `break`s at `LAB_PHOTOS_MAX` with no toast. Previews show 6; extra files are discarded silently.
