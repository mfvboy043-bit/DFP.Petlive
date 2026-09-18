# QA review — `20260918-weight-chart-upgrade` (iteration 1)

- **Reviewer:** QA
- **Candidate:** `proposals/20260918-weight-chart-upgrade/preview/` (`observation-chart.html` + `README.md`)
- **Locked decisions:** A1 B2 C1 D2 E1 F3 G2 H1 I1
- **Date:** 2026-09-18
- **URL smoke:** `http://127.0.0.1:5173/proposals/20260918-weight-chart-upgrade/preview/observation-chart.html` → **HTTP 200** (local server up)

## Verdict

**pass**

v0 standalone tryout meets Gate A acceptance for mode/metric/weight/events/compare/tooltip/summary/disclaimer/zh-Hant-primary/demo-seed. No `apps/web` touch. Tier 2: preview HTML acceptable for tryout; productize path documented. Non-blocking nits only.

## Acceptance checks

| # | Criterion | Result |
|---|---|---|
| 1 | Documented local URL opens | **pass** — README documents `5173` URL; curl **200**; browser title `健康觀察圖表｜試用版` |
| 2 | day / week / month / year switch | **pass** — segmented `data-mode`; live switch week→month updates axis labels (`週*` → `1日`/`4日`…), title (`每週`→`每月`), granularity (`逐日`→`每 3 日`) |
| 3 | Metric switch + add custom 0–10 | **pass** — select + side cards; added `疲勞程度` → `custom_1` in selects; empty chart state (no points) |
| 4 | Weight as metric with kg scale (C1+E1) | **pass** — `體重` option; points labeled `…kg`; subtitle says Y 軸依資料範圍; card note「公斤・Y 軸依資料範圍」 |
| 5 | Visit + med event markers (G2) | **pass** on week/month/year (seed `kind: visit` + `kind: med`); see **QA-1** for day-mode gap |
| 6 | Compare previous + tooltip + summary | **pass** — compare checkbox; hover/focus tooltips on points; 期間摘要 (最新 / 變化 / 完整度) wired |
| 7 | Non-diagnostic disclaimer | **pass** — `.medical-note` visible: 不提供診斷或用藥建議 |
| 8 | zh-Hant only (I1) | **pass** with nit — UI/body Traditional Chinese; see **QA-2** English eyebrow |
| 9 | Demo seed only (H1) | **pass** — no `localStorage` / `sessionStorage` / `indexedDB` / `pets[]`; diary notes in-memory only |
| 10 | Tier 2 note | **pass** — README「Later productize」→ `domains/observations/` + thin C facade; no algorithm dump into `app.js`. Preview HTML OK for v0 (**BB-1**) |

## Locked-decision spot checks

| ID | Check | Result |
|----|---|---|
| A1 | Standalone preview only | **pass** |
| B2 | Human examples (頭痛等) | **pass** |
| C1 | Weight one Y metric | **pass** |
| D2 | Free diary + optional visit link | **pass** — form + demo visit options |
| E1 | 0–10; weight data-driven kg | **pass** |
| F3 | Diary + visit-derived points | **pass** on week/month/year (圓點／方點 + sources); day series diary-only — **QA-1** |
| G2 | Visit + med markers | **pass** week/month/year; day med+note only — **QA-1** |
| H1 | Demo seed, no pets write | **pass** |
| I1 | zh-Hant | **pass** + **QA-2** |

## Issues

### Blockers

None.

### Non-blocking

#### QA-1 — Day mode incomplete for G2 / F3 (low)

`viewData.day.events` = `{ med×2, note×1 }` — **no `visit` marker**. Day metric `sources` are all `"diary"` (no visit-derived squares). Week / month / year correctly show visit+med events and mixed diary/visit points. Acceptance still met via those modes; day is the weak slice for the locked G2/F3 story.

#### QA-2 — English eyebrow vs I1 (low)

Visible eyebrow copy: `Observation timeline` while `lang="zh-Hant"` and remaining chrome is zh-Hant. Cosmetic I1 leak; does not block tryout exercise.

#### QA-3 — Diary submit does not append chart points (info)

「儲存示範備註」pushes to in-memory `diaryNotes` and shows feedback only — does not mutate series. Acceptable for H1 demo; F3 is demonstrated by seed markers, not by the diary form. Productize should clarify write→chart path.

### Building blocks

#### BB-1 — Preview OK for v0; productize path noted (pass)

Self-contained HTML under `proposals/.../preview/` matches A1. README names later extract to `apps/web/domains/observations/` (+ thin facade). **No BB blocker** for this candidate.

## Evidence

- curl: `HTTP 200` for preview URL
- Static: no storage / `pets[]` APIs in HTML
- Browser smoke: metric→體重 (kg labels); month mode axis/title/granularity; add custom `疲勞程度` → empty series + option `custom_1`
- Disclaimer + demo badge / story banner present

## Unverified

- Pixel fidelity vs Victor’s reference HTML (UI reviewer)
- Phone / narrow viewport overflow beyond CSS `@media` read (UI)
- Pharmacist/legal on human symptom wording (skipped for demo-seed per proposal)

## Gate recommendation

**QA clear for Arbiter / Gate B consideration** on this preview candidate. Fix **QA-1** / **QA-2** optionally before or during productize; neither blocks tryout sign-off.
