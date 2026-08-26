---
id: 20260826-parasite-controller
title: Parasite controller building blocks
status: adopted
author: planner
candidate_branch: "proposal/parasite-controller"
candidate_path: "proposals/20260826-parasite-controller"
created: 2026-08-26
updated: 2026-08-26
---

# Proposal: Parasite controller building blocks

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Continue the adopted `20260813-web-layered-building-blocks` later phase **Parasite** by extracting a **pure parasite domain controller** (and optional strip-status selectors) under `apps/web/domains/parasite/`, wired first against surface **C** (`apps/web/c/`). This slice is behavior-preserving, zero-build extraction: external / heartworm records on `pet.parasitePrevention`, status lamps (`protected` / `approaching` / `unprotected` / `optional`), interval → next-due math, dual-cover product sync, draft validation, and pure calendar payload data move behind `PetLiveWeb.domains.parasite` public APIs; DOM renderers, product chips, calendar chooser overlay, Google/Apple `window.open` / ICS download, and i18n chrome stay in `c/app.js` as thin facades.

`pets[]` / `pet.parasitePrevention` remains the prototype write truth. No dual-write into any `modules/*` Map (none is UI write truth for parasite today). Formal **B** and GitHub Pages stay untouched until Victor separately confirms a C → B cover.

## Notes for Victor（白話）

這盒只做「寄生蟲／心絲蟲預防」規則積木：把「外寄生／心絲蟲兩格紀錄、到期燈號、間隔算下次、雙效藥同步、日曆要用的純資料」從超大的 `c/app.js` 抽出去。

- **這盒負責：** 讀寫 `pet.parasitePrevention`、狀態計算（含貓心絲蟲未設＝optional）、last+interval→next、雙效產品兩邊同步、驗證草稿、組日曆 payload 的**資料**（不含開視窗）。
- **仍留在大檔（facade／畫面）：** 產品 chip、表單填寫、`renderParasiteStrip`／疫苗列、日曆選擇器 DOM、Google／Apple 開啟、toast、listener、需要 `t()` 的標籤。
- **不做：** 蓋到正式 B／Pages、抽疫苗域（已另案）、重寫日曆 chooser UI、發明不存在的 parasite Map 雙寫。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。

## Surface statement (standing rules)

| Surface | Path | This proposal |
|---|---|---|
| **C** | `apps/web/c/` | **Edit / wire here** — `c/app.js`, `c/index.html` script tags |
| Shared blocks | `apps/web/domains/` | **OK to add** `domains/parasite/` (C already loads `../domains/...`) |
| **B** | `apps/web/` root passport | **Out of scope** — no silent cover |
| **A** | intro / login | Out of scope |

After Gate B adopt onto the candidate path for C: ask Victor whether to **cover C → B** (separate confirm). Cover is not part of this Gate A slice.

## Standing north star (Victor)

任何功能都應拆成獨立積木，避免在一整盒裡翻找。本 slice 只做 **Parasite**；emergency 等依同原則後續一領域一刀。本 build 不因此擴大 `builder_scope`。

## Current codebase facts (audit)

- C `apps/web/c/app.js` ~8200+ lines; parasite block ~**1826–2342** (constants through calendar open helpers), listeners ~7240+, home strip via render-coordinator `parasiteStrip`.
- Already extracted on C (script tags in `c/index.html`): `core/storage`, `core/state`, `shell/navigation`, `shell/render-coordinator`, `domains/pets`, `domains/visits`, `domains/timeline`, `domains/alerts`, `domains/medications`, `domains/vaccines` — **must not break these boots**.
- **Write truth:** `pet.parasitePrevention = { external: ParasiteRecord|null, heartworm: ParasiteRecord|null }` on the live pet in `pets[]`. Record shape: `{ productKey?, product?, lastGiven?, intervalDays, nextDue? }` (aligns with contracts `ParasiteRecord` / `ParasitePrevention`).
- **Contracts:** `ParasiteKind = 'external' | 'heartworm'`; `ParasiteSlotStatus = 'protected' | 'approaching' | 'unprotected' | 'optional'`; `getParasiteSlotStatus(pet, kind)` documented with cat heartworm optional rule and 7-day approaching window.
- **Status today:** `getParasiteStatus(nextDue)` returns only `protected|approaching|unprotected` (`PARASITE_APPROACHING_DAYS = 7`, `daysUntil`). Cat + heartworm + no `nextDue` → `optional` is applied in **`renderParasiteStrip`**, not in `getParasiteStatus`. Slot-level API (`getParasiteSlotStatus`) should land in selectors so strip / emergency can share one rule.
- **Date helpers:** `daysUntil` (~1819) and `addDays` (~798) are shared with vaccines path; inject from C (or duplicate with test parity). Do **not** add `packages/` date utils in this slice.
- **Product catalog:** `PARASITE_PRODUCT_CATALOG` / `PARASITE_PRODUCTS` / dual-cover (`isParasiteDualProduct`) — catalog meta → domain; chip markup / selected state → C.
- **`resolveParasiteProductName` / calendar titles:** use `t()` today — domain must **inject `labelOf(key)`** (or equivalent); no `t()` / `I18N` inside domain.
- **`syncParasiteNextFromLast` / `prepareParasiteNextDueFromLast`:** DOM-coupled today — domain exposes pure `computeNextDue(lastGiven, intervalDays)`; facade reads/writes inputs.
- **`saveParasiteKind`:** reads form via DOM, mutates `pp[kind]` (+ dual other kind), re-fills forms, toasts — **mutation + validate** → domain; DOM/toast/fill → facade. Dual-cover sync must preserve.
- **`dosedToday` vs past:** `saveParasiteDosedTodayAndOfferCalendar` → `saveParasiteKind({ dosedToday: true })` sets last=today, next=last+interval; `saveParasitePastAndOfferCalendar` → `prepareParasiteNextDueFromLast` then quiet save. Semantics must stay identical.
- **Calendar:** `buildParasiteCalendarPayload` uses `t()`; `openParasiteGoogleCalendar` / `openParasiteAppleCalendar` / `closeParasiteCalendarChooser` / chooser overlay stay in C. Domain returns pure payload fields (and may accept injected string builders); **no `window.open`**.
- **Vaccine row on parasite strip:** `renderVaccineStrip` stays in C (vaccines domain already exists); do not move vaccines into parasite.
- No separate parasite `localStorage` slot; graph persist is via pets graph (`schedulePetsGraphPersist` on `applySelectedPet`). **Audit note:** current `saveParasiteKind` mutates pet then re-renders strip **without** calling `applySelectedPet` — Builder must preserve this behavior unless Victor expands scope to fix persist; QA should call out data-loss risk if confirmed.

Still inlined in `c/app.js` (representative):

| Kind | Examples | This slice |
|---|---|---|
| Constants | `PARASITE_APPROACHING_DAYS`, `PARASITE_KINDS`, `PARASITE_PRODUCT_CATALOG`, `PARASITE_PRODUCTS` | **Extract** catalog + approaching window to domain |
| Pure model | `ensureParasitePrevention`, `getParasiteRecord`, `getParasiteStatus`, `isParasiteDualProduct`, next-due math | **Extract** |
| Slot status | cat heartworm → `optional` (today in strip) | **Extract** as `getParasiteSlotStatus` (PA-02) |
| Mutation | draft validate + write `pp[kind]` + dual sync | **Extract** (`saveParasiteKind` core) |
| Calendar data | nextDue + title/details inputs | **Extract** pure payload builder (inject labels) |
| i18n / view | `parasiteStatusLabel`, `parasiteKindTitle`, `parasiteProductChipLabel`, chip markup | **Stay** in C |
| DOM / session | `selectedParasiteProduct`, `pendingParasiteFocus`, `syncParasiteNextFromLast` (DOM), `fill*`, `render*`, chooser, Google/Apple open | **Stay** in C |

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

Parasite domain has **no required dependency** on visits/timeline/alerts/meds/vaccines — facades pass `pet` + injected date/label helpers. Home strip and emergency consumers stay on C facades.

## Gate A builder scope

Only these IDs are proposed for this build:

### PA-01 — Parasite controller (no DOM)

- Add `apps/web/domains/parasite/controller.js` (classic IIFE, `PetLiveWeb.domains.parasite`; mirror alerts/vaccines style).
- Public API sketch (`createController` with injected deps):

```text
PetLiveWeb.domains.parasite.createController({
  daysUntil,          // injected from C (shared with vaccines)
  addDays,            // injected from C
  todayISODate,       // injected from C
  labelOf,            // (key) => string — C wraps t() for product keys / optional chrome keys
})

  // Constants (read-only)
  .KINDS                          // ["external","heartworm"]
  .APPROACHING_DAYS               // 7
  .PRODUCT_CATALOG                // PARASITE_PRODUCT_CATALOG
  .productsForKind(kind) → [{ key, intervalDays, covers }]

  // Pure model
  .ensureParasitePrevention(pet) → ParasitePrevention   // mutates pet only to init missing object
  .getParasiteRecord(pet, kind) → ParasiteRecord|null
  .getParasiteStatus(nextDue) → "protected"|"approaching"|"unprotected"
  .isParasiteDualProduct(productKey) → boolean
  .computeNextDue(lastGiven, intervalDays) → ISODate|null
  .resolveProductName({ productKey, customValue }) → string
      // custom trim wins; else labelOf(productKey); else ""

  // Draft / mutation (pet passed in — no getCurrentPet inside domain)
  .normalizeDraft(draft) → ParasiteRecord-shaped draft
  .validateDraft(draft) → { ok, reason? }
      // reasons mirror toast keys conceptually: needProduct | needDates | order
  .applyDosedToday(draft, { today? }) → draft with last/next recomputed
  .saveParasiteKind(pet, kind, draft, { syncDual? }) → { ok, pet, syncedOtherKind?, reason? }
      // writes pet.parasitePrevention[kind]; if dual productKey, mirrors other kind
  .buildParasiteCalendarPayload(pet, kind, { title, details } | labelBuilders)
      → { title, details, nextDue } | null
      // NO window.open; strings from injected builders or prebuilt title/details
```

- Move model logic out of `c/app.js`; **no** `document`, **no** direct `t()` / `I18N`, **no** `window.open`.
- Catalog keys stay stable (`ppFrontline`, …); interval defaults (30 / 365) unchanged.
- Prefer returning structured `{ ok, reason }` from validate/save; facades map `reason` → existing toast `t(...)`.

### PA-02 — Parasite selectors (strip status; optional merge)

- Add `apps/web/domains/parasite/selectors.js` **if** slot-status helpers stay non-trivial after PA-01; otherwise merge into controller (Builder choice — prefer separate file when strip flags are shared).
- Public API sketch:

```text
PetLiveWeb.domains.parasite.createSelectors({ parasite /* controller */ })
  .getParasiteSlotStatus(pet, kind) → ParasiteSlotStatus
      // cat + heartworm + !nextDue → "optional"; else getParasiteStatus(nextDue)
  .stripFlags(pet) → { external, heartworm } each { status, record, metaHints? }
  .hasApproaching(pet) → boolean
  .hasUnprotected(pet) → boolean   // ignore optional
```

- No persistence, no DOM, no `t()`.
- Align with contracts lamp rules (`daysUntil <= 0` unprotected; `<= 7` approaching).

### PA-03 — C wiring + compatibility facades

- Update `apps/web/c/index.html`: load `../domains/parasite/controller.js` (+ `selectors.js` if split) **after** pets (and preferably after vaccines so strip consumers remain stable), **without breaking** existing alerts/meds/visits/timeline/vaccines script order; bump cache `?v=` for touched C scripts only.
- Update `apps/web/c/app.js`:
  - Compose parasite controller (+ selectors) at bootstrap (same pattern as alerts/vaccines).
  - Replace inlined helpers with facades of the **same function names** where listeners/render still expect them (`getParasiteRecord`, `getParasiteStatus`, `saveParasiteKind`, `buildParasiteCalendarPayload`, …).
  - Keep in C: `selectedParasiteProduct`, `pendingParasiteFocus`, `renderParasiteProductChips`, `fillParasiteKindForm`, `fillParasiteScreen`, `renderParasiteStrip` (calls selectors for status class), `readParasiteForm` (DOM → draft → controller), `syncParasiteNextFromLast` / `prepareParasiteNextDueFromLast` (DOM + `computeNextDue`), `saveParasitePastAndOfferCalendar`, `saveParasiteDosedTodayAndOfferCalendar`, `showParasiteCalendarChooser` / `closeParasiteCalendarChooser`, `openParasiteGoogleCalendar`, `openParasiteAppleCalendar`, shared `openGoogleCalendar` / `openAppleCalendar`.
  - `parasiteStatusLabel` / `parasiteKindTitle` / chip labels stay view-layer (`t()`).
- Leave formal B (`apps/web/app.js`, `apps/web/index.html`) unchanged.

### PA-04 — Boundary tests

- Add `qa/tests/web-parasite.test.js` (`node:test` + `vm`, same style as `web-alerts.test.js` / `web-vaccines.test.js`).
- Cover at least:
  - `getParasiteStatus`: missing / overdue / within 7 days / protected
  - `getParasiteSlotStatus`: dog unset → unprotected; cat heartworm unset → optional; cat with nextDue uses normal status
  - `computeNextDue` / interval edge (invalid days → null or default per API contract)
  - `saveParasiteKind` writes `parasitePrevention[kind]`; dual product syncs other kind; exclusive product does not wipe other
  - `validateDraft`: need product, need dates, next &lt; last rejected
  - `applyDosedToday` sets last=today and next=last+interval
  - `buildParasiteCalendarPayload` null without nextDue; payload fields present with nextDue
  - wrong pet object isolation (mutation only on passed pet)
  - domains do not touch `document` / `localStorage` / `window.open`
  - no inventing dual-write Map stores

## Public API placement summary

| Namespace | Responsibility |
|---|---|
| `PetLiveWeb.domains.parasite` | Catalog, records, status math, save/dual sync, calendar data |
| `PetLiveWeb.domains.parasite` selectors (optional) | Slot status incl. optional, strip flags |
| `c/app.js` facades | DOM, chips, strip HTML, chooser, Google/Apple open, toasts, `t()` labels |

## Likely files

### Add

- `apps/web/domains/parasite/controller.js`
- `apps/web/domains/parasite/selectors.js` (if not merged into controller)
- `qa/tests/web-parasite.test.js`

### Change

- `apps/web/c/app.js` — extract helpers to facades; compose domain; keep render/listeners/calendar open
- `apps/web/c/index.html` — script tags + cache `?v=` for new/changed C loads

### Read-only in this build

- `apps/web/app.js` / `apps/web/index.html` (formal B)
- `apps/web/c/styles.css`, `apps/web/c/i18n.js` (unless zero-behavior cache bump unavoidable — prefer avoid)
- `apps/web/core/*`, `apps/web/shell/*`, other `domains/*` (consume only; do not break boots)
- `modules/*`, `packages/*`, `contracts/*` (read for alignment; no schema rewrite)
- Medical copy / disclaimer strings (product names remain reference catalog labels via i18n keys)

If implementation reveals a read-only file must change, stop and return to Gate A with a scope modification; do not expand silently.

## Out of scope / non-goals

- Formal **B** edits or C → B cover / Pages publish (Victor confirm later).
- **Vaccines** extraction or moving `renderVaccineStrip` into parasite domain (vaccines already has its own proposal/domain).
- Rewriting calendar chooser UI, chip layout, or parasite screen HTML.
- Dual-write to any module Map for parasite (none is UI truth).
- Schema / contract markdown rewrites; IndexedDB; bundler; CSS redesign.
- Fixing pets-graph persist on parasite save **unless** Victor expands scope after QA findings (default: preserve current call pattern).
- Emergency card full extraction; listener-count refactor as a goal.
- Moving shared `daysUntil` / `addDays` into `packages/` (inject only).

## Risks

- **Date / interval math:** `addDays` + `daysUntil` midnight local semantics; approaching window = 7; invalid interval defaults to 30 in form paths — preserve exactly.
- **dosedToday vs past save:** today-marking must not leak into past path; quiet toast + calendar offer order must match.
- **Dual-cover products:** saving Revolution / NexGard Spectra on one kind mirrors the other; exclusive products must not clobber the other slot.
- **Product chip / custom interval:** custom name clears `productKey`; catalog chip sets key + intervalDays; custom interval typing must still save.
- **Calendar payload timezone:** all-day Google/Apple use compact `YYYYMMDD` + `addDays(nextDue, 1)` end — stay in C open helpers; domain only supplies `nextDue` + strings.
- **Pet-switch form drafts:** `fillParasiteScreen` / `selectedParasiteProduct` session state — facades must keep current fill-on-select behavior; no stale kind draft across pets.
- **optional vs unprotected:** cat heartworm unset must remain non-alarming (`optional` class); dog unset stays unprotected.
- **Facade recursion / bootstrap order:** load parasite after pets (+ date helpers available); wrappers must not call themselves; do not reorder meds/alerts/vaccines boots.
- **Persist gap:** if `saveParasiteKind` still skips `schedulePetsGraphPersist`, document for QA; do not silently “fix” without scope change.
- **C/B drift:** C-only wiring until cover; document so Victor does not expect Pages change.
- **`c/app.js` merge conflicts:** vaccines / pets lifecycle / other slices may touch same file — rebase onto latest C before Builder.

## Acceptance criteria

### Architecture

- [ ] `domains/parasite` exists with public API only; no DOM / `t()` / `window.open` / direct `localStorage` / private cross-domain access.
- [ ] `pets[]` / `pet.parasitePrevention` remains sole write truth; no module Map dual-write.
- [ ] Compatibility function names used by listeners remain available in `c/app.js` as thin facades.
- [ ] Alerts / meds / visits / timeline / vaccines scripts still load and boot on C.

### Behavior (C)

- [ ] Parasite screen fills external + heartworm forms from records; chips + custom + interval + dates match pre-extract.
- [ ] Save past / dosed-today / dual sync / validation toasts match pre-extract.
- [ ] Home parasite strip statuses (incl. cat heartworm optional) match pre-extract.
- [ ] Calendar chooser → Google / Apple still open with same date span semantics.
- [ ] Pet switch shows correct pet’s parasite forms/strip (no cross-pet draft bleed).
- [ ] zh-Hant / en / ja / ko dynamic chrome still refreshes; custom product names unchanged.

### Surface / tooling

- [ ] Only C + shared `domains/parasite` + QA tests changed; formal B untouched.
- [ ] Zero-build: `c/index.html` script order works under repo-root `python3 -m http.server`.
- [ ] `node --test qa/tests/*.test.js` passes including new parasite boundary tests.

## QA / review routing

- **QA required** — status lamps, dual sync, dosedToday vs past, pet-switch drafts, calendar payload null cases, facade regressions; include automated boundary tests; note persist behavior.
- **Pharmacist light** — product catalog / interval adjacency and dual-cover sync are medical-adjacent reference data (not dose authority); confirm no treatment-tone drift and catalog intervals unchanged.
- **UI light compatibility** — no intentional visual redesign; spot-check parasite screen + home strip + calendar chooser on C only.

## Rollback

- Candidate stays off mainline (`proposal/parasite-controller` or `proposals/20260826-parasite-controller/preview`).
- Roll back by removing new domain scripts/tags and restoring `c/app.js` helper blocks from the candidate diff.
- No data migration; no Pages publish in this slice.

## Follow-ups (not this Gate A)

1. Victor-confirmed C → B cover + Pages publish for shared domains + B facades.
2. Optional: if QA confirms missing pets-graph persist on parasite save, dedicated tiny fix proposal.
3. Shared date-utils extraction (`daysUntil` / `addDays`) once vaccines + parasite both consume injections.
4. Emergency card domain extraction (parasite summary composition).

## Gate

This proposal stops at Gate A. No Builder, candidate product edit, or C/B cover may start until Victor confirms.

## Notes for Victor

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
