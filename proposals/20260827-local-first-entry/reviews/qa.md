# QA review
Verdict: conditional
## Findings
### Overlapping GIS if Google control is double-clicked
- ID: QA-001
- Severity: medium
- Steps: 1. Unsigned cold boot on formal A (no Google session; no `?demo=1` / `?app=1` / `screen=home`). 2. Rapidly double-click `#intro-login-btn` (or, while signed in on B, open the account popover and double-tap `#account-popover-switch`). 3. Complete or dismiss the Google popup. 4. Wait if a second request is still pending (GIS client uses one `callback` slot; timeout is 120s).
- Expected: One GIS popup; a second click is ignored until the first `handleGoogleSignIn` finishes; no extra cancel/fail toast after a successful sign-in.
- Actual: `#intro-login-btn` / `#account-popover-switch` call `handleGoogleSignIn` with no in-flight lock. A second `signIn()` overwrites `driveTokenClient.callback`. The first promise can reject (`popup_closed` / `popup_failed`) or later `auth_timeout`, so the user can see `cloudLoginCancelled` or `cloudBackupFail` while already signed in (or with a second popup still open). Post-login silent reconcile does not open another GIS (`interactive:false`) — this is click-overlap only. (Iteration-1 `.account-chip-connect` path is gone on this amendment.)
