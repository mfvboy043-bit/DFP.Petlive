# Arbiter — 20260824-visit-imaging (iteration 1)

```yaml
iteration: 1
decision: revision_required
# wait_for_reviews | revision_required | candidate_ready | halted

blocking:
  - QA-002
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
rerun:
  - qa
builder_scope:
  - QA-002
halt_reason: ""
```

## Reviews present

- Pharmacist: skipped (assigned skip — imaging stills, not med/dose/ADR)
- QA: `conditional` — 4 findings; QA-002 is data-loss
- UI: `conditional` — 8 findings, all P2/P3

No required report missing. No `reject` verdict.

## Mapping

| ID | Source | Severity | Class | Notes |
|----|--------|----------|-------|-------|
| QA-001 | QA | medium | non_blocking | After save, Back reopens `imaging-proof` with cleared pending index →「找不到對應就診…」. Extra history + dead editor; stills are already on the visit. Not data-loss. |
| QA-002 | QA | medium | **blocking** | Save while compress is in-flight copies empty pending arrays, then replaces with `[]`. In-flight stills never land on `visit.imaging`; toast is still「已存檔就診影像」. Success with dropped files = data-loss. |
| QA-003 | QA | medium | non_blocking | Leftover `pendingVisitImagingIndex` expands `visit-imaging-{index}` on a later timeline render (pet switch / weight / i18n). Wrong panel can open; data stays per-pet. Not a wrong-pet write. |
| QA-004 | QA | low | non_blocking | Language change overwrites imaging-proof subtitle via `data-i18n="imagingProofSub"`; preview「移除」stays static. Chrome i18n only. |
| UI-001 | UI | P2 | non_blocking | 藥單 + 影像 pills crowd clinic/year on ~360px / EN. Layout / fat-finger. |
| UI-002 | UI | P2 | non_blocking | Open chips share the same「收合」copy. Label identity, not data. |
| UI-003 | UI | P2 | non_blocking | Disabled「上傳影片」competes with the real upload CTA in the expand panel. Hierarchy. |
| UI-004 | UI | P2 | non_blocking | imaging-proof h2 duplicates the archive kicker. Title vs kicker. |
| UI-005 | UI | P2 | non_blocking |「移除」overlays 88×88 stills. Tap / read of radiographs. |
| UI-006 | UI | P3 | non_blocking | No zoom glyph; figcaption unstyled. Polish. |
| UI-007 | UI | P3 | non_blocking | Summary rows lack a “opens timeline” cue. Affordance. |
| UI-008 | UI | P3 | non_blocking | Emergency X-Ray tile types can ellipsis on desktop. Wrap. |

## Blocking

- **QA-002** — Save during compress drops the new stills and still toasts success. Medium, elevated because stored imaging is lost (empty visit stays empty).

No high / P1 / reject items. Iteration 1 of 3 → `revision_required`, not halted.

## Non-blocking

- **QA-001** — After a successful save, Back should not reopen a dead imaging-proof editor.
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

## Rerun

- **qa** — owns QA-002; save/pending/compress path can regress attach, toast, and timeline persist.

Do not rerun UI this pass (no UI blocking IDs). Pharmacist stays skipped.

## Builder scope

**QA-002 only.** Do not fold QA-001 / QA-003 / QA-004 or UI-001–008 into this revision.

Fix: stills chosen but not yet in pending must not be dropped on 儲存影像; a success toast must mean those files are on `visit.imaging` (disable Save until compress finishes, or wait for in-flight append before commit).

## Gate

Gate B remains **pending**. Do not ask Victor 採用 until a later Arbiter returns `candidate_ready`. Parent: snapshot `reviews/` → `iterations/01/`, set `status: revising`, Builder on `builder_scope` only, then rerun QA.
