# Contrast: mainline vs Owner profile candidate

## Candidate

- Branch: `proposal/storage-indexeddb` (`4db5796` — shared with storage slice; owner-only commits also on `proposal/owner-profile-controller` history)
- Path: `proposals/20260827-owner-profile-controller`
- Surface: **C only**
- Status: `candidate_ready` (iteration 2)

## Mainline vs candidate

| Area | Mainline | Candidate |
|---|---|---|
| Owner brain | Inline in `c/app.js` | `domains/owner` selectors + controller |
| Storage slot | Shell `ownerProfileSlot` | Same slot injected to owner + cloud |
| Settings / account UI | Shell facades | Unchanged |
| Formal B | Inline helpers | Untouched until cover |

## Files to adopt

### Add
- `apps/web/domains/owner/selectors.js`
- `apps/web/domains/owner/controller.js`
- `qa/tests/web-owner.test.js`

### Change
- `apps/web/c/app.js` — owner facades
- `apps/web/c/index.html` — owner script tags

### Exclude
- Formal B / Pages until Victor confirms cover
- Account popover / Google auth redesign
