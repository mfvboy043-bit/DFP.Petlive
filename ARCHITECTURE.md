# Petlive Modular Architecture

Contracts in `contracts/pet-health-passport-contracts.md` are the source of truth.
Runtime building blocks live under `modules/*` and communicate only through public APIs + `ModuleResult`.

## Storage vision (local-first)

This app is an **owner-held** record, not a clinic EMR. The product goal is:

- Pet files live **on the owner’s phone**
- Identity via **email or iCloud**, not Petlive-hosted bulk photo storage
- Solo-dev constraint: do **not** buy cloud object storage for everyone’s images

**Now (UI prototype):** in-memory seed + small `localStorage` (language, owner demo, avatar). Proof photos stay on-device for the session after JPEG compress.

**Next (when wrapping as an app):** IndexedDB or native files on device; optional **user-owned** sync (iCloud Drive / CloudKit / email backup export). Petlive servers should not be the photo warehouse.

## Contracts vs the screen

`contracts/` is the shared field list so future modules (and agents) stay aligned. If the UI already has compound meds, parasite prevention, or “photo first, drug name later”, those fields must be written into the contract file — that is documentation, not a new feature.

## Layout

```
petlive/
├── contracts/                 # Cross-module contracts (v0.1+)
├── packages/
│   ├── shared/result.js       # ModuleResult { ok, data | error }
│   └── db-schema/             # Shared + entity TypeScript types
├── modules/
│   ├── pet/
│   ├── drug/
│   ├── visit/                 # createVisit syncs PetWeight
│   ├── medical-alert/         # supports fault injection for QA
│   ├── vaccine/
│   ├── medication/            # validation + history/current filters
│   └── emergency-card/        # read-only composition; degrades sections
├── apps/web/                  # UI shell (prototype + module bridge)
│   ├── core/                  # state + storage adapters
│   ├── shell/                 # navigation + render coordinator
│   ├── domains/               # pure domain controllers / selectors
│   ├── c/                     # discussion surface (edit C first)
│   └── runtime/petlive.js     # window.PetLive bridge
└── qa/
    ├── test-plans/
    └── tests/                 # node:test contract + isolation suites
```

**New web logic:** classify → write under `domains/` / `core/` / `shell/` → thin facade wire. Rule: `.cursor/rules/web-building-blocks.mdc`.

**Drug catalog:** single seed `modules/drug/seed.js` (via `runtime/petlive.js` → `window.drugs` + `PetLive.drug`); web search/enrich goes through `apps/web/domains/drugs/`.

## Dependency batches (contracts §8)

1. Pet + Drug  
2. Visit + Medical Alert + Vaccine  
3. Medication  
4. Emergency Card + Timeline UI  

## Fault isolation rules

- Module functions return `ModuleResult`; they must not throw across boundaries (`guard`).
- UI refreshes sections independently via `safeRender` (see `apps/web/app.js` `applySelectedPet`).
- Emergency Card degrades missing upstream sections (`_degraded`) instead of failing entirely when Pet itself is available.

### UI wired: emergency-card (adopted)

Proposal `20260812-emergency-module-bridge` (adopted): the emergency card screen prefers `PetLive.emergency.generateEmergencyCard` with a **snapshot** from prototype `pets[]` (keeps one UI source of truth). Upstream inject via `?injectFail=alerts` (or `sessionStorage petlive-inject-fail`) sets `_degraded.*` so the card shows “temporarily unavailable” — not empty-state copy. If `PetLive` is missing, the shell falls back to local render.

## Local commands

```bash
# Contract / isolation tests (no npm install required; relative imports)
node --test qa/tests/*.test.js

# Serve repo root so /modules and /apps/web both resolve
python3 -m http.server 5173 --bind 0.0.0.0 --directory .
# open http://127.0.0.1:5173/apps/web/
```

Phone preview: `http://<lan-ip>:5173/apps/web/`
