---
id: 20260825-design-surface-c
title: "A／B／C 分層：討論用 C 復刻、確認後覆蓋 B"
status: adopted
author: planner
candidate_branch: "proposal/design-surface-c"
candidate_path: "proposals/20260825-design-surface-c"
created: 2026-08-25
updated: 2026-08-25
# Adopted 2026-08-25: C UI covered into apps/web/ (B); C kept for drafts
---

# Proposal: A／B／C 分層（討論用 C）

Companion: `state.yaml`

## Goal

把產品入口拆成三層，讓設計討論不卡登入、也不誤改即將串接登入的主線：

| 代號 | 角色 | 入口 |
|------|------|------|
| **A** | 介紹／Google 登入 | `apps/web/?intro=1`（暫不正式串進日常流程） |
| **B** | 主護照（可日後正式接 A） | `apps/web/` 預設進 home |
| **C** | 討論／實驗複製品 | `apps/web/c/` |

在 **C** 用 Cursor 選取討論；**確定後再覆蓋 B**。等 B 功能齊全，再正式把 A 串回 B。

## In scope

- 復刻一份 **C**：以目前 B（主護照畫面／邏輯）為底，放在 `apps/web/c/`
- C **不依賴登入**；頂部固定「C · 討論版」標示，避免跟 B 搞混
- C 使用 **獨立 localStorage 前綴**（例如 `petlive-c-*`），實驗資料不污染 B
- C 可省略或弱化 A／Drive 登入路徑（討論期不測雲端）
- 短說明寫進 `proposals/.../notes` 或 `deploy` 一小段：如何開 C、如何「採用後覆蓋 B」
- 採用流程（Gate B）：把 C 確認過的檔案覆蓋進 B（`apps/web/` 主線），**不動 A 正式串接**直到你另開提案

## Out of scope

- 現在就把 A 正式接進日常開機流程
- 把整份 `apps/web` 複製成 `apps/web-v2`（改用明確的 `apps/web/c/`）
- 自動雙向同步 C↔B（討論期允許分叉；採用才覆蓋）
- 重做登入／Drive 行為

## Likely files

- 新增：`apps/web/c/index.html`、`styles.css`、`app.js`、`i18n.js`（及 C 需要的相對路徑腳本／資產引用）
- 可能：`apps/web/c/README` 或提案內操作說明
- 不改動（本提案）：正式 A↔B 串接邏輯

## Risks

- **雙份維護**：C 與 B 分叉後，採用時要對照覆蓋，避免漏檔或路徑錯
- **誤改 B**：討論時務必開 `/apps/web/c/`；B 保持「可接 A」的穩定底
- **資料串台**：若共用同一 localStorage key，C 實驗會弄亂 B → 必須前綴隔離
- 醫療文案仍僅供參考；C／B 都不改診斷語氣規則

## Acceptance criteria

- [ ] 開 `…/apps/web/c/` 直接進主護照討論面，**不必登入**
- [ ] 畫面有清楚「C · 討論版」標示
- [ ] 開 `…/apps/web/` 仍是 B（預設 home；`?intro=1` 才是 A）
- [ ] C 與 B 的本機資料互不覆蓋
- [ ] 文件寫明：討論在 C → 你說「採用」後才覆蓋 B → A 正式串接另案

## Notes for Victor

建議操作節奏：

1. **日常討論** → 只開 **C**
2. **C 定案** → 回覆「採用」→ 覆蓋 **B**
3. **B 功能齊全** → 另開提案正式串 **A**

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
