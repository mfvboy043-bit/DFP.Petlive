# QA review
Verdict: pass

## Findings

None.

## Evidence (acceptance)

Diff vs mainline is limited to `renderVisitWeightParts` (recorded → toggle button + always-emitted form with prefill), `visitWeightEditAria` in zh-Hant/en/ja/ko, recorded-value CSS affordance, and cache-bust. `toggleVisitWeightButton` / `saveVisitWeightAtIndex` / timeline click+submit handlers are unchanged.

| Criterion | Result |
|---|---|
| Click recorded weight opens existing `.tl-weight-edit`, prefilled | **Pass** — `.tl-weight-value` is a `button` with `data-visit-weight-toggle` + `aria-controls="visit-weight-${index}"`; form always emitted with `value="${weightNum}"` when recorded. Form still placed under clinic row via `weightEdit` (one form per visit; head only gets `weightHtml`). |
| Save updates `visit.weightAtVisit` via `saveVisitWeightAtIndex` | **Pass** — sole submit path remains `[data-visit-weight-form]` → `saveVisitWeightAtIndex`; no parallel editor/API. |
| Delta / days-since not hit target | **Pass** — `.tl-weight-vs` is a sibling before the value button inside `.tl-weight`, not inside `[data-visit-weight-toggle]`; `closest` will not treat delta/days clicks as toggles. |
| Pending path unchanged | **Pass** — pending still uses `.tl-weight-pending` + empty input (no `value`); same toggle/save handlers. Seed visit `2026-04-22` (no `weightAtVisit`) exercises pending. |
| Invalid `≤ 0` blocked | **Pass** — `if (!(weight > 0)) { showToast(t("toastWeight")); return false; }` unchanged; no `applySelectedPet` on failure. |
| Older visit does not overwrite `pet.weight` when newer `weightDate` exists | **Pass** — guard `if (!pet.weightDate \|\| visit.date >= pet.weightDate)` unchanged. Demo pet: `weightDate: 2026-08-02`; editing `2026-06-18` / `2026-03-10` does not sync profile weight. |
| i18n chrome | **Pass** — `visitWeightEditAria` in all four locales; `onLanguageChange` → `applySelectedPet` → `renderTimeline` recomputes aria-label. Fill/save/toast keys reused. |
| No second save path | **Pass** — only `saveVisitWeightAtIndex`. |
| Lost state / multi-pet | **Pass** — open form is DOM-only until save; pet switch / language change re-renders timeline (same as prior pending editor). Save uses `getCurrentPet()` + form `visitIndex`; no cross-pet write path. Opening/editing weight does not clear pending-meds state. |

## Out of scope (not defects)

- Clearing recorded weight back to pending.
- Hard-coded `kg` in button text (pre-existing on recorded display).
- Toast copy still “filled/saved visit weight” on edit (proposal allows reuse).
