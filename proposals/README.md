# Petlive proposals

Gated self-iteration artifacts live here. **Mainline product code is not overwritten** until Victor adopts a candidate.

## Naming

```
proposals/
  _templates/
    proposal.md
    review.md
    contrast.md          # copy to compare.md when built
  YYYYMMDD-short-topic/
    proposal.md          # Planner
    compare.md           # Version Steward (after build)
    LOOP.md              # optional run log
    reviews/
      pharmacist.md
      qa.md
      ui.md
    preview/             # optional code candidate if no git branch
      apps/web/...       # delete this tree after Gate B adopt (keep README)
```

After **adopt**, remove `preview/apps/` copies so they do not drift from `apps/web/` mainline. Keep `proposal.md` / `reviews/` / `compare.md` for history.

Branch alternative (when git exists): `proposal/<short-topic>`.

## Status values

| Status | Meaning |
|--------|---------|
| `draft` | Awaiting Victor confirm (gate 1) |
| `approved` | Confirmed; Builder may start |
| `built` | Candidate exists; reviewers run |
| `adopted` | Merged to mainline after gate 2 |
| `rejected` | Not adopted; kept for history |
| `superseded` | Replaced by a newer proposal |

## Commands Victor can say

- 「確認」→ Gate 1: Builder may work on parallel path only
- 「採用這一版」／「合併」→ Gate 2: Version Steward may merge
- 「否決」／「退回」→ Revise proposal; mainline untouched

## Skills

Orchestration: `.cursor/skills/petlive-orchestrator/SKILL.md`  
Gate rule (always on): `.cursor/rules/self-iteration-gates.mdc`
