# UI review

Verdict: pass

Candidate `cursor/css-consolidate-6faf` @ `ad724c1` vs `main`. Scope: C `styles.css` organize + evidence-gated dead removal + `?v=` only. No intentional redesign.

## Checks

- Brand tokens `--leaf` / `--beige` / `--milktea` (+ soft/deep variants) unchanged; Fraunces + Noto stacks unchanged. No purple/indigo/violet additions in the diff; removed dead rainbow hexes include a purple-ish `#b197fc` (dead chrome only).
- Formal B `apps/web/styles.css` / `apps/web/index.html` untouched.
- Live selector last-bodies: identical for all shared selectors except `@media (max-width: 759px)`, which only drops shelved `.rainbow-btn` and keeps `.settings-btn` declarations.
- Former §30b → §20b block: normalized text identical (14185 chars); winning cascade bodies for those selectors unchanged (§36 still last writer where duplicated).
- Key surfaces: `.surface-c-banner`, intro/brand, home chrome, `.alert-item.severity-*` bodies, parasite chooser (`.parasite-cal-chooser*`), `#cloud-account-card` hide — preserved. Alert alias split drops unused `.alert-critical` companions only; live `severity-${severity}` path keeps same paint.

## Findings

- [P3] §37 media — `.screen-head` selector line lost leading indent inside `@media (max-width: 759px)` (still brace-nested; no cascade/visual change) — restore two-space indent on adopt polish if desired.
- [P3] §20b cascade — move is content-identical and winners match main; residual phone glance on timeline med expand / compound chips still worthwhile before adopt (parity expected).
