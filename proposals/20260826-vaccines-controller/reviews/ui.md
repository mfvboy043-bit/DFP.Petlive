# UI review
Verdict: pass

## Scope checked (C candidate vs HEAD)

- `renderVaccineList` — unchanged HTML: `vaccine-item`, `is-protected` / `is-approaching` / `is-expired` / `is-superseded`, `pill-ok` / `pill-soon` / `pill-expired` / `pill-history`, `vaccine-item-main` / `vaccine-item-name` / `vaccine-item-meta`.
- `renderVaccineStrip` — unchanged parasite-row wiring: toggles `is-protected` / `is-approaching` / `is-unprotected` on `#parasite-row-vaccine`; expired still maps to `is-unprotected` (pre-extract behavior).
- `renderEmergencyVaccineNav` + `syncVaccineNavLights` — unchanged: `#e-vaccine-btn` gets `is-protected` / `is-approaching` / `is-expired`; `#e-vaccine-next` gets `e-nav-protected` / `e-nav-approaching` / `e-nav-expired`; `.e-vax-dot` `is-on` + title sync preserved.
- Protection lamp semantics — domain `getVaccineProtectionStatus` keeps thresholds (expired ≤0 days, approaching 1–90, protected >90); facades delegate only, so class assignment paths above stay aligned with CSS.
- Form chips — `VACCINE_PRESETS`, `fillVaccineNameOptions`, and chip click listener byte-identical: `vaccine-chip-row`, `vaccine-chip-row-label`, `chips`, `chip`, `data-vaccine-key`, `is-on` toggle unchanged.
- Vaccine CSS — no diff in `.vaccine-*`, `.pill-*`, `.e-vax-nav.is-*`, `.e-nav-*`, or list item lamp rules (`is-protected` mint / `is-approaching` apricot / `is-expired` rose).
- `index.html` — `#e-vax-lights` dot markup (`e-vax-dot is-green|orange|red`) untouched; only script tags + cache `?v=` added for domain load.

## Findings

- [UI-001] [P3] candidate hygiene — same C worktree bundles unrelated UI deltas (emergency copy-stack button, birth-line order under e-card, `.e-copy-summary` CSS). Not vaccine regressions; consider isolating before cover if Victor wants a pure VC diff.
