# UI review
Verdict: conditional

Light pass on architecture bridge only (not a visual redesign). Checked degrade copy vs empty, emergency list markup/layout vs mainline, and zh/en/ja/ko keys in preview `i18n.js`.

## Findings

- [UI-001] [P2] emergency alerts degrade — When `_degraded.alerts`, the status line still sits in `.e-alerts` with the usual red bullet, and `syncAlertNavTone(getAlertsForPet(pet))` can still apply `is-critical` / `is-caution` to that block. System-status copy can read like a medical alert. Suggestion: while degraded, clear severity classes on the alerts block (nav tone can stay), mute/remove the alert bullet, and/or style `.is-degraded` as neutral status chrome.

- [UI-002] [P3] degrade chrome — `li.is-degraded` / `.e-alerts.is-degraded` are set in preview `app.js` but have no CSS in shared `styles.css`, so degrade is text-only. Suggestion: light muted treatment (no alert red) so status ≠ empty ≠ severity.

- [UI-003] [P3] degrade copy length — zh/en `emergencyDegradedAlerts` parentheticals are clear (degraded ≠ empty) but long on narrow phones. Meds/weight strings are fine. Suggestion: keep the distinction; optionally shorten the paren to a second short clause if wrap feels noisy.

## Checks (no issue)

- Degrade strings read as system status, not diagnosis; distinct from `noAlertItem` / `noMeds` in all four locales.
- `emergencyDegradedAlerts` / `Meds` / `Weight` present in zh-Hant, en, ja, ko in preview `i18n.js`.
- Alerts/meds still render into existing `#e-alerts` / `#e-meds` `<ul>` with familiar `<li>` / `.e-med` structure; card sections and owner/photo paths unchanged — layout not broken by the new list helpers.
