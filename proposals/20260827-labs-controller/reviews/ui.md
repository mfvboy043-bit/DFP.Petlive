# UI review
Verdict: conditional

Light compatibility pass on C only (`20260827-labs-controller` / LB-01…LB-04). Architecture-only extraction — no intentional labs-screen or emergency-card redesign. Spot-checked render facades, domain chrome boundary, and i18n key vs label split.

## Scope checked (C candidate)

- Render facades — `renderLabList`, `renderEmergencyLabNav`, `renderVisitLabsLine` remain in `c/app.js`; markup/classes unchanged (`lab-list-empty`, `lab-item*`, `e-lab-sub`, `tl-visit-labs-btn`). All user-facing strings still go through shell `t()` (`labEmpty`, `labNoClinic`, `labRemove`, `eLabSubEmpty` / `eLabSubLatest`, `timelineVisitLabs`).
- i18n boundary — `labTypeLabel` / `formatLabTypes` stay in shell and call `t(LAB_TYPE_I18N[type] …)`; `domains/labs/selectors.js` exports i18n **keys** only (`labTypeBlood`, …), not localized labels. No `t()` / `data-i18n` / DOM in domain files.
- Domain purity — `domains/labs/{selectors,controller}.js`: no `document`, `innerHTML`, `localStorage`, or chrome strings.
- Hierarchy — labs list, emergency docs row subtitle, and timeline “此就診的檢驗報告” line composition unchanged; no new cards or hero chrome.

## Findings

- [UI-001] [P1] C bootstrap (`index.html`) — LB-03 requires loading `../domains/labs/selectors.js` and `../domains/labs/controller.js` before `app.js`. Neither script tag is present; `c/app.js` already calls `PetLiveWeb.domains.labs.createSelectors` at bootstrap. Labs (and dependent emergency/timeline chrome) cannot paint until wired.
- [UI-002] [P3] facade completeness — `getLabReportsForPet`, `writeLabReportsForPet`, and `reportMatchesVisit` are still inlined in `c/app.js` instead of thin-delegating to `labsController` / `labsSelectors`. Behavior matches today if logic stays in sync; not a visible redesign risk, but duplicates domain APIs the proposal targets for facades.
- [UI-003] [P3] candidate hygiene — same C worktree also carries unrelated `index.html` storage-idb boot / `data-petlive-app` deltas outside LB builder_scope. Not a labs chrome regression; isolate before cover if Victor wants a pure LB diff.

## Notes (non-findings)

- Type chip order on save still uses `LAB_TYPE_ORDER.filter(...)` from selectors re-export; list display order in `formatLabTypes` unchanged vs B (array order, not re-sorted by `LAB_TYPE_ORDER`).
- Cloud slot injection unchanged; no new labs disclaimer or diagnostic-tone copy in domain layer.
