# Pharmacist review
Verdict: pass

## Findings
- None. Scope held: architecture extraction only; no medical-copy or med-semantics changes in candidate.

## Notes
- **MED-1** Med draft read — `readMedDraftFromForm` now delegates to existing `medicationsController.draftFromFields` with the same fields (amount/days/unit/frequency/compoundGroup/compoundColor/sourcePreset/drugName). Facade still resolves compound color before draft; `clinic_ref` vs `owner` still enforced in controller. Dose units, frequency, duration, and compound list shape preserved.
- **MED-2** Validate / toasts — `validateMedDraft` still maps `need_drug` / `dose` / `days` → existing `t("toastNeedDrug"|"toastDose"|"toastDays")`; no new diagnostic or treatment-authority wording.
- **MED-3** Domain / HTML — `domains/medications/` untouched; med-form disclaimer / dose / frequency / duration markup and i18n keys unchanged (script `?v=` only in `c/index.html`).
- **MED-4** Adjacent — emergency `addDays` optionally uses shared `core/dates` with bit-for-bit local-midnight ISO math (med end-date); timeline morph does not alter drug-note / dose HTML builders’ medical content.
- Multi-med pending add/remove/save-all and source tags remain on the prior controller path; no pharmacist blocker for adopt from this slice.
