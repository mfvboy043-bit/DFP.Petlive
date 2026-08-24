# UI review
Verdict: reject

## Findings
- [UI-001] [P1] Candidate baseline predates the current timeline UI and stylesheet cache key. Rebase and preserve current mainline visuals.
- [UI-002] [P2] Parasite focus/scroll hook runs while the destination screen is still hidden.
- [UI-003] [P2] Parasite dynamic chrome can remain in the previous language.

Blocking recommendation: resolve UI-001 and recheck compatibility on desktop and phone.
