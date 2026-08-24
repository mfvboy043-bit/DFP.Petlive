# UI review
Verdict: conditional

Candidate: `proposals/20260813-timeline-edit-recorded-weight/preview/apps/web/` vs mainline `apps/web/` (iteration 1). Focus: recorded weight tap affordance, open state, hierarchy, mobile, a11y, static delta, anti-AI styling, i18n chrome.

## Findings

- [UI-001] [P2] recorded `.tl-weight-value` — tap target is glyph-sized — `.tl-weight-value` is a real `<button>` with underline affordance (good, not amber pill), but CSS uses `padding: 0` and no `min-height` / `min-width`, while `.tl-item-head .tl-weight` forces `min-height: 0` and `font-size: 0.72rem`. Effective hit area is roughly the text “6.8 kg” (~14px tall), far below pending’s 28–32px and typical ~44px mobile targets. **Suggestion:** keep underline (not pill); add modest vertical padding and ~28–32px min-height (and a little horizontal padding) so the value stays text-like but tappable.

- [UI-002] [P3] open state — cue is easy to miss next to distant form — `.tl-weight-value.is-open` only bumps underline thickness 1px→2px; the `.tl-weight-edit` panel still opens under the clinic row (same as pending). On a dense head, open vs closed on the control itself is weak. **Suggestion:** slightly stronger open cue on the value (e.g. thicker underline + soft leaf-tint / inset ring) without borrowing the amber pending pill.

## Checked OK (no issue ID)

- **Hit isolation:** markup is `${weightVs}` + label + `<button class="tl-weight-value">` — `.tl-weight-vs` / delta stay outside the toggle; no `cursor: pointer` on delta.
- **Not pending pill:** recorded control uses transparent bg + leaf underline; pending amber pill CSS untouched.
- **a11y:** `type="button"`, `aria-expanded` / `aria-controls`, i18n `aria-label` via `visitWeightEditAria`; `focus-visible` leaf ring; toggle reuses `toggleVisitWeightButton` (focuses input on open).
- **i18n:** `visitWeightEditAria` in zh-Hant / en / ja / ko; language change → `applySelectedPet()` re-renders chrome; form reuses existing fill/save keys.
- **Anti-AI / hierarchy:** leaf tokens + underline; no purple-indigo / new cream-terracotta hero / broadsheet chrome; no second editor or card-in-hero pattern.
