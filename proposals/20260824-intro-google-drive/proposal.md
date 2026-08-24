---
id: 20260824-intro-google-drive
title: "介紹頁、Google 登入、飼主 Drive 備份"
status: building
author: planner
candidate_branch: ""
candidate_path: ""
created: 2026-08-24
updated: 2026-08-24
---

# Proposal: 介紹頁、Google 登入、飼主 Drive 備份

Companion: `state.yaml`

## Goal

新增公開介紹頁（右上登入，參考 What'Sub 頂欄位置），以 Google Identity + Drive API 將護照 JSON 寫進飼主自己的雲端硬碟；本機先持久化寵物主圖，並提供 GitHub Pages HTTPS 上線測試路徑。

## In scope

- Intro screen + 右上登入／開始使用
- Google Identity Services 登入／登出
- Drive 可見資料夾「火龍果護照」+ `petlive-passport.json` 寫入／讀回
- 寵物主圖 localStorage 持久化
- `config.public.js` Client ID 占位 + GitHub Pages 部署說明／workflow

## Out of scope

- Firebase／自建後端當病歷庫
- 複製 What'Sub 長篇行銷站
- iCloud
- 大量 X 光／藥單影像同步進 Drive

## Likely files

- `apps/web/index.html`, `styles.css`, `i18n.js`, `app.js`
- `apps/web/config.public.js`, `apps/web/auth/google-drive.js`
- `deploy/GITHUB-PAGES.md`, `.github/workflows/pages.yml`
- `proposals/20260824-intro-google-drive/*`

## Risks

- OAuth 需 HTTPS；未填 Client ID 時登入降級提示
- Drive `drive.file` 權限說明需清楚：檔案在飼主帳號，非 Petlive 伺服器
- 醫療文案維持參考用、非電子病歷

## Acceptance criteria

- [ ] 未登入可看介紹頁；可本機試用進入 App
- [ ] 登入後可在 Google Drive 看到資料夾與 JSON；同帳號可讀回
- [ ] 重整後寵物主圖仍在（localStorage）
- [ ] GitHub Pages 部署步驟可跟做；Client ID 不進 secret

## Notes for Victor

Gate A：以「Implement the plan」視為確認。部署前請在 Google Cloud 建立 OAuth Web Client，並把 Client ID 填入 `apps/web/config.public.js`。
