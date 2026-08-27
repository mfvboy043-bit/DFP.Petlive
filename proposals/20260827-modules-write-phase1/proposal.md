---
id: 20260827-modules-write-phase1
title: "Wave 4 Phase 1 — pets[] write-path inventory + single-door enforcement (no modules flip)"
status: adopted
author: planner
candidate_branch: "cursor/modules-write-phase1-6f84"
candidate_path: "proposals/20260827-modules-write-phase1"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Wave 4 Phase 1 — write-path inventory + single-door enforcement

Companion: `state.yaml` (v2 source of truth for gates / iteration).

**Gate A signal:** Victor 2026-08-27 —「第4波，請總指揮開始指揮」→ Orchestrator Wave 4 = architecture leftover **`modules/*` as UI write truth**. Full cutover is multi-phase and high data-loss risk. **This proposal is Phase 1 only**, with independent rollback. Gate A starts `pending`; parent may flip approved after write.

**Builds on (do not redo):**
Wave 1 `20260827-small-brains`, Wave 2 wire thin-forms / bundles, Wave 3 `20260827-css-consolidate`, leftover `20260827-leftover-cleanup-17` (introduced `core/pets-graph.js` write door; still `pets[]` backed; **no** modules dual-write).

## Slice chosen (ONE primary) + why

| Option | Audit | Risk | Verdict |
|---|---|---|---|
| **1. Write-path inventory + single-door enforcement (THIS Wave)** | Door exists (`createPetsGraph`: hydrate / `pushPet` / `schedulePersist`). C add-pet already `petsGraph.pushPet`. **Still off-door structural mutates:** `domains/pets/lifecycle.js` splice/unshift; `domains/cloud/controller.js` `pets.length=0` + raw `pets.push`; B facade seed-reset raw `pets.push`. No test fails if facade re-adds raw `pets.push`. | Low — still one write truth (`pets[]`); no second ledger | **Pick** |
| 2. Read adapter pilot (modules mirror sync FROM pets[]) | Emergency / drug already modular read; optional debug sync does not harden writes | Medium — invites “two truths” curiosity without closing write holes | Defer |
| 3. Dual-write or flip `modules/*` Maps as sole store | `modules/pet` etc. already hold in-memory `Map`s for ModuleResult APIs; UI graph is still prototype `pets[]` + slot | **High** — data loss / diverge / rollback hard | **Avoid in Phase 1** |

**After Phase 1:** `pets[]` (+ `archivedPets` + pets-graph slot) **remains write truth**. `modules/*` stay ModuleResult building blocks / compose helpers — **not** the app DB yet.

## Goal

Lock every **structural** mutate of the active/archived pets graph behind one documented door (`core/pets-graph.js` + allowed domain controllers), with an inventory and regression tests — so Wave 4 later phases can migrate storage without hunting stray `pets.push` in the facade. Behavior-preserving. No modules dual-write. No write-truth flip.

## Audit (read-only, light)

| Path | Who mutates `pets[]` / `archivedPets` today | Through door? |
|---|---|---|
| Add pet | C `petsGraph.pushPet` (`c/app.js`) | Yes |
| Hydrate / persist | `petsGraph.hydrate` / `schedulePersist` → slot | Yes |
| Archive / remove | `domains/pets/lifecycle.js` `splice` / `unshift` then facade `schedulePetsGraphPersist` | Structural mutate **inside domain** (allowed pattern from leftover-17); not via door helpers yet |
| Cloud apply / clear seed | `domains/cloud/controller.js` raw `length=0` + `push` + `petsGraphSlot.write` | **Off-door** array rewrite |
| B seed reset / demo paths | `apps/web/app.js` via `replaceGraph` / `clearGraph` | **Yes (Gate B)** |
| Nested content (visits, meds, vaccines, …) | Domain controllers mutate fields on pet objects already in `pets[]`, then `schedulePetsGraphPersist` | Content mutate + persist (inventory must list; Phase 1 does **not** move these into modules Maps) |
| `modules/pet` etc. | Own `Map` stores for ModuleResult APIs | Parallel toy/runtime store — **not** UI write truth |

## In scope (C first until Gate B)

### A — Write-path inventory (proposal artifact + code comments)

- Document **every** structural mutate of `pets[]` / `archivedPets` on C (facade, `core/pets-graph.js`, `domains/pets/lifecycle.js`, `domains/cloud/controller.js`).
- Classify: **structural** (push/splice/replace arrays) vs **content** (mutate nested visits/meds/… then persist).
- State explicitly in inventory: pets[] remains sole UI write truth; modules Maps are not synced.

### B — Single-door enforcement (extend door; route C mutators)

- Keep / extend `apps/web/core/pets-graph.js` as the **only** place that may do raw `pets.push` / array replace for the graph (plus lifecycle domain for archive/remove **or** thin door wrappers that call lifecycle then persist — Builder picks the smaller diff).
- Route cloud apply / clear-seed structural rewrites through door APIs (e.g. `replaceGraph({ pets, archivedPets })` or equivalent) instead of raw `pets.push` in cloud controller.
- C facade: **no** raw `pets.push` / `pets.splice` / `pets.length = 0` outside the door (add-pet already uses `pushPet`).
- Nested content mutates stay with existing domain controllers; they must continue to call `schedulePetsGraphPersist` (or door persist) after writes — no behavior change to med/visit/vaccine semantics.

### C — Regression tests (fail if facade sneaks raw structural mutates)

- Extend `qa/tests/web-pets-graph.test.js` (and/or a thin source-scan test):
  - Door APIs still hydrate / push / persist.
  - **Fail** if `apps/web/c/app.js` contains raw structural `pets.push` / `pets.splice` / `pets.length = 0` (allowlist only door / comments if needed).
  - Optionally assert cloud controller no longer contains raw `pets.push` after B-scope routing (C path).
- `node --check` on touched JS; bump `?v=` on changed scripts in `c/index.html` only.

### D — Gate B (later, after adopt of C)

- Cover same door + inventory discipline onto formal B (`apps/web/app.js` seed-reset paths). **Not** this Gate A build.

## Out of scope

- Making `modules/*` Maps the **sole** store / UI write truth
- Dual-write `pets[]` + modules (any sync TO modules as second ledger)
- Flipping emergency/drug/read paths to treat modules Maps as DB
- CSS / bundler (Wave 3 done / bundler still deferred)
- Wave 1/2 JS wire redo
- Formal B / Pages until Gate B (C first)
- Medical copy, dose / frequency / duration semantics
- Storage backend contract change beyond routing writes through the door
- Full pet-field schema migration onto `contracts/`

## Phase 2+ (later proposals — not this Wave)

Independent proposals with their own Gate A / rollback:

1. **Phase 2** — Optional debug / one-way mirror **FROM** `pets[]` → modules Maps (read-only check / emergency snapshot still pets-backed). Still pets[] write truth.
2. **Phase 3** — Tiny dual-write pilot for **one** entity (e.g. pet identity only) with perfect rollback + diverge detection.
3. **Phase 4+** — Cutover modules Maps (or a real store adapter) as write truth; migrate slot; remove prototype `pets[]` as DB.

Do **not** stack Phase 2+ into this candidate.

## Likely files

**Layer: core**

- EDIT `apps/web/core/pets-graph.js` — extend door (e.g. replace/clear helpers); keep pets[]-backed; no modules dual-write

**Layer: domains**

- EDIT `apps/web/domains/pets/lifecycle.js` — keep archive/remove; optionally call through door wrappers if that shrinks off-door surface
- EDIT `apps/web/domains/cloud/controller.js` — route apply/clear structural rewrites through door

**Layer: surface facade (C)**

- EDIT `apps/web/c/app.js` — wire door only; remove any leftover raw structural mutates if found
- EDIT `apps/web/c/index.html` — script `?v=` bump for touched core/domain scripts

**QA**

- EDIT `qa/tests/web-pets-graph.test.js` (+ optional facade source-scan test)

**Proposal**

- `proposals/20260827-modules-write-phase1/proposal.md`
- `proposals/20260827-modules-write-phase1/state.yaml`
- (later) inventory notes in `builder-notes.md` / `contrast.md`, `reviews/*`

**Deferred to Gate B**

- `apps/web/app.js` seed-reset raw pushes; B `index.html` `?v=`

**Not touched:** `modules/*` store internals as write target, CSS, bundler, Wave 1/2 domains already extracted

## Risks

| Risk | Mitigation |
|---|---|
| **Data loss** if someone “helps” by dual-writing or clearing the wrong array | Explicit non-goal; no modules write; rollback = reject adopt / revert door commits only |
| **Two truths** (pets[] vs modules Maps) if debug sync sneaks in | Phase 1 forbids mirror/dual-write; inventory states modules are not DB |
| Cloud apply regression (restore / clear seed) | Route through door with same payload shape; QA restore + empty-seed paths |
| Lifecycle archive/remove breaks currentPetId | Preserve existing return shape (`nextCurrentPetId`); facade wiring unchanged except door call sites |
| Over-scoping into nested visit/med “everything must go through door” | Inventory lists content mutates; enforcement targets **structural** array ops + facade raw push ban |
| Pharmacist / dose UX drift | No med field semantics change; pharmacist **skip** unless Builder touches med payloads (should not) |

## Acceptance criteria

- [x] Candidate on `cursor/modules-write-phase1-6f84` (or worktree); **mainline** product code untouched until Gate B adopt
- [x] Written inventory of C structural (+ listed content) write paths; states **pets[] remains write truth**
- [x] All C structural graph mutates go through `core/pets-graph.js` and/or documented domain controllers (lifecycle / cloud via door)
- [x] No dual-write to `modules/*`; no flip of modules Maps as app DB
- [x] Tests fail if C facade reintroduces raw `pets.push` / structural array clear outside the door
- [x] Behavior-preserving: add / edit / archive / remove pet, cloud apply/clear seed, nested visit/med save + persist still work
- [x] C `index.html` `?v=` bumped for changed scripts; zero-build preview unchanged
- [x] Reviews: QA on write paths + persist; UI **skip** or light (no visual redesign); pharmacist **skip** (no med copy/dose)
- [x] Gate B: cover B facade seed-reset discipline — Victor「採用、覆蓋」2026-08-27

## Rollback

1. Do not adopt (Gate B reject) — mainline unchanged.
2. If candidate merged then regretted: revert Phase 1 door/inventory/test commits only — no modules store migration to unwind.
3. Phase 2+ dual-write / cutover remain **separate** proposals — rolling back Phase 1 does not strand a second ledger.

## Builder handoff (after Gate A confirm)

Implement **only** A–C above on parallel path `cursor/modules-write-phase1-6f84`. Do not start modules dual-write, read-mirror, or B cover until instructed. Status → building → reviewing.

## Notes for Victor（白話／五歲聽得懂）

第 4 波目標以後是「換成新帳本」（`modules/*`），但一次換掉很容易把寵物資料弄丟。

**這一次 Phase 1 還沒換成新帳本**，只是先把寫入整理成**走同一扇門**：

- 舊帳本還是 `pets[]`（跟現在一樣）。
- 新帳本 `modules/*` 還只是小積木（算藥、緊急卡用），**還不是家裡真正存資料的抽屜**。
- 我們要做的是：誰可以改寵物名單，都必須經過 `pets-graph` 這扇門；並寫測試，免得有人又偷偷從窗戶把寵物塞進去。
- **不做**：兩邊同時寫、或一次改成只認 modules。

這樣以後要換帳本時，才知道所有寫入從哪裡來；這波也可以單獨退貨。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
