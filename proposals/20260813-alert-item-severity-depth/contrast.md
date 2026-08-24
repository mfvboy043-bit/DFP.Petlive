# Mainline vs candidate

## Mainline

- Alerts-list severity rows use a flat soft wash + single border inside sections.
- Nested `.alert-section .alert-item` overrides force transparent / no-shadow surfaces.
- Emergency `.e-alerts.is-critical` already has gradient, dual inset, and tinted shadow.

## Candidate

- `severity-critical` / `severity-caution` rows gain restrained e-alerts-style depth (gradient, dual inset, light tinted shadow).
- Critical stays rose/alert; caution stays milktea/beige.
- Nested `!important` flat washes replaced so depth wins inside sections.
- Non-blocking polish: nested outer shadow may slightly out-elevate parent section plates (UI-001); left-rail contrast spot-check (UI-002).

## Files touched (candidate)

- `preview/apps/web/styles.css` only

## Adoption note

Adopted into mainline `apps/web/styles.css` (severity depth blocks only) with cache-bust `?v=20260813-alert-severity-depth`.
