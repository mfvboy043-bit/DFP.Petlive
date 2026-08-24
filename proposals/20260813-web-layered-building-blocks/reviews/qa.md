# QA review
Verdict: pass

Iteration: 2

## Findings

### Current-mainline timeline parity restored
- ID: QA-001
- Status: resolved
- Severity: high
- Steps: 1. Compare candidate and current-mainline source from `renderVisitWeightParts` through `renderTimeline`. 2. Compare their stylesheet cache tokens.
- Expected: No timeline rollback or competing timeline-only diff.
- Actual: The timeline slices are byte-equal and both pages use `20260813-tl-tag-border`.

### Storage failures no longer report success
- ID: QA-002
- Status: resolved
- Severity: high
- Steps: 1. Trace a failed slot write through owner-profile save, owner-alert add/edit/delete, linked-alert suppression, and pet-photo crop save. 2. Check toast, navigation/form retention, cached state, and pet-photo mutation.
- Expected: Every failed write reports failure, retains retryable UI, and avoids success or in-memory durability claims.
- Actual: All four storage concerns propagate `false`. Profile stays on its form; alert inputs/edit state remain available; linked suppression/deletion does not refresh as successful; photo crop remains open and `pet.photo` is unchanged. Slot failure leaves its previous cached value intact.

### Vaccine drafts survive same-pet dirty refresh
- ID: QA-004
- Status: resolved
- Severity: medium
- Steps: 1. Enter selected vaccine chips, a custom name, given date, and next-due date. 2. Trigger an active same-pet language refresh. 3. Repeat after leaving Vaccines and returning to its hidden dirty group. 4. Switch pet identity.
- Expected: Active and hidden same-pet refreshes preserve the draft; a real pet change resets it.
- Actual: `refreshVaccineForm` snapshots and restores all four draft fields when `vaccineFormPetId` matches. Active and deferred hidden flushes share this path. A changed pet ID still uses the destructive reset, avoiding cross-pet draft carryover.

## Checks and limitations

- macOS JavaScriptCore parsed `app.js` and all five extracted classic scripts.
- A JavaScriptCore parity assertion passed against current mainline for the timeline slice and stylesheet token.
- Local repo-root HTTP checks returned 200 for the candidate page, app, storage script, and shared stylesheet.
- Cursor diagnostics report no errors in the inspected candidate and test files.
- Static path inspection covered every write caller for owner profile, owner alerts, linked-alert suppression, and pet photos, including failure-state retention and the same-pet/different-pet vaccine branches.
- Node, Deno, Bun, qjs, and `js` are unavailable. The Node boundary suite could not run.
- No controllable browser is available to this reviewer, so injected `localStorage` failure clicks, full desktop interaction, and phone/LAN interaction were not executed. The browser-dependent conclusions above are code-path verified.

## Unresolved blockers

None for QA-001, QA-002, or QA-004.
