---
id: 20260827-parasite-view-render
title: Parasite view render — extract strip HTML/presentation from app.js
status: proposed
author: planner
candidate_branch: "proposal/parasite-view-render"
candidate_path: "proposals/20260827-parasite-view-render"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Parasite view render building blocks

Companion: `state.yaml`.

## Goal

Move **parasite prevention strip presentation** (external + heartworm home rows, empty-row copy) from surface `app.js` into `domains/parasite/render.js`. Facades keep DOM assignment (`textContent` / `classList`), form chips, save/calendar orchestration, and the call to `renderVaccineStrip`.

Builds on adopted parasite **controller + selectors** (`getParasiteSlotStatus`, `stripFlags`, record math, dual-product sync).

## Audit (current)

| Piece | Where now | ~lines |
|---|---|---|
| Record / status / next-due brain | `domains/parasite/controller.js` | ✅ |
| Slot status incl. cat heartworm optional | `domains/parasite/selectors.js` | ✅ |
| `renderParasiteStrip` loop (external + heartworm) | `c/app.js` | ~42 |
| `paintParasiteStripRowEmpty` | facade (B also uses for no-pet shell) | ~15 |
| `renderParasiteProductChips` + chip markup | facade | **stay** (form UI) |
| `fillParasiteKindForm` / save / calendar chooser | facade + controller | **stay** |
| `renderVaccineStrip` inside strip refresh | facade | **stay** (vaccines render ✅) |

## In scope

### PA-05-01 — `domains/parasite/render.js`

Add `PetLiveWeb.domains.parasite.createRenderer(deps)`:

- `buildKindStripPresentation({ record, status, productLabel })` → `{ rowClass, metaText, statusText }`
  - Handles `optional` (cat heartworm unset), unset (`parasiteNotSet`), and normal `parasiteStripMeta`
  - `rowClass`: `is-optional` | `is-protected` | `is-approaching` | `is-unprotected`
- `buildEmptyStripRowPresentation(kind)` → `{ rowClass, metaText, statusText }` for `paintParasiteStripRowEmpty` (`external` / `heartworm` / `vaccine` meta keys)

Inject: `label`, `parasiteStatusLabel(status)` (maps protected/approaching/optional/unprotected copy).

No `document`, `innerHTML` assignment, `localStorage`, literal `t(`, or DOM queries in domain file.

### PA-05-02 — Wire C first

- `c/app.js`: thin `renderParasiteStrip` loop — resolve status/record/product label in facade, apply presentation to row elements; `paintParasiteStripRowEmpty` uses `buildEmptyStripRowPresentation`
- Script tag + `?v=` in `c/index.html` (after parasite selectors/controller)

### PA-05-03 — Tests

- `qa/tests/web-parasite-render.test.js`:
  - optional / unset / protected / approaching / unprotected strip rows
  - empty row for external vs vaccine kind meta keys
  - domain file boundary (no DOM / `t()`)

### PA-05-04 — Cover B after Victor adopt

- Mirror onto `apps/web/app.js` + B `index.html`.

## Out of scope

- Product **chip** HTML (`renderParasiteProductChips`) — form UI slice
- Parasite screen sub-line / scroll focus / cat heartworm hint
- Calendar overlay / `window.open` / ICS download
- Changing optional-cat-heartworm rule or interval math
- Labs / imaging (backlog #4)
- PERF / CSS

## Likely files

| Layer | Path |
|---|---|
| Domain | `apps/web/domains/parasite/render.js` (new) |
| Facade | `apps/web/c/app.js`, later `apps/web/app.js` |
| Load | `apps/web/c/index.html`, later B `index.html` |
| QA | `qa/tests/web-parasite-render.test.js` |

## Risks

- **Cat heartworm optional** — must keep non-alarming copy/classes when status is `optional`; tests lock this.
- **Product label** — preset keys vs custom product name vs fallback; facade resolves label, renderer only embeds string.
- **Empty shell** — `paintParasiteStripEmpty` runs without a pet; empty-row helper must not assume `pet` exists.

## Acceptance

- [ ] Strip presentation helpers under `domains/parasite/render.js`
- [ ] Home prevention external/heartworm rows unchanged behavior (incl. optional cat heartworm)
- [ ] `node --test qa/tests/web-parasite-render.test.js` (+ existing `web-parasite.test.js`) pass
- [ ] Follows `.cursor/rules/web-building-blocks.mdc`

## Notes for Victor（白話）

首頁「外寄生／心絲蟲」兩格的狀態字跟顏色 class，要搬進 `domains/parasite/render.js`。  
產品 chip、表單、存檔、日曆彈窗，還留在 `app.js`。疫苗那一格已經拆好了，這次不動。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
