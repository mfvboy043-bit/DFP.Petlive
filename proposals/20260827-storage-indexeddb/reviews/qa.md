# QA review

Verdict: **conditional**

Reviewed commit `4db5796` on branch `proposal/storage-indexeddb` against ST-01–ST-05 (iteration 3 — `markBootComplete`, `storage-idb` wiring, configure-only `storage-boot`).

## Scope checklist

| Check | Result |
|---|---|
| ST-01 Default `local` backend — no behavior change for B / unflagged C | Pass |
| ST-02 Sync read after init; `whenReady()` / `markBootComplete()` for IDB hydrate | Pass — C calls `markBootComplete()` at app end (QA-001 resolved) |
| ST-03 Migration: IDB prefer, LS hydrate once, no auto delete | Pass in `hydrateSlot`; reachable on C when opt-in wired |
| ST-04 Error containment | Pass — IDB open/tx/get/put/delete catch and return null/false |
| ST-05 C opt-in via `storage-boot.js` + data attribute | Partial — `storage-idb.js` restored; `storage-boot.js` configure-only file present; script tag remains manual per comment (QA-005) |
| `web-building-blocks.test.js` STORAGE-IDB suite | Pass — slot-level cases; no C boot integration test (QA-004) |
| No B changes, no domain rewrites | Pass |
| End-to-end IDB boot on C | Partial — pets graph re-hydrates post-ready; other slots / LS helpers lag (QA-003, QA-006) |

## Findings

### C never calls `markBootComplete()` / `whenReady()` — IDB hydrate never runs

- ID: QA-001
- Severity: **resolved** (iteration 2 high)
- Steps:
  1. Wire C per proposal: `data-petlive-storage-backend="idb"`, include `storage-idb.js`, `storage-boot.js` (configure only), then `app.js`.
  2. Seed IDB pets graph `{ pets: [PetA] }` and localStorage `{ pets: [PetB] }`.
  3. Load C; inspect `pets` array and `petsGraphSlot.getStats().ready`.
- Expected: After all JSON slots register, boot calls `markBootComplete()`; hydration runs; graph reflects IDB (PetA).
- Actual: `4db5796` appends `PetLiveWeb.storage.markBootComplete()` at end of `app.js` (L8039–8049). When backend resolves to `idb`, pipeline runs and `hydratePetsGraphFromStorage()` + `applySelectedPet()` re-sync in-memory pets. Default unflagged C stays `local`; call is a no-op.

### Pre-ready write protected from stale IDB hydrate overwrite

- ID: QA-002
- Severity: **resolved** (iteration 1 high)
- Steps:
  1. `configure({ backend: "idb" })`, seed IDB `{ ok: false }`, LS empty.
  2. Create slot, `read()` (fallback), `write({ ok: true })` before ready.
  3. `await whenReady()`.
  4. `read()` again.
- Expected: Post-ready read returns pre-ready write.
- Actual: `writtenBeforeReady` guard in `hydrateSlot` still holds. Slot-level race from iteration 1 remains fixed.

### Boot helpers bypass storage layer — wrong first-run detection under IDB

- ID: QA-003
- Severity: **medium**
- Steps:
  1. Enable IDB with `mirrorLocal: false` or data only in IDB (no LS key).
  2. Load C; paths using `hasStoredPetsGraph()` / `hasStoredSyncMeta()` run (cloud selectors, fresh-device checks).
- Expected: Detect stored graph/meta via storage abstraction or post-ready slot read.
- Actual: C `app.js` L629–642 still reads `localStorage` directly. Returns false when data lives only in IDB. Lower blast radius on C (intro hidden, cloud restore skipped at L8006–8022) but selectors / future cloud wiring still mis-detect.

### Unit tests do not cover C boot integration sequence

- ID: QA-004
- Severity: **low**
- Steps: Inspect `qa/tests/web-building-blocks.test.js` STORAGE-IDB suite.
- Expected: Test mirroring `storage-boot configure → app slot registration → markBootComplete → graph hydrate`.
- Actual: Tests exercise slot API in isolation. No test asserts C boot calls `markBootComplete` after slot registration or re-hydrates graph.

### C IDB opt-in wiring — `storage-idb` restored; `storage-boot` manual

- ID: QA-005
- Severity: **low**
- Steps: Inspect `4db5796` `apps/web/c/index.html` vs iteration 2 (`cf2893d`).
- Expected: `storage-idb.js` + opt-in instructions; `storage-boot.js` configure-only before `app.js` when testing IDB.
- Actual: Iteration 3 restores `storage-idb.js` and updates comment to configure-only boot + `markBootComplete` at app end. `storage-boot.js` is not auto-included (same as iteration 1); Victor must add script tag + `data-petlive-storage-backend` per comment. File itself is configure-only (L18 — no `whenReady` / dynamic app load). Acceptable for default-local C; easy to miss when smoke-testing IDB.

### Post-ready re-hydrate limited to pets graph

- ID: QA-006
- Severity: **medium**
- Steps:
  1. Opt into IDB; seed IDB-only data in `petPhotosSlot` / `ownerProfileSlot` (empty LS, `mirrorLocal: false`).
  2. Load C.
  3. Check pet avatars and owner profile on first paint.
- Expected: After `markBootComplete`, all slot-backed in-memory state reflects IDB.
- Actual: `markBootComplete` callback re-hydrates only `hydratePetsGraphFromStorage()` (L8043). `hydratePetPhotos()` and other boot-time hydrators run earlier at L8028 (pre-ready LS path). Slot caches warm post-hydrate, but in-memory `pet.photo` / owner state can stay stale until a later screen read. Pets list itself is corrected.

## What passes

- **Default local path (ST-01):** Unconfigured C and B unchanged; `markBootComplete` resolves immediately.
- **IDB pipeline wiring (iteration 3):** `storage-idb.js` in `index.html`; `markBootComplete` at app end completes deferred hydrate when backend is `idb`.
- **`storage-boot.js` shape:** Configure-only — reads `data-petlive-storage-backend`, calls `storage.configure`, does not defer `app.js`.
- **Pre-ready write guard (QA-002):** Slot layer race protection intact.
- **Migration policy (ST-03) / error containment (ST-04):** Unchanged; correct when pipeline runs.
- **No B rewrite:** Formal B shell not modified.

## Recommendation

Adopt is reasonable for the **default-local, behavior-preserving** slice. For **IDB opt-in on C**, accept with follow-ups:

1. Route `hasStoredPetsGraph` / `hasStoredSyncMeta` through slots or post-ready reads (QA-003).
2. After `markBootComplete`, re-run other boot hydrators (`hydratePetPhotos`, owner/labs if loaded eagerly) or defer them until `whenReady()` resolves (QA-006).
3. Add an integration test for the full C boot sequence (QA-004).

No high-severity blockers remain; iteration 3 addresses the iteration 2 reject cause (QA-001).
