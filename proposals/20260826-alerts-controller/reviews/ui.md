# UI review
Verdict: pass

## Scope checked (C candidate vs mainline)

- `renderAlertItem` / `renderAlerts` — HTML structure, class names, severity/source badges, section head/actions, empty states unchanged.
- `ALERT_SECTION_DEFS` — same three sections (`allergy`, `chronic`, `owner`), `titleKey` / `emptyKey` / `types` arrays unchanged.
- Nav badge — `renderAlertBadge` + `syncAlertNavTone` unchanged; still toggles `is-critical` / `is-caution` on `#alert-count-btn`, `.e-nav-alerts`, and `.e-alerts`.
- i18n type labels — `alertTypeLabel()` remains in `c/app.js` with `t()`; domain `normalizeAlert` omits `type`; facades re-apply `alertTypeLabel` on `normalizeAlert`, `getLinkedAlerts`, `getOwnerAlerts`, and `getAlertsForPet`. List renderers call `alertTypeLabel(alert.alertType)` directly, so locale refresh path is preserved.
- Emergency alert list — `renderEmergencyAlertsList` unchanged; still resolves labels via facade.
- Alert CSS — no diff in `.alert-*` rules; section card language intact.

## Findings

- [UI-001] [P3] candidate hygiene — same C worktree bundles unrelated UI deltas (e-card copy button moved to `screen-head-actions`, parasite calendar provider SVG buttons, minor e-card grid/typography tweaks in `styles.css`). Not alerts regressions; consider isolating before cover if Victor wants a pure AL diff.
