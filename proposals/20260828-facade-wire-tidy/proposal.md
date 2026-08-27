---
id: 20260828-facade-wire-tidy
title: "C — tidy facade wire clusters into shell (timeline / lang / vax-help / drug-search / imaging+archive)"
status: adopted
author: planner
candidate_branch: "proposal/facade-wire-tidy"
candidate_path: "proposals/20260828-facade-wire-tidy"
created: 2026-08-28
updated: 2026-08-28
---

# Proposal: Facade wire tidy (leftover #1)

Companion: `state.yaml` (v2 source of truth for gates / iteration).

**Victor intent (2026-08-28):** leftover #1 —「把電線整理得更整齊，雜物袋只留接上插座那幾行」. Thin C facade orchestration wires into `shell/`; facade keeps thin `init*` / event→shell / DOM refs / `t()` / toast / `go()`.

**Builds on (do not redo):**
`20260827-small-brains`, `20260827-wire-thin-forms`, `20260827-wire-bundles`, `20260827-leftover-cleanup-17`, `20260827-css-consolidate`, `20260827-modules-write-phase1` (`pets[]` still write truth via pets-graph door).

## Goal

Behavior-preserving Wave: move **3–5 named wire/orchestration clusters** from `apps/web/c/app.js` into classic IIFE `PetLiveWeb.shell.*` modules so the C facade mostly plugs sockets (callbacks + element refs). **C only** until Gate B cover onto B. No new medical brains, no CSS merge/bundler, no modules write-truth flip.

## Audit (read-only, C ~5835 lines)

| Cluster | Facade today | ROI | Wave? |
|---|---|---|---|
| **A** Timeline list mega click/submit | `timelineList` click ~4615–4699 + submit ~4701–4706 (~90 lines routing) | High — pure event→toggle/`go`/toast/open | **In** |
| **B** Language menu | `closeLangMenu` + lang-fab/menu listeners ~5288–5317 | High — small chrome open/close | **In** |
| **C** Vaccine help overlay | `setVaxHelpOpen` + help/outside/Escape wires ~3091–3120 | High — aria/hidden chrome | **In** |
| **D** Drug search UI wire | `renderDrugResults` + input/click select ~3389–3428 | Medium — paint apply + select sequence over existing `medicationsRenderer` / controller | **In** |
| **E** Imaging open + archive confirm | `openVisitImaging` ~4496–4526; `confirmArchivePet` ~1813–1845 | Thin — deferred from Wave 2; still pure orchestration | **In** |
| *(skip)* `applySelectedPet` | Already 4-line wrapper → `renderCoordinator.refreshSelection` + persist | Low — register map is intentional facade composition | Out |
| *(skip)* `scheduleCloudBackup` / Drive push-pull | Tiny debounce + transport (~5593+) | Low / prior wire-bundles: Drive stays facade | Out |
| *(skip)* Whole remaining facade | ~5.8k lines of mixed wires | Wrong wave — one proposal ≠ thin everything | Out |

Existing shell (extend or leave alone): account-chrome, alert-form, app-nav, breed-form, calendar-chooser, emergency-paint, glass-dock, intro-cloud, navigation, parasite-form, photo-crop, proof-preview, render-coordinator, screen-home-btn, feature-hub. **No** timeline-list / lang-menu / vax-help / drug-search / imaging-proof wire modules yet.

## In scope (C only) — clusters **A–E**

### A — Timeline list wire (`shell/timeline-list-wire.js`)

- Extract `timelineList` **click** and **submit** mega-listeners into shell bind helper, e.g. `bindTimelineList(listEl, hooks)`.
- Shell routes `data-*` targets → injected callbacks only:
  - toggles: drug notes / med detail / visit weight / visit rx / visit imaging
  - `go("labs")`, `openProofLightbox`, clear proof/imaging slots (+ toast + refresh + re-expand toggle)
  - `openVisitProof` / `openVisitImaging` / `openCompleteDrugs`
  - weight form submit → `saveVisitWeightAtIndex`
- Facade injects: `getCurrentPet`, clear/open helpers, toggle helpers, `showToast`/`t`, `applySelectedPet`, `go`.
- Do **not** move toggle algorithms, proof/imaging domain clears, or timeline HTML builders.

### B — Language menu chrome (`shell/lang-menu.js`)

- Move `closeLangMenu` + fab/menu/outside-click open-close into shell `initLangMenu(els, { onPickLang, onToast })` (or equivalent).
- Facade injects: `setLanguage`, `showToast`/`t("langChanged")`.
- Do **not** move `onLanguageChange` / `renderCoordinator.refreshLanguage` (i18n recompute stays facade).

### C — Vaccine help overlay (`shell/vax-help.js`)

- Move `setVaxHelpOpen` + help-btn / pop stopPropagation / document outside-click close into shell.
- Escape: shell may register Escape→close **or** facade keeps one Escape handler that also calls `closeProofLightbox` — prefer **one** Escape owner (facade or tiny shared close helper) so lightbox + vax-help stay bit-for-bit.
- Do **not** change vaccine medical copy inside the popover.

### D — Drug search UI wire (`shell/drug-search.js`)

- Move `renderDrugResults` DOM apply (`hidden` + `innerHTML` from `medicationsRenderer.buildDrugResultsHtml`) + drugSearch **input** / drugResults **click** select sequence into shell bind/paint helpers.
- Inject: `searchDrugs`, `resolveEnrichedDrug`, optional `PetLive.drug.getDrugById` fallback, `renderDrugInfoCard`, `setMedEntryMode`, `t("selectedDrug")`, selected-drug element updates, suppress-input flag.
- Optional same module if cheap: thin `renderDrugInfoCard` DOM apply around `buildDrugInfoListsHtml` (scrollIntoView stay identical).
- Do **not** move drug catalog / enrich / dose brains.

### E — Thin deferred leftovers (Wave 2 skips)

1. **`openVisitImaging`** → e.g. `shell/imaging-proof.js` `openImagingProofScreen(hooks)`: set pending index/photos, fill name/meta/sub/kicker, clear file inputs, `renderImagingSlotPreviews`, `go("imaging-proof")`. Inject clinic label / `t` / preview / go.
2. **`confirmArchivePet`** → e.g. `shell/archive-pet.js` (or pets lifecycle wire companion under shell): read form → inject `petsLifecycle.archivePet` → manage-mode off / currentPetId / `applySelectedPet` / archive list / toast / `go("archive", { replace })` / clear history. Keep validation toast keys identical.

### F — Facade thin + script tags (umbrella)

- Wire A–E on **surface C only**; bump `?v=` on new/changed shell scripts in `c/index.html` (load **before** `c/app.js`).
- Classic IIFE + `PetLiveWeb.shell.*`; zero-build.
- Prefer cheap `qa/tests/web-shell-*.test.js` for pure bind helpers; `node --check` on touched JS.

## Out of scope

- Formal B / `apps/web/app.js` / Pages until Gate B (then C→B cover per standing rule)
- `applySelectedPet` / `renderCoordinator.register(...)` map (already thin + intentional)
- `scheduleCloudBackup` / `pushCloudBackup` / `pullCloudBackup` / Google Drive transport
- Expanding remaining mega form handlers (visit-form submit, med-proof submit, imaging-proof file append) unless they fall out of A–E as one-line call sites
- New domain medical algorithms, copy tone changes, CSS redesign/merge, bundler, modules write-truth flip
- Re-doing prior shell modules’ adopted work

## Likely files

**Layer: shell (new / extend)**

- CREATE `apps/web/shell/timeline-list-wire.js` (A)
- CREATE `apps/web/shell/lang-menu.js` (B)
- CREATE `apps/web/shell/vax-help.js` (C)
- CREATE `apps/web/shell/drug-search.js` (D)
- CREATE `apps/web/shell/imaging-proof.js` and/or `apps/web/shell/archive-pet.js` (E)
- Shared CSS: **none expected** (behavior/wire only); only add `shell/<name>.css` if a real shared chrome style is required

**Layer: surface facade (C only)**

- EDIT `apps/web/c/app.js` — replace cluster bodies with shell `init*` / `bind*` + injected callbacks
- EDIT `apps/web/c/index.html` — script tags + `?v=` before `c/app.js`

**Proposal / tests**

- `proposals/20260828-facade-wire-tidy/*`
- Optional: `qa/tests/web-shell-timeline-list-wire.test.js`, `web-shell-lang-menu.test.js`, etc.

## Risks

- Listener double-bind if facade still registers after shell bind — Builder must delete facade duplicates
- Timeline clear-slot path must keep toast + `applySelectedPet` + re-expand toggle order bit-for-bit
- Escape key ownership: proof lightbox + vax-help must both still close on Escape
- Drug select must keep enrich fallback + force `manual` med entry mode + safety card visible
- Archive confirm must keep `passedAwayDate` gate toast and history `replace` / manage-mode off
- Imaging open must not drop pending photo array copies or i18n kicker `data-i18n`
- No medical disclaimer / dose UX change — pharmacist review may skip unless E/D copy paths drift

## Acceptance criteria

- [ ] Clusters A–E live under named `apps/web/shell/*` with `PetLiveWeb.shell.*` public API; C facade only wires + injects
- [ ] C behavior bit-for-bit on: timeline expand/clear/proof/labs/weight save; lang menu pick/close; vax-help open/outside/Escape; drug search type/select; imaging open screen; archive confirm success/fail toasts
- [ ] `c/index.html` loads new shell scripts with bumped `?v=` before `c/app.js`
- [ ] No edits to formal B / Pages in this candidate
- [ ] No new medical copy; `pets[]` remains write truth; no bundler/CSS merge
- [ ] Cheap shell unit tests where practical; `node --check` on touched JS

## Notes for Victor（白話）

想像 `c/app.js` 是一個**雜物袋**：裡面還塞著好幾捆電線。

這一波只做五捆整理（不是一次搬光 5800 行）：

1. **時間軸那一大串點擊** → 收到 shell 盒子  
2. **語言選單開關** → shell  
3. **疫苗小說明泡泡** → shell  
4. **找藥名字的搜尋結果** → shell  
5. **打開影像上傳畫面 + 確認封存寵物**（上波先跳過的兩小段）→ shell  

雜物袋以後只留「把插頭插上」那幾行。畫面跟現在一樣；**先只改 C**，確認好再決定要不要蓋到正式 B。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
