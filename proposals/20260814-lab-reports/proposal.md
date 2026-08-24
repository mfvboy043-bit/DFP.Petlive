---
id: 20260814-lab-reports
title: Lab reports — photo archive from emergency card
status: adopted
author: planner
candidate_branch: ""
candidate_path: "proposals/20260814-lab-reports/preview"
created: 2026-08-14
updated: 2026-08-14
---

# Proposal: Lab reports — photo archive from emergency card

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Enable the emergency-card「血檢報告／檢驗報告」button as a per-pet **original-document archive**: owner photographs clinic lab printouts, tags date / type / optional clinic and visit, and a vet can open the list and enlarge photos. No typed CBC values, no reference ranges, no high/low flags.

## In scope

- New `labs` list screen (from the emergency docs button) and `lab-add` capture screen.
- Photo-first save: at least one compressed JPEG (same ~1280px path as Rx proof); multiple pages of the same report allowed (cap 6).
- Metadata: required date; optional multi-select types (血液／生化／尿液／糞便／快篩／其他); optional clinic (own search widgets, not the visit-form fields); optional visit link; optional owner note.
- Persist in a separate localStorage map `petlive-lab-reports` keyed by `petId`. Source `owner_proof` when photos exist.
- Emergency button: enable labs only; subtitle empty →「尚未存檔」, else「最近 {date} · {types}」. X-ray stays disabled / coming soon.
- Timeline: if a report is explicitly linked to a visit, show one line「此就診的檢驗報告」that opens the labs list. Do not add upload to the add-visit form.
- i18n chrome in zh-Hant / en / ja / ko; clinic proper names and owner notes stay as entered.
- Candidate off mainline (`proposals/20260814-lab-reports/preview`).
- Contracts: add `LabReport` type (pet-scoped, optional visit link). Emergency card module still does not own the table.

## Out of scope

- Typing lab numbers, units, reference intervals, H/L, trends, OCR, PDF.
- Diagnosis / 異常 / treatment-authority copy.
- X-ray / ultrasound upload.
- Seeding fake report photos on demo pets.
- Sharing the visit form’s clinic-search DOM (would clobber add-visit).
- Cloud object storage.

## Likely files

- `apps/web/index.html` — `labs` / `lab-add` screens; enable labs docs button; cache-bust.
- `apps/web/app.js` — storage, list/add, emergency subtitle, timeline link, lightbox reuse.
- `apps/web/i18n.js` — chrome keys × 4 locales.
- `apps/web/styles.css` — list, thumbs, type chips, enabled docs button.
- `contracts/pet-health-passport-contracts.md` — `LabReport` + `getLabReportsByPetId`.

## Risks

- **Medical tone:** list/disclaimer must say 對照原件、不判讀數值. Type chips are categories, not results (快篩 ≠ 陽性).
- **Wrong pet:** writes must key by current `petId`; switching pets must only show that pet’s reports.
- **Storage size:** camera originals must be compressed; cap page count; failed `setItem` must toast, not silent drop.
- **Clinic search collision:** lab add must use its own inputs/`selectedLabClinic`, not `#clinic-search`.
- **Visit identity:** prototype visits often lack `id`; link via `visitDate` + `visitClinicId` / clinic name, only when the owner picks a visit.
- **Photo-less shells:** do not save without a photo; emergency list stays originals-only.

## Acceptance criteria

- [ ] Labs button on the emergency card is enabled; X-ray remains disabled with coming-soon copy.
- [ ] Empty pet: button subtitle「尚未存檔」; list shows one empty line + 拍照存檔.
- [ ] Saving requires ≥1 photo; compresses; list shows newest-first date · clinic · types · thumbs; tap thumb opens existing proof lightbox.
- [ ] Optional type/clinic/visit/note persist; language switch recomputes chrome (not clinic names / notes).
- [ ] Linked visit shows timeline line to labs; unlinked reports do not.
- [ ] Pet switch isolates reports; storage key is not `petlive-pet-photos` / Rx slots.
- [ ] Disclaimer visible on the list screen.
- [ ] Candidate stays off mainline until Gate B adopt.

## Notes for Victor

確認後回覆「確認」開始平行製作，「修改：…」調整範圍，或「否決」。

Adopted 2026-08-14 into mainline (`apps/web` + contracts). Preview path kept for history.
