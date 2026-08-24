---
id: 20260813-timeline-weight-delta
title: Timeline visit weight + delta vs previous visit
status: adopted
author: planner
candidate_branch: ""
candidate_path: proposals/20260813-timeline-weight-delta/preview
created: 2026-08-13
updated: 2026-08-13
# Gate B adopted. Mainline merge: weight-delta only (no compound-chip preview drift).
---

# Proposal: Timeline visit weight + delta vs previous visit

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

On each timeline visit card (`li.tl-item` in `#timeline-list`), keep showing the pet’s **weight at that visit** (當次就醫體重), and add a compact **vs previous visit** note: days since last visit, plus weight change (gain → green + “increased X kg”; loss → red + “decreased X kg”). All chrome strings go through i18n and recompute on language change.

## What exists today (source of truth)

- Visit field: `visit.weightAtVisit` (number kg, optional / nullable). Already rendered as `visitWeight` / `visitWeightPending`.
- On save: form `weightAtVisit` may be empty → `null`; if set, also syncs `pet.weight` + `pet.weightDate`.
- Unit: **kg only** (contracts + UI copy).
- Visit list: demo + `unshift` → **newest first**. “Previous visit” = next older visit by `date` (chronological prior), not array index alone if order ever drifts.
- Contracts (`Visit.weightAtVisit?`, `PetWeight`) already describe visit-linked weight; no new data model required for MVP.

## In scope

- Show visit weight on card when `weightAtVisit > 0` (keep existing pending line when missing).
- Compute **previous visit** = immediately prior record in chronological order (sort by `date` ascending, stable within same day by existing list/id order). **Same-day visits count** — compare to the earlier same-day record if that is the previous entry (“相較上一筆資料”).
- When both current and previous have known weights: show signed delta in kg (1 decimal consistent with input `step=0.1`), green icon + increased copy for gain, red + decreased for loss; **Δ = 0 → show neutral「相同」** (i18n), not hide, not green/red.
- When a previous visit exists: show **days since previous visit** (calendar days between dates; same day → 0 days), even if weight delta is omitted.
- First visit (no previous): **no** days-since / delta block (empty — no fake baseline).
- Missing weight is a **real product state** (`weightAtVisit` optional → `null`; card already shows `visitWeightPending` /「體重待補」). When current or previous lacks weight: **quiet omit** numeric delta only — no extra soft tip; keep days-since if previous exists; do not invent kg.
- New i18n keys (zh-Hant / en / ja / ko) for days-since, increased/decreased/**相同**; recompute on language switch via existing `t()` + re-render path.
- Minimal CSS for delta row / icon colors; stay inside current `.tl-item` / `.tl-weight` language (no new card chrome).

## Out of scope

- Weight charts, BMI, ideal-weight targets, or trend graphs.
- Non-kg units or unit conversion.
- Editing weight from the timeline card (use existing visit flow).
- Using `pet.weight` as a fallback when `weightAtVisit` is missing (would invent visit-time weight).
- Diagnosis / “healthy range” / veterinary advice tone.
- Contract schema changes or PetWeight history UI (unless needed later).
- Changes to visit create form beyond what’s already optional.

## Likely files

- `apps/web/app.js` — `renderTimeline`: previous-visit lookup, day delta, weight delta, markup.
- `apps/web/i18n.js` — chrome strings + placeholders (`{days}`, `{kg}` / `{weight}`).
- `apps/web/styles.css` — `.tl-weight-delta` (or similar) green/red/neutral icon + text.
- `apps/web/index.html` — cache-bust query only if touched.
- `contracts/` — **read-only reference**; no change expected.

## Risks

- **Medical tone:** Delta is factual (“increased 0.3 kg”), not “overweight / concerning.” Avoid clinical advice.
- **Missing / first visit:** Must not show 0 kg or fake previous; first visit stays quiet.
- **Wrong previous:** Same calendar day or unsorted list could pick wrong neighbor — always derive by date order.
- **Precision / rounding:** Display one decimal; avoid float noise (e.g. 0.3000001).
- **Color-only meaning:** Pair icon/color with text (a11y); don’t rely on green/red alone.
- **i18n:** Number/date formatting must follow existing locale helpers where present.

## Acceptance criteria

- [ ] Each visit with `weightAtVisit > 0` shows that visit’s weight (existing or equivalent i18n).
- [ ] Visits with a chronological previous show days-since copy via i18n.
- [ ] When both weights known: gain → green + increased X kg; loss → red + decreased X kg; unchanged → neutral「相同」.
- [ ] Same-day consecutive visits: delta/days compare to the immediately previous record (may be same calendar day).
- [ ] Oldest / first visit: no days-since and no weight delta.
- [ ] Missing weight on either side: no invented delta; no extra “無法比較” tip (pending line already covers missing weight).
- [ ] Language switch updates all new chrome strings without reload hacks beyond existing re-render.
- [ ] Demo pets with multi-visit weights show correct previous pairing on timeline.
- [ ] Candidate stays off mainline (`proposal/timeline-weight-delta` or `proposals/.../preview`).

## Assumptions (locked after Victor clarifications)

1. Previous = immediately prior visit in chronological order (same-day allowed).
2. First visit: omit delta / days-since entirely.
3. Missing weight: quiet omit delta; still show days-since if previous exists; card already has「體重待補」.
4. Source of weight = `visit.weightAtVisit` only (kg).
5. Δ = 0 → show「相同」(neutral), do not hide.

## Notes for Victor

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
