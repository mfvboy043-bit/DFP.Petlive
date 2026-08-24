# QA review
Verdict: pass

## Findings

No material defects.

## Checks (iteration 1)

- Scope: candidate preview differs from mainline only in `apps/web/styles.css` (CSS-only; no HTML/JS/i18n).
- Nested flatten vs depth: `.alert-section .alert-item` still forces flat `background` / `box-shadow: none` with `!important`; `.alert-section .alert-item.severity-critical|caution` overrides with higher specificity + `!important` on border, gradient background, and dual-inset + tinted outer shadow — depth wins in-list.
- Plate alignment: standalone `.alert-item.severity-critical|caution` (and legacy `.alert-critical` / `.alert-caution`) get the same surface language; caution stays milktea/beige (not rose).
- Selectors vs markup: `app.js` renders `li.alert-item.severity-${severity}` with `critical|caution` only — matches candidate rules; edit/delete stay on `.alert-item-actions` / `.alert-section.is-editing` (untouched).
- Layout / actions: severity shared padding/radius/margin unchanged from prior structure; action show/hide and delete styling not modified.
- Left rail: still suppressed inside `.alert-section` via existing `::before { display: none }` (pre-change); standalone plate rails and type colors unchanged.
- Mobile (`max-width: 759px`): `.alert-item` / `.alert-section` retouch padding only; alerts-screen section chrome does not reset item background/border/shadow — depth not wiped.
- Empty / non-severity: section empty copy and bare `.alert-section .alert-item` flatten path remain; no implied interaction or state regressions from CSS selectors.
