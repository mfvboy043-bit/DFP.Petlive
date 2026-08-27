---
id: 20260827-leftover-cleanup-17
title: Leftover cleanup 1–7 on C — facade thin, PERF-03 morph, dates, brains, forms, pets-graph door
status: building
author: planner
candidate_branch: "cursor/leftover-cleanup-17-6f84"
candidate_path: "proposals/20260827-leftover-cleanup-17"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Leftover cleanup 1–7 on C

Companion: `state.yaml` (v2 source of truth for gates / iteration).

**Gate A signal:** Victor 2026-08-27 —「1～7開始整理，好了讓我審核」(C only; stop before formal B / Pages).

**Adopted priors (build on, do not redo):**
`20260827-leftover-cleanup-c`, `20260827-leftover-abcd`, `20260827-calendar-helper`, `20260827-abcd-shell-leftovers`, `20260827-drug-catalog-single-path`, `20260827-storage-indexeddb`.

## Goal

Continue thinning the C facade (`apps/web/c/app.js` ~6.3k lines, mostly wires by design) by extracting the seven leftover brains Victor listed — shared dates, small pure helpers, account chrome markup, form read/validate/payload helpers, PERF-03 step-3 keyed attribute morph, and a single pets-graph **write door** — while keeping DOM submit handlers, toasts, focus, and listeners in the facade. Behavior-preserving. Formal B / Pages stay out until Gate B.

## Audit (read-only, C)

| Piece | Where now |
|---|---|
| `daysUntil` / `addDays` / `todayIsoLocal` | Inline `c/app.js` (~283–302, ~852); injected into vaccines/parasite controllers |
| `formatAgeLabel` | Inline `c/app.js` ~2605 (uses `t()`) |
| `searchClinics` | Inline `c/app.js` ~3563 (uses `getClinicDirectory` / `getAnonymousClinic` from clinics catalog) |
| `resizeImageDataUrl` | Inline `c/app.js` ~1699 (canvas JPEG; crop export already in `domains/pets/media.js`) |
| `openGoogleCalendar` / `openAppleCalendar` | Thin wrappers ~1242–1273; URL/ICS brain already in `domains/calendar/helpers.js` |
| `glassChromeNavAccountMarkup` / `paintAccountMenu` | Inline ~3213 / ~5847 (+ related chrome paint) |
| Timeline PERF-03 | Steps 1–2 adopted: `buildItemSignatures` + `planKeyedListReconcile` + partial `li` replace in facade `renderTimeline` (~4268); **step 3 morph not started** |
| Form save/validate | Mix: vaccines already `vaccinesController.buildSaveEntries`; pet-form / visit-form / med-form still inline read+validate+payload beside DOM handlers |
| Pets graph writes | `pets[]` / `archivedPets` + `petsGraphSlot` + `schedulePetsGraphPersist`; lifecycle mutates arrays; `pets.push` still in pet-form submit — **no** `modules/*` as UI write truth |
| `emergency/adapters.addDays` | Separate tiny copy for emergency med end-date — optional consolidate if identical |

## In scope

### A — Shared date helpers (`core/dates.js`) ← Victor **#3**

- New `apps/web/core/dates.js` (IIFE → `PetLiveWeb.core.dates` or equivalent public surface):
  - `addDays(isoDate, days)`
  - `daysUntil(isoDate)` (same local-midnight semantics as today)
  - `todayIsoLocal()` / alias used as `todayISODate`
- C facade deletes local copies; injects the shared helpers into vaccines / parasite (and any other callers that today pass facade locals).
- Optional: point `domains/emergency/adapters.js` at the same helpers **only if** behavior matches bit-for-bit; otherwise leave emergency alone.
- Script tag + `?v=` in `c/index.html` **before** domains that need dates / before `c/app.js`.

### B — PERF-03 step 3 keyed attribute morph (`domains/timeline/render.js` + thin facade) ← Victor **#2**

- Extend timeline renderer with a pure **patch plan** for list items when signatures differ only in patchable attributes (or when partial replace is overkill): e.g. morph/patch attributes / cheap text nodes on existing `li[data-visit-index]` instead of full `replaceWith`.
- Facade `renderTimeline` / `applyPartialTimelineRows` (or sibling) applies the plan; keep drug-note Map + expand / imaging-pending side effects correct.
- Prefer skip → morph/patch → partial replace → full rebuild order; do **not** change visit HTML builders’ medical content.
- Extend `qa/tests/web-timeline-render.test.js` for plan modes.

### C — Leftover small brains ← Victor **#4**

| Helper | Target layer | Notes |
|---|---|---|
| `formatAgeLabel` | `domains/pets/` (e.g. `labels.js` or extend `render.js` / selectors) | Pure age math; inject `label` / `t` for copy keys — same strings as today |
| `searchClinics` | `domains/clinics/catalog.js` | Pure filter over directory + pinned anonymous |
| `resizeImageDataUrl` | `domains/pets/media.js` | Canvas resize JPEG (quality `0.82`, maxEdge default `480`) — beside existing crop export |
| Calendar open wrappers | Stay thin in facade **or** tiny `shell/` helper that only does `window.open` / blob download given URL/ICS string | URL/ICS brain already in `domains/calendar/helpers.js` (prior); do not re-extract |

### D — Account / glass chrome markup + paint helpers ← Victor **#5**

- Move pure markup builders (`glassChromeNavAccountMarkup`, related account/cloud chrome **markup** if pure HTML strings) into `shell/` (e.g. `shell/account-chrome.js` or extend an existing shell chrome module).
- Move **pure presentation** pieces of `paintAccountMenu` / related chrome (displayName / initial / signed-in visibility decisions that do not need live DOM) into shell; facade keeps querySelector, `setAccountAvatar`, listeners, toasts.
- No CSS redesign; no new account UX.

### E — Form save/validate pure helpers ← Victor **#6**

- Extract **pure** read / validate / build-payload helpers still inline in C facade into the owning domain (prefer existing controllers):
  - **Pet form:** validate fields + `createPetFromForm` / `applyPetFromForm` payload builders → `domains/pets/` (lifecycle or controller companion).
  - **Visit / clinic gate** (toast reasons as structured `{ ok, reason }`) if still pure beside DOM.
  - **Med draft read** (`readMedDraftFromForm` shape) if not already domain-owned; validate already delegates to `medicationsController` — keep toast mapping in facade.
  - Vaccines / parasite already largely extracted — only mop leftover pure bits if any remain inline.
- **Keep in facade:** `addEventListener("submit")`, `showToast`, `.focus()`, `go()`, `render*`, event wiring.

### F — Pets-graph write door (`core/pets-graph.js`) ← Victor **#7**

- Introduce thin `apps/web/core/pets-graph.js` (name flexible; path under `core/` preferred) as the **single write door** for active/archived pets graph mutations used by the C facade:
  - hydrate from slot, schedule persist, push/update pet, coordinate with existing `domains/pets/lifecycle` for archive/remove (lifecycle may keep array splice; door owns persist + “who may mutate”).
  - Still backed by the same `pets[]` / `archivedPets` / `petsGraphSlot` (`petlive-c-pets-graph` or current C key).
- **Forbidden in this slice:** dual-write into `modules/*`, flipping modules into the database, changing storage backend contract beyond routing writes through the door.

### G — Facade thin + script tags ← Victor **#1** (umbrella)

- Wire all of the above on **surface C only**; bump `?v=` on new/changed scripts in `c/index.html`.
- Facade remains the composition / DOM / i18n shell — no new domain algorithms pasted into `c/app.js`.
- Prefer `qa/tests/web-*.test.js` extensions per block; `node --check apps/web/c/app.js`.

## Out of scope

- Formal B cover / `apps/web/app.js` / GitHub Pages (Gate B later, after Victor 審核)
- `modules/*` as UI write truth / dual-write / store migration
- CSS redesign, glass visual refresh, i18n key renames
- Medical copy / dose / frequency / duration semantics changes
- Moving DOM submit handlers, toasts, focus, or event listeners into domains
- Re-doing adopted leftover-cleanup-c / leftover-abcd / calendar-helper / ABCD shell / drug-catalog / storage-idb work
- PERF beyond timeline list-item morph (no unrelated render perf projects)

## Likely files

| Slice | Path |
|---|---|
| A | `apps/web/core/dates.js` (new); `c/app.js`; `c/index.html`; optional `domains/emergency/adapters.js` |
| B | `apps/web/domains/timeline/render.js`; `c/app.js`; `qa/tests/web-timeline-render.test.js` |
| C | `domains/pets/media.js`; `domains/pets/` labels (new or extend); `domains/clinics/catalog.js`; thin calendar open stay/facade or `shell/`; `c/app.js`; `c/index.html` |
| D | `apps/web/shell/account-chrome.js` (new) or extend shell chrome; `c/app.js`; `c/index.html` |
| E | `domains/pets/` (+ maybe visits/medications if pure bits remain); `c/app.js` |
| F | `apps/web/core/pets-graph.js` (new); wire `c/app.js`; `c/index.html`; lifecycle callers |
| QA | Extend `web-clinics-catalog`, `web-pets-*`, `web-timeline-render`, `web-calendar`, new `web-dates` / `web-pets-graph` as needed |
| Meta | `proposals/20260827-leftover-cleanup-17/*` |

## Risks

- Date helpers must keep **local** midnight / ISO `YYYY-MM-DD` semantics — vaccines/parasite due math depends on it.
- Timeline morph must not drop `data-visit-index`, drug-note panel ids, or expand/imaging pending behavior; wrong patch → silent stale UI.
- `resizeImageDataUrl` quality `0.82` and maxEdge defaults must match (avatar vs proof paths differ by caller maxEdge).
- `searchClinics` must keep anonymous pinned first while searching.
- `formatAgeLabel` must keep the same `t(...)` keys / branch thresholds.
- Pets-graph door must not change slot key, coalesce timing, or cloud `bumpLocalDataRevision` side effect of persist.
- Form helper extraction must preserve toast reason → existing `t(...)` mapping (no new medical wording).

## Acceptance criteria

- [ ] A — Shared `daysUntil` / `addDays` / `todayIsoLocal` live in one core block; C facade no longer defines duplicates; vaccines/parasite still receive working injects
- [ ] B — PERF-03 step 3: keyed attribute morph/patch path exists and is used when plan says so; skip + partial replace still work; timeline behavior unchanged for users
- [ ] C — `formatAgeLabel`, `searchClinics`, `resizeImageDataUrl` live in domain blocks; calendar open stays thin over `domains/calendar/helpers.js`
- [ ] D — Account/nav chrome markup (+ pure paint helpers) live under shell; facade wires DOM only
- [ ] E — Pure form read/validate/build-payload helpers extracted; submit listeners / toasts / focus remain in facade
- [ ] F — C pet graph mutations go through `core/pets-graph.js` (or equivalent) write door; still `pets[]` backed; **no** `modules/*` dual-write
- [ ] G — New/changed scripts loaded in `c/index.html` with `?v=`; `node --check apps/web/c/app.js`; related qa tests pass
- [ ] Formal B / `apps/web/app.js` / Pages untouched in this Gate A slice

## Notes for Victor（白話）

上次積木收完還剩七件小事，這次只在 **網頁 C** 整理，做好先給你看：

1. **大電線箱**繼續變薄——只搬走還留在裡面的「腦袋」，按鈕電線留下  
2. **時間軸**再聰明一點：能改字就改字，不一定整格拆掉重貼（PERF-03 第 3 步）  
3. **算日子**的三個小工具合成一塊積木，大家共用  
4. **年齡怎麼唸、找醫院、縮小照片、開日曆**——小腦袋搬家  
5. **帳號選單長怎樣**——字跟畫法搬到 shell，頁面只負責接上  
6. **表格存檔**：檢查對不對、組好要存的資料 → 積木；真正按送出、跳提示、對焦 → 還在 C  
7. **寵物名單怎麼改**走一扇小門（還是同一本 `pets[]` 名簿）；**不要**改成 modules 當資料庫  

不做：蓋正式 B、改藥怎麼寫、改畫面長相。  
做好停下來給你審核；你說採用再談覆蓋 B。

確認後回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
（你已說「開始整理」→ 可視為 Gate A 放行；Parent 會把 `gate_a.status` 翻成 approved。）
