# Arbiter — 20260813-web-perf-smoothness (iteration 1)

```yaml
iteration: 1
decision: candidate_ready
# wait_for_reviews | revision_required | candidate_ready | halted

blocking: []
non_blocking:
  - QA-001
rerun: []
builder_scope: []
halt_reason: ""
```

## Reconciliation

- Required first-build reviewers present: QA (`pass`), UI (`pass`). Pharmacist correctly **skipped** for PERF-02/04 (no dose/unit/freq/duration/disclaimer or med DOM builder changes).
- **QA-001** (low): residual pet-photo durability gap if the tab/process is hard-killed inside the ~80ms coalesce window before timer/`pagehide`/`visibilitychange`. In-memory/`pet.photo` update immediately; normal hide/close and failed-flush toast paths remain. Accepted coalesce tradeoff under proposal risk notes — **non-blocking**, not medical-safety or in-session silent drop.
- UI: no findings; light compatibility only; no CSS redesign in scope.
- No high / P1 / `reject` items. No medium data-loss or wrong-pet write.

## blocking_issues

None.

## non_blocking

- QA-001 — hard-kill within photo coalesce window can drop last durable map without toast (timer/`pagehide` paths OK).

## rerun

None.

## builder_scope

None (no revision).

## Rationale

Iteration 1 first-build scope (PERF-02 + PERF-04) has no blocking findings. Candidate is **candidate_ready** (conditional on QA-001 remaining as known non-blocking). Gate B stays pending for Victor — Arbiter does not adopt.

## Steward note

`contrast.md` is a Version Steward artifact (not Arbiter). Before Gate B presentation, Steward should write `proposals/20260813-web-perf-smoothness/contrast.md` covering mainline vs candidate behaviors and files touched (`preview/apps/web/app.js`, `core/storage.js`, `shell/render-coordinator.js`, `index.html`, `qa/tests/web-building-blocks.test.js`).

## Notes for Victor

Gate B 可審：第一輪 PERF-02/04 candidate 無 blocking。僅 QA-001（低）硬殺 tab 合併寫入窗殘留風險。回覆「採用」才合併；Arbiter 不決定採用。
