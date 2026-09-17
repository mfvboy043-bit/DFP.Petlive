# QA review — Phase 2 re-run (`20260903-cb-shared-surface`)

- **Reviewer:** QA (independent re-run after Builder QA-1 fix)
- **Candidate:** `/Users/victorwu/Desktop/petlive/.worktrees/cb-shared-surface-p2` @ `proposal/cb-shared-surface-p2`
- **Scope:** Phase 2 — B activation of canonical account/parasite CSS; C shared token align; tests + allowlist deletion; **QA-1 popover-only restore**
- **Date:** 2026-09-17
- **Prior blocking:** QA-1 (comma-grouped chip+popover rules deleted wholesale; popover halves missing)

## Verdict

**pass**

**QA-1 is fixed.** Popover-only halves are restored identically in B and C `styles.css`; chip halves remain in `shell/account-chrome.css`; no migrated `.account-chip*` / `.parasite-strip` / `.parasite-row` duplicates reappear in surface styles. Phase 2 ownership + surface-assets tests: 6/6 pass. Link order + shared shell token OK.

## Checks

| # | Check | Result |
|---|---|---|
| 1 | `node --test` ownership + surface-assets (worktree absolute paths) | **pass** — 6/6 |
| 2 | Migrated selectors absent from `c/styles.css` and `styles.css`; present in shell CSS | **pass** — 0 surface hits for `.account-chip` / `.parasite-strip` / `.parasite-row` / `screen-head-actions .account` |
| 3 | B and C load `account-chrome` + `parasite-strip` before `styles.css`; shell token `20260903-cb-p2` | **pass** |
| 4 | Surface `styles.css` cache bumped for QA-1 | **pass** — `?v=20260917-cb-p2-qa1` on B and C |
| 5 | Phase 1 allowlist fixture gone | **pass** — `qa/fixtures/web-shared-css-allowlist.json` deleted |
| 6 | QA-1 popover-only rules in both B and C `styles.css` | **pass** — fixed |
| 7 | BB-n chrome CSS still in `shell/` | **pass** |

## Issues

### QA-1 — B/C lost account-popover half of comma-grouped chip rules — **FIXED**

Prior fail: deleting migrated `.account-chip*` blocks from surface CSS also dropped co-located `.account-popover-*` decls not owned by `shell/account-chrome.css`.

**Re-verify (both surfaces identical block):**

```css
/* Popover-only halves of former chip+popover grouped rules (QA-1).
   Chip halves live in shell/account-chrome.css; do not re-merge. */
.account-popover-avatar[hidden] {
  display: none !important;
}

.account-popover-fallback {
  display: grid;
  place-items: center;
  background: #3d6b57;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.account-popover-fallback[hidden] {
  display: none !important;
}
```

Present in `apps/web/styles.css` and `apps/web/c/styles.css` (B body ≡ C body). Chip `[hidden]` / fallback grid halves remain only in `shell/account-chrome.css`. No re-merge of chip+popover grouped selectors into surface styles.

### BB-1 — Shared chrome CSS remains under `shell/` (pass)

Canonical account/parasite CSS continues to live in `apps/web/shell/account-chrome.css` and `apps/web/shell/parasite-strip.css`. Phase 2 links them on B/C and removes surface duplicates; QA-1 restore is popover-only (surface-owned), not chrome brain pasted into surface sheets. **BB pass.**

## Evidence

### Tests (worktree)

```text
"/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node" --test \
  /Users/victorwu/Desktop/petlive/.worktrees/cb-shared-surface-p2/qa/tests/web-shared-css-ownership.test.js \
  /Users/victorwu/Desktop/petlive/.worktrees/cb-shared-surface-p2/qa/tests/web-surface-assets.test.js
→ Phase 2 shared CSS ownership: 4 pass
→ Phase 2 surface stylesheet activation: 2 pass
→ tests 6, fail 0
```

### Link order + token

- **C** `c/index.html`: `../shell/account-chrome.css?v=20260903-cb-p2`, `../shell/parasite-strip.css?v=20260903-cb-p2`, then `./styles.css?v=20260917-cb-p2-qa1`
- **B** `index.html`: `./shell/account-chrome.css?v=20260903-cb-p2`, `./shell/parasite-strip.css?v=20260903-cb-p2`, then `./styles.css?v=20260917-cb-p2-qa1`; single parasite-strip link

### Selector ownership

| File | Migrated selector rules (`.account-chip*` / `.parasite-strip*` / `.parasite-row*` / screen-head account) |
|---|---|
| `c/styles.css` | 0 |
| `styles.css` | 0 |
| `shell/account-chrome.css` | chip / screen-head present |
| `shell/parasite-strip.css` | strip / row / status present |

### Diff scope note (QA-1 revision)

QA-1 fix touches `apps/web/styles.css`, `apps/web/c/styles.css`, and both `index.html` cache tokens for surface styles. Shared shell CSS bodies unchanged for this re-run claim; ownership tests still green.

## Unverified

- Computed styles / screenshots for B account popover avatar↔fallback `[hidden]` after restore (UI gate)
- Formal Pages publish / Gate B adoption (out of QA scope)

## Gate recommendation

**QA clear for Gate B** on Phase 2 + QA-1. Prior blocking QA-1 is resolved. UI may still smoke-check B popover avatar/fallback if desired; no open QA Medium/High.
