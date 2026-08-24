# Contrast: lab reports photo archive

## Mainline

- Emergency docs row has two disabled buttons; labs subtitle is「即將開放」.
- No lab report screen, storage, or visit link.
- Rx proof photos stay on visits (`bagPhoto` / `rxPhoto` / `drugPhoto`).
- Emergency card is still a read-only assemble of alerts, meds, owner.
- Contracts have Visit / Medication; no LabReport type.

## Candidate

- Labs button is enabled and opens a per-pet originals list; X-ray remains coming soon.
- Owner photographs a report (required), then optional date/type/clinic/visit/note.
- Photos live in `petlive-lab-reports` (not Rx or avatar slots), compressed, pet-scoped.
- List is newest-first with thumbs → existing proof lightbox; no CBC values or H/L.
- Timeline shows a labs line only for explicitly linked visits.
- Contracts add `LabReport` + `getLabReportsByPetId`; emergency card still does not own the table.

## Files touched

- `apps/web/index.html`
- `apps/web/app.js`
- `apps/web/i18n.js`
- `apps/web/styles.css`
- `contracts/pet-health-passport-contracts.md`
