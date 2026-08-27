# Pharmacist review
Verdict: pass
## Findings
(none)
## Notes
- Scope checked: Wave 1 B move of `formatFrequencyLabel`, `expandFrequencyInText`, `compoundFormLabel` / `compoundFormBadge` / `compoundChipToneClass` into `domains/medications/labels.js` (C facade thin wrappers + `label`/`t` inject).
- Frequency display: SID/BID/TID/EOD map, `unrecorded`/empty → `""`, unknown codes passthrough uppercased — byte-identical to pre-move (`t` → injected `label`).
- Duration expand: same ` · CODE(?= · |$)` and ` · (\\d+) 天` → `durationDaysCount` regex chain; QA covers `1 ml · SID · 7 天` expansion.
- Compound lists: **Name** keys (`*Name`) vs **badge** keys kept separate; defaults `compoundLiquidName` / `compoundLiquid` not swapped; tone classes unchanged.
- Dose units: `formatDosageUnitLabel` / `formatMedDose` / selectors unit path untouched this diff; amount+unit join semantics unchanged.
- Source tags: `owner` / `owner_proof` / `clinic_ref` paths in controller/selectors/timeline not in this commit.
- Disclaimer / diagnostic tone: `drugInfoDisclaimer`, `timelineDrugSource`, alert vet line, i18n tables untouched; no new treatment-authority copy.
- Multi-med pending add/remove/save-all: controller/render unchanged; labels only presentation.
- `labels.js` loaded on C; `web-medications` labels test + existing MD suite pass (14/14).
