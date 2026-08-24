# QA review
Verdict: conditional

## Findings

### Weight comparison layout and state styling are removed
- ID: QA-001
- Severity: medium
- Steps: 1. Open the timeline for a pet with two or more visits that have recorded weights. 2. Inspect a later visit that renders the days-since and weight-change row. 3. Repeat at a narrow phone width and a wider desktop width.
- Expected: The comparison row remains a compact, right-aligned, wrapping flex row; its day text and up/down/same delta retain their established sizing, weight, spacing, and semantic colors.
- Actual: The candidate deletes every rule for `.tl-weight-vs`, `.tl-weight-days`, `.tl-weight-delta`, `.tl-weight-delta-mark`, and the `.is-up` / `.is-down` / `.is-same` variants, while `app.js` still emits those classes. The `<p class="tl-weight-vs">` therefore falls back to default paragraph layout/margins and its child spans lose the compact flex behavior and semantic delta colors at all widths. Evidence: these selectors are present in mainline `apps/web/styles.css` lines 4638–4680 but have no match in the candidate CSS.

### Combined visit prescription control gets amber hover border
- ID: QA-002
- Severity: medium
- Steps: 1. On a hover-capable device, open the timeline. 2. Hover a closed visit prescription toggle rendered with `class="tl-drug-notes-btn tl-visit-rx-btn"`. 3. Move the pointer away and compare its border with the resting green treatment.
- Expected: The visit prescription control preserves its green semantic treatment through hover; the amber hover border applies only to medication-notes controls.
- Actual: Both `.tl-visit-rx-btn:not(.is-open):hover` and `.tl-drug-notes-btn:not(.is-open):hover` match the combined control with equal specificity. Because the amber drug-notes rule appears later (candidate lines 4838–4840), it wins the cascade and changes the visit control's border to amber during hover.
