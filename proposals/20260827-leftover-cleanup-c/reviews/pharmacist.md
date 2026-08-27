# Pharmacist review
Verdict: pass

## Findings

(none)

## Notes

Compared candidate `cursor/leftover-cleanup-c-7855` to mainline `apps/web/c/app.js` for med-adjacent extractions blocks. Formal B (`apps/web/app.js`) untouched.

- **Vaccine presets** (`domains/vaccines/presets.js`): `VACCINE_PRESETS` byte-identical to pre-extract facade (whitespace/comments aside). Dog keeps `vRabies` in other-group; **cat keys are only `v3in1`, `v5in1Cat`, `vFelv`, `vChlamydia` — no `vRabies`**. `other` / unknown species still resolve to rabies-only via `getPresetGroups`. Facade `fillVaccineNameOptions` only swaps lookup to `getPresetGroups(species)`; clear/HTML/hint behavior unchanged.
- **Seed meds** (`domains/pets/seed.js`): `SEED_PETS` identical to mainline. All 22 name/dose/source(/frequency) tuples unchanged (`owner` / `clinic_ref`; SID/BID strings preserved). `cloneSeedPets` still JSON deep-copy with shallow fallback.
- **Source tags** (`domains/visits/labels.js`): `getSourceTags` still exposes `owner` / `owner_proof` / `clinic_ref` with same classNames; facade delegates via `visitLabels.getSourceTags()`. Timeline still upgrades proof to `owner_proof` in render (unchanged logic).
- **Timeline keyed plan**: adds `data-visit-index` + reconcile helpers only; med item HTML / dose display / source-tag rendering not altered. Partial DOM replace still rebuilds `drugNotesMedByPanelId` from full `buildTimelineListHtml` panels.
- **Tone**: no new diagnosis/treatment-authority wording in moved catalog/seed/label files.
- QA smoke: `web-vaccines-presets.test.js` + `web-pets-seed.test.js` pass.
