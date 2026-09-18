---
id: 20260918-weight-chart-upgrade
title: Health observation chart tryout (timeline-linked, multi-metric)
status: reviewing
author: planner
candidate_branch: ""
candidate_path: "proposals/20260918-weight-chart-upgrade/preview/"
created: 2026-09-18
updated: 2026-09-18
---

# Proposal: Health observation chart tryout

Companion: `state.yaml` (v2 source of truth for gates / iteration).

**Folder note:** Directory stays `proposals/20260918-weight-chart-upgrade/` (original slug). Title/goal supersede the earlier weight-only chart polish — that scope is **withdrawn**.

**Gate A:** **approved** 2026-09-18 — Victor: `A1 B2 C1 D2 E1 F3 G2 H1 I1` +「確認」.

### Locked decisions

| Q | Choice | Meaning |
|---|--------|---------|
| A | A1 | Standalone `preview/` HTML |
| B | B2 | Human examples (頭痛等) for tryout UI |
| C | C1 | Weight is one Y metric in this chart |
| D | D2 | Free diary + optional visit link |
| E | E1 | 0–10 for observation metrics; **tryout exception:** weight uses data-driven Y (kg demo) so C1 still works |
| F | F3 | Diary points + optional visit-derived points (demo both) |
| G | G2 | Event markers: visits + meds |
| H | H1 | Demo seed only |
| I | I1 | zh-Hant only |

## Goal

Ship a **web tryout** of a **timeline-linked health observation chart**, visually close to Victor’s reference (`健康觀察圖表_試用版.html`), so he can exercise the UX and iterate before productizing.

Core product idea (not weight-only polish):

- Observation series connect to the **timeline / visits**. Example: a Sep 1 visit records meds / a photographed prescription → from that visit, create **observation metrics** to track afterward.
- **X-axis:** fixed date timeline — **day** (time-of-day buckets), **week**, **month**, **year**.
- **Y-axis:** observation metrics — user can **manually add** metrics or pick **suggested templates** (optional, non-mandatory). Examples Victor mentioned for the idea space: headache basics; GI (e.g. gastroenteritis); UTI (hematuria frequency down?, toilet frequency up/down?). Pet-adapted templates TBD in Gate A (see questions).
- Reference HTML look is the **target visual** for the tryout.

Later productization (after tryout + Gate B) would extract into Tier 2 blocks (likely `domains/observations/` or similar) and thin surface facade — **not** in v0 unless Victor chooses an embedded C screen.

## Scope change vs prior draft

| Prior (withdrawn) | Now |
|-------------------|-----|
| Polish 寵物體重機 SVG only | Multi-metric **health observation** chart tryout |
| Weight as the only series | Metrics + templates; timeline/visit linkage |
| In-product C edit as primary | Prefer **standalone preview** first (see delivery) |
| Non-goal: multi-metric dashboard | Multi-metric **is** the goal (tryout fidelity to reference) |

## Recommended v0 delivery path

**Prefer:** standalone tryout under this proposal folder:

`proposals/20260918-weight-chart-upgrade/preview/observation-chart.html`

(or a small `preview/` tree: one HTML + optional local JS/CSS)

| Property | Choice |
|----------|--------|
| Open how | Local server URL to the preview file (same LAN/`http.server` pattern as other previews) |
| Touches `apps/web/`? | **No** for v0 tryout |
| Cover B / Pages? | **No** |
| Tier 2 | Tryout may be self-contained HTML/JS. When productized: extract chart/series math → `domains/observations/` (or extend existing domains), shell only if shared chrome, thin facade in C — **no algorithm dump into `app.js`** |
| Why preview first | Fast visual/functional iteration matching reference; no C→B risk; matches Victor「先做網頁試用版」 |

**Alternatives** (only if Victor picks them in Q-A):

- New C screen (`apps/web/c/`) — C-first, still no B until cover confirm.
- Replace / absorb 寵物體重機 — higher coupling; not recommended for first tryout.

## In scope (v0 tryout)

1. **Reference-like UI** — segmented day / week / month / year; main SVG line chart; tooltip; compare-previous toggle; legend; period summary (latest / change / completeness); event vertical markers; medical/observation disclaimer note; secondary mini chart + side metric cards **allowed in tryout** to match reference look (may be demo-wired).
2. **Multi-metric Y** — switch primary metric; at least one path to **add a custom metric** OR apply a **template pack** (templates non-mandatory). Exact template catalog and value types wait on Victor (Q-B, Q-E).
3. **Timeline linkage (demo or light bind)** — show visit-like (and optionally med) event markers on the date axis; narrate/seed a “visit → start tracking metrics” flow. Depth of real `pets[]` binding waits on Q-D, Q-F, Q-G, Q-H.
4. **X-axis modes** as in reference: day = time-of-day buckets; week / month / year labeled axes.
5. **Iterate with Victor** after he opens the URL — visual and functional feedback loop before any product merge.

## Out of scope (v0)

- Formal **B** cover, GitHub Pages publish, A/B auth wiring.
- Complete clinical template library / vet protocol completeness.
- Pharmacist dosing, drug DB, Rx OCR productization (photo-of-prescription may be **story seed** only in tryout).
- Cloud sync, Drive, Supabase, new production storage schema on mainline pets (unless Victor chooses real C storage in Q-H — still proposal-preview-scoped).
- Replacing or deleting 寵物體重機 without an explicit Victor answer (Q-C).
- Full Tier 2 product extraction into `apps/web/domains/` (deferred to a follow-up proposal after tryout approval).

## Likely files (v0)

| Path | Role |
|------|------|
| `proposals/20260918-weight-chart-upgrade/preview/observation-chart.html` (and optional sibling `.css` / `.js`) | Self-contained tryout UI + demo logic adapted from reference |
| `proposals/20260918-weight-chart-upgrade/proposal.md` / `state.yaml` | This Gate A doc |
| *(later productize, not v0)* `apps/web/domains/observations/{selectors,controller,render}.js` | Series, templates, chart brain |
| *(later)* `apps/web/c/index.html` + thin `c/app.js` + i18n | Screen wire if embedded |
| *(later)* keep `domains/weight/*` if weight remains a metric or separate screen |

**Do not edit `apps/web/` for v0** unless Victor answers Q-A as “new C screen” / “replace 體重機” and re-confirms Gate A for that path.

## Risks

- **Human clinical demos (頭痛) vs pet product** — tryout must not ship as pet medical advice; disclaimer required; template language awaits Q-B.
- **Schema creep** — diary points + visit links need a clear write model before touching `pets[]` (Q-D, Q-F, Q-H).
- **UTI / GI metric wording** — easy to imply diagnosis; keep observational labels; pharmacist/legal may be needed when productizing, not necessarily for demo-seed tryout.
- **innerHTML / labels** — escape any user or pet-derived strings if tryout reads real storage.
- **Weight screen ambiguity** — parallel tools confuse users until Q-C is settled.
- **Preview vs product** — self-contained HTML is fine for tryout; productize must extract to `domains/` (Tier 2), not paste into `app.js`.

## Acceptance criteria (v0)

- [ ] Victor can open a **documented local URL** to the tryout (preview HTML under this proposal, unless he chose C screen).
- [ ] Can switch **day / week / month / year** and see axis/buckets update.
- [ ] Can **switch and/or add** at least one observation metric (template or manual).
- [ ] Chart shows **visit-like event markers** on the timeline (demo seed OK if Q-H = demo).
- [ ] UI is **visually close** to the reference (segmented control, main chart, tooltip, compare, summary; mini/side cards OK for tryout fidelity).
- [ ] Short **non-diagnostic** disclaimer visible.
- [ ] No B/Pages publish; no silent replace of 體重機 without Q-C answer.
- [ ] Notes in preview/README or proposal: productize path = `domains/observations/` (+ thin facade).

## Review routing (after Gate A + Builder candidate)

| Reviewer | v0 tryout (preview HTML) | Later productize |
|----------|--------------------------|------------------|
| UI | required | required |
| QA | required (URL smoke + mode/metric/events) | required |
| Pharmacist | skip for demo-seed; **revisit** if pet symptom templates imply clinical advice | likely yes for template copy |
| Legal | skip unless disclaimer/product claims expand | if disclaimer / data diary ships |
| Security | if reading C `pets[]`: escape + no new secrets; demo-only = low | storage/schema review |

## 需 Victor 確認

Gate A is **blocked on answers**. Please reply with numbers (e.g. `A1 B2 …`) or「修改：…」; then「確認」to start Builder on the agreed path.

1. **Tryout form**  
   A1) Standalone `proposals/…/preview/` HTML (Planner **recommend**)  
   A2) New screen under `apps/web/c/`  
   A3) Replace / rebuild inside 寵物體重機  

2. **Template flavor for tryout**  
   B1) Pet-first examples (vomiting / appetite / urination / stool, etc.)  
   B2) Keep human examples (頭痛等) for visual tryout only  
   B3) Both: human demo pack + a small pet pack  

3. **Relationship to 寵物體重機**  
   C1) Weight becomes **one metric** inside the observation chart  
   C2) Keep 體重機 **separate**; observation chart is a new tool  
   C3) Observation chart **replaces** 體重機 later (tryout first, migrate later)  

4. **Series binding**  
   D1) Always start from a **visit** (visit → create metrics to track)  
   D2) Free **pet-level diary**, optional link to a visit  
   D3) Both: visit-started series + free diary series  

5. **Metric value types in v0**  
   E1) 0–10 scale only  
   E2) 0–10 + counts (e.g. times/day)  
   E3) 0–10 + counts + binary (yes/no)  
   E4) Also free number (e.g. kg) so weight can join  

6. **Who logs daily points**  
   F1) Owner **diary entries** (new store / preview-local store)  
   F2) **Visit-derived only** (no daily owner log in v0)  
   F3) Diary + optional auto points from visit fields when present  

7. **Event markers on chart**  
   G1) Visits only  
   G2) Visits + medication start/change from timeline  
   G3) Visits + meds + other timeline event types (specify if any)  

8. **Tryout data source**  
   H1) **Demo seed only** (recommend for fastest visual tryout)  
   H2) Read real C `pets[]` / visits (preview or C screen)  
   H3) Demo by default + optional “load from C storage” toggle  

9. **Languages for tryout**  
   I1) **zh-Hant only** OK  
   I2) zh-Hant + en  
   I3) Match C locales (zh / en / ja / ko) even for tryout  

---

確認後（含上方選項）回覆「確認」開始平行製作；要再改範圍請寫「修改：…」；不進行請「否決」。
