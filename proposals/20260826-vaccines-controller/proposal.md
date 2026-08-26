---
id: 20260826-vaccines-controller
title: Vaccines controller building blocks
status: adopted
author: planner
candidate_branch: "proposal/vaccines-controller"
candidate_path: "proposals/20260826-vaccines-controller"
created: 2026-08-26
updated: 2026-08-26
---

# Proposal: Vaccines controller building blocks

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Continue the adopted `20260813-web-layered-building-blocks` later phase **Vaccines** by extracting a **Vaccines domain** (pure selectors + mutation controller) under `apps/web/domains/vaccines/`, wired first against surface **C** (`apps/web/c/`). This slice is behavior-preserving, zero-build extraction: catalog meta, protection-status lamps, grouping/sorting, species gates, and `pet.vaccines[]` upsert move behind `PetLiveWeb.domains.vaccines` public APIs; DOM renderers, chip/form listeners, calendar chooser, and i18n chrome stay in `c/app.js` as thin facades.

`pets[]` remains the prototype mutation graph (`pet.vaccines[]`). No dual-write into `modules/vaccine` Map stores. Formal **B** and GitHub Pages stay untouched until Victor separately confirms a C → B cover.

## Notes for Victor（白話）

這盒只做「疫苗」規則積木：把「哪一劑算現行、到期燈號、排序、貓不能打狂犬、寫入 vaccines[]」從超大的 `c/app.js` 抽出去。

- **這盒負責：** 疫苗 catalog meta、保護狀態（綠／橙／紅）、分組／排序／下一劑選擇、物種限制、upsert 寫入 `pet.vaccines[]`。
- **仍留在大檔（facade／畫面）：** chip 表單、HTML 列表、nav 燈、parasite 列上的 vaccine strip、toast、listener、需要 `t()` 的標籤與 calendar payload。
- **不做：** 蓋到正式 B／Pages、`modules/vaccine` 雙寫、搬 parasite 域、重寫疫苗表單 HTML。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。

## Surface statement (standing rules)

| Surface | Path | This proposal |
|---|---|---|
| **C** | `apps/web/c/` | **Edit / wire here** — `c/app.js`, `c/index.html` script tags |
| Shared blocks | `apps/web/domains/` | **OK to add** `domains/vaccines/` (C already loads `../domains/...`) |
| **B** | `apps/web/` root passport | **Out of scope** — no silent cover |
| **A** | intro / login | Out of scope |

After Gate B adopt onto the candidate path for C: ask Victor whether to **cover C → B** (separate confirm). Cover is not part of this Gate A slice.

## Standing north star (Victor)

任何功能都應拆成獨立積木，避免在一整盒裡翻找。本 slice 只做 **Vaccines**；parasite／emergency 等依同原則後續一領域一刀。本 build 不因此擴大 `builder_scope`。

## Current codebase facts (audit)

- C `apps/web/c/app.js` ~8200 lines; vaccine model/helpers ~lines 1819–2747, 7123–7297 plus render-coordinator registration ~4340–4350.
- Already extracted on C: `core/storage.js`, `core/state.js`, `shell/navigation.js`, `shell/render-coordinator.js`, `domains/pets/controller.js`, `domains/visits/controller.js`, `domains/timeline/selectors.js`, `domains/alerts/*`, `domains/medications/*`.
- C loads shared domain scripts via `../domains/...` in `c/index.html` (after pets, before `c/app.js`).
- **`pet.vaccines[]`** is UI write truth: `{ key?, name, given, next, status? }[]`. Form submit calls `upsertPetVaccines` — replaces same key/name rows then unshifts new entries.
- **`modules/vaccine/index.js`** exposes `createVaccine`, `getVaccinesByPetId`, `getUpcomingVaccineReminders` on a private Map — **not UI write truth**; forbid dual-write.
- **`daysUntil`** (~1825) is shared with parasite status (~1910). Parasite extraction is out of scope; **do not** add `packages/` shared date utils this slice. Prefer **inject `daysUntil`** into vaccines factory from C bootstrap (single source in `c/app.js` for now), with boundary test asserting parity vs inline implementation. Parasite keeps its inline call until a later parasite proposal.
- **`resolveVaccineKey`** (~2435) reverse-scans global `I18N` tables — domain must receive **`findKeyByLocalizedName(name) → key|null`** injection from C (no `I18N` / `t()` in domain).
- **`vaccineLabelOf`** uses `t(key)` — **stays in C** as view helper.
- **`VACCINE_PRESETS`** (~2379) is chip UI layout config — **stays in C** with `fillVaccineNameOptions`.
- **`buildVaccineCalendarPayload`** (~2289) uses `t()` — **stays in C** facade; domain may expose pure `{ nextDue, uidSeed }` if useful, but i18n strings remain view-layer.
- **Draft preservation (ARCH):** `refreshVaccineForm` (~2622) snapshots/restores chip keys, custom name, given, next when `vaccineFormPetId === pet.id`; only pet-id change triggers destructive `resetVaccineForm`. Render coordinator registers `vaccines` / `vaccineForm` groups (~4340). Existing test `web-building-blocks.test.js` — *preserves active and hidden dirty vaccine drafts* — must still pass; VC-04 may extend coverage in `web-vaccines.test.js`.

Still inlined in `c/app.js` (representative):

| Kind | Examples | This slice |
|---|---|---|
| Constants | `VACCINE_PROTECTION_META` | **Extract** to selectors |
| Constants | `VACCINE_PRESETS` | **Stay** in C (chip UI) |
| Date / status | `daysUntil`, `getVaccineProtectionStatus`, `isVaccineApproaching`, `addYears`, `todayISODate` | **Extract** (inject `daysUntil` or duplicate w/ test parity) |
| Catalog / meta | `resolveVaccineKey`, `getVaccineProtectionGroup`, `getVaccineTier`, `getVaccineDisplayRank`, `compareVaccineCurrency` | **Extract** (selectors) |
| Selectors | `getCurrentVaccinesByGroup`, `getVaccineSuccessor`, `getNextVaccine`, `vaccineStatusUrgency`, `compareVaccinesForStatusDisplay`, `compareVaccinesForList` | **Extract** |
| Rules | `isRabiesVaccineEntry`, `vaccineAllowedForPet`, `vaccineStatusForNext` | **Extract** (inject localized rabies label match via C) |
| Mutation | `upsertPetVaccines` | **Extract** (controller) |
| Validation prep | form submit checks (empty selection, blocked species, date order) | **Extract** optional `validateSave` / `buildSaveEntries` in controller |
| Calendar | `buildVaccineCalendarPayload` | **Stay** in C (uses `t()`) |
| Form / UI | `selectedVaccineKeys`, chip listeners, `fillVaccineNameOptions`, `getSelectedVaccineEntries`, `syncVaccineNextDueFromGiven`, `resetVaccineForm`, `refreshVaccineForm`, `renderVaccineList`, `renderVaccineStrip`, `renderEmergencyVaccineNav`, `renderVaccines`, `syncVaccineNavLights`, submit handler | **Stay** in C |

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

Vaccines domain has **no required dependency** on visits/timeline/alerts/meds — facades pass `pet` only. Emergency nav and parasite strip consume selector outputs via C facades.

## Gate A builder scope

Only these IDs are proposed for this build:

### VC-01 — Vaccines selectors (pure)

- Add `apps/web/domains/vaccines/selectors.js` (classic IIFE, `PetLiveWeb.domains.vaccines`).
- Move `VACCINE_PROTECTION_META` and all pure read/sort/status helpers out of `c/app.js`.
- Public API sketch:

```text
PetLiveWeb.domains.vaccines.createSelectors({
  daysUntil,                    // injected from C — shared with parasite until parasite slice
  findKeyByLocalizedName,       // (name) => preset key | "" — C wraps I18N reverse lookup
  isRabiesLocalizedName,        // optional (name) => boolean — C wraps I18N vRabies labels + heuristics
})

  // Constants (read-only)
  .PROTECTION_META               // VACCINE_PROTECTION_META map

  // Date helpers (pure; no DOM)
  .addYears(isoDate, years) → ISO date
  .todayISODate() → ISO date
  .getVaccineProtectionStatus(nextDate) → "protected"|"approaching"|"expired"
  .isVaccineApproaching(nextDate) → boolean
  .vaccineStatusForNext(nextDate) → "ok"|"soon"|"expired"

  // Catalog / meta
  .resolveVaccineKey(vaccine) → key
  .getVaccineProtectionGroup(vaccine) → string
  .getVaccineTier(vaccine) → number
  .getVaccineDisplayRank(vaccine) → number
  .compareVaccineCurrency(a, b) → -1|0|1

  // Grouping / ordering / next
  .getCurrentVaccinesByGroup(pet) → Map<group, vaccine>
  .getVaccineSuccessor(pet, vaccine) → vaccine|null
  .getNextVaccine(pet) → vaccine|null
  .vaccineStatusUrgency(nextDate) → 0|1|2
  .compareVaccinesForStatusDisplay(a, b) → -1|0|1
  .compareVaccinesForList(pet, a, b) → -1|0|1

  // Species / product rules
  .isRabiesVaccineEntry(entry) → boolean
  .vaccineAllowedForPet(pet, entry) → boolean
```

- **No** `document`, **no** `localStorage`, **no** `t()` / `I18N` direct access.
- **`vaccineLabelOf`** stays in C — calls `t(key)` after `resolveVaccineKey`.

### VC-02 — Vaccines controller (mutations + save prep)

- Add `apps/web/domains/vaccines/controller.js` (classic IIFE; compose with selectors).
- Public API sketch:

```text
PetLiveWeb.domains.vaccines.createController({ selectors /* VC-01 instance */ })

  // Mutation on pets[] graph (by reference) — no DOM, no toast, no applySelectedPet
  .upsertPetVaccines(pet, entries) → void
      // same semantics: filter out matching key/name, reverse-unshift new rows

  // Optional pure save pipeline for form facade
  .validateSave({ pet, selected, given, next }) → { ok, reason?, blocked? }
      // reasons: "need_name"|"species_blocked"|"need_dates"|"date_order"
  .buildSaveEntries({ pet, selected, given, next }) → { ok, entries?, updated?, reason? }
      // entries include key, name, given, next, status (via selectors.vaccineStatusForNext)
  .wasVaccineUpdated(pet, selected) → boolean   // mirrors submit "updated" toast branch
```

- **Do not** call `modules/vaccine` create/list APIs for writes.

### VC-03 — C wiring + compatibility facades

- Update `apps/web/c/index.html`: load `../domains/vaccines/selectors.js` then `controller.js` **after** pets, **without breaking** existing meds/visits/timeline/alerts script order; bump cache `?v=` for touched C scripts only.
- Update `apps/web/c/app.js`:
  - Define `daysUntil` once at bootstrap; pass into `createSelectors` (parasite continues calling same function).
  - Inject `findKeyByLocalizedName` / rabies name helper wrapping existing `I18N` scan logic.
  - Compose vaccines selectors + controller at bootstrap (same pattern as visits/alerts).
  - Replace inlined helpers with **same-name facades** where listeners/render still expect them (`getNextVaccine`, `getVaccineProtectionStatus`, `upsertPetVaccines`, …).
  - Form submit handler remains facade: read DOM / `getSelectedVaccineEntries`, call `validateSave` / `buildSaveEntries`, toast, `upsertPetVaccines` or delegate to controller, `buildVaccineCalendarPayload`, `renderVaccines`, `resetVaccineForm`, calendar chooser.
  - **`refreshVaccineForm` draft snapshot/restore logic stays in C** — must preserve ARCH behavior (same-pet dirty refresh vs pet-id change reset); only delegate any pure date defaulting to selectors if extracted.
  - Leave formal B (`apps/web/app.js`, `apps/web/index.html`) unchanged.

### VC-04 — Boundary tests

- Add `qa/tests/web-vaccines.test.js` (`node:test` + `vm`, same style as `web-timeline-visits.test.js`).
- Cover at least:
  - `getVaccineProtectionStatus` thresholds: expired (≤0 days), approaching (1–90), protected (>90)
  - `getCurrentVaccinesByGroup` / `getVaccineSuccessor` — tier + given date progression within group
  - `getNextVaccine` urgency + displayRank ordering (combo before rabies; expired before approaching)
  - `compareVaccinesForList` — active before superseded history
  - `isRabiesVaccineEntry` / `vaccineAllowedForPet` — cat blocks rabies (key, zh, en, custom name heuristics via injected helper)
  - `upsertPetVaccines` — replaces same key/name, preserves unrelated rows, order (newest first)
  - `validateSave` / `buildSaveEntries` — empty selection, date order, species block
  - injected `daysUntil` parity vs reference implementation
  - domains do not touch `document` / `localStorage`
  - no import of `modules/vaccine` private Map
- Existing `web-building-blocks.test.js` vaccine draft test must still pass unchanged.

## Public API placement summary

| Namespace | Responsibility |
|---|---|
| `PetLiveWeb.domains.vaccines` selectors | Catalog meta, protection status, grouping, sorting, species rules |
| `PetLiveWeb.domains.vaccines` controller | `pet.vaccines[]` upsert + pure save validation/prep |
| `c/app.js` facades | DOM, chips, toasts, `applySelectedPet`, HTML render, listeners, i18n labels, calendar payload |

## Likely files

### Add

- `apps/web/domains/vaccines/selectors.js`
- `apps/web/domains/vaccines/controller.js`
- `qa/tests/web-vaccines.test.js`

### Change

- `apps/web/c/app.js` — extract helpers to facades; compose domain; keep render/listeners/draft logic
- `apps/web/c/index.html` — script tags + cache `?v=` for new/changed C loads

### Read-only in this build

- `apps/web/app.js` / `apps/web/index.html` (formal B)
- `apps/web/c/styles.css`, `apps/web/c/i18n.js` (unless zero-behavior cache bump unavoidable — prefer avoid)
- `apps/web/core/*`, `apps/web/shell/*`, other `domains/*` (consume only; do not break meds/alerts boot)
- `modules/*`, `packages/*`, `contracts/*`
- Medical copy / disclaimer strings

If implementation reveals a read-only file must change, stop and return to Gate A with a scope modification; do not expand silently.

## Out of scope / non-goals

- Formal **B** edits or C → B cover / Pages publish (Victor confirm later).
- **Parasite** domain extraction (`getParasiteStatus`, product catalog, forms) — continues inline; only consumes shared `daysUntil` from C if injected.
- **Emergency card** full extraction — `renderEmergencyVaccineNav` stays facade consuming `getNextVaccine` + status helpers.
- Dual-write to `modules/vaccine` Map stores; schema / contract changes; IndexedDB; bundler; CSS redesign.
- Moving `VACCINE_PRESETS` chip markup / exclusive-group chip listener into domain (view config + DOM).
- Moving `buildVaccineCalendarPayload`, `openGoogleCalendar`, `openAppleCalendar` into domain (i18n + `window.open`).
- Shared `packages/` date utility consolidation.
- Listener-count refactor as a goal.
- Alerts / pet lifecycle / meds changes beyond not breaking script boot order.

## Risks

- **Protection lamp semantics:** 90-day approaching window and expired-at-≤0 must match pre-extract C behavior for home strip, emergency nav lights, and list pills — wrong thresholds break user trust in “green/orange/red.”
- **Rabies species gate:** cats must reject `vRabies` key and localized/custom rabies names (`isRabiesVaccineEntry` heuristics); false negative allows invalid save; false positive blocks legitimate custom names.
- **Superseded / list ordering:** `getVaccineSuccessor` and `compareVaccinesForList` drive “history” pills — regression hides active combo or shows wrong successor label.
- **Upsert collision:** key vs name dedupe when custom name matches preset label — must preserve current filter-then-unshift semantics.
- **Draft loss on pet switch / dirty refresh:** ARCH fix requires `refreshVaccineForm` same-pet path to snapshot/restore without calling `resetVaccineForm`; extraction must not move draft session state into domain or bypass render-coordinator `vaccineForm` registration.
- **I18N key resolution drift:** `resolveVaccineKey` depends on injected reverse lookup — language change must still resolve keys for grouping; facade must re-bind or pass live lookup on each call.
- **`daysUntil` shared with parasite:** injecting one copy from C avoids drift; if duplicated in domain, VC-04 must lock parity.
- **Facade recursion / bootstrap order:** scripts must load vaccines after pets; wrappers must not call themselves.
- **Meds/alerts boot regression:** new script tags must not reorder or break existing domain loads — test C cold load.
- **C/B drift:** C-only wiring until cover; document so Victor does not expect Pages change.
- **Accidental modules dual-write:** easy mistake if someone “syncs” `createVaccine` — forbid in acceptance.

## Acceptance criteria

### Architecture

- [ ] `domains/vaccines` exists with public selectors + controller APIs; no DOM / `localStorage` / private cross-domain access.
- [ ] Mutations only on `pet.vaccines[]` via controller; no `modules/vaccine` store writes.
- [ ] Compatibility function names used by listeners/render remain available in `c/app.js` as thin facades.
- [ ] Meds / visits / timeline / alerts scripts still load and boot on C.

### Behavior (C)

- [ ] Vaccine list order, superseded pills, and given/next meta match pre-extract C.
- [ ] Form add/update: chip exclusive groups (coreCombo/felineCore), custom name, given→next +1y default, validation toasts unchanged.
- [ ] Cat cannot save rabies (preset or typed); dog/other rabies OK.
- [ ] Home parasite-row vaccine strip + emergency nav lights + status text match pre-extract (urgency, displayRank, expired/approaching/protected classes).
- [ ] Calendar chooser after save still works (facade `buildVaccineCalendarPayload`).
- [ ] Same-pet dirty refresh preserves vaccine form draft; pet switch resets form (ARCH parity).
- [ ] Pet switch shows correct pet vaccines (no stale list/nav).
- [ ] zh-Hant / en / ja / ko dynamic chrome still refreshes vaccine preset labels; user-authored custom vaccine names unchanged.

### Surface / tooling

- [ ] Only C + shared `domains/vaccines` + QA tests changed; formal B untouched.
- [ ] Zero-build: `c/index.html` script order works under repo-root `python3 -m http.server`.
- [ ] `node --test qa/tests/*.test.js` passes including new vaccines boundary tests and existing vaccine draft test.

## QA / review routing

- **QA required** — upsert/replace semantics, species gate, protection lamps, pet-switch, draft preservation, facade regressions; include automated boundary tests (VC-04).
- **Pharmacist required (light)** — vaccine is not dose math, but product naming (combo tiers, rabies/lepto/felv labels) and reference-only tone on list/strip copy must not drift; confirm no diagnostic/treatment-authority wording introduced.
- **UI light compatibility** — no intentional visual redesign; spot-check vaccine screen, parasite-row strip, emergency nav on C only.

## Rollback

- Candidate stays off mainline (`proposal/vaccines-controller` or `proposals/20260826-vaccines-controller/preview`).
- Roll back by removing new domain scripts/tags and restoring `c/app.js` helper blocks from the candidate diff.
- No data migration; no Pages publish in this slice.

## Follow-ups (not this Gate A)

1. Victor-confirmed C → B cover + Pages publish for shared domains + B facades.
2. **Parasite** controller slice (may then share or consolidate `daysUntil` / `addDays` injection).
3. Emergency card domain extraction beyond vaccine nav facade.
4. Optional runtime adapter from `pets[]` snapshots → `PetLive.vaccine` **read** paths only (still no dual-write unless dedicated proposal).

## Gate

This proposal stops at Gate A. No Builder, candidate product edit, or C/B cover may start until Victor confirms.

## Notes for Victor

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
