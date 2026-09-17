# Phase 2 metrics — B activation of shared account/parasite CSS

Candidate: `.worktrees/cb-shared-surface-p2` @ `proposal/cb-shared-surface-p2` from `ff31d21` + Phase 2 edits.

| Source | Before Phase 2 | After Phase 2 |
|---|---|---|
| C migrated rules/decls | 0 / 0 | 0 / 0 |
| B `styles.css` migrated rules/decls | 41 / 126 | 0 / 0 |
| Canonical shell owners | 41 / 126 | 41 / 126 |
| Phase 1 B allowlist fixture | present | deleted |

B now loads `shell/account-chrome.css` + `shell/parasite-strip.css` (`?v=20260903-cb-p2`) before `styles.css`. C shared tokens aligned to the same `?v=`.
