---
id: 20260810-pilot-self-iteration-loop
title: 空藥單時顯示下一步操作提示（自我迭代示範）
status: in_review
author: planner
candidate_branch: ""
candidate_path: proposals/20260810-pilot-self-iteration-loop/preview/
created: 2026-08-10
updated: 2026-08-10
pilot: true
---

# Proposal: 空藥單時顯示下一步操作提示

> **Pilot loop**：示範完整自我迭代流程。候選稿僅在本資料夾 `preview/`，**未改** `apps/web/` 主線。待 Victor「採用」後才由 Version Steward 合併。

## Goal

在「本次藥單」為空時，於計數列下方顯示一行次要提示：先填一種藥再按「加入此藥」，可繼續加下一種——降低不知道要先加入清單的摩擦。

## In scope

- 新增 `pendingMedsHint` 四語鍵（`i18n.js`）
- `#pending-meds-wrap` 內空狀態 hint 節點（`index.html`）
- `.pending-meds-hint` 次要樣式（`styles.css`）
- `renderPendingMeds()` 結束時顯示／隱藏 hint（`app.js`）

## Out of scope

- 改藥單資料結構、驗證、儲存流程
- 其他畫面文案或視覺大改

## Likely files

- `apps/web/index.html`
- `apps/web/styles.css`
- `apps/web/i18n.js`
- `apps/web/app.js`

## Risks

- 文案過長 → 限制一行、次要色
- 誤導成臨床建議 → 只寫操作步驟

## Acceptance criteria

- [ ] 空藥單時可見 hint（四語）
- [ ] 已加入 ≥1 種時 hint 隱藏
- [ ] 採用前主線 `apps/web/**` 不變（本 pilot 已遵守）

## Gate log

| Gate | Result |
|------|--------|
| A 確認才製作 | **Pilot 代行**：僅寫入 `preview/` fragments，不碰主線 |
| B 確認才合併 | **等待 Victor「採用」** |
