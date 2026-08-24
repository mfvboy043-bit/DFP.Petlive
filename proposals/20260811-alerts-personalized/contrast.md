# Contrast: mainline vs candidate

## Mainline (`apps/web/`)

- 醫療警示畫面為唯讀列表，無新增／編輯
- 警示來自各寵物 seed `pet.alerts`（字串 `type`），無 `alertType`／`source`
- 急診卡與 Header 計數只讀 `pet.alerts`
- 無 localStorage 警示持久化
- 無分區（過敏／慢性／飼主注意）

## Candidate (`proposals/20260811-alerts-personalized/preview/apps/web/`)

- 警示畫面可新增／編輯／刪除飼主項目；類型含過敏、慢性、飼主注意
- 資料對齊合約形狀：`alertType` + `source`（`linked`｜`owner`）
- `getAlertsForPet` 合併 seed 串接項與 localStorage 飼主項；急診／計數／複製同源
- 分區空狀態＋免責提示；飼主項急診標「飼主」
- Demo 三寵警示已帶 `id`／`alertType`／`source`

## Files touched (candidate only)

- `index.html`
- `app.js`
- `i18n.js`
- `styles.css`
