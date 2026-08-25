---
id: 20260825-account-menu
title: "登入後頂欄 Google 帳號 chip + 登出 popover"
status: building
author: planner
candidate_branch: "proposal/account-menu"
candidate_path: "proposals/20260825-account-menu"
created: 2026-08-25
updated: 2026-08-25
---

# Proposal: 登入後頂欄 Google 帳號 chip + 登出 popover

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

登入 Google 後，首頁頂欄右上從通用剪影「飼主設定」改為 What'Sub 風格的帳號 chip（Google 頭像 + 顯示名稱）。點擊展開精簡 account board：頭像、姓名、email、登出；點外部或 Escape 關閉。視覺跟 Petlive 既有 topbar，不抄 What'Sub 訂閱／會員中心。

## In scope

- **Signed in（首頁 topbar，及登入後同樣會看到的 chrome）：**
  - 以 `google-drive` session profile（`picture` / `name` / `email`）繪製 pill chip：頭像 + 顯示名（無名稱時降級 email 或「帳號」字樣）
  - 點 chip 開關 compact popover：大頭像、姓名、email、**登出**
  - 因 chip 取代現有剪影按鈕，popover 內加一項 Petlive 既有路徑：**飼主設定**（進現有 `owner-settings`，非 What'Sub「編輯／方案／會員中心」）
  - 點外部、Escape、登出後關閉；`aria-expanded` / 焦點可達
  - 擴充 `paintCloudChrome`（或同等）同步 home chip 與既有 intro／settings cloud chrome
- **Signed out：** 維持現有剪影 `owner-settings-btn`（進飼主設定）；不顯示帳號 chip
- i18n 新字串（chip aria、popover 標題／登出／飼主設定若需新 key）；語言切換後 chrome 重算
- 樣式貼合現有 topbar（白／淺底 pill、圓頭像、小 popover）；避免 purple AI 預設與過度卡片化

## Out of scope

- What'Sub「編輯」「方案」「會員中心」「切換帳號」「官網首頁」
- 重建 intro 登入鈕／intro account 列（可複用資料；不改 intro 版型為本提案目標）
- Google 多帳號切換 UI（登出後再登入即可）
- Drive sync／備份邏輯變更
- 未登入時的 Google 登入入口改版（仍走 intro／飼主設定內既有登入）

## Likely files

- `apps/web/index.html` — home topbar：chip + popover markup（旁掛或取代 `#owner-settings-btn` 顯示邏輯）
- `apps/web/styles.css` — chip / popover
- `apps/web/app.js` — `paintCloudChrome`、開關／登出／導向飼主設定、outside click / Escape
- `apps/web/i18n.js` — 新 chrome 字串（zh / en / ja / ko）
- `apps/web/auth/google-drive.js` — 僅在缺 profile 欄位時小幅讀取；預期不改 token／Drive API

參考（設計，非程式）：Cursor assets 內 What'Sub chip／dropdown、Petlive 現況剪影 topbar；線上參考 https://whatsub.equal2.app/studio/

## Risks

- **飼主設定可達性：** 登入後剪影被 chip 取代；若 popover 沒有「飼主設定」，該入口會消失 → 本提案預設 popover 含此一項；若 Victor 只要登出，請 Gate A「修改」拿掉並指定替代入口
- **頭像／隱私：** 使用 Google 公開 profile picture URL；缺圖時用剪影或首字 fallback，勿破版
- **Session 時序：** 重整後 profile 已在 sessionStorage；chip 須在 `onSessionChange` / 首次 paint 正確顯示，避免閃剪影再變 chip
- **醫療文案：** 本變更無診斷／劑量 UX；Pharmacist 可 skip
- **i18n：** 新字串須四語；`logout` 已存在可複用

## Acceptance criteria

- [ ] 已登入進首頁：頂欄右上為 Google 頭像 + 顯示名 pill，不再是通用剪影當唯一帳號訊號
- [ ] 點 chip 開 popover：可見頭像、姓名、email、登出；再點／外側／Escape 關閉
- [ ] 登出後 session 清除、chip 消失、剪影飼主設定按鈕回來；intro／settings cloud chrome 仍一致
- [ ] Popover「飼主設定」可進既有 owner-settings（若 Gate A 保留此項）
- [ ] 未登入：行為與現況相同（剪影 → 飼主設定）
- [ ] 切換 zh/en/ja/ko 後 chip／popover 標籤正確；無 console 錯、手機寬度可用

## Notes for Victor

- 與 `20260811-owner-profile-menu`（已採用的飼主設定剪影）銜接：本提案是**登入態**帳號呈現，不是重做飼主表單。
- Gate A 請特別確認：popover 是否包含「飼主設定」。預設 **包含**。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
