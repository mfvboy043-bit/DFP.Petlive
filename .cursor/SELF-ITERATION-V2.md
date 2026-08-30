# Petlive Self-Iteration v2

Human sets direction (Gate A) and adoption (Gate B). Between gates, agents may build, review in parallel, and revise up to 3 times.

## Rule hierarchy (always on)

```text
Tier 1 — 最高憲法     security-constitution.mdc + security.md
Tier 2 — 架構憲法     web-building-blocks.mdc (積木規則 — every new write)
Tier 3 — Process      self-iteration-gates, config-secrets-privacy, c-to-b-cover, auto-publish-pages
```

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
    ├── security-constitution.mdc   # Tier 1
    ├── web-building-blocks.mdc     # Tier 2
    ├── self-iteration-gates.mdc    # Tier 3
    └── config-secrets-privacy.mdc
security.md                           # repo root — Tier 1 full threat model
```

## Not in this cut

- Hooks (block mainline / merge) — later
- Git worktrees — later (repo may have no git; folder `preview/` still valid)
- `/best-of-n` multi-builder — later

## How to run

Ask the parent agent to use `petlive-orchestrator`. It should read `state.yaml`, delegate to `.cursor/agents/*`, and stop at Gate A / Gate B / halt.
