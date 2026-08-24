# Pharmacist review
Verdict: pass

## Findings
(none open)

## Notes
- **MED-001 resolved:** `safeRender("emergencyCard", …)` onError now calls `paintEmergencyCardDegradedShell()`, which paints `emergencyDegradedAlerts` / `emergencyDegradedMeds` / `emergencyDegradedWeight` with `.is-degraded` chrome — not `noAlertItem` / `noMeds`. Whole-card failure no longer reads as confirmed absence of allergy/meds.
- **MED-002 resolved (also in preview):** `emergencyDegradedMeds` in zh/en/ja/ko now mirrors alerts disambiguation (system status — not “no meds” / 「無用藥」 / etc.).
- **MED-003 resolved (also in preview):** `renderEmergencyMedsFromList` missing-name fallback uses `t("emergencyMedNameUnknown")` (“藥名未載入” / locale peers), not `drugInfoUnavailable`.
- Section `_degraded.alerts` / `_degraded.medications` paths still use degrade keys; empty-state keys remain only for true empty lists. Tone stays operational/reference-only; no new treatment-authority wording.
