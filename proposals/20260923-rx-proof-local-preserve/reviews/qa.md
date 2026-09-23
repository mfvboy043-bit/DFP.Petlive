# QA review — `20260923-rx-proof-local-preserve` (iteration 1)

- **Reviewer:** QA (independent)
- **Candidate:** mainline worktree `/Users/victorwu/Desktop/petlive` (`proposal/rx-proof-local-preserve` note in `state.yaml`)
- **Proposal:** `proposals/20260923-rx-proof-local-preserve/proposal.md`
- **Builder scope:** RX-01 … RX-05
- **Date:** 2026-09-23
- **Tests run:** **not executed** — host PATH has no `node` / `nodejs` / `bun` / `deno`. Suites reviewed statically: `qa/tests/web-cloud.test.js`, `qa/tests/web-cloud-proof-merge.test.js`.
- **Did not read:** `reviews/ui.md`, `reviews/legal.md` (both skipped per routing). Did not edit `apps/web`, `contracts`, or `packages`.

## Verdict: pass

Local Rx proof stills survive Drive `applyCloudPayload` after intentional strip. Merge brain is in `domains/cloud/proof-merge.js` (Tier 2). Strip / `HEAVY_MEDIA_KEYS` unchanged. Demo still early-returns before write (I1). Unmatched cloud pets do not invent proofs (L1 fail-safe). Thin facade only adds `petsGraphSlot.onFlushResult`. No blockers.

## Acceptance (RX-01 … RX-05)

| ID | Criterion | Result |
|----|-----------|--------|
| **RX-01** | Snapshot local → replace cloud graph → re-merge `bagPhoto` / `rxPhoto` / `drugPhoto` → `petsGraphSlot.write` | **pass** — `applyCloudPayload` deep-clones `getPets` / `getArchivedPets` before `replaceActiveGraph`, then `mergeLocalRxProofsInto` on both arrays |
| **RX-01** | Strip still omits proofs from Drive JSON | **pass** — `HEAVY_MEDIA_KEYS` still includes the three proof keys (+ `attachmentUrl`); `buildCloudPayload` still runs `stripHeavyMedia`; suite asserts keys absent on payload |
| **RX-02** | Pure merge helper under domain; no merge algorithm in facade | **pass** — `proof-merge.js` exports `mergeLocalRxProofs` / `mergeLocalRxProofsInto`; no `document` / `localStorage` / `fetch`. B/C `app.js` have no merge loops (existing med-form proof wiring only) |
| **RX-03** | `petsGraphSlot` flush fail → `showPersistenceFailure` | **pass** — both `apps/web/app.js` and `c/app.js` wire `onFlushResult: (ok) => { if (!ok) showPersistenceFailure(); }` |
| **RX-04** | Automated strip + apply + survival; unmatched; demo | **pass** (static) — new cloud tests cover re-merge after strip, unmatched cloud pet, existing demo/seed/shape guards; new `web-cloud-proof-merge.test.js` covers restore, no overwrite / no invent, purity |
| **RX-05** | Load `proof-merge.js` before controller; `?v=` bump | **pass** — B and C: `proof-merge.js?v=20260923-rx-preserve` immediately before `controller.js?v=20260923-rx-preserve` |
| Demo **I1** | `applyCloudPayload` refuses demo | **pass** — `if (demo()) return false` before snapshot/merge/write; existing suite case |
| Legal/product | No i18n claiming proofs now backed up | **pass** — no privacy/terms/i18n Drive-scope edits in candidate |

## Checklist

| # | What to verify | Result |
|---|---|---|
| 1 | Node suites for RX-04 | **not run** — no Node on host. Static review of asserted paths looks sufficient for Gate A scope |
| 2 | Tier 2 / BB — merge not dumped in `app.js` / `c/app.js` | **pass** — no **BB-n** |
| 3 | Prefer non-empty local over missing cloud; do not fill from empty local | **pass** — `copyProofSlots` only copies when target empty and source has non-empty string; null local `rxPhoto` stays unset in unit test |
| 4 | No invent for unmatched pet / visit / med | **pass** — pet id map miss returns early; visit/med map miss skips; cloud-only pet test asserts `bagPhoto` undefined |
| 5 | Do not resurrect user-cleared slots | **pass** by rule (local null → no copy). Cloud never carries proofs today |
| 6 | `attachmentUrl` not re-merged (out of scope) | **pass** — only `RX_PROOF_KEYS` three keys |
| 7 | L1 match safety | **pass** with residual note QA-1 — pet by `id`; visit `id` else `date\|index`; med `id` else index. Mismatch → leave cloud node bare (no invent) |
| 8 | Clone before replace (shared array mutation) | **pass** — comment + `JSON.parse(JSON.stringify(…))` before `replaceActiveGraph` |
| 9 | Archived pets also re-merged | **pass** in controller (`mergeFn(archivedPets, localArchivedSnap)`); **no dedicated test** — see QA-2 |
| 10 | Secrets / Drive upload of proofs | **pass** — no new secrets; strip unchanged; no proof upload path |

## Findings

### Blockers

None.

### Non-blocking

#### QA-1 — Visit identity falls back to `date|index` (product visits often lack `id`)

- **Severity:** low
- **Invariant:** L1 residual (wrong-visit attach only if same-date visits reorder without ids)
- **Steps:** Inspect `proof-merge.js` `visitMatchKey`; inspect formal visit create in `app.js` (new visit object has `date` / clinic / meds, typically **no** `visit.id`).
- **Expected (proposal):** match by stable visit id / best existing identity.
- **Actual:** Best-effort `id:` then `date:YYYY-MM-DD|index`. Primary strip→apply same-device path keeps order, so RX-01 holds. Same-calendar-day reordered visits without ids could cross-wire proofs; fail-safe still avoids inventing for unmatched keys.
- **Note:** Meds usually carry `id` (`m-…`) and match stably. Optional hardening: clinic-aware key (as observations passport synthetic ids) or assign durable visit ids later — **not** required to adopt this candidate.

#### QA-2 — Archived-pets apply path and cleared-null apply not covered by integration test

- **Severity:** low
- **Steps:** Read `web-cloud.test.js` re-merge / unmatched cases; `web-cloud-proof-merge.test.js`.
- **Expected:** RX-04 spans active + archived; cleared local null does not come back.
- **Actual:** Controller merges archived; unit test covers null local med `rxPhoto`. No `applyCloudPayload` case with `archivedPets` proofs or explicit cleared-then-apply. Code path is symmetric; residual coverage gap only.

#### QA-3 — Host could not execute Node suites this review

- **Severity:** info
- **Expected:** `node --test qa/tests/web-cloud.test.js qa/tests/web-cloud-proof-merge.test.js` green.
- **Actual:** No Node binary on review host. Arbiter / Victor may re-run locally before Gate B if desired.

## Building blocks

No **BB-n**. New merge lives in `apps/web/domains/cloud/proof-merge.js`. Controller only snapshots + calls Domain API. Facades: load order + `onFlushResult` only.

## Security.md mapping (touched Drive apply / storage)

| ID | Result |
|----|--------|
| **I1** | Demo still blocks `applyCloudPayload` before any merge/write (tested in suite; code early return). |
| **I2** | Re-merge touches only three proof keys; `stripHeavyMedia` / `HEAVY_MEDIA_KEYS` unchanged — next push still omits proofs from Drive JSON. |
| **L1** | Local proofs preferred when cloud empty; unmatched ids do not invent; clone-before-replace avoids wiping local snapshot source. Residual visit `date|index` noted as QA-1. |
| **C2 / C3** | No new scopes, tokens, or secrets. Proofs remain device-local (not uploaded). |
| **A2** | Failed apply guards (`null` / bad pets / seed-only) unchanged; demo no-op leaves local pets. |

High-risk patterns checked: no proof keys removed from strip; no merge brain in facade; no demo write; no invent for cloud-only nodes.

## Evidence (static)

- `domains/cloud/proof-merge.js` — pure IIFE; `RX_PROOF_KEYS`; `mergeLocalRxProofsInto` / `mergeLocalRxProofs`
- `domains/cloud/controller.js` — clone → replace → merge active + archived → slot write
- `apps/web/index.html` + `c/index.html` — `proof-merge.js` before `controller.js` (`?v=20260923-rx-preserve`)
- `apps/web/app.js` + `c/app.js` — `petsGraphSlot.onFlushResult` only (RX-03)
- Tests assert: strip drops proofs; apply restores matched; unmatched cloud pet stays bare; demo rejects; proof-merge purity
