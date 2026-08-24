---
id: 20260813-alert-item-severity-depth
title: "Alerts list severity depth — match emergency .e-alerts"
status: adopted
author: planner
candidate_branch: ""
candidate_path: "proposals/20260813-alert-item-severity-depth/preview"
created: 2026-08-13
updated: 2026-08-13
# Builder: CSS-only depth on preview/apps/web/styles.css (iteration 0)
---

# Proposal: Alerts list severity depth — match emergency .e-alerts

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

Give Alerts-screen list rows `li.alert-item.severity-critical` and `li.alert-item.severity-caution` the same restrained dimensional / 立体 language already proven on emergency `section.e-block.e-alerts.is-critical`: clearer border, soft vertical gradient surface, dual inset highlights, and a light tinted outer shadow — without redesigning the alerts screen or touching medical copy, data, or interaction logic.

## In scope

- Port depth cues from `.e-alerts` / `.e-alerts.is-critical` (and the parallel `.e-alerts.is-caution` stack) into the alerts-list severity variants, primarily via the nested overrides that currently flatten them:
  - `.alert-section .alert-item.severity-critical`
  - `.alert-section .alert-item.severity-caution`
- Also align the standalone plate rules for the same severity classes (`.alert-item.severity-critical` / `.severity-caution`, including legacy `.alert-critical` / `.alert-caution` aliases if they share the same surface) so critical/caution surfaces stay consistent wherever those classes render.
- Keep each severity’s existing semantic color family:
  - **Critical** → alert/rose tokens (`--alert-border`, `--alert-soft`, red-tint shadow) matching `.e-alerts.is-critical`.
  - **Caution** → milktea/beige tokens (`--milktea`, `--beige-soft`) with analogous gradient + inset + soft shadow, not a blind copy of the red emergency glow.
- Preserve left rail (`::before`), typography, badges, actions, spacing, border-radius, and list hierarchy; depth is additive surface treatment only.
- CSS-only change; verify narrow-phone rules under the existing `@media` block that retouches `.alert-item` padding do not undo the new depth.

## Out of scope

- HTML, JS, DOM structure, ARIA, i18n, medical copy, alert data model, severity assignment, edit/delete flows, or source tags.
- Redesigning the full alerts screen (section plates, empty states, filters, headers, count button).
- Changing `.e-alerts` itself, emergency quick-nav, or non-severity / default `.alert-item` plates beyond what’s required so severity variants are not overridden flat by `.alert-section .alert-item`.
- New design tokens, components, icons, motion systems, or broad CSS refactors.
- Any change to disclaimer language, diagnostic tone, dose UX, or evidence/source presentation.

## Likely files

- `apps/web/styles.css` — expected only product file.
  - Source reference: `.e-alerts` (~2227), `.e-alerts.is-critical` / `.is-caution` (~4411–4443).
  - Target: nested severity wash (~1659–1675) and/or plate severity blocks (~4100–4122); mobile padding near ~5694 as needed for consistency only.

## Risks

- Nested `.alert-section .alert-item` uses `!important` to force flat transparent/wash surfaces; Builder must raise specificity or replace those overrides carefully so depth actually wins without fighting the base plate rules.
- Over-strong shadow/gradient on list rows could compete with section plates or make every alert look like a primary emergency callout; keep cues restrained and row-scale (not full `.e-alerts` block scale).
- Caution must stay visually distinct from critical; applying red inset/shadow to caution would blur severity hierarchy.
- Left accent rail + stronger bordered surface must remain legible together (no clipping, no double-border muddiness).
- Visual elevation must not imply medical authority, urgency escalation beyond existing severity, or change how allergy/chronic labels are read — presentation only.
- Pharmacist review can be skipped for pure surface CSS if copy/data untouched; UI + light QA (list still editable, badges readable) remain relevant.

## Acceptance criteria

- [ ] On the Alerts screen, `li.alert-item.severity-critical` (e.g. 藥物過敏) shows restrained dimensional treatment: severity-tinted border, soft vertical gradient (or equivalent surface), inset highlight(s), and light tinted shadow — clearly closer to `.e-alerts.is-critical` than today’s flat soft wash.
- [ ] `li.alert-item.severity-caution` (e.g. 慢性病) receives the same *depth language* in the milktea/beige family, still clearly secondary to critical.
- [ ] Default / non-severity alert rows and surrounding `.alert-section` chrome are unchanged in role and layout; no full-screen redesign.
- [ ] Left rail, type color, badges, meta, and action controls remain readable and usable at phone and desktop widths.
- [ ] No HTML/JS/i18n/copy/data/interaction changes; candidate stays off mainline (`proposal/…` or `proposals/…/preview`).
- [ ] Implementation limited to `apps/web/styles.css` unless an inspection-backed blocker is returned to Victor before expanding scope.

## Notes for Victor

Inspected gap: `.e-alerts.is-critical` already has gradient + dual inset + tinted shadow; Alerts-list severity items are flattened by `.alert-section .alert-item` overrides to a soft wash + single border. This proposal ports the former language onto the latter severity variants only.

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
