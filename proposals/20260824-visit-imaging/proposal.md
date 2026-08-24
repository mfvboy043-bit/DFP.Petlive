---
id: 20260824-visit-imaging
title: Visit imaging — X-Ray / ultrasound on timeline (med-proof pattern)
status: adopted
author: planner
candidate_branch: ""
candidate_path: "proposals/20260824-visit-imaging/preview"
created: 2026-08-24
updated: 2026-08-24
---

# Proposal: Visit imaging — X-Ray / ultrasound on timeline

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Enable emergency-card「X-Ray&超音波 影像」as a **per-visit static photo archive**, modeled on existing Rx proof (`med-proof` + timeline collapsible `tl-visit-rx`). Owners upload X-Ray / ultrasound stills from the timeline; thumbs expand + lightbox zoom. Video stays a disabled placeholder for future Google Drive.

## In scope

- Timeline: per-visit **影像** collapse/expand block (parallel to visit-rx), empty upload CTA, thumbs with figcaption (X-Ray / 超音波), clear slot, reuse `proof-lightbox`.
- Upload screen `imaging-proof` (clone med-proof UX): clinic + date kicker; X-Ray + ultrasound image inputs (`accept="image/*"`, camera or file); compress ~1280px JPEG; save onto `visit.imaging`; return to timeline with panel open.
- Data on visit: `visit.imaging = { xrayPhotos: [], usPhotos: [] }` (cap ~3–4 per slot). No separate localStorage map required.
- Emergency docs button: enable; subtitle empty →「尚未存檔」, else「最近 {date} · {types}」.
- Light **imaging** summary list: visits that have imaging; tap → timeline + auto-expand that visit’s imaging panel. Empty: hint + go timeline.
- Video: disabled control +「即將開放」copy only.
- i18n zh-Hant / en / ja / ko chrome; candidate off mainline under `proposals/20260824-visit-imaging/preview`.

## Out of scope

- Video upload, Google Drive / Photos OAuth.
- DICOM, diagnosis, OCR, typed findings.
- Merging with lab-reports storage.
- Seeding fake imaging on demo pets.
- Changing med-proof / lab flows beyond shared lightbox reuse.

## Likely files

- `apps/web/index.html` — enable xray docs btn; `imaging` + `imaging-proof` screens; cache-bust.
- `apps/web/app.js` — render/toggle/save imaging on visit; summary list; emergency subtitle; pending expand from summary.
- `apps/web/i18n.js` — chrome × 4.
- `apps/web/styles.css` — reuse visit-rx / med-proof; light `.tl-visit-imaging` / list if needed.

## Risks

- **Medical tone:** archive / 對照原件 only; no 判讀.
- **Wrong pet / visit:** write only `pets[current].visits[index]`; pet switch must isolate.
- **Storage size:** compress; cap counts; toast on quota fail.
- **Layout crowding:** imaging toggle beside rx without breaking clinic row on narrow screens.
- **Lightbox caption:** use imaging type keys, not Rx bag/rx/drug labels.

## Acceptance criteria

- [ ] Emergency X-Ray button enabled; subtitle empty vs recent date·types.
- [ ] Timeline visit shows 影像 toggle; expand empty → upload; after save → thumbs + lightbox zoom.
- [ ] X-Ray and ultrasound slots independent; clear works; video disabled coming-soon.
- [ ] Summary list lists only visits with photos; tap opens timeline with that imaging panel expanded.
- [ ] Disclaimer / reference-only tone; four locales for chrome.
- [ ] Candidate only under `proposals/20260824-visit-imaging/preview` until Gate B.

## Notes for Victor

Gate A approved in chat（確認）. Preview URL after build: `…/proposals/20260824-visit-imaging/preview/apps/web/`.

Iteration 1 (QA-002): imaging compress no longer pushes onto a stale pending bucket; Save disabled / blocked while compress in-flight.
