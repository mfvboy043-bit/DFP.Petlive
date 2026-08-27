---
id: 20260827-c-meds-wire
title: C — wire medications controller/selectors (match B)
status: building
author: planner
candidate_branch: "cursor/c-meds-wire-ad50"
candidate_path: "proposals/20260827-c-meds-wire"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: C meds controller wire

Companion: `state.yaml`.

## Goal

Surface **C** already loads `domains/medications/{controller,selectors}.js` and uses the renderer, but still keeps compound / pending / validate / visit-save **brain inline**. Formal **B** already delegates. Wire C the same way so one med brain serves both surfaces.

**Gate A:** Victor 2026-08-27 —「好，幫我接」.

## In scope

- Create `medicationsSelectors` + `medicationsController` on C (same deps as B: visits + `drugsAdapter`)
- Thin-facade: dose/course formatters, normalize unit/freq, compound colors, validate, pending push/remove/compound, build visit units, find visit + weight on save, photo bundle + append units
- Behavior-preserving vs current B wiring

## Out of scope

- Clinic directory / vaccine presets extraction
- Photo-crop I/O, PERF-03 keyed reconcile
- B changes (already wired)
- Drive-by refactors

## Likely files

- `apps/web/c/app.js`
- `proposals/20260827-c-meds-wire/*`

## Risks

- Weight-on-save path must use `applyVisitWeightOnMedSave` (B/QA-001 semantics), not the older inline `pet.weight =` only path
- `formatMedDose*` sit above controller init in source order — same as B; only called after boot

## Acceptance criteria

- [ ] C calls `medicationsController` / `medicationsSelectors` like B
- [ ] No duplicate `COMPOUND_DEFAULT_COLORS` / inline validate / buildVisitMedicationsFromPending brain on C
- [ ] `node --check apps/web/c/app.js`; med-related qa tests pass
- [ ] Formal B untouched

## Notes for Victor（白話）

藥的積木 B 早就接好了，C 忘了接。這盒只把 C 接回去，行為跟 B 一樣。做完問你要不要採用。
