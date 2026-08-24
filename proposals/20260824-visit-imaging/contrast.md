# Contrast: visit imaging

## Mainline

- Emergency X-Ray button disabled; subtitle「影像資料 · 即將開放」
- Timeline has Rx proof collapse + med-proof upload only
- No visit.imaging field; no imaging summary screen

## Candidate (`proposals/20260824-visit-imaging/preview`)

- X-Ray button enabled → imaging summary list
- Timeline per-visit 影像 toggle: upload / thumbs / lightbox; video coming-soon
- `imaging-proof` screen; `visit.imaging = { xrayPhotos, usPhotos }`
- Emergency subtitle: 尚未存檔 / 最近 date · types

## Files touched (preview)

- `apps/web/index.html`
- `apps/web/app.js`
- `apps/web/i18n.js`
- `apps/web/styles.css`

## Adopted (Gate B)

Merged into mainline `apps/web/` while **preserving** later glass chrome: Home `.topbar { position: fixed }` and `.screen-emergency > .screen-head` (plus labs list glass head already on mainline). Imaging CSS/JS/screens were ported on top; `styles.css` was not replaced wholesale. Cache-bust `?v=20260824-visit-imaging-adopt`. No contracts change (preview had no imaging type).
