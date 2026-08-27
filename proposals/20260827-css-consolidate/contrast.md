# Contrast — Wave 3 CSS consolidate (adopted; B covered)

## Mainline (before Gate A / C candidate)

| Cluster | Location |
|---|---|
| A Section order | `6b` intro before `6` top bar; `30b` timeline-med after language; TOC thin |
| B Tail banners | §36–38 short labels; §38 still “UI↔HTML DOCK” while demo/manual trail |
| C Dead rules | Legacy stamps, rainbow-btn, cloud-account card classes, status-badge aliases still in sheet |
| D Cache | B `styles.css?v=20260827-google-gate`; C separate `?v=` |

## Candidate → adopted (`cursor/css-consolidate-6faf`)

| Cluster | Location |
|---|---|
| A | LAYER TOC; intro=`6` … language=`30`; timeline-med = `20b` after timeline |
| B | §36 purpose banner; §37 phone-override role; §38 leftovers named per surface |
| C | Evidence-gated dead-rule removal (C corpus then B corpus) |
| D | C + B `?v=20260827-css-consolidate` |
| Formal B | **covered** — `apps/web/styles.css` 8492→8310 (−182) + `index.html` |

## Gate B cover (Victor「採用、覆蓋」)

- Applied **same class of hygiene** to divergent B copy — not `cp` of C file
- B §38 = demo banner/tour + manual guide (B-only); did not import C `#cloud-account-card` hide / surface-c banner
- Dead removals re-gated against B HTML + `app.js` + shared shell/domains
- Morandi tokens / fonts unchanged; no bundler
