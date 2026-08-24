---
id: 20260813-timeline-compact-control-depth
title: "Timeline compact control depth and state refinement"
status: adopted
author: planner
candidate_branch: ""
candidate_path: "proposals/20260813-timeline-compact-control-depth/preview"
created: 2026-08-13
updated: 2026-08-13
---

# Proposal: Timeline compact control depth and state refinement

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Make the active timeline's compact clickable controls read as tactile, pressable buttons while preserving their small footprint and secondary hierarchy. Use the existing emergency quick-nav treatment as a restrained reference for border, gradient, inset highlight, shadow, and pressed movement; keep static timeline tags visibly non-interactive.

## In scope

- Refine the shared compact timeline button family in CSS, explicitly covering `.tl-weight.tl-weight-pending`, `.tl-visit-rx-btn`, and `.tl-drug-notes-btn`.
- Preserve each control's existing semantic color family and open-state meaning while adding restrained dimensional cues derived from `.e-quick-nav`: a clearer edge, subtle surface gradient/inset highlight, compact shadow, and short state transitions.
- Add coherent `:hover`, `:active`, and `:focus-visible` feedback appropriate to pointer, touch, and keyboard use. Active/open states must remain distinguishable from transient hover/press states.
- Keep existing control dimensions, pill geometry, typography, wrapping behavior, and timeline hierarchy substantially unchanged.
- Give non-clickable `.tl-tag` elements a more visible border without cursor, elevation, movement, focus, or other button-like feedback.
- Check all current `.tl-drug-notes-btn` usages so the shared refinement remains suitable wherever that class appears, including timeline medication notes and visit prescription toggles.
- Respect reduced-motion behavior if the existing global motion handling does not already cover the new transitions.

## Out of scope

- Changes to HTML, JavaScript behavior, DOM structure, ARIA attributes, copy, i18n, timeline data, medication data, or medical logic.
- Redesigning full-size buttons, emergency quick-nav itself, timeline cards, medication panels, weight forms, or static source/status tags outside `.tl-tag`.
- Increasing the compact controls into primary calls to action or making every timeline pill/tag visually pressable.
- New icons, animations, tokens, components, or broad CSS refactors.
- Any change to medical disclaimer language, diagnostic tone, dose, frequency, duration, source attribution, or evidence state.

## Likely files

- `apps/web/styles.css` — expected only product file; refine the existing timeline selectors and their interaction states.

## Risks

- Excess shadow, contrast, or movement could make secondary timeline controls compete with the visit content or resemble primary actions.
- Applying the shared `.tl-drug-notes-btn` treatment without checking every usage could produce inconsistent contrast, clipping, or open states in medication contexts.
- The combined `.tl-drug-notes-btn.tl-visit-rx-btn` selector may inherit overlapping declarations; specificity and state ordering must preserve the intended green visit-control treatment.
- A stronger `.tl-tag` border could accidentally suggest interactivity if paired with elevated surfaces, hover feedback, or overly button-like contrast.
- Hover-only affordance would not help touch users; baseline depth and `:active` feedback must communicate pressability without relying on hover.
- Focus styling must remain clearly visible against default and `.is-open` surfaces and must not be clipped by nearby timeline layout.
- Visual changes must not imply medical authority or alter how medication information and pending weight data are interpreted.

## Acceptance criteria

- [ ] `.tl-weight.tl-weight-pending`, `.tl-visit-rx-btn`, and `.tl-drug-notes-btn` have a restrained dimensional resting surface inspired by `.e-quick-nav`, while retaining compact height, padding, pill shape, typography, and secondary hierarchy.
- [ ] Default, hover, active/pressed, keyboard `:focus-visible`, and `.is-open` states are visually coherent; open state remains unambiguous after pointer release.
- [ ] Hover feedback is limited to hover-capable interaction where appropriate, touch press feedback works through `:active`, and motion is subtle or suppressed for reduced-motion users.
- [ ] The combined visit prescription button (`.tl-drug-notes-btn.tl-visit-rx-btn`) retains its green semantic treatment rather than unintentionally inheriting the amber medication-notes appearance.
- [ ] All current shared-class contexts remain legible, unclipped, and visually consistent at narrow phone widths and wider layouts.
- [ ] Static `.tl-tag` items have a clearly more visible border but no pointer cursor, hover lift, pressed movement, focus treatment, shadow, or other interactive cue.
- [ ] No functionality, click target behavior, DOM, ARIA, copy, i18n, medical content, or data changes.
- [ ] Implementation is limited to `apps/web/styles.css` unless an inspection-backed blocker is brought back to Victor before scope expands.

## Notes for Victor

The proposed distinction is intentional: compact controls gain restrained edge/highlight/shadow and interaction states; static category tags gain only a clearer flat border.

Gate B modification (2026-08-13): preserve the current mainline weight-comparison presentation in the candidate and keep the combined visit prescription button's hover border in its green semantic family before adoption.

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
