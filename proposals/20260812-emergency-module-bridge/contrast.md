# Contrast — emergency module bridge

## Mainline (today)

- `renderEmergencyCard` builds alerts/meds only from `app.js` helpers (`getAlertsForPet`, `deriveActiveEmergencyMeds`).
- No `_degraded` path; a throw inside that function is caught by `safeRender` but cannot show per-section “temporarily unavailable”.
- Modules `emergency-card` exist but the live card does not call them (except drug search elsewhere).

## Candidate

- Card prefers `PetLive.emergency.generateEmergencyCard` with a **snapshot** from the current pet (prototype single source).
- `?injectFail=alerts|medications|weight` (or sessionStorage) sets `_degraded` → distinct chrome strings (四語).
- Missing `PetLive` → local fallback (no blank shell).
- Shared module API gains `options.snapshot` / `options.injectFail` for UI + QA.

## Files touched

| Path | Role |
|---|---|
| `proposals/.../preview/apps/web/app.js` | Bridge render |
| `proposals/.../preview/apps/web/i18n.js` | Degrade copy |
| `proposals/.../preview/apps/web/index.html` | Asset paths + cache |
| `modules/emergency-card/index.js` | Snapshot / injectFail |
| `apps/web/runtime/petlive.js` | Inject helpers |
| `qa/tests/fault-isolation.test.js` | Extra case |
| `ARCHITECTURE.md` | Wired note |
