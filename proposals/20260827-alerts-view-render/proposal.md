---
id: 20260827-alerts-view-render
title: Alerts view render — extract HTML builders from app.js
status: proposed
author: planner
candidate_branch: "proposal/alerts-view-render"
candidate_path: "proposals/20260827-alerts-view-render"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Alerts view render building blocks

Companion: `state.yaml`.

## Goal

Move **alerts screen HTML string builders** (single alert row, flat list, sectioned layout) from surface `app.js` into `domains/alerts/render.js`. Facades keep title/subline `textContent`, compose form, save/delete orchestration, home badge (`renderAlertBadge`), and emergency nav tone (`syncAlertNavTone`).

Builds on adopted alerts **controller + selectors** (`getAlertsForPet`, sort, severity, owner-draft validation).

## Audit (current)

| Piece | Where now | ~lines |
|---|---|---|
| Merge owner + linked alerts, CRUD | `domains/alerts/controller.js` | ✅ |
| Sort / severity / filter | `domains/alerts/selectors.js` | ✅ |
| `renderAlertItem` | `c/app.js` | ~40 |
| `renderAlerts` (flat + sectioned) | facade | ~48 |
| `ALERT_SECTION_DEFS` | facade constant | **stay** (passed into renderer) |
| `chronicSinceLine` | facade helper | inject callback |
| Alert compose / edit / since field | facade | **stay** |
| `renderAlertBadge` / `syncAlertNavTone` | facade | **stay** (home + emergency chrome) |

## In scope

### AL-05-01 — `domains/alerts/render.js`

Add `PetLiveWeb.domains.alerts.createRenderer(deps)`:

- `buildAlertItemHtml(alert)` — severity badge, source tag, desc, since, note, edit/delete actions
- `buildFlatEmptyListHtml()` — legacy single `<li>` empty state
- `buildFlatListHtml(alerts)` — map of items for `#alert-list`
- `buildSectionsHtml({ alerts, sections, editingSectionIds })` — allergy / chronic / owner sections with edit toggle + add button markup

Inject: `label`, `escapeHtml`, `alertTypeLabel`, `alertLineText`, `locField`, `chronicSinceLine`.

No `document`, `innerHTML` assignment, `localStorage`, literal `t(`, or storage slots in domain file.

### AL-05-02 — Wire C first

- `c/app.js`: thin `renderAlerts` — set title/sub, assign `alertList` / `alertSections.innerHTML` via renderer; keep `renderAlertItem` as one-line delegate or remove in favor of renderer method
- Script tag + `?v=` in `c/index.html` (after alerts controller/selectors)

### AL-05-03 — Tests

- `qa/tests/web-alerts-render.test.js`:
  - item: critical vs caution, owner source, chronic since line, edit/delete data attrs
  - flat empty vs list
  - sectioned layout: empty section copy, `is-editing` class when section id in set
  - domain file boundary (no DOM / `t()`)

### AL-05-04 — Cover B after Victor adopt

- Mirror onto `apps/web/app.js` + B `index.html`.

## Out of scope

- Home **alert badge** + emergency nav tone (`renderAlertBadge`, `syncAlertNavTone`)
- Alert compose form, type/severity chips, since-month field visibility
- Changing severity semantics or medical copy
- PERF / CSS

## Likely files

| Layer | Path |
|---|---|
| Domain | `apps/web/domains/alerts/render.js` (new) |
| Facade | `apps/web/c/app.js`, later `apps/web/app.js` |
| Load | `apps/web/c/index.html`, later B `index.html` |
| QA | `qa/tests/web-alerts-render.test.js` |

## Risks

- **Section edit mode** — `is-editing` + `aria-pressed` must match `editingAlertSectionIds` Set passed from facade.
- **HTML escape** — alert id/description in data attributes and text; tests lock `escapeHtml` on ids.
- **Legacy flat list** — some builds use `#alert-list` without `#alert-sections`; both paths must stay behavior-identical.

## Acceptance

- [ ] Alert item + flat/section list HTML under `domains/alerts/render.js`
- [ ] Alerts screen list/sections unchanged (linked + owner items, chronic since, actions)
- [ ] `node --test qa/tests/web-alerts-render.test.js` (+ existing `web-alerts.test.js`) pass
- [ ] Follows `.cursor/rules/web-building-blocks.mdc`

## Notes for Victor（白話）

提醒頁「每一條過敏／慢性病／備註」的 HTML，和三大區塊的列表組裝，要搬進 `domains/alerts/`。  
填寫表單、首頁提醒按鈕、急診卡色條，還留在 `app.js`。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
