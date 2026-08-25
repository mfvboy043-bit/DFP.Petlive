# Contrast: demo tutorial vs main

| | Main (A/B default) | Candidate (`?demo=1`) |
|--|--|--|
| Entry | Intro login | Skip A → B with seed |
| Persist | localStorage + optional Drive | No graph/owner/alerts/photos/labs writes; no cloud |
| Chrome | Normal topbar | Sticky「示範 · 無法儲存」+ reset / tour / exit |
| Tour | None | 5-step spotlight (session once, restartable) |

Parallel path: branch `proposal/demo-tutorial`.
