# QA review
Verdict: pass

Candidate: `cursor/modules-write-phase1-6f84` @ ~e01d86c  
Proposal: `proposals/20260827-modules-write-phase1/proposal.md`  
Scope checked: pets-graph `replaceGraph`/`clearGraph`; C cloud apply/clear via door; add-pet `pushPet`; hydrate/persist; facade source-scan; inventory; no modules dual-write. Formal B legacy fallback left intact (out of Phase 1).

## Findings

_(none in Phase 1 scope)_

## Checks (Phase 1)

| Area | Result |
|---|---|
| Door APIs | `replaceGraph` / `clearGraph` mutate `pets` / `archivedPets` in place; `hydrate` delegates to `replaceGraph`; `pushPet` + `schedulePersist` unchanged |
| Add pet | C still `petsGraph.pushPet(pet)` then `selectPetForced` → `applySelectedPet` → `schedulePetsGraphPersist` |
| Cloud apply | With `petsGraph` wired: `replaceActiveGraph` → door `replaceGraph`; then same slot writes / `currentPetId` / `onAfterApply` as before; seed-only + demo + bad payload still reject **before** replace |
| Cloud clear-seed | Seed-only path calls `clearActiveGraph` → door `clearGraph`; still nulls `currentPetId` and writes empty pets-graph slot |
| C facade raw ban | No `pets.push` / `splice` / `length=0` or `archivedPets.push` / `length=0` in `c/app.js`; cloud controller receives `petsGraph` |
| Formal B | `apps/web/app.js` not in commit; controller keeps raw-array legacy fallback when `petsGraph` absent |
| Modules dual-write | No `modules/*` writes in door or cloud controller; inventory states pets[] sole UI write truth |
| Inventory | `inventory.md` lists structural vs content paths; lifecycle archive/remove remains domain `splice`/`unshift` + facade persist (allowed) |
| `?v=` | C `index.html` bumps pets-graph, cloud controller, `c/app.js` to `20260827-modules-w4p1` |
| `node --check` | `pets-graph.js`, `cloud/controller.js`, `c/app.js` OK |

### Related tests

```
node --test qa/tests/web-pets-graph.test.js qa/tests/web-cloud.test.js
```

- Door hydrate / pushPet / persist: **pass**
- Door replaceGraph / clearGraph: **pass**
- C facade source-scan (raw structural ban + `petsGraph` wire): **pass**
- Cloud apply uses door (`replaceViaDoorCount`); clear-seed uses door (`clearViaDoorCount`): **pass**
- Suite: **11/11 pass**
