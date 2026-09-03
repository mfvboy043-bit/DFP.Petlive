# QA review — 20260903-cb-shared-surface Phase 1

- verdict: **pass**
- issues: none
- reviewer: qa (independent; did not read other `reviews/*.md`)
- candidate: `/private/tmp/petlive-cb-shared-surface-p1` @ `proposal/cb-shared-surface-p1` (HEAD `133d70c` + Phase 1 working tree)

## Evidence

### 1) Scoped tests (required)

```bash
cd /private/tmp/petlive-cb-shared-surface-p1
"/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node" --test \
  qa/tests/web-shared-css-ownership.test.js \
  qa/tests/web-surface-assets.test.js
```

Result: **7 pass / 0 fail** (2 suites).

### 2) B product files unchanged

```bash
git diff --name-only
# apps/web/c/index.html
# apps/web/c/styles.css
# apps/web/shell/parasite-strip.css
# (+ untracked: apps/web/shell/account-chrome.css, qa/*, proposals/…)
```

`git diff --name-only -- apps/web/index.html apps/web/styles.css apps/web/app.js` → **empty**. No B product edits.

### 3) Migrated selectors ownership

- `rg` for `.account-chip` / `.screen-head-actions .account` / `.parasite-strip` / `.parasite-row` in `apps/web/c/styles.css` → **no matches**.
- Present in `apps/web/shell/account-chrome.css` (account/screen-head chip rules) and `apps/web/shell/parasite-strip.css` (layout/status inside `@layer petlive-shared-shell`, lights overlay preserved after layer).
- Ownership test asserts C migrated rule count **0**; canonical rule/declaration counts match allowlist (`14/47` account, `27/79` parasite slice).

### 4) C vs B stylesheet activation

C `apps/web/c/index.html` link order (only stylesheet change in that file):

1. `../shell/account-chrome.css?v=20260903-cb-p1`
2. `../shell/parasite-strip.css?v=20260903-cb-p1`
3. `./styles.css?v=20260903-cb-p1`

B `apps/web/index.html`: loads `./styles.css` then `./shell/parasite-strip.css`; **no** `account-chrome.css`. Confirmed by test + `rg`.

### 5) Allowlist labeled for Phase 2 deletion

`qa/fixtures/web-shared-css-allowlist.json`: `"delete_in": "Phase 2"`; surface `B` / `apps/web/styles.css`; note says delete with Phase 2 B duplicate removal. Test asserts `ALLOWLIST.delete_in === "Phase 2"` and B signatures match canonical.

### 6) Zero-build

Static CSS/HTML only. `package.json` `serve` is `python3 -m http.server`; no webpack/vite/rollup configs; no bundler/npm production step introduced for this pilot.

### 7) Scope hygiene (storage / auth / i18n / screens / medical)

Changed product paths limited to:

- `apps/web/shell/account-chrome.css` (new)
- `apps/web/shell/parasite-strip.css` (extended)
- `apps/web/c/index.html` (stylesheet link/order/cache tokens only)
- `apps/web/c/styles.css` (removed duplicate selector blocks)

No diffs on `apps/web/app.js`, `apps/web/c/app.js`, i18n, `core/`, `auth/`, `domains/`, or HTML body/screen markup.

### 8) Building blocks (BB-n)

**BB-n does not apply.** New chrome CSS lives under `apps/web/shell/account-chrome.css` and extended `apps/web/shell/parasite-strip.css`; C only removes duplicates and wires links. Not dumped solely into surface `styles.css`.

### Full suite note (baseline)

`node --test qa/tests/*.test.js` on candidate: **268 pass / 20 fail**. Same **20 fail** count on clean HEAD with Phase 1 changes stashed (**261 pass / 20 fail**). Failures are pre-existing on this branch baseline (alerts/allergy/storage/cloud/labs/owner/vaccines/weight-scale ESM, etc.), **not** Phase 1 regressions. Scoped pilot tests are green.

## Unverified items

- Live `python3 -m http.server` browser load and DevTools computed-style dumps (static cascade proof in `cascade-evidence.md` + ownership tests; not re-measured in a browser here).
- Pixel / visual before–after parity of C desktop/phone screenshots (files exist under `reviews/ui-screenshots/`; visual judgment deferred to UI reviewer).
- Formal Pages / B runtime behavior beyond “B product files and account-chrome link unchanged.”
