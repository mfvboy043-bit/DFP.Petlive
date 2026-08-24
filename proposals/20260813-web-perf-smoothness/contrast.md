# Contrast: mainline vs perf smoothness candidate (PERF-02 + PERF-04)

## Mainline

- Language change runs static `applyI18n`, then `onLanguageChange` → `applySelectedPet()`, which refreshes home and force-dirties/flushes registered groups broadly.
- Pet photo saves call storage `write` immediately with the full data-URL map (synchronous main-thread stringify + `setItem`).
- Storage slots already cache reads; photo writes are not coalesced.

## Candidate

- Language change keeps one static `applyI18n`, then `refreshLanguage()`: flush home + active screen only; mark inactive groups dirty for next entry.
- Pet photo updates avatar / `pet.photo` immediately; persistence uses `scheduleWrite` (~80ms coalesce) with flush on timer, `visibilitychange`, and `pagehide`.
- Failed flush still surfaces existing persistence failure feedback; key `petlive-pet-photos` and JSON shape unchanged.

## Candidate files

### Changed vs mainline baseline

- `preview/apps/web/app.js`
- `preview/apps/web/index.html`
- `preview/apps/web/core/storage.js`
- `preview/apps/web/shell/render-coordinator.js`
- `preview/qa/tests/web-building-blocks.test.js`

### Documentation

- `preview/README.md`

## Review result

- QA: pass (non-blocking **QA-001** — hard-kill inside coalesce window before pagehide)
- UI: pass
- Pharmacist: skipped (first build)
- Arbiter: `candidate_ready`

## Gate B

- Victor **採用** 2026-08-24 — PERF-02 + PERF-04 merged into mainline (`storage.js`, `render-coordinator.js`, `app.js`, QA). Preview removed.

## Not in this candidate

- PERF-01 CSS layer cleanup
- PERF-03 timeline rebuild reduction
