# Contrast: mainline vs candidate

## Candidate

- Path: `proposals/20260813-timeline-weight-delta/preview`
- Branch: none (no git in workspace)

## Mainline behaviors

1. Timeline shows visit weight or「體重待補」only.
2. No days-since previous visit.
3. No weight gain/loss/same comparison.
4. Demo weights sparse for multi-visit delta demos.

## Candidate behaviors

1. Same weight / pending line as today.
2. When a previous visit exists:「距上次 N 天」(and locale equivalents).
3. When both `weightAtVisit` known: green ↑ +kg / red ↓ −kg / neutral「相同」; missing weight → quiet omit delta.
4. Previous = chrono prior record (same-day allowed); first visit has no vs block.
5. Demo tweaks so 小白/小黑 show gain / same / days-only paths.

## Files touched

- `preview/apps/web/app.js`
- `preview/apps/web/i18n.js`
- `preview/apps/web/styles.css`
- `preview/apps/web/index.html` (`?v=20260813-weight-delta`)

## Reviewer verdicts

- Pharmacist: skipped
- QA: pass (non-blocking QA-001 out-of-scope chip bundle)
- UI: conditional (UI-001–003 polish; not blocking)
- Arbiter: `candidate_ready`

## Merge checklist (after 採用 only)

- [x] Victor said 採用
- [x] Copy preview weight-delta changes into mainline `apps/web/` (app.js / i18n.js / styles.css / index.html)
- [x] Skipped out-of-scope compound-chip preview drift (QA-001)
- [x] Cache `?v=20260813-weight-delta`
- [x] Set proposal + state `status: adopted`
- [x] Kept `btn-primary` on「儲存體重」
