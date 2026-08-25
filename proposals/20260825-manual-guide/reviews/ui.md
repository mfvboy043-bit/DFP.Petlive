# UI review
Verdict: conditional

Candidate guide page matches the intended What'Sub-like reading structure (GUIDE eyebrow → misconception → five steps → boundaries → FAQ → end CTAs) and stays inside Petlive sage/beige tokens—no purple-indigo, no broadsheet, no glow, no decorative card stacks on the steps. Brand sits correctly in B chrome via screen-head + title. Conditional on CTA hierarchy, floating-head clearance for long titles, and FAQ affordance polish.

## Findings

- [UI-001] [P2] CTA footer — Four full-width stacked actions (primary + alt home/add swap + demo + disabled tour) flatten hierarchy. Proposal called for one context-switched primary, demo as secondary, and a clearly reserved tour. Alt uses the same `btn-ghost` weight as demo, so the footer reads as a button stack rather than one clear next step. Suggestion: keep a single primary; demote the alternate home/add to a text link (or hide when redundant); keep demo visually quieter than primary; leave tour visibly reserved (current “即將開放” is good).

- [UI-002] [P2] screen-head / first viewport — GUIDE eyebrow + long page titles (especially EN/JA) sit inside the shared pill glass head (`border-radius: 999px`) while clearance still assumes `--e-head-float-h: 60px`. On narrow phones a wrapping title can make the head taller than reserved space so the misconception lead tucks under chrome. Suggestion: raise float height for `screen-manual`, move the GUIDE eyebrow into the body under the head, or soften pill radius when the head is multi-line.

- [UI-003] [P2] FAQ accordion — Native `<details>` is the right pattern; `+` / `–` affordance is present but `summary::after` uses `float: right` (fragile when questions wrap) and `.manual-faq-item { overflow: hidden }` can clip focus rings. Summary padding (~14px) sits near but under `--tap` (48px). Suggestion: layout summary as flex (label + chevron), set `min-height: var(--tap)`, and keep focus-visible outlines unclipped.

- [UI-004] [P3] FAQ body type — Answer copy is 13px vs 14px step body; fine for short lines, a bit tight for multi-sentence FAQ on mobile. Suggestion: match step body at 14px / ~1.5 line-height.

- [UI-005] [P3] Boundaries block — “是／不是” differs mainly by muted color with no label cue, so the negation is easy to skim past. Suggestion: light prefix (“是” / “不是”) or slightly stronger weight contrast—still no card wrapper.

## Notes (non-blocking)

- Misconception panel is a single soft callout (token gradient + hairline)—acceptable lead emphasis, not a card farm.
- Step list is correctly non-card: number + title + one short body.
- Tour CTA disabled + “即將開放” meets reserved-entry intent.
- Motion is limited to existing screen-in; FAQ has no decorative animation noise.
- Four locales carry guide strings; chrome typography stays on Noto / Fraunces (not Inter/Roboto defaults).
