# Arbiter — 20260824-visit-imaging (iteration 2)

```yaml
iteration: 2
decision: candidate_ready
# wait_for_reviews | revision_required | candidate_ready | halted

blocking: []
non_blocking:
  - QA-001
  - QA-003
  - QA-004
  - UI-001
  - UI-002
  - UI-003
  - UI-004
  - UI-005
  - UI-006
  - UI-007
  - UI-008
rerun: []
builder_scope: []
halt_reason: ""
```

## Reviews present

- Pharmacist: skipped (assigned skip — imaging stills, not med/dose/ADR)
- QA: `conditional` — fresh iteration-2 re-run; **QA-002 fixed**; QA-001 / QA-003 / QA-004 remain
- UI: `conditional` — iteration-1 report still valid (UI not in rerun); UI-001–008 all P2/P3

No required report missing. No `reject` verdict.

## Prior blocking clearance

Iteration-1 Arbiter elevated only **QA-002** (save during compress → empty write + success toast = data-loss). Iteration-2 QA confirms fixed: `imagingCompressInFlight` disables submit / early-returns with「請稍候»; after await, append re-resolves pending arrays; pendings clear only after successful write.

## Mapping

| ID | Source | Severity | Class | Notes |
|----|--------|----------|-------|-------|
| QA-001 | QA | medium | non_blocking | After save, Back reopens dead `imaging-proof` (cleared pending). Stills already on visit; not data-loss. |
| QA-002 | QA | medium | **cleared** | Was blocking (data-loss). Fixed in iteration 2. |
| QA-003 | QA | medium | non_blocking | Leftover `pendingVisitImagingIndex` re-expands on later timeline render / pet switch. Wrong panel UX; not wrong-pet write. |
| QA-004 | QA | low | non_blocking | Language change overwrites imaging-proof subtitle; preview「移除」static. Chrome i18n. |
| UI-001 | UI | P2 | non_blocking | 藥單 + 影像 pills crowd clinic/year on narrow / EN. |
| UI-002 | UI | P2 | non_blocking | Open chips share identical「收合」copy. |
| UI-003 | UI | P2 | non_blocking | Disabled「上傳影片」competes with real upload CTA. |
| UI-004 | UI | P2 | non_blocking | imaging-proof h2 duplicates archive kicker. |
| UI-005 | UI | P2 | non_blocking |「移除」overlays 88×88 stills. |
| UI-006 | UI | P3 | non_blocking | No zoom glyph; figcaption unstyled. |
| UI-007 | UI | P3 | non_blocking | Summary rows lack “opens timeline” cue. |
| UI-008 | UI | P3 | non_blocking | Emergency X-Ray tile types can ellipsis on desktop. |

## Blocking

None.

## Non-blocking

- **QA-001** — After successful save, Back should not reopen a dead imaging-proof editor.
- **QA-003** — Summary→timeline expand must be one-shot; leftover index must not reopen another pet’s 影像 panel.
- **QA-004** — imaging-proof subtitle and preview remove labels must recompute on language change.
- **UI-001** — Put `.tl-visit-actions` on its own row on narrow screens; more gap between 藥單 / 影像.
- **UI-002** — Keep type in the open chip (e.g. 收合影像) so 藥單 vs 影像 stay distinct.
- **UI-003** — One upload CTA in the expand panel; coming-soon video stays on the form.
- **UI-004** — Action heading vs visit kicker (or drop the kicker).
- **UI-005** — Clear control below the thumb, not over the radiograph; larger stills if matching med-proof.
- **UI-006** — Light zoom mark / caption style; optional type grouping.
- **UI-007** — Trailing affordance that summary tap opens that visit’s imaging panel.
- **UI-008** — Allow type wrap on the emergency X-Ray tile at default e-docs size.

## Rerun / builder scope

Empty. No further revision required for Gate B eligibility. Non-blocking items may stay as known limits unless Victor later scopes a follow-up proposal.

## Gate

**`candidate_ready`.** Gate B remains **pending** until Victor says 採用 / adopt. Parent may present Gate B; do not merge and do not treat the candidate as adopted.
