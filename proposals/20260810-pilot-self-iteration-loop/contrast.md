# Contrast: mainline vs candidate

## Mainline (current)

1. Empty pending list shows status-only `pendingMedsEmpty`.
2. No dedicated how-to line under the pending head.
3. `renderPendingMeds()` updates count text only.
4. `apps/web/**` unchanged by this pilot.

## Candidate

1. Adds muted `#pending-meds-hint` under the head when list is empty.
2. New i18n key `pendingMedsHint` (zh / en / ja / ko).
3. `syncPendingMedsHint()` hides hint when `pendingMeds.length > 0`.
4. Fragments live only under `proposals/20260810-pilot-self-iteration-loop/preview/`.

## Files touched (if adopted)

| File | Change |
|------|--------|
| `apps/web/index.html` | Insert hint node (see `preview/.../pending-meds-hint.html`) |
| `apps/web/styles.css` | Append `.pending-meds-hint` rules |
| `apps/web/i18n.js` | Add `pendingMedsHint` ×4 |
| `apps/web/app.js` | Call `syncPendingMedsHint` from `renderPendingMeds` |

## Merge checklist (after 採用 only)

- [ ] Victor said 採用
- [ ] Reviews attached
- [ ] Wire fragments into mainline
- [ ] Smoke: empty → hint; add drug → hide; language switch
- [ ] Set proposal `status: adopted`
- [ ] Keep this proposal folder (do not delete history)
