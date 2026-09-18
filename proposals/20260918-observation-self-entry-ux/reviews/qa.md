# QA review — `20260918-observation-self-entry-ux` (iteration 1)

- **Reviewer:** QA (independent)
- **Candidate:** `apps/web/tryouts/observation-chart/` + `apps/web/domains/observations/*`
- **Locked Gate A:** J1 K1 L1 M1 N2 O1
- **Date:** 2026-09-18
- **URL smoke:** `http://127.0.0.1:5173/apps/web/tryouts/observation-chart/` → **HTTP 200**
- **Node tests:** `node --test qa/tests/web-observations-blocks.test.js` → **9/9 pass**

## Verdict

**pass**

Phase 1–2 candidate meets Gate A acceptance for declutter (J1/K1/N2), DIY empty custom + value/index fill-in (L1/M1), disclaimer/zh-Hant, tryout-only surface, and Tier 2 block placement. Non-blocking nits only. Pharmacist / Legal skipped per routing.

## Acceptance checks

| # | Criterion | Result |
|---|---|---|
| 1 | SVG default demo: no 調劑／回診 clutter; ≤1 primary start-tracking marker | **pass** — demo-seed one `開始追蹤` event per mode; browser CDP: `eventLabels: ["開始追蹤"]`, no 調劑／回診 |
| 2 | Legend: no 基準觀察／治療追蹤／調整與回診／就診帶出 (N2) | **pass** — DOM legend = `本期` / `上一期間` / `日記點` only; body text scan negative for forbidden legend strings |
| 3 | Fixed clinical bands gone (J1) | **pass** — `chart.js` has no band fills / `#e8f4ed` / `#fbe9ed`; CDP `hasBandColors: false`; test asserts no band colors |
| 4 | 新增我的指標 → empty chart + CTA | **pass** — browser: `custom_1`／疲勞程度 → `data-show=true` empty state + `#emptyAddPointCta`「記第一筆觀察」 |
| 5 | Numeric observation (value + time index) → chart updates (session) | **pass** — form → `addDiaryPoint`; browser: point `本期 週三 疲勞程度 7分（日記）`, feedback memory note, no new LS/SS keys for chart |
| 6 | Templates available; DIY path obvious (L1) | **pass** — demo metrics remain default first paint; side「新增我的指標」primary + hint that list is 範本 |
| 7 | Non-diagnostic disclaimer; zh-Hant | **pass** — `.medical-note` 不提供診斷或用藥建議；`lang="zh-Hant"`; eyebrow「觀察筆記本」 |
| 8 | No B/Pages; brains in domains; tryout thin wire | **pass** — git diff only domains + tryout + QA test (no `app.js` / Pages productize in this candidate) |
| 9 | `web-observations-blocks.test.js` | **pass** — **9 passed, 0 failed** (incl. empty custom + diary fill + no-band chart load) |

## Locked-decision spot checks

| ID | Check | Result |
|----|---|---|
| J1 | Remove fixed bands | **pass** |
| K1 | Only start-tracking event kind | **pass** — one med/start event per mode |
| L1 | Demo metrics first paint; DIY obvious | **pass** |
| M1 | Side form: score + time bucket + optional note | **pass** — `#diaryValue` + `#diaryIndex` + note/visit |
| N2 | Hide visit-derived squares; diary points only | **pass** — chart forces diary circles; visit sources labeled「日記」; no 就診帶出 legend |
| O1 | This proposal only (prior frozen) | **pass** — candidate path is this id’s tryout/domains |

## Issues

### Blockers

None.

### Non-blocking

#### QA-1 — Weight template vs 0–10 diary form (low)

「記一筆觀察」is hard-capped to `min=0 max=10` (HTML + JS). Selecting template **體重** cannot submit a realistic kg value (browser constraint blocks submit before handler). DIY / 0–10 path (acceptance focus) works. Productize or a later pass should branch scale for weight.

#### QA-2 — Custom metric inherits shared demo start marker (low)

After DIY empty → add first point, `modeData.events` still paints the demo「開始追蹤」marker (shared per mode, not per metric). Allowed by K1 “at most one”; slightly odd for a brand-new empty notebook. Optional later: suppress demo events on custom ids.

#### QA-3 — Unused band/square legend CSS left in tryout (info)

`index.html` still defines `.legend-block` / `.legend-square` / wash vars; not referenced in the live legend markup. Dead CSS only; no acceptance fail.

#### QA-4 — Passport iframe `?v=` lag (info, out of Builder B-edit scope)

Pre-existing B/C hosts still point iframe at `?v=20260918-title-jump` while tryout assets use `?v=20260918-self-entry`. Direct tryout URL (candidate) is correct. Opening via passport nav may show a cached older build until facade bump — acceptable under「No B/Pages」for this Gate A.

### Building blocks

#### BB-1 — Domains brains + thin tryout wire (pass)

Diff confined to `domains/observations/{chart,demo-seed}.js`, tryout `index.html` / `tryout-wire.js`, and QA test. No new algorithm dump into `apps/web/app.js` or `c/app.js`. **No BB blocker.**

## Evidence

- curl **HTTP 200** for tryout URL
- Browser CDP: legend text; single `開始追蹤` event label; no band fills; add `疲勞程度` → empty+CTA; submit value `7` index `2` → diary point + path + summary `7 分`
- Static: demo-seed events length 1 / label matches `/開始/`; chart.js N2 diary circles; no forbidden legend strings in tryout HTML
- `node --test qa/tests/web-observations-blocks.test.js`: **9/9 pass**
- Security light: custom labels/notes via `textContent` / `escapeHtml` on tooltip/cards; tryout memory only (no pets write)

## Unverified

- Pixel / layout polish on phone (UI reviewer)
- Pharmacist / Legal (skipped)
- Formal Pages publish (out of scope; not requested)

## Gate recommendation

**QA clear for Arbiter / Gate B consideration.** Optional polish on **QA-1** / **QA-2**; neither blocks acceptance for this DIY self-entry tryout.
