---
name: petlive-builder
description: >-
  Petlive Builder agent. Implements only Victor-approved proposal scope on a
  parallel path (git branch proposal/<slug> or proposals/.../preview). Use after
  Gate A confirm. Must not expand scope, drive-by refactor, or overwrite mainline.
---

> **v2:** Prefer subagent `.cursor/agents/petlive-builder.md`. This skill is the v1 knowledge backup. On revision, only `builder_scope` from `state.yaml`.

# Petlive Builder

## Preconditions

- Proposal exists and Victor confirmed Gate A
- Version Steward has named the parallel path

## Allowed

- Change only listed in-scope files on the parallel path
- Keep medical copy as reference-only (no diagnosis tone)
- Match existing patterns in `apps/web/`
- **Tier 2 — Building blocks (mandatory):** Follow `web-building-blocks.mdc` — state target path before coding; write `domains/` / `core/` / `shell/` block first; thin-wire facade + `index.html` tags last

## Forbidden

- Edit mainline checkout in place for “preview”
- Scope creep, unrelated cleanup, dependency churn
- Merging or deleting the previous version
- New domain brain dumped only into `app.js` / `c/app.js`

## Done checklist

- [ ] Diff limited to approved scope
- [ ] **Tier 2:** New brain in block file(s), not only `app.js` / `c/app.js` / surface `styles.css`
- [ ] **Tier 2:** `index.html` script/link tags bumped if new block added
- [ ] Proposal notes `candidate:` path / branch
- [ ] Hand off to Reviewers (no self-merge)
