# UI review
Verdict: conditional

Candidate chrome (intro remembered status, continue CTA, busy/disabled login, zh/en/ja/ko) reviewed vs mainline. Brand/hero composition preserved: no new cards, no purple–indigo / cream–terracotta / broadsheet defaults, fonts unchanged (Fraunces / Noto). Remembered “who” is status + CTA only — topbar account/avatar stays gated on live `signedIn` (honest; does not look fully signed in). Busy lock paints via `beginAuth` → `notify` → `applyAuthBusyState`; `:disabled` opacity on `#intro-login-btn` is restrained and on-brand.

## Findings
- [UI-001] [P2] intro CTA / mobile — At `max-width: 420px`, `.intro-login-label` is `display: none`, so “Continue with Google” vs “Sign in with Google” never appears on phone; remembered differentiation falls only to muted `#intro-status`. — Keep a short continue label visible on narrow widths (or icon-adjacent compact text), not aria alone.
- [UI-002] [P3] intro status copy — `cloudRememberedNeedGoogle` with empty `email` yields awkward punctuation (e.g.「歡迎回來，。」). — Use a no-email variant when `profile.email` is missing.
- [UI-003] [P3] account switch busy — `#account-popover-switch` is disabled while GIS is in flight but has no muted/`cursor: wait` style (unlike `.intro-login-btn:disabled`). — Mirror the intro disabled affordance so switch does not look clickable.
