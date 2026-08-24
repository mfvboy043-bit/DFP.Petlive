# QA review
Verdict: conditional

## Findings

### Preview app.js drifts behind mainline timeline markup (Gate B merge risk)
- ID: QA-001
- Severity: medium
- Steps:
  1. Diff `proposals/20260812-emergency-module-bridge/preview/apps/web/app.js` vs mainline `apps/web/app.js` outside the emergency bridge hunks.
  2. Open preview → 時間軸 with at least one visit.
  3. Imagine Gate B adopting preview `app.js` onto current mainline as README describes.
- Expected: Candidate only adds emergency bridge / degrade paths; unrelated mainline timeline structure (`tl-item-empty`, `tl-item-head` / `tl-item-year`, `tl-tag` on tags) stays intact on adopt.
- Actual: Preview `renderTimeline` is an older fork — missing those markers. Emergency acceptance still holds in preview, but a naive whole-file adopt would regress the timeline screen on mainline.

### Copy summary ignores degrade flags during injectFail demo
- ID: QA-002
- Severity: low
- Steps:
  1. Open preview with `?injectFail=alerts` (hard refresh).
  2. Open 急診資訊卡 — alerts list shows `emergencyDegradedAlerts`.
  3. Tap 複製摘要 and inspect clipboard text.
- Expected: Demo path either omits alerts / marks them unavailable, or documents that copy always uses local `pets[]`.
- Actual: `#copy-card` still builds from `getAlertsForPet` / `deriveActiveEmergencyMeds` (local truth), so clipboard can list real alerts while the card body says alerts failed to load.

## Acceptance check (code + asset curl)

| Criterion | Result |
| --- | --- |
| Normal path still shows alerts/meds | Pass — snapshot from `buildEmergencySnapshot` → `generateEmergencyCard` → `renderEmergencyAlertsList` / `renderEmergencyMedsFromList` |
| `injectFail=alerts` → degraded ≠ `尚無醫療警示` | Pass — `_degraded.alerts` uses `t("emergencyDegradedAlerts")`; empty path still uses `noAlertItem` |
| `injectFail=medications` → meds degraded; alerts remain | Pass — sibling sections independent in module + UI |
| PetLive missing → local fallback | Pass — `typeof generate !== "function"` / `PetLive.call` → null → `renderEmergencyCardLocal` |
| `safeRender("emergencyCard", …)` on pet apply | Pass — still wrapped in deferred `applySelectedPet` |
| Four-locale degrade chrome | Pass — zh/en/ja/ko keys present; `onLanguageChange` → `applySelectedPet` recomputes |

Preview HTML / `petlive.js` / candidate `app.js` / `i18n.js` / `modules/emergency-card/index.js` returned HTTP 200 under local `5173`. `qa/tests/fault-isolation.test.js` snapshot+injectFail case matches the above semantics (node binary unavailable in this environment; not executed).
