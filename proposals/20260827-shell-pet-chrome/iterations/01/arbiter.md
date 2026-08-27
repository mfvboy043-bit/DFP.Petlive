# Arbiter — 20260827-shell-pet-chrome

**Decision:** revision_required  
**Iteration reviewed:** 1

## Mapping

| ID | Source | Severity | Bucket |
|---|---|---|---|
| QA-001 | qa | high | blocking |

Pharmacist skipped. UI skipped. QA reject stands on shared-module boot break for formal B.

## Decision rationale

C extraction is otherwise behavior-preserving, but `domains/pets/render.js` is loaded by B today. Requiring `speciesLabelOf` / `breedLabelOf` / `ageLabelOf` at `createRenderer` violates C-first (SH-06-04 B cover is after adopt). That is a high boot defect, not a taste note.

`iteration` 1 < `max_iterations` 3 → revision_required.

## builder_scope

- QA-001

## rerun

- qa
