# UI review
Verdict: conditional

Scope: `apps/web/c/` — `index.html` surface-c banner markup + `.surface-c-banner` in `styles.css`, vs home topbar / brand hierarchy and B confusion risk. No code changes.

## Findings

- [UI-001] [P1] chrome / mobile — `.surface-c-banner` and `.topbar` / fixed `.screen-head` share nearly the same top inset (`max(8px|10px, safe-area-inset-top)`) while the banner sits at `z-index: 80` over chrome at `45`. The label is centered on the glass bar, so on phone it reads as a second pill stacked on the topbar (and can clip the trailing end of `.brand-mark` when the title ellipsizes). Home / detail `padding-top` only reserves the topbar row — nothing for a stacked C strip. Suggestion: stack the C mark **above** the floating chrome (or pin it to a non-center corner / integrate as a small chip inside the topbar), bump chrome `top` and screen `padding-top` by the banner height + gap, and keep one shared safe-area math so notch devices never double-claim the same band.

- [UI-002] [P2] C vs B glanceability — Copy「C · 討論版」is clear and short, and document title / path help, but the chip’s cream glass + `border-radius: 999px` matches the topbar language so it can read as chrome decoration rather than a surface identity signal. If it stays tiny and centered on the bar, a quick glance may not scream “this is C, not B.” Suggestion: keep the same short string, but give it a slightly distinct treatment (stronger ink, thin top-edge strip, or left-aligned rail chip) so C is obvious without adding more words or a second marketing banner.

- [UI-003] [P3] banner clarity vs clutter — Markup is restrained (one status line, `pointer-events: none`, no extra badges/CTAs). That meets the “clarity without clutter” goal for copy. No further content needed; fix layout (UI-001) before considering any larger banner.

## Notes (non-issues)

- Brand / home hierarchy: hero still owns「火龍果護照」+ lede + mascot; the 11px muted chip does not compete with brand-first home composition or hero budget.
- B mainline (`apps/web/`) has no equivalent banner — once overlap is fixed and contrast is slightly distinct, C should not be visually confuseable with B.
- Fonts stay on existing Fraunces / Noto stack; no purple-indigo / cream-terracotta / broadsheet pivot introduced by the C chrome alone.
