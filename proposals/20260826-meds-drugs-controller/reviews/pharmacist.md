# Pharmacist review
Verdict: pass

## Findings
(none material)

## Notes
- Compared worktree `domains/medications/{controller,selectors}.js` + C facades vs mainline `apps/web/c/app.js` med orchestration for MD-01..MD-04 iteration 1.
- **Dose / unit / frequency / duration:** `normalizeMedUnitForStore` / `normalizeMedFreqForStore` still strip `unrecorded` → `""`. `validateMedDraft` reasons (`need_drug` / `dose` / `days`) match prior boolean gates; amount/days remain optional when null/empty (no invented clinical dosing). `formatDraftDoseLine` / `formatMedDose` / `formatMedCourse` preserve amount·unit·freq·days assembly via injected labels.
- **Multi-med / compound:** `group|schedule` bucketing, solo tagged → non-bundle, ≥2 same group+schedule → `compound_bundle` with `ingredients[]` (name/dose/source) and shared freq/durationDays — parity with mainline. Ingredient sources not collapsed.
- **Source tags:** draft preset still only `clinic_ref` | `owner`. Photo path sets `owner_proof` when any bag/rx/drug proof else `owner`. Timeline still upgrades `owner` → `owner_proof` when proof photos present. No new authority tags.
- **photo_bundle / pending complete:** `appendPhotoBundleToVisit` keeps `kind: "photo_bundle"`, `structuredPending: true`, pending dose text from facade i18n; photo save does **not** call `validateMedDraft` (no forced drug name). `openCompleteDrugs` → completingVisitRef → manual mode unchanged in facade.
- **Disclaimer / tone:** `renderTimelineDrugNotes` still uses `t("timelineDrugSource")` reference-only copy; no diagnosis/treatment-authority wording introduced in domain or facades. Controllers do not write `modules/medication` / Map stores.
- **Non-blocking observation (not a MED finding):** `appendUnitsToVisit` only sets `startDate` when missing (mainline always overwrote). Production pending→save path never pre-sets `startDate`, so stored course dates match. Med-save weight now goes through `visits.saveVisitWeight` (date-gated pet.weight) instead of mainline’s unconditional pet.weight write — intentional visits API; does not change dose strings.
