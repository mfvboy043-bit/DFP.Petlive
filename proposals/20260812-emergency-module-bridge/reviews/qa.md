# QA review
Verdict: pass

## Findings

### Preview app.js drifts behind mainline timeline markup (Gate B merge risk)
- ID: QA-001
- Severity: medium
- Status: fixed (iteration 2)
- Steps:
  1. Diff preview `app.js` vs mainline `apps/web/app.js` outside emergency bridge hunks.
  2. Count timeline markers (`tl-item-empty`, `tl-item-head`, `tl-item-year`, `tl-tag`).
- Expected: Candidate only adds emergency bridge / degrade paths; timeline markers match mainline.
- Actual (recheck): Markers match (1/1/1/2 each). Full `app.js` diff is three hunks only — `buildEmergencySnapshot` / list helpers / `paintEmergencyCardDegradedShell` / `renderEmergencyCard` + local fallback, and `safeRender("emergencyCard")` onError → `paintEmergencyCardDegradedShell()`. No timeline fork remains.

### Copy summary ignores degrade flags during injectFail demo
- ID: QA-002
- Severity: low
- Status: open (unchanged; not in builder_scope)
- Steps:
  1. Open preview with `?injectFail=alerts` (hard refresh).
  2. Open 急診資訊卡 — alerts list shows `emergencyDegradedAlerts`.
  3. Tap 複製摘要 and inspect clipboard text.
- Expected: Demo path either omits alerts / marks them unavailable, or documents that copy always uses local `pets[]`.
- Actual: `#copy-card` still builds from `getAlertsForPet` / `deriveActiveEmergencyMeds` (local truth), so clipboard can list real alerts while the card body says alerts failed to load.

## Revision checks

| Check | Result |
| --- | --- |
| MED-001: `safeRender("emergencyCard")` onError uses degrade strings | Pass — onError calls `paintEmergencyCardDegradedShell()` → `emergencyDegradedAlerts` / `emergencyDegradedMeds` / `emergencyDegradedWeight`; not `noAlertItem` / `noMeds` |
| QA-001: timeline markers vs mainline | Pass — see above |
| Empty path still uses empty copy | Pass — `renderEmergencyAlertsList` / `renderEmergencyMedsFromList` still use `noAlertItem` / `noMeds` when arrays are empty and not degraded |

## Acceptance check (code + asset curl)

| Criterion | Result |
| --- | --- |
| Normal path still shows alerts/meds | Pass — snapshot from `buildEmergencySnapshot` → `generateEmergencyCard` → `renderEmergencyAlertsList` / `renderEmergencyMedsFromList` |
| `injectFail=alerts` → degraded ≠ `尚無醫療警示` | Pass — `_degraded.alerts` → `t("emergencyDegradedAlerts")`; empty path still `noAlertItem` |
| `injectFail=medications` → meds degraded; alerts remain | Pass — sibling sections independent in module + UI |
| PetLive missing → local fallback | Pass — `typeof generate !== "function"` / `PetLive.call` → null → `renderEmergencyCardLocal` |
| `safeRender("emergencyCard", …)` on pet apply | Pass — still wrapped in deferred `applySelectedPet`; onError degrades shell |
| Four-locale degrade chrome | Pass — zh/en/ja/ko keys present in preview `i18n.js` |

Preview HTML / `petlive.js` / `modules/emergency-card/index.js` returned HTTP 200 under local `5173`. `qa/tests/fault-isolation.test.js` snapshot+injectFail case still matches semantics.
