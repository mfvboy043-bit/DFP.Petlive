# QA review
Verdict: conditional

## Findings

### 飼主項目重新整理後仍在
- Severity: low（驗收項，預期通過）
- Steps: 1. 開 preview 2. 選米醬 → 醫療警示 3. 新增飼主注意 4. 重新整理頁面
- Expected: 該筆仍在「飼主注意事項」，急診卡同步
- Actual: 寫入 `localStorage` key `petlive-pet-alerts`；需人工在瀏覽器確認

### 編輯中切換寵物會重置表單
- Severity: low
- Steps: 1. 編輯一筆飼主警示 2. 切換另一隻寵物
- Expected: 表單清空、列表換成新寵物
- Actual: `selectPet` 會 `resetAlertForm`（刻意）；勿在編輯中途以為草稿會保留

### 串接項不可刪
- Severity: medium（需人工確認）
- Steps: 1. 米醬過敏 Penicillin 2. 確認無刪除按鈕 3. 新增一筆飼主過敏 4. 確認可刪
- Expected: linked 無刪除；owner 可刪
- Actual: 程式路徑如此；若 UI 誤出刪除則為 high defect

### 空狀態分區
- Severity: low
- Steps: 新建寵物（無 seed 警示）→ 開醫療警示
- Expected: 三分區皆顯示空文案，仍可新增
- Actual: 依 `ALERT_SECTION_DEFS` emptyKey；需手動加寵驗證

## Notes

- 主線未改；驗收請只開 preview 路徑。
- 條件通過：人工跑過 README 五點 Check，尤其 localStorage 與多寵切換。
