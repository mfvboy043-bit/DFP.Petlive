# Contrast — 20260825-manual-guide

## Mainline (current B)

1. 選單「說明書」整頁導向 `?demo=1`（唯讀示範 + 常自動開 tour）
2. 無獨立可閱讀的操作指南 screen
3. 正式帳號點說明書會離開自己的護照進示範屋
4. Demo tour 用 spotlight；手機上說明卡常被裁／看不見
5. 空帳號沒有「從說明走到新增寵物」的說明路徑

## Candidate (`proposal/manual-guide` @ `.worktrees/manual-guide`)

1. 「說明書」→ `go("manual")`，不強制 `?demo=1`
2. 新 screen：先拆誤會 → 五步 → 邊界 → FAQ → 文末 CTA
3. 誤會主句：資料在你這邊／雲端帳戶；disclaimer 為次句
4. 本輪無 spotlight；「開始導覽」disabled／即將開放
5. 次要 CTA 明示唯讀示範屋；主 CTA 依有無寵物切換回護照／新增寵物

## Files touched

- `apps/web/index.html`
- `apps/web/app.js`
- `apps/web/i18n.js`
- `apps/web/styles.css`
- `proposals/20260825-manual-guide/`
