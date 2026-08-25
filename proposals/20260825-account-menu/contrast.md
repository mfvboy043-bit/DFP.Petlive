# Contrast — 20260825-account-menu

Branch: `proposal/account-menu`

## Mainline (today)

1. Home topbar signed-in: same silhouette `#owner-settings-btn` as signed-out; no Google avatar/name in topbar.
2. Logout / account chrome lives mainly on intro + owner-settings cloud section.
3. Language FAB and topbar chrome are independent overlays.
4. Wide desktop (≥1060px): `.pet-switcher` was a 2-column grid (picker | details) — sparse hole (Victor separately reported).
5. No account popover in home topbar.

## Candidate

1. Signed-in: white pill chip (Google avatar + display name); silhouette hidden.
2. Click chip → popover: avatar, name, email, 飼主設定, 登出; outside / Escape close.
3. Signed-out: silhouette → owner-settings unchanged.
4. Also on this branch (from Victor’s earlier desktop board ask): large-desktop pet board stacks vertically like phone (QA-002 / UI-005).
5. Non-blocking polish left: chip+lang both open (QA-001), tap height (UI-002), avatar onerror (QA-003).

## Files touched

- `apps/web/index.html` — account chip + popover markup; cache `?v=`
- `apps/web/styles.css` — account chrome; desktop pet-switcher stack
- `apps/web/app.js` — paint / toggle / logout / settings
- `apps/web/i18n.js` — account strings (zh/en/ja/ko)
- `deploy/GITHUB-PAGES.md` — OAuth origin notes (earlier session)
- `proposals/20260825-account-menu/*`
