# UI review
Verdict: conditional

Light compatibility pass for TV-01…TV-04 on surface **C** (no intentional redesign). Compared timeline HTML builders + entry wiring vs HEAD; domains checked for chrome leakage. Parasite calendar / emergency / nav WIP in the same worktree ignored except where it touches timeline chrome.

## Findings

- [UI-001] [P2] timeline screen-head (C) — Co-mingled `styles.css` WIP adds mobile rules `.screen > .screen-head:has(> .btn-small)` that force the head CTA to a full-width second row. Timeline’s header still has `btn-small`「新增」, so adopt-as-is would change timeline chrome composition even though TV scope claims zero visual redesign. — Exclude that screen-head block from this adopt, or narrow the selector away from `data-screen="timeline"` before Gate B.

## Notes (non-findings)

- `renderVisitWeightVsPrevious` / `renderVisitWeightParts` / `renderVisitProofThumbs` / `renderVisitImagingThumbs` / `renderVisitRxBlock` class strings and structure (`tl-weight-delta-mark` ↑↓=, proof thumbs, imaging panel, Rx expand) unchanged; HTML builders remain in `c/app.js`.
- `renderTimeline` only swaps data source to `buildTimelineEntries`; list markup (`tl-item` / head / body / `med-list`) matches prior composition. `entry.hasRx` ≡ prior `medications.length` gate.
- Domains `visits` / `timeline` expose data only (no `t()`, markup, or chrome strings). Views still localize via `t()`.
- Timeline i18n keys untouched. C-only; Pages/B parity not required this slice.
- Parasite calendar chooser / dose-label WIP does not alter timeline list chrome.
- Home still exposes `data-go="timeline"`; app-nav panel pruning is out-of-slice WIP and does not break the timeline screen itself.
