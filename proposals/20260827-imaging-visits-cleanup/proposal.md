---
id: 20260827-imaging-visits-cleanup
title: Imaging visits cleanup — single imaging domain
status: building
author: planner
candidate_branch: "cursor/imaging-visits-cleanup-f35c"
candidate_path: "proposals/20260827-imaging-visits-cleanup"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Imaging visits cleanup

Companion: `state.yaml`.

## Goal

Finish the deferred tail from adopted `20260827-imaging-controller`: visit imaging brain lives **only** in `domains/imaging`. Remove duplicate imaging APIs from `domains/visits`, wire surface **C** like **B**, and drop the timeline visits-fallback once both surfaces inject imaging.

## In scope

- Remove imaging helpers from `domains/visits/controller.js`
- C: load `domains/imaging`, facades → `imagingController`, timeline inject, `setVisitImaging` on save
- Timeline selectors: prefer/require `imaging.visitHasImaging` (remove visits fallback)
- Tests + cache bust

## Out of scope

- DOM / compress / lightbox changes
- Medical copy, CSS redesign, B behavior change beyond using the same domain

## Likely files

- `apps/web/domains/visits/controller.js`
- `apps/web/domains/timeline/selectors.js`
- `apps/web/c/app.js`, `c/index.html`
- `apps/web/index.html` (visits cache bump only if needed)
- `qa/tests/web-timeline-visits.test.js`, `web-imaging.test.js`

## Risks

- C missing script tag → runtime error on imaging screens
- Timeline without imaging inject throws (intentional after cleanup)

## Acceptance

- [ ] visits controller has no imaging APIs / no `IMAGING_PHOTOS_MAX`
- [ ] C and B both use `PetLiveWeb.domains.imaging`
- [ ] Save imaging on C uses `setVisitImaging`
- [ ] `node --test qa/tests/web-imaging.test.js qa/tests/web-timeline-visits.test.js` passes

## Notes for Victor

Gate A: Victor「請繼續完成」2026-08-27 = 確認此尾巴清理。
