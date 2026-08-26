# UI review
Verdict: pass

Light compatibility pass (iteration 1) — no intentional visual redesign claimed. Compared candidate worktree `.worktrees/meds-drugs-controller` med render facades / selectors against `main` `apps/web/c/app.js` and (for C chrome bagage) current TV WIP workspace C.

## Findings
- [UI-001] [P3] `c/index.html` parasite-actions — vs TV WIP C baseline, Save / 剛投藥 button order is flipped on external + heartworm forms; not part of med HTML extraction. Restore order (or keep only if intentional elsewhere) before Gate B so meds adopt does not silently ship parasite chrome drift. Styles `?v=` token also differs (`c-copy-aside` vs TV’s `c-parasite-actions-row`) with no `styles.css` change in this worktree — align cache bust with the intended C baseline.

## Parity notes (no extra IDs)
- `renderPendingMeds`, `renderPendingCompoundOptions`, `renderTimelineMedItem`, `renderDrugResults`, `renderDrugInfoCard` remain in `c/app.js`; template markup matches `main` (identical).
- `domains/medications/selectors.js` emits only display strings / CSS class tokens (`compoundFormClass`, `compoundIconKind`); no HTML, DOM, or layout builders. Controller likewise has no markup templates.
- App facades for `formatMedDose` / `formatMedCourse` / `formatDraftDoseLine` / compound class+icon map through selectors with i18n injectors (`t("medDetailsPending")`, `t("medCourse")`, `t("durationDaysCount")`, etc.) — same assembly rules as pre-extract `main`.
- Chip DOM setters (`setMedCompoundChip`, freq/unit chips) stay in `c/app.js`; compound color write is controller-backed with no markup change.
- Add-med / pending / drug-search markup block in `c/index.html` matches `main`. Formal B out of scope; `styles.css` / `i18n.js` untouched in this worktree.
