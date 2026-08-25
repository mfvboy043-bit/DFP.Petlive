# UI review
Verdict: conditional

Candidate: `proposal/breed-groups-collapse` @ `999760b` vs `main` — breed field on formal B pet form (`index.html` / `styles.css` / `i18n.js` / `app.js` + groups in `breeds-database.js`).

## Summary
Collapsed default fits the existing chip-field: quiet groups (no borders/cards), leaf-token toggle, no new AI-default palette/type. Mobile form height benefit is clear. Conditional on tap-target size for the expand control and collapse discoverability after a long expanded list.

## Findings
- [UI-001] [P2] expand toggle — `.breed-expand-toggle` uses `min-height: 36px` while the design token is `--tap: 48px` and mobile chips are already bumped to `42px`. Expand is the only way to reach non-common breeds; undersized hit area hurts one-handed use. Suggestion: match mobile chip height (≥42px) or `--tap`, and keep horizontal padding generous enough for long ja/ko strings.
- [UI-002] [P2] expand/collapse placement — toggle sits only below `#breed-chips`. After expand, dog groups stack (~6 headers + chips); “收合品種” falls below the fold, so collapsing requires a long scroll. Suggestion: keep a persistent control near the field legend / above the chips when expanded (or dual top+bottom), without turning it into a card chrome.
- [UI-003] [P3] collapsed selected pin — non-common selected chip is correctly forced into the preview, but it sits in the same wrap as common chips with no separator. Selected `is-on` state helps; a light visual break (or short muted “目前選擇” context) would reduce “why is this next to 柴犬?” confusion. Non-blocking if left as-is.
- [UI-004] [P3] singleton group headers — expanded “其他” (schnauzer only) and “自訂” add header density for one chip each; labels are already quiet (11px muted, no card). Optional: omit header for single-member / custom groups and rely on chip copy, or tighten `gap` slightly. Non-blocking.

## What works
- Brand / form fit: stays inside existing pet-form chip language (Fraunces/Noto + leaf tokens); no purple/cream/broadsheet drift; no card wrappers on groups.
- Hierarchy: collapsed preview reads as one chip row like gender/other chip fields; expanded group labels are subordinate to the field legend.
- Card restraint: `.breed-group` is label + wrap only — correct for interaction chips.
- Control clarity: copy (`展開全部品種` / `收合品種`), `aria-expanded`, `aria-controls`, and focus-visible outline are clear; species=`other` hides the toggle.
- Motion: instant swap, no decorative animation noise.
