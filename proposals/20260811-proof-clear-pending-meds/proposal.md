---
id: 20260811-proof-clear-pending-meds
title: "Fix: 佐證照片可移除 + 就診「下一步」保留 pending 藥單"
status: adopted
author: planner
candidate_branch: ""
candidate_path: "proposals/20260811-proof-clear-pending-meds/preview/apps/web/"
created: 2026-08-11
updated: 2026-08-11
---

# Proposal: proof clear + pending meds preserve

## Goal

修好兩則 HIGH QA 回歸：(1) 佐證／藥單照片可清掉且儲存真的移除；(2) 加藥後回到就診再按「下一步」不應清空已加的 pending 藥單。

## In scope

- 時間軸就診藥單縮圖：每張「移除」並 persist
- 補佐證頁預覽：clear + 儲存用 `pending* || null`（不再 fallback 舊圖）
- 同步清 visit 與該就診下各 med 的同槽照片
- 就診表單 submit：僅在 `pendingMeds` 為空時 reset 藥欄／直播照片／模式
- 從非 add-med 進入 add-visit 時清 pending（避免廢棄清單污染新就診）
- i18n / CSS / cache bust

## Out of scope

- 新藥劑型／配方 UI
- 急診卡邏輯改動
- Medium QA（`data-go` vs history、症狀 key）

## Likely files

- `apps/web/app.js`
- `apps/web/i18n.js`
- `apps/web/styles.css`
- `apps/web/index.html`（`?v=`）

## Risks

- 清槽會同時清該就診下各藥的同槽佐證（刻意：藥單為 visit 級）
- 從 home 進新就診會丟未儲存的 pending（預期）

## Acceptance criteria

- [x] 時間軸藥單縮圖可移除；重整後仍無該張
- [x] 補佐證：預覽「移除」→ 儲存 → 回去無該槽
- [x] 加 1+ 藥 → 返回就診 →「下一步」→ pending 仍在
- [x] home／時間軸新開就診：pending 為空

## Build / reviews

- Candidate: `candidate_path`
- Reviews: `reviews/qa.md`, `reviews/pharmacist.md`, `reviews/ui.md`
- Contrast: `compare.md`

## Adopt

2026-08-11 Victor「可以修正覆蓋」→ 手術式併入 mainline（保留 avatar 等後續進度）。`?v=20260811-proof-clear-pending`。
