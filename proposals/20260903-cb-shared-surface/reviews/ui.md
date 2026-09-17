# UI review — 20260903-cb-shared-surface (Phase 2)

**Candidate:** `.worktrees/cb-shared-surface-p2` @ `proposal/cb-shared-surface-p2`  
**Surfaces reviewed:** B `http://127.0.0.1:5190/apps/web/?app=1`, C `http://127.0.0.1:5190/apps/web/c/`  
**Scope:** B activates shared `shell/account-chrome.css` + `shell/parasite-strip.css` (same owners as C); surface duplicates removed from `styles.css`.  
**Verdict: pass**

Independent pass. Did not read other `reviews/*.md`. No product JS/CSS edits.

---

## Cascade

| Surface | Order (stylesheet links) | Result |
|---|---|---|
| B | fonts → `shell/account-chrome.css?v=20260903-cb-p2` → `shell/parasite-strip.css?v=20260903-cb-p2` → `styles.css` → other shell | **OK** — shared owners load **before** `styles.css` |
| C | fonts → `../shell/account-chrome.css?v=20260903-cb-p2` → `../shell/parasite-strip.css?v=20260903-cb-p2` → `./styles.css` → … | **OK** — same token + same relative order |

Runtime check (CDP): B `accountIdx=1`, `parasiteIdx=2`, `stylesIdx=3`. C identical indices.

B `styles.css` leftover selectors: `.account-chip` **0**, `.parasite-strip` **0** (popover/menu rules remain in surface CSS — outside Phase 2 chip/strip migration).

---

## Visual / layout

### Parasite strip (B home, unsigned via `?app=1`)

- Present (`#parasite-strip`), three cells: 疫苗 / 體外 / 心絲蟲, lights +「尚未設定 · 點此新增」+「未保護」.
- Desktop ~1060: horizontal 3-up grid; card buttons ≈ **261×102**.
- Narrow ~390-class: stacked rows; buttons ≈ **328×44**.
- Shared strip paint looks intact (lights, empty-state copy, card geometry). Matches C strip chrome structure (C has demo pet data; B empty-state content differs as expected).

### Account chip

- Markup present on B (`#account-chip` inside `#account-menu`).
- When unsigned, `#account-menu[hidden]` — chip not laid out (0×0). **Expected B auth chrome**, not a missing shared CSS file.
- Computed chip styles still resolve from shared owner even while menu hidden: desktop `min-height: 38px`, `background: rgb(26,26,26)`; narrow breakpoint `min-height: 40px`, `padding: 4px 10px 4px 4px`, `gap: 6px`, `border-radius: 999px` — matches `shell/account-chrome.css`.
- C (demo signed-in): chip visible ≈ **103×40**, same bg / radius language — shared CSS path confirmed live.

### Tap targets

| Control | Viewport | Size | Notes |
|---|---|---|---|
| Strip cells | desktop | ~261×102 | Pass (≥44) |
| Strip cells | phone-class | ~328×44 | Pass (meets 44) |
| Account chip (C live) | phone-class | ~103×40 | Pass |
| Account chip (B unsigned) | — | n/a layout | Parent menu hidden |

No overflow/collision of strip vs home CTAs observed at reviewed viewports.

---

## UI-n issues

None.

---

## Evidence

Screenshots (identical copies under main + worktree `…/reviews/ui-screenshots/`):

- `b-home-desktop-1060.png`
- `b-home-desktop-1060-chip-strip.png` (strip crop)
- `b-home-phone-390.png`
- `b-home-phone-390-chip-strip.png` (strip / empty-home band)

Served worktree on `127.0.0.1:5190`; server stopped after capture.

---

## Unverified

- **Signed-in B account-chip paint** (avatar + name + tap geometry) — needs live Google/Supabase session; unsigned `?app=1` correctly keeps `#account-menu` hidden. Shared declarations verified via computed style + C demo chip, not via B signed-in screenshot.
- Pixel-diff vs pre–Phase 2 B baseline assets (no prior-B golden frames in this pass).
- Account popover open state / positioning under shared chip CSS (popover rules still surface-owned).
