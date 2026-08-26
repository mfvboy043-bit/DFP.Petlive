---
id: 20260826-meds-drugs-controller
title: Meds / drugs controller building blocks
status: adopted
author: planner
candidate_branch: "proposal/meds-drugs-controller"
candidate_path: "proposals/20260826-meds-drugs-controller"
created: 2026-08-26
updated: 2026-08-26
---

# Proposal: Meds / drugs controller building blocks

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Extract the **記吃藥** orchestration building block — pending meds list, compound grouping/colors, draft validation/normalization, `buildVisitMedicationsFromPending`, and photo-bundle / manual save assembly — into `PetLiveWeb.domains.medications`, wired first on surface **C**. Heavy DOM HTML (`renderPendingMeds`, `renderTimelineMedItem`, drug-result / info-card markup, chip listeners) stays in `c/app.js` as thin facades, same pattern as the Timeline + Visits (TV) slice.

`pets[]` remains the only write truth. No dual-write into `modules/medication` or `modules/drug` Map stores. Formal **B** and Pages stay untouched until Victor separately confirms a C → B cover.

## Notes for Victor（白話）

這盒只做一件事：把「記吃藥」的規則與組裝邏輯從超大的 `c/app.js` 抽成獨立積木，讓之後改藥、改調劑、改暫存清單不必在整盒裡翻找。

- **這盒負責：** 暫存藥單、驗證劑量草稿、調劑分組／顏色、把暫存清單組進就診的 `medications[]`、照片藥包組裝。
- **仍留在大檔（facade／畫面）：** 待存清單 HTML、時間軸藥項 HTML、藥名搜尋結果／藥卡 DOM、chip 點擊、toast、畫面跳轉。
- **依賴另一盒：** Timeline + Visits 正在平行做（已 Gate A 確認／building）。記吃藥掛在「就診」上——找／建 visit、proof 槽位不要重做。**建議等 Visits 那盒在 C 上 `candidate_ready` 或採用後再開 Builder**；若你現在就「確認」本提案，Builder 必須以那盒 candidate 為底 rebase／對齊 `c/app.js` hunks，避免兩人同時改同一大檔打架。
- **不做：** 蓋到正式 B／Pages、寫進 `modules/medication` 雙寫、搬光所有 HTML、延後中的 lazy drug notes。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。

## Surface statement (standing rules)

| Surface | Path | This proposal |
|---|---|---|
| **C** | `apps/web/c/` | **Edit / wire here** — `c/app.js`, `c/index.html` script tags |
| Shared blocks | `apps/web/domains/` | **OK to add** `domains/medications/` (C already loads `../domains/...`) |
| **B** | `apps/web/` root passport | **Out of scope** — no silent cover |
| **A** | intro / login | Out of scope |

After Gate B adopt onto the candidate path for C: ask Victor whether to **cover C → B** (separate confirm). Cover is not part of this Gate A slice.

## Dependency on Timeline + Visits

**Depends on:** `proposals/20260826-timeline-visits-controller` (status at plan time: `building`, Gate A `approved`).

That proposal’s public API (already sketched / landing) that meds must **call**, not re-implement:

| Visits helper | Meds use |
|---|---|
| `findVisitByDateClinic(pet, { date, clinicId?, clinicName? })` | Core of `getOrCreateVisitForMedSave` find path |
| `findVisitByLink` / link parse (if med-link flows touch it) | Keep via visits public API |
| `collectVisitProofPhotos` / `clearVisitProofSlot` / visit proof fields | Live med proof attach stays facade; do **not** re-extract proof/imaging collectors |
| `saveVisitWeight` (optional) | If med-save path updates `weightAtVisit` / `pet.weight`, prefer visits helper over duplicating weight rules |

Timeline selectors stay out of this slice. Meds must not reach into visits **private** state — only `PetLiveWeb.domains.visits` public helpers (injected at compose time).

### Builder baseline (merge / conflict)

`c/app.js` is the shared conflict surface with TV-03. **Recommended:** start Meds Builder only after TV is `candidate_ready` or adopted on C. If Victor confirms Gate A **now** while TV is still building:

1. Branch from / rebase onto `proposal/timeline-visits-controller` (or the TV candidate path Victor is using).
2. Coordinate hunks around med-adjacent visit helpers already moved by TV; do not restore inlined visit weight/proof/imaging into meds.
3. Do not dual-edit formal B.

Call this out again under Risks.

## Why one domain (not `drugs/` split this slice)

Prefer **single** `apps/web/domains/medications/`:

1. **Write orchestration** (pending list → visit.medications, compound buckets, photo_bundle, draft validate/normalize) is the Gate A value.
2. **Drug search / enrichment** today is thin: `searchDrugs` prefers `PetLive.drug.searchDrugs` then local seed; `resolveEnrichedDrug` merges seed side-effects/precautions. That is read-only and already module-backed — inject as deps into the medications controller rather than a second domain folder.
3. Extra `domains/drugs/` script + compose order raises merge cost while TV and Meds both touch `c/index.html` / bootstrap.

**Non-goal this slice:** a separate `domains/drugs/` package. Follow-up only if enrichment / seed resolution grows enough to justify a read-only selectors file.

## Current codebase facts (audit)

- Sibling TV: Gate A approved; `domains/visits/controller.js` + `domains/timeline/selectors.js` + `qa/tests/web-timeline-visits.test.js` already landing; C wiring in progress.
- Pets pattern: classic IIFE `PetLiveWeb.domains.pets.createController(...)` — zero-build, no DOM, no localStorage in domain.
- `modules/medication`: validate + Map store (`createMedication`, history/current). UI prototype does **not** write that Map — keep read-only if anything; **no dual-write**.
- `modules/drug`: `searchDrugs` / `getDrugById` — UI may **call** via `PetLive.drug.*` for search like today.
- Architecture later phase #2 (`20260813-web-layered-building-blocks`): Visits + meds/drugs controllers; TV took visits/timeline; this proposal is the meds half.
- Still inlined in `c/app.js` (representative):

| Kind | Examples |
|---|---|
| Pure / model | `normalizeMedUnitForStore`, `normalizeMedFreqForStore`, `validateMedDraft`, `pendingMedScheduleKey`, `resolveCompoundColor` / defaults / session map, `pushPendingMed` data shape, `buildVisitMedicationsFromPending`, `formatDraftDoseLine` (dose string assembly; label injectors for i18n) |
| Visit adjacency | `getOrCreateVisitForMedSave` (DOM form + `completingVisitRef` + create visit) — find via visits; create/DOM stay facade-heavy |
| Drug read | `searchDrugs`, `resolveEnrichedDrug` |
| DOM (stay) | `renderPendingMeds`, `renderPendingCompoundOptions`, `renderTimelineMedItem`, `renderDrugResults`, `renderDrugInfoCard`, chip setters that touch DOM (`setMedCompoundChip`, `setMedFreqChip`, …), `openCompleteDrugs`, `finishMedFlowAfterSave`, live proof input binders |
| Session UI state | `pendingMeds`, `selectedDrug`, `medEntryMode`, `completingVisitRef`, `live*Photo`, `compoundColorByGroup` — controller may own **pending list + color map** as plain data; mode/DOM/photos stay in app or stay as injected session bag |

## Dependency direction (unchanged)

```text
bootstrap → shell/navigation + render coordinator
  → domain controllers
  → shared state/selectors + persistence adapters
  → runtime module adapters
  → modules/* public APIs → packages/shared

controllers -X-> DOM
views       -X-> localStorage
domains     -X-> another domain's private state
modules/*   -X-> apps/web
```

Meds compose **after** visits (and pets). Timeline not required for meds compose.

## Gate A builder scope

Only these IDs are proposed for this build:

### MD-01 — Medications controller (no DOM)

- Add `apps/web/domains/medications/controller.js` (classic IIFE, `PetLiveWeb.domains.medications`; mirror pets/visits style).
- Public API sketch (`createController` with injected deps):

```text
PetLiveWeb.domains.medications.createController({
  visits,                    // PetLiveWeb.domains.visits public API (required)
  searchDrugs: (q) => Drug[], // prefer PetLive.drug.searchDrugs unwrap; fallback local seed
  getDrugById: (id) => Drug|null,
  localDrugs: Drug[] | () => Drug[],  // enrichment seed
  // i18n-free or injector-based label helpers — do not import t()/document
  formatFrequencyLabelOf?,
  durationDaysLabelOf?,
  compoundFormLabelOf?,
  photoBundleNameOf?,        // optional; photo name may stay in facade
})

  // Draft / normalize (no toast)
  .normalizeMedUnitForStore(unit) → string
  .normalizeMedFreqForStore(frequency) → string
  .validateMedDraft(draft) → { ok: boolean, reason?: "need_drug"|"dose"|"days" }
  .draftFromFields(fields) → draft   // optional pure mapper if useful

  // Compound colors (session map owned by controller or passed bag)
  .defaultCompoundColor(group) → hex
  .resolveCompoundColor(group, explicit?, colorByGroup?) → hex|""
  .setCompoundColorOverride(colorByGroup, group, hex) → void

  // Pending list (plain data; no DOM)
  .createPendingId() → string
  .buildPendingItem(draft, { localId? }) → pendingMed
  .pushPendingMed(pendingMeds, draft) → pendingMed   // mutates array by ref
  .removePendingMed(pendingMeds, localId) → pendingMeds
  .setPendingCompoundGroup(pendingMeds, localId, group, colorByGroup?) → pendingMed|null
  .pendingMedScheduleKey(med) → string
  .pendingMedHasCompoundTag(med) → boolean

  // Assemble into visit.medications[] shapes (pets[] graph objects)
  .buildVisitMedicationsFromPending(pendingMeds, petId, labelOf?) → medUnit[]
      // preserves compound_bundle rules: group|schedule key, solo vs bundle,
      // ingredients, compoundForm/color, source/frequency/durationDays

  // Save helpers (mutate visit.medications / visit proof fields by ref — no toast, no go())
  .appendPhotoBundleToVisit(visit, pet, {
      bagPhoto, rxPhoto, drugPhoto, name, dosePendingText?
    }) → med
  .appendUnitsToVisit(visit, units) → void   // sets startDate = visit.date if missing

  // Visit find for med save — uses visits.findVisitByDateClinic; does NOT reimplement proof/imaging
  .findVisitForMedSave(pet, {
      date, clinicId?, clinicName?, clinicLabelOf?
    }) → visit|null
  // Optional: applyVisitWeightOnMedSave(pet, visit, weightKg) → delegates to visits.saveVisitWeight
```

- **Do not** call `modules/medication` `createMedication` / Map writes.
- **May** call `PetLive.drug.searchDrugs` / `getDrugById` for **read** search/enrichment only.
- Controllers must not touch `document` / `localStorage` / toast / `go` / `applySelectedPet`.

### MD-02 — Medications selectors (pure display helpers, optional same file or `selectors.js`)

- Prefer `apps/web/domains/medications/selectors.js` **or** export selectors from the same IIFE namespace if file split is noise — Builder may choose one file if API stays clear.
- Public API sketch (pure data / strings with injected label fns — no HTML):

```text
PetLiveWeb.domains.medications.createSelectors({ formatFrequencyLabelOf, tDuration?, formatShortDateOf?, getMedEndDate? })
  .formatMedDose(med) → string     // numeric/unit/freq assembly; pending copy via injector if needed
  .formatMedCourse(med) → string
  .formatDraftDoseLine(draft) → string
  .compoundFormClass(form) → string   // CSS class tokens only (already string maps in app)
  .compoundIconKind(form) → "capsule"|"liquid"
```

- **Do not** move `renderTimelineMedItem` / `renderPendingMeds` HTML builders here.
- Label maps that call `t()` today stay injectors from `c/app.js` or remain facade wrappers.

### MD-03 — C wiring + compatibility facades

- Update `apps/web/c/index.html`: load `domains/medications/*.js` after visits (and pets), before `c/app.js`; bump cache `?v=` for touched C scripts only.
- Update `apps/web/c/app.js`:
  - Compose medications controller with `visits` + drug search deps at bootstrap.
  - Replace inlined orchestration with same-named facades: `validateMedDraft`, `pushPendingMed`, `buildVisitMedicationsFromPending`, `resolveCompoundColor`, `searchDrugs`, `resolveEnrichedDrug`, etc.
  - `getOrCreateVisitForMedSave` remains a **facade**: read visit form / `completingVisitRef` / clinic DOM; call `medications.findVisitForMedSave` (→ visits.findVisitByDateClinic); if missing, create visit object on `pet.visits` in facade or a small controller helper that accepts **already-read** fields (no DOM inside domain); weight via visits when applicable; proof photo assign + toast + `finishMedFlowAfterSave` stay in app.
  - `openCompleteDrugs`, `renderPendingMeds`, `renderTimelineMedItem`, drug result/info-card render, chip DOM setters stay in `c/app.js`.
- Leave formal B unchanged.

### MD-04 — Boundary tests

- Add `qa/tests/web-medications.test.js` (new file; mirror `web-timeline-visits.test.js` / `web-building-blocks.test.js`: `node:test` + `vm` load classic scripts).
- Cover at least:
  - `validateMedDraft`: need drug / bad dose / bad days / ok
  - `normalizeMedUnitForStore` / freq strip `unrecorded`
  - `pushPendingMed` + remove + compound group mutate
  - `buildVisitMedicationsFromPending`: singles; compound bundle when ≥2 same group+schedule; solo compound tag stays non-bundle; schedule key split
  - `appendPhotoBundleToVisit`: `kind: photo_bundle`, source `owner_proof` vs `owner`
  - `findVisitForMedSave` uses visits.findVisitByDateClinic (load visits + medications together)
  - `searchDrugs` / `resolveEnrichedDrug` with injected fake APIs (no DOM)
  - domains do not touch `document` / `localStorage`
  - no write to `modules/medication` / `modules/drug` Maps (no import of private stores)

Existing `qa/tests/medication.test.js` and `drug-search.test.js` remain module-contract suites — do not weaken them; web suite is additive.

## Public API placement summary

| Namespace | Responsibility |
|---|---|
| `PetLiveWeb.domains.medications` | Pending/compound/draft/build/save assembly on `pets[].visits[].medications`; drug search read via injected APIs |
| `PetLiveWeb.domains.visits` | Visit find / weight / proof / imaging (dependency; not reimplemented) |
| `c/app.js` facades | DOM read, toasts, navigation, HTML render, listeners, med entry mode |

## Likely files

### Add

- `apps/web/domains/medications/controller.js`
- `apps/web/domains/medications/selectors.js` (optional if merged into controller file — prefer separate if formatters grow)
- `qa/tests/web-medications.test.js`

### Change

- `apps/web/c/app.js` — extract orchestration to facades; compose domain; keep render/listeners
- `apps/web/c/index.html` — script tags + cache `?v=`

### Read-only in this build

- `apps/web/app.js` / `apps/web/index.html` (formal B)
- `apps/web/c/styles.css`, `apps/web/c/i18n.js` (prefer avoid; cache bump only if required)
- `apps/web/domains/visits/*`, `domains/timeline/*`, `domains/pets/*` (consume visits public API only)
- `modules/*`, `packages/*`, `contracts/*`
- Medical copy / disclaimer strings (preserve reference-only tone)

If implementation reveals a read-only file must change, stop and return to Gate A with a scope modification; do not expand silently.

## Out of scope / non-goals

- **Timeline + Visits extraction** — owned by `20260826-timeline-visits-controller`; do not re-duplicate visit weight/proof/imaging helpers.
- Formal **B** edits or C → B cover / Pages publish.
- Dual-write to `modules/medication` or `modules/drug` Map stores; schema/contract changes.
- Moving heavy DOM HTML builders (`renderPendingMeds`, `renderTimelineMedItem`, drug results/info card, compound swatch HTML).
- **Lazy drug-note hydration** — still deferred (TV follow-up / separate timeline view slice).
- Separate `domains/drugs/` package (unless Victor modifies scope).
- Alerts / vaccines / parasite / emergency / pet lifecycle extractionsions.
- CSS redesign, bundler, IndexedDB, medical-copy rewrites, listener-system rewrite.

## Risks

- **Dose / unit / frequency / duration semantics:** facade bugs can drop `unrecorded` normalization, allow invalid drafts, or alter stored dose strings — Pharmacist must confirm parity; preserve source tags (`owner` / `owner_proof` / `clinic_ref`) and disclaimer adjacency.
- **Compound groups:** wrong `group|schedule` bucketing merges unrelated meds or fails to form `compound_bundle`; color overrides must not leak across pets/sessions incorrectly vs today’s `compoundColorByGroup` behavior.
- **`pending_drug_name` / photo_bundle:** photo-first path must keep structured pending + complete-drugs flow (`openCompleteDrugs` → manual mode); do not force drug name validation on photo save.
- **Proof photos on med save:** live bag/rx/drug attach to visit + med must not wipe or desync visit-level proof cleared by visits helpers; do not reimplement `clearVisitProofSlot`.
- **Concurrent edit of `c/app.js`:** high conflict risk with TV-03. Prefer wait for TV `candidate_ready`/adopt-on-C; else rebase onto TV candidate and coordinate hunks (see Notes + Builder baseline).
- **Facade recursion / bootstrap order:** load pets → visits → timeline (if present) → medications → `c/app.js`; wrappers must not call themselves.
- **i18n coupling:** compound labels / dose chrome use `t()` — inject label functions; user-authored drug names stay as entered; language switch must still recompute chrome.
- **Accidental modules dual-write:** forbidding `createMedication` Map writes in acceptance.
- **C/B drift:** C-only; Pages will not change until cover.

## Acceptance criteria

### Architecture

- [ ] `domains/medications` exists with public APIs only; no DOM / `localStorage` / private cross-domain access.
- [ ] Meds uses `domains.visits` public helpers for visit find (and weight if touched); no duplicated proof/imaging extraction.
- [ ] Mutations only on `pets[]` visit/medication object graph; no `modules/medication` or `modules/drug` store writes.
- [ ] Drug search may call `PetLive.drug` read APIs only.
- [ ] Compatibility names used by listeners remain available in `c/app.js` as thin facades.

### Behavior (C)

- [ ] Add-to-pending, remove, compound tag on pending list → same visit.medications shapes (single vs `compound_bundle` + ingredients).
- [ ] Manual med save and photo-bundle save parity (source tags, startDate, proof fields).
- [ ] `openCompleteDrugs` → completing visit ref → save onto that visit still works.
- [ ] Draft validation toasts still fire from facades with same reasons; domain returns structured `{ ok, reason }`.
- [ ] Drug search / select / enriched info card behavior unchanged (DOM still in app).
- [ ] Timeline med display, Rx/source tags, medical disclaimer semantics unchanged.
- [ ] zh-Hant / en / ja / ko dynamic chrome still refreshes; user-authored names/notes unchanged.

### Surface / tooling

- [ ] Only C + shared `domains/medications` + QA tests changed; formal B untouched.
- [ ] Zero-build: `c/index.html` script order works under repo-root `python3 -m http.server`.
- [ ] `node --test qa/tests/*.test.js` passes including new web-medications boundary tests.
- [ ] Candidate built from / rebased onto TV candidate if TV not yet adopted on C (document in candidate notes).

## QA / review routing

- **QA required** — pending list, compound bundling, photo vs manual save, complete-drugs path, pet-switch freshness, facade regressions; automated boundary tests (MD-04).
- **Pharmacist required** — dose/unit/frequency/duration, compound ingredients, `pending_drug_name` / photo_bundle, source tags, disclaimer / reference-only tone; no diagnostic authority creep.
- **UI light** — no intentional visual redesign; spot-check add-med + timeline med chrome parity on C only (not a visual taste pass).

## Rollback

- Candidate stays off mainline (`proposal/meds-drugs-controller` or `proposals/20260826-meds-drugs-controller/preview`).
- Roll back by removing new domain scripts/tags and restoring `c/app.js` med orchestration blocks from the candidate diff.
- No data migration; no Pages publish in this slice.

## Follow-ups (not this Gate A)

1. Optional `domains/drugs/` read selectors if enrichment grows.
2. Lazy drug-note hydration + timeline HTML byte / render-time measurement.
3. Victor-confirmed C → B cover + Pages publish for shared domains + B facades.
4. Alerts / vaccines / parasite / emergency domain extractionsions (separate proposals).

## Gate

This proposal stops at Gate A. No Builder, candidate product edit, or C/B cover may start until Victor confirms.
