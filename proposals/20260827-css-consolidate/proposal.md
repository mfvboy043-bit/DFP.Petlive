---
id: 20260827-css-consolidate
title: "Wave 3 — CSS consolidation (organize tokens / layers / dead rules; C first)"
status: reviewing
author: planner
candidate_branch: "cursor/css-consolidate-6faf"
candidate_path: "proposals/20260827-css-consolidate"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Wave 3 — CSS consolidation (C first)

Companion: `state.yaml` (v2 source of truth for gates / iteration).

**Gate A signal:** Victor 2026-08-27 —「第3波，請總指揮開始指揮」→ Orchestrator Wave 3 = architecture later-phase #7 (**CSS consolidation OR bundler**). Architecture requires **separate proposals with independent rollback**; this Wave picks **one** primary slice.

**Slice chosen: CSS consolidation** (bundler deferred). Gate A starts `pending`; parent may flip approved after write.

**Builds on (do not redo):**
Wave 1 `20260827-small-brains`, Wave 2 `20260827-wire-thin-forms` / `20260827-wire-bundles` — JS shell/domain wires only; no CSS redesign in those waves.

## Why this slice (not bundler)

| Option | Audit | Risk to current model |
|---|---|---|
| **CSS consolidate (this Wave)** | `c/styles.css` ~7963 lines; `apps/web/styles.css` ~8492 lines; **two divergent copies**; numbered sections already exist but order is messy (6b before 6), large **§36 JS HOOK COMPAT** (~1.9k lines), §37 mobile polish + §38 dock leftovers / demo / manual / C chrome appended | Low — still one `<link>` + `python3 -m http.server`; phone LAN preview unchanged |
| Bundler (Vite / npm build) | Would fight zero-build + repo-root serve (`ARCHITECTURE.md`: serve `.`, open `/apps/web/`) | High — new preview flow, build step, independent rollback harder; **defer to later proposal** |

**Surfaces:** CSS is **not** one shared file today. C loads `apps/web/c/styles.css`; formal B loads `apps/web/styles.css` (files differ). Candidate edits **C only**; Gate B covers B. Mainline untouched until adopt.

## Goal

Make C’s stylesheet easier to maintain without changing how the app looks: clarify tokens + section order, fold or label oversized “compat / polish / dock” tails, remove **proven-dead** rules — while keeping Morandi sage / beige / milktea brand, zero-build, and phone LAN preview.

## Audit (read-only, light)

| Finding | Detail |
|---|---|
| Size | C `styles.css` ~7963 lines / ~156KB; B ~8492 / ~166KB; **differ** |
| Load path | `c/index.html` → `./styles.css?v=…`; B `index.html` → `./styles.css?v=…` (separate files) |
| Structure | §§1–35 mostly coherent (tokens → reset → shell → screens); then **§36 JS HOOK COMPAT** huge; **§37 MOBILE POLISH**; **§38 dock** (comment says folded, but demo / manual / C chrome still trail) |
| Brand | Tokens already set: `--leaf` / `--beige` / `--milktea` / Fraunces + Noto — **preserve**; do not drift to purple / cream-serif / broadsheet defaults |
| Serve | `python3 -m http.server 5173 --bind 0.0.0.0 --directory .` — must keep working |

## In scope (C only until Gate B)

### A — Section hygiene (same file)

- Renumber / reorder section banners so reading order matches product (e.g. intro/top-bar numbering, restored **30b** placed with timeline/med sections).
- Keep **single** `apps/web/c/styles.css` (no multi-file split that needs a bundler; optional later Wave if Victor wants `@import` / multi-`<link>` still zero-build).
- Strengthen top-of-file TOC / layer comments (tokens → reset → atmosphere → chrome → screens → states → mobile).

### B — Compat / polish / dock tails

- Document what **§36 JS HOOK COMPAT** aliases are for (legacy token aliases, JS-generated class hooks).
- Where safe: move a block next to its owning section **without** selector/value changes; otherwise leave in place with a clearer banner.
- §38: either empty stub pointing to owning sections, or keep only true leftovers (demo banner, manual, C discussion chrome) under named sections — no silent restyle.

### C — Dead-rule removal (evidence-gated)

- Remove rules only when class/id selectors have **no** match in C HTML + C/shell/domain JS string class usage (Builder documents evidence in proposal notes or contrast).
- Prefer leave ambiguous “maybe used by dynamic markup” rules; do not mass-delete.

### D — Facade cache bump

- Bump `?v=` on `apps/web/c/index.html` stylesheet link only.
- No HTML class renames; no JS behavior changes.

### E — Gate B (later, after adopt of C)

- Cover equivalent hygiene onto `apps/web/styles.css` + B `?v=` — **not** this Gate A build. Independent rollback from bundler still holds.

## Out of scope

- **Full bundler** (npm build, Vite, esbuild, CSS modules pipeline) — separate future proposal with its own rollback
- Visual redesign, new color system, “AI-default” purple / warm-cream-serif / broadsheet look
- Changing brand tokens (`--leaf`, `--beige`, `--milktea`, fonts) except documenting aliases
- Splitting CSS in a way that breaks repo-root `http.server` or phone LAN preview
- Formal B / Pages ship until Gate B
- Wave 1/2 JS wires redo; Wave 4 `modules/*` write-truth
- Med copy, dose UX, i18n strings, HTML structure changes
- Dark-mode redesign (file already forces light medical card — leave behavior)

## Likely files

**Layer: styles (C)**

- EDIT `apps/web/c/styles.css` — organize / comment / evidence-based dead-rule removal only

**Layer: surface facade (C)**

- EDIT `apps/web/c/index.html` — stylesheet `?v=` bump only

**Deferred to Gate B cover**

- `apps/web/styles.css`, `apps/web/index.html` (`?v=`)

**Proposal**

- `proposals/20260827-css-consolidate/proposal.md`
- `proposals/20260827-css-consolidate/state.yaml`
- (later) `contrast.md`, `reviews/*`

**Not touched:** `domains/`, `shell/` JS, `core/`, `modules/`, bundler config, `package.json` build scripts

## Risks

| Risk | Mitigation |
|---|---|
| Accidental visual drift while “organizing” | Diff rules: move/comment/delete only; no property rewrites; screenshot/phone spot-check home / meds / emergency / timeline |
| Deleting a “dead” rule still used by dynamic class strings | Evidence gate; when unsure keep; QA checks key screens |
| Editing shared-looking CSS and silently shipping B | **C file only** until Gate B; B has its own `styles.css` copy |
| Scope creep into bundler | Explicit non-goal; independent proposal later |
| Pharmacist / med UI tone shift | No color/token brand change; UI reviewer on visual parity |

## Acceptance criteria

- [x] Candidate on `cursor/css-consolidate-6faf` (or worktree); **mainline** `apps/web/` untouched until Gate B adopt
- [x] Only C `styles.css` (+ `c/index.html` `?v=`) in product diff for Gate A build
- [x] Zero-build preserved: `python3 -m http.server 5173 --bind 0.0.0.0 --directory .` → `/apps/web/c/` works on desktop + phone LAN
- [x] Section banners / TOC readable; §36–§38 purpose clear
- [x] Any deleted rules listed with evidence (or zero deletions if none proven)
- [x] Visual parity: no intentional redesign; Morandi sage/beige/milktea + existing fonts unchanged
- [x] No bundler / npm build step introduced
- [ ] Reviews: UI on parity; QA on load + key screens; pharmacist **skip** (no med logic/copy)

## Rollback

1. Do not adopt (Gate B reject) — mainline unchanged.
2. If candidate branch merged then regretted: revert the single CSS + `?v=` commit(s); no bundler lock-in.
3. Bundler remains a **separate** later proposal — rolling back CSS does not strand a build toolchain.

## Builder handoff (Gate A)

See `builder-notes.md` — C `styles.css` 7963→7777; dead-rule evidence; risks for UI/QA. Status → reviewing. No B cover.

## Notes for Victor（白話／五歲聽得懂）

第 3 波我們選「**整理衣櫃**」，不是「**買新洗衣機**」：

- **整理 CSS**＝把超長的 `styles.css` 標籤貼好、順序理好、確定沒人穿的衣服丟掉。看起來要一樣，只是下次找東西比較快。手機用同一套 `python3 -m http.server` 預覽，不用裝新工具。
- **打包工具 bundler**＝換新洗衣機，要改怎麼啟動預覽，風險比較大 → **下一張提案再做**，跟這次可以分開退貨。

現在 C 跟正式 B 各有一份 CSS（不完全一樣），所以先只整理 **C**；你說「採用」後再蓋到 B。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
