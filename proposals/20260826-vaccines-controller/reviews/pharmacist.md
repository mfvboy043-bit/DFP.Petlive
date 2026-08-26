# Pharmacist review
Verdict: conditional

## Findings

- [MED-001] [medium] `apps/web/domains/vaccines/selectors.js` — `isRabiesVaccineEntry` uses substring heuristics (`includes("狂犬")`, `includes("rabies")`, `includes("광견병")`) for custom names; a cat owner typing a negated or incidental string (e.g. 非狂犬病) can be blocked by `validateSave` → `species_blocked` even though the entry is not rabies. Behavior matches pre-extract C; extraction preserves the same risk in the domain fallback and in C-injected `isRabiesLocalizedName`. — Tighten matching to whole-token / preset-key paths, or require `vRabies` key or exact localized label before blocking custom names (advisory; not a VC-01..04 regression but species-gate accuracy).

- [MED-002] [low] `apps/web/domains/vaccines/selectors.js` — When `isRabiesLocalizedName` is not injected, the domain fallback omits C's I18N exact-match against `table.vRabies` (see `c/app.js` `isRabiesLocalizedName`). C wiring injects the full helper, so production C is OK; standalone/test callers without injection may miss rabies rows saved under a locale label that is not caught by substring rules. — Document injection as required, or mirror the I18N exact-label branch in tests that omit the injector (advisory).

- [MED-003] [low] `apps/web/c/i18n.js` (`vHeartwormInj`) — Preset label embeds trade/product names (zh 「心絲蟲針劑（寵愛心思）」; en 「Heartworm shot (ProHeart)」). Reference-only record label, not introduced by VC-01..04, but reads closer to product endorsement than neutral antigen naming. — Optional follow-up: neutralize to “heartworm injection” without brand parenthetical (out of VC scope).

## Notes

**Combo naming (VC-01):** `PROTECTION_META` in `selectors.js` byte-matches formal B inline map: dog `coreCombo` tiers 5→11, cat `felineCore` 3/5, `displayRank` ordering (combo 10 → heartworm inj 20 → rabies 30 → lepto 40 → felv 45 → chlamydia 46 → lyme 50 → custom 80). All preset keys have zh-Hant / en / ja / ko i18n entries; chip exclusive groups (`coreCombo`, `felineCore`) still read from the same meta via `VACCINE_PROTECTION_META` alias in C. No catalog drift detected.

**Rabies gate (VC-01/02/03):** Cat UI presets exclude `vRabies`; save path calls `vaccinesController.buildSaveEntries` → `validateSave` → `vaccineAllowedForPet` + `isRabiesVaccineEntry` (key `vRabies`, injected localized-name helper, substring fallback). Toast uses `toastVaccineNotForCat` (product availability wording, not clinical directive). Dog/other species unchanged.

**Diagnostic / treatment-authority tone:** Domain modules expose no user-facing strings. Vaccine render paths in `c/app.js` (`renderVaccineList`, `renderVaccineStrip`, `renderEmergencyVaccineNav`, form submit toasts, calendar payload) still source copy from i18n; status pills (`protected`, `dueWithin90`, `protectionLost`) describe passport record timing, not diagnosis or prescribing. Calendar details retain 「僅供參考」 / “reference only”. No new treatment-authority or diagnostic wording introduced by this extraction.

**Out of scope for this slice:** Med dose/units, source tags (`owner` / `clinic_ref`), `drugs-database.js` — not applicable to vaccines VC-01..04.
