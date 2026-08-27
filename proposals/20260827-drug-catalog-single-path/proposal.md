---
id: 20260827-drug-catalog-single-path
title: Drug catalog single path — one seed, one search brain
status: proposed
author: planner
candidate_branch: "proposal/drug-catalog-single-path"
candidate_path: "proposals/20260827-drug-catalog-single-path"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Drug catalog single path

Companion: `state.yaml`.

## Goal

Finish ARCH later phase **Drug seed deduplication**. The **data file** is already single (`modules/drug/seed.js` → `runtime/petlive.js` → `window.drugs` + `PetLive.drug`). This slice removes the **leftover copycat search / enrich brains** in surface facades and `domains/medications`, so drug lookup always goes one path: modular `PetLive.drug` (with a thin web adapter), not a second local filter copy.

## Current fact (audit)

| Piece | Status |
|---|---|
| `apps/web/drugs-database.js` | **Gone** — not on main |
| Canonical seed | `modules/drug/seed.js` (~76 drugs) |
| Bridge | `apps/web/runtime/petlive.js` sets `window.drugs` + exports `PetLive.drug` |
| Leftover | C `searchDrugs` / `resolveEnrichedDrug` still re-filter `drugs[]`; medications `searchLocal` duplicates the same haystack logic |

## In scope

### DC-01 — One search / enrich adapter (building block)

- Add a small web adapter under the building-block layout, e.g. `apps/web/domains/drugs/` **or** `apps/web/runtime/drug-catalog.js` (Planner preference: **`apps/web/domains/drugs/`** selectors/adapter — pure, no DOM):
  - `searchDrugs(query)` → prefer `PetLive.drug.searchDrugs`, unwrap `ModuleResult`
  - `getDrugById` / `resolveEnrichedDrug` → prefer module, fallback only to same seed list reference (not a second algorithm)
- Classic IIFE + `PetLiveWeb.domains.drugs` public API; zero-build.

### DC-02 — Wire C + B facades

- `c/app.js` and `app.js`: delete inline haystack filter; facade → `domains/drugs` (or inject into medications controller).
- Medications controller: remove duplicated `searchLocal` haystack **or** inject the drugs adapter so there is one implementation.
- Load new script in C/B `index.html` before `app.js`; bump `?v=`.

### DC-03 — Keep one seed source of truth

- Do **not** reintroduce `drugs-database.js`.
- Document in comment / ARCHITECTURE one line: seed = `modules/drug/seed.js` only.
- Stale proposal review mentions of `drugs-database.js` need not be rewritten (history).

## Out of scope

- Changing drug medical content, aliases, dose guidance, or disclaimer tone
- New drug entries / catalog expansion
- Bundler; moving seed off ESM import
- Rewriting all med form DOM
- Token / cloud / unrelated domains

## Likely files

| Layer | Path |
|---|---|
| Domain | `apps/web/domains/drugs/adapter.js` (or `selectors.js` + thin controller) |
| Runtime | `apps/web/runtime/petlive.js` (touch only if bridge tweak needed) |
| Module (read-only unless bug) | `modules/drug/seed.js`, `modules/drug/index.js` |
| Facade | `apps/web/c/app.js`, `apps/web/app.js` |
| Shell load | `apps/web/c/index.html`, `apps/web/index.html` |
| Domain touch | `apps/web/domains/medications/controller.js` (drop duplicate searchLocal) |
| QA | `qa/tests/web-drugs.test.js` (new) + existing `qa/tests/drug-search.test.js` |

## Risks

- **Search behavior drift** if local fallback haystack differs from module (sideEffects/precautions in C filter vs module). Acceptance: same hits for shared fixtures (Pred / 普力 / Apoquel).
- **Module missing** (PetLive not loaded): adapter must degrade safely (empty list / null), not throw into shell.
- **Pharmacist:** no dose/unit/disclaimer copy change; still reference-only enrichment display.

## Acceptance criteria

- [ ] No second drug seed file under `apps/web/`
- [ ] Single search implementation used by C + B (+ medications); no duplicated haystack filter in `c/app.js` / `app.js`
- [ ] `node --test qa/tests/drug-search.test.js qa/tests/web-drugs.test.js` passes
- [ ] Med search UX on C unchanged for known aliases (smoke)
- [ ] Follows `.cursor/rules/web-building-blocks.mdc` (domain block → thin facade → script tag)

## Notes for Victor（白話）

藥物**大名單**已經只剩一份了。這次要清的是：搜尋時還有人「再抄一次找法」——改成大家都走同一條路。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
