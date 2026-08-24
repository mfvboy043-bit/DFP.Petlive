# Pharmacist review
Verdict: reject

## Findings
- [MED-001] [high] `preview/apps/web/app.js` `applySelectedPet` → `safeRender("emergencyCard", …)` failure fallback — On whole-card render failure, UI still paints `t("noAlertItem")` / `t("noMeds")` (“尚無醫療警示” / “無未到期用藥”). In an emergency context that reads as confirmed absence of allergy/meds, the same hazard the proposal flags for section degrade. — Suggested fix (advisory): use `emergencyDegradedAlerts` / `emergencyDegradedMeds` (or equivalent system-status chrome) in this fallback; never empty-state copy on failure.
- [MED-002] [medium] `preview/apps/web/i18n.js` `emergencyDegradedMeds` (all locales) — Alerts degrade copy explicitly disambiguates “not no alerts”; meds degrade only says “temporarily unavailable,” which is weaker against skimming next to `noMeds` (“無未到期用藥” / “No active medications”). — Suggested fix (advisory): mirror alerts wording, e.g. system status — not “no active medications.”
- [MED-003] [low] `renderEmergencyMedsFromList` missing-name fallback — Falls through to `t("drugInfoUnavailable")` as the bold drug title. That string is a notes/empty hint (“此藥尚無詳細說明…”), not a name placeholder; if module-shaped rows without `name` ever surface, it can look like a clinical content claim. Snapshot path usually has `name`; keep a neutral “unknown drug / 藥名未載入” label instead.

## Notes
- Section `_degraded.alerts` / `_degraded.medications` paths correctly avoid empty-state keys; zh/en/ja/ko alert degrade strings state system status and not “no alerts.” Tone is operational, not diagnostic.
- Snapshot meds from `deriveActiveEmergencyMeds` → `buildEmergencySnapshot` carry `dose` / structured amount·unit·freq plus `startDate`/`durationDays`; happy-path dose + course display via `formatMedDose` / `formatMedCourse` is coherent. Card footer / sub keep reference-only framing (`emergencySub`, `eFoot`).
- Owner alert source short tag still shown on emergency alert lines; no new treatment-authority wording introduced in degrade chrome.
