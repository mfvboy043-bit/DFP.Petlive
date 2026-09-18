---
id: 20260918-observation-self-entry-ux
title: Observation chart self-entry UX rethink (DIY metrics + fill-in first)
status: adopted
author: planner
candidate_branch: ""
candidate_path: "apps/web/tryouts/observation-chart/"
created: 2026-09-18
updated: 2026-09-18
# Gate B adopted 2026-09-18 — tryout baseline; ?v=20260918-self-entry
supersedes: 20260918-weight-chart-upgrade
---

# Proposal: Observation chart self-entry UX rethink

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Why a new proposal (not iteration 4)

Prior candidate `proposals/20260918-weight-chart-upgrade/` is at **iteration 3 / max_iterations 3**, `status: revising`. Per self-iteration gates it **cannot start iteration 4** without Victor changing or replacing the proposal.

Victor’s evening feedback (2026-09-18) is a **Gate-A-level scope change**: from “demo clinical chart look (Botox onset/decay reference)” toward **self-authored metrics + self-logged points**. That is not a residual Builder patch on the locked G2 / band-legend demo — it needs a fresh Gate A.

| | Prior (`weight-chart-upgrade`) | This proposal |
|--|--|--|
| Id | `20260918-weight-chart-upgrade` | `20260918-observation-self-entry-ux` |
| Gate A | Approved (`A1 B2 C1 D2 E1 F3 G2 H1 I1`) | **Pending** (new decisions below) |
| Status | revising @ iter 3/3 — **freeze**; leftover demo clutter (調劑／回診 labels, band legend) withdrawn as product direction | proposed |
| Reuse | Brains already in `apps/web/domains/observations/*`; tryout at `apps/web/tryouts/observation-chart/` | Continue those modules + thin tryout wire; do **not** restart from a monolith |
| Visual ref | Botox onset/decay chart (colored clinical phase bands + many callouts) | Keep **line + dots + one clear start marker** idea; **drop** pretending product bands = onset/optimal/decay |

**Frozen prior:** do not Builder-revise the maxed proposal as a silent expand. Optional later: mark prior `halted` / note `superseded_by` after this Gate A.

## Goal

Make the observation tryout feel like a **DIY notebook**: the user invents a metric name, logs numbers over time, and sees a simple chart — with at most one clear “開始追蹤” marker from a visit day. Templates stay optional starters, not the mental model.

Success for Victor: a 10-year-old can explain “I make my own score, I put dots on days, the line shows how it changed.”

## Recommended product direction (Planner default)

| Area | Direction |
|------|-----------|
| **Events** | One primary marker: **開始用藥／就診起追蹤**. Hide or remove demo seeds for 「調劑」「回診」 SVG labels. Visit jump may stay if one marker has a `visitId`. |
| **Legend** | Kid-readable only: 本期線、上期線（若比較開）、日記點、就診點（若仍畫方點）. Remove band legend items. |
| **Bands** | **Remove** fixed colored onset/optimal/decay-style bands from tryout (or off by default). Not product clinical phases. Optional user-defined bands = later proposal. |
| **Metrics** | Primary path = **新增我的指標** (free-text name). Templates optional, demoted (e.g. “從範本開始”). Empty custom metric shows empty chart + CTA. |
| **Fill-in** | Diary / **add-point** first-class: value + which day/bucket visible; empty state teaches “記第一筆”. Today wire only saves note text — chart points need a real value path. |

Reference awareness: Victor compared the tryout to his Botox onset chart. That reference is useful for **time after a start event** and **decay story**, but Petlive should not ship fake clinical phase bands or clutter event labels as if they were medical protocol.

## In scope

1. **Simplify event markers** in `demo-seed` + `events` / chart labels — default one primary kind; demote 調劑／回診.
2. **Shrink legend** in tryout HTML; hide previous-period item when compare is off (already partially wired).
3. **Remove or disable fixed background bands** in `chart.js` for tryout (flag or delete decorative bands).
4. **Self-metric UX first**: promote 「新增我的指標」; optional template list as secondary; empty custom series CTA.
5. **Fill-in chart data**: extend diary/add-point UI so user enters **score (0–10)** + **time index / day**; call existing `controller.addDiaryPoint({ value, index, … })` so dots appear on the SVG (not note-only feedback).
6. Copy / empty-state / demo story text rewritten for DIY framing (zh-Hant).
7. QA smoke updates for empty custom metric + add point + slim legend.
8. Stay on tryout surface + domain modules; bump tryout `?v=`.

## Out of scope

- Formal C screen nav productize, B cover, GitHub Pages publish of this chart as a formal feature.
- Replacing 寵物體重機.
- Real `pets[]` / IDB persistence (keep tryout memory + demo seed; H1-style unless Victor picks otherwise).
- User-defined colored phase bands (later).
- Full clinical template library / pharmacist dosing / Rx OCR.
- Restarting iteration 4 on `20260918-weight-chart-upgrade`.
- Growing algorithms in `app.js` / `c/app.js`.

## Phased plan (what first)

Victor asked which processes to change first. Recommended order:

### Phase 1 — Declutter (fast win, same session candidate)

1. Demo seed: drop 「調劑」「回診」 event labels; keep one **開始追蹤／就診起** marker (and visit jump if linked).
2. Legend: remove 基準觀察／治療追蹤／調整與回診; keep line/dot items only.
3. Chart: turn off fixed grey/green/rose bands.
4. Story banner + subtitle: DIY language, not “治療事件積木” clinical story.

### Phase 2 — Self-fill is obvious

5. Toolbar / side: **新增我的指標** as primary; templates optional (“範本”).
6. Empty state CTA: 「記第一筆觀察」 scrolls/focuses add-point form.
7. Add-point form: **數值** + **時間點** (+ optional note / visit link); wire to `addDiaryPoint` with `value` + `index` so the chart updates.

### Phase 3 — Polish (if Phase 1–2 accepted)

8. Optional: start tryout on empty custom path or “clear demo / 自己填” toggle.
9. Soften template metric prominence in `#metricSelect` (group or secondary).
10. Light QA tests for addCustom + applyDiaryPoint path.

**Builder should not jump to Phase 3 before Phase 1–2 feel right on phone.**

## Tier 2 — layers & files

Already extracted; continue blocks (no monolith return).

| Layer | Path | Change |
|-------|------|--------|
| Domain | `apps/web/domains/observations/demo-seed.js` | Fewer events; optional leaner demo story |
| Domain | `apps/web/domains/observations/events.js` | Primary kind label helpers if needed |
| Domain | `apps/web/domains/observations/chart.js` | Bands off / optional; label density |
| Domain | `apps/web/domains/observations/metrics.js` | OK as-is; ensure empty custom UX |
| Domain | `apps/web/domains/observations/diary.js` | Keep applyDiaryPoint; maybe helpers for index pick |
| Domain | `apps/web/domains/observations/controller.js` | Wire defaults (bands flag, primary event) if needed |
| Tryout facade | `apps/web/tryouts/observation-chart/index.html` | Legend, empty CTA, add-point fields, copy |
| Tryout facade | `apps/web/tryouts/observation-chart/tryout-wire.js` | Pass value+index; promote custom metric flow |
| QA | `qa/tests/web-observations-blocks.test.js` (extend) | Empty + diary point + no band assumption if tested |
| Prior preview | `proposals/20260918-weight-chart-upgrade/preview/` | Freeze / ignore for this candidate |

Script tags already load domains before `tryout-wire.js`; bump `?v=` on touched assets.

If later **上線／nav／Pages**: blocks already exist — thin C facade only; extract-before-publish already satisfied for brain.

## Risks

- **Medical disclaimer** — DIY scores must not read as diagnosis or “治療追蹤成效”; keep non-diagnostic note; legal only if disclaimer wording expands materially.
- **Demo vs real** — users may think demo lines are their data; empty/custom path and “示範／自己填” labeling reduce confusion.
- **Empty custom metrics** — add metric with no points must not look broken; CTA required.
- **Note-only diary (current gap)** — without value+index, Victor’s “can I fill the chart?” stays unanswered.
- **Over-removing visit context** — keep one start marker + optional visit jump so timeline link idea survives.
- **Security** — tryout memory only; escape user metric names / notes in DOM (no `innerHTML` of raw text).

## Acceptance criteria

- [ ] SVG no longer shows clutter labels like 「調劑」「回診」 as default demo; at most one primary start-tracking marker (or none if empty custom).
- [ ] Legend has no 基準觀察／治療追蹤／調整與回診 (and no band swatches if bands removed).
- [ ] Fixed clinical-looking background bands are gone (or clearly off by default).
- [ ] User can **新增我的指標** (free-text) and see empty chart + clear CTA.
- [ ] User can **enter a numeric observation** for a chosen time bucket and see the **dot/line update** on the chart (session memory OK).
- [ ] Templates remain available but are not the only/primary story.
- [ ] Disclaimer still non-diagnostic; zh-Hant.
- [ ] No B/Pages; no iteration-4 on the superseded proposal.
- [ ] Domain brains stay under `domains/observations/*`; tryout remains thin wire.

## Review routing (after Gate A + Builder)

| Reviewer | This candidate |
|----------|----------------|
| **UI** | **required** (legend, empty CTA, self-entry prominence) |
| **QA** | **required** (add metric, add point → chart, declutter smoke) |
| **Pharmacist** | **skip** (no dosing / Rx copy) |
| **Legal** | **skip** unless disclaimer / claim text expands |
| **Security** | light — escape custom labels/notes; no new secrets |

## Gate A decision list

Reply with letters (e.g. `J1 K2 L1 M1 N2`) then「確認」, or「修改：…」.

**J — Background bands**  
J1) Remove fixed bands entirely (**recommend**)  
J2) Off by default; advanced toggle later  
J3) Keep bands but unlabeled (no legend)  

**K — Event markers**  
K1) Only 「開始用藥／就診起追蹤」 (**recommend**)  
K2) Start marker + optional visit-derived square points (no 調劑／回診 labels)  
K3) No event markers in v1 self-entry; visit link only in diary form  

**L — Default tryout open state**  
L1) Keep human demo metrics for first paint; DIY path obvious beside (**recommend** for compare continuity)  
L2) Start empty: prompt 「新增我的指標」 first  
L3) Toggle: 示範資料 / 自己填  

**M — Add-point UX**  
M1) Side form: score + time bucket + optional note (**recommend**)  
M2) Tap chart bucket to set value (form secondary)  
M3) Both  

**N — Visit-derived square points (F3 leftover)**  
N1) Keep 「就診帶出」 dots in demo + legend when present  
N2) Hide visit-derived points in this rethink; diary points only (**aligns with DIY**)  
N3) Demo only; hide for custom metrics  

**O — Prior proposal**  
O1) Freeze prior as superseded; Builder only on this id (**recommend**)  
O2) Also mark prior `state.yaml` halted after Gate A  

---

## Notes for Victor

**Gate B adopted** 2026-09-18. Tryout at `apps/web/tryouts/observation-chart/` is the productization baseline. No B cover / Pages in this proposal.
