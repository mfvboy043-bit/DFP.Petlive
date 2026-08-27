---
id: 20260827-calendar-helper
title: Calendar helper building blocks — Google/Apple export + vaccine payload
status: proposed
author: planner
candidate_branch: "proposal/calendar-helper"
candidate_path: "proposals/20260827-calendar-helper"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Calendar helper building blocks

Companion: `state.yaml`.

## Goal

Extract the **shared calendar export brain** (compact dates, ICS text, Google URL params) and the **vaccine calendar payload** builder into building blocks under `apps/web/domains/`, wired first on **C**, then cover B. Chooser overlay DOM / `window.open` / `<a download>` stay thin facades in surface `app.js`.

## Audit (current)

| Piece | Where now |
|---|---|
| Parasite calendar **data** | Already `domains/parasite.buildParasiteCalendarPayload` (C facade injects `t()` titles) |
| Vaccine calendar **data** | Still inline in `c/app.js` / `app.js` (`buildVaccineCalendarPayload`) |
| Shared export | `isoToCompactDate`, `escapeIcsText`, `openGoogleCalendar`, `openAppleCalendar` (ICS blob) still in surface `app.js` |
| Chooser UI | `#parasite-cal-chooser` overlay + listeners — stay in shell |

## In scope

### CAL-01 — `domains/calendar/` pure helpers

- `apps/web/domains/calendar/helpers.js` (classic IIFE → `PetLiveWeb.domains.calendar`):
  - `isoToCompactDate(iso)`
  - `escapeIcsText(text)`
  - `buildGoogleCalendarUrl(payload, { addDays })` → URL string (no `window`)
  - `buildAppleIcsDocument(payload, { todayISO, addDays, uid })` → ICS string
- No DOM, no `t()`, no `localStorage`.

### CAL-02 — Vaccine payload on vaccines domain

- Add `buildVaccineCalendarPayload(pet, { vaccines, given, next }, { title, details })` (or inject label builders) under `domains/vaccines/` — mirror parasite pattern.
- Facade keeps `t("vaccineCalTitle"|…)` then calls domain.

### CAL-03 — Wire C then B

- C facades: `openGoogleCalendar` / `openAppleCalendar` call calendar helpers then `window.open` / download link only.
- Script tags + `?v=` bump.
- Cover same onto formal B after C confirm (or same proposal lists both if Victor confirms cover-with-build — **default: C first, ask cover**).

### CAL-04 — Tests

- `qa/tests/web-calendar.test.js`: compact date, ICS escaping, Google URL query shape, all-day end = nextDue+1 day.
- Extend vaccines test for payload null without `next`.

## Out of scope

- Redesign calendar chooser UI / CSS
- Changing reminder dates or medical copy
- Photo crop, i18n adapter, PERF, bundler
- Rewriting parasite payload (already extracted)

## Likely files

| Layer | Path |
|---|---|
| Domain | `apps/web/domains/calendar/helpers.js` (new) |
| Domain | `apps/web/domains/vaccines/controller.js` (or selectors) |
| Facade | `apps/web/c/app.js`, later `apps/web/app.js` |
| Load | `apps/web/c/index.html`, later B `index.html` |
| QA | `qa/tests/web-calendar.test.js`, `web-vaccines.test.js` |

## Risks

- **All-day date span:** Google/Apple must keep `DTSTART=nextDue`, `DTEND=nextDue+1` (existing). Tests lock this.
- **ICS special chars** in title/details (`\`, `;`, `,`, newlines) — preserve `escapeIcsText`.
- **i18n:** titles still built in facade with `t()`; domain only receives strings.

## Acceptance

- [ ] Shared export math lives under `domains/calendar/`
- [ ] Vaccine payload builder under vaccines domain; facade thin
- [ ] Chooser still opens Google/Apple with same dates
- [ ] `node --test qa/tests/web-calendar.test.js` (+ vaccines touch) passes
- [ ] Follows `.cursor/rules/web-building-blocks.mdc`

## Notes for Victor（白話）

日曆按鈕後面「算日期、組網址、組行事曆檔」的腦袋，要收成一塊積木。選 Google／Apple 的彈窗還留在畫面上。

請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
