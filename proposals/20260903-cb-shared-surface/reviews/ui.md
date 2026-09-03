# UI review — 20260903-cb-shared-surface Phase 1

- verdict: **pass**
- reviewer: UI (independent pass)
- candidate: `/private/tmp/petlive-cb-shared-surface-p1` · `proposal/cb-shared-surface-p1`
- served: `http://127.0.0.1:5188/apps/web/c/` (worktree zero-build)

## Issues

None blocking.

No UI-n findings at High/Medium. Cascade and visual smoke for the migrated account-chip + parasite-strip blocks look intact on C; B product cascade remains unchanged for Phase 1.

## Evidence

### Ownership / link order (C)

- `apps/web/c/index.html` loads, in order:
  1. `../shell/account-chrome.css?v=20260903-cb-p1`
  2. `../shell/parasite-strip.css?v=20260903-cb-p1`
  3. `./styles.css?v=20260903-cb-p1`
- Migrated selectors are **absent** from `apps/web/c/styles.css` (no `account-chip` / `parasite-strip` / `parasite-row` leftovers).
- Canonical rules live in `shell/account-chrome.css` (unlayered) and `shell/parasite-strip.css` (`@layer petlive-shared-shell` for layout/status tones; unlayered lights overlay preserved at file end).

### B unchanged (Phase 1 contract)

- Worktree Phase 1 dirty set does **not** include `apps/web/index.html`, `apps/web/styles.css`, or `apps/web/app.js`.
- B still has **no** `account-chrome.css` link.
- B still loads `./styles.css` **before** `./shell/parasite-strip.css?v=20260830-strip-lights` (token unchanged).
- New parasite layout/status rules are inside `@layer petlive-shared-shell`, so B’s existing unlayered surface duplicates remain the winning origin; lights overlay stays unlayered and continues to win label/`::before` traffic-light presentation as before.

### Declaration fidelity

Normalized body compare of migrated selectors vs B surface duplicates: account-chip family and parasite-strip/row/status-tone blocks **match** (including `.parasite-row.is-protected|approaching|unprotected|optional` and responsive `@media` counts for 760 / 1060 / 759). Intentional C-only activation + `@layer` wrapping for B safety noted in cascade-evidence.

### Screenshots (C home)

Captured via headless Chrome against the worktree server; saved under both:

- `proposals/20260903-cb-shared-surface/reviews/ui-screenshots/`
- worktree `proposals/20260903-cb-shared-surface/reviews/ui-screenshots/`

| File | Focus |
|------|--------|
| `c-home-desktop-1060.png` | Full C home ~1060×1600 |
| `c-home-desktop-1060-chip-strip.png` | Same, upper composition (chip + strip) |
| `c-home-phone-390.png` | Full C home ~390×1000 |
| `c-home-phone-390-chip-strip.png` | Same, upper composition |

Observed:

- **Account chip:** dark pill, avatar +「示範飼主」, sits with menu in top chrome; no obvious overflow/clip at 1060; at 390 remains a usable dark control beside menu / C badge.
- **Parasite strip:** desktop 3-column cards with traffic lights, approaching (即將到期) + unprotected (未保護) tones; phone stacked rows with lights + meta; row height/padding reads ≥ tap-friendly (~44px phone min-height in CSS).
- No missing-style blank strip, broken lights, or chip collapse seen in these captures.

### Pre-migration C cascade note (informational)

Before Phase 1, C loaded `styles.css` then later `parasite-strip.css` (lights last). After Phase 1, layout/status move into `@layer` inside `parasite-strip.css` with lights still unlayered afterward, then `c/styles.css` without duplicates. Lights still beat layered label/`::before` rules; layout has no remaining C surface competitor. Screenshots consistent with intended parity.

## Unverified

- Pixel-diff / computed-style dump **before vs after** on the same baseline DOM (this pass is after-only screenshots + CSS/cascade inspection).
- Live B browser paint (not required to change visually; inferred from untouched B files + `@layer` demotion of shared parasite rules).
- Interactive tap/hover timing and screen-head-actions chip at ≤720px (name hide) not separately exercised beyond static phone/desktop shots.
- Other reviewers’ notes not read (independent pass).
