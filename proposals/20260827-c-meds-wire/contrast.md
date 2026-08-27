# Contrast: main vs `cursor/c-meds-wire-ad50`

## Moved to building blocks (C only)

C now creates and delegates to the same meds APIs B already uses:

- `medicationsSelectors` — dose / course / draft line / compound class tokens
- `medicationsController` — validate, pending list, compound colors, visit find + weight, photo bundle, append units, drug search via `drugsAdapter`

## Still in facade

- DOM listeners, toast i18n, chip toggles, form read
- Clinic directory search (unchanged)

## Formal B

Untouched (already wired).

## Net

`apps/web/c/app.js`: ~−114 lines of duplicate med brain.
