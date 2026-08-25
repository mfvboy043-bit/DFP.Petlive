# 說明書頁（What'Sub 風格指南）

## Goal

把選單「說明書」從「一鍵進 `?demo=1` tour」改成可閱讀的一頁指南（對齊 [What'Sub 怎麼加字幕](https://whatsub.equal2.app/add-subtitles/)）：先拆誤會 → 五步主線 → 邊界 → FAQ → 文末 CTA。本輪**不做** spotlight；文末預留「開始導覽」入口（第二輪再做）。

## 為什麼五步是這五個（主線 vs 不進主線）

主線只放「沒有這步就不成護照」的路徑，避免第一頁變成功能目錄。

| 步驟 | 內容 | 為什麼在主線 |
|------|------|----------------|
| 1 | 登入／開始使用 | 正式 B 從 A 進來；資料綁你的帳號 |
| 2 | 新增第一隻寵物 | 空帳號不能開資訊卡；護照的單位是「寵物」 |
| 3 | 記一筆就診（或用藥） | 護照要有可回看的紀錄，才不是空殼 |
| 4 | 打開醫療資訊卡 | 產品對外價值：急診／換院快速參考 |
| 5 | 雲端備份／換機 | 對齊「資料在你雲端帳戶」的核心承諾 |

**刻意不進五步主線（可放 FAQ 或之後導覽）：**

- **疫苗／寄生蟲**：重要，但是「預防狀態條」，不是首次必懂才能用卡
- **醫療警示**：急診卡會帶，細節操作可第二輪／FAQ
- **檢驗／影像**：進階補件，主線會過長

若 Victor 要把「疫苗」升成主線第 3.5 步，可在 Gate A 改提案後再做。

## 先拆誤會（已定）

主句偏：

> 資料在你這邊，儲存在你的雲端帳戶。

短支撐句可帶一句「僅供參考，不取代獸醫診斷」（不當第一句，避免蓋過資料主權）。

## In scope

- 新 screen 或獨立靜態區塊：`manual`（正式 B `apps/web/`）
- 選單「說明書」→ `go("manual")`（不再 `location = ?demo=1`）
- 文案結構：GUIDE 眉標、大標、誤會段、五步、邊界、FAQ 摺疊、文末 CTA
- CTA：主「回到護照／去新增寵物」；次「體驗範例護照（`?demo=1`）」；「開始導覽」按鈕 **visible 但 disabled 或標「即將開放」**（第二輪）
- 四語 i18n；手機可讀（單欄、足夠字級、FAQ accordion）
- Intro／說明入口若需連到 manual，可加輕量連結（可選）

## Out of scope

- Spotlight／coachmark 實作與手機卡位修復（第二輪）
- 改寫整份醫療 disclaimer 政策
- C 面完整複製品（可 Gate B 後再 cover，或本輪只做 B）
- 把疫苗／警示做成五步之一（除非 Gate A 改範圍）

## Likely files

- `apps/web/index.html` — manual screen + FAQ markup；nav-manual 行為
- `apps/web/app.js` — `go("manual")`；拿掉說明書直跳 demo
- `apps/web/i18n.js` — 四語文案
- `apps/web/styles.css` — 指南頁排版（克制、非 AI 預設紫／卡片堆）
- `proposals/20260825-manual-guide/` — 本提案

## Risks

- 文案過長 → 手機第一屏失去品牌／步驟感；每步壓在 1～2 句
- 「雲端帳戶」表述需與現況一致（飼主 Google Drive 資料夾，非 Petlive 伺服器病歷庫）
- 示範屋 CTA 若講不清，使用者以為會覆寫真資料 → 按鈕旁明示唯讀／不寫入帳號
- 醫療語氣：維持 reference-only

## Acceptance

- [ ] 選單「說明書」進入指南頁，不再整頁強制 `?demo=1`
- [ ] 頁上可見：誤會段（資料在你雲端）+ 五步 + 邊界 + FAQ + 文末 CTA
- [ ] 無 spotlight overlay
- [ ] 「開始導覽」為預留（disabled／即將開放）
- [ ] 「體驗範例護照」可進 `?demo=1`
- [ ] 四語切換文案正確；手機可捲動閱讀、FAQ 可開合
- [ ] 空帳號從說明書可走到「新增寵物」

## Candidate

Parallel path after Gate A：`proposal/manual-guide` worktree at `.worktrees/manual-guide`；不直接覆蓋 mainline 至採用。
