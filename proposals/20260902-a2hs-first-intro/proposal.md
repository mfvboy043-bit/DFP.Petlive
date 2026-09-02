# A2HS-first intro (A page)

**Goal:** Guide mobile users to add to Home Screen before signing in; login only in standalone mode.

**Gate A:** Victor confirmed 2026-09-02.

## Scope

- `shell/display-mode.js`, `shell/install-guide.js`, `shell/install-guide.css`
- `shell/intro-cloud.js` — `paintIntroA2hsCta`, `bindIntroA2hsDone`
- `apps/web/index.html` — hero CTAs, install guide overlay, manifest
- `apps/web/app.js`, `apps/web/i18n.js`

## Non-goals

- C discussion surface (no intro screen)
- Cross-partition session sharing (platform limit)

## Acceptance

1. Mobile Safari tab:「加入主畫面」+ no login in topbar
2. Home screen icon (standalone): login visible + badge
3. Desktop browser: login as today (no A2HS gate)
