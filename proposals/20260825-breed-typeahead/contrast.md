# Contrast: 20260825-breed-typeahead

## Mainline (before adopt)

- Breed chips with collapse + groups; free-text only after「其他」.
- No keyword suggestion menu for breeds.
- Drug form already has `#drug-search` + `#drug-results` typeahead.

## Candidate (adopted)

- Always-visible `#breed-search` + `#breed-results` (drug-results pattern).
- Pick suggestion → stable `breedKey` via `setSelectedBreed` (works with collapsed chips).
- Free text without pick → `__custom__` + custom string (no silent coerce).
- Touch: `pointerdown` commits suggestion (QA-001 fixed).
- species=other → free text only.

## Files touched

- `apps/web/index.html`, `app.js`, `styles.css`, `i18n.js`, `breeds-database.js`
- `proposals/20260825-breed-typeahead/*`

## Residual (non-blocking)

- QA-002: stale search face when selection cleared
- UI-001–005: dual chip/search primacy, accidental demote to custom, mobile keyboard/results position, hint length, short-query flood
