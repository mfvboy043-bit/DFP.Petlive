# QA review

Verdict: conditional

## Findings

### 系統日期與 seed 耦合
- Severity: medium
- Steps: 1. 將裝置日期改到 2026-08-20 2. 開橘寶急診卡
- Expected: 8/9 短疗程調劑可能已過期而不顯示
- Actual:（依真實今天過濾）若 QA 日不是 2026-08-10 附近，驗收結果會變
- Note: 文件應標明驗證建議日期，或原型加可選「demo today」——本輪未做

### 米醬急診卡為空
- Severity: low
- Steps: 1. 選米醬 2. 開急診卡
- Expected: 無未到期用藥（8/2 起算已過期）
- Actual: 應顯示空狀態文案 — 符合提案，勿誤判為回歸 bug

### 新增多筆同標籤調劑
- Severity: medium
- Steps: 1. 新增兩藥同「藥水 A」與天數 2. 儲存 3. 開急診卡
- Expected: 一個調劑餵食單位
- Actual: 依 `buildVisitMedicationsFromPending` 合併後再推導 — 需實機點一次確認

### 主線未改
- Severity: low（流程）
- Steps: 開 `apps/web/index.html` 急診卡
- Expected: 仍為舊行為
- Actual: 應仍讀 `pet.meds` — 採用前屬正確

## Notes

未測多寵物快速切換後急診卡是否重繪（既有 `applySelectedPet` 路徑應會呼叫 `renderEmergencyMeds`）。
