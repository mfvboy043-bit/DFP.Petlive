---
id: 20260827-emergency-controller
title: Emergency card controller building blocks
status: adopted
author: planner
candidate_branch: "proposal/emergency-controller"
candidate_path: "proposals/20260827-emergency-controller"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Emergency card controller building blocks

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Continue the adopted `20260813-web-layered-building-blocks` later phase **Emergency** by extracting a **thin emergency domain adapter** (snapshot builders + optional copy / degrade selectors) under `apps/web/domains/emergency/`, wired first against surface **C** (`apps/web/c/`). This slice is behavior-preserving, zero-build extraction: pure composition of the snapshot passed to the existing `PetLive.emergency.generateEmergencyCard` bridge; DOM renderers (`renderEmergency*`), card chrome, clipboard I/O, and i18n `t()` stay in `c/app.js` as thin facades.

`pets[]` remains the prototype **read** truth for the card. Emergency is **mostly READ composition** — no dual-write into `modules/emergency-card` (or other module Maps). Formal **B** and GitHub Pages stay untouched until Victor separately confirms a C → B cover.

## Notes for Victor（白話）

這盒只做「緊急卡」讀取組裝積木：把「從這隻寵物＋警示＋進行中用藥＋體重，組成給緊急卡模組看的 snapshot」從超大的 `c/app.js` 抽出去。

- **這盒負責：** 組 snapshot（寵物身分／體重／警示列表／現行用藥列）、可選的「複製摘要要用的純資料」、降級區塊旗標的純判斷輔助。真正的降級邏輯仍走已有的 `PetLive.emergency.generateEmergencyCard`（含 `_degraded`）。
- **仍留在大檔（facade／畫面）：** 所有 `renderEmergency*` HTML、身分／晶片／照片、主人聯絡、疫苗／檢驗／影像 nav、複製到剪貼簿、`t()` 文案、injectFail 讀取與 local fallback。
- **刻意不做：** 再寫一套跟 `modules/emergency-card` 平行的組卡邏輯、雙寫 module Map、蓋到正式 B／Pages、整頁重畫緊急卡。

**設計選擇（為什麼是 adapter 不是大 domain）：** 緊急卡模組已經會組卡＋標記 `_degraded`。我們只要當「翻譯官」——把 `pets[]` 真相翻成 snapshot 餵給橋接。若再複製一層組裝，兩套規則容易漂掉（snapshot drift），降級文案也容易跟「真的沒資料」搞混。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。

## Surface statement (standing rules)

| Surface | Path | This proposal |
|---|---|---|
| **C** | `apps/web/c/` | **Edit / wire here** — `c/app.js`, `c/index.html` script tags |
| Shared blocks | `apps/web/domains/` | **OK to add** `domains/emergency/` (C already loads `../domains/...`) |
| **B** | `apps/web/` root passport | **Out of scope** — no silent cover |
| **A** | intro / login | Out of scope |

After Gate B adopt onto the candidate path for C: ask Victor whether to **cover C → B** (separate confirm). Cover is not part of this Gate A slice.

## Standing north star (Victor)

任何功能都應拆成獨立積木，避免在一整盒裡翻找。本 slice 只做 **Emergency**（snapshot composition + degradation through existing `PetLive.emergency` bridge）；其他領域不因此擴大 `builder_scope`。

## Current codebase facts (audit)

- C `apps/web/c/app.js`: emergency-adjacent blocks include `deriveActiveEmergencyMeds` (~845–893), `renderEmergencyMeds` (~938), vaccine/lab/imaging nav (~2512 / ~2660 / ~2677), `buildEmergencyCopyText` / owner copy helpers (~3657+), `buildEmergencySnapshot` (~3789–3811), `renderEmergencyAlertsList` / `renderEmergencyMedsFromList` / identity + degrade shell (~3813–3929), `renderEmergencyCardLocal` / `renderEmergencyCard` (~3931–4026), render-coordinator registrations `emergencyCard` (+ `paintEmergencyCardDegradedShell` onError), `emergencyVaccineNav`, `emergencyLabNav`, `emergencyImagingNav` (~4070–4085), copy-card listener (~7253).
- Already extracted on C (must not break boots): pets, visits, timeline, medications, alerts, vaccines, parasite (+ shell/storage).
- **`modules/emergency-card/index.js`**: `generateEmergencyCard(petId, ownerContact, asOfDate, { snapshot, injectFail })` — read-only composition; prefers `options.snapshot` over module Maps; sets `_degraded.{weight,alerts,medications}` when injectFail or upstream ModuleResult fails. **Adopted bridge** (`20260812-emergency-module-bridge`): C already prefers this path.
- **`apps/web/runtime/petlive.js`**: exposes `PetLive.emergency` + `PetLive.readInjectFail()` (`?injectFail=` / sessionStorage).
- **Write truth:** card does not mutate emergency stores; meds/alerts/weight come from `pets[]` (+ owner profile localStorage for contact). Snapshot fields today:

```text
{
  pet: { id, name, species, breed, gender, birthDate, chipNumber, weight, weightDate },
  latestWeight: { weight, recordedDate } | null,
  alerts: [...],
  currentMedications: [...]   // from deriveActiveEmergencyMeds(visits)
}
```

- **Degraded ≠ empty:** `_degraded.*` / `paintEmergencyCardDegradedShell` use `emergencyDegradedAlerts|Meds|Weight`; empty lists use `noAlertItem` / `noMeds`. Must preserve.
- **Local fallback:** if `PetLive.emergency.generateEmergencyCard` missing or `PetLive.call` → null → `renderEmergencyCardLocal` (direct pets[] paint, no module).
- **Copy path:** `#copy-card` uses `buildEmergencyCopyText(pet)` from **local** alerts/meds truth (not module result) — known adjacency from bridge QA; this slice may extract **payload data** but must not silently switch copy to degraded module output without Victor expanding scope.
- **Nav snippets:** `renderEmergencyVaccineNav` / Lab / Imaging stay as C facades; do **not** extract labs/imaging domains wholesale.
- **i18n:** species/breed/gender/age lines (`eSub`, `eBirthLineAge`, med course, alert type labels) stay view-layer with `t()`; domain returns raw fields / structured copy rows, injects label builders if needed for copy payload only.

Still inlined in `c/app.js` (representative):

| Kind | Examples | This slice |
|---|---|---|
| Snapshot | `buildEmergencySnapshot` | **Extract** (EM-01) |
| Active meds for card | `deriveActiveEmergencyMeds` | **Extract** into emergency adapter (or inject from medications domain helper — prefer keep inside emergency snapshot deps to avoid scope creep) |
| Degrade flags helper | mapping `_degraded` → which sections paint degrade | **Optional** pure selector (EM-02) — UI still paints strings |
| Copy payload | structured lines for `buildEmergencyCopyText` | **Optional** EM-02; clipboard + `t()` stay in C |
| Module call | `PetLive.emergency.generateEmergencyCard` + injectFail | **Stay** via C facade (EM-03) — do not reimplement |
| DOM / HTML | all `renderEmergency*`, identity, photo, owner, navs, degrade shell | **Stay** in C |
| Owner profile R/W | `loadOwnerProfile` / settings form | **Stay** in C (pass `ownerContact` into generate) |

## Design choice (required)

| Option | Verdict |
|---|---|
| **A. Thin adapter + selectors** — build snapshot (+ copy payload); call existing `PetLive.emergency.generateEmergencyCard`; preserve `_degraded` | **Prefer** |
| B. Fuller domain that re-implements composition / degrade inside `domains/emergency` | **Reject** — duplicates `modules/emergency-card`, invites snapshot drift |

Adapter responsibilities: assemble inputs from `pet` + injected getters (`getAlertsForPet`, active-meds derivation, weight shape). Module remains the single composition engine when the bridge is available.

## Dependency direction (unchained)

```text
bootstrap → shell/navigation + render coordinator
  → domain controllers / adapters
  → shared state/selectors + persistence adapters
  → runtime module adapters (PetLive.emergency)
  → modules/* public APIs → packages/shared

controllers/adapters -X-> DOM
views                 -X-> localStorage (except via injected slots)
domains               -X-> another domain's private state
modules/*             -X-> apps/web
```

Emergency adapter **must not** import alerts/medications domain private state. Facades inject getters:

```text
createAdapter({
  getAlertsForPet,       // (pet) => alerts[]
  deriveActiveMeds,      // (pet, todayISO?) => meds[]  — may live as adapter method if pure
  todayISODate,          // injected
})
```

No required hard dependency on vaccines/parasite/labs modules for EM-01…EM-04.

## Gate A builder scope

Only these IDs are proposed for this build:

### EM-01 — Emergency adapter / snapshot (no DOM)

- Add `apps/web/domains/emergency/adapters.js` **or** `controller.js` (classic IIFE, `PetLiveWeb.domains.emergency`; mirror alerts/parasite style). Prefer filename **`adapters.js`** to signal “snapshot for module bridge,” not a write controller — expose as `PetLiveWeb.domains.emergency.createAdapter` (alias `createController` only if needed for boot symmetry; document one public factory).
- Public API sketch:

```text
PetLiveWeb.domains.emergency.createAdapter({
  getAlertsForPet,     // injected from C (alerts facade / domain)
  todayISODate,        // injected from C
})

  .buildSnapshot(pet) → EmergencySnapshot
  .deriveActiveEmergencyMeds(pet, today?) → medRow[]
  // pet slice + latestWeight shape match today's buildEmergencySnapshot
```

- **NO DOM, NO `t()` / I18N** for chrome. No calls into `window.PetLive` inside the domain file (C facade owns bridge + injectFail).
- Move `deriveActiveEmergencyMeds` semantics unchanged (visit meds, skip `photo_bundle`, flatten `compound_bundle` ingredients, active course window).

### EM-02 — Optional selectors (copy payload / degrade section flags)

- Add `apps/web/domains/emergency/selectors.js` if useful without bloating EM-01:

```text
createSelectors({ adapter })

  .copyPayload(pet, {
    profile,
    labelOfAlertType,   // injected — C wraps t()
    formatMedLine,      // injected
    noneLabel,          // injected string or builder
  }) → { titleKey?, petLines fields, alertsText parts, medsText parts, owner fields }
     // structured data only — final join + t("copy*") stay in C

  .degradedSections(result) → { weight, alerts, medications }
     // thin read of result._degraded; default false if missing
```

- Do **not** invent new degrade semantics. Do **not** change copy to use module-degraded empty lists unless Victor expands scope (document: copy continues on local truth).

### EM-03 — C wiring (facades only)

- `c/index.html`: script tags for `../domains/emergency/adapters.js` (+ selectors if EM-02 ships), cache `?v=`.
- `c/app.js`: replace inline `buildEmergencySnapshot` / `deriveActiveEmergencyMeds` with adapter calls; `renderEmergencyCard` still:
  1. `adapter.buildSnapshot(pet)`
  2. `PetLive.readInjectFail()` + `PetLive.emergency.generateEmergencyCard(..., { snapshot, injectFail })`
  3. paint from result + `_degraded` (or local fallback)
- Keep **all** `renderEmergency*` HTML, `paintEmergency*`, `paintEmergencyCardDegradedShell`, owner/photo/nav, clipboard helpers in `c/app.js`.
- Preserve render-coordinator groups and onError → degraded shell.
- Must not break other domain boots / script order.

### EM-04 — QA tests

- Add `qa/tests/web-emergency.test.js` (node:test + vm load of domain scripts, same pattern as alerts/parasite).
- Cover at least:
  - snapshot shape from pet + injected alerts/meds
  - active meds: compound flatten, photo_bundle skip, inactive course excluded
  - `degradedSections` mirrors `_degraded` if EM-02 ships
  - copy payload fields stable / no `t()` inside domain
  - domain files contain no `document.` / `innerHTML` / `localStorage`

## Out of scope

- Formal **B**, GitHub Pages, A intro
- Silent C → B cover
- CSS / visual redesign of `.e-card`
- Full rewrite of emergency HTML chrome
- Dual-write into `modules/*` Maps
- Re-implementing `generateEmergencyCard` inside `domains/emergency`
- Extracting labs / imaging domains wholesale (nav snippets stay facades)
- Changing medical disclaimer / dosage authority tone
- Switching copy-card to module result when degraded (unless later proposal)
- Pet lifecycle / owner-settings storage extraction

## Likely files

| Path | Action |
|---|---|
| `apps/web/domains/emergency/adapters.js` | **Add** (EM-01) |
| `apps/web/domains/emergency/selectors.js` | **Add** if EM-02 |
| `apps/web/c/index.html` | Script tags + `?v=` |
| `apps/web/c/app.js` | Facades only — snapshot/meds/copy wiring |
| `qa/tests/web-emergency.test.js` | **Add** (EM-04) |
| `modules/emergency-card/index.js` | **Touch only if** contract comment sync needed — prefer **no change** |
| `apps/web/runtime/petlive.js` | **No change** expected |
| `apps/web/` root (B) | **No** |

## Risks

| Risk | Mitigation |
|---|---|
| Snapshot drift vs module Map path | Prefer snapshot always from pets[]; do not dual-write; tests lock snapshot fields |
| Degraded copy confused with empty-state | Keep distinct i18n keys; QA checks injectFail ≠ `noAlertItem` / `noMeds` |
| Med / alert adjacency (pharmacist) | Preserve med row fields, source tags, compound flatten; no dose UX rewrite |
| i18n on age / species / breed lines | Stay in C `paintEmergencyIdentity` / `t("eSub")` etc. |
| Copy-to-clipboard summary | Extract data only; join + clipboard stay in C; keep local-truth copy unless scope expands |
| Breaking other domain boots | Append scripts; no reorder of alerts/meds/vaccines/parasite |

## Review routing

| Reviewer | Required | Focus |
|---|---|---|
| **QA** | **required** | Snapshot parity, injectFail degrade path, local fallback, coordinator onError shell, other domains still boot |
| **Pharmacist** | **required** | Active meds derivation / display fields, alert list adjacency, degraded ≠ empty medical meaning |
| **UI** | **light required** | No intentional chrome redesign; facades still paint same hierarchy; no new card clutter |

## Acceptance criteria

- [ ] `PetLiveWeb.domains.emergency` boots on C; other domains unchanged
- [ ] `buildSnapshot(pet)` matches pre-extraction `buildEmergencySnapshot` field semantics
- [ ] C still prefers `PetLive.emergency.generateEmergencyCard` with snapshot + injectFail; `_degraded` still drives degrade chrome
- [ ] PetLive missing / call null → `renderEmergencyCardLocal` unchanged behavior
- [ ] `paintEmergencyCardDegradedShell` still registered as emergencyCard onError
- [ ] No dual-write to module Maps; no DOM/`t()` inside domain files
- [ ] All `renderEmergency*` HTML remain in `c/app.js`
- [ ] `qa/tests/web-emergency.test.js` passes under `node --test`
- [ ] Formal B / Pages untouched
- [ ] Candidate path: branch `proposal/emergency-controller` or `proposals/20260827-emergency-controller` preview — **no mainline overwrite**

## Sequencing note

May land near other C controller work that also edits `apps/web/c/app.js`. Prefer sequential Gate A builds or non-overlapping function ownership (emergency snapshot/meds/copy vs other domains' ranges).

## Post–Gate B (not this Gate A)

1. Victor confirm **cover C → B** if desired (separate).
2. Optional later: align copy-card with degraded module sections (explicit proposal).
3. Labs / imaging domain extraction (nav only stays here).
