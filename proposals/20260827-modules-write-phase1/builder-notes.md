# Wave 4 Phase 1 — Builder notes

**Branch:** `cursor/modules-write-phase1-6f84`  
**Scope:** A–C only (inventory + door + C tests). No modules dual-write. No formal B cover.

## A — Inventory

- `proposals/20260827-modules-write-phase1/inventory.md`
- States: **pets[] remains sole UI write truth**; modules Maps are not synced.

## B — Door + routing

- Extended `core/pets-graph.js`: `replaceGraph`, `clearGraph`; `hydrate` uses `replaceGraph`.
- `domains/cloud/controller.js`: apply/clear-seed go through `petsGraph.replaceGraph` / `clearGraph` when wired; **legacy raw fallback** kept for formal B until Gate B (B not edited).
- C `c/app.js`: passes `petsGraph` into cloud controller; add-pet already `pushPet`; no raw structural mutates.
- Lifecycle archive/remove: kept domain `splice`/`unshift` + facade `applySelectedPet` → `schedulePetsGraphPersist` (smaller diff per proposal).

## C — Tests + cache

- `qa/tests/web-pets-graph.test.js`: door APIs + C facade source-scan ban on raw `pets.push` / splice / `length=0`.
- `qa/tests/web-cloud.test.js`: door stub; asserts apply/clear use door.
- `c/index.html` `?v=20260827-modules-w4p1` for pets-graph + cloud controller.

## Risks

- Cloud apply/clear regression if door not passed — mitigated by C wiring + cloud tests.
- B still off-door for cloud until Gate B (intentional fallback).
- No modules write / flip.
