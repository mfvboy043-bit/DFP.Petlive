---
id: 20260918-facade-slim-photo-crop
title: "Facade slim — Wave 3 cluster 2 (pet photo / crop) on C"
status: adopted
author: planner
candidate_branch: "cursor/modules-write-phase1-6f84"
candidate_path: "proposals/20260918-facade-slim-photo-crop"
created: 2026-09-18
updated: 2026-09-18
---

# Proposal: Facade slim — Wave 3 cluster 2 (pet photo / crop)

Companion: `state.yaml`. Parent: `20260903-building-blocks-audit` Wave 3 item 2.

**Gate A / B:** Victor 2026-09-18 —「確認，且推上去」→ build shared shell APIs, thin C+B, Pages publish.

## Goal

Move pet-photo / crop overlay orchestration into `shell/photo-crop.js` so facades only inject keys, toasts, and `go()`. Behavior-preserving.

## Shipped (PC-1 / PC-3 / PC-4)

- Shell: `applyPhotoCropFlags`, `applyCropImageTransform`, `applyEmergencyPetPhotoFrame`, `bindPetPhotoFileInput`
- C + B thin-wired via `requireShellFn`
- QA extended; hygiene + photo-crop green
- Same publish batch restores P0 (`loc-field` / `clinic-picker` / `drug-search` / parasite CSS)

## Out of scope (still later)

Timeline gestures, breed/parasite deepen, med form/flow.
