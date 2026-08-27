---
id: 20260827-small-brains
title: Wave 1 — leftover small brains out of C facade
status: proposed
author: planner
candidate_branch: "cursor/small-brains-6f84"
candidate_path: "proposals/20260827-small-brains"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Wave 1 — leftover small brains (C only)

Companion: `state.yaml`.

**Gate A:** Victor 2026-08-27 —「確認」(對「確認：先做小腦袋」). Orchestrator Wave 1. File keeps `gate_a: pending` until parent flips approved.

## Goal

Move leftover **pure presentation / text-builder** helpers out of the C facade into the right domains. Behavior-preserving. Facade keeps DOM, `t()` wiring, chooser overlays, `window.open` / clipboard I/O. C only until Gate B; formal B out of scope until Victor 採用.

## In scope

### A — Parasite / vaccine calendar title+details text

**Today (C facade):** `buildParasiteCalendarPayload` / `buildVaccineCalendarPayload` still build `title`/`details` via `t(...)` then call `parasiteController` / `vaccinesController` payload assemblers. Controllers already accept `{ title, details }` / `buildTitle` / `buildDetails`.

**Move:** Pure title/details (and join of vaccine names for the label) into `domains/parasite/` and `domains/vaccines/` (or thin shared helpers under `domains/calendar/` only if both share identical shape — prefer parasite/vaccines ownership). Inject `label` (`t`) from facade.

**Facade keeps:** `showCalendarChooser` / `calendarChooserShell`, `openGoogleCalendar` / `openAppleCalendar` (`window.open`, blob download), toast when next-due missing.

### B — Med frequency + compound form presentation

**Today (C facade):** `formatFrequencyLabel`, `expandFrequencyInText`, `compoundFormLabel`, `compoundFormBadge`, `compoundChipToneClass` live in `c/app.js`. Selectors already own `compoundFormClass` / `compoundIconKind` and *inject* `formatFrequencyLabelOf`.

**Move into `domains/medications/`** (extend `selectors.js` or add thin `labels.js`):

- `formatFrequencyLabel` (SID/BID/TID/EOD → localized + code)
- `expandFrequencyInText` (pure string replace; inject duration-days label)
- `compoundFormLabel`, `compoundFormBadge`
- `compoundChipToneClass` (pure class-name map; same as today’s tone chips)

**Facade keeps:** pass `label`/`t` into factory; wire results into medications controller/selectors, timeline/emergency renderers.

### C — Breed search face (pure presentation)

**Today (C facade):** `updateBreedSearchFace(value)` reads `#breed-search` / `#pet-species`, toggles `suppressBreedSearchInput`, resolves display string via `findBreedByValue` + `breedOptionLabel`.

**Move into `domains/breed/`** (render or selectors): pure `resolveBreedSearchFaceValue(value, { species, findBreed, breedOptionLabel, customSentinel })` → display string (or `{ setValue, leaveTyped }`).

**Facade keeps:** DOM get/set, `suppressBreedSearchInput` flag, callers (`setSelectedBreed`, etc.).

### D — Emergency copy-card leftover join/text

**Today:** `emergencyRenderer.buildCopyCardText` already joins lines (adopted leftover-abcd). Facade `buildEmergencyCopyText` still orchestrates `copyPayload` + pet/owner line formatters + `buildCopyCardText`.

**Move (only if still inline / not already domain):** any remaining pure assemble/join into `domains/emergency/` (e.g. extend render/adapters so one domain helper returns full copy text given injected formatters). If nothing pure remains beyond wiring, document “already extracted; thin wire only” and skip code move for D.

**Facade keeps:** `loadOwnerProfile`, clipboard `copyTextToClipboard`, alert/med label injections.

## Out of scope

- Form save / render orchestration (Wave 2 wires)
- `modules/*` write truth (Wave 4)
- CSS / bundler (Wave 3)
- Formal B / `apps/web/app.js` cover (Gate B later)
- Drive-by refactors, medical copy / i18n key renames
- Moving chooser DOM, `window.open`, blob download, or clipboard I/O into domains

## Likely files

| Slice | Layer / path |
|---|---|
| A | `domains/parasite/controller.js` (or labels helper), `domains/vaccines/controller.js` (or labels), optional `domains/calendar/helpers.js` only if shared; `c/app.js`; `c/index.html` `?v=` |
| B | `domains/medications/selectors.js` and/or `domains/medications/labels.js` (new); `c/app.js`; `?v=` |
| C | `domains/breed/render.js` or `selectors.js`; `c/app.js`; `?v=` |
| D | `domains/emergency/render.js` and/or `adapters.js` if leftover; else no-op; `c/app.js` |
| QA | extend `qa/tests/web-medications*`, parasite/vaccines/calendar, breed, emergency as needed |
| Meta | `proposals/20260827-small-brains/*` |

## Risks

- Calendar title/details must stay byte-identical for the same pet/lang (Google/Apple payload text).
- Frequency expand regexes (` · SID(?= · |$)` etc.) and duration-days replace must match today.
- Compound badge vs label i18n keys differ (`compoundLiquidA` vs `compoundLiquidAName`); do not swap maps.
- Breed face: custom / empty must **leave typed text**; only non-custom values replace search input.
- Emergency copy: `\n{3,}` → `\n\n` trim must match; disclaimer line order unchanged.
- Domain blocks must not call DOM / `localStorage` / hard-coded `t`.

## Acceptance criteria

- [ ] A–D pure helpers live under named domains (D may be verified already-done)
- [ ] C facade only wires `label`/DOM/open/clipboard; no duplicate algorithms
- [ ] Behavior identical on surface C (calendar text, med labels/badges/tones, breed search face, emergency copy card)
- [ ] `node --check apps/web/c/app.js`; related qa tests pass
- [ ] Formal B / `apps/web/app.js` untouched this Gate A cycle

## Notes for Victor（白話／五歲聽得懂）

還有幾顆「小腦袋」住在 C 頁面裡，要搬回自己的房間：

1. **日曆標題怎麼寫**——預防寄生蟲／疫苗要寫進日曆的那兩段話  
2. **吃藥怎麼唸、藥水膠囊貼紙顏色**——一天幾次、劑型名字／徽章／色票  
3. **品種搜尋框顯示什麼字**——選了品種後搜尋框要秀哪個名字  
4. **急診複製卡組字**——若還有拼字剩在外面，收進急診積木（很多已經搬過了）

按鈕、開視窗、複製到剪貼簿還留在 C。這波**只做 C**；你說採用後再蓋 B。
