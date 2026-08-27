# Wave 4 Phase 1 — write-path inventory (C + B after Gate B)

**Write truth:** `pets[]` + `archivedPets` (+ pets-graph slot persist) remain the **sole UI write truth**.  
**Not DB:** `modules/*` in-memory `Map`s are ModuleResult / compose helpers only — **no** dual-write, **no** sync TO modules in Phase 1.

Door: `apps/web/core/pets-graph.js` (`createPetsGraph`).

## Structural mutates (array shape of active/archived graph)

| Op | Where | Through door? | Notes |
|---|---|---|---|
| Hydrate from slot / seed | `core/pets-graph.js` `hydrate` → `replaceGraph` | **Yes** (door) | Clears + fills `pets` / `archivedPets` |
| Add pet | C/B `petsGraph.pushPet` | **Yes** | |
| Replace whole graph | `petsGraph.replaceGraph` | **Yes** | Cloud apply; B seed load / demo reset |
| Clear graph | `petsGraph.clearGraph` | **Yes** | Cloud clear-seed; B empty / seed-only drop |
| Persist (coalesced) | `petsGraph.schedulePersist` → slot | **Yes** | After content + lifecycle |
| Archive / remove | `domains/pets/lifecycle.js` `splice` / `unshift` | **Domain allowed** | Facade then `applySelectedPet` → `schedulePetsGraphPersist` |
| Cloud apply / clear-seed | `domains/cloud/controller.js` via `petsGraph.replaceGraph` / `clearGraph` | **Yes (C + B)** | Door required; legacy raw fallback removed at Gate B |
| Formal B seed-reset / demo / hydrate | `apps/web/app.js` via door | **Yes (Gate B)** | `replaceGraph` / `clearGraph` |

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
