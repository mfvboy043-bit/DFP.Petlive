---
id: 20260827-vaccines-view-render
title: Vaccines view render — extract HTML builders from app.js
status: proposed
author: planner
candidate_branch: "proposal/vaccines-view-render"
candidate_path: "proposals/20260827-vaccines-view-render"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Vaccines view render building blocks

Companion: `state.yaml`.

## Goal

Move **vaccine screen HTML string builders and presentation helpers** (list rows, home strip copy, emergency nav tone) from surface `app.js` into `domains/vaccines/render.js`. Facades keep DOM assignment (`innerHTML` / `textContent` / `classList`), form chip wiring, save orchestration, and calendar handoff.

Builds on adopted vaccines **selectors + controller** (`getNextVaccine`, `getVaccineProtectionStatus`, `getVaccineSuccessor`, `compareVaccinesForList`, upsert/save brain).

## Audit (current)

| Piece | Where now | ~lines |
|---|---|---|
| Protection status / next / successor / sort | `domains/vaccines/selectors.js` | ✅ |
| Upsert / draft validation | `domains/vaccines/controller.js` | ✅ |
| `renderVaccineList` | `c/app.js` | ~42 |
| `renderVaccineStrip` | facade (classList + text) | ~37 |
| `renderEmergencyVaccineNav` + `syncVaccineNavLights` | facade (classList + text) | ~50 |
| `renderVaccines` orchestration | facade | **stay** |
| `fillVaccineNameOptions` / form chips | facade | **stay** (form UI) |
| `refreshVaccineForm` / save / calendar | facade + controller | **stay** |
| `vaccineLabelOf` / `resolveVaccineKey` | facade i18n helpers | inject callback |

## In scope

### VA-05-01 — `domains/vaccines/render.js`

Add `PetLiveWeb.domains.vaccines.createRenderer(deps)`:

- `buildEmptyListHtml()` — `<li class="vaccine-empty">…</li>`
- `buildVaccineListHtml(pet, vaccines)` — sorted list markup; returns full innerHTML for `#vaccine-list`
  - Uses injected: `compareVaccinesForList`, `getVaccineSuccessor`, `getVaccineProtectionStatus`, `vaccineLabelOf`
  - Preserves superseded / expired / approaching / protected pill classes and copy keys
- `buildStripPresentation(nextVaccine)` — `{ rowClass, metaText, statusText }` for home prevention row (`#parasite-row-vaccine`)
- `buildEmergencyNavPresentation(nextVaccine)` — `{ nextText, nextClassName, btnClass, lightStatus }` for `#e-vaccine-next` / `#e-vaccine-btn` + nav lights

Inject: `label`, `compareVaccinesForList`, `getVaccineSuccessor`, `getVaccineProtectionStatus`, `vaccineLabelOf`, `getNextVaccine` (optional if facade passes resolved next).

No `document`, `innerHTML` assignment, `localStorage`, literal `t(`, or DOM queries in domain file.

### VA-05-02 — Wire C first

- `c/app.js`: thin wrappers — call renderer, assign `vaccineList.innerHTML`; apply strip/nav presentation to existing elements; keep `syncVaccineNavLights` in facade (toggles `.e-vax-dot.is-on`)
- Script tag + `?v=` in `c/index.html` (after vaccines selectors/controller)

### VA-05-03 — Tests

- `qa/tests/web-vaccines-render.test.js`:
  - empty list markup
  - list item: protected / approaching / expired / superseded pills + classes
  - strip presentation: not-set vs protected vs approaching vs expired
  - emergency nav presentation: no-next vs each status tone
  - domain file boundary (no DOM / `t()`)

### VA-05-04 — Cover B after Victor adopt

- Mirror onto `apps/web/app.js` + B `index.html`.

## Out of scope

- Vaccine **form chips** (`fillVaccineNameOptions`) — separate form-UI slice
- Parasite strip (backlog #3 sibling — parasite view render is next after this)
- Calendar payload / ICS (already in `domains/calendar/helpers.js`)
- Changing protection thresholds (90-day approaching), medical copy, or vaccine preset keys
- PERF / CSS

## Likely files

| Layer | Path |
|---|---|
| Domain | `apps/web/domains/vaccines/render.js` (new) |
| Facade | `apps/web/c/app.js`, later `apps/web/app.js` |
| Load | `apps/web/c/index.html`, later B `index.html` |
| QA | `qa/tests/web-vaccines-render.test.js` |

## Risks

- **Superseded vs active status** — list row must still call `getVaccineSuccessor` before protection pill; wrong order would show misleading「已過期」on superseded lines.
- **Emergency nav lights** — `syncVaccineNavLights` maps `expired` → red dot; presentation helper must emit the same status keys the facade expects.
- **i18n vaccine names** — `vaccineLabelOf` stays injected from facade so preset keys and custom names stay correct across language switches.

## Acceptance

- [ ] Vaccine list + strip + emergency nav presentation under `domains/vaccines/render.js`
- [ ] Home prevention row, vaccines screen list, emergency vaccine sub-line unchanged behavior
- [ ] `node --test qa/tests/web-vaccines-render.test.js` (+ existing `web-vaccines.test.js`) pass
- [ ] Follows `.cursor/rules/web-building-blocks.mdc`

## Notes for Victor（白話）

疫苗頁的「已打列表」、首頁預防列上的疫苗狀態、急診卡疫苗那一行的字跟顏色，HTML/文案組裝要搬進 `domains/vaccines/`。  
表單上的疫苗 chip、存檔、加行事曆，還留在 `app.js`。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
