# UI review

Verdict: conditional

## Findings

- [UI-001] [P2] timeline / i18n (en) — `visitWeightDaysSince` (“{days} days since last visit”) is much longer than zh/ja compact peers and fights the “compact vs-previous note” brief on narrow phones (right-aligned wrap under `.tl-item` can dominate before tags). Shorten EN to match density (e.g. “{days} days since last” or “Last visit · {days}d”).
- [UI-002] [P3] timeline / i18n (en) — `visitWeightIncreased` / `visitWeightDecreased` start lowercase while `visitWeightSame` is “Same”; uneven standalone chrome. Prefer “Increased {kg} kg” / “Decreased {kg} kg”.
- [UI-003] [P3] `.tl-weight-vs` — `font-size: 0.7rem` has no mobile polish bump; readable as secondary to `.tl-weight` (0.72rem) but near the phone floor. If passport scanning feels thin, bump ~0.75–0.78rem under `@media (max-width: 759px)`.

## Notes (non-blocking)

- Stays inside `.tl-item` / `.tl-weight` language: one `<p class="tl-weight-vs">` under `.tl-clinic-row`, no new card chrome, no purple/glow, tokens `--leaf-deep` / `--alert` / `--text-muted`.
- Gain / loss / same pair mark + text (`↑`/`↓`/`=` aria-hidden); not color-only. Copy is factual (increase/decrease/same/days) — no diagnostic tone.
- Hierarchy: visit weight stays on the clinic row; vs line is quieter, flex-end-aligned with the weight. First visit stays empty; missing weight quiet-omits delta only.
- All four locales have the new keys (zh-Hant / en / ja / ko). No new motion.
