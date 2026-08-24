# UI review
Verdict: conditional

Candidate: iteration 1 · `preview/apps/web/styles.css` vs mainline `apps/web/styles.css`  
Scope checked: nested `.alert-section .alert-item.severity-*`, standalone `.alert-item.severity-*` / aliases, left rail, mobile padding media, contrast to `.e-alerts` / `.e-alerts.is-critical`, anti-AI defaults.

## Findings

- [UI-001] [P2] nested severity rows vs section plates — Outer drop on nested critical/caution (`0 8px 18px` @ ~0.10–0.11 tint) is stronger than parent `.alert-section` plate (`0 4px 14px` @ 0.04; mobile alerts section `0 6px 16px` @ 0.06), so list rows can read as more elevated than the section that contains them. Insets + gradient already carry the `.e-alerts` depth language. Soften **only** the nested outer shadow (e.g. ~`0 4px 12px` / ~0.07–0.08 tint) while leaving standalone plate shadows as-is or only mildly reduced.

- [UI-002] [P3] left rail on standalone severity plates — Alerts-screen nested rails stay correctly suppressed (unchanged `::before { display: none }`). Standalone plates keep severity-tinted rails; brighter top gradient stop (`#fff7f6` / `#fffaf3`) plus dual white insets may slightly soften rail contrast at the left edge. Spot-check rail legibility on phone; if quiet, nudge rail width/contrast or top stop—no layout change needed.

## Notes (non-findings)

- Critical vs caution hierarchy preserved: full `--alert-border` + rose shadow vs milktea/beige border mix + warm shadow; type/rail colors untouched.
- Depth cues match restrained `.e-alerts` language (vertical gradient, dual inset, tinted outer) without purple/glow/AI-default chrome; CSS-only; mobile padding media does not undo depth; default non-severity rows unchanged.
