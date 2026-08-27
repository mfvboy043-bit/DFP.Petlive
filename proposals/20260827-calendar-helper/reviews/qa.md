# QA — calendar helper building blocks

Verdict: pass

## Checks

- `node --test qa/tests/web-calendar.test.js qa/tests/web-vaccines.test.js` — all pass
- Shared export math lives in `domains/calendar/helpers.js` (no DOM / `t()` / `window.open`)
- Vaccine payload builder on `domains/vaccines/controller.js`; C facade keeps `t()` labels
- C chooser + `window.open` / ICS download remain thin facades in `c/app.js`
- All-day span locked: `DTSTART=nextDue`, `DTEND=nextDue+1` (Google dates + ICS)

## Findings

(none blocking)
