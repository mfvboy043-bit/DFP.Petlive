---
id: 20260813-web-layered-building-blocks
title: Web layered building-block decomposition
status: adopted
author: planner
candidate_branch: ""
candidate_path: "proposals/20260813-web-layered-building-blocks/preview"
created: 2026-08-13
updated: 2026-08-13
---

# Proposal: Web layered building-block decomposition

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Incrementally decompose `apps/web/app.js` into small zero-build building blocks with explicit responsibilities and dependency direction. The first build is a behavior-preserving extraction, not a big-bang rewrite: current screens, stored data, medical copy, i18n, phone/LAN preview, and module bridges must continue to work while compatibility facades remain in `app.js`.

The prototype `pets[]` graph remains the initial **write truth**. The first build must not dual-write `pets[]` and the in-memory stores under `modules/*`, and must not pretend the module stores are already the application database.

## Current architecture audit

- `apps/web/app.js` is about 5,800 lines. The cleanup count is roughly 238 functions; the current declaration matcher finds 243, plus 81 `addEventListener` registrations. Seed data, mutable state, persistence, navigation, controllers, formatting, rendering, image work, and bootstrap are interleaved.
- `index.html` is a 29-screen static shell. It loads the ESM `runtime/petlive.js`, classic `safe-ui.js`, `i18n.js`, database seeds, then classic `app.js`. The first extraction must preserve this no-bundler loading model.
- `runtime/petlive.js` exposes guarded `PetLive.{pet,drug,visit,alert,vaccine,medication,emergency}` module APIs. `PetLive.emergency.generateEmergencyCard` already accepts a `pets[]` snapshot to avoid dual writes.
- `runtime/safe-ui.js` and the `app.js` fallback provide section-level `safeRender` isolation.
- `modules/*` are independent `ModuleResult` building blocks backed by private in-memory `Map` stores. They are not yet the UI write truth.
- `packages/shared/result.js` defines the guarded module boundary; `packages/db-schema/*` describes target entities. Neither needs changing in this first build.
- Existing QA covers module contracts and fault isolation, but not web shell/state/storage boundaries.

### Cleanup findings and first-build disposition

| Finding | Disposition |
|---|---|
| Owner profile is unconditionally written at bootstrap by `seedDemoOwnerProfile()` | Fix in `ARCH-01`: demo data is a read fallback only; startup performs no owner-profile write and never overwrites saved user data. |
| Alert, suppression, pet-photo, and owner-profile helpers repeatedly read and parse storage | Fix in `ARCH-01`: one guarded JSON slot per key, cached after first read and invalidated/updated on writes. |
| Pet switch defers work but still rebuilds all hidden screens | Fix in `ARCH-03`: render home-visible sections plus the active screen; mark other screen groups dirty and flush them on entry. |
| `setLanguage()` calls `applyI18n()`, then `window.onLanguageChange` calls it again | Fix in `ARCH-03`: one static i18n pass per language change, followed by dynamic view refresh only. |
| Timeline eagerly constructs hidden drug-note detail HTML | Measure now and defer code change to the timeline/view extraction after `20260813-timeline-weight-delta`; do not create a competing timeline diff in this build. |
| Drug seed exists in both `apps/web/drugs-database.js` and `modules/drug/seed.js` | Later proposal. Preserve current drug search and enrichment fallback in this build. |

## Target layers and responsibilities

1. **Bootstrap/composition**
   - `index.html` controls zero-build script order.
   - `app.js` temporarily owns seed data and composes extracted factories.
   - Compatibility functions in `app.js` delegate to extracted public APIs until callers are migrated.

2. **Shell/navigation**
   - Active-screen state, history/back behavior, viewport reset, screen enter hooks, global overlays, and lifecycle coordination.
   - No pet/domain mutation and no direct `localStorage`.

3. **Shared state/selectors**
   - References the existing `pets[]` and `archivedPets[]`, owns selected-pet identity, and exposes read selectors.
   - Does not clone or mirror the pet graph and does not introduce reducers/store migration in phase 1.

4. **Persistence adapters**
   - Guarded JSON read/write/update/clear by known storage key.
   - Cache parsed values, contain quota/parse failures, and separate fallback-on-read from explicit persistence.
   - IndexedDB/native files remain a later adapter, not this build.

5. **Domain controllers**
   - **Pets:** selection first; add/archive/remove/photo orchestration in later slices.
   - **Timeline/visits:** visit creation, visit weight, proof attachments, timeline model.
   - **Meds/drugs:** draft/compound/proof flow, current-med selectors, guarded drug search.
   - **Alerts:** linked + owner composition, suppression, severity/source semantics.
   - **Vaccines:** current protection groups, reminders, form/upsert behavior.
   - **Parasite:** external/heartworm records, status, calendar handoff.
   - **Emergency:** snapshot composition and degradation through the existing `PetLive.emergency` bridge.
   - Controllers may request state mutation through the current `pets[]` facade during migration; they do not write DOM.

6. **Render/view helpers**
   - Convert selector/controller output to DOM and localized chrome.
   - Render only registered visible/dirty screen groups; no persistence or domain writes.
   - Timeline lazy drug-note hydration belongs here in a later timeline slice.

7. **Runtime module adapters**
   - Translate prototype `pets[]` snapshots to `PetLive.*` public contracts and unwrap `ModuleResult` safely.
   - Preserve `PetLive.emergency`, modular drug search, injected-failure behavior, and local fallbacks.

8. **i18n integration**
   - `i18n.js` remains the translation source and applies static `data-i18n*` chrome once.
   - A language-change adapter invalidates/re-renders dynamic chrome (species, breed, age, gender, source tags, vaccine names, med course) without changing user-authored text or clinic proper names.

## Dependency direction

```text
index/bootstrap
  -> shell/navigation + render coordinator
  -> domain controllers
  -> shared state/selectors + persistence adapters
  -> runtime module adapters
  -> modules/* public APIs -> packages/shared

views -> selectors + i18n adapter
controllers -X-> DOM
views       -X-> localStorage
domains     -X-> another domain's private state
modules/*   -X-> apps/web
```

Cross-domain reads use selectors or a public adapter. No new file may reach into a `modules/*` private `Map`.

## Gate A builder scope

Only these IDs are proposed for the first build:

### ARCH-01 — Guarded persistence slots

- Add `apps/web/core/storage.js`.
- Public API:
  - `PetLiveWeb.storage.createJsonSlot({ key, fallback, validate })`
  - slot methods `read()`, `write(value)`, `update(updater)`, `clear()`, `invalidate()`, `getStats()`
- Move the four current web storage concerns behind slots: owner alerts, suppressed alerts, pet photos, owner profile.
- Keep existing keys and JSON shapes unchanged.
- Remove unconditional owner-profile bootstrap persistence. `demoOwnerProfile()` remains a display fallback when no valid value exists.

### ARCH-02 — Shared state and selectors

- Add `apps/web/core/state.js`.
- Public API:
  - `PetLiveWeb.state.createAppState({ pets, archivedPets, initialPetId })`
  - `getPets()`, `getArchivedPets()`, `getCurrentPetId()`, `getCurrentPet()`, `hasPet(id)`, `setCurrentPetId(id)`, `getSnapshot()`
- The supplied arrays are retained by reference. Existing mutations still update `pets[]`; there is no second normalized store and no persistence migration.

### ARCH-03 — Shell navigation and screen-aware rendering

- Add `apps/web/shell/navigation.js` and `apps/web/shell/render-coordinator.js`.
- Navigation public API:
  - `PetLiveWeb.shell.createNavigation({ app, beforeLeave, onEnter })`
  - `go(screen, options)`, `back()`, `getActiveScreen()`, `clearHistory()`
- Render coordinator public API:
  - `PetLiveWeb.shell.createRenderCoordinator({ safeRender, getCurrentPet, getActiveScreen })`
  - `register(screen, sectionName, render, onError)`, `refreshSelection()`, `markDirty(screen)`, `flush(screen)`, `getMetrics()`
- Register `home`, `emergency`, `timeline`, `alerts`, `vaccines`, and `archive` groups. A pet switch renders home plus only the active non-home group; other groups become dirty and refresh on `go()` entry.
- Preserve generation cancellation and `requestAnimationFrame`/idle scheduling where it still improves first paint.
- Remove the duplicate `applyI18n()` call from the app language callback; dynamic chrome is invalidated and refreshed once.

### ARCH-04 — Pets selection controller and compatibility facades

- Add `apps/web/domains/pets/controller.js`.
- Public API:
  - `PetLiveWeb.domains.pets.createController({ state, beforeSelect, afterSelect })`
  - `select(id)`, `selectForced(id)`, `getCurrentPet()`
- Keep `getCurrentPet`, `selectPet`, `selectPetForced`, `go`, `goBack`, and `applySelectedPet` as thin `app.js` compatibility facades so existing listeners and form flows do not need a broad rewrite.
- Pet add/archive/remove/photo flows stay in `app.js` for this first slice.

### ARCH-05 — Boundary tests and performance evidence

- Add `qa/tests/web-building-blocks.test.js` using a fake Storage and minimal fake shell DOM.
- Verify storage error containment/cache behavior, no fallback write, selected-pet invariants, invalid selection behavior, navigation history, dirty-screen rendering, and `safeRender` sibling isolation.
- Record before/after measurements in the candidate review notes; do not add a production analytics SDK.

## Files

### Add

- `apps/web/core/storage.js`
- `apps/web/core/state.js`
- `apps/web/shell/navigation.js`
- `apps/web/shell/render-coordinator.js`
- `apps/web/domains/pets/controller.js`
- `qa/tests/web-building-blocks.test.js`

### Change

- `apps/web/app.js` — bootstrap composition, compatibility facades, storage callers, screen registration, single i18n refresh path.
- `apps/web/index.html` — load the extracted zero-build scripts before `app.js`; cache-bust changed scripts only.

### Read-only in this build

- `apps/web/i18n.js`
- `apps/web/styles.css`
- `apps/web/runtime/petlive.js`
- `apps/web/runtime/safe-ui.js`
- `apps/web/drugs-database.js`
- `modules/*`
- `packages/*`
- `contracts/*`

If implementation reveals that a read-only file must change, stop and return to Gate A with a scope modification; do not expand silently.

## Behavior and compatibility requirements

- Preserve the current UI, DOM hooks, CSS classes, form behavior, stored key/schema compatibility, and zh-Hant/en/ja/ko behavior.
- Preserve `PetLive.emergency` snapshot composition, degradation flags, fault injection, and local emergency fallback.
- Preserve modular drug search first, classic drug database fallback/enrichment, and current drug information disclaimer.
- Preserve `safeRender` so one failed section cannot blank sibling sections.
- Preserve direct repo-root serving and phone/LAN URL shape; no npm build, bundler, service worker, or rewritten asset path.
- Preserve user-authored names/notes and clinic proper names across language changes.
- `pets[]` remains write truth and is never bulk-copied into module stores.

## Non-goals

- No full rewrite of `app.js`; no requirement to remove every compatibility facade.
- No CSS cleanup or visual redesign.
- No complete migration to `modules/*` stores and no dual writes.
- No IndexedDB/native-file migration.
- No bundler, framework, TypeScript conversion, npm runtime dependency, or service worker.
- No drug seed deduplication.
- No timeline/visit/medication extraction in the first build.
- No contract/schema or medical-copy change.
- No listener-system rewrite merely to reduce the raw listener count.

## Later phases

1. **Timeline/view slice:** after the weight-delta candidate is settled, extract timeline view models and lazy-hydrate hidden drug notes; measure reduced HTML bytes and render time.
2. **Visits + meds/drugs controllers:** move form orchestration behind public APIs while preserving proof photos, compound medicines, dose units, frequency, duration, and disclaimer semantics.
3. **Alerts, vaccines, parasite, emergency controllers/adapters:** migrate one domain per proposal with dedicated QA/reviewer routing.
4. **Pet lifecycle and media:** add/archive/remove/photo crop after selection/state seams prove stable.
5. **Storage evolution:** evaluate IndexedDB/native storage behind the persistence interface.
6. **Drug seed deduplication:** choose one generated/source dataset in a separate proposal.
7. **CSS consolidation or bundler adoption:** separate proposals with independent rollback.

## Active proposal conflicts and sequence

1. `20260813-timeline-weight-delta` is `candidate_ready` with Gate B pending and changes `app.js`, `i18n.js`, `styles.css`, and `index.html`. Victor should adopt or reject it **before** the architecture candidate is branched/copied. Otherwise the extraction and timeline diff will be difficult to reconcile.
2. `20260812-ui-html-dock` is `candidate_ready` with Gate B pending and records direct-mainline CSS/index work. Close its Gate B decision before taking the architecture baseline so candidate metadata matches reality.
3. `20260812-ui-align-optimize` is still `proposed`, Gate A pending. It excludes `app.js` but overlaps `index.html` and may substantially change CSS. Recommended order: settle both candidate-ready proposals, build/adopt this architecture slice from that baseline, then re-confirm/rebase UI alignment. If UI alignment runs concurrently, reserve `styles.css` to that proposal and coordinate the single `index.html` cache/script hunk explicitly.

Do not copy an older proposal preview as the architecture baseline.

## Risks

- **Bootstrap ordering:** classic factories must exist before `app.js`, while `PetLive.emergency` and drug module readiness remain unchanged.
- **Hidden stale screen:** skipping off-screen render can expose old pet content when navigating unless every deferred group is marked dirty and flushed before display.
- **State divergence:** a copied pet array or parallel module write would create two truths. Factories must retain the original arrays by reference.
- **Storage regressions:** cached mutable objects can become stale or be mutated without a write. Slot update semantics and tests must make ownership explicit.
- **Owner data loss:** the existing unconditional demo write is destructive. Removal must preserve valid existing JSON and use demo values only as a non-persisted fallback.
- **i18n stale chrome:** static translation and dynamic rendering have different jobs; reducing duplicate passes must not leave species/breed/age/gender/vaccine/med labels stale.
- **Medical semantics:** refactoring must not alter dose, unit, frequency, duration, source tags, alert severity, degradation copy, or reference-only disclaimer.
- **Facade recursion/order:** compatibility wrappers can accidentally call themselves or initialize before factories. Composition must be explicit and smoke-tested.
- **Performance overengineering:** instrumentation must remain local counters/Performance API evidence, not a new analytics layer.

## Rollback plan

- Keep storage keys, JSON shapes, DOM hooks, and original behavior boundaries unchanged.
- Candidate work remains off mainline.
- Roll back as one surgical slice: remove the added script tags/files and restore the replaced `app.js` blocks from the candidate diff.
- Because no data migration, dual write, IndexedDB, or contract change occurs, rollback requires no user-data conversion.
- If screen-aware rendering causes stale-screen defects, first disable deferred groups through the compatibility `applySelectedPet` facade while retaining the independently tested storage/state extraction.

## Acceptance criteria

### Architecture

- [ ] Added files match the layer responsibilities and dependency direction above.
- [ ] `app.js` keeps compatibility facades and contains no second pet store.
- [ ] `pets[]` and `archivedPets[]` remain the only prototype mutation graph.
- [ ] No `apps/web` building block imports another domain's private state or a private module store.
- [ ] Existing `PetLive.emergency`, drug search, and `safeRender` paths remain operational.

### Persistence and state

- [ ] Initial load with no owner-profile key shows the demo profile but performs zero owner-profile writes.
- [ ] Initial load with a saved owner profile does not overwrite it.
- [ ] Invalid JSON/storage exceptions fall back safely without breaking startup.
- [ ] Each unchanged storage slot parses at most once between writes/invalidation.
- [ ] Pet selection rejects unknown IDs and always resolves a valid current pet when pets exist.

### Rendering and i18n

- [ ] Pet switch immediately updates picker/header/home prevention and alert badge.
- [ ] Pet switch does not invoke render functions for hidden emergency/timeline/alerts/vaccines/archive screens.
- [ ] Entering a dirty screen flushes the selected pet before it becomes observably stale.
- [ ] One section render failure does not prevent sibling sections from rendering.
- [ ] Each language selection invokes one static `applyI18n` pass and refreshes all dynamic chrome without changing user-authored content.

### Compatibility

- [ ] All 29 screens navigate/back correctly on desktop and phone.
- [ ] Pet switching, owner settings, alerts, vaccines, parasite, emergency card, visit/med flows, proof photos, archive/remove, and language switching retain current behavior.
- [ ] `node --test qa/tests/*.test.js` passes, including new boundary tests.
- [ ] Repo-root preview works at `http://127.0.0.1:5173/apps/web/` and LAN phone preview works without a build step.
- [ ] No changes to CSS, contracts, packages, modules, data schemas, or medical copy in this build.

## Performance measurement plan

Use the same seeded pet, language, viewport, and hard-reload conditions before/after:

1. Instrument render-coordinator counters for each registered section.
2. Instrument storage-slot `getStats()` for reads, parses, writes, cache hits, and failures.
3. Count `applyI18n()` calls for one language switch.
4. Record `performance.now()` around `selectPet()` to home-visible paint and around dirty-screen flush.
5. Record timeline render duration and generated `timelineList.innerHTML.length` as a baseline only; lazy drug-note improvement is phase 2.
6. Run 20 alternating pet switches after one warm-up and report median and p95; do not claim improvement from a single sample.

First-build pass thresholds:

- Hidden screen render count during a home pet switch: `0`.
- Owner-profile startup writes: `0`.
- JSON parses per unchanged slot after first read: `0` additional.
- Static i18n passes per language selection: `1`.
- Home-visible pet-switch median must not regress by more than 10%; p95 and raw samples must be reported.

## QA / review plan

- Automated: all existing module tests plus `web-building-blocks.test.js`.
- Desktop smoke: all navigation/back paths, every current form save, pet switching, language switching, emergency degradation query, clipboard fallback.
- Mobile/LAN smoke: Safari phone load, pet switch responsiveness, timeline entry after switch, photo crop, no missing scripts/404s.
- Storage matrix: empty keys, valid existing data, malformed JSON, `getItem` throw, quota/write throw.
- i18n matrix: zh-Hant → en → ja → ko, checking dynamic medical chrome and preserved user text.
- Fault isolation: inject alert/medication failure and confirm emergency degradation plus sibling screen availability.
- Reviewer routing after build: QA required; pharmacist required because med/dose/emergency code is moved even without intended semantic change; UI reviewer is a light compatibility pass because no visual changes are scoped.

## Gate

This proposal stops at Gate A. No Builder, candidate, or product-file edit may start until Victor confirms.

## Notes for Victor

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
