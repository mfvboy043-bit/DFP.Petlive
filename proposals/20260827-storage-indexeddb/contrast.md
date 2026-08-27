# Contrast: mainline vs Storage IDB candidate

## Candidate

- Branch: `proposal/storage-indexeddb` (`4db5796`)
- Path: `proposals/20260827-storage-indexeddb`
- Surface: **C opt-in** + shared `core/storage*`
- Status: `candidate_ready` (iteration 3)

## Mainline vs candidate

| Area | Mainline | Candidate |
|---|---|---|
| Persistence | localStorage-only slots | Backend interface + optional IDB |
| Default behavior | Unchanged | `backend: "local"` default |
| C IDB opt-in | N/A | `data-petlive-storage-backend` + optional `storage-boot.js` |
| Boot | Sync slot reads | `markBootComplete()` after app.js slots; IDB hydrate when opted in |
| Domains | Inject slots | Unchanged |

## Files to adopt

### Add
- `apps/web/core/storage-idb.js`
- `apps/web/c/storage-boot.js` (C opt-in helper)

### Change
- `apps/web/core/storage.js` — backend interface, configure, whenReady, markBootComplete
- `apps/web/c/index.html` — storage-idb script + cache bump
- `apps/web/c/app.js` — markBootComplete hook at end (minimal)
- `qa/tests/web-building-blocks.test.js` — fake IDB cases

### Exclude
- Formal B / Pages until Victor confirms cover
- Forcing all users onto IDB
