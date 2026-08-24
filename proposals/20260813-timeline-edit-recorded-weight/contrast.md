# Mainline vs candidate

## Mainline

- Recorded visit weight is a static `.tl-weight-value` span; no edit form is emitted.
- Only pending visits expose `.tl-weight-pending` + `.tl-weight-edit`.
- Comparison delta (`.tl-weight-vs`) displays beside recorded weight with no edit affordance.
- Save path exists only for the pending form.

## Candidate

- Recorded kg is a button `.tl-weight-value` with the same `data-visit-weight-toggle` pattern as pending.
- `.tl-weight-edit` is always emitted for recorded visits and opens prefilled; save still uses `saveVisitWeightAtIndex`.
- `.tl-weight-vs` stays outside the toggle hit target.
- Light underline affordance (not the amber pending pill); `visitWeightEditAria` in zh-Hant / en / ja / ko.
- Known non-blocking polish: small tap target (UI-001), subtle open cue (UI-002).

## Files touched (candidate)

- `preview/apps/web/app.js`
- `preview/apps/web/styles.css`
- `preview/apps/web/i18n.js`
- `preview/apps/web/index.html` (cache-bust)

## Adoption note

Adopted into mainline `apps/web/` (`app.js`, `styles.css`, `i18n.js`, `index.html` cache-bust). Recorded weight is clickable and opens the existing edit form.
