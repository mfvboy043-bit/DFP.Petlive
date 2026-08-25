# UI review
Verdict: conditional

Candidate `827eab9` on `proposal/breed-typeahead` (Option A). Compared breed search / `#breed-results` to `#drug-search` + `#drug-results`, and coexistence with chips + collapse. Form surface (not branded hero) — hierarchy judged within add-pet compose.

## Findings

- [UI-001] [P2] search vs chips — Always-visible `#breed-search` under the chip field creates two competing primaries: chip legend + `breedSelectPlaceholder` (“請選擇品種”) and a separate “搜尋品種” label plus a long `breedSearchHint`. Mobile gets stacked instructions before gender. Soften or demote one path (e.g. nest search as secondary inside the chip field, drop/shorten the chip placeholder once search is always on, or make the hint appear only while typing / on custom).

- [UI-002] [P2] known-breed face — After chip or suggestion pick, the search input shows the breed label but stays fully editable. Any keystroke flips to `__custom__` with no selected-drug–style confirmation under the field. Easy to accidentally demote a known breed, especially when the selected chip is above the fold and out of view after scrolling to the input. Prefer a clearer committed state (read-only face until edit, light “已選” line, or require clearing before free-text).

- [UI-003] [P2] results + mobile — `#breed-results` correctly reuses `max-height: min(52vh, 320px)` + scroll (parity with drug). Placement is worse than drug: it sits after chips (and expand), so open suggestions + soft keyboard can bury the list under the keyboard or force long mid-form scrolling with no `scrollIntoView` on open. Cap height tighter on small viewports and/or scroll the active result panel into view when shown.

- [UI-004] [P3] permanent hint weight — JA/KO `breedSearchHint` strings run long and always occupy space under the field even when chips alone are enough. Prefer shorter chrome or show the hint only for empty/custom / when results are open.

- [UI-005] [P3] result density — Short queries can flood the scroll panel (no result cap). Acceptable with existing max-height; optional soft limit or “常見優先” ordering would keep the first screen of suggestions calmer.

## Notes (non-blocking)

- Empty query does not dump the full list; empty-match copy (`breedSearchEmpty`) explains the custom path — clearer than drug’s silent hide.
- Suggestion rows use existing leaf / paper result styling (shared `.drug-results` + `.breed-results`); tap targets ≥48px; no new purple-indigo / cream-serif AI look; motion limited to existing hover/active.
- Chip ↔ typeahead face sync and collapsed pin of non-common selections support coexistence with groups/collapse.
- Escape / blur dismiss and `autocomplete="off"` match expected mobile search behavior.

## Verdict rationale

No P1 brand or interaction blockers for Gate B on visuals alone. Conditional on clarifying dual-path hierarchy (UI-001/UI-002) and tightening mobile results placement (UI-003) before treat-as-done polish.
