---
id: 20260827-abcd-shell-leftovers
title: ABCD leftovers — vaccine chips, calendar chooser, alert badge, timeline toggles
status: candidate_ready
author: planner
candidate_branch: "cursor/abcd-shell-leftovers-8ec1"
candidate_path: "proposals/20260827-abcd-shell-leftovers"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: ABCD leftover building blocks

Companion: `state.yaml`.

**Gate A:** Victor authorized 2026-08-27 —「ABCD先做完，問我是否採用與覆蓋」. Build C only; stop at Gate B for 採用 + B cover.

## Goal

Finish four leftover facade HTML/presentation slices after SH-06: vaccine form chips (A), calendar chooser overlay helper (B), home alert badge copy (C), timeline RX/imaging toggle presentation (D). Behavior-preserving. Photo-crop open/save stays out (still orchestration).

## In scope

### A — Vaccine form chips (`domains/vaccines/render.js`)

- `buildFormChipsHtml(groups)` — chip-row HTML from preset groups (`labelKey` + `keys`)
- Facade `fillVaccineNameOptions` clears selection + applies HTML + hint; `VACCINE_PRESETS` stays in facade

### B — Calendar chooser (`shell/calendar-chooser.js`)

- `PetLiveWeb.shell.createCalendarChooser()` — pending payload, `canShow`, `show({ overlay, metaEl, payload, metaText })`, `close({ overlay })`, `getPending`
- Facade keeps toast on invalid, parasiteKind dataset, Google/Apple open, click listeners

### C — Alert home badge (`domains/alerts/render.js`)

- `buildHomeBadgePresentation(pet, alerts)` → `{ text, ariaLabel, count }`
- Facade `renderAlertBadge` applies text/aria + existing `syncAlertNavTone`

### D — Timeline panel toggles (`domains/timeline/render.js`)

- `buildVisitRxTogglePresentation(open)` → `{ panelHidden, ariaExpanded, text, isOpen }`
- `buildVisitImagingTogglePresentation(open)` — same shape with imaging label keys
- `shouldAutoExpandLatestRx(userCollapsed)` — pure boolean
- Facade toggles still touch DOM; use presentation for attributes/text

## Out of scope

- Formal B cover / Pages (Gate B question)
- Photo crop open/close/save / pointer / canvas
- Moving `VACCINE_PRESETS` catalog out of facade
- CSS / medical copy / i18n key renames

## Likely files

| Slice | Path |
|---|---|
| A | `domains/vaccines/render.js`, C facade + `?v=` |
| B | `shell/calendar-chooser.js` (new), C facade + script tag |
| C | `domains/alerts/render.js`, C facade + `?v=` |
| D | `domains/timeline/render.js`, C facade + `?v=` |
| QA | extend vaccines/alerts/timeline render tests; new shell calendar-chooser test |

## Risks

- **Shared modules:** keep createRenderer boot compatible for untouched B (lazy-require new builders if needed; prefer additive APIs).
- **Calendar pending payload:** one shared pending for parasite + vaccine chooser — preserve current behavior.
- **Toggle a11y:** aria-expanded / is-open / label keys must match today.

## Acceptance criteria

- [x] A–D builders live under domain/shell; C facades thin
- [x] Vaccine chips / chooser / badge / RX+imaging toggles behave identically on C
- [x] Tests pass; `node --check apps/web/c/app.js`
- [x] No silent B cover

## Notes for Victor（白話）

一次做完你選的 ABCD：

1. **A** 疫苗表單 chip HTML  
2. **B** 日曆選 Google／Apple 彈窗的殼層 helper  
3. **C** 首頁提醒按鈕文案  
4. **D** 時間軸處方／影像展開按鈕的呈現資料  

裁切開關存檔這次不做。C 先接線；做完再問你是否**採用並覆蓋 B**。
