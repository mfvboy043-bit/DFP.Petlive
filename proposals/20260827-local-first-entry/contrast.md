# Contrast: Google gate restored (iteration 2) — adopted

## Mainline before adopt

- A 開機大門大致已在；未登入停介紹頁
- 未登入時齒輪仍可能出現（signed-out fallback）
- A 按鈕文案是「登入」而非「用 Google 登入」
- `go()` 未鎖未登入導向，理論上可晃進 B

## After adopt (this land)

- A **只留**「用 Google 登入」→ 進 B
- 未登入：`go()` 強制回 A；登出回 A；齒輪一律 hidden
- 示範 `?demo=1` / 除錯 `?app=1` / `screen=home` 仍可進 B
- C：去掉死的「進入護照」listener；齒輪 hidden；C 仍無 A 大門（討論面）

## Files touched

- `apps/web/index.html`, `app.js`, `styles.css`
- `apps/web/c/index.html`, `c/app.js`
- `proposals/20260827-local-first-entry/*`
