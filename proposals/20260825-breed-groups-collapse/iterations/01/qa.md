# QA review
Verdict: conditional

Reviewed commit `999760b` breed-related changes on formal B (`apps/web/breeds-database.js`, `app.js`, `index.html`, `styles.css`, `i18n.js`). Group membership covers every dog/cat `value` with no extras/dupes. Species other hides toggle; create/edit/species-change reset expand; custom field still clears only when leaving `__custom__`; language change re-runs `syncBreedFields`; non-common `breedKey` on edit is pinned via rebuild. One collapsed-preview defect remains.

## Findings

### Collapsed preview keeps stale non-common chip after reselection
- ID: QA-001
- Severity: medium
- Steps:
  1. Open 新增寵物, species 犬; confirm breed chips are collapsed (常見／台灣 + 自訂).
  2. Tap「展開全部品種」, select「拉布拉多」(`labrador`), then tap「收合品種».
  3. Confirm collapsed row shows common chips + selected 拉布拉多 + 自訂.
  4. While still collapsed, tap「米克斯」(`mixed`) (or any other visible common / 自訂 chip).
  5. Optionally repeat from edit: open a dog whose `breedKey` is `golden` / `labrador`, then while collapsed pick `shiba` or `__custom__`.
- Expected: Collapsed preview is only common-group ∪ current selected ∪ `__custom__` (deduped). After selecting `mixed`, `labrador` disappears from the preview.
- Actual: `setSelectedBreed` paints selection on existing chips but does not rebuild the collapsed list when the newly selected value is already in the DOM. The previous non-common chip (e.g. 拉布拉多) remains visible and unselected until the user expands/collapses (or another path calls `syncBreedFields`). Saved `breedKey` is still the new selection if submitted — preview rule is wrong, not storage corruption.

## Checks with no material defect
- Expand / collapse toggle: `type="button"`, `aria-expanded` updates, hidden for species `other`.
- Edit pet with non-common `breedKey`: `setSelectedBreed` rebuilds collapsed DOM so selected chip is visible and marked selected.
- Dog ↔ cat ↔ other: selection cleared, expand reset, custom text cleared on species change; chip list / toggle match species.
- Custom breed: `__custom__` always in collapsed and expanded; custom input show/required/clear behavior unchanged across expand toggle.
- Empty breed submit still blocked by `toastNeedBreed`.
- zh / en / ja / ko keys present for toggle + group labels; `onLanguageChange` → `syncBreedFields()` refreshes chip and group copy.
