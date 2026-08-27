---
id: 20260827-emergency-view-render
title: Emergency view render — extract card HTML builders from app.js
status: proposed
author: planner
candidate_branch: "proposal/emergency-view-render"
candidate_path: "proposals/20260827-emergency-view-render"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Emergency view render building blocks

Companion: `state.yaml`.

## Goal

Move **emergency card HTML string builders** (alerts list, active meds list, owner block, degraded rows) from surface `app.js` into `domains/emergency/render.js`. Facades keep DOM assignment, `PetLive.emergency` bridge, identity `textContent` paints, nav sub-lines, and photo frame styling.

Builds on adopted emergency **adapter + selectors** (`deriveActiveEmergencyMeds`, `copyPayload`, `degradedSections`).

## Audit (current)

| Piece | Where now | ~lines |
|---|---|---|
| Snapshot / active meds brain | `domains/emergency/adapters.js` | ✅ |
| Copy payload / degraded flags | `domains/emergency/selectors.js` | ✅ |
| `renderEmergencyAlertsList` | `c/app.js` | ~30 |
| `renderEmergencyMeds` + `renderEmergencyMedsFromList` | facade | ~75 |
| `renderEmergencyOwner` | facade | ~40 |
| Degraded list HTML snippets | inline in `renderEmergencyCard` | ~15 |
| `renderEmergencyCard` orchestration + module bridge | facade | **stay** |
| `paintEmergencyIdentity/Birth/Chip` | facade text paints | **stay** |
| `renderEmergencyPetPhoto` | facade (backgroundImage) | **stay** |
| `renderEmergencyVaccine/Lab/Imaging Nav` | facade DOM sub-lines | **stay** (or tiny label helpers later) |
| Drug-note lazy shell | reuses `timelineRenderer.buildDrugNotesShellHtml` | inject callback |

## In scope

### EM-05-01 — `domains/emergency/render.js`

Add `PetLiveWeb.domains.emergency.createRenderer(deps)`:

- `buildAlertsListHtml(alerts, labels)` — severity classes, owner-source tag, escaped text
- `buildMedListHtml(meds, ctx)` — local + module med rows; returns `{ html, drugNotePanels[] }` (same contract as timeline render)
- `buildOwnerBlockHtml(profile, labels)` — rows for filled owner fields only
- `buildDegradedListHtml(section, label)` — single `<li class="is-degraded">…</li>`
- `buildWeightHtml({ weight, date, labels })` — matches `eWeight.innerHTML` shape

Inject: `label`, `escapeHtml`, `alertTypeLabel`, `alertLineText`, `locField`, `formatMedDose`, `formatMedCourse`, `expandFrequencyInText`, `notesIdForMed`, `buildDrugNotesShell`.

No `document`, `innerHTML` assignment, `localStorage`, literal `t(`, or `PetLive.emergency` calls in domain file.

### EM-05-02 — Wire C first

- `c/app.js`: thin wrappers — call renderer, assign `eAlerts`/`eMeds`/`eOwner`/`eWeight.innerHTML`, keep `renderEmergencyCard` bridge + paints
- Reuse existing `drugNotesMedByPanelId` registration from med list builder
- Script tag + `?v=` in `c/index.html`

### EM-05-03 — Tests

- `qa/tests/web-emergency-render.test.js`:
  - alert severity + owner-source markup
  - med list with drug-note shell + panel registration
  - owner block skips empty fields
  - degraded row class
  - domain file boundary (no DOM / `t()`)

### EM-05-04 — Cover B after Victor confirms C or with adopt

- Mirror onto `apps/web/app.js` + B `index.html`.

## Out of scope

- Emergency **nav** strips (vaccine/lab/imaging sub-lines) — stay facade unless trivial follow-up
- Photo crop overlay (separate backlog #5)
- Changing module bridge / snapshot shape / medical copy
- Copy-to-clipboard orchestration (uses `copyPayload` — unchanged)
- PERF / CSS

## Likely files

| Layer | Path |
|---|---|
| Domain | `apps/web/domains/emergency/render.js` (new) |
| Facade | `apps/web/c/app.js`, later `apps/web/app.js` |
| Load | `apps/web/c/index.html`, later B `index.html` |
| QA | `qa/tests/web-emergency-render.test.js` |

## Risks

- **Module vs local med row shape** — `renderEmergencyMedsFromList` accepts module rows; builder must handle both via normalized view object (existing facade logic).
- **HTML escape** — alert/med names must keep `escapeAlertHtml` parity; tests lock critical chars.
- **Drug notes** — emergency re-render must still clear/register `drugNotesMedByPanelId` like timeline.

## Acceptance

- [ ] Card list HTML builders under `domains/emergency/render.js`
- [ ] `renderEmergencyCard` / local fallback unchanged behavior (module path + degrade)
- [ ] Lazy drug-note expand on emergency meds still works
- [ ] `node --test qa/tests/web-emergency-render.test.js` (+ existing `web-emergency.test.js`) pass
- [ ] Follows `.cursor/rules/web-building-blocks.mdc`

## Notes for Victor（白話）

急診卡上「提醒列表、用藥列表、飼主聯絡、降級提示」的 HTML 組字串，要搬進 `domains/emergency/`。  
按 module 橋接、大頭貼、疫苗/檢驗導航列，還留在 `app.js`。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
