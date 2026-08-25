# Contrast: 20260825-design-surface-c (C → B cover)

## Mainline B (before)

1. Home topbar: brand + settings; account chip only after Google
2. Glass screen-heads: back + title (+ optional action); no shared nav/account
3. Emergency subtitle lived in glass head (crowded on mobile)
4. No What'Sub-style page nav dropdown
5. Account popover was simpler settings/logout list

## Candidate C (adopted into B)

1. Shared page nav (hamburger) + account card chrome on home and glass heads
2. Account popover: avatar/name/email, edit, plan row, primary CTA, footer actions
3. Emergency disclaimer moved into card footer (alert red); glass head title-only
4. C kept as `apps/web/c/` discussion replica (still mock account / no OAuth)
5. B restore: Google auth scripts, `petlive-*` storage, `?intro=1` for A, no design mock session

## Files covered into B

- `apps/web/index.html`
- `apps/web/styles.css`
- `apps/web/app.js`
- `apps/web/i18n.js`

## Still separate

- `apps/web/c/` remains for further discussion drafts
- Formal A↔B everyday login flow still deferred (`?intro=1` for login tests)
