# Petlive Self-Iteration v2

Human sets direction (Gate A) and adoption (Gate B). Between gates, agents may build, review in parallel, and revise up to 3 times.

## Layout

```text
.cursor/
├── agents/                 # independent subagents
│   ├── petlive-planner.md
│   ├── petlive-builder.md
│   ├── petlive-pharmacist-reviewer.md
│   ├── petlive-qa-reviewer.md
│   ├── petlive-ui-reviewer.md
│   ├── petlive-legal-advisor.md
│   └── petlive-review-arbiter.md
├── skills/                 # parent + process
│   ├── petlive-orchestrator/
│   ├── petlive-version-steward/
│   ├── petlive-review-protocol/
│   ├── petlive-product-context/
│   ├── petlive-legal-advisor/
│   └── petlive-* (v1 backups)
└── rules/
    ├── self-iteration-gates.mdc
    ├── security-constitution.mdc   # always on — CIA, trust boundary, invariants
    └── config-secrets-privacy.mdc
security.md                           # repo root — full threat model + scan protocol
```

## Not in this cut

- Hooks (block mainline / merge) — later
- Git worktrees — later (repo may have no git; folder `preview/` still valid)
- `/best-of-n` multi-builder — later

## How to run

Ask the parent agent to use `petlive-orchestrator`. It should read `state.yaml`, delegate to `.cursor/agents/*`, and stop at Gate A / Gate B / halt.
