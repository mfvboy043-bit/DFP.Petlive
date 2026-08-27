# Contrast: Google gate restored (iteration 2)

## Mainline（正式版現況）

- A 是 Google 大門：未登入停在介紹頁；登入 → B
- 登出回 A；本機資料不刪
- 登入後帳號 chip；齒輪在 signed-out 時曾作為飼主設定入口（Victor 已捨棄）

## Iteration 1 candidate（已否決的本機先進）

- A 有「進入護照」不經 OAuth
- 未登入可在 B；登出留在 B；齒輪又出現；頂欄「用 Google 登入」接備份

## Iteration 2 candidate（Gate B 修改後）

- A **只留**「用 Google 登入」→ 進 B；**無**「進入護照」
- 未登入不能在 B 晃；登出回 A
- `#owner-settings-btn` 一律 hidden；飼主設定走登入後 popover
- 無 unsigned connect chip；C 討論預覽維持 signed-in stub

## Files touched (candidate worktree)

- `apps/web/index.html`, `app.js`, `i18n.js`, `styles.css`
- `apps/web/c/index.html`, `c/app.js`, `c/styles.css`（stub 還原）
