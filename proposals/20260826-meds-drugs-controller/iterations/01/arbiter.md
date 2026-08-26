# Arbiter

```yaml
iteration: 1
decision: revision_required
# wait_for_reviews | revision_required | candidate_ready | halted

blocking:
  - QA-001
  - QA-002
non_blocking:
  - QA-003
  - UI-001
rerun:
  - qa
builder_scope:
  - QA-001
  - QA-002
halt_reason: ""
```

## Summary

- Pharmacist **pass** — no MED findings; dose/unit/freq/source/compound/pending parity OK for MD-01..MD-04 extract.
- QA **conditional** — two medium findings raised to **blocking** under protocol: wrong-visit med attach (QA-001) and wrong-pet write risk on pet switch (QA-002). Low test-gap QA-003 stays non-blocking.
- UI **pass** — UI-001 (P3 parasite button order / cache `?v=` drift vs TV WIP) is non-blocking and out of med-extract scope; do not expand Builder to polish parasite chrome.
- Decision **revision_required** (iteration 1 < max 3). Builder must fix only QA-001 and QA-002; then re-run QA.

## Notes for Victor

下一輪會先把本輪 `reviews/` 存進 `iterations/01/`，再只修 **QA-001**（empty clinic 時 complete-drugs 不可落到同日錯誤 visit）與 **QA-002**（換寵物時清掉 pending / completingVisitRef，避免寫到錯寵）。修完後只重跑 QA。Gate B 尚未到；採用與否仍由你決定。
