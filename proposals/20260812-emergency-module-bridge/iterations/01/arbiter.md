# Arbiter — 20260812-emergency-module-bridge (iteration 1)

decision: revision_required

## blocking_issues
- MED-001

## non_blocking
- MED-002
- MED-003
- QA-001
- QA-002
- UI-001
- UI-002
- UI-003

## rerun
- pharmacist
- qa

## builder_scope
- MED-001

## Rationale

Pharmacist **reject** + **MED-001 [high]**: `safeRender("emergencyCard", …)` whole-card failure still paints `noAlertItem` / `noMeds`, which in an emergency context reads as confirmed absence — the exact degraded≠empty hazard in the proposal. That alone forces revision.

Other findings stay non-blocking: MED-002 (weaker meds degrade wording, still not empty-state), MED-003 (low name fallback), QA-001 (preview timeline fork / Gate B merge hygiene, not runtime medical failure on this screen), QA-002 (copy-summary vs injectFail demo mismatch, low), UI-001–003 (P2/P3 chrome polish).

iteration 1 < max_iterations 3 → **revision_required**, not halted. Rerun pharmacist (owns MED-001) and QA (fallback path can regress emergency render / pet-apply flow). Builder must fix only MED-001.
