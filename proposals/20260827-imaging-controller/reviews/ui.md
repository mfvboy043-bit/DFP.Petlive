# UI review
Verdict: conditional

Light compatibility pass on C only (`20260827-imaging-controller` / IM-01…IM-04). Architecture-only extraction — no intentional imaging-screen, timeline panel, or emergency-card redesign. Spot-checked `formatImagingTypes` i18n split, render facades, and domain chrome boundary.

## Scope checked (C candidate)

- `formatImagingTypes` — shell facade maps `imagingController.imagingTypeKeys(visit)` → `t("imagingXrayCaption")` / `t("imagingUsCaption")` with `／` join. Key order preserved (`xray` then `us`), equivalent to pre-extraction inline `getVisitImaging` checks. No raw slot keys leaked to DOM.
- Render facades — `renderVisitImagingThumbs`, `renderEmergencyImagingNav`, `renderImagingList` remain in `c/app.js`; class/markup unchanged (`tl-visit-rx-fig`, `imaging-list-empty`, `imaging-item-types`, `e-xray-sub`). Shell `t()` for captions, empty states, CTA, lightbox aria (`proofLightboxOpen`, `proofPhotoClear`, `imagingEmpty`, `eXraySubEmpty` / `eXraySubLatest`, timeline imaging upload/update keys).
- Domain purity — `domains/imaging/controller.js`: data/normalization only (`imagingTypeKeys` returns `"xray"` / `"us"` keys). No `t()`, `document`, or HTML.
- Timeline wiring — `timelineSelectors` receives injected `imaging: imagingController` for `hasImaging`; timeline visit imaging panel HTML still built in shell via `renderVisitImagingThumbs` + `t()`.

## Findings

- [UI-001] [P1] C bootstrap (`index.html`) — imaging controller script not loaded before `app.js`, yet `c/app.js` calls `PetLiveWeb.domains.imaging.createController()` during bootstrap (and imaging facades run earlier at call time). Imaging screens, emergency X-ray subtitle, and timeline imaging thumbs cannot render until script tag added (LB-03 / IM wiring).
- [UI-002] [P3] candidate hygiene — co-mingled `index.html` storage-idb boot / `data-petlive-app` deltas outside IM builder_scope. Not an imaging chrome or i18n regression.

## Notes (non-findings)

- `formatImagingTypes` refactor (`imagingTypeKeys` + shell `t()`) does **not** regress i18n vs prior inline version; `data-proof-caption` on thumbs still passes i18n key strings for lightbox resolution (unchanged).
- `IMAGING_PHOTOS_MAX` / cap behavior moved to domain; thumb grid and remove-button tap targets unchanged in shell markup.
- Formal B / Pages untouched this slice.
