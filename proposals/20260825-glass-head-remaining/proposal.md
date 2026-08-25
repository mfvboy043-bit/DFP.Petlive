---
id: 20260825-glass-head-remaining
title: "C：剩餘頁面對齊浮動玻璃 screen-head"
status: building
author: planner
candidate_branch: "proposal/glass-head-remaining"
candidate_path: "proposals/20260825-glass-head-remaining"
created: 2026-08-25
updated: 2026-08-25
# Surface: apps/web/c/ only — do not overlay B
---

# Proposal: C 剩餘頁面對齊浮動玻璃 screen-head

Companion: `state.yaml`（v2 閘門／迭代來源）。

參考已正確的兩頁（Victor 指定）：

1. Emergency：`header.screen-head.light` — 「醫療資訊卡 / 給獸醫師快速參考 · 非電子病歷 / 複製摘要」
2. Timeline：`header.screen-head.light` — 「健康時間軸 / 米醬的就診與用藥紀錄 / 新增」

目標型態：**主標題 + 玻璃儀表**（fixed frosted pill、blur、rim；行動版不得壓成 sticky 實心條）。

## Goal

在討論複製品 **C**（`apps/web/c/`）把尚未對齊的 `.screen-head` 全部做成與 emergency／timeline 同一套浮動玻璃儀表，並讓 nav hamburger + account chip 坐在玻璃上。首頁 `.topbar` 已正確，不動。本提案不覆蓋 B、不改文案／表單／用藥邏輯。

## In scope

### 落後畫面（須補玻璃）

| screen id | 標題（zh） | 現況 |
|---|---|---|
| `archive` | 彩虹橋 | 無玻璃、無 JS chrome |
| `archive-pet` | 歸檔至彩虹橋 | 無玻璃、無 JS chrome（確認型；見 Notes） |
| `add-med` | 記錄用藥 | 無玻璃、無 JS chrome |
| `med-proof` | 補上佐證照片 | 無玻璃、無 JS chrome |
| `imaging-proof` | 本次就診影像 | 無玻璃、無 JS chrome |
| `owner-settings` | 飼主設定 | JS chrome 已有，CSS 未浮起 |
| `parasite` | 寄生蟲預防 | JS chrome 已有，CSS 未浮起；行動版另強制透明非玻璃 |

以上畫面：套用與 emergency／timeline 相同的 fixed pill、blur、rim、screen `padding-top` spacer、行動版「不要壓成 sticky slab」。必要時在 header 加上 `light`（對比與參考頁一致）。不改標題／副標／表單欄位。

### JS chrome

- 把 `archive`、`archive-pet`、`add-med`、`med-proof`、`imaging-proof` 納入 `GLASS_CHROME_SCREENS`（或改為對所有非 home 的 `.screen-head` 注入）。
- `parasite`、`owner-settings` 已在清單，只補 CSS。
- 已有右上 `.btn-small` 的頁（timeline 新增、labs 拍照存檔、emergency 複製摘要）維持原按鈕；落後頁目前只有 back + 標題，只加 chrome，不加新 action。

### 小 CSS 整理（允許、非大重構）

現有玻璃選擇器在約 4～5 處重複（base float、back 鈕、padding-top、desktop 置中、mobile 不壓扁、mobile h2 縮小）。建議改成**一組共享選擇器**（例如 `.screen > .screen-head`，home 用 `.topbar` 不會誤傷），避免之後再漏頁。若 Builder 判斷共享選擇器風險過大，可退回「把七個 id 加進既有清單」——但必須同步每一份清單。

一併修：

- 行動版 h2 縮小清單漏了已在 float 清單的 `remove-pet`。
- 刪除／覆寫 `.screen[data-screen="parasite"] .screen-head` 的透明非玻璃規則，否則玻璃會被抵銷。

## Out of scope

- Home `.topbar`（已是浮動玻璃）
- 改頁面文案、i18n 字串、表單、劑量／用藥／警示邏輯
- 把 C 覆蓋到 B／改 `apps/web/` 主線
- 新畫面、nav IA、account-menu 行為
- 提案 `20260825-design-surface-c` 的 Gate B 採用

## Likely files

- `apps/web/c/styles.css` — 玻璃規則、padding-top、mobile override、h2 縮小、移除 parasite 透明例外
- `apps/web/c/app.js` — `GLASS_CHROME_SCREENS`（或同等「所有非 home screen-head」注入）
- `apps/web/c/index.html` — 落後 header 加 `light`（若參考頁需要）

不改：`apps/web/`（B）、`contracts/`、`packages/`、`i18n` 字串內容。

## Risks

- **內容被固定玻璃擋住：** 每個改成 float 的 screen 必須有對應 `padding-top`（含 safe-area）。漏一頁就會標題／表單第一列被蓋住。
- **長標題 + chrome 擁擠：** 落後頁沒有 `.btn-small`，但注入 nav + account chip 後，`寄生蟲預防`、`飼主設定`、`本次就診影像`、`歸檔至彩虹橋`、`補上佐證照片` 在窄螢幕可能擠。既有玻璃頁已用較小 h2；新頁必須進同一縮小規則。
- **parasite 透明規則衝突：** 不刪會讓該頁看起來「沒玻璃」。
- **確認型畫面：** `archive-pet` 是歸檔確認；`remove-pet` **已經**是玻璃。兩者應對齊，不默默排除（見 Notes）。
- **醫療：** 純 chrome／layout。不改 disclaimer、劑量、診斷語氣。Pharmacist 可 skip。
- **C／B 分叉：** 只改 C。採用 C→B 屬另一案。

## Acceptance criteria

- [ ] C 上每個非 home、且有 `.screen-head` 的畫面，桌面與手機都是與 timeline／emergency 同一套浮動玻璃儀表（pill、blur、rim），不是 sticky 實心條
- [ ] 落後七頁皆在清單內：`archive`、`archive-pet`、`add-med`、`med-proof`、`imaging-proof`、`owner-settings`、`parasite`
- [ ] 內容不被玻璃擋住（第一個可讀區塊在 spacer 之下）；返回鍵仍可用
- [ ] 上述頁的玻璃上有 nav + account chip（與既有玻璃頁一致）；不重複注入
- [ ] `remove-pet` 的 mobile h2 縮小與其他玻璃頁一致
- [ ] parasite 行動版不再是透明非玻璃
- [ ] 既有 header actions 仍在（timeline 新增、labs 拍照存檔、emergency 複製摘要）
- [ ] 不改文案、表單、用藥邏輯；不改 B（`apps/web/`）

建議審查：Pharmacist skip；QA（擋內容、返回、overflow、pet 切換後標題）；UI（玻璃語言、行動擁擠）。

## Notes for Victor

- **確認型頁也納入：** `archive-pet`（歸檔至彩虹橋）與已是玻璃的 `remove-pet` 同一套，避免一頁儀表、一頁實心條。若你希望確認頁更素、不要 chip，回覆「修改：archive-pet 不要 chrome」即可。
- **共享選擇器：** 建議 CSS／JS 以「凡 `.screen-head` 即玻璃＋chrome」為準，不再維護 id 白名單——這正是這次漏頁的原因。
- 討論只開 **C**（`apps/web/c/`）。本提案不採用 design-surface-c，也不覆蓋 B。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
