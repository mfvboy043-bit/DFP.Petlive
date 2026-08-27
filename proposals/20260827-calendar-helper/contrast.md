# Contrast — calendar helper (C only)

## Mainline (before)

| Piece | Location |
|---|---|
| `isoToCompactDate`, `escapeIcsText` | Inline in `c/app.js` |
| Google URL + ICS document | Inline in `openGoogleCalendar` / `openAppleCalendar` |
| Vaccine calendar payload | Inline in `buildVaccineCalendarPayload` in `c/app.js` |
| Parasite payload | Already `domains/parasite` (unchanged) |

## Candidate (`proposal/calendar-helper`)

| Piece | Location |
|---|---|
| Compact date, ICS escape, Google URL, ICS doc | `domains/calendar/helpers.js` |
| Vaccine payload shape + uid | `domains/vaccines/controller.js` |
| `t()` labels, chooser UI, `window.open`, download | Thin facades in `c/app.js` |

## Not in this candidate

- Formal B (`apps/web/app.js`) — cover after Victor confirms C
