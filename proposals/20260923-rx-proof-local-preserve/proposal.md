---
id: 20260923-rx-proof-local-preserve
title: "Preserve local Rx proof photos across Drive apply (no upload)"
status: building
author: planner
candidate_branch: "proposal/rx-proof-local-preserve"
candidate_path: ""
created: 2026-09-23
updated: 2026-09-23
---

# Proposal: Preserve local Rx proof photos across Drive apply

Companion: `state.yaml` (v2 source of truth for gates / iteration).

**Gate A:** Victor confirmed in chat 2026-09-23（「確認 開始做吧」）. Builder may start; do not re-ask Gate A.

---

## Why

On formal **B**, med proof stills (`bagPhoto` / `rxPhoto` / `drugPhoto` on visits and meds) can vanish after refresh when Drive reconcile runs `applyCloudPayload`.

Root cause (prior diagnosis):

| Layer | Behavior |
|-------|----------|
| Local `pets[]` / `petsGraphSlot` | Keeps Rx proof data-URLs (already excluded from avatar-style strip on persist) |
| `buildCloudPayload` → `stripHeavyMedia` | **Intentionally drops** those keys so Drive JSON stays small / private |
| `applyCloudPayload` | `replaceActiveGraph(payload.pets, …)` then writes the **stripped** graph back to the slot |

So a successful cloud apply **replaces** the durable local graph with a cloud copy that never had proofs → UI looks like “photos disappeared after refresh.”

Product / legal stance already documented in i18n (`accountSyncDriveExplain` and siblings): **藥袋／藥單 photos are not in Drive backup.** This proposal **keeps** that; it does **not** start uploading proofs.

---

## Goal

1. After any `applyCloudPayload` that replaces the pets graph, **re-merge** prior local `bagPhoto` / `rxPhoto` / `drugPhoto` onto matching visits/meds so cloud strip cannot wipe on-device proofs.
2. Harden local graph persist feedback (optional quota toast on `petsGraphSlot` flush fail, same pattern as `petPhotosSlot`).
3. Keep Drive payload strip unchanged; no new Rx media in backup JSON.

Success: Victor saves bag/rx/drug proofs on B → refresh / Drive apply → proofs still show on timeline / med-proof UI; Drive JSON still omits those keys.

---

## In scope

### RX-01 — Re-merge local proofs in `applyCloudPayload`（Domain）

**Layer:** `domains/cloud`  
**Path:** `apps/web/domains/cloud/controller.js` (and helper colocated or in visits — see RX-02)

Before or immediately after `replaceActiveGraph` with cloud pets:

1. Snapshot proof fields from the **pre-apply** local graph (`getPets` / `getArchivedPets`, or a shallow extract).
2. Apply cloud pets as today (seed guards, demo block, slots write unchanged).
3. Merge: for each pet (by `id`), visit (by stable visit id / best existing identity), and medication (by med id when present), copy local `bagPhoto` | `rxPhoto` | `drugPhoto` onto the new graph when the incoming cloud value is missing/null/empty **and** local had a non-empty value.
4. Persist the merged graph via existing `petsGraphSlot.write` path already in `applyCloudPayload`.

**Merge rules (acceptance-critical):**

- Prefer **non-empty local** over missing cloud (cloud never carries proofs today).
- Do **not** resurrect proofs the user already cleared on the same visit/med if local graph already has `null` for that slot at apply time.
- Do **not** invent proofs for pets/visits that only exist on cloud with no local match.
- Demo mode (`I1`) still returns false and does not write.

### RX-02 — Pure merge helper（Domain, Tier 2）

**Layer:** `domains/cloud` **or** `domains/visits`  
**Preferred path:** `apps/web/domains/cloud/proof-merge.js` (new) **or** extend `apps/web/domains/visits/controller.js` with a pure `mergeLocalRxProofs(localPets, cloudPets) → pets` if visits already owns proof slot helpers.

- Pure function(s): no DOM, no `localStorage`, no Drive.
- Export on `PetLiveWeb.domains.cloud` (or `.visits`) for tests + controller use.
- Reuse the same three keys already in `HEAVY_MEDIA_KEYS` (`bagPhoto`, `rxPhoto`, `drugPhoto`); do **not** re-merge `attachmentUrl` unless tests prove a parallel wipe (out of default scope).

**Forbidden:** dumping merge loops only into `apps/web/app.js` / `c/app.js`.

### RX-03 — Optional: `petsGraphSlot` flush failure toast（Facade thin wire）

**Layer:** facade only (slot options already supported by `core/storage`)  
**Paths:** `apps/web/app.js` (formal B) and mirror `apps/web/c/app.js` for parity

- Add `onFlushResult: (ok) => { if (!ok) showPersistenceFailure(); }` on `petsGraphSlot`, matching `petPhotosSlot`.
- No new chrome component; reuse existing toast.

### RX-04 — Tests

**Paths:** `qa/tests/web-cloud.test.js` (extend) and/or `qa/tests/web-cloud-proof-merge.test.js` (new)

- Roundtrip: local pets with visit/med proofs → `buildCloudPayload` strips keys → `applyCloudPayload` → proofs **restored** on matched nodes.
- Guards: demo block; seed-only reject; no proof invent for unmatched ids.
- Strip still omits proofs from payload (legal/product invariant).

### RX-05 — Thin facade / load order

**Layer:** surface facade  
**Paths:**

| Surface | Role |
|---------|------|
| B `apps/web/index.html` | Load new domain script if added (`?v=` bump) **before** `app.js` |
| B `apps/web/app.js` | Thin: no merge algorithm; only RX-03 slot hook if needed |
| C `apps/web/c/index.html` + `c/app.js` | Same shared domain script + optional flush toast parity |

Shared domain serves both; formal bug is **B**. No C→B cover ceremony for shared `domains/*` (already shared). Passport UI markup unchanged.

---

## Out of scope

- Uploading `bagPhoto` / `rxPhoto` / `drugPhoto` to Google Drive or changing `stripHeavyMedia` / `HEAVY_MEDIA_KEYS` to keep proofs in backup JSON
- Privacy / terms copy edits (i18n already says Rx bag/slip photos are not in Drive backup; keep that)
- Phase 2 Supabase pet DB / RLS
- Pet avatar / `petPhotosSlot` redesign; visit imaging (`xrayPhotos` / `usPhotos`) already rides Drive
- New med-proof UI screens, lightbox, or dose/pharmacist copy
- Changing conflict “keep cloud vs local” UX beyond silent proof re-merge
- Direct B passport chrome redesign (this is domain + thin facade)

---

## Likely files

| Layer | Path | Change |
|-------|------|--------|
| **Domain** | `apps/web/domains/cloud/controller.js` | Call proof re-merge inside `applyCloudPayload` |
| **Domain** | `apps/web/domains/cloud/proof-merge.js` **(new)** *or* `apps/web/domains/visits/controller.js` | Pure extract + merge helpers |
| **Domain** | `apps/web/domains/cloud/selectors.js` | Only if merge needs a small pure selector; prefer avoid |
| **Core** | `apps/web/core/storage.js` | No change expected (`onFlushResult` already exists) |
| **Facade** | `apps/web/app.js` | Thin: `petsGraphSlot` `onFlushResult` (RX-03); no merge brain |
| **Facade** | `apps/web/c/app.js` | Same thin wire for C parity |
| **Surface load** | `apps/web/index.html`, `apps/web/c/index.html` | `<script defer src="domains/cloud/proof-merge.js?v=…">` (if new file) before controller / `app.js` |
| **QA** | `qa/tests/web-cloud.test.js` and/or new `qa/tests/web-cloud-proof-merge.test.js` | RX-04 |
| **Legal / i18n** | — | **No edits** this round |

Dependency direction: facade → cloud controller → proof-merge / visits pure helpers → core storage.

---

## Risks

| Risk | Mitigation |
|------|------------|
| **L1 local-first** — merge wrong pet/visit → wrong proofs | Match by pet `id` + visit/med stable ids; tests for mismatch leave cloud node without inventing |
| **I1 demo** — apply must stay blocked | Keep existing `demo()` early return before merge/write |
| **I2 merge safety** — re-merge must not reintroduce stripped *other* heavy blobs into Drive on next push | Only touch the three proof keys; `buildCloudPayload` strip unchanged |
| **Privacy** — accidental start of Drive upload of Rx stills | Non-goal; strip stays; Legal reviewer can **skip** if no copy/data-flow disclosure change |
| **Quota** — large data-URLs in IDB/LS still fail silently | RX-03 toast on graph flush fail |
| **Tier 2 / BB** — merge only in `app.js` | Blocking if Builder dumps brain in facade |
| Medical / dose UX | None — photos only; pharmacist **skip** |

**Security (Tier 1):** No new secrets; Drive token path unchanged; strip continues to exclude Rx proofs from backup (confidentiality posture for Drive JSON). Map any scan finding to L1 / I1 / I2.

---

## Acceptance criteria

- [ ] **RX-01:** On formal B, save bag and/or rx and/or drug proof → trigger path that calls `applyCloudPayload` with a stripped payload (or refresh that pulls/applies) → proofs still visible on the same visit/med.
- [ ] **RX-01:** `buildCloudPayload` / Drive JSON still omits `bagPhoto` / `rxPhoto` / `drugPhoto` (strip unchanged).
- [ ] **RX-02:** Merge logic lives under `domains/cloud` and/or `domains/visits`; facade has no merge algorithm (QA BB check).
- [ ] **RX-03:** Quota / flush fail on `petsGraphSlot` surfaces existing persistence failure toast (parity with pet photos), or documented skip if already covered elsewhere — Builder must implement or note in candidate.
- [ ] **RX-04:** Automated test covers strip + apply + local proof survival.
- [ ] Demo mode still refuses `applyCloudPayload`.
- [ ] No privacy/terms/i18n Drive-scope copy change claiming proofs are now backed up.

---

## Review routing

| Reviewer | Route |
|----------|--------|
| Pharmacist | **skipped** — no dose / drug DB |
| QA | **required** — data-loss / roundtrip / BB |
| UI | **skipped** unless RX-03 toast copy/layout regresses; default skip |
| Legal | **skipped** if no legal/i18n Drive disclosure change (product copy already says proofs not in backup); **required** only if Builder touches privacy/terms or claims proofs upload |
| Arbiter | After reviews |
| Security diff scan | Before Gate B (Drive apply / storage paths) |

---

## Notes for Victor

Gate A already approved（2026-09-23 chat）. Builder implements `builder_scope` IDs only. After candidate_ready, Gate B still needs「採用」before merge / Pages.
