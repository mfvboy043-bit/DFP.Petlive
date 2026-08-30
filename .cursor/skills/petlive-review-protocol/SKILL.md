---
name: petlive-review-protocol
description: >-
  Petlive review routing and closed-loop protocol (which reviewers to run, issue
  IDs, iteration snapshots, halt). Use when orchestrating reviews or Arbiter
  after a Builder candidate.
---

# Review protocol

## Who to run

| Change touches | Pharmacist | QA | UI | Legal |
|---|---|---|---|---|
| Medications, dose, frequency, duration, drug DB | yes | yes | if UI copy/layout | if disclaimer/consent copy |
| Medical alerts / ADR copy | yes | yes | yes | yes |
| Privacy policy, terms, disclaimer pages/modals | no | yes | yes | yes |
| Auth, sign-in, account, Supabase / Google OAuth | no | yes | yes | yes |
| Cloud sync, export, third-party data flows | no | yes | yes | yes |
| Consent / opt-in before sync or data upload | no | yes | yes | yes |
| Emergency screens (copy or liability framing) | yes | yes | yes | yes |
| Navigation, forms, pet switch, empty states | no | yes | yes | no |
| CSS / layout / brand / motion | no | yes (tap/overflow) | yes | no |
| Schema / data shape | if med fields | yes | no | if PII / sync fields |
| i18n chrome labels | no | yes | yes | if legal strings |
| Typos in comments only | skip full loop | skip | skip | skip |

If unsure, run QA + the domain reviewer (pharmacist for med, UI for visual, **legal** for privacy/terms/disclaimer/auth/sync).

## Tier 1 — Security (always on)

All candidates must not violate **`security.md`** invariants (C/I/A/L). For auth, sync, storage, Drive, Supabase DB, or billing: orchestrator runs **security diff scan** before Gate B; map findings to invariant IDs (e.g. `C1`, `I4`). High = blocking (same weight as Arbiter P1).

## Tier 2 — Building blocks (always on)

New product logic, chrome, components, or shared styles must live under `domains/` / `core/` / `shell/` per **web-building-blocks**. QA flags **BB-n** when new brain is pasted only into `app.js`, `c/app.js`, or surface `styles.css` without a block file. BB high = blocking (same as P1 — creates cleanup debt while codebase is still being organized).

## Independence

Launch assigned reviewers in parallel. Do not include other `reviews/*.md` in a reviewer prompt.

## IDs

- Pharmacist `MED-n`
- QA `QA-n`
- UI `UI-n`
- Legal `LEGAL-n`
- Building blocks `BB-n` (Tier 2 — brain in wrong layer / app.js dump)
Keep IDs stable across iterations (same bug = same ID).

## Snapshots

Before each revision Builder: copy current `reviews/` → `iterations/<NN>/` where NN is the iteration that was just reviewed (e.g. `01`).

## Arbiter mapping

- high / P1 / reject item → blocking
- Legal high (undisclosed collection/sync, disclaimer contradicts behavior, missing required consent on new data path) → blocking
- Data-loss or wrong-pet write → blocking even if labelled medium
- Else → non_blocking
- `rerun` = reviewers who owned blocking IDs (add QA if the fix can break flow)
- `builder_scope` = blocking IDs only

## Halt

After `max_iterations` (default 3) if blockers remain: `halted`. Human chooses revise proposal / accept limits / abandon. No iteration 4.
