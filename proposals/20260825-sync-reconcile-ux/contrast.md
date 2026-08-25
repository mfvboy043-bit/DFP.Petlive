# Contrast: 換機／首次登入同步 UX

## Mainline（採用前）

- 開 app 先 hydrate seed 示範寵物，reconcile 在背景 silent 執行
- 雲端無 JSON 時無條件 silent push（可能推 seed）
- reconcile 無 UI；同步鈕在 pull 完成前可按
- 衝突僅 localDirty 一種

## Candidate（採用後）

- 無本機 graph 時不載 seed；已登入等 reconcile
- 僅 `hasRealLocalData()` 才 silent push
- Home status bar + popover 顯示 checking/restoring；busy 時禁用同步
- 非 dirty 但 fingerprint 不同 → 衝突提示 + 手動選擇

## Files touched

- `apps/web/app.js`, `index.html`, `i18n.js`, `styles.css`
- `apps/web/c/*`
