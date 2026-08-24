---
id: 20260812-emergency-module-bridge
title: 急診卡接到 emergency-card 模組（積木隔離示範）
status: adopted
author: planner
candidate_branch: ""
candidate_path: proposals/20260812-emergency-module-bridge/preview
created: 2026-08-12
updated: 2026-08-12
---

# Proposal: 急診卡接到 emergency-card 模組（積木隔離示範）

Companion: `state.yaml`（Gate／迭代真相來源）。

## Goal

把「就醫紀錄資訊卡」從 `app.js` 巨石渲染，改成**優先走** `modules/emergency-card` → `PetLive.emergency.generateEmergencyCard` 組裝資料；上游（警示／目前用藥／體重）失敗時只降級該區塊，不讓整張急診卡或整頁空白。用這一屏當第一塊可驗證的積木對接，之後再複製到時間軸／警示清單。

## In scope

- Bridge：`renderEmergencyCard`（與相關子渲染）改為讀 `ModuleResult`／`_degraded`；模組不可用時 fallback 現有本地 `pets` 資料（原型不斷線）。
- 降級 UI：警示／目前用藥／體重任一 `_degraded: true` 時，該區塊顯示簡短「暫時無法載入」類 chrome（四語 i18n），其餘區塊仍顯示。
- Adapter：把原型 `pets[].alerts`／visits 推導的目前用藥，映射進模組可讀的最小資料（或薄 adapter），**不**重寫整套 localStorage。
- QA：沿用／補 `qa/tests/fault-isolation.test.js` 語意；preview 內可手動注入「警示失敗」驗證卡面不完全滅。
- 文件：更新 `ARCHITECTURE.md` 一小段「UI 已對接：emergency-card」。

## Out of scope

- 整包把 `pets[]` 遷移到 `modules/pet` 單一真相（下一張提案）。
- 時間軸、疫苗、驅蟲、表單 submit 全面套 `safeRender`／`PetLive.call`。
- 改急診卡視覺大改版、改醫療文案語氣、改 contracts 欄位語意。
- 上雲／IndexedDB／帳號綁定。

## Likely files

- `apps/web/app.js`（僅 emergency 渲染路徑 + adapter；candidate／preview）
- `apps/web/i18n.js`（降級提示四語）
- `apps/web/runtime/petlive.js`（若需 expose helper；盡量沿用現有）
- `modules/emergency-card/index.js`（必要時小幅相容 adapter 輸入，不擴權）
- `modules/medical-alert/index.js`（若需從原型 seed 同步／讀取；保持 guard）
- `qa/tests/fault-isolation.test.js`（必要時）
- `ARCHITECTURE.md`
- `proposals/20260812-emergency-module-bridge/preview/`（無 git 時的平行路徑）

## Risks

- **雙資料源**：模組 Map 與 `app.js` pets 不一致 → 急診卡內容與警示頁不同。必須明確「adapter 從當前 pet 快照餵入／同步」，並在 Notes 標成原型妥協。
- **誤顯「無警示」**：降級時若顯示成「尚無警示」會誤導急診情境 → 必須與 empty 文案分開（degraded ≠ empty）。
- **醫療語氣**：降級文案只能是系統狀態，不可像診斷結論。
- **範圍膨脹**：容易順便改整卡 UI；本提案只做資料路徑與降級，不重做版面。

## Acceptance criteria

- [ ] 正常路徑：急診卡仍顯示寵物、警示、目前用藥、飼主聯絡（與現況資訊等價，允許來源改為模組組裝）。
- [ ] 注入／模擬 Alert 模組失敗：`_degraded.alerts` → 警示區顯示「暫時無法載入」，**不是**「尚無警示」；用藥／飼主區仍在。
- [ ] 模擬用藥查詢失敗：用藥區降級，警示區仍在。
- [ ] `PetLive`／模組腳本未載入時：fallback 本地渲染，首頁與其他 screen 不白屏。
- [ ] 換寵物時仍走 `safeRender("emergencyCard", …)`，急診卡失敗不擋時間軸／看板。
- [ ] 候選在 `proposals/…/preview`（或 `proposal/` branch），不直接蓋 mainline。
- [ ] 四語降級 chrome 可切換。

## Notes for Victor

這是架構對接的**最小可驗證切片**，不是全站重構。確認後才建 preview／實作。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
