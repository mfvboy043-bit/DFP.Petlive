# Wave 3 CSS consolidate — Builder notes (Gate A / C only)

**Branch:** `cursor/css-consolidate-6faf`  
**Lines:** `apps/web/c/styles.css` **7963 → 7777** (−186)  
**Facade:** `apps/web/c/index.html` stylesheet `?v=20260827-css-consolidate`

## A — Section hygiene

- Added LAYER TOC at file top (tokens → chrome/screens → responsive → tails).
- Renumbered banners: intro **6**, top bar **7**, cascade through language **30**; completion–dark remain **31–35**.
- Moved former **§30b** timeline med/compound block to sit after timeline as **§20b** (selectors/values unchanged).
- Single file kept; no bundler / `@import` split.

## B — Compat / polish / dock tails

- **§36** banner documents purpose: legacy `:root` aliases + JS class hooks; points compound visuals to §20b.
- **§37** banner clarifies phone override role.
- **§38** renamed to **C SURFACE LEFTOVERS** (discussion banner + `#cloud-account-card` hide). No selector/value restyles in moved tails.

## C — Dead-rule removal (evidence-gated)

Corpus: `apps/web/c/index.html` + `c/*.js` + `shell/` + `domains/` + `core/` + `runtime/` + `auth/` + shared `apps/web/{app,i18n,breeds-database,config.public}.js`.

Removed only when class/id had **no** HTML match and **no** JS string / template construction (`severity-${…}` etc. kept).

| Removed | Evidence |
|---|---|
| `.intro-cta-row` | Not in C HTML/JS |
| `.cloud-account-card/title/status/email/actions` | Not in C markup/JS; kept `#cloud-account-card{display:none}` as C chrome policy |
| `.app-nav-ico` | Nav uses `.app-nav-label` / flanks, not ico |
| `.rainbow-btn` (+ `::before`, `-glow`) | `#archive-btn` shelved from topbar; no element with class; `.settings-btn` kept |
| `.parasite-cal-actions` | Live class is `.parasite-cal-chooser-actions` |
| `.source-stamp` / `.owner-stamp` / `.clinic-stamp` | No stamp classes in C HTML/JS |
| `.is-safe` / `.is-attention` / `.status-protected` / `.status-approaching` / `.status-expired` | Live lamps use `is-protected` / `is-approaching` / `is-expired` / `is-unprotected` |
| `.status-badge` / `.badge` / `.badge-safe|attention|critical` | No matches in C HTML/JS |
| Standalone `.alert-critical` / `.alert-caution` aliases | Live markup is `severity-${severity}` via `domains/alerts/render.js` |

**Left on purpose (ambiguous / live):** all `severity-critical|caution` rules; full §36 hook body; §38 banner + Drive hide.

## D — Cache bump

- `apps/web/c/index.html` only — not formal B.

## Risks for UI / QA

- **Cascade:** §20b moved earlier; exact-selector overlap with §§21–35 was empty; §36 still wins over §20b for shared med-list hooks.
- **Dead removals:** shelved rainbow / Drive chrome / legacy stamps — spot-check intro, home top bar, alerts severity rows, parasite chooser, settings chip.
- **No redesign intent** — tokens/fonts unchanged; pharmacist skip; UI parity + QA load/key screens.

## Gate B cover (Victor 2026-08-27「採用、覆蓋」)

**Formal B:** `apps/web/styles.css` **8492 → 8310** (−182)  
**Facade:** `apps/web/index.html` stylesheet `?v=20260827-css-consolidate`

Same class of changes as C on the divergent B copy (not a blind overwrite):

- LAYER TOC + renumber (intro `6` … language `30`; `20b` after timeline)
- §36–37 purpose banners; §38 = **B SURFACE LEFTOVERS** (demo + manual — kept)
- Dead-rule removals re-evidence-gated on B HTML/JS corpus (same selector set as C where unused on B)
- Did **not** add C-only `#cloud-account-card{display:none}` / `.surface-c-banner`
- Morandi tokens unchanged; no bundler

## Not done

- Bundler / multi-file CSS split — separate future proposal.
