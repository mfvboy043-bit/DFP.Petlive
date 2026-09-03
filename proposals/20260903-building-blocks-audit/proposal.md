---
id: 20260903-building-blocks-audit
title: Building-blocks architecture audit + ranked optimization waves
status: adopted
author: planner
candidate_branch: ""
candidate_path: ""
created: 2026-09-03
updated: 2026-09-03
gate_b_wave: "Wave 1 BB-1/BB-2/BB-5 adopted 2026-09-03; remaining waves still pending"
---

# Proposal: Building-blocks architecture audit + ranked optimization waves

Companion: `state.yaml` (v2 source of truth for gates / iteration).

**This Gate A is an audit + roadmap.** No `apps/web/` edit until Victor picks a wave (or 否決). Do not treat「確認」as permission to extract everything at once.

## Goal

Record whether current `apps/web` matches Tier 2 積木規則, then list **ranked, independently rollbackable waves**. First recommended build (only if Victor confirms that wave) is **Wave 1 — layer hygiene**, not a facade rewrite and not C/B unification.

## Verdict

**Yes — the product brain already lives in building blocks.** The 2026-08-13 layered extraction plus the 08-27 leftover / wire / CSS / write-door waves landed. New work that follows classify → block → thin facade is compliant.

What remains is **debt around the dual C/B surface and a few layer leaks**, not a missing folder map. Shrinking `c/app.js` to “a few hundred lines” is **not** the next goal: most of those ~6.5k lines are composition, 1-line compatibility wrappers, and DOM listeners — previously accepted as the facade’s job.

## Scorecard (today)

| Layer | Score | Why |
|---|---|---|
| Domain | 4/5 | 54 files / ~8.3k lines; controllers + selectors + render for pets, visits, timeline, meds, alerts, vaccines, parasite, emergency, labs, imaging, allergy, weight, clinics, cloud, owner, breed. Timeline render (750) and seed (491) are large but correctly placed. |
| Core | 4/5 | `storage.js` slots + IDB, `state.js`, `dates.js`, `pets-graph.js` write door. Clinics saved-list still bypasses slots. |
| Shell | 4/5 | Dock, nav, account, intro, forms wires, render-coordinator, boot-scheduler. Legal consent still talks to `localStorage` directly. |
| Runtime | 5/5 | Thin `PetLive.*` + `safe-ui`. |
| Surface facade | 2.5/5 | C 6526 / B 7182 lines. **96% of C is byte-identical to B** — 5444 lines sit in 21 contiguous identical clusters ≥40 lines. The cost is maintaining one passport twice, not hidden algorithms. |
| CSS / i18n / HTML | 2/5 | Dock/hub extracted. **Account-chip + parasite-strip layout still live in both surface `styles.css`.** Tokens, `i18n.js`, `index.html` remain forked C vs B. |

### What already matches the constitution

- Folders and IIFE public APIs: `PetLiveWeb.domains.*` / `core.*` / `shell.*`.
- Dependency direction: facade composes factories; controllers do not own screen HTML; views do not own `localStorage` (except the leaks below).
- `pets[]` remains write truth; `core/pets-graph.js` is the structural door; cloud apply uses `replaceGraph` / `clearGraph`. Nested visit/med writes stay in domain controllers + `schedulePersist` (Wave 4 Phase 1 — **do not flip `modules/*` Maps**).
- Shared chrome CSS is **partially** in `shell/` (glass-dock, feature-hub, clinic-picker, legal-consent-modal, intro-stories). Parasite-strip shell file is **lights overlay only** (~29 lines); account chip has **no** `shell/account-chrome.css`.
- 40 `qa/tests/web-*.js` boundary tests.
- C omits Google/Supabase/legal-consent scripts on purpose; B keeps auth / `petlive-*` keys / intro A wiring.

### Layer leaks (concrete)

| ID | Finding | Rule | Suggested home |
|---|---|---|---|
| **BB-1** | `domains/clinics/store.js` reads/writes `localStorage` itself | Domain must not persist | Inject `PetLiveWeb.storage.createJsonSlot` (or a core adapter). Store stays domain for add/remove/dedupe. |
| **BB-2** | `shell/legal-consent.js` `getItem`/`setItem` on consent key | Shell must not do direct storage | Inject a tiny core slot or `{ hasConsent, markConsent }` from facade. Keep modal DOM in shell. |
| **BB-3** | `domains/pets/lifecycle.js` still `pets.splice` / `archivedPets.unshift` | Write door incomplete | Thin door wrappers (`archivePet` / `removePet`) that call lifecycle then persist — same behavior. |
| **BB-4** | `domains/pets/media.js` default `document.createElement("canvas")` | Domain should stay DOM-free | Already injectable; default factory is OK if tests inject. No product change required unless tightening the rule. |
| **BB-5** | C loads `shell/intro-stories.js` and has `data-screen="why-stories"`, but **does not** `<link>` `shell/intro-stories.css` (B does) | Shared chrome CSS must load where the screen exists | C `index.html` add the same stylesheet (C first). |
| **BB-6** | Shared script `?v=` labels drifted C vs B (same file, different bust string) | Operational, not a logic bug if files are identical | Align labels when those files next change; optional hygiene pass. |
| **BB-7** | `.account-chip*` (~L5345+ and `.screen-head-actions` overrides ~L975) duplicated in `styles.css` **and** `c/styles.css`; markup already in `shell/account-chrome.js` | Shared floating chrome CSS must live in `shell/` | New `shell/account-chrome.css`; delete twins from both surface sheets. C first. |
| **BB-8** | Full `.parasite-strip` / `.parasite-row` layout + status tones (~L1464+, ~L5625+) still in both surface sheets; `shell/parasite-strip.css` only overrides lights | Same | Fold layout into `shell/parasite-strip.css` (extend, do not restyle). C first. |

### Facade line audit (measured 2026-09-03, brace-matched)

| Bucket | C | B | Reading |
|---|---:|---:|---|
| Tiny wrappers (≤4 lines) | 466 | 461 | **7%** — confirms cutting these alone is not worth a wave |
| Mid functions (5–25) | 2382 | 2600 | The real body: form reads, paints, save wires |
| Fat functions (>25) | 977 | 1360 | B extra is Google/Drive/reconcile |
| Top-level listener statements | 285 | 288 | ~2k lines of listener bodies land in "other stmts" |
| Element refs / register / factories | 177 | 178 | Composition — facade's job |
| Other statements | 1615 | 1642 | Mostly listener bodies + module state |
| Blank / comment | 624 | 653 | |

**Zero-reference dead functions (8 per surface, ~40 lines):** `renderTimelineDrugNotes`, `resolveParasiteProductName`, `closeParasiteCalendarChooser`, `openParasiteGoogleCalendar`, `openParasiteAppleCalendar`, `loadPetPhotosMap`, `emptyOwnerProfile`, plus C `liveGoogleSignedIn` / B `loadSeedPetsIntoMemory`.

**Single-use tiny wrappers (12–14 per surface):** `searchClinicsForPicker`, `addSavedClinic`, `findDrugByMedName`, `labTypeLabel`, `flushPetPhotosMap`, `formatPetWeightDisplay`, `allergyBrandLabel`, `getSelectedAllergyMeats`, `formatOwnerCopyLines`, `createPetFromForm`, `applyPetFromForm`, `saveParasiteDosedTodayAndOfferCalendar`.

**No inline HTML handlers** in either `index.html` (`onclick`/`oninput`/`onchange`/`onsubmit` = 0; only `data-go` attributes). So facade globals are **not** load-bearing for markup — deletion is safer than previously assumed.

### The real finding — duplicated clusters (ranked)

96% of C matches B. 21 identical clusters ≥40 lines cover **5444 lines that exist twice**:

| C lines | Size | Listeners | Cluster | Existing block to extend |
|---|---:|---:|---|---|
| 1652–2506 | 855 | 17 | Pet photo slot map, resize, crop DOM, emergency photo paint | `shell/photo-crop.js`, `domains/pets/media.js` |
| 5250–6005 | 756 | **47** | Timeline click mega-handler + visit/lab/imaging/proof submits + lang menu | new `shell/timeline-gestures.js` |
| 4536–5248 | 713 | 7 | Timeline apply + pending-med flow + med save | `domains/timeline/render.js`, new `shell/med-flow.js` |
| 3695–4140 | 446 | **35** | Vax help popover, clinic search, drug search | `shell/feature-hub.js`, new `shell/clinic-picker.js` (**CSS already exists**), `shell/drug-search.js` |
| 2901–3265 | 365 | 2 | Breed form face / chips / identity read | `shell/breed-form.js`, `domains/breed/*` |
| 1054–1415 | 362 | 0 | Parasite save + calendar payload/chooser | `shell/parasite-form.js`, `shell/calendar-chooser.js` |
| 4167–4456 | 290 | 3 | Med unit / freq / compound chips + draft read | `shell/med-form.js`, `domains/medications/*` |
| 2569–2818 | 250 | 0 | Owner profile + emergency copy/paint | `domains/owner/*`, `shell/emergency-paint.js` |
| 1472–1650 | 179 | 0 | Lab/imaging link + report slots | `domains/labs/*`, `domains/imaging/*` |
| 885–1053 · 655–832 · 553–619 | 414 | 0 | Parasite / alert thin wrappers | already domain — wrappers only |
| 313–550 · 3355–3459 · others | ~600 | 0 | Thin wrappers over existing domains | delete as callers move |

**Interpretation:** the wrapper tax is a *symptom*. Each cluster still calls domains through a facade-local wrapper because the **caller** (listener / paint sequence) never moved. Move the cluster into a shared block and its wrappers disappear on their own — from **both** surfaces at once.

### Keep in facade by prior design

`addEventListener` registration, toasts, focus, `go()`, `t()` inject, element refs, surface storage keys (`petlive-c-*` vs `petlive-*`), demo write block, Google/Drive (B-only), `initIntroAndCloud` B extras.

### Dual-surface tax (largest remaining smell)

| Fork | C | B | Comment |
|---|---|---|---|
| `app.js` | 6526 | 7182 | **96% identical.** B-only ≈864 lines = boot modes, Drive, reconcile, demo write block, legal consent. |
| `styles.css` | 8359 | 8581 | `20260827-css-consolidate` cleaned section comments; **tokens + screens still copied**. |
| `i18n.js` | 3341 | 3654 | Story copy shared; B has extra hub/weight keys at top — drift risk. |
| `index.html` | 2138 | 2346 | ~29 screens duplicated; script lists ~80 tags each. |

Script explosion is the **zero-build** cost. Bundler stays deferred (original ARCH later-phase #7).

### Prior waves — done vs still open

**Adopted (do not redo):** layered ARCH-01–05, leftover-cleanup-c / leftover-abcd / leftover-17, small-brains, wire-bundles, wire-thin-forms, CSS consolidate (comments), modules-write Phase 1 (inventory + door), form-ui-render FO-05, calendars, clinics, allergy, weight, boot-scheduler.

**Still open / deferred on purpose:** `modules/*` as UI DB; bundler; PERF-03 beyond morph; dual `styles.css` / `i18n.js` / screen HTML merge.

## In scope (this proposal)

- Audit + ranked waves below.
- **If Victor confirms Wave 1:** implement on **C first** (passport CSS/script hygiene + clinics slot). Legal-consent is **B-only** — may ship in the same wave as a B-only exception (auth/consent path), called out explicitly.
- **If Victor's target is「`app.js` 太長」(2026-09-03 ask):** the entry point is **Wave 2** (dead code + single-use wrappers, both surfaces, very low risk), then **Wave 3** cluster by cluster. Wave 2 is deletion-only and needs no new block; Wave 3 needs one proposal per cluster.

## Out of scope (until a later proposal)

- Merging C and B into one `passport/app.js`
- Bundler / TypeScript / npm runtime
- Flipping `modules/*` Maps to write truth / dual-write
- Deleting all compatibility wrappers in one PR
- Medical copy, dose/frequency/duration semantics
- CSS visual redesign
- Auto-cover C → B without Victor 覆蓋

## Ranked waves

### Wave 1 — Layer hygiene (recommended next build)

**Impact:** medium correctness / low UX risk. **C first** for BB-5 + clinics; BB-2 is B-only.

| Slice | Layer + path | Facade / tags |
|---|---|---|
| BB-1 | **Domain + core:** `domains/clinics/store.js` uses injected slot; optional `core/storage.js` only if a string-list helper is needed | `c/app.js` + Gate B `app.js` pass existing `createJsonSlot`; bump `?v=` on store + both `index.html` |
| BB-2 | **Core:** e.g. `core/legal-consent-slot.js` **or** inject `hasConsent`/`markConsent` into `shell/legal-consent.js` | **B only** `app.js` / `index.html` — C has no legal-consent script |
| BB-3 | **Core:** `core/pets-graph.js` `archivePet` / `removePet` wrapping `domains/pets/lifecycle.js` | Thin facade; lifecycle tests |
| BB-5 | **Shell CSS already exists:** `shell/intro-stories.css` | **C** `c/index.html` `<link>` (same `?v=` as B) |
| Tests | `qa/tests/web-clinics-catalog.test.js`, `web-pets-graph.test.js`, legal-consent if present | |

**Acceptance (Wave 1):** clinics persist via slot (cache/quota same as other keys); consent still version `v1.2`; archive/remove still one persist; C why-stories picks up shell CSS; no medical copy change.

### Wave 2 — Dead code + single-use wrappers (free win, do first)

Pure deletion, no new blocks, no behavior change. Same edit on both surfaces.

- Delete the 8 zero-reference functions per surface (~40 lines each).
- Inline the 12–14 single-use tiny wrappers at their one call site.
- Move duplicated `locField` to `core/loc-field.js` (inject `getCurrentLang`).

**Expected:** ~150–200 lines off each facade. **Risk:** very low — verified zero references across facade, `index.html`, `i18n.js`, all blocks, and 40 QA tests; no inline HTML handlers exist. Guard with a source-scan test so they cannot come back.

**Files:** `apps/web/c/app.js`, `apps/web/app.js`, `core/loc-field.js` + script tags, `qa/tests/web-facade-hygiene.test.js` (new).

### Wave 3 — Duplicated-cluster extraction (the actual optimization)

One cluster per proposal, **ranked by duplicated mass** from the table above. Each extraction removes the lines from **C and B together**, so the win is ~2× the cluster size, and the cluster's thin wrappers die with it.

Suggested order (largest duplicated mass, lowest medical risk first):

1. **446-line clinic/drug/vax-help cluster** → `shell/clinic-picker.js` (CSS already shipped), `shell/drug-search.js`, vax-help into `shell/feature-hub.js`. 35 listeners, no dose math.
2. **855-line pet photo/crop cluster** → extend `shell/photo-crop.js` + `domains/pets/media.js`. No medical copy.
3. **756-line timeline gesture cluster** → `shell/timeline-gestures.js`. Highest listener count; needs careful event-parity QA.
4. **365-line breed cluster** → extend `shell/breed-form.js`.
5. **362-line parasite/calendar cluster** → extend `shell/parasite-form.js` + `shell/calendar-chooser.js`.
6. **713 + 290 med clusters** → `shell/med-flow.js` / `shell/med-form.js`. **Pharmacist review required** (dose, unit, frequency, compound).
7. Remaining thin-wrapper blocks fall out as their callers move.

Facade keeps `init*(els, hooks)` calls, `t()`, toasts, `go()`. Do **not** move dose/frequency/duration algorithms — those are already domain.

**Note on C sandbox:** shared blocks already serve both surfaces (all of `domains/*` and `shell/*` do today), so this does **not** merge the two surfaces. C keeps its own facade, keys, and can still diverge by passing different hooks. `c-to-b-cover` stays intact.

### Wave 4 — Remaining shared chrome CSS (not bundler; higher ROI than tokens)

**BB-7 + BB-8:** move account-chip + parasite-strip **layout** into `shell/account-chrome.css` + extend `shell/parasite-strip.css`. Delete copies from `c/styles.css` then cover B. No visual redesign. Then, if still wanted: extract `:root` tokens to `shell/tokens.css`.

### Wave 5 — Single i18n catalog (careful)

One `apps/web/i18n.js` with C-only extra keys or missing-key fallback. Legal/story strings must not diverge. Route **legal** reviewer if consent/disclaimer keys move.

### Wave 6 — Screen HTML factories (large)

Shell/domain markup factories for duplicated `<section data-screen>` blocks. Highest conflict with C→B cover workflow. Only after Waves 1–4 feel boring.

### Wave 7 — Explicit non-goals (do not start)

Bundler; `modules/*` as app DB.

**Whole-facade merge** (one `shell/passport-app.js` holding the 5444 shared lines, surfaces reduced to config) would kill the duplication in one move, but it **contradicts `c-to-b-cover`**: C would stop being a safe sandbox, and every C experiment would need a feature flag to avoid reaching B. Only start if Victor explicitly decides to retire the C→B copy workflow.

## Likely files (Wave 1 only)

- `apps/web/domains/clinics/store.js`
- `apps/web/core/pets-graph.js` (+ maybe `core/legal-consent-slot.js`)
- `apps/web/shell/legal-consent.js` (inject, B)
- `apps/web/c/app.js`, `apps/web/c/index.html`
- `apps/web/app.js`, `apps/web/index.html` (B-only consent + cover after Victor 覆蓋)
- `qa/tests/web-clinics-catalog.test.js`, `web-pets-graph.test.js`

## Risks

- **C1 / L1:** clinics + consent keys must stay `petlive-c-*` vs `petlive-*`; do not mix surfaces.
- **I1:** demo write block on B must keep wrapping clinic/graph writes.
- **BB-3:** archive/remove must not double-persist or skip `schedulePetsGraphPersist`.
- **BB-5:** loading intro-stories CSS on C may change why-stories look (that is the point); C discussion chrome must stay.
- Wave 2 deletion: verified zero references and zero inline HTML handlers, but still smoke every screen — a name could be reached via a template string.
- Wave 3 cluster moves must preserve listener **registration order** and `event.target.closest` precedence; the 756-line timeline handler dispatches many `data-*` hooks in sequence.
- Wave 3 med clusters touch dose / unit / frequency / compound → pharmacist blocking review.
- Wave 4 chrome CSS move can regress phone layout if selector order vs §36 compat aliases changes; UI reviewer + C LAN smoke required.

## Acceptance criteria (this Gate A document)

- [x] Audit names layers, leaks, and dual-surface tax with paths
- [x] Waves are ordered; Wave 1 is the only default next build
- [ ] Victor picks: Wave 1 / another wave / audit-only / 否決
- [ ] No `apps/web/` edit until that pick

## Review routing (when a wave builds)

| Wave | Pharmacist | QA | UI | Legal |
|---|---|---|---|---|
| 1 clinics/graph | skip (no med math) | yes | yes if BB-5 CSS | yes if consent storage API changes |
| 1 consent inject | skip | yes | skip | **yes** |
| 2 dead code | skip | yes | skip | no |
| 3 clinic/photo/breed/parasite clusters | skip | yes | yes | no |
| 3 med clusters | **yes (blocking)** | yes | yes | no |
| 4 chrome CSS | skip | yes (tap/overflow) | **yes** | no |
| 5 i18n merge | skip | yes | yes | if legal strings |

Tier 1: consent/storage → read `security.md`; **security diff scan** before Gate B. Tier 2: QA flags BB-n if new brain lands only in `app.js`.

## Notes for Victor

整體**已經是積木架構**：看病、藥、疫苗、時間軸、雲端、底部 dock 都在 `domains/` / `core/` / `shell/`，不是還塞在一支 `app.js` 裡。

還能優化、但不必一次拆光：

1. **小違規** — 診所名單、法律同意還直接碰 `localStorage`；C 的「四則故事」少載一塊 CSS。建議當下一波。
2. **共用 chrome CSS 還沒搬完** — 帳號 chip、預防列版面仍複製在 C/B 兩份 `styles.css`（dock 已經搬對了）。適合作 Wave 4。
3. **C 跟 B 各一份** `app.js` / `styles.css` / 文案 / HTML — 這是最大維護成本，但跟現在「先改 C、你說覆蓋再蓋 B」是配套的。合併要另開一案，不要順手做。
4. **`app.js` 為什麼還很長（已量測，修正我上次的說法）** — 一行轉呼叫只佔 7%（466 行），砍它確實不值得。真正原因是 **C 有 96% 跟 B 逐字一樣**：同一套接線寫了兩份，5444 行重複。
   - 先做 **Wave 2**：8 個沒人叫的函式 + 13 個只用一次的包裝，直接刪，兩邊各少約 150–200 行，風險極低（HTML 沒有 inline handler）。
   - 再做 **Wave 3**：按重複行數從大到小，一次搬一團到 `shell/`（診所/藥品搜尋 446 行 → 照片 855 行 → 時間軸手勢 756 行 …）。搬一次，C 跟 B 同時變短。
   - **不建議**把兩支 facade 合成一支：C 就不再是安全實驗場，違反 `c-to-b-cover`。
5. **不要做** — 打包工具、把 `modules/*` 當資料庫、為了行數硬砍包裝。

請確認此提案：回覆「確認 Wave 1」開始平行製作該波，「確認 Wave N」改做別波，「只要稽核」不開工，「修改：…」調整範圍，或「否決」。
