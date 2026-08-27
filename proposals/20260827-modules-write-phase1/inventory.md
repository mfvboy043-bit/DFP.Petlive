# Wave 4 Phase 1 — C write-path inventory

**Write truth:** `pets[]` + `archivedPets` (+ pets-graph slot persist) remain the **sole UI write truth**.  
**Not DB:** `modules/*` in-memory `Map`s are ModuleResult / compose helpers only — **no** dual-write, **no** sync TO modules in Phase 1.

Door: `apps/web/core/pets-graph.js` (`createPetsGraph`).

## Structural mutates (array shape of active/archived graph)

| Op | Where | Through door? | Notes |
|---|---|---|---|
| Hydrate from slot / seed | `core/pets-graph.js` `hydrate` → `replaceGraph` | **Yes** (door) | Clears + fills `pets` / `archivedPets` |
| Add pet | C `petsGraph.pushPet` (`c/app.js`) | **Yes** | |
| Replace whole graph | `petsGraph.replaceGraph` | **Yes** | Used by cloud apply |
| Clear graph | `petsGraph.clearGraph` | **Yes** | Used by cloud clear-seed |
| Persist (coalesced) | `petsGraph.schedulePersist` → slot | **Yes** | After content + lifecycle |
| Archive / remove | `domains/pets/lifecycle.js` `splice` / `unshift` | **Domain allowed** | Facade then `applySelectedPet` → `schedulePetsGraphPersist`. Phase 1 keeps domain + persist (smaller diff); not facade raw push. |
| Cloud apply / clear-seed | `domains/cloud/controller.js` via `petsGraph.replaceGraph` / `clearGraph` when wired | **Yes on C** | Formal B may still omit `petsGraph` until Gate B (legacy raw fallback in controller). |
| Formal B seed-reset / demo | `apps/web/app.js` raw `length=0` / `push` | **Out (Gate B)** | Not this Phase 1 build |

## Content mutates (nested fields on pets already in `pets[]`)

Phase 1 does **not** move these into modules Maps. Controllers mutate pet objects, then facade calls `schedulePetsGraphPersist` (or cloud bump path).

| Area | Typical mutator | Persist |
|---|---|---|
| Pet identity edit | `domains/pets/lifecycle.js` `updatePet` | Facade persist |
| Visits / clinic / symptoms | `domains/visits/controller.js` | Facade persist |
| Imaging on visit | `domains/imaging/controller.js` | Facade persist |
| Medications | `domains/medications/controller.js` | Facade persist |
| Vaccines | `domains/vaccines/controller.js` | Facade persist |
| Parasite prevention | `domains/parasite/controller.js` | Facade persist |
| Alerts | `domains/alerts/controller.js` | Own slots +/or graph persist as wired |
| Labs | `domains/labs/controller.js` | Lab reports slot (+ graph when needed) |
| Owner profile | `domains/owner/controller.js` | Owner slot |
| Pet photos / media | `domains/pets/media.js` + photo slots | Photo slot |

## Explicit non-goals (this inventory)

- No write to `modules/pet` (or other modules) Maps as app store
- No mirror FROM pets[] → modules (Phase 2+)
- No dual-write ledger
- Nested content does not need to go through `pushPet` / `replaceGraph` — only structural array ops + facade raw-ban
