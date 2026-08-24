# Contrast: mainline vs candidate

## Candidate

- Path: `proposals/20260810-emergency-current-meds/preview/apps/web/`
- Branch: _(no git)_

## Behavior diffs

1. **Mainline**：急診「目前用藥」讀獨立 `pet.meds`（與時間軸脫鉤）；新存藥只進 visits。  
   **Candidate**：急診卡／複製摘要皆由 `deriveActiveEmergencyMeds(visits)` 推導。
2. **Mainline**：標題寫未到期，但未依結束日過濾。  
   **Candidate**：`today >= start && today <= end`（結束日當天仍顯示）；缺天數／拍照待補不進卡。
3. **Mainline**：橘寶急診卡只見 seed Theophylline／Prazosin，不見 8/9 調劑。  
   **Candidate**：可見調劑餵食單位（badge + 內含藥名）與仍有效的 visit 藥程。
4. **Mainline**：存檔不寫 `startDate`。  
   **Candidate**：存檔藥單寫入 `startDate = visit.date`。
5. **Mainline**：無「詳見時間軸」提示。  
   **Candidate**：每列次要 hint（四語 `emergencyMedDetailHint`）。

## Files touched (candidate only)

- `preview/apps/web/app.js`
- `preview/apps/web/i18n.js`
- `preview/apps/web/styles.css`
- `preview/apps/web/index.html`
- `preview/README.md`

## Reviewer verdicts

- Pharmacist: conditional（見 reviews/pharmacist.md）
- QA: conditional（見 reviews/qa.md）
- UI: pass（見 reviews/ui.md）

## Merge checklist (after 採用 only)

- [x] Victor said 採用這一版 / 合併
- [x] Reviews attached (or waived)
- [x] Copy preview four files into `apps/web/` (index script paths restored to `./`)
- [x] Set proposal `status: adopted`
