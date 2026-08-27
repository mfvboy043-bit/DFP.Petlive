---
id: 20260827-cloud-controller
title: Cloud（雲端）controller building blocks
status: adopted
author: planner
candidate_branch: "proposal/cloud-controller"
candidate_path: "proposals/20260827-cloud-controller"
created: 2026-08-27
updated: 2026-08-27
# Gate B: Victor 採用 2026-08-27 — surgical land on main (C + domains/cloud; B cover pending)
---

# Proposal: Cloud（雲端）controller building blocks

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Continue the adopted `20260813-web-layered-building-blocks` later phase **Cloud** by extracting a **Cloud domain** (pure sync-meta / fingerprint selectors + payload mutation controller) under `apps/web/domains/cloud/`, wired first against surface **C** (`apps/web/c/`). This slice is **architecture extraction**, not UX redesign: prior `20260825-cloud-sync-popover` (popover + `localDirty`) and reconcile UX stay as adopted product rules; we move the **brain** (fingerprints, conflict checks, seed-only, sync-meta math, `buildCloudPayload` / `applyCloudPayload`) behind `PetLiveWeb.domains.cloud` public APIs.

**Source of truth for domain APIs: formal B** (`apps/web/app.js` ~7880–8600+), which already owns the full reconcile / sync-meta stack. C today has a thinner stub (payload build/apply + chrome; no sync-meta; reconcile UI no-op). Wire **C first** with injected storage slots + stub session / **no live Drive calls**, so C still boots safely. Formal **B** and GitHub Pages stay untouched until Victor separately confirms a C → B cover (cover must replace B’s inline helpers with the same domain and keep B’s richer reconcile facades + Google transport).

## Notes for Victor（白話 · Feynman）

這盒只做「雲端同步」規則積木：把「怎麼判斷衝突、怎麼算 dirty、怎麼組／套用備份 JSON」從超大的 `app.js` / `c/app.js` 抽出去——**不重畫帳號選單，也不搬 Google Drive。**

- **這盒負責：** fingerprint／衝突偵測、seed-only／fresh-device 判斷、sync-meta 加減（revision dirty）、狀態 **enum／key**（不是直接 `t()`）、`buildCloudPayload`／`applyCloudPayload`（含 `stripHeavyMedia`）、可選 seed 清場輔助。
- **仍留在大檔（facade／畫面）：** `paintCloudChrome`、帳號 popover DOM、`scheduleCloudBackup` timer、`reconcileCloudOnBoot` 編排（呼叫 Drive adapter）、intro A 登入線、Google GIS。
- **刻意不做：** 把 `auth/google-drive.js` 搬進 domain、在 C 上真連 Drive、蓋到正式 B／Pages、重做 popover UX。

**為什麼 B 當邏輯母本、C 先接線：** B 已經有完整 reconcile 腦；C 是討論面且故意沒 OAuth。抽出來的積木以 B 行為為準，C 用 stub session／注入的 `petlive-c-*` 槽位接上，避免討論機誤拉雲端蓋掉本機。之後 cover 時再把 B 的 inline helper 換成同一套 domain。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。

## Surface statement (standing rules)

| Surface | Path | This proposal |
|---|---|---|
| **C** | `apps/web/c/` | **Edit / wire here** — `c/app.js`, `c/index.html` script tags |
| Shared blocks | `apps/web/domains/` | **OK to add** `domains/cloud/` (C already loads `../domains/...`) |
| **B** | `apps/web/` root passport | **Out of scope** — no silent cover |
| **A** | intro / login | Out of scope (facade stays in shell; domain must not own intro DOM) |
| Transport | `apps/web/auth/google-drive.js` | **B-only; do not move** — inject upload/download/session adapters from shell |

After Gate B adopt onto the candidate path for C: ask Victor whether to **cover C → B** (separate confirm). Cover is not part of this Gate A slice. Cover note: port B’s richer reconcile facades onto the domain (or keep facades calling domain) while leaving GIS/Drive in `auth/`.

## Standing north star (Victor)

任何功能都應拆成獨立積木，避免在一整盒裡翻找。本 slice 只做 **Cloud**（sync-meta + payload brain）；account chrome / Drive transport 依同原則留在 shell。本 build 不因此擴大 `builder_scope`。

## Current codebase facts (audit)

### B — real cloud brain (`apps/web/app.js` ~7880–8600+)

| Kind | Examples | This slice |
|---|---|---|
| Seed / freshness | `isSeedOnlyPets`, `isSeedOnlyCloudPayload`, `isFreshDevice`, `hasRealLocalData`, `hasStoredPetsGraph` | **Extract** selectors (inject seed-id list / graph-presence) |
| Fingerprints / conflict | `localCloudGraphFingerprint`, `cloudPayloadGraphFingerprint`, `hasCloudGraphConflict` | **Extract** selectors |
| Reconcile UI state | `setCloudReconcileState`, `paintReconcileUi`, `isCloudReconcileBusy`, module-level `cloudReconcileState` | **Stay** in shell facade (DOM + `t()`) |
| Sync meta | `emptySyncMeta`, `readSyncMeta`, `writeSyncMeta`, `isLocalDirty`, `bumpLocalDataRevision`, `markCloudSynced` | **Extract** (storage via injected slot / key) |
| Status copy | `accountSyncStatusText` | **Extract** pure status **enum/key** → facade maps with `t()` |
| Seed wipe | `clearSeedPetsFromMemory` | **Extract** optional controller helper (mutate via injected pets graph refs) or keep facade calling domain predicate |
| Orchestration | `reconcileCloudOnBoot`, `scheduleCloudBackup`, `pushCloudBackup` / pull, `initIntroAndCloud` | **Stay** in shell (calls Drive adapter + domain) |
| Payload | `stripHeavyMedia`, `buildCloudPayload`, `applyCloudPayload` | **Extract** controller |
| Chrome | `paintCloudChrome`, account menu DOM | **Stay** in shell |
| Keys | `petlive-sync-meta`, `petlive-pets-graph`, formal slots | B cover later; domain must accept injected keys/slots |
| Demo | `DEMO_MODE`, `suppressSyncMetaBump` | Inject flags into controller; preserve no-bump / no-apply when demo |

### C — thinner stub (`apps/web/c/app.js` ~7297+)

- Has: `stripHeavyMedia`, `buildCloudPayload`, `applyCloudPayload` (weaker than B: **no** `DEMO_MODE` / seed-only reject on apply), `DESIGN_ACCOUNT_PREVIEW`, `paintReconcileUi` hide/no-op, `scheduleCloudBackup` / `pushCloudBackup` / `pullCloudBackup`, `initIntroAndCloud`, `paintCloudChrome`.
- **Missing vs B:** entire sync-meta stack (`readSyncMeta` / dirty / bump / mark synced), fingerprint conflict, `reconcileCloudOnBoot` richness, seed wipe on boot.
- Storage: `petlive-c-*` (e.g. `petlive-c-pets-graph`); **no** `petlive-c-sync-meta` yet — CL-03 may add C-scoped sync-meta key via injection when wiring domain (must not write formal `petlive-sync-meta` from C).
- Omits Google auth scripts by design; `googleDriveAuth` may be null → stub session for chrome.

### Transport (must stay out of domain)

- `apps/web/auth/google-drive.js` → `PetLiveWeb.auth.googleDrive` (GIS + Drive file API).
- Domain **must not** import GIS, call Drive, or hardcode token/profile keys.
- Shell injects adapters: `{ getSession, uploadJson, downloadJson }` (C: null/stub; B later: live module).

### Prior product (adopted — do not redesign)

- `20260825-cloud-sync-popover` — account popover UX + `localDirty`.
- Related reconcile UX proposals — boot restore / conflict hold rules remain product law; this proposal only relocates implementation.

### Already extracted on C (must not break boots)

pets, visits, timeline, medications, alerts, vaccines, parasite, emergency (+ shell/storage). Cloud scripts load after shared domains, before/with `c/app.js` as needed.

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
domains/cloud -X-> auth/google-drive.js / GIS / Drive HTTP
modules/*   -X-> apps/web
```

Cloud domain may read/write **only** through injected refs: pets arrays, `appState` currentPetId, storage slots (`petsGraph`, owner profile, alerts, photos, labs, **syncMeta**), and optional hooks (`hydratePetPhotos`, `applySelectedPet`, `scheduleCloudBackup`). No direct `document` / `t()` / Google client.

## Gate A builder scope

Only these IDs are proposed for this build:

### CL-01 — Cloud selectors (pure)

- Add `apps/web/domains/cloud/selectors.js` (classic IIFE, `PetLiveWeb.domains.cloud`).
- Move / mirror **B** pure helpers: seed-only checks, fresh-device / real-local predicates (with injections), fingerprints, conflict detection, sync-meta empty/normalize/dirty math, status **keys** (not localized strings).
- Public API sketch:

```text
PetLiveWeb.domains.cloud.createSelectors({
  // Injections — no hard-coded petlive-* vs petlive-c-* inside pure math where avoidable
  getSeedPetIds,              // () => string[]  — parity with SEED_PETS ids
  hasStoredPetsGraph,         // () => boolean
  readPetsGraphSnapshot,      // () => { pets } | null  — for hasRealLocalData
  readSyncMeta,               // () => meta        — or pass meta object into pure fns
  // Optional: getLocalPets / getCloudReconcileSnapshot for status resolver
})

  .isSeedOnlyPets(petList) → boolean
  .isSeedOnlyCloudPayload(payload) → boolean
  .isFreshDevice({ meta, hasStoredGraph }) → boolean   // pure form preferred
  .hasRealLocalData({ meta, graphPets, memoryPets }) → boolean
  .localCloudGraphFingerprint(petList) → string
  .cloudPayloadGraphFingerprint(payload) → string
  .hasCloudGraphConflict({ localPets, payload, meta, ... }) → boolean
  .emptySyncMeta() → { localRevision, lastSyncedRevision, lastCloudUpdatedAt }
  .normalizeSyncMeta(raw) → meta
  .isLocalDirty(meta) → boolean
  .nextBumpMeta(meta) → meta
  .nextMarkSyncedMeta(meta, cloudUpdatedAt) → meta
  .accountSyncStatusKey({ signedIn, reconcileState, reconcilePhase, conflict, meta, lastBackupAt, hasRealLocal })
       → "accountPlanLocal" | "accountSyncRestoring" | "accountSyncChecking"
         | "accountSyncError" | "accountSyncConflict" | "accountSyncDirty"
         | "accountSyncOk" | "accountSyncFirstBackup" | "accountSyncPending"
```

- Domain returns **i18n keys / enums only**; C facade `accountSyncStatusText` = `t(selectors.accountSyncStatusKey(...))`.

### CL-02 — Cloud controller

- Add `apps/web/domains/cloud/controller.js`.
- `buildCloudPayload` / `applyCloudPayload` / `stripHeavyMedia`; `bumpLocalDataRevision` / `markCloudSynced` via injected sync-meta storage; optional `clearSeedPetsFromMemory` helper.
- Public API sketch:

```text
PetLiveWeb.domains.cloud.createController({
  selectors,
  getPets, getArchivedPets,           // or mutable array refs
  getCurrentPetId, setCurrentPetId,
  petsGraphSlot, ownerProfileSlot, ownerAlertsSlot,
  suppressedAlertsSlot, petPhotosSlot, labReportsSlot,
  syncMetaSlot,                       // { read, write } — C: petlive-c-sync-meta; B later: petlive-sync-meta
  isDemoMode,                         // () => boolean
  getSuppressSyncMetaBump, setSuppress… // or pass flag into bump
  onAfterApply,                       // hydratePetPhotos + applySelectedPet
  scheduleCloudBackup,                // optional hook after bump
})

  .stripHeavyMedia(value) → value
  .buildCloudPayload() → payload v1
  .applyCloudPayload(payload) → boolean
       // B parity: reject DEMO_MODE, invalid payload, seed-only cloud
  .bumpLocalDataRevision() → void
  .markCloudSynced(cloudUpdatedAt) → void
  .clearSeedPetsFromMemory() → void   // optional; only if seed-only
```

- Payload shape (preserve):

```text
{
  version: 1,
  updatedAt: ISO,
  pets, archivedPets, currentPetId,
  ownerProfile, petAlerts, suppressedAlerts, petPhotos, labReports
}
```

### CL-03 — C wiring + facades

- `c/index.html`: script tags for `../domains/cloud/selectors.js` + `controller.js` (+ cache `?v=`).
- `c/app.js`: replace inline payload helpers with domain; add thin facades; inject **C** storage keys (`petlive-c-*`); wire sync-meta slot if missing; keep `DESIGN_ACCOUNT_PREVIEW`, hide reconcile bar, **no auto Drive** when `googleDriveAuth` null/unconfigured.
- Keep in C facades: `paintCloudChrome`, account menu, `scheduleCloudBackup`, `initIntroAndCloud`, push/pull that no-op safely without session.
- Do **not** edit formal B / `auth/google-drive.js` this slice.

### CL-04 — QA / `qa/tests/web-cloud.test.js`

- Node `vm` load of domain scripts (same pattern as `web-vaccines.test.js`).
- Cover: seed-only true/false; fingerprint equality; conflict when real local ≠ cloud and not fresh; sync-meta dirty/bump/markSynced; `stripHeavyMedia` drops heavy keys / large data-URLs; `buildCloudPayload` shape; `applyCloudPayload` rejects seed-only / demo and replaces graph on valid payload; status key matrix (dirty / conflict / restoring / local plan).
- Existing `qa/tests/*.test.js` must still pass.

## Recommended approach (Builder)

1. **Copy logic from B** into `domains/cloud/*` (not from C’s weaker apply).
2. Unit-test domain in isolation (CL-04) against B semantics.
3. Wire C with stubs: sync-meta on `petlive-c-sync-meta` (or injected key), session preview, no Drive.
4. Leave B inline until Victor confirms cover; contrast.md should say cover = swap B helpers → same domain + keep GIS.

## Likely files

### Add

- `apps/web/domains/cloud/selectors.js`
- `apps/web/domains/cloud/controller.js`
- `qa/tests/web-cloud.test.js`

### Change

- `apps/web/c/app.js` — extract cloud brain to facades; compose domain; keep chrome / timers / intro
- `apps/web/c/index.html` — script tags + cache `?v=` for new/changed C loads

### Read-only in this build

- `apps/web/app.js` / `apps/web/index.html` (formal B) — **logic source to read, not edit**
- `apps/web/auth/google-drive.js` — transport stays B-only
- `apps/web/c/styles.css`, `apps/web/c/i18n.js` (unless unavoidable cache bump — prefer avoid)
- Other `domains/*`, `core/*`, `shell/*` (do not break boots)
- `modules/*`, `packages/*`, `contracts/*`
- Account popover markup / prior sync-popover UX redesign

If implementation reveals a read-only file must change, stop and return to Gate A with a scope modification; do not expand silently.

## Out of scope / non-goals

- Formal **B** edits or C → B cover / Pages publish (Victor confirm later).
- Moving `auth/google-drive.js` into `domains/cloud` (transport ≠ domain). Optional later `domains/cloud/adapters` note only — **not** this `builder_scope`.
- Enabling live OAuth / Drive on C; shipping GIS scripts on C.
- Redesigning account popover, reconcile bar visuals, or intro A marketing.
- Dual-write / schema change of cloud JSON `version`; IndexedDB; bundler; S3.
- Extracting pets lifecycle / other domains.
- Silent overwrite of formal `petlive-sync-meta` from C discussion storage.

## Risks

- **Data loss on `applyCloudPayload`:** replaces in-memory pets + writes graph/slots — wrong call wipes owner data. Must keep B guards: reject invalid / seed-only / `DEMO_MODE`; C wiring must not auto-pull Drive.
- **Wrong conflict → wipe local:** `hasCloudGraphConflict` false-negative + auto restore could overwrite real local with cloud. Fingerprint + dirty hold rules must match B; C must not run B’s auto `reconcileCloudOnBoot` against live Drive.
- **Sync-meta key C vs B:** C must use `petlive-c-*` (e.g. `petlive-c-sync-meta`); never write formal `petlive-sync-meta` / `petlive-pets-graph` from C. Injection mistake = cross-contamination between discussion and formal passport.
- **Seed-only wipe:** `clearSeedPetsFromMemory` / reject seed cloud payload — false positive clears real pets; false negative applies demo seed from cloud.
- **`DEMO_MODE`:** bump/apply must no-op like B; C may lack demo flag — inject `() => false` explicitly, do not accidentally omit guard when covering B later.
- **Facade recursion / boot order:** cloud scripts after storage/state; wrappers must not call themselves; other domains still boot.
- **C/B drift:** C gains sync-meta brain while B stays inline until cover — document so Victor does not expect Pages change.
- **Heavy media strip regression:** missing strip keys bloat Drive JSON / fail upload; over-strip drops needed fields.
- **Status string drift:** domain returns keys; facade must keep mapping to existing i18n (`accountSyncDirty` etc.) — no new diagnostic tone.

## Acceptance criteria

### Architecture

- [ ] `domains/cloud` exists with public selectors + controller APIs; no DOM / GIS / Drive HTTP / private cross-domain access.
- [ ] Sync-meta + payload mutations only via injected slots/refs; transport stays in shell/`auth`.
- [ ] Compatibility names used by chrome/listeners remain in `c/app.js` as thin facades.
- [ ] Other domain scripts still load and boot on C.

### Behavior (C)

- [ ] `buildCloudPayload` / `applyCloudPayload` / `stripHeavyMedia` match B semantics (guards included) when exercised via domain.
- [ ] Fingerprint + conflict + dirty math match B unit expectations (CL-04).
- [ ] C boots without Google scripts; `DESIGN_ACCOUNT_PREVIEW` chrome still works; reconcile bar stays hidden/no-op unless explicitly expanded later.
- [ ] No writes to formal `petlive-*` sync/graph keys from C — only `petlive-c-*` (or injected C keys).
- [ ] `scheduleCloudBackup` / push/pull remain safe no-ops or preview-only when Drive session absent.
- [ ] zh-Hant / en / ja / ko: status chrome still goes through `t(key)` in facade when status keys are shown.

### Surface / tooling

- [ ] Only C + shared `domains/cloud` + QA tests changed; formal B + `auth/google-drive.js` untouched.
- [ ] Zero-build: `c/index.html` script order works under repo-root `python3 -m http.server`.
- [ ] `node --test qa/tests/*.test.js` passes including new `web-cloud.test.js`.

## QA / review routing

- **QA required** — apply guards, conflict/dirty matrix, seed-only, sync-meta key injection, C boot without Drive, facade regressions; automated boundary tests (CL-04).
- **Pharmacist: skip** — no medication / dose / drug naming in this slice.
- **UI light** — no intentional visual redesign; spot-check account chrome / status string keys only on C (popover already adopted).

## Rollback

- Candidate stays off mainline (`proposal/cloud-controller` or `proposals/20260827-cloud-controller/preview`).
- Roll back by removing new domain scripts/tags and restoring `c/app.js` cloud helper blocks from the candidate diff.
- No data migration; no Pages publish in this slice.

## Follow-ups (not this Gate A)

1. Victor-confirmed **C → B cover**: replace B inline cloud helpers with `domains/cloud`; keep `auth/google-drive.js`; preserve reconcile facades + intro A; then Pages publish per standing rules.
2. Optional thin `domains/cloud/adapters` documentation for upload/download injection shapes (still no GIS inside domain).
3. If C should simulate reconcile bar for design review — separate UX proposal (not this architecture slice).

## Gate

This proposal stops at Gate A. No Builder, candidate product edit, or C/B cover may start until Victor confirms.

## Notes for Victor

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
