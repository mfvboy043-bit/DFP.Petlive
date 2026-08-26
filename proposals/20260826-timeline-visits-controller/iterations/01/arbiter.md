# Arbiter

```yaml
iteration: 1
decision: revision_required
# wait_for_reviews | revision_required | candidate_ready | halted

blocking:
  - QA-001
non_blocking:
  - QA-002
  - QA-003
  - UI-001
rerun:
  - qa
builder_scope:
  - QA-001
halt_reason: ""
```

## Summary

- Pharmacist **pass** — no MED findings; weight/proof/Rx adjacency and disclaimer semantics unchanged for TV-01…TV-04.
- QA **conditional** — **QA-001** (medium label) promoted to **blocking**: C boots mid-file against `PetLiveWeb.domains.medications.*`; a TV-only adopt that omits meds scripts throws before `applySelectedPet()` / Timeline paint. Gate A scope is TV-only; a candidate that cannot stand alone without out-of-scope meds domains is not Gate-B-ready as scoped. **QA-002** (low: `node --test` unverified on review host) and **QA-003** (low: `findVisitByDateClinic` empty/date-only gaps) stay **non-blocking**.
- UI **conditional** — **UI-001** (P2: co-mingled `.screen-head:has(> .btn-small)` rules would reflow Timeline header if styles WIP rides this adopt) stays **non-blocking** under protocol (not P1/reject; not data-loss). Do not expand Builder to redesign chrome; exclude or narrow that CSS at adopt time if still co-mingled.
- Decision **revision_required** (iteration 1 < max 3). Builder fixes **QA-001 only**; then re-run QA.

## Mapping notes

| ID | Reviewer severity | Arbiter | Why |
|---|---|---|---|
| QA-001 | medium | **blocking** | Boot/coupling: TV-scoped candidate cannot load Timeline without out-of-scope meds scripts; breaks clean TV-only adopt / acceptance “only C + visits\|timeline + QA”. |
| QA-002 | low | non_blocking | Host tooling gap; static + JSC checks cover TV-04 checklist. |
| QA-003 | low | non_blocking | Untested edge on helper not yet wired into live med-save path (proposal non-goal). |
| UI-001 | P2 | non_blocking | Visual adopt pollution if styles.css WIP included; not medical safety / data loss; not in builder_scope this round. |

## Notes for Victor

下一輪會先把本輪 `reviews/` 存進 `iterations/01/`，再只修 **QA-001**：讓 C 在僅 TV（visits + timeline）腳本時可開機並畫 Timeline——解除對 `domains/medications` 的硬依賴（facades 回退至 inlined / TV-scoped helpers，或從本 candidate 的 `c/index.html` + `c/app.js` 拆出 meds 耦合）。**不要**因此擴大 Gate A 去實作 meds 領域。修完後只重跑 QA。Gate B 尚未到；採用與否仍由你決定。
