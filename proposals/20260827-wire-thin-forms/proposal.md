---
id: 20260827-wire-thin-forms
title: "Wave 2 — thin form-save + screen-paint orchestration wires (C)"
status: proposed
author: planner
candidate_branch: "cursor/wire-thin-forms-6f84"
candidate_path: "proposals/20260827-wire-thin-forms"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Wave 2 — wire-thin form/paint orchestration (C)

Companion: `state.yaml` (v2 source of truth for gates / iteration).

**Gate A signal:** Victor 2026-08-27 —「第2波，請總指揮開始指揮」→ Orchestrator Wave 2. Parent may flip Gate A after this draft; file keeps `gate_a.status: pending` until that flip.

**Builds on (do not redo):**
`20260827-wire-bundles` (shell wire bundles: photo-crop / app-nav / account-chrome / intro-cloud),
`20260827-small-brains` (Wave 1 pure labels / breed face resolve / emergency copy),
`20260827-leftover-cleanup-17` (form pure validate/payload helpers, pets-graph door, account markup).

## Goal

Further thin the C facade **big wire box** by moving **form-save + screen-paint orchestration** (read form → domain controller → toast/focus/go/render, or call domain renderer → assign DOM) into `shell/` thin coordinators with injected callbacks. Behavior-preserving. **C only** until Gate B. No new domain brains; no medical algorithm moves.

## Audit (read-only, C — post Wave 1 / wire-bundles)

| Cluster | Facade today (~lines) | Still fat? | Why Wave 2 |
|---|---|---|---|
| **A** Alert form save | `saveAlertFromForm` ~53 (`c/app.js` ~742) | Yes | Pure sequence over `alertsController` + toast/reset/`applySelectedPet` |
| **B** Parasite form save | `saveParasiteKind` ~58 (~1007) | Yes | Read form → optional dosedToday DOM sync → controller → fill/strip/toast |
| **C** Breed form sync | `syncBreedFields` ~49 (~2604) | Yes | Beyond Wave 1 `resolveBreedSearchFaceValue`: expand/collapse chip HTML + select sync |
| **D** Emergency card paint | `renderEmergencyCard` ~80 (~2239) | Yes | Inject/generate → degraded sections → `emergencyRenderer` HTML → DOM assign |
| *(skip)* Imaging open | `openVisitImaging` ~32 | Thin | Low ROI vs risk of mixing timeline imaging state |
| *(skip)* Archive confirm | `confirmArchivePet` ~34 | Medium | Lifecycle + history replace; defer unless Wave 2.1 |
| *(skip)* Mega handlers | e.g. `saveVisitWeightAtIndex` ~691 | Fat but **wrong wave** | Domain/visit brain, not thin orchestration |

## In scope (C only) — clusters **A–D**

### A — Alert form save wire (`shell/` thin coordinator)

- Extract orchestration from `saveAlertFromForm` into e.g. `shell/alert-form.js` → `PetLiveWeb.shell.alertForm` (name flexible):
  - Read DOM draft fields (or accept pre-read draft + editId)
  - Call injected `alerts.validate` / `create` / `update`
  - Map failure → toast / persistence failure callbacks
  - On success: reset form + refresh selection callbacks
- **Optional sibling (same module, same PR if cheap):** `deleteAlertById` orchestration (controller → toast → reset-if-editing → refresh) — only if it stays pure wire; do not expand into alert list render.
- Facade keeps: element refs, `selectedAlertType` / severity state, `t()`, `showToast`, `showPersistenceFailure`, `resetAlertForm`, `applySelectedPet`, live controller instances.
- Do **not** move `alertsController` validate/create/update algorithms.

### B — Parasite form save wire

- Extract `saveParasiteKind` orchestration into e.g. `shell/parasite-form.js`:
  - Sequence: read draft → optional `applyDosedToday` + write-back last/interval/next inputs → `saveParasiteKind` controller → sync other kind form → fill + strip render → quiet/toast branch (dual product toast key)
- Inject: `readParasiteForm`, `parasiteController`, DOM get/set helpers, `fillParasiteKindForm`, `renderParasiteStrip`, `showToast` / `t`, `isParasiteDualProduct`, `parasiteKindTitle`, `parasiteTodayISODate`.
- Keep persist pattern comment semantics: **no** new `applySelectedPet` / `schedulePetsGraphPersist` unless already present (today: absent).
- Do **not** move product catalog / due math / dual-sync brain out of parasite domain.

### C — Breed form sync wire

- Extract `syncBreedFields` face wiring into e.g. `shell/breed-form.js` (or extend a thin breed shell helper — **not** back into domain algorithm):
  - Species gate (`other` → custom sentinel + hide results)
  - Expanded vs collapsed chip HTML assign + class toggles
  - `setSelectedBreed` / expand toggle callbacks
  - Missing catalog → hint HTML (same copy as today)
- Wave 1 already moved pure `resolveBreedSearchFaceValue` into `domains/breed/` — **do not redo**; this cluster is the remaining DOM sync orchestration.
- Facade keeps: breedController expand state, `getBreedListForSpecies` / groups, chip render helpers (or inject them), listeners.

### D — Emergency card paint orchestration

- Extract `renderEmergencyCard` sequence into e.g. `shell/emergency-paint.js`:
  - Optional `PetLive.emergency.generateEmergencyCard` call path + local fallback
  - Degraded section decisions → assign weight / alerts / meds HTML via injected `emergencyRenderer` + list render callbacks
  - Identity paint + owner + pet photo callbacks
- Inject: `loadOwnerProfile`, `buildEmergencySnapshot`, `call`/`readInjectFail`, DOM nodes / setters, `syncAlertNavTone`, `renderEmergencyAlertsList` / `renderEmergencyMedsFromList`, `t`.
- Do **not** move timeline morph/reconcile, emergency med end-date algorithms, or copy-card text builders (Wave 1 / leftover already domain).

### E — Facade thin + script tags (umbrella)

- Wire A–D on **surface C only**; bump `?v=` on new/changed shell scripts in `c/index.html` (load before `c/app.js`).
- Classic IIFE + `PetLiveWeb.shell.*`; zero-build.
- Prefer small qa unit tests for pure sequencing helpers where cheap (mock injects); `node --check` on touched JS.
- Prefer **one shell module per cluster** (or one shared `shell/form-wires.js` only if Builder finds duplication pain — default = separate files matching wire-bundles style).

## Out of scope

- Formal B cover / `apps/web/app.js` / Pages until Gate B
- Wave 1 small brains (done) — labels, frequency, breed face resolve, emergency copy join
- Wave 3 CSS / bundler; Wave 4 `modules/*` write-truth
- Moving medical algorithms (dose, due dates, alert normalize, parasite dual math, emergency snapshot build)
- Wholesale rewrite of all `save*` handlers / mega visit-weight save in one PR
- Timeline morph/reconcile (already domain)
- Google Drive / intro OAuth transport (wire-bundles already owns chrome wires)
- Optional thin: `openVisitImaging` / `confirmArchivePet` presentation orchestration — **deferred** (imaging thin ROI; archive mixes lifecycle + `go(..., { replace })`)
- Drive-by refactors outside A–D (vax-help, drug results, lang menu, etc.)

## Likely files

**Layer: shell**

- CREATE `apps/web/shell/alert-form.js` (A)
- CREATE `apps/web/shell/parasite-form.js` (B)
- CREATE `apps/web/shell/breed-form.js` (C)
- CREATE `apps/web/shell/emergency-paint.js` (D)

**Layer: surface facade (C only)**

- EDIT `apps/web/c/app.js` — replace A–D bodies with shell calls + injected callbacks
- EDIT `apps/web/c/index.html` — script tags + `?v=` for new shell files (before `c/app.js`)

**Domains / core** — read-only consume; **no** algorithm moves unless a one-line pure helper is already duplicated and must stay bit-identical (prefer leave domains alone).

**Proposal / tests**

- `proposals/20260827-wire-thin-forms/*`
- Optional: `qa/tests/web-shell-alert-form.test.js`, `web-shell-parasite-form.test.js`, `web-shell-breed-form.test.js`, `web-shell-emergency-paint.test.js`

## Risks

- Toast key / quiet branches must stay bit-identical (alert create vs update; parasite dual vs single; needProduct / needDates / order).
- Parasite dosedToday path must still write last/interval/next inputs before save; dual `syncedOtherKind` fill must not drop.
- Breed: `other` species and invalid previous selection must keep today’s custom / clear behavior; expand/collapse class pair must not desync.
- Emergency: generate fail / missing generate → local fallback; degraded weight/alerts/meds HTML + nav tone order unchanged; no double paint of identity.
- Listener / double-call risk if facade leaves old bodies — Builder must delete duplicates.
- Shell must not call storage, pets-graph writes, or hard-coded `t` internals — inject only.
- Pharmacist: no copy/dose change expected → may **skip**; QA owns behavior parity.

## Acceptance criteria

- [ ] A–D orchestration live under `PetLiveWeb.shell.*`; C facade only composes + injects callbacks
- [ ] Behavior-preserving on C: alert save/update toast+reset+refresh; parasite save/dosedToday/dual toast+strip; breed species sync chips/select; emergency card sections + degraded + photo
- [ ] No domain medical algorithms moved; no Google Drive; no timeline morph; no modules write-truth
- [ ] `c/index.html` loads new shell scripts before facade with bumped `?v=`
- [ ] `node --check` on touched shell + `c/app.js`; optional shell qa passes if added
- [ ] Formal B / Pages untouched until Gate B

## Notes for Victor（白話／五歲聽得懂）

第 1 波搬的是「小腦袋」（怎麼寫字、怎麼算標籤）。第 2 波搬的是「指揮線」：表格按存檔之後，誰先讀欄位、誰叫積木、誰跳出提示、誰重畫畫面——這些排隊動作從大房間 `c/app.js` 搬進標好的殼子 `shell/`，插頭（toast、go、render）還是原來那些。

| 這波要搬的電線 | 白話 |
|---|---|
| **A** 警訊存檔線 | 讀表單 → 叫 alerts 積木 → 成功提示／重畫 |
| **B** 驅蟲存檔線 | 讀表單／今天已餵 → 叫 parasite 積木 → 填回／提示 |
| **C** 品種欄同步線 | 換犬貓 → 晶片區怎麼展開／選中（搜尋框顯示字已在第 1 波搬過） |
| **D** 急診卡上色線 | 叫急診畫筆 → 把 HTML 貼上對的格子 |

不做：改藥怎麼算、時間軸聰明重貼、雲端硬碟、一次搬光所有存檔函式、蓋正式 B（等你說採用）。

確認後回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
（你已說「第2波開始指揮」→ Parent 可視為 Gate A 放行後再翻 `state.yaml`；本檔先留 pending。）
