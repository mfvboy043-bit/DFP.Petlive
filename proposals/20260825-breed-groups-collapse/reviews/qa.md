# QA review
Verdict: pass

Re-reviewed fix commit `06f26a4` on `proposal/breed-groups-collapse` for **QA-001 only**. `setSelectedBreed` now rebuilds the collapsed chip DOM on every selection change via `renderCollapsedBreedChips(species, value)` (not only when the new value is missing from the DOM). Preview membership remains common-group ∪ current selected ∪ `__custom__` (deduped). No new material defects found in collapse / select / species / custom paths.

## Findings

### Collapsed preview keeps stale non-common chip after reselection
- ID: QA-001
- Status: resolved
- Severity: medium (was)
- Steps:
  1. Open 新增寵物, species 犬; confirm breed chips are collapsed (常見／台灣 + 自訂).
  2. Tap「展開全部品種」, select「拉布拉多」(`labrador`), then tap「收合品種».
  3. Confirm collapsed row shows common chips + selected 拉布拉多 + 自訂.
  4. While still collapsed, tap「米克斯」(`mixed`) (or any other visible common / 自訂 chip).
  5. Optionally repeat from edit: open a dog whose `breedKey` is `golden` / `labrador`, then while collapsed pick `shiba` or `__custom__`.
- Expected: Collapsed preview is only common-group ∪ current selected ∪ `__custom__` (deduped). After selecting `mixed`, `labrador` disappears from the preview.
- Actual (after `06f26a4`): Selecting another chip while collapsed rebuilds the preview; the previously pinned non-common chip is removed. Edit path with a pinned non-common `breedKey` still rebuilds so the current selection stays visible and marked selected. Chip clicks remain delegated on `#breed-chips`, so innerHTML rebuild does not break selection.

## Checks with no material defect (regression spot-check)
- Expand / collapse toggle: selection kept via `syncBreedFields({ keepSelection: true })`; expanded path does not run the collapsed rebuild branch.
- Dog ↔ cat ↔ other: species change still clears custom text and calls `syncBreedFields({ keepSelection: false, resetExpanded: true })`; other hides chips/toggle.
- Custom breed: `__custom__` remains in collapsed preview; leaving `__custom__` still clears custom text via `toggleBreedCustomField`.
- Create / edit form entry still resets expand and syncs chips before applying `breedKey`.
