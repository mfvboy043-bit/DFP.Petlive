---
id: 20260826-alerts-controller
title: Alerts controller building blocks
status: building
author: planner
candidate_branch: "proposal/alerts-controller"
candidate_path: "proposals/20260826-alerts-controller"
created: 2026-08-26
updated: 2026-08-26
---

# Proposal: Alerts controller building blocks

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Continue the adopted `20260813-web-layered-building-blocks` later phase **Alerts** by extracting a **pure alerts domain controller** (and optional read-only selectors) under `apps/web/domains/alerts/`, wired first against surface **C** (`apps/web/c/`). This slice is behavior-preserving, zero-build extraction: linked + owner alert composition, suppression map semantics, severity/source normalization, and owner-alert CRUD move behind `PetLiveWeb.domains.alerts` public APIs; DOM renderers, form chip/listener orchestration, and i18n chrome stay in `c/app.js` as thin facades.

`pets[]` remains the prototype graph for **linked** alerts (`pet.alerts[]`). Owner-held alerts persist via injected storage slots (`ownerAlertsSlot`, `suppressedAlertsSlot`) — not direct `localStorage` in the domain. No dual-write into `modules/medical-alert` Map stores. Formal **B** and GitHub Pages stay untouched until Victor separately confirms a C → B cover.

## Notes for Victor（白話）

這盒只做「警示」規則積木：把「串接紀錄 + 飼主自訂 + 隱藏串接項 + 嚴重度／來源語意」從超大的 `c/app.js` 抽出去。

- **這盒負責：** 組合某隻寵物的警示清單、讀寫飼主自訂 map、隱藏串接警示、正規化 severity/source/類型、飼主 CRUD 的純資料邏輯。
- **仍留在大檔（facade／畫面）：** 表單 chip、區塊 HTML、`renderAlerts*`、nav badge 色、toast、listener、`escapeAlertHtml`、需要 `t()` 的標籤。
- **緊急卡：** 仍用 `getAlertsForPet` facade 組 snapshot；不整盒搬 emergency DOM。
- **不做：** 蓋到正式 B／Pages、`modules/medical-alert` 雙寫、重寫警示表單 HTML、動到 meds boot。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。

## Surface statement (standing rules)

| Surface | Path | This proposal |
|---|---|---|
| **C** | `apps/web/c/` | **Edit / wire here** — `c/app.js`, `c/index.html` script tags |
| Shared blocks | `apps/web/domains/` | **OK to add** `domains/alerts/` (C already loads `../domains/...`) |
| **B** | `apps/web/` root passport | **Out of scope** — no silent cover |
| **A** | intro / login | Out of scope |

After Gate B adopt onto the candidate path for C: ask Victor whether to **cover C → B** (separate confirm). Cover is not part of this Gate A slice.

## Standing north star (Victor)

任何功能都應拆成獨立積木，避免在一整盒裡翻找。本 slice 只做 **Alerts**；vaccines／parasite／emergency 等依同原則後續一領域一刀。本 build 不因此擴大 `builder_scope`。

## Current codebase facts (audit)

- C `apps/web/c/app.js` ~8200 lines; alerts model/helpers ~lines 1412–1936 plus consumers (`renderAlertBadge`, `buildEmergencySnapshot`, listeners ~7286+).
- Already extracted on C: `core/storage.js` (`createJsonSlot`), `core/state.js`, `shell/navigation.js`, `shell/render-coordinator.js`, `domains/pets/controller.js`, `domains/visits/controller.js`, `domains/timeline/selectors.js`, `domains/medications/*` (C loads meds scripts — **must not break meds boot**).
- **Storage slots today:** `ownerAlertsSlot` / `suppressedAlertsSlot` are **instantiated in `c/app.js`** via `PetLiveWeb.storage.createJsonSlot` with keys `petlive-c-pet-alerts` / `petlive-c-suppressed-alerts`. Domain receives **injected slot refs**, not slot keys.
- **Linked alerts:** read from `pet.alerts[]`, filter `source !== "owner"`, minus suppression set, then `normalizeAlert(..., "linked")`. Demo seed data embeds linked alerts on pets; visit/med flows may add linked entries — **read-only composition** in this slice (do not mutate visit graph or re-seed pets incorrectly).
- **Owner alerts:** separate localStorage map `{ [petId]: Alert[] }` via `persistOwnerAlertsForPet`.
- **Delete semantics:** owner row → remove from owner map; linked id → add to suppression map (not delete from `pet.alerts[]`).
- **Edit linked via form:** `saveAlertFromForm` may upsert an owner copy when editing a linked id — preserve this behavior in facade + controller API.
- `modules/medical-alert/index.js` has `createAlert` / `getAlertsByPetId` on a private Map — **not UI write truth**; forbid dual-write.

Still inlined in `c/app.js` (representative):

| Kind | Examples | This slice |
|---|---|---|
| Constants | `ALERT_TYPE_ORDER`, `ALERT_SECTION_DEFS`, `DEFAULT_ALERT_SEVERITY` | Section defs stay view config; type order + default severity → domain |
| Pure model | `normalizeSeverity`, `inferAlertType`, `normalizeAlert`, `sortAlerts`, `highestAlertSeverity`, `formatAlertSince`, `toMonthInputValue` | **Extract** |
| Storage + composition | `load/saveOwnerAlertsMap`, `load/saveSuppressedAlertsMap`, `getSuppressedAlertIds`, `suppressLinkedAlert`, `getLinkedAlerts`, `getOwnerAlerts`, `getAlertsForPet`, `persistOwnerAlertsForPet` | **Extract** (via injected slots) |
| Mutations (today DOM-coupled) | `saveAlertFromForm`, `deleteAlertById` | **Facade** in `c/app.js` calling controller |
| i18n / view | `alertTypeLabel`, `alertLineText`, `chronicSinceLine`, `escapeAlertHtml`, `syncAlert*`, `renderAlert*`, `renderEmergencyAlertsList`, `syncAlertNavTone` | **Stay** in `c/app.js` |
| UI session | `selectedAlertType`, `selectedAlertSeverity`, `editingAlertSectionIds` | **Stay** in `c/app.js` |

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

Alerts compose **after** pets (for `getCurrentPet` facades). No required dependency on visits/timeline/meds domains for pure alert math — facades may pass `pet` object only.

## Gate A builder scope

Only these IDs are proposed for this build:

### AL-01 — Alerts controller (no DOM)

- Add `apps/web/domains/alerts/controller.js` (classic IIFE, `PetLiveWeb.domains.alerts`; mirror pets/visits style).
- Public API sketch (`createController` with injected deps):

```text
PetLiveWeb.domains.alerts.createController({
  ownerAlertsSlot,      // { read, write, ... } from PetLiveWeb.storage.createJsonSlot
  suppressedAlertsSlot,
})

  // Pure normalization
  .inferAlertType(alert) → alertType
  .normalizeSeverity(value, alertType) → "critical"|"caution"
  .defaultSeverityForType(alertType) → "critical"|"caution"
  .normalizeAlert(alert, fallbackSource?) → Alert
  .formatAlertSince(sinceDate) → string
  .toMonthInputValue(sinceDate) → "YYYY-MM"|""

  // Read / compose (pet passed in — no getCurrentPet inside domain)
  .getSuppressedAlertIds(petId) → Set<string>
  .getLinkedAlerts(pet) → Alert[]
  .getOwnerAlerts(petId) → Alert[]
  .getAlertsForPet(pet) → Alert[]   // linked (minus suppressed, minus owner-id collision) + owner, sorted

  // Persistence helpers (return boolean ok like slot.write today)
  .loadOwnerAlertsMap() / .saveOwnerAlertsMap(map)
  .loadSuppressedAlertsMap() / .saveSuppressedAlertsMap(map)
  .persistOwnerAlertsForPet(petId, ownerAlerts) → boolean

  // Mutations (explicit petId — wrong-pet writes are a QA focus)
  .suppressLinkedAlert(petId, alertId) → boolean
  .createOwnerAlert(petId, draft) → { ok, alert?, reason? }
  .updateOwnerAlert(petId, alertId, draft) → { ok, alert?, reason? }
  .deleteOwnerAlert(petId, alertId) → { ok, reason? }
  .deleteOrSuppressAlert(pet, alertId) → { ok, kind: "owner"|"linked"|"none", reason? }
      // mirrors deleteAlertById: owner remove OR linked suppress

  // Draft validation (no DOM)
  .validateOwnerDraft({ alertType, description, sinceDate?, severity? }) → { ok, reason? }
```

- Move model logic out of `c/app.js`; **no** `document`, **no** `t()`, **no** direct `localStorage`.
- **`escapeAlertHtml` stays in `c/app.js`** — view-layer HTML escaping (same rationale as TV keeping HTML builders in app).
- **`alertTypeLabel` / `chronicSinceLine` stay in views** — they call `t()`.
- **`ALERT_SECTION_DEFS` stays in `c/app.js`** — presentation grouping for sectioned UI; domain exposes sorted list + optional selectors for filter-by-type.

### AL-02 — Alerts selectors (read-only; optional merge)

- Add `apps/web/domains/alerts/selectors.js` **if** read-only helpers stay non-trivial after AL-01; otherwise merge into controller (Builder choice — prefer separate file when >~3 pure functions).
- Public API sketch:

```text
PetLiveWeb.domains.alerts.createSelectors({ alerts /* controller public surface */ })
  .sortAlerts(alerts) → Alert[]
  .highestAlertSeverity(alerts) → "critical"|"caution"|null
  .alertCount(alerts) → number
  .hasCritical(alerts) → boolean
  .filterByTypes(alerts, types[]) → Alert[]   // for ALERT_SECTION_DEFS sections
```

- No persistence, no DOM, no `t()`.

### AL-03 — C wiring + compatibility facades

- Update `apps/web/c/index.html`: load `../domains/alerts/controller.js` (+ `selectors.js` if split) **after** pets, **without breaking** existing meds/visits/timeline script order; bump cache `?v=` for touched C scripts only.
- Update `apps/web/c/app.js`:
  - Keep `ownerAlertsSlot` / `suppressedAlertsSlot` instantiation (or thin re-export) at bootstrap; pass into `createController`.
  - Compose alerts controller (+ selectors) at bootstrap (same pattern as pets/visits).
  - Replace inlined helpers with facades of the **same function names** where listeners/render still expect them (`getAlertsForPet`, `getOwnerAlerts`, `suppressLinkedAlert`, …).
  - `saveAlertFromForm` / `deleteAlertById` remain facades: read DOM / session chips, validate via controller, toast / `showPersistenceFailure`, `applySelectedPet`.
  - Import/export payload paths (`petAlerts`, `suppressedAlerts`) continue using slot refs — may delegate read/write to controller for consistency.
- Leave formal B (`apps/web/app.js`, `apps/web/index.html`) unchanged.

### AL-04 — Boundary tests

- Add `qa/tests/web-alerts.test.js` (`node:test` + `vm`, same style as `web-timeline-visits.test.js`).
- Cover at least:
  - `normalizeAlert` / `inferAlertType` / `normalizeSeverity` (incl. `high` → `critical`, type defaults)
  - linked + owner composition; owner id wins over linked duplicate
  - suppression hides linked alert; suppress is idempotent
  - sort order: critical before caution, then type order, then `createdAt`
  - `highestAlertSeverity` / count selectors
  - owner CRUD + `deleteOrSuppressAlert` owner vs linked paths
  - `validateOwnerDraft` rejects empty description; chronic `sinceDate` formatting rules
  - wrong `petId` does not mutate another pet's owner map
  - domains do not touch `document` / `localStorage` (mock injected slots)
  - no import of `modules/medical-alert` private Map

## Public API placement summary

| Namespace | Responsibility |
|---|---|
| `PetLiveWeb.domains.alerts` | Alert normalization, composition, suppression, owner CRUD |
| `PetLiveWeb.domains.alerts` selectors (optional) | Sorted list, severity flags, section filters |
| `c/app.js` facades | DOM, toasts, `applySelectedPet`, HTML render, listeners, i18n labels |

## Likely files

### Add

- `apps/web/domains/alerts/controller.js`
- `apps/web/domains/alerts/selectors.js` (if not merged into controller)
- `qa/tests/web-alerts.test.js`

### Change

- `apps/web/c/app.js` — extract helpers to facades; compose domain; keep render/listeners
- `apps/web/c/index.html` — script tags + cache `?v=` for new/changed C loads

### Read-only in this build

- `apps/web/app.js` / `apps/web/index.html` (formal B)
- `apps/web/c/styles.css`, `apps/web/c/i18n.js` (unless zero-behavior cache bump unavoidable — prefer avoid)
- `apps/web/core/*`, `apps/web/shell/*`, other `domains/*` (consume only; do not break meds boot)
- `modules/*`, `packages/*`, `contracts/*`
- Medical copy / disclaimer strings

If implementation reveals a read-only file must change, stop and return to Gate A with a scope modification; do not expand silently.

## Out of scope / non-goals

- Formal **B** edits or C → B cover / Pages publish (Victor confirm later).
- **Emergency card** full extraction — `buildEmergencySnapshot` / `renderEmergencyAlertsList` stay facades consuming `getAlertsForPet`.
- **Vaccines**, **parasite**, **pet lifecycle** extractions (sibling proposals).
- Dual-write to `modules/medical-alert` Map stores; schema / contract changes; IndexedDB; bundler; CSS redesign.
- Rewriting alert form HTML, chip markup, or listener system wholesale.
- Moving `ALERT_SECTION_DEFS` section chrome into domain (view config).
- Mutating visit/med graphs to “create” linked alerts (linked alerts remain composed from existing `pet.alerts[]` data).
- Listener-count refactor as a goal.

## Risks

- **Wrong-pet alert write:** owner map keyed by `petId` — facades must pass current pet id explicitly; QA must cover pet-switch during edit.
- **Suppression persistence / failed write UX:** slot `write` returns boolean; facades must keep `showPersistenceFailure` parity when suppress or owner save fails.
- **Severity / source semantics:** `linked` vs `owner`, `critical` vs `caution`, ADR/allergy default severities — Pharmacist must confirm no tag/disclaimer drift.
- **Linked alert edit converts to owner:** editing a linked item creates/updates owner copy — preserve id handling and dedupe in composition.
- **Linked alerts from visit/med data:** read-only composition; do not splice `pet.alerts[]` or visit records incorrectly when suppressing.
- **Facade recursion / bootstrap order:** scripts must load alerts after storage bootstrap; wrappers must not call themselves.
- **Meds boot regression:** new script tags must not reorder or break `domains/medications/*` load — add alerts adjacent to other domains, test C cold load.
- **C/B drift:** C-only wiring until cover; document so Victor does not expect Pages change.
- **`c/app.js` merge conflicts:** other domain slices (pets lifecycle, etc.) may touch same file — rebase onto latest C candidate before Builder.

## Acceptance criteria

### Architecture

- [ ] `domains/alerts` exists with public API only; no DOM / direct `localStorage` / private cross-domain access.
- [ ] Owner + suppressed maps persist only via injected slots; keys/shapes unchanged.
- [ ] No `modules/medical-alert` store writes.
- [ ] Compatibility function names used by listeners remain available in `c/app.js` as thin facades.
- [ ] Meds / visits / timeline scripts still load and boot on C.

### Behavior (C)

- [ ] Alerts screen lists linked + owner items with same sort, severity badges, source tags, section grouping.
- [ ] Add / edit / delete owner alerts; delete linked → suppress; persistence failure toast unchanged.
- [ ] Edit linked alert creates owner copy behavior preserved.
- [ ] Nav badge count + critical/caution tone (`syncAlertNavTone`) match pre-extract.
- [ ] Emergency card alert list content matches pre-extract (facade path).
- [ ] Import/export includes `petAlerts` + `suppressedAlerts` parity.
- [ ] Pet switch shows correct pet's alerts (no stale map reads).
- [ ] zh-Hant / en / ja / ko dynamic chrome still refreshes; user-authored alert text unchanged.

### Surface / tooling

- [ ] Only C + shared `domains/alerts` + QA tests changed; formal B untouched.
- [ ] Zero-build: `c/index.html` script order works under repo-root `python3 -m http.server`.
- [ ] `node --test qa/tests/*.test.js` passes including new alerts boundary tests.

## QA / review routing

- **QA required** — owner CRUD, suppression, pet-switch, import/export, facade regressions; include automated boundary tests.
- **Pharmacist required** — severity defaults (drug allergy / ADR critical), source tag semantics (`linked` / `owner`), ADR wording adjacency; confirm no dose/disclaimer drift (alerts are not dose fields but allergy/ADR copy matters).
- **UI light compatibility** — no intentional visual redesign; spot-check alerts screen + nav badge + emergency list on C only.

## Rollback

- Candidate stays off mainline (`proposal/alerts-controller` or `proposals/20260826-alerts-controller/preview`).
- Roll back by removing new domain scripts/tags and restoring `c/app.js` helper blocks from the candidate diff.
- No data migration; no Pages publish in this slice.

## Follow-ups (not this Gate A)

1. Victor-confirmed C → B cover + Pages publish for shared domains + B facades.
2. Optional: move slot instantiation from `c/app.js` into shared bootstrap if ARCH slot consolidation proposal returns.
3. Emergency card domain extraction (snapshot composition beyond alerts list).
4. Runtime adapter from `pets[]` snapshots → `PetLive.alert` **read** paths only (still no dual-write unless dedicated proposal).

## Gate

This proposal stops at Gate A. No Builder, candidate product edit, or C/B cover may start until Victor confirms.

## Notes for Victor

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
