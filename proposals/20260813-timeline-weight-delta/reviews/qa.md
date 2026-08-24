# QA review

Verdict: pass

Blocking: none  
Non-blocking: QA-001 (low)

Scope checked against proposal acceptance and preview `apps/web` (diff vs mainline). Logic review + chrono pairing simulation for demo pets and same-day ties. Did not patch product code.

## Findings

### Out-of-scope compound chip CSS/JS in candidate

- ID: QA-001
- Severity: low
- Blocking: no
- Steps:
  1. Diff preview `app.js` / `styles.css` vs mainline.
  2. Note `applyCompoundChipColors` and compound-chip tone rules differ outside timeline weight work.
- Expected: Candidate delta limited to timeline weight + i18n + `.tl-weight-*` CSS (plus cache-bust).
- Actual: Unrelated compound-chip coloring changes are bundled. Weight/delta behavior itself is unaffected; adopt should not blindly overwrite mainline compound tones without reconciling.

## Acceptance checklist (QA)

| Criterion | Result |
| --- | --- |
| `weightAtVisit > 0` shows visit weight; pending when missing | Pass — `visitWeightKg` only; no `pet.weight` fallback |
| Chronological previous → days-since via i18n | Pass — `buildPreviousVisitByIndex` + `calendarDaysBetween`; same day → 0 |
| Both weights → gain / loss / Δ0「相同」 | Pass — rounded to 1 decimal; neutral `is-same` |
| Same-day consecutive → prior record | Pass — tie-break: higher list index = older (newest-first) |
| First / oldest visit quiet | Pass — no vs block |
| Missing weight either side → quiet omit delta; keep days if previous exists; no soft tip | Pass — no「無法比較」; demo p1 6/18 & 4/22 behave correctly |
| Language switch recomputes chrome | Pass — `setLanguage` → `onLanguageChange` → `applySelectedPet` → `renderTimeline` + `t()` |
| Demo multi-visit pairing | Pass — see notes |
| Off mainline | Pass — `proposals/.../preview` |

## Demo pairing notes (expected UI)

**米醬 (p1)** newest→oldest:

1. 2026-08-02 (6.8) vs 2026-06-18 (6.5) → days 45 + 增加 0.3 kg  
2. 2026-06-18 (6.5) vs 2026-04-22 (missing) → days only, no delta  
3. 2026-04-22 (pending) vs 2026-03-10 (6.5) → days only, no delta  
4. 2026-03-10 (6.5) → quiet (first)

**小黑 (p2):**

1. 2026-07-20 (12.4) vs 2026-05-03 (12.4) → days + 相同  
2. 2026-05-03 (12.4) vs 2026-02-14 (missing) → days only  
3. 2026-02-14 (pending) vs 2025-11-08 → days only  
4. 2025-11-08 → quiet (first)

No same-day fixture in demo data; same-day path verified by simulation only.

## State / pet isolation

- Previous lookup uses the rendered pet’s `pet.visits` only.  
- Inline weight save uses `getCurrentPet()` + visit index, then `applySelectedPet()`.  
- No evidence of cross-pet writes or invented kg for the vs-previous block.
