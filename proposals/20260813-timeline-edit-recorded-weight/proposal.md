---
id: 20260813-timeline-edit-recorded-weight
title: Timeline — edit recorded visit weight via existing weight form
status: adopted
author: planner
candidate_branch: ""
candidate_path: "proposals/20260813-timeline-edit-recorded-weight/preview"
created: 2026-08-13
updated: 2026-08-13
---

# Proposal: Timeline — edit recorded visit weight via existing weight form

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

On timeline visit cards, when a visit already shows a recorded weight (`.tl-weight-value`, e.g. `6.8 kg`), clicking that weight opens the **existing** pending-weight edit affordance so Victor can change `visit.weightAtVisit`. Reuse `.tl-weight-edit` + `saveVisitWeightAtIndex` / `data-visit-weight-toggle` / `data-visit-weight-form` — do not invent a second editor. Preserve comparison delta (`.tl-weight-vs`) and keep pending-weight behavior unchanged.

## What exists today (source of truth)

- `renderVisitWeightParts(visit, visitIndex, previousVisit)` in `apps/web/app.js`:
  - **Recorded** (`visitWeightKg` ≠ null): static `<span class="tl-weight">` with `.tl-weight-vs` + label + `.tl-weight-value`; **`weightEdit` is `""`** (no form).
  - **Pending**: `.tl-weight-pending` button (`data-visit-weight-toggle`, `aria-controls`) + hidden `.tl-weight-edit` form (`data-visit-weight-form`, input `name="weightAtVisit"`).
- Head uses `weightHtml`; body (`renderVisitRxBlock`) emits `weightEdit` under the clinic row.
- Click: `timelineList` → `[data-visit-weight-toggle]` → `toggleVisitWeightButton` (show/hide form, focus input).
- Submit: `[data-visit-weight-form]` → `saveVisitWeightAtIndex` (validate `> 0`, set `visit.weightAtVisit`, sync `pet.weight` / `pet.weightDate` when visit date is latest, toast, `applySelectedPet`).
- Delta copy/colors already ship from `20260813-timeline-weight-delta` (adopted); that proposal explicitly left timeline editing out of scope.

## In scope

- Make recorded `.tl-weight-value` (or a tight control wrapping only the numeric weight) an edit toggle: same `data-visit-weight-toggle` + `aria-expanded` / `aria-controls` pattern as pending.
- Always emit `.tl-weight-edit` for recorded visits too (same form markup/placement as pending), prefilled with the current kg; save still goes through `saveVisitWeightAtIndex`.
- Keep `.tl-weight-vs` (days-since / delta) **outside** the toggle hit target — visible, not clickable for edit.
- Preserve pending path: pending button + empty form + same save/toggle handlers remain.
- After save, re-render must refresh the value **and** any dependent deltas on this / neighboring cards (existing `applySelectedPet` / `renderTimeline` is enough if data updates correctly).
- Minimal CSS so recorded weight reads as tappable without looking like the amber pending pill (unless intentionally open).
- i18n: reuse existing fill/save/toast keys where possible; add chrome strings only if a distinct “edit” label/aria is needed; all new chrome keys in zh-Hant / en / ja / ko and recompute on language change.
- Candidate off mainline (`proposal/timeline-edit-recorded-weight` or `proposals/.../preview`).

## Out of scope

- Clearing / deleting a recorded weight back to pending (`null`).
- Weight charts, trends, ideal weight, non-kg units.
- A second modal, sheet, or parallel save API.
- Changing visit-create form weight fields beyond what’s already there.
- Diagnosis / “healthy range” / veterinary advice tone.
- Contract schema changes.
- Drive-by refactors of timeline / rx / med summary.

## Likely files

- `apps/web/app.js` — `renderVisitWeightParts` (recorded → toggle + form with prefill); ensure `renderVisitRxBlock` / timeline head still get matching `weightHtml` + `weightEdit`; touch handlers only if recorded control needs a small class tweak (prefer reuse `toggleVisitWeightButton` / `saveVisitWeightAtIndex` as-is).
- `apps/web/styles.css` — recorded-value affordance / open state; do not restyle pending pill unless required for shared open state.
- `apps/web/i18n.js` — only if new chrome (e.g. aria label for “edit weight”); toast may stay `toastVisitWeightSaved`.
- `apps/web/index.html` — cache-bust query only if assets are versioned that way.
- `contracts/` — read-only; no change expected.

## Risks

- **Hit target:** Clicks on delta / days-since must not open the editor; only the recorded weight control.
- **Missing form today:** Recorded path currently sets `weightEdit` to `""` — forgetting to emit the form breaks the feature even if the value looks clickable.
- **Prefill / validation:** Input must open with current kg; still reject `≤ 0` via existing toast; no invented clinical copy.
- **`pet.weight` sync:** Existing save updates pet profile weight when `visit.date >= pet.weightDate` — editing an older visit must not incorrectly overwrite current pet weight (keep current guard; do not broaden sync).
- **a11y:** Toggle needs keyboard focus, `aria-expanded` / `aria-controls`, and a clear accessible name (label text and/or i18n).
- **Layout:** Form sits in body under clinic row today; opening from head control must still reveal that same panel without duplicating two forms per visit.
- **Medical tone:** Editing is owner correction of recorded kg only — no advice language.

## Acceptance criteria

- [ ] Visit with recorded weight: clicking `.tl-weight-value` (or its dedicated toggle wrapping that value) opens the existing `.tl-weight-edit` form, prefilled with that visit’s kg.
- [ ] Submitting the form updates `visit.weightAtVisit` via `saveVisitWeightAtIndex` and re-renders the timeline value.
- [ ] Comparison delta / days-since still display; clicking them does not toggle the editor.
- [ ] Visits without weight: pending button + empty form behavior unchanged.
- [ ] Invalid input (`≤ 0` / empty) still blocked with existing weight toast; no silent bad save.
- [ ] Editing an older visit does not overwrite `pet.weight` when a newer `weightDate` exists (existing save guard).
- [ ] Language switch updates any new chrome strings; no hard-coded UI chrome.
- [ ] No second editor UI or parallel save path.
- [ ] Candidate stays off mainline until Gate B adopt.

## Notes for Victor

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。

**Suggested Gate A prompt:**  
請確認此提案：回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。
