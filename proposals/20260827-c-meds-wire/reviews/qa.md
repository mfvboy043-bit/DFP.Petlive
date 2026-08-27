# QA — 20260827-c-meds-wire

## Scope

C wires `medicationsController` / `medicationsSelectors` to match B. No B edits.

## Checks

| Check | Result |
|-------|--------|
| `node --check apps/web/c/app.js` | Pass |
| `qa/tests/web-medications.test.js` | Pass (MD-01/02) |
| `qa/tests/web-medications-render.test.js` | Pass |
| `qa/tests/web-drugs.test.js` | Pass |
| Inline `COMPOUND_DEFAULT_COLORS` / `buildVisitMedicationsFromPending` brain on C | Gone |
| Weight-on-save uses `applyVisitWeightOnMedSave` | Pass (matches B / QA-001 path) |
| C `afterSelect` still clears pending med session | Pass (existing QA-002 assertion) |

## Verdict

**pass** — candidate_ready for Gate B.
