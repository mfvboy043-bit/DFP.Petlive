---
id: 20260827-leftover-abcd
title: Leftover ABCD — crop session, drug-note hydrate, copy card, timeline skip-noop
status: adopted
author: planner
candidate_branch: "cursor/leftover-abcd-8ec1"
candidate_path: "proposals/20260827-leftover-abcd"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Leftover ABCD building blocks

Companion: `state.yaml`.

**Gate A:** Victor 2026-08-27 —「ABCD都處理，處理完問我是否採用」. C only; stop at Gate B.  
**Gate B:** Victor 採用並覆蓋 B 2026-08-27.

## Goal

Extract four leftover facade brains: photo-crop session/drag math (A), drug-note hydrate decision + slot payload (B), emergency copy-card join (C), timeline skip-noop signature (D / PERF-03 step 1). Canvas export, pointer listeners, clipboard I/O, and full keyed reconcile stay out.

## In scope

### A — `shell/photo-crop.js`

Session helpers: initial/open/close state, pointer drag offsets, overlay flags (`hidden`, html class, body overflow). Facade keeps `addEventListener`, canvas `exportPetPhotoCrop`, `setPetPhoto`.

### B — `domains/timeline/render.js` (+ view if needed)

`shouldHydrateDrugNotesPanel`, `buildDrugNotesHydrateSlot(model)` (`className` + body HTML). Facade still `createElement` / `appendChild` / Map.

### C — `domains/emergency/render.js`

`buildPetShareLines`, `buildOwnerCopyLines`, `buildCopyCardText`. Facade still calls `copyPayload` + clipboard.

### D — PERF-03 skip-noop

`buildListSignature(pet, { lang })`, `shouldSkipListRebuild(prev, next)`. Facade skips `innerHTML` when signature matches; still applies pending imaging expand / latest RX expand.

## Out of scope

- Canvas crop export, IndexedDB
- Full keyed `.tl-item` patch reconcile (PERF-03 steps 2–3)
- CSS / medical copy changes

## Likely files

`apps/web/shell/photo-crop.js`, `domains/timeline/render.js`, `domains/emergency/render.js`, `apps/web/c/app.js`, `c/index.html` `?v=`, `apps/web/app.js`, `index.html` (B cover), tests.

## Risks

- Skip-noop must include language so i18n chrome is not stale.
- Crop drag must keep pointerId mismatch ignore.
- Copy card join/trim (`\n{3,}`) must match today.

## Acceptance criteria

- [x] A–D builders exist; C facades thin
- [x] Tests pass; `node --check apps/web/c/app.js apps/web/app.js`
- [x] Formal B covered after Victor 採用並覆蓋
