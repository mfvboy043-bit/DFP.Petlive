---
id: 20260827-storage-indexeddb
title: Storage evolution — IndexedDB behind JSON slots
status: adopted
author: planner
candidate_branch: "proposal/storage-indexeddb"
candidate_path: "proposals/20260827-storage-indexeddb"
created: 2026-08-27
updated: 2026-08-27
# Gate B: Victor 採用 2026-08-27 — C only; B cover pending
---

# Proposal: Storage evolution — IndexedDB behind JSON slots

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Advance the adopted `20260813-web-layered-building-blocks` later phase **Storage evolution**: evolve `apps/web/core/storage.js` so JSON document slots can persist via **IndexedDB behind the same public surface** (`createJsonSlot` / `createPersistedMapSlot` alias), without breaking existing callers across pets graph, sync-meta, owner profile, alerts, photos, labs, etc.

This slice is a **behavior-preserving adapter** — not a big-bang forced migration of all production data on first paint. Default backend stays localStorage; C may opt into IDB via an explicit flag. Formal **B** / Pages stay untouched until Victor separately confirms a C → B cover.

## Migration policy (default recommendation)

| Mode | Behavior |
|---|---|
| `backend: "local"` | Today's path only. No IDB open. |
| `backend: "idb"` | Persist to IDB. On first read miss in IDB, **hydrate once** from localStorage if present; then write-through to IDB. Prefer **IDB as source of truth** after successful hydrate. localStorage: optional write-through mirror (`mirrorLocal: true` default when `idb`/`auto`). |
| `backend: "auto"` | Use IDB when `indexedDB` is available; else fall back to `local`. Same hydrate rules when IDB is chosen. |

Never delete localStorage keys automatically in this slice (no "purge LS after migrate"). Never overwrite a non-empty IDB document with empty LS fallback.

## Builder notes (iteration 1)

- Default `local` — zero behavior change for B and unflagged C.
- C IDB opt-in: set `data-petlive-storage-backend="idb"|"auto"` on `<html>`, add `storage-boot.js` defer before `app.js` (see `apps/web/c/index.html` comment).
- `PetLiveWeb.storage.configure({ backend })` and `whenReady()` for IDB hydrate before relying on post-ready cache.
