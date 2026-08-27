# QA review
Verdict: pass

Candidate: `cursor/small-brains-6f84` @ ~08401d3 / extract `60f4cdd`  
Scope checked: A calendar copy, B med labels, C breed face, D emergency wire, C boot/`?v=`, `node --check`, related tests.

## Findings

_(none in Wave 1 scope)_

## Checks (Wave 1)

| Area | Result |
|---|---|
| A parasite/vaccine title+details | Params/`、` join / empty product→kindTitle vs `—` match pre-move facade; facade no longer calls `t("parasiteCalTitle"\|"vaccineCalTitle")` |
| B frequency expand | Same `/ · SID\|BID\|TID\|EOD(?= · \|$)/` + `/ · (\d+) 天(?= · \|$)/`; badge keys (`compoundLiquidA`) vs label keys (`compoundLiquidAName`) not swapped |
| C breed leaveTyped | `resolveSearchFaceValue`: known→`setValue`+display; `""` / custom sentinel→`leaveTyped`; facade only sets `#breed-search` when `setValue` |
| D emergency | `buildCopyCardText` already owns `\n{3,}`→`\n\n` trim; C `buildEmergencyCopyText` wires only (no inline assemble) |
| Formal B | `apps/web/app.js` diff vs pre-build: 0 bytes |
| Domain purity | New labels + breed face helpers: no `document` / `localStorage` / hard-coded `t` |
| C boot | `index.html` loads `medications/parasite/vaccines/labels.js` + updated `breed/selectors.js` before `c/app.js?v=20260827-small-brains` |
| `node --check` | `c/app.js` + four new/updated domain files OK |

### Related tests

```
node --test qa/tests/web-medications.test.js \
  qa/tests/web-parasite.test.js \
  qa/tests/web-vaccines.test.js \
  qa/tests/web-breed-controller.test.js \
  qa/tests/web-emergency-render.test.js \
  qa/tests/web-calendar.test.js
```

- Wave 1 coverage (labels / leaveTyped / D wire / calendar helpers): **pass**
- Suite: 58 pass / 2 fail — failures below are **pre-existing**, not introduced by this extract (`vaccines/selectors.js` + `controller.js` unchanged in `60f4cdd`)

## Pre-existing (out of Wave 1 scope)

### QA-1 — getNextVaccine equal-urgency order assert
- Severity: low (pre-existing; selectors/controller untouched by Wave 1)
- Steps: 1. Run `qa/tests/web-vaccines.test.js` → `getNextVaccine orders by urgency then displayRank…`
- Expected: `next.key === "vRabies"` when rabies is more urgent
- Actual: `next.key === "v8in1"` (`'v8in1' !== 'vRabies'`)

### QA-2 — upsertPetVaccines newest-first assert
- Severity: low (pre-existing; selectors/controller untouched by Wave 1)
- Steps: 1. Run `qa/tests/web-vaccines.test.js` → `upsertPetVaccines replaces same key/name, preserves unrelated, newest first`
- Expected: `pet.vaccines[0].key === "vRabies"` after upsert
- Actual: `pet.vaccines[0].key === "v5in1"` (`'v5in1' !== 'vRabies'`)
