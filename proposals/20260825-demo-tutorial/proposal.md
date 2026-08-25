# Demo mode + 操作導覽（B）

## Goal

對外可點的操作示範：`?demo=1` 進入正式 B 殼，可瀏覽／點連結，不可寫入本機或雲端；頂欄標示 + 重置；一條 4～5 步核心導覽。

## Scope

- Boot：`?demo=1` 跳過 intro，載入 seed、不碰真實 `petlive-pets-graph` 等寫入
- 表單 submit／已知寫入按鈕 → toast「示範無法儲存」
- 頂欄示範條：標示、開始導覽、重置、離開
- Tour：首頁寵物 → 醫療資訊卡 → 時間軸 → 新增就診 → 結束
- Intro 加「操作示範」入口；四語 i18n

## Non-goals

- 多頁平行 D 站、原始碼遮蔽／混淆
- C 面同步改動
- 每 screen 各一教學站

## Acceptance

- [x] `?demo=1` 可開 B、頂欄可見
- [x] 儲存類操作不寫 localStorage／不觸發雲端備份
- [x] 重置還原 seed
- [x] 導覽可走完／可跳過
- [x] Intro 可進示範；離開回無 demo 的 A

## Candidate

Adopted onto `main` 2026-08-25 (Gate B).
