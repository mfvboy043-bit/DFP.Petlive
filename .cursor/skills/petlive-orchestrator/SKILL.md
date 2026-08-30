---
name: petlive-orchestrator
description: >-
  Petlive Self-Iteration v2 orchestrator. Use when Victor asks to run a self-iteration
  loop, 自我迭代, proposal→build→review→adopt, or to coordinate Planner, Builder,
  Reviewers, Arbiter, and Version Steward without skipping Gate A or Gate B.
---

# Petlive orchestrator (v2)

Parent agent only. Delegate; do not impersonate all roles in one pass.

Read `proposals/<id>/state.yaml` as source of truth (not chat memory).
Stop at every human gate. Reviewers never see each other’s reports before they write.

**Tier 1 — Security:** Comply with `security.md` + `security-constitution` on every product loop. Auth/sync/storage/Drive/billing scope → Planner cites invariants; before Gate B run **security diff scan** on candidate paths.

**Tier 2 — Building blocks:** Every new `apps/web` write follows **web-building-blocks** — Planner names layer + path; Builder implements block first, facade last. Reject candidates that dump new brain only into `app.js` / `c/app.js` / surface `styles.css`.

## Sequence

1. **Planner** subagent `petlive-planner` → `proposal.md` + `state.yaml` (`status: proposed`)
2. **GATE A** — Ask Victor 確認 / 修改 / 否決. Do not build until `gate_a.status: approved`
3. **Version Steward** skill `petlive-version-steward` → parallel path; record `candidate.*`
4. Set `status: building`, run **Builder** subagent `petlive-builder`
5. Increment `iteration` (first build → 1). Set `status: reviewing`
6. **Route** via `petlive-review-protocol`. Launch assigned reviewers **in parallel** (separate Task calls, one message):
   - `petlive-pharmacist-reviewer`
   - `petlive-qa-reviewer`
   - `petlive-ui-reviewer`
   - `petlive-legal-advisor` (when privacy, terms, disclaimer, auth, or sync copy/flows change)
   Each writes only its `reviews/*.md`. Do not pass other reviews into their prompts.
7. After all assigned reports exist → **Arbiter** subagent `petlive-review-arbiter`
8. Branch on Arbiter `decision`:
   - `revision_required` AND `iteration` < `max_iterations` → snapshot `reviews/` into `iterations/<NN>/` → `status: revising` → Builder **only** `builder_scope` → re-run listed `rerun` reviewers in parallel → Arbiter again
   - `candidate_ready` → `status: candidate_ready` → **GATE B**
   - `halted` → `status: halted` → stop; ask Victor A 改提案 / B 帶限制進 Gate B / C 放棄
9. **GATE B** — Ask 採用 / 否決. Do not merge until `gate_b.status: adopted`
10. On adopt: Version Steward merges; `status: adopted`

## Routing

Do not always run all four reviewers. See `petlive-review-protocol`.

## Hard stops

- No mainline edits before Gate A
- No merge before Gate B
- Reviewers/Arbiter must not edit `apps/web/`, `contracts/`, `packages/`
- Builder revision must not expand past `builder_scope`
- `max_iterations` default 3; never start iteration 4
- Do not nest reviewers under Builder; all subagents report to this orchestrator

## v1 fallback

If a named subagent is unavailable, follow the matching `.cursor/skills/petlive-*` skill in a separate Task, still as an independent pass (no shared review conclusions).
