# Contrast: 20260825-breed-groups-collapse

## Mainline (current B)

- Breed chips are a flat wrap list for dog/cat; long on mobile.
- No expand/collapse; full list always visible.
- No group headers; order is the array order in `breeds-database.js`.
- Selected breed is only indicated by chip selected state in the full list.

## Candidate (`proposal/breed-groups-collapse`)

- Default **collapsed** preview: common group ∪ current selected ∪ `__custom__`.
- Expand/collapse toggle with i18n labels; `aria-expanded`.
- Expanded view shows dog/cat group headers (台灣優先分組 / 貓短毛長毛).
- Breed `value` / `breedKey` unchanged; no data migration.
- QA-001 fixed: collapsed preview rebuilds on every selection.

## Files touched

- `apps/web/breeds-database.js`
- `apps/web/app.js`
- `apps/web/index.html`
- `apps/web/styles.css`
- `apps/web/i18n.js`
- `proposals/20260825-breed-groups-collapse/*`

## Residual (non-blocking)

- UI-001: toggle tap target &lt; `--tap`
- UI-002: collapse control only below full expanded list
- UI-003 / UI-004: pinned-chip separation / singleton group header density
