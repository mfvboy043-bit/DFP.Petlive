---
id: 20260827-owner-profile-controller
title: Owner profile controller building blocks
status: adopted
author: planner
candidate_branch: "proposal/owner-profile-controller"
candidate_path: "proposals/20260827-owner-profile-controller"
created: 2026-08-27
updated: 2026-08-27
# Gate B: Victor 採用 2026-08-27 — C only; B cover pending
---

# Proposal: Owner profile controller building blocks

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Continue the adopted `20260813-web-layered-building-blocks` later phase **Owner profile** (listed after Cloud) by extracting the **owner-profile brain** — empty / demo / normalize / hasAny, load / save via an injected storage slot, and **pure** copy-line helpers — under `apps/web/domains/owner/`, wired first against surface **C** (`apps/web/c/`).

This slice is **architecture extraction**, not UX redesign. Prior product `20260811-owner-profile-menu` (settings form + emergency card contact) stays as adopted UX law. Form fill / save listeners, emergency owner DOM (`renderEmergencyOwner`), account-menu chrome, and Google / Drive painting stay in the shell as thin facades.

**Namespace pick:** `PetLiveWeb.domains.owner` + folder `apps/web/domains/owner/` (short name matching `pets`, `cloud`, `alerts` — not `owner-profile`).

Formal **B** and GitHub Pages stay untouched until Victor separately confirms a C → B cover.

## Notes for Victor（白話 · Feynman）

這盒只做「飼主聯絡資料」規則積木：把「空白／示範資料長什麼樣子、怎麼正規化、有沒有填過、怎麼經由 storage slot 讀寫、急診複製要用的純資料列」從超大的 `c/app.js` 抽出去——**不重畫飼主設定頁，也不搬帳號選單／Google。**

- **這盒負責：** `empty` / `demo` / `normalize` / `hasAny`；`load` / `save`（只透過注入的 `ownerProfileSlot`）；純 copy-row 結構（給急診卡複製用，**不含** `t()` / clipboard）。
- **仍留在大檔（facade／畫面）：** `fillOwnerSettingsForm` / `readOwnerSettingsForm`、表單 submit、`renderEmergencyOwner` HTML、`buildEmergencyCopyText` 組字串＋`t()`、帳號 popover／`paintAccountMenu`／`paintCloudChrome`、Google Drive。
- **刻意不做：** 蓋到正式 B／Pages、改欄位或 storage key 形狀、IndexedDB、重做設定畫面。

**為什麼獨立 `domains/owner`、不塞進 cloud／emergency：** Cloud 只「帶著」`ownerProfileSlot` 進出備份 JSON；Emergency 只「讀」聯絡資料來畫卡／複製。飼主資料是自己的 slot 真相，不該變成雲端或急診的私有狀態。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。

## Surface statement (standing rules)

| Surface | Path | This proposal |
|---|---|---|
| **C** | `apps/web/c/` | **Edit / wire here** — `c/app.js`, `c/index.html` script tags |
| Shared blocks | `apps/web/domains/` | **OK to add** `domains/owner/` (C already loads `../domains/...`) |
| **B** | `apps/web/` root passport | **Out of scope** — no silent cover |
| **A** | intro / login | Out of scope (account / Google chrome stays in shell) |

After Gate B adopt onto the candidate path for C: ask Victor whether to **cover C → B** (separate confirm). Cover is **not** part of this Gate A slice.

## Standing north star (Victor)

任何功能都應拆成獨立積木，避免在一整盒裡翻找。本 slice 只做 **Owner profile**（slot brain + pure copy helpers）；account chrome / Drive / emergency DOM 依同原則留在 shell。本 build 不因此擴大其他 domain 的 `builder_scope`。

## Current codebase facts (audit)

### C (`apps/web/c/app.js` ~3578–3782)

| Kind | Examples | This slice |
|---|---|---|
| Key / slot | `OWNER_PROFILE_KEY = "petlive-c-owner-profile"`; `ownerProfileSlot` with `fallback: demoOwnerProfile` | **Keep key + slot construction in C**; inject slot into domain |
| Shapes | `demoOwnerProfile`, `emptyOwnerProfile` | **Extract** selectors |
| R/W | `loadOwnerProfile` (`{ ...empty, ...slot.read() }`), `saveOwnerProfile` → `slot.write` | **Extract** controller (via inject) |
| Predicate | `ownerProfileHasAny` | **Extract** selector |
| Copy | `formatOwnerCopyLines` (uses `t()`) | **Extract** pure row structure; facade applies `t()` |
| Forms / DOM | `fillOwnerSettingsForm`, `readOwnerSettingsForm`, form submit, `renderEmergencyOwner` | **Stay** in C facades |
| Emergency | `buildEmergencyCopyText` passes `profile: loadOwnerProfile()` into `emergencySelectors.copyPayload` | **Keep** facade calling domain `load` |
| Cloud | `cloudController` already injects `ownerProfileSlot` into payload build/apply | **Do not break** injection contract |

### B (`apps/web/app.js` ~3697–3770) — read-only reference for later cover

- Key: `petlive-owner-profile`; slot fallback is **`emptyOwnerProfile`** (not demo).
- `loadOwnerProfile`: if `DEMO_MODE` → merge demo; else `scrubDemoOwnerProfileFromStorage()` then slot read.
- `saveOwnerProfile`: no-op write in `DEMO_MODE`; on success calls `bumpLocalDataRevision()`.
- Same field shape and `ownerProfileHasAny` as C.

This Gate A wires **C semantics** (C key + demo fallback). Cover later must re-apply B’s DEMO scrub / revision bump via injections — do **not** silently change C to B keys.

### Prior product (adopted — do not redesign)

- `20260811-owner-profile-menu` — settings entry + emergency card contact sync.
- Account / cloud chrome proposals — popover UX stays; owner domain must not own Google or account DOM.

### Already extracted on C (must not break boots)

pets, visits, timeline, medications, alerts, vaccines, parasite, emergency, cloud (+ shell/storage). Owner scripts should load with other domains, before `c/app.js`.

### Field shape (preserve — no PII schema change)

```text
{
  name, phone, email,
  emergencyName, emergencyPhone,
  address
}
```

All strings; empty profile = six empty strings. Demo showcase uses the existing 王陽明 / wang.yangming@demo.petlive sample (not real PII).

## Dependency direction (unchanged)

```text
bootstrap → shell/navigation + render coordinator
  → domain controllers
  → shared state/selectors + persistence adapters
  → runtime module adapters
  → modules/* public APIs → packages/shared

controllers -X-> DOM
views       -X-> localStorage (except via injected slots)
domains     -X-> another domain's private state
domains/owner -X-> cloud / emergency private state
modules/*   -X-> apps/web
```

Owner domain may read/write **only** through an injected `ownerProfileSlot` (`{ read, write, … }`) and optional hooks (`isDemoMode`, `onAfterSave`). No direct `document` / `t()` / `localStorage` / Google client. Cloud continues to receive the **same slot instance** from the shell; owner domain does not reach into cloud.

`pets[]` remains write truth elsewhere; owner profile is **its own slot** — never merge owner fields into pet graph objects inside this domain.

## Design choice

| Option | Verdict |
|---|---|
| **A. `domains/owner/` with selectors + thin controller** | **Prefer** — matches cloud / alerts / vaccines style; tiny brain still splits pure math vs slot I/O |
| B. Single `owner-profile.js` mega-file | Acceptable only if Builder finds split awkward; prefer A first |
| C. Fold into `domains/cloud` or `domains/emergency` | **Reject** — wrong ownership; breaks “飼主是自己的 slot” |

## Gate A builder scope

Only these IDs are proposed for this build:

### OW-01 — Owner selectors (pure)

- Add `apps/web/domains/owner/selectors.js` (classic IIFE, `PetLiveWeb.domains.owner`).
- Public API sketch:

```text
PetLiveWeb.domains.owner.createSelectors()  // no required inject for pure shapes

  .emptyProfile() → { name, phone, email, emergencyName, emergencyPhone, address }  // all ""
  .demoProfile() → showcase sample (parity with current demoOwnerProfile)
  .normalize(raw) → profile   // known keys only; coerce missing → ""; ignore unknown keys
  .hasAny(profile) → boolean  // any of the six fields truthy after normalize
  .copyRows(profile) → [
      // Structured rows ONLY — no t(), no HTML
      { kind: "ownerLine", name?, phone? },      // when name || phone
      { kind: "email", email },
      { kind: "emergency", emergencyName?, emergencyPhone? },
      { kind: "address", address },
    ]
  .isDemoShowcase(profile) → boolean
      // optional pure helper for later B scrub parity
      // (email === wang… OR name+phone demo pair) — OK to include; C may unused
```

- Domain returns **data / kinds only**; C facade `formatOwnerCopyLines` maps kinds → `t("copyOwnerLine"|…)` exactly as today.

### OW-02 — Owner controller (slot-injected)

- Add `apps/web/domains/owner/controller.js`.
- Public API sketch:

```text
PetLiveWeb.domains.owner.createController({
  selectors,
  ownerProfileSlot,          // { read, write } — required; C: petlive-c-owner-profile slot
  isDemoMode?,               // () => boolean — C may pass () => false; B cover later uses DEMO_MODE
  onAfterSave?,              // (profile) => void — B later: bumpLocalDataRevision; C optional no-op / cloud schedule if already present
})

  .load() → profile
      // C parity default: normalize({ ...empty, ...slot.read() })
      // If isDemoMode(): return normalize({ ...empty, ...demo }) without requiring slot write
  .save(profile) → boolean
      // If isDemoMode(): return false (B parity); else slot.write(normalize(profile)); onAfterSave if ok
  .hasAny(profile?) → boolean  // optional convenience → selectors.hasAny(profile ?? load())
```

- Controller **must not** construct storage keys or call `localStorage` directly.
- Controller **must not** create a second slot — shell owns the singleton `ownerProfileSlot` shared with cloud.

### OW-03 — C wiring + facades

- `c/index.html`: script tags for `../domains/owner/selectors.js` + `controller.js` (+ cache `?v=`), after `core/storage` and before `c/app.js` (near other domains; before cloud is fine — owner does not depend on cloud).
- `c/app.js`:
  - Keep `OWNER_PROFILE_KEY` + `ownerProfileSlot = createJsonSlot({ key, fallback, validate })` in C (fallback may continue to call domain `demoProfile` or a thin wrapper).
  - Replace inline `emptyOwnerProfile` / `demoOwnerProfile` / `loadOwnerProfile` / `saveOwnerProfile` / `ownerProfileHasAny` bodies with same-named facades → domain.
  - `formatOwnerCopyLines`: call `selectors.copyRows` then apply existing `t()` mapping.
  - Keep `fillOwnerSettingsForm` / `readOwnerSettingsForm` / form submit / `renderEmergencyOwner` / account menu handlers in C.
  - `buildEmergencyCopyText` / emergency selectors: continue `profile: loadOwnerProfile()` (facade → domain load).
  - Pass the **same** `ownerProfileSlot` instance into `cloudController` as today — do not fork slots.
- Do **not** edit formal B / `auth/google-drive.js` / account popover markup this slice.

### OW-04 — QA / `qa/tests/web-owner.test.js`

- Node `vm` load of domain scripts (same pattern as `web-cloud.test.js` / `web-emergency.test.js`).
- Cover: empty vs demo shapes; `normalize` strips unknown keys / fills missing; `hasAny` true/false; `copyRows` kinds for partial profiles; load merges slot + empty; save writes normalized object via fake slot; demo-mode load/save parity; domain never touches `document` / real `localStorage`.
- Existing `qa/tests/*.test.js` must still pass.

## Recommended approach (Builder)

1. Add `domains/owner/selectors.js` + `controller.js` with C-parity field shapes.
2. Unit-test domain in isolation (OW-04).
3. Wire C facades; verify cloud still reads/writes the same `ownerProfileSlot`; emergency copy still shows owner lines.
4. Leave B inline until Victor confirms cover; contrast.md should say cover = swap B helpers → same domain + inject `DEMO_MODE` / scrub / `bumpLocalDataRevision`.

## Likely files

### Add

- `apps/web/domains/owner/selectors.js`
- `apps/web/domains/owner/controller.js`
- `qa/tests/web-owner.test.js`

### Change

- `apps/web/c/app.js` — extract owner brain to facades; compose domain; keep forms / emergency DOM / account chrome; keep cloud slot injection
- `apps/web/c/index.html` — script tags + cache `?v=` for new/changed C loads

### Read-only in this build

- `apps/web/app.js` / `apps/web/index.html` (formal B) — **reference for later cover, not edit**
- `apps/web/auth/google-drive.js`
- `apps/web/domains/cloud/*`, `apps/web/domains/emergency/*` (do not change APIs; owner must not break their injections)
- `apps/web/c/styles.css`, `apps/web/c/i18n.js` (unless unavoidable cache bump — prefer avoid)
- Other `domains/*`, `core/*`, `shell/*` (do not break boots)
- `modules/*`, `packages/*`, `contracts/*`
- Owner-settings markup / account popover redesign

If implementation reveals a read-only file must change, stop and return to Gate A with a scope modification; do not expand silently.

## Out of scope / non-goals

- Formal **B** edits or C → B cover / Pages publish (Victor confirm later).
- Redesigning owner-settings screen / account popover / Google chrome.
- Moving `paintCloudChrome` / `paintAccountMenu` / Google Drive / GIS into owner domain.
- Changing storage key shapes (`petlive-c-owner-profile` vs formal `petlive-owner-profile`) or PII field set.
- IndexedDB (separate proposal).
- Dual-write into any `modules/*` Map; schema / contract changes; bundler.
- Extracting pet share lines (`formatPetShareLines`) or full emergency copy orchestration into owner (only owner copy-rows).
- Medical copy / disclaimer tone changes (`copyDisclaimer` stays facade).

## Risks

- **Cloud slot fork:** creating a second slot or changing key breaks `buildCloudPayload` / `applyCloudPayload` ownerProfile round-trip. Must inject the **same** C `ownerProfileSlot` instance into cloud as today.
- **C vs B fallback drift:** C uses demo as slot fallback; B uses empty + DEMO scrub. Domain must not force B semantics onto C in this slice; cover must re-inject B behavior.
- **Demo write contamination:** saving demo showcase into real storage (or failing to no-op under demo mode on later B cover). OW-02 `isDemoMode` + normalize help; C keeps current write behavior unless documented.
- **Copy-row / i18n drift:** wrong `kind` → wrong `t()` key → emergency share text regression. Facade mapping must preserve existing keys (`copyOwnerLine`, `copyOwnerEmail`, `copyOwnerEmergency`, `copyOwnerAddress`, `copyOwnerEmpty`).
- **Empty vs filled emergency card:** `hasAny` false-negative shows empty copy when data exists; false-positive hides empty state. Unit-test six-field OR.
- **Facade recursion / boot order:** owner scripts after storage; wrappers must not call themselves; cloud still boots with slot.
- **PII / key leakage:** do not hardcode formal `petlive-owner-profile` inside domain; keys stay in shell injection.
- **C/B drift:** C-only wiring means Pages will not change until cover — document for Victor.
- **Medical tone:** owner contact is not clinical advice; do not alter disclaimer strings.

## Acceptance criteria

### Architecture

- [ ] `domains/owner` exists with public selectors + controller APIs; no DOM / `t()` / direct `localStorage` / private cross-domain access.
- [ ] Load/save only via injected `ownerProfileSlot`; shell still constructs the slot with C key.
- [ ] Compatibility names (`loadOwnerProfile`, `saveOwnerProfile`, `ownerProfileHasAny`, `emptyOwnerProfile`, `demoOwnerProfile`, `formatOwnerCopyLines`) remain in `c/app.js` as thin facades.
- [ ] Cloud still receives the same `ownerProfileSlot` in `createController({ … ownerProfileSlot })`; payload ownerProfile round-trip unchanged.
- [ ] Other domain scripts still load and boot on C.

### Behavior (C)

- [ ] Owner settings form fill / save / persistence parity with current C.
- [ ] Emergency owner block empty vs filled parity (`renderEmergencyOwner` + `hasAny`).
- [ ] Emergency copy card includes owner lines / empty line via facade `t()` mapping from `copyRows`.
- [ ] Demo fallback / showcase sample shape unchanged for C.
- [ ] zh-Hant / en / ja / ko: copy/owner chrome still goes through `t()` in facade; user-authored contact strings stay as entered.
- [ ] No writes to formal `petlive-owner-profile` from C.

### Surface / tooling

- [ ] Only C + shared `domains/owner` + QA tests changed; formal B + auth untouched.
- [ ] Zero-build: `c/index.html` script order works under repo-root `python3 -m http.server`.
- [ ] `node --test qa/tests/*.test.js` passes including new `web-owner.test.js`.
- [ ] No silent C → B cover or Pages publish in this slice.

## QA / review routing

- **QA required** — normalize / hasAny / load-save via fake slot; copyRows kinds; demo-mode guards; cloud still sees same slot; emergency facade still calls domain load; C boot; automated OW-04.
- **Pharmacist: skip** — no medication / dose / drug naming; medical disclaimer strings unchanged.
- **UI light** — no intentional visual redesign; spot-check owner-settings form + emergency owner block + copy text on C only.

## Rollback

- Candidate stays off mainline (`proposal/owner-profile-controller` or `proposals/20260827-owner-profile-controller/preview`).
- Roll back by removing new domain scripts/tags and restoring `c/app.js` owner helper blocks from the candidate diff.
- No data migration; no Pages publish in this slice.

## Follow-ups (not this Gate A)

1. Victor-confirmed **C → B cover**: replace B inline owner helpers with `domains/owner`; inject `DEMO_MODE`, scrub helper, `onAfterSave → bumpLocalDataRevision`; keep formal key `petlive-owner-profile`; then Pages publish per standing rules.
2. IndexedDB / durable owner store — separate proposal.
3. Account popover / Google chrome extraction — not owner domain.

## Gate

This proposal stops at Gate A. No Builder, candidate product edit, or C/B cover may start until Victor confirms.

## Notes for Victor

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
