# Arbiter — 20260814-lab-reports (iteration 1)

```yaml
iteration: 1
decision: candidate_ready
# wait_for_reviews | revision_required | candidate_ready | halted

blocking: []
non_blocking:
  - QA-001
  - QA-002
  - QA-003
  - QA-004
  - UI-001
  - UI-002
  - UI-003
  - UI-004
  - UI-005
  - UI-006
rerun: []
builder_scope: []
halt_reason: ""
```

## Reviews present

- Pharmacist: skipped (assigned skip — lab photo archive, not med/dose/ADR)
- QA: `conditional` — 4 findings, none high
- UI: `conditional` — 6 findings, all P2/P3

No required report missing. No `reject` verdict.

## Mapping

| ID | Source | Severity | Class | Notes |
|----|--------|----------|-------|-------|
| QA-001 | QA | medium | non_blocking | After save, back opens empty lab-add (`go("labs")` without replace). Extra history step; report is already stored. Not data-loss or wrong-pet. |
| QA-002 | QA | medium | non_blocking | Enter in clinic search submits `#lab-add-form`. Premature save of a photo that was already attached; clinic may be blank. Incomplete attribution, not lost records or wrong-pet write. |
| QA-003 | QA | medium | non_blocking | Cleared clinic after linking a visit still writes `visitDate`; `reportMatchesVisit` then matches every visit that day. Same pet, over-attribution on the timeline — not wrong-pet write, not deleted data. Closest call; still below the medical-safety / data-loss bar. |
| QA-004 | QA | low | non_blocking | Files past the 6-page cap dropped with no toast. Cap behavior with missing feedback; low, not blocking. |
| UI-001 | UI | P2 | non_blocking | Labs / disabled X-ray tiles read as twins at rest. Visual hierarchy only. |
| UI-002 | UI | P2 | non_blocking | Labs / lab-add omitted from mobile washed-screen header exception. Chrome polish. |
| UI-003 | UI | P2 | non_blocking | List-card「移除」outranks date/clinic/types. Control weight, not data-loss. |
| UI-004 | UI | P2 | non_blocking | Add-form photo「移除」overlays the thumb. Layout/tap placement. |
| UI-005 | UI | P2 | non_blocking | Timeline labs line below 44px tap. Usability polish. |
| UI-006 | UI | P3 | non_blocking | Disclaimer quieter than header restatement. Copy hierarchy. |

## Blocking

None. No high / P1 / reject items. No medium finding that loses stored reports or writes to the wrong pet.

QA-003 is the nearest medical-record issue (wrong visit on the same date can also show「此就診的檢驗報告」). It does not change which pet owns the report, does not drop photos, and was filed medium — not elevated to blocking.

## Non-blocking

- **QA-001** — After save, history should not leave an empty lab-add under the list.
- **QA-002** — Enter in clinic search should not submit the add form.
- **QA-003** — A report linked then un-clinicked should not match every visit on that date.
- **QA-004** — Toast when extra pages over the 6-photo cap are dropped.
- **UI-001** — Mute disabled X-ray; give live labs a rest-state cue.
- **UI-002** — Include `labs` / `lab-add` in the mobile washed-screen header exception.
- **UI-003** — Move list-card remove after thumbs, quieter than date/clinic.
- **UI-004** — Static clear under add-form thumbs, not overlay.
- **UI-005** — Padded hit area on `.tl-visit-labs-btn`.
- **UI-006** — One quiet support line for the no-interpretation constraint.

## Rerun

None (no blocking IDs).

## Builder scope

None — no revision this iteration.

## Gate

Gate B remains **pending**. Parent asks Victor 採用 / 否決. Non-blocking items may be deferred; they do not block Gate B unless Victor chooses a polish pass first.
