# QA review
Verdict: pass

Candidate: `cursor/css-consolidate-6faf` @ `ad724c1`  
Scope checked: C `styles.css` hygiene + evidence-gated dead-rule removal; `c/index.html` `?v=` bump only. Formal B untouched. Zero-build serve.

## Checks

- Stylesheet load: `python3 -m http.server` → `/apps/web/c/` HTTP 200; link `./styles.css?v=20260827-css-consolidate` → CSS HTTP 200 (`text/css`). Formal B still on separate `apps/web/styles.css` + unchanged `?v=20260826-google-gate`.
- Product JS: no `.js` in commit; only `c/index.html` product HTML change is the `?v=` bump.
- Declaration drift: shared selectors between pre/post `ad724c1` have **0** property/value changes (moves/comments/deletes only; shared-selector splits keep prior decls for survivors e.g. `.settings-btn`, `.parasite-actions`, `.alert-item.severity-*`).
- Dead-rule list vs C corpus (`c/` HTML+JS, `shell/`, `domains/`, `core/`, `runtime/`, `auth/`, shared `app.js` / `i18n.js` / etc.): all builder-listed removals absent from HTML/JS string usage.
- Live replacements still styled: `parasite-cal-chooser-actions`, parasite/vaccine `is-protected|is-approaching|is-expired|is-unprotected`, `app-nav-label`, `settings-btn` (+ mobile 40px rule), `alert-item` + `severity-critical|severity-caution`, `alert-severity-badge.is-critical|is-caution`, `#cloud-account-card{display:none}` retained.
- §20b move: med/compound block present once; §36 JS HOOK COMPAT body kept; no missing critical hook classes spotted for dynamic markup (`severity-${…}`, `is-${severity}`).

## Findings

None.
