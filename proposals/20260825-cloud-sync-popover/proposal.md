---
id: 20260825-cloud-sync-popover
title: "雲端同步 UI 整合 + 本機優先衝突處理"
status: adopted
author: planner
candidate_branch: "proposal/cloud-sync-popover"
candidate_path: "proposals/20260825-cloud-sync-popover"
created: 2026-08-25
updated: 2026-08-25
---

# Proposal: 雲端同步 UI 整合 + 本機優先衝突處理

Companion: `state.yaml`

## Goal

移除飼主設定頁 Google 雲端卡片；同步／還原收進帳號 popover。本機有未同步變更時不自動 pull，避免離線刪除被雲端蓋回。

## In scope

- 移除 `#cloud-account-card`
- popover「編輯」→「同步到雲端」；新增「從雲端還原」+ confirm
- `petlive-sync-meta` + localDirty 邏輯
- C 對齊 UI（stub）

## Acceptance

- [ ] 飼主設定無雲端卡片
- [ ] 離線修改不被自動 pull 覆蓋
- [ ] 手動同步／還原可用
