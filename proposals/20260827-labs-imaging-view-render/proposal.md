---
id: 20260827-labs-imaging-view-render
title: Labs + imaging view render — extract HTML/presentation from app.js
status: proposed
author: planner
candidate_branch: "proposal/labs-imaging-view-render"
candidate_path: "proposals/20260827-labs-imaging-view-render"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Labs + imaging view render building blocks

Companion: `state.yaml`.

## Goal

Move **lab report list HTML**, **imaging visit list HTML**, and **emergency card sub-lines** for labs/imaging from surface `app.js` into `domains/labs/render.js` and `domains/imaging/render.js`. Facades keep DOM assignment, form drafts (photo previews, clinic typeahead), save/upload orchestration, and lightbox listeners.

Builds on adopted **labs controller + selectors** and **imaging controller** (`getLabReportsForPet`, `sortLabReports`, `getImagingVisitEntries`, visit imaging model).

## Audit (current)

| Piece | Where now | ~lines |
|---|---|---|
| Lab CRUD / sort / types filter | `domains/labs/controller.js` + `selectors.js` | ✅ |
| Imaging visit entries / photo caps | `domains/imaging/controller.js` | ✅ |
| Timeline visit imaging thumbs | `domains/timeline/render.js` | ✅ |
| `renderLabList` | `c/app.js` | ~48 |
| `renderEmergencyLabNav` | facade | ~16 |
| `renderImagingList` | facade | ~34 |
| `renderEmergencyImagingNav` | facade | ~16 |
| `renderLabPhotoPreviews` / `renderLabClinicResults` | facade | **stay** (form UI) |
| `renderImagingSlotPreviews` | facade | **stay** (form draft) |
| Lab save / visit link / file pickers | facade + controller | **stay** |

## In scope

### LB-05-01 — `domains/labs/render.js`

Add `PetLiveWeb.domains.labs.createRenderer(deps)`:

- `buildEmptyListHtml()`
- `buildLabListHtml(reports, ctx)` — full `#lab-list` innerHTML; inject `escapeHtml`, `formatLabTypes`, `label`
- `buildEmergencyNavPresentation(reports)` → `{ subText, i18nMode }` where `i18nMode` is `"empty"` | `"dynamic"` (facade sets/removes `data-i18n` on `#e-lab-sub`)

### IM-05-01 — `domains/imaging/render.js`

Add `PetLiveWeb.domains.imaging.createRenderer(deps)`:

- `buildEmptyListHtml()` — empty state + go-timeline button markup
- `buildImagingListHtml(entries, ctx)` — `#imaging-list` items; inject `escapeHtml`, `visitClinicLabel`, `formatImagingTypes`, `label`
- `buildEmergencyNavPresentation(entries)` → `{ subText, i18nMode }` for `#e-xray-sub`

No `document`, `innerHTML` assignment, `localStorage`, literal `t(`, or file I/O in domain files.

### LI-05-02 — Wire C first

- `c/app.js`: thin wrappers for four render functions; init `labsRenderer` / `imagingRenderer` after domain controllers (near `vaccineRenderer` / `parasiteRenderer`)
- Script tags + `?v=` in `c/index.html`

### LI-05-03 — Tests

- `qa/tests/web-labs-render.test.js` — empty list, report row thumbs/note/remove attrs, emergency nav empty vs latest
- `qa/tests/web-imaging-render.test.js` — empty + go-timeline btn, list item attrs, emergency nav
- Domain boundary checks (no DOM / `t()`)

### LI-05-04 — Cover B after Victor adopt

- Mirror onto `apps/web/app.js` + B `index.html`.

## Out of scope

- Lab **form** previews / clinic typeahead / type chips
- Imaging **pending slot** previews (`renderImagingSlotPreviews`)
- Visit imaging upload/compress/submit flows
- Changing lab report schema or imaging photo caps
- Alerts view render (separate slice)
- PERF / CSS

## Likely files

| Layer | Path |
|---|---|
| Domain | `apps/web/domains/labs/render.js`, `domains/imaging/render.js` (new) |
| Facade | `apps/web/c/app.js`, later `apps/web/app.js` |
| Load | `apps/web/c/index.html`, later B `index.html` |
| QA | `qa/tests/web-labs-render.test.js`, `web-imaging-render.test.js` |

## Risks

- **HTML escape** — clinic names, notes, dates must keep `escapeAlertHtml` parity on list rows.
- **Emergency sub-line i18n** — empty state uses `data-i18n`; dynamic latest line clears attribute; facade must preserve this contract.
- **Imaging empty CTA** — `data-go-timeline-from-imaging` button must remain on empty list markup.

## Acceptance

- [ ] Lab + imaging list + emergency nav presentation under respective `domains/*/render.js`
- [ ] Labs screen list + emergency lab sub-line unchanged behavior
- [ ] Imaging screen list + emergency imaging sub-line unchanged behavior
- [ ] `node --test` new render tests + existing `web-labs.test.js` / `web-imaging.test.js`
- [ ] Follows `.cursor/rules/web-building-blocks.mdc`

## Notes for Victor（白話）

檢驗報告列表、影像列表、急診卡上「最新檢驗／影像」那行小字，HTML 組裝要搬進 `domains/labs/` 和 `domains/imaging/`。  
上傳照片預覽、診所搜尋、存檔流程，還留在 `app.js`。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
