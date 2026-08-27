# QA review
Verdict: conditional
## Findings
### Overlapping GIS if Google control is double-clicked
- ID: QA-001
- Severity: medium
- Steps: 1. First visit, unsigned, no `petlive-intro-seen`, no real local graph: intro A shows. 2. Rapidly double-click `#intro-login-btn` (or enter B unsigned, then double-tap the in-passport `.account-chip-connect` on home or an inner glass head). 3. Complete or dismiss the Google popup. 4. Wait if a second request is still pending (GIS client uses one `callback` slot; timeout is 120s).
- Expected: One GIS popup; a second click is ignored until the first `handleGoogleSignIn` finishes; no extra cancel/fail toast after a successful sign-in.
- Actual: `#intro-login-btn` and `.account-chip-connect` both call `handleGoogleSignIn` with no in-flight lock. A second `signIn()` overwrites `driveTokenClient.callback`. The first promise can reject (`popup_closed` / `popup_failed`) or later `auth_timeout`, so the user can see `cloudLoginCancelled` or `cloudBackupFail` while already signed in (or with a second popup still open). Reconcile itself does not open a second GIS (silent `interactive:false`) — this is click-overlap, not the old login-then-Drive chain.
