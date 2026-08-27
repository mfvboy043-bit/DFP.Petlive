# UI review

**Proposal:** `20260827-owner-profile-controller`  
**Candidate:** branch `proposal/owner-profile-controller` @ `6b97b34`  
**Scope:** Light review — owner-settings form chrome, emergency owner card, account menu; `copyRows` → `t()` label parity.

**Verdict:** pass

## Method

Compared `6b97b34^..6b97b34` for owner-profile surfaces only. Checked `apps/web/c/index.html` markup, `apps/web/c/app.js` DOM facades, and new `apps/web/domains/owner/{selectors,controller}.js` against proposal non-goals (no UX redesign).

## Surfaces checked

| Surface | HTML / CSS | DOM render / chrome | Result |
|---|---|---|---|
| Owner settings (`owner-settings` screen, `#owner-settings-form`) | Unchanged markup, labels, hints, CTA | `fillOwnerSettingsForm`, `readOwnerSettingsForm`, submit listener — **byte-identical** | Unchanged |
| Emergency owner card (`#e-owner`, `.e-owner-*`) | Unchanged | `renderEmergencyOwner` — **byte-identical** | Unchanged |
| Account menu (chip, popover, `#owner-settings-btn` fallback) | Unchanged | `paintAccountMenu`, `paintCloudChrome` wiring — **byte-identical** | Unchanged |
| Emergency copy clipboard | N/A (text only) | `buildEmergencyCopyText` — **byte-identical**; `formatOwnerCopyLines` refactored only | Labels preserved (see below) |

`index.html` diff for this proposal is script tags only (`domains/owner/*`). No owner/account/emergency markup or class changes. No `styles.css` changes in commit.

## copyRows → t() mapping

`ownerSelectors.copyRows()` emits four kinds in fixed order; `formatOwnerCopyLines` maps each to the same i18n keys and interpolation shape as before:

| Row kind | t() key | Params | Order |
|---|---|---|---|
| `ownerLine` | `copyOwnerLine` | `{ text: name · phone }` | 1 |
| `email` | `copyOwnerEmail` | `{ email }` | 2 |
| `emergency` | `copyOwnerEmergency` | `{ text: emergencyName · emergencyPhone }` | 3 |
| `address` | `copyOwnerAddress` | `{ address }` | 4 |

Row inclusion rules match pre-extract logic (`name \|\| phone`, `email`, `emergencyName \|\| emergencyPhone`, `address`). Demo showcase strings (王陽明 / 王守仁 / demo email / address) unchanged in `selectors.js`.

## Findings

- [UI-001] [P3] scope — Same commit bundles unrelated timeline/imaging/labs wiring (e.g. lazy drug-notes hydrate) outside this proposal’s owner scope; not reviewed here and does not affect owner-settings / emergency owner / account menu chrome.

## Summary

Architecture extraction only: owner-facing chrome, hierarchy, and copy labels are preserved. No new cards, hero, typography, or layout deltas in scope. Safe to adopt from a UI perspective.
