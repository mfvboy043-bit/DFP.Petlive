---
id: 20260827-leftover-cleanup-c
title: Leftover cleanup on C — catalogs, seed, crop export, timeline keyed plan
status: building
author: planner
candidate_branch: "cursor/leftover-cleanup-c-7855"
candidate_path: "proposals/20260827-leftover-cleanup-c"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Leftover cleanup on C

Companion: `state.yaml`.

**Gate A:** Victor 2026-08-27 —「請開始整理 / 全部整理好在網頁C頁面，做完我審核可以再覆蓋B」.

## Goal

Finish the remaining building-block leftovers on **surface C only**: clinic catalog, vaccine presets, demo seed graph, photo-crop canvas export brain, and PERF-03 step-2 keyed rebuild *plan* (replace only changed visit rows when safe). Behavior-preserving. Formal B untouched until Victor 採用後覆蓋.

## In scope

### A — Clinics catalog (`domains/clinics/catalog.js`)

- Move `CLINIC_PRESETS` + pure helpers: `clinicNameOf`, `getAnonymousClinic`, `visitClinicLabel`, `getClinicDirectory` (directory needs injected `label` / visit-name collector).
- Facade keeps `t()` / `locField` / `pets` wiring.

### B — Vaccine presets (`domains/vaccines/presets.js`)

- Move `VACCINE_PRESETS`; expose `getPresetGroups(species)`.
- Facade `fillVaccineNameOptions` only clears selection + applies HTML + hint.

### C — Demo seed (`domains/pets/seed.js`)

- Move `SEED_PETS` + `cloneSeedPets()`; facade graph hydrate still owns `pets[]` / slots.

### D — Photo crop canvas export (`domains/pets/media.js`)

- Add pure `exportCroppedJpegDataUrl(image, metrics, options)` (canvas draw + JPEG).
- Facade keeps pointer listeners, open/close DOM, `setPetPhoto`, toasts.

### E — PERF-03 step 2 keyed plan (`domains/timeline/render.js`)

- Tag each visit `<li>` with `data-visit-index`.
- Add `buildItemSignatures(pet, { lang })` + `planKeyedListReconcile(prev, next)` → `{ mode: "skip"|"full"|"partial", indices }`.
- Facade `renderTimeline`: skip / full rebuild / replace only listed `li` nodes; keep drug-note Map + expand side effects correct.
- **Not** full morphing / attribute patching (PERF-03 step 3 stays out).

### F — Visit label helpers (optional thin file)

- Move `VISIT_TAG_I18N` / `visitTagLabel` / `getSourceTags` into `domains/visits/labels.js` if it keeps timeline deps clean.

## Out of scope

- Formal B cover / Pages (Gate B later)
- Form save/validate orchestration (stays facade by design)
- `modules/*` as write truth / dual-write
- PERF-03 step 3 (keyed attribute morph)
- CSS / medical copy / i18n key renames
- Moving pointer `addEventListener` out of facade

## Likely files

| Slice | Path |
|---|---|
| A | `domains/clinics/catalog.js` (new), C facade, `c/index.html` |
| B | `domains/vaccines/presets.js` (new), C facade, `?v=` |
| C | `domains/pets/seed.js` (new), C facade, `?v=` |
| D | `domains/pets/media.js`, C facade, tests |
| E | `domains/timeline/render.js`, C facade, tests |
| F | `domains/visits/labels.js` (new) if used |
| QA | `qa/tests/web-clinics*.js`, vaccines/pets/timeline/photo-crop extensions |
| Meta | `proposals/20260827-leftover-cleanup-c/*` |

## Risks

- Seed clone must deep-copy identically (JSON round-trip).
- Clinic directory “anonymous first + history extras” order must match.
- Partial timeline rebuild must refresh `drugNotesMedByPanelId` for replaced rows only / consistently.
- Crop JPEG quality `0.86` and fill `#e8f1ed` must match today.
- Cat vaccine presets must still omit rabies chip group.

## Acceptance criteria

- [x] A–E live under domain/shell blocks; C facades thin
- [x] Clinic / vaccine / seed / crop export / timeline plan behave identically on C
- [x] `node --check apps/web/c/app.js`; related qa tests pass
- [x] Formal B / `apps/web/app.js` untouched

## Notes for Victor（白話）

把上次說還沒收的積木一次收到 C：

1. 醫院名單  
2. 疫苗按鈕清單  
3. 示範寵物故事書  
4. 剪大頭貼「畫出來存檔」的腦  
5. 時間軸「只重畫有變的那幾格」的計畫（還沒做更細的貼身修改）

電線（按鈕、存檔、拖曳）還留在 C 頁面。做完請你審核蓋章；說採用後再覆蓋 B。
