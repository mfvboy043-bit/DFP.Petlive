# Wave 4 Phase 1 — Builder notes

**Branch:** `cursor/modules-write-phase1-6f84`  
**Scope:** A–C on C first; Gate B cover onto formal B after Victor「採用、覆蓋」.

## A — Inventory

- `proposals/20260827-modules-write-phase1/inventory.md`
- States: **pets[] remains sole UI write truth**; modules Maps are not synced.

## B — Door + routing (C then Gate B)

- Extended `core/pets-graph.js`: `replaceGraph`, `clearGraph`; `hydrate` uses `replaceGraph`.
- `domains/cloud/controller.js`: apply/clear-seed **require** `petsGraph` door (legacy raw fallback removed at Gate B).
- C `c/app.js`: passes `petsGraph` into cloud controller; add-pet already `pushPet`; no raw structural mutates.
- B `apps/web/app.js`: hydrate / loadSeed / resetDemo via door; passes `petsGraph` into cloud controller.
- Lifecycle archive/remove: kept domain `splice`/`unshift` + facade persist (smaller diff per proposal).

## C — Tests + cache

- `qa/tests/web-pets-graph.test.js`: door APIs + **C and B** facade source-scan ban on raw `pets.push` / splice / `length=0`.
- `qa/tests/web-cloud.test.js`: door stub; asserts apply/clear use door.
- C + B `index.html` `?v=20260827-modules-w4p1` for pets-graph / cloud / app.

## Gate B (2026-08-27)

- Victor「採用、覆蓋」
- Contrast: `contrast.md`
- Status → adopted

## Risks

- Cloud apply/clear regression if door not passed — mitigated by C+B wiring + cloud tests (door required).
- No modules write / flip.
