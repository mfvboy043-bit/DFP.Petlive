# Pharmacist review
Verdict: pass

## Findings
- None.

## Notes

- **Severity defaults (AL-01)** — `DEFAULT_ALERT_SEVERITY` in `apps/web/domains/alerts/controller.js` matches pre-extract B/C inline logic: `drug_allergy`, `adverse_drug_reaction`, and `vaccine_reaction` → `critical`; `food_allergy`, `chronic_disease`, `special_note` → `caution`. `normalizeSeverity` still maps legacy `high` → `critical` and falls back to type defaults when severity is absent or unknown.
- **ADR / allergy semantics** — `drug_allergy` and `adverse_drug_reaction` remain distinct `alertType` values with the same critical default; both stay grouped under the allergy section via unchanged `ALERT_SECTION_DEFS` in `c/app.js`. `inferAlertType` regex order is verbatim from mainline (allergy tokens before `adverse`, vaccine after adverse); no new cross-type drift.
- **Source tags (linked / owner)** — Domain normalization keeps binary source: explicit `owner` vs fallback `linked` on compose. View facades still render `alertSourceLinked` / `alertSourceOwner` badges in `renderAlertItem` and `(alertSourceOwnerShort)` only for owner rows in `renderEmergencyAlertsList`. Med adjacency source model (`owner`, `owner_proof`, `clinic_ref`) is untouched in `domains/medications/*` and timeline RX blocks.
- **No clinical authority in domain** — `controller.js` / `selectors.js` expose no `t()` strings, disclaimers, or treatment/diagnosis copy; user-facing labels (`alertTypeDrugAllergy`, `alertTypeAdr`, severity hints, chronic “ongoing control” lines) remain in `c/i18n.js` and view facades only. Domain validates draft shape, not clinical truth of free-text allergy/ADR descriptions.
- **Render / med-adjacency paths unchanged (AL-03)** — `getAlertsForPet`, `buildEmergencySnapshot`, `buildEmergencyCopyText`, `renderAlerts`, `renderAlertItem`, `renderEmergencyAlertsList`, and `syncAlertNavTone` still live in `c/app.js` as thin facades over the controller; emergency snapshot still pairs `getAlertsForPet(pet)` with `deriveActiveEmergencyMeds(pet)` without altering med line formatting or dose/frequency display.
- **Pre-existing advisories (not introduced by this slice, non-blocking)** — (1) Free-text allergy/ADR descriptions are not validated against `drugs-database.js` aliases. (2) Linked clinic allergies display as「紀錄串接」, not med-style `clinic_ref`. (3) Legacy rows lacking `alertType` and a recognizable `type` label infer `special_note` / caution default even when description names a drug. These match pre-extract behavior; emergency copy/disclaimer strings unchanged from `20260811-alerts-personalized`.
- **Scope** — No changes to medication dose, unit, frequency, duration, multi-med save, or `modules/medical-alert` dual-write. AL-04 boundary tests explicitly assert critical defaults for `drug_allergy` and severity normalization parity.
