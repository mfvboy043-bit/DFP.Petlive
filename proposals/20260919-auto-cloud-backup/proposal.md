---
id: 20260919-auto-cloud-backup
title: "Auto Drive backup after writes (no repeat 「同步到雲端」)"
status: adopted
author: planner
candidate_branch: "proposal/auto-cloud-backup"
candidate_path: ".worktrees/auto-cloud-backup"
created: 2026-09-19
updated: 2026-09-19
extends: 20260825-sync-reconcile-ux
---

# Proposal: 寫入後自動備份到 Google Drive

Companion: `state.yaml` (v2 source of truth for gates / iteration).

延續已採用的 [`20260825-sync-reconcile-ux`](../20260825-sync-reconcile-ux/proposal.md)：**localDirty 仍不 auto-pull**（保護離線刪除）。本輪只補 **dirty 本機的 auto-push**，以及「已登入但 Drive 未授權」時的誠實授權一次。

**本輪不是 Phase 2 Postgres / Supabase DB。** 雲端仍是 owner 的 Google Drive 備份（`drive.file`）。未同時做 RLS 的多租戶寵物列，禁止發明。

---

## Why

Victor（2026-09-19）：希望**任何新紀錄／資訊自動上雲**，不要每次按「同步到雲端」。忘記按的話，**下次重登會丢掉一長串資料**。

現行正式護照 **B**：

| 事實 | 後果 |
|------|------|
| 登入門是 **Supabase Google**（auth only，無 Drive scope） | 登入 ≠ Drive 已連；`scheduleCloudBackup` 見不到 GIS session 就 early-return |
| Drive GIS token 在 **sessionStorage**（`petlive-google-token`），約 1h，關分頁即沒 | 重開／重登後必須再授權 Drive，否則自動備份從不跑 |
| 唯一呼叫 `ensureDriveAccess()` 的路徑是帳號 popover「同步到雲端」 | 忘記按 = Drive 從未收到 push |
| `reconcileCloudOnBoot` 若 `hasLocalPendingChanges()` → **hold**（不 pull **也不 push**） | 重整後 dirty 仍等按鈕 |
| `pagehide` / `visibilitychange` 只 flush **照片** | 待備份 JSON 可能沒送出 |
| `cloudBusy` 時 `pushCloudBackup` 回 false、**無 retry queue** | 連打寫入會漏備份 |
| 一彈窗法：silent backup **不可**開 Google popup | timer 不能呼叫 `ensureDriveAccess` |

討論版 **C**：無 GIS；`scheduleCloudBackup` 無 Drive 則 no-op；儲存鍵 `petlive-c-*`。不可從 C 寫正式 `petlive-*`。

---

## Goal

1. **Drive session 已在：** 每次成功本機寫入（debounce 後）自動 push；busy／失敗可重試；離開分頁 flush 待備份；開機若 dirty **auto-push**，**仍永不在 dirty 時 auto-pull**。
2. **Supabase 已登入、Drive 未連：** 本輪用**一次明確使用者手勢**授權 Drive，之後該 session 寫入自動備份。Silent timer **永不**彈 GIS。
3. Chrome 能看出 **備份中／未同步／已同步**（以及「尚未開啟 Drive 備份」），手動「同步到雲端」改為 **retry**，不重做整個帳號選單。

成功：Victor 登入 B → 授權 Drive 一次 → 連續記觀察／就診／用藥 → 關再開或換裝置，雲端有這串資料，不必每筆按同步。

---

## Product shape

```text
本機 pets[] 寫入成功
    → bumpLocalDataRevision（既有）
    → domains/cloud scheduler.schedule()
         ├─ 無 Drive session → 標記 pending；chrome「尚未開啟自動備份」
         │                    silent 路徑不彈窗
         ├─ 有 Drive + 不 busy → debounce（維持 ~1800ms）silent push
         ├─ busy / 失敗 → queue retry（仍不彈窗）
         └─ pagehide / visibility hidden → flush pending（若已有 Drive）

開機 reconcile
    ├─ dirty → 不 auto-pull（20260825 法）
    │         有 Drive → auto-push
    │         無 Drive → hold + 請使用者按一次授權
    └─ 非 dirty → 既有 pull / 衝突規則不動
```

### G — Drive 授權（Gate A 必選）

| 選項 | 做法 | 預設 |
|------|------|------|
| **G1** | 已登入 B 後，**一次**明確手勢（沿用「同步到雲端」或文案改「開啟自動備份」）呼叫 `ensureDriveAccess`，之後該 session 自動備份。按鈕變 **重試**。 | **本輪預設** |
| **G2** | Supabase Google OAuth 加 `drive.file`，用 `provider_token` 上傳，免第二次 GIS popup | **預設不做**；較重，見 Out of scope |
| **G3** | 本輪 G1；G2 只寫 follow-up 備註 | 若 Victor 要「現在 G1、以後考慮 G2」 |

**G2 為何不預設：** 要改 OAuth scopes、隱私／同意文案、以及 `provider_token` 存放是否仍守「Drive token 只活在 sessionStorage、不把長期 refresh 寫進 localStorage」（`security.md` trust boundary）。Legal + constitution 必須同一變更審。

---

## In scope

### AS-01 — Domain scheduler（積木，兩邊共用）

新檔 **`apps/web/domains/cloud/scheduler.js`**（IIFE → `PetLiveWeb.domains.cloud.createScheduler`）：

- debounce（沿用 ~1800ms）
- pending 旗標 + busy／失敗 retry（有上限、backoff；**不開 popup**）
- `flushPending()` 給 pagehide / visibility hidden
- 輸入：`hasDriveSession`、`pushSilent`、`isBusy`、`isDemo`、`hasRealLocalData`
- Demo（I1）不 schedule
- **禁止**把這套演算法只寫進 `app.js` / `c/app.js`

### AS-02 — B 有 Drive 就自動 push + 開機 dirty push

正式 **B only**（C 無 GIS — 這是 Google auth／Drive 的既有 B-only 例外）。

- 成功本機寫入 → scheduler（既有 `bumpLocalDataRevision` → `scheduleCloudBackup` 改薄接）
- `reconcileCloudOnBoot`：dirty **auto-push**；**仍不 auto-pull**
- 無 Drive session：不假 push；chrome 誠實

### AS-03 — 離開時 flush 待備份 JSON

B：`visibilitychange` hidden / `pagehide` 除照片外，若有 Drive + pending，呼叫 `scheduler.flushPending()`。失敗不寫壞本機（A2）。

### AS-04 — 一次明確 Drive 授權（G1）

- Silent timer / flush / boot **永不** `ensureDriveAccess`
- 唯一 popup：使用者點 popover 同步／「開啟自動備份」（既有 `onSync`）
- 授權成功後立刻 push pending；之後該 session 走 AS-02
- 手動鈕之後當 **retry**（失敗／過期再點）

### AS-05 — Chrome 狀態誠實

沿用帳號 popover + `#cloud-reconcile-status`，**不重做選單**。

Selectors 擴充 `accountSyncStatusKey`（建議新 key，四語）：

| Key（示意） | 何時 |
|-------------|------|
| `accountSyncBackingUp` | 正在 silent / flush push |
| `accountSyncDirty` | 已有（未同步變更）— 仍用 |
| `accountSyncNeedDrive` | 已登入、本機 dirty／待備份，但無 Drive session |
| `accountSyncOk` | 已有 |

按鈕：無 Drive 時主標可為「開啟自動備份」；有 Drive 後「同步到雲端」= retry。

### AS-06 — C stub 接 scheduler

C 載入同一 `scheduler.js`，transport 為 no-op / toast stub。不開 live OAuth、不寫 `petlive-*`。避免 C／B 排程腦分叉。本輪**不**把無關 C 草稿靜默覆蓋到 B／Pages。

### AS-07 — QA

`qa/tests/web-cloud-scheduler.test.js`（node:test + vm）：debounce、busy retry、無 Drive 不彈窗、dirty 不 pull、demo 不 sync、失敗不改 local revision／pets。

---

## Out of scope

- **Phase 2 Supabase DB + RLS** 寵物列／即時 multi-device DB（未選 G2 亦同）
- 預設做 **G2**（Supabase OAuth 加 `drive.file` / `provider_token`）— 除非 Victor 在 Gate A 選 G2／G3
- 長期 Drive **refresh token** 存 `localStorage`（constitution 禁止）
- 雙向欄位 merge；改整包 JSON 備份模型
- Drive 圖檔媒體備份（另案 `20260825-drive-media-backup`）
- 背景 Sync Worker / Service Worker 常駐上傳
- 重做帳號選單、intro A 登入門、C 開 live GIS
- 從 C 覆蓋無關草稿到 B／Pages
- 藥品劑量／藥師範圍

---

## Surface & cover

| 塊 | 表面 | 說明 |
|----|------|------|
| Scheduler + selectors | shared `domains/cloud` | C 可 stub wire |
| Live Drive auto-push、boot dirty push、GIS grant | **正式 B** | 積木規則下的 **B-only 例外**（Google auth / Drive） |
| Chrome 狀態 key | B 真接；C 文案對齊 | 不開 C OAuth |
| Pages 覆蓋 | 僅本提案 B Drive 行為 | 不順手蓋其他 C 實驗 |

---

## Tier 2 — layers & files

**寫檔前路徑（Builder 必守）：** 排程腦 → `domains/cloud/scheduler.js`。Chrome 狀態 → selectors + 既有 `shell/account-chrome.js`。Facade 只接 hook。

| Layer | Path | Change |
|-------|------|--------|
| Domain | `apps/web/domains/cloud/scheduler.js` **（新）** | debounce / pending / retry / flush；無 DOM、無 `t()`、不讀另一 domain 私有狀態 |
| Domain | `apps/web/domains/cloud/selectors.js` | `accountSyncStatusKey`：backing-up、need-Drive |
| Domain | `apps/web/domains/cloud/controller.js` | 薄接 `schedule` hook；不把 retry 演算法塞進 controller 以外的第二份 |
| Shell | `apps/web/shell/account-chrome.js` | 狀態字／按鈕標（need-Drive vs retry）；不重排選單 |
| Auth transport | `apps/web/auth/google-drive.js` | **B only**；維持「`ensureDriveAccess` 僅明確手勢」；不改 token 存 localStorage |
| Facade B | `apps/web/app.js` | 薄：`scheduleCloudBackup` → scheduler；reconcile dirty push；pagehide flush；`onSync` 仍是唯一 popup |
| Facade C | `apps/web/c/app.js` | 薄接 stub scheduler；不接 GIS |
| i18n | `apps/web/i18n.js` + `apps/web/c/i18n.js` | 新 key 四語 |
| Load | `apps/web/index.html` + `apps/web/c/index.html` | `<script defer src="…/domains/cloud/scheduler.js?v=">` **在** facade `app.js` **之前**；bump `?v=` |
| QA | `qa/tests/web-cloud-scheduler.test.js` | AS-07 |

**禁止：** 只在 `app.js` / `c/app.js` 長大 retry queue。**禁止：** 把 shared chrome CSS 再貼一份進 `styles.css`。

---

## Risks

| 風險 | 不變量 | 緩解 |
|------|--------|------|
| Silent timer 彈 GIS（被擋或違一彈窗法） | UX + C2 流程 | AS-04：僅 `onSync` 可 `ensureDriveAccess` |
| Dirty auto-push 被誤做成 auto-pull | **I2** | 20260825 法不動；測試 dirty hold pull |
| Push 失敗改壞／清空本機 | **A2** **L1** | 失敗只更新 chrome／pending；不 `applyCloudPayload` |
| 未授權卻顯示「已同步」 | 誠實 UX | `accountSyncNeedDrive` ≠ `accountSyncOk` |
| Demo 寫入上雲 | **I1** | scheduler 見 demo 直接 return |
| 關分頁 token 沒了，以為會跨 session 自動備 | L2 / 產品預期 | G1 誠實：新分頁可能再點一次授權；不把 refresh 寫 LS |
| G2 `provider_token` 亂存 | **C3** | 本輪預設不做 G2 |
| 跨使用者讀備份 | **C2** | 維持 `drive.file` owner-only；不擴大 scope（除非 Victor 選 G2 並 Legal 過） |
| 同機「重登掉資料」其實是 C／B 鍵分裂或還原覆蓋 | L1 | Notes 說明；本輪不合併 `petlive-c-*` 與 `petlive-*` |
| 重試打爆 Drive | A / quota | backoff + 上限；busy 單佇列 |

醫療免責：本輪不改劑量／診斷文案。Legal 看的是 **自動上傳是否仍被既有隱私／同意涵蓋**（仍是 owner Drive 備份，只是改為授權後自動 push）。

---

## Acceptance criteria

- [ ] Drive session 已在：成功寫入 → debounce 後 silent push，不必再按同步。
- [ ] `cloudBusy` 或一次失敗：pending 會 retry；不是永遠丢掉。
- [ ] pagehide / hidden：有 Drive 且 pending 會 flush JSON（不只照片）。
- [ ] 開機 dirty + 有 Drive → auto-**push**；**不** auto-pull。
- [ ] 開機 dirty + 無 Drive → 不弹窗、不 pull；chrome 要授權／未同步。
- [ ] Silent 路徑從不呼叫 `ensureDriveAccess`。
- [ ] 使用者點一次同步／開啟自動備份後，該 session 後續寫入自動備份；按鈕可當 retry。
- [ ] Demo 不寫、不同步（I1）。
- [ ] Drive 失敗不腐化本機 `pets[]`（A2 / L1）。
- [ ] Token 仍 sessionStorage；登出清 token、不刪本機寵物（L2）。
- [ ] 排程腦在 `domains/cloud/scheduler.js`；B／C facade 薄接；C 無 live OAuth。
- [ ] QA 覆蓋 scheduler + dirty-hold-pull + demo + 無 popup。
- [ ] Legal：既有隱私／同意仍準確，或只加「授權後自動備份」一句（不默默擴大蒐集）。

---

## Review routing (after Gate A + Builder)

| Reviewer | |
|----------|--|
| **QA** | **required**（排程、dirty、popup、demo、失敗） |
| **UI** | **required**（狀態字、按鈕從「開啟」變 retry、不重做選單） |
| **Legal** | **required**（auth／sync／自動上傳；G1 同意是否夠） |
| **Pharmacist** | **skip**（無劑量） |
| **Security** | Gate B 前 **security diff scan**（Drive / token / sync 路徑）；High = blocking |

---

## Same-device loss (notes, not builder_scope)

若「重登掉一長串」發生在**同一支手機**：

1. **C vs B 儲存分裂** — C 是 `petlive-c-*`，正式 B 是 `petlive-*`。在 C 記的不會出現在 B。
2. **還原覆蓋** — 使用者按「從雲端還原」而雲端是舊包，會蓋掉較新本機（I2 要 confirm；本輪不改還原鈕）。
3. **Drive 從未收到 push** — 只登了 Supabase、沒按過同步／授權，跨裝置（以及清過本機後重登）一定丟。這是本輪要修的主因。

本機 persist 在未清站台資料時仍然在；「同機重登就空」先核對是不是開錯 C／B、或 restore、或清了站台資料。

---

## Notes for Victor

請回覆兩個選擇（可寫 `G1 H1`），然後「確認」：

**G — Drive 怎麼開（本輪做哪條）**

- **G1（建議）** 登入後按一次「開啟自動備份／同步到雲端」，之後這次使用自動備份。新分頁／token 過期可能再按一次。**不**把 Google 長期 token 存進手機。
- **G2** 連 Google 登入就一次要 Drive 權限（少一次彈窗，但要改登入範圍 + 法律／token 存放，較大）。
- **G3** 這輪先做 G1；G2 以後再說。

**H — 確認不是 Phase 2 資料庫**

- **H1（必須）** 這輪只做 **Google Drive 自動備份**。不做 Supabase 寵物資料庫、也不做沒有 RLS 的雲端共用表。

確認後回覆 **「確認」** 開始平行製作；要改範圍請 **「修改：…」**；不進行請 **「否決」**。
