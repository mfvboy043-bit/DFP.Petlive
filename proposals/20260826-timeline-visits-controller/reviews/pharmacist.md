# Pharmacist review
Verdict: pass

## Findings
(none)

## Notes
- Reviewed TV-01…TV-04 adjacency only: `domains/visits/controller.js`, `domains/timeline/selectors.js`, C facades, `renderTimeline` / `renderVisitRxBlock` / `renderTimelineMedItem`. Compared proof/weight helpers to pre-extract `main` C logic.
- `saveVisitWeight` mutates only `visit.weightAtVisit` (+ optional `pet.weight` / `pet.weightDate`). Does not touch `visit.medications` or dose/unit/frequency/duration fields.
- `clearVisitProofSlot` keeps slot keys `bag` / `rx` / `drug`; clears visit-level and nested `med.*Photo` for that slot only — does not delete med rows or rewrite name/dose/source strings. Matches pre-extract behavior; QA covers merge + clear.
- Timeline still renders meds via existing `renderTimelineMedItem` (`expandFrequencyInText(med.dose)`, compound ingredient doses, source tags `owner` / `owner_proof` / `clinic_ref` via `getSourceTags()`). `hasRx` flag is equivalent to prior `medications.length` check for normal arrays.
- Drug-notes disclaimer still uses `t("timelineDrugSource")` (reference / bag-insert framing). Visits + timeline domains contain no clinical-authority or dosing-instruction copy.
- Worktree also wires `domains/medications/*` (out of this proposal’s stated non-goal). Not scored here; timeline Rx dose chrome for this slice still goes through the unchanged `renderTimelineMedItem` path.
