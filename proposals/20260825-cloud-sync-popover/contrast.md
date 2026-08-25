# Contrast: 雲端同步 UI 整合 + 本機優先

## Mainline（採用前）

- 飼主設定頁有 Google 雲端卡片（登入／同步／登出）
- 帳號 popover「編輯」開啟飼主設定
- 登入與已登入開機時無條件 `pullCloudBackup()`，整包覆蓋本機
- 離線刪除寵物後再登入，雲端舊資料會蓋回本機

## Candidate（採用後）

- 飼主設定僅保留聯絡資料；雲端入口移至帳號 popover
- Popover「同步到雲端」+ 同步狀態 +「從雲端還原」（confirm）
- `petlive-sync-meta` 追蹤 `localDirty`；本機有未同步變更時不自動 pull
- 本機已同步且雲端較新時仍自動 pull（換機還原）
- C 對齊 UI；同步為討論版 stub 提示

## Files touched

- `apps/web/index.html`, `app.js`, `i18n.js`, `styles.css`
- `apps/web/c/index.html`, `app.js`, `i18n.js`, `styles.css`
- `proposals/20260825-cloud-sync-popover/`
