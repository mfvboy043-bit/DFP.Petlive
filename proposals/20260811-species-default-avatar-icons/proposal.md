---
id: 20260811-species-default-avatar-icons
title: 寵物切換器無照片時依種類顯示狗／貓預設圖示
status: adopted
author: planner
candidate_branch: ""
candidate_path: apps/web/
created: 2026-08-11
updated: 2026-08-11
---

# Proposal: 寵物切換器無照片時依種類顯示狗／貓預設圖示

## Goal

飼主尚未上傳寵物照片時，`pet-option-photo`（及同源頭像佔位）依 `species` 顯示可辨識的狗或貓剪影／線稿圖示，不再一律用同一隻爪印，讓多寵切換時一眼能區分種類。

## Candidate

- Path: `apps/web/`（Victor Gate A「確認直接修改覆蓋」→ 直接主線）
- Cache: `?v=20260811-species-avatar`

## Gate log

| Gate | Result |
|------|--------|
| A 確認才製作 | Victor「確認直接修改覆蓋」 |
| B 確認才合併 | 略過（主線直寫） |

## In scope

- `petAvatarMarkup`：無 `photo` 時依 `pet.species`（`dog` / `cat` / 其他）選對應 SVG
- 新增狗、貓專用預設 SVG；`other` 保留爪印
- 相機上傳空框 `PET_FRAME_EMPTY_SVG` 不動

## Acceptance criteria

- [x] 犬種無照片 → 狗圖示
- [x] 貓種無照片 → 貓圖示
- [x] 有照片 → 仍顯示照片
- [x] other → 爪印
- [x] 選中呼吸動畫仍適用
