---
id: 20260903-cb-shared-surface
title: C/B shared passport surface with thin adapters
status: adopted
author: planner
candidate_branch: ""
candidate_path: ""
created: 2026-09-03
updated: 2026-09-03
---

# Proposal: C/B shared passport surface with thin adapters

Companion: `state.yaml` (v2 source of truth for gates / iteration).

**Gate A scope is Phase 1 only.** Later phases below are architectural direction, not permission to build them. No `apps/web/` product file changes, formal B activation, commit to `main`, or Pages publish occurs until the applicable Gate A/Gate B decisions.

## Goal

Replace manual copying of thousands of lines between experimental passport C (`/apps/web/c/`) and formal passport B (`/apps/web/`) with one shared implementation for behavior that is genuinely identical, plus explicit surface adapters for policy and capabilities.

Keep C useful as an isolated discussion surface and B safe as the formal product. The new workflow is: implement a shared block once where ownership is truly shared, activate and preview it through C, obtain Victor's approval, then activate the already-reviewed block in B through a small adapter/config/cache-version change. Activation is not automatic publication.

This extends the adopted layered-building-block architecture; it does not replace it with a new `passport-app.js` monolith. `pets[]` remains the write truth, and no `modules/*` dual-write is introduced.

## Current problem and baseline

The 2026-09-03 building-block audit records the largest remaining maintenance debt:

- `c/app.js`: about 6,526 lines; `app.js`: about 7,182 lines.
- `c/styles.css`: about 8,359 lines; `styles.css`: about 8,581 lines.
- `c/i18n.js`: about 3,341 lines; `i18n.js`: about 3,654 lines.
- `c/index.html`: about 2,138 lines; `index.html`: about 2,346 lines.
- Each HTML surface carries roughly 80 script tags and about 29 duplicated passport screens.

These are baseline audit values, not permanent success thresholds. Before every migration phase, QA must recalculate physical lines, duplicate regions/assets, and surface-only regions from that phase's candidate baseline. The aim is removal of risky duplication and drift, not an arbitrary minimum line count.

The layered architecture is already substantially correct: domain logic lives under `domains/`, shared state/storage under `core/`, chrome under `shell/`, and module bridges under `runtime/`. The migration must reuse and tighten those boundaries rather than folding them back into one shared facade.

## Non-negotiable surface contract

### C — experiment/discussion

- Existing URL stays `/apps/web/c/`.
- Storage remains exclusively under `petlive-c-*` keys.
- No Supabase, Google Identity, or Google Drive auth scripts.
- No Drive token storage, cloud reconcile, or cloud upload.
- No legal-consent gate unless a later proposal explicitly adds one.
- May load shared presentation/composition blocks only when its adapter supplies C-safe capabilities.

### B — formal passport, with A intro

- Existing URL stays `/apps/web/`.
- Storage remains under formal `petlive-*` keys.
- Intro A, Supabase/Google authentication, optional Drive backup, legal consent, cloud reconcile, and demo read-only protection remain B-only.
- Sign-out continues to clear the Supabase session and session-scoped Drive token without deleting local pets.
- Formal activation and Pages publish happen only after candidate review, Gate B adoption, and the existing publish process.

### Shared invariants

- `pets[]` remains local write truth (L1); no normalized second store and no `modules/*` dual-write.
- Shared shell/composition code receives capabilities and callbacks; it does not invent storage keys, read auth tokens, authorize cloud operations, or bypass domain write doors.
- The zero-build browser runtime remains: static classic/module scripts, CSS, and committed HTML served directly by `python3 -m http.server`.
- No bundler, framework, generated-at-request runtime, or npm production dependency.

## Strategy assessment

### A — runtime shared files with thin B/C entry adapters

Best fit for JavaScript behavior, shell chrome, shared CSS, and translation catalogs. It removes duplicate runtime logic and lets both URLs load the same reviewed asset. It also fits the current IIFE `PetLiveWeb.*` zero-build architecture.

Risk: a shared file changes both surfaces if B already loads it. Therefore migration must separate **landing a shared implementation** from **surface activation**, preserve old behavior as rollback, and use block-specific dependency injection for later JS. A broad shared file with boolean flags would recreate the monolith and make C capable of accidentally reaching B-only paths.

Decision: use this strategy for bounded runtime blocks, never as one all-owning `passport-app.js`.

### B — generated committed artifacts from shared source

Best fit for large static HTML because browsers cannot include local HTML partials safely without another runtime mechanism. A deterministic repository script can produce complete committed `index.html` files while direct serving remains build-free.

Risk: generated output can be stale or manually edited. The generator must be deterministic, support `--check`, mark generated regions, preserve explicit B/C slots, and have QA reject drift. Generation is a contributor step, not a runtime/build/deploy requirement.

Decision: use in a later HTML phase, after runtime seams stabilize.

### C — dynamically fetched HTML fragments

Avoids committed duplicate markup but adds asynchronous boot ordering, failure/404 states, CSP/hosting considerations, focus/history timing risk, and harder direct-file/slow-network diagnosis. It also increases DOM injection risk if fragment rendering is not tightly constrained.

Decision: reject for passport screen construction. It is less reliable than committed deterministic output and adds runtime availability/security surface without product value.

### D — continue copies with automated diff tooling

Lowest initial migration risk and useful as a temporary drift detector. It does not remove merge conflicts, repeated fixes, cache-tag drift, or the possibility that a formal cover drops B-only policy.

Decision: retain diff/source-scan tooling as a migration guard and rollback aid, not as the target architecture.

## Chosen architecture: staged hybrid

Use **A for bounded runtime JS/CSS/i18n**, **B for static HTML**, and **D as enforcement throughout migration**. Do not use C.

The architecture distinguishes three concepts:

1. **Implementation ownership:** shared logic belongs in the existing `domains/`, `core/`, `shell/`, or `runtime/` block.
2. **Surface capability:** tiny B/C adapters supply keys, feature availability, and B-only hooks.
3. **Activation:** C and B independently choose which shared block/version to load. C activation precedes B activation; B activation is a reviewed Gate B action.

## Target layer and concrete paths

These paths are the required classification before future coding. A Builder must stop and return to Gate A if implementation needs a materially different owner.

### Shared JavaScript composition

There will be **no central `passport-app.js` or `passport-composition.js` owner**. The two thin surface adapters remain the composition roots and call several bounded shared blocks:

- **Shell:** existing/new `apps/web/shell/<feature>.js` owns each later shared chrome/listener cluster.
- **Domain:** existing/new `apps/web/domains/<name>/` owns pet-record selectors/controllers/renderers.
- **Runtime:** existing `apps/web/runtime/` remains limited to `PetLive.*` bridges and result unwrapping; it does not become a second app bootstrap.

Future shared JS uses block-specific dependency injection (`onGo`, storage slot factory, auth/cloud lifecycle hook) and deny-by-absence for B-only dependencies. A generic surface profile or validator is **not** a prerequisite and may be proposed only after repeated concrete needs prove it reduces, rather than adds, complexity. The earlier glass-dock-wrapper pilot is deferred as an optional later JS slice; it is not part of Phase 1.

### Surface adapters

- `apps/web/c/app.js` — C entry adapter and compatibility facade.
- `apps/web/app.js` — B entry adapter and compatibility facade.
- Phase 1 does not edit either `app.js`.
- Later JS slices keep B-only auth/Drive/reconcile/consent/demo protection in B and pass only the narrow callbacks required by each shared block. Client configuration is organization, not authorization.

### Shared CSS

- **Shell account chrome:** add `apps/web/shell/account-chrome.css` as the canonical owner of confirmed-identical `.account-chip*` and `.screen-head-actions .account-chip*` rules. Its markup is already owned by `apps/web/shell/account-chrome.js`.
- **Shell parasite strip:** extend `apps/web/shell/parasite-strip.css` from its current small lights overlay to canonical ownership of confirmed-identical `.parasite-strip`, `.parasite-row`, layout, and status-tone rules.
- **Later only:** `apps/web/shell/passport-tokens.css` may own genuinely identical tokens; other shared layout must remain in narrowly named component files rather than a catch-all stylesheet.
- `apps/web/c/styles.css` — C-only experiment overrides and temporary unmigrated styles.
- `apps/web/styles.css` — B/A-only intro, auth, consent, and formal overrides plus temporary unmigrated styles.

Phase 1 activates canonical CSS on C and removes only C's duplicate selector blocks. B deliberately retains its surface duplicates. If B already loads `shell/parasite-strip.css`, the new canonical rules must remain lower in B's cascade and B's later surface rules must compute identically; `account-chrome.css` is not linked by B until Phase 2.

### Shared i18n

- `apps/web/i18n/catalog.js` — shared passport messages only.
- `apps/web/i18n/c-overlay.js` — C-only discussion/experiment copy.
- `apps/web/i18n/b-overlay.js` — A/B auth, Drive, legal consent, reconcile, demo, and formal-only copy.
- `apps/web/shell/i18n-runtime.js` or the existing `shell/i18n-paint.js` — compose catalog + one surface overlay and apply static/dynamic chrome.
- During migration, `apps/web/c/i18n.js` and `apps/web/i18n.js` remain compatibility entry adapters until all callers use the shared catalog.

Overlay merge must fail closed on duplicate keys with different ownership in QA. Legal and medical strings are not silently deduplicated by text; ownership and reviewer routing determine whether they can move.

### Static HTML

- `apps/web/passport-html/shared/` — canonical shared passport screen partials, organized by bounded screen/component rather than one huge fragment.
- `apps/web/passport-html/c.surface.json` — C slots and script/style capability manifest.
- `apps/web/passport-html/b.surface.json` — A/B intro, auth, legal, demo, and formal-only slots.
- `tools/generate-web-surfaces.mjs` — deterministic standard-library-only generator with `--check`.
- Generated committed outputs remain:
  - `apps/web/c/index.html`
  - `apps/web/index.html`

The generator must preserve existing URLs and relative asset resolution. B's output includes A intro and formal-only scripts; C's output cannot contain Supabase/GIS/Drive/legal-consent tags. Generated regions carry a warning and source identifier. Direct hand-editing of generated regions fails QA.

### Script/link tags and cache versions

- Shared scripts and styles load before the surface `app.js`, matching Tier 2.
- Phase 1 adds `<link rel="stylesheet" href="../shell/account-chrome.css?v=20260903-cb-p1">` to `apps/web/c/index.html`.
- Phase 1 aligns C's existing `../shell/parasite-strip.css` and `../c/styles.css` cache tokens for the pilot. B receives no new account-chrome link and no B index/style token change.
- C relative tags use `../shell/...`, `../domains/...`, and `../i18n/...`; B uses `./shell/...`, etc.
- Surface-only auth/config scripts appear only in B's manifest/output and before the B adapter where currently required.
- Once Phase 2 activates the same shared files on B, C and B use the same shared-asset token; surface stylesheet tokens may remain surface-specific.
- Long term, `tools/web-surface-assets.mjs` (or the HTML generator's asset-manifest module) owns tag ordering and version tokens; `node tools/generate-web-surfaces.mjs --check` rejects mismatched tags, duplicate loads, missing shared dependencies, and C loading a forbidden B-only asset.
- No service worker/cache layer is added.

### QA/source-scan enforcement

- `qa/tests/web-shared-css-ownership.test.js`
  - Canonical account-chip selectors exist in `shell/account-chrome.css`.
  - Canonical parasite-strip/row layout and status-tone selectors exist in `shell/parasite-strip.css`.
  - Migrated selectors do not reappear in `c/styles.css`.
  - Phase 1 explicitly allows the known B duplicates in `styles.css`; the temporary allowlist is labeled for removal in Phase 2 and rejects unrelated new duplicates.
- `qa/tests/web-surface-assets.test.js`
  - C loads both canonical shell styles before `c/styles.css`.
  - B does not load `account-chrome.css` in Phase 1.
  - Existing B parasite-strip load order keeps `styles.css` later in the cascade.
  - No auth/script/storage assertions are added for this CSS-only pilot.
- Later HTML phase: `qa/tests/web-surface-html-generation.test.js`
  - Generator `--check`, deterministic output, URL/path validity, required/forbidden B/C slots.
- Existing `qa/tests/web-*.test.js` remain mandatory.

## Phased migration

Each phase is independently proposed, built, reviewed, adopted, and rollbackable. Confirmation of Phase 1 does not approve Phases 2–6.

### Phase 1 — shared CSS ownership pilot on C (recommended Gate A build)

Purpose: remove a meaningful, audit-confirmed slice of duplicated C/B CSS while preserving the formal B cascade exactly.

Approved target paths and changes:

- Add **Shell CSS** `apps/web/shell/account-chrome.css` containing only the confirmed-identical `.account-chip*` and `.screen-head-actions .account-chip*` blocks currently duplicated in both surface stylesheets.
- Extend **Shell CSS** `apps/web/shell/parasite-strip.css` with the confirmed-identical `.parasite-strip`, `.parasite-row`, layout, responsive, and status-tone blocks currently duplicated in both surface stylesheets; preserve its existing lights overlay.
- Update `apps/web/c/index.html` to load `../shell/account-chrome.css?v=20260903-cb-p1`, retain/load `../shell/parasite-strip.css?v=20260903-cb-p1`, and load both before `c/styles.css`.
- Remove only those migrated selector blocks from `apps/web/c/styles.css`; preserve intentional C overrides not proven identical.
- Do **not** remove matching blocks from `apps/web/styles.css`.
- Do **not** add `account-chrome.css` to `apps/web/index.html` in Phase 1.
- If B already loads `shell/parasite-strip.css`, its unchanged later `styles.css` duplicate remains authoritative in the cascade. QA must verify pre/post B computed styles are identical.
- Add `qa/tests/web-shared-css-ownership.test.js` and update/add `qa/tests/web-surface-assets.test.js`. A small fixture such as `qa/fixtures/web-shared-css-allowlist.json` may declare only the temporary B duplicates due for Phase 2.

Phase 1 must not edit `apps/web/app.js`, `apps/web/c/app.js`, storage/auth/cloud code, i18n, legal copy/consent, screen markup, domain logic, or medical presentation behavior. If selector extraction requires any such change or reveals non-identical declarations, Builder stops and returns to Gate A rather than normalizing behavior.

Phase 1 acceptance:

- C account chip, screen-head account actions, parasite strip/rows, responsive layout, lights, and every status tone are visually identical before/after at representative desktop and phone widths; reviewer screenshots are attached for comparison.
- C `index.html` alone activates `shell/account-chrome.css`; B does not link it.
- C loads canonical shell CSS before `c/styles.css`, preserving C override capability.
- Migrated account/parasite selectors are absent from `c/styles.css` and present in their canonical shell files.
- The source scan reports a reduced normalized duplicate-selector/declaration count equal to the migrated C blocks; it does not count temporary B duplicates as resolved.
- The declared allowlist contains only B's matching account/parasite blocks and is marked for deletion in Phase 2.
- B product files are unchanged. If B already loads the extended parasite stylesheet, browser computed-style snapshots for all affected B selectors match baseline because unchanged B surface rules remain later in cascade.
- Existing B and C account/parasite interactions and responsive overflow/tap behavior remain unchanged.
- Direct zero-build serving works at `/apps/web/c/` and `/apps/web/` through `python3 -m http.server`; no generation/install step is required.
- `node --test qa/tests/*.test.js` passes.

Phase 1 rollback:

- Restore the removed C selector blocks and prior C link/cache tags.
- Revert the additions to `shell/parasite-strip.css` and remove `shell/account-chrome.css` plus pilot tests/allowlist.
- B files and all storage/data remain untouched, so no Pages or user-data rollback is needed.

### Phase 2 — formal B activation of canonical CSS (separate confirmation)

- Load `./shell/account-chrome.css` in `apps/web/index.html`.
- Remove only the matching account/parasite duplicate blocks from `apps/web/styles.css`.
- Align shared account/parasite cache tokens between C and B.
- Delete the temporary B duplicate allowlist entries.
- Preserve formal-only A/B styles and intentional B overrides.

Acceptance/rollback:

- QA + UI compare B desktop/phone screenshots and computed styles before/after; C remains unchanged.
- Shared ownership tests show neither surface stylesheet reintroduces migrated selectors.
- Restore B duplicate blocks and remove its account-chrome link to roll back; no data migration.
- After reviews and Gate B adoption only, Version Steward integrates and the formal Pages publish process runs.

### Phase 3 — bounded shared JavaScript blocks (optional, separate confirmation)

- Inventory one concrete duplicated behavior cluster at a time and assign it to `shell/<feature>.js`, `domains/<name>/`, `core/`, or `runtime/` before coding.
- Use block-specific dependency injection and preserve B-only auth/Drive/reconcile/consent/demo protections.
- The thin glass-dock wrapper idea may be considered here only if measured alongside higher-value JS duplication; it is not a prerequisite.
- Introduce no generic surface profile/validator unless repeated concrete injections demonstrate a clear need in a new proposal.

Acceptance/rollback:

- Each slice removes one authoritative duplicate behavior cluster with behavior tests and a direct script-tag rollback.
- `pets[]` remains write truth and C cannot receive B-only adapters/tokens.

### Phase 4 — shared i18n catalog + surface overlays (separate confirmation)

- Move non-legal/non-medical common strings to `apps/web/i18n/catalog.js`.
- Keep C-only copy in `i18n/c-overlay.js` and A/B auth, Drive, consent, reconcile, demo, and formal copy in `i18n/b-overlay.js`.
- Migrate by bounded key group; legal and medical text requires its routed reviewer.

Acceptance/rollback:

- Missing/duplicate translation-key tests pass across zh-Hant/en/ja/ko.
- Reinsert one key group into compatibility catalogs and remove its shared load to roll back.

### Phase 5 — deterministic generated HTML (separate high-risk confirmation)

- Introduce canonical shared passport partials and B/C surface manifests.
- Generate committed complete outputs; direct serving remains unchanged.
- Migrate a small, non-auth, non-legal screen group first. A intro and B policy slots remain explicit.

Acceptance/rollback:

- `--check` is deterministic and clean; all URLs/navigation/DOM hooks and roughly 29 screens remain.
- C generated output contains no forbidden B asset or consent/auth slot.
- Restore the two committed hand-maintained outputs and remove generator sources for the migrated slice; no runtime dependency exists.

### Phase 6 — retire compatibility copies (separate confirmation)

- Only after migrated slices are stable, reduce `app.js`, `styles.css`, and `i18n.js` to thin adapters/overrides and generated outputs.
- Remove temporary drift allowlist entries as each shared owner becomes authoritative.
- Do not set a universal line limit; targets are:
  - surface adapters contain only composition, DOM event hooks that are genuinely surface-specific, and B/C policy adapters;
  - migrated logic/style/catalog/markup has exactly one authoritative source;
  - drift checks reject reintroduction of migrated duplicate regions.

## Migration metrics

Every phase reports before/after using the same candidate baseline:

- Physical lines and normalized duplicate lines for the four surface pairs.
- Number of identical and divergent script/style assets and cache tokens.
- Number of declared B-only and C-only regions.
- Surface adapter lines grouped by responsibility: composition, event binding, policy adapter, compatibility wrapper.
- Count of shared blocks loaded by C only, B only, and both.
- Drift-test violations and allowlist size; the allowlist must trend down as ownership migrates.
- HTML generator output diff size and deterministic `--check` result once Phase 4 begins.

Phase 1 target is evidence, not a vanity number: establish one canonical owner for the confirmed account/parasite CSS, remove the corresponding C copies, leave B's temporary copies measured and allowlisted, and prevent migrated selectors from returning to C. Report duplicate selector and normalized declaration counts before/after; do not claim the B duplicates are removed until Phase 2.

## Threat model and Tier 1 protections

Assets: local pet health graph, owner PII, Supabase session, session-scoped Drive access token, backup integrity, legal-consent state, and demo read-only integrity.

Roles: anonymous A visitor, signed-in B user, B demo visitor, C experiment visitor, and device owner.

Trust boundary: browser code, DOM, storage, URL parameters, stylesheets, and future injected dependencies are untrusted client material. CSS ownership does not alter authorization. Future cloud authorization remains server/RLS enforced.

Attack surface across the full architecture: shared-asset cascade/version skew, future dependency confusion, storage namespace collision, C enabling cloud upload, demo writes reaching shared domain APIs, generated HTML inserting forbidden scripts, and user/pet content crossing new `innerHTML` paths. Phase 1 adds only CSS cascade/cache risk.

Required protections:

- **C1 — no cross-user/cross-surface leak:** never share C/B storage keys or slot instances. Future shared code receives only block-specific adapters and cannot enumerate another surface's keys. No auth/session/Drive token is placed in shared state, config objects, logs, fixtures, CSS, or generated HTML.
- **L1 — local-first write truth:** `pets[]` remains the only prototype write graph. Shared composition delegates through existing domain/core write doors; no `modules/*` mirror or cloud-first store.
- **I1 — demo cannot write:** B's `demoBlocksWrite` remains at every write-door boundary and is supplied only by B. Shared composition cannot replace it with a UI-only button check or expose a direct dev write hook.
- **L2 sign-out unchanged:** B auth adapter continues clearing Supabase session and `petlive-google-token` in `sessionStorage` while retaining local pets. C has no sign-out/token adapter.
- **A2/local integrity:** cloud reconcile and upload remain B-only and cannot mutate local `pets[]` on failure. Future C shared blocks receive no cloud adapter, not merely hidden UI.
- **C3 secrets:** no service role, Google Client Secret, raw Drive token, or token-bearing object in shared catalog, dependency config, source-scan output, or CSS.

Phase 1 deliberately excludes auth/storage/cloud/legal code, so security diff scan is skipped unless scope changes. Any later diff touching those paths requires reading current `security.md`, a security diff scan before Gate B, invariant-mapped findings, and attack-path replay for High issues.

## C-first and gate mechanics

1. Gate A now can approve **Phase 1 only**.
2. Builder works on a proposal branch/worktree; no overwrite of mainline.
3. C is the only activated product surface in Phase 1. Report `已改：C only`.
4. QA/review/Arbiter may iterate up to three times; then stop at candidate-ready.
5. Victor previews C and decides Gate B adoption for Phase 1.
6. Phase 1 adoption lands canonical CSS plus C activation only; it does not remove B duplicates or load account chrome on B.
7. A separate Gate A confirms Phase 2 B activation. After its reviews and Gate B adoption, the formal publish rule may commit/push A/B.
8. Shared-file edits after both surfaces activate still preview through C first. B remains on its adopted activation/config until Victor approves the corresponding B activation; where one physical shared URL would otherwise change B immediately, use additive versioned files or keep the old exported API/version until Gate B.

That final rule is mandatory: once B consumes a shared runtime asset, a C experiment cannot mutate B merely by editing the same bytes. Shared changes must be backward-compatible/additive or staged under a new versioned path/export until formal activation.

## In scope for this proposal

- Architectural decision and phased migration contract.
- Phase 1 shared account/parasite CSS ownership on C plus visual/drift tests, only after Gate A confirmation.
- Metrics, rollback, review routing, Tier 1 boundaries, and future activation mechanics.

## Out of scope

- Building any phase in this Planner step.
- Big-bang merge of either `app.js`, CSS, i18n, or HTML.
- Any Phase 2–6 implementation without a new confirmation.
- `app.js`, auth, Drive, reconcile, consent, storage-key/schema, demo-write, i18n, copy, HTML-screen markup, or medical behavior change in Phase 1.
- Bundler, framework, TypeScript migration, npm runtime/build requirement, service worker, or changed public URLs.
- `modules/*` as application storage, dual-write, Supabase pet sync, or RLS changes.
- Silent C-to-B cover, formal B activation, commit, push, or Pages publish before Gate B.

## Review routing

- Phase 1 CSS pilot: **QA + UI required** for ownership scans, computed-style parity, screenshots, responsive/tap/overflow smoke, and direct serving. **Pharmacist skipped; legal skipped; security diff scan skipped** unless scope changes.
- Phase 2 B CSS activation: **QA + UI required**; pharmacist/legal/security skipped if it remains CSS-only. Gate B adoption is required before formal publish.
- Phase 3 shared JS: QA required; UI/security/legal/pharmacist route according to the exact block and behavior touched.
- Phase 4 i18n: QA + UI required; legal/auth/consent slices require legal + security diff scan. Any medication, dose, duration, emergency, disclaimer, or other medical presentation change requires pharmacist.
- Phase 5 HTML: **QA + UI required**. Legal + security diff scan required for A/auth/consent/script-slot generation. Pharmacist only if medical presentation/DOM semantics are touched.
- Phase 6 retirement: QA required; route UI/legal/security/pharmacist based on migrated content, not the label “cleanup.”

## Risks

- Shared-file blast radius after B activation. Mitigation: additive/versioned API activation and independent C/B config; never edit bytes already live on B for an unapproved C experiment.
- Future generic configuration could recreate a monolith. Mitigation: block-specific dependency injection first; require new evidence and Gate A before any profile validator.
- Namespace collision leaks or overwrites data. Mitigation: namespace-bound slot factories, forbidden-key source scans, and two-surface storage tests.
- Generated HTML hides unsafe changes in large diffs. Mitigation: migrate small screen groups, deterministic generation, source review plus generated diff, forbidden-tag tests.
- CSS cascade changes visuals despite identical declarations. Mitigation: coherent component slices, fixed load order, UI screenshots/phone smoke, easy link rollback.
- i18n deduplication changes legal/medical meaning. Mitigation: explicit overlays and reviewer ownership; do not merge strings merely because they currently match.
- Cache skew loads incompatible facade/shared versions. Mitigation: one phase token, generated tag order/checks, backward-compatible exports during activation.
- Refactor accidentally bypasses B demo write protection or changes sign-out. Mitigation: I1/L2 contract tests and security diff scan.
- Line-count pressure causes poor boundaries. Mitigation: measure responsibility and duplicate ownership; no arbitrary “few hundred lines” success criterion.

## Acceptance criteria for this Gate A document

- [x] Strategies A–D are independently evaluated and a staged hybrid is selected.
- [x] Tier 2 owners and concrete JS/CSS/i18n/HTML/facade/tag/test paths are named.
- [x] C/B capability, storage, auth, legal, sync, demo, and publish differences are explicit.
- [x] Zero-build serving, unchanged URLs, `pets[]` truth, and no dual-write are protected.
- [x] Migration is phased with acceptance and rollback; only Phase 1 is recommended now.
- [x] Metrics target duplicate ownership/drift rather than arbitrary line counts.
- [x] C1, L1, I1, L2, and C-cloud-denial protections are explicit.
- [x] Review routing includes QA/UI, legal/security, and pharmacist triggers.
- [ ] Victor confirms, modifies, or rejects Phase 1.
- [ ] No product file is edited before confirmation.

## Notes for Victor

建議先做 **Phase 1：把帳號 chip 與預防列的共用 CSS 收回 shell**。新增 `shell/account-chrome.css`、擴充 `shell/parasite-strip.css`，只讓 C 載入／刪除 C 的重複規則；B 暫時保留原規則，因此正式版有效 cascade 不變。

後續若 C 截圖與手機版確認一致，再另行確認 Phase 2：B 載入 account CSS、移除 B 重複規則、對齊 cache token，通過 Gate B 才發布。JS、i18n、HTML 仍各自分階段；HTML 採 committed deterministic generator，不採 runtime fetch。

請確認此提案：

- 回覆「確認 Phase 1」：只開始 Phase 1 平行製作。
- 回覆「修改：…」：調整架構、Phase 1 範圍或驗收條件。
- 回覆「否決」：不進行此案。

「確認」不代表批准 Phase 2–6，也不代表覆蓋 B、採用候選、commit/push 或發布 Pages。
