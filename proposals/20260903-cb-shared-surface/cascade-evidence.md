# Phase 1 cascade / computed-style evidence

No browser was available in this Builder pass, so this note records cascade proof instead of screenshots or live computed-style dumps. UI review should still capture C desktop/phone screenshots before Gate B.

## B parasite rules stay authoritative

Canonical layout, responsive, and status-tone rules were added inside `@layer petlive-shared-shell` in `apps/web/shell/parasite-strip.css`. Unlayered declarations beat layered ones, so B's unchanged copies in `apps/web/styles.css` remain the winning origin for those properties.

B still loads `./styles.css` before `./shell/parasite-strip.css` and does not change that token. The pre-existing unlayered lights overlay at the bottom of `parasite-strip.css` is unchanged and still wins over B surface `.parasite-row-label` / `::before` rules, as it did before this phase.

Because B product files (`index.html`, `styles.css`, `app.js`) are untouched, B computed styles for the migrated selectors should match the HEAD baseline.

## C loads canonical CSS before surface overrides

C `index.html` order is now:

1. `../shell/account-chrome.css?v=20260903-cb-p1` (unlayered canonical account chip)
2. `../shell/parasite-strip.css?v=20260903-cb-p1` (`@layer` canonical parasite rules, then unlayered lights overlay)
3. `./styles.css?v=20260903-cb-p1` (C-only remainder; migrated account/parasite blocks removed)

C can still override with later `c/styles.css` rules. The migrated selectors are absent from `c/styles.css`, so C now paints from the canonical shell files plus the existing lights overlay.

## B does not link account-chrome.css

`apps/web/index.html` has no `account-chrome.css` link. B account chip/screen-head rules continue to come only from `apps/web/styles.css`.
