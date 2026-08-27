# Contrast — Wave 4 Phase 1 pets-graph door (adopted; B covered)

## Mainline (before Gate A / C candidate)

| Behavior | Location |
|---|---|
| Door existed (`hydrate` / `pushPet` / `schedulePersist`) but cloud apply/clear used raw `pets.length=0` + `pets.push` | `domains/cloud/controller.js` |
| B seed-reset / demo / empty-hydrate used raw structural mutates | `apps/web/app.js` |
| C add-pet already `petsGraph.pushPet`; cloud controller not passed `petsGraph` | `c/app.js` |
| No facade source-scan ban on raw structural mutates | `qa/tests/web-pets-graph.test.js` |
| Write truth still `pets[]` (correct); no inventory of off-door holes | — |

## Candidate → adopted (`cursor/modules-write-phase1-6f84`)

| Behavior | Location |
|---|---|
| Door extended: `replaceGraph` / `clearGraph`; hydrate via replace | `core/pets-graph.js` |
| Cloud apply/clear-seed **require** door (no legacy raw fallback after Gate B) | `domains/cloud/controller.js` |
| C + B pass `petsGraph` into cloud controller | `c/app.js`, `app.js` |
| B hydrate / loadSeed / resetDemo via `replaceGraph` / `clearGraph` | `apps/web/app.js` |
| Source-scan fails if C **or** B facade reintroduces raw structural mutates | `qa/tests/web-pets-graph.test.js` |
| Inventory: pets[] remains write truth; modules Maps not DB | `inventory.md` |
| Cache `?v=20260827-modules-w4p1` | C + B `index.html` (pets-graph / cloud / app) |

## Gate B cover (Victor「採用、覆蓋」2026-08-27)

- Covered formal B seed-reset / clear / cloud wiring through the same door
- Removed cloud controller legacy raw fallback (both surfaces now wire `petsGraph`)
- **No** modules dual-write; **no** write-truth flip
