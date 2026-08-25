# QA review
Verdict: conditional

## Findings

### Account chip and language menu can both stay open
- ID: QA-001
- Severity: medium
- Steps: 1. On home while signed in, open the language FAB menu. 2. Click the account chip (do not click outside first). 3. Optionally reverse: open the account popover, then click the language FAB.
- Expected: Opening one overlay closes the other (single chrome menu at a time).
- Actual: Both handlers call `stopPropagation()` on their toggle clicks, so the other menu’s document `click` closer never runs. Lang menu and account popover can remain open together; Escape only closes the account popover.

### Desktop pet-switcher layout regresses mainline (out of scope)
- ID: QA-002
- Severity: medium
- Steps: 1. On mainline, open home at viewport width ≥ 1060px and note `.pet-switcher` two-column grid (picker | current). 2. Load the account-menu candidate at the same width.
- Expected: Account-menu work does not change desktop pet board layout (proposal scope is topbar chip/popover only).
- Actual: Candidate rewrites the `LARGE DESKTOP HOME` block to `.pet-switcher { display: block }` and drops the mainline grid / picker overflow rules, changing pet-switch interaction layout on wide screens.

### Broken Google avatar hides letter fallback
- ID: QA-003
- Severity: low
- Steps: 1. Sign in so `session.profile.picture` is a non-empty URL. 2. Force the image to fail (block `lh3.googleusercontent.com`, or point picture at a 404). 3. View the home chip and open the popover.
- Expected: When the photo cannot load, the initial/silhouette fallback is shown (proposal: missing image must not break the control).
- Actual: `setAccountAvatar` hides the fallback whenever `picture` is truthy and never attaches `onerror`, so a failed load leaves an empty/broken image with no letter fallback. Chip name and menu actions still work.
