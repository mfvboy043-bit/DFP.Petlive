# Pharmacist review
Verdict: pass

## Findings
- [MED-001] [low] `domains/parasite/controller.js` `getParasiteStatus` — contracts say `daysUntil(nextDue) <= 0` → `unprotected`, but candidate (and pre-extract mainline B) use `days < 0` unprotected so **due today (`0`) stays `approaching`**. The **7-day** approaching window itself matches contracts (`<= 7`). Advisory: reconcile contract text vs lamp rule in a later docs/behavior slice; do not change in this zero-behavior extract unless Victor expands scope.

## Notes
- Light review only (PA-01..PA-04): catalog intervals, dual-cover sync, domain tone, approaching window — **not** a dose/med review.
- **Product catalog** matches mainline B: keys `ppRevolution` / `ppFrontline` / `ppAdvantix` / `ppNexGardSpectra` / `ppMilbemax` / `ppProHeart`; intervals **30** (all monthly) and **365** (ProHeart only); dual covers = Revolution + NexGard Spectra. Kind chip lists unchanged. Intervals are reference tracking defaults, not clinical dosing authority.
- **Dual-cover sync:** `saveParasiteKind` with dual `productKey` mirrors the full record onto the other slot; exclusive products leave the other slot alone; empty/custom `productKey` does not sync. Matches pre-extract semantics; `syncDual` opt-out available.
- **Domain tone:** no diagnosis / treatment-authority / prescribe copy in `controller.js` or `selectors.js`; product labels stay injected via `labelOf` (C `t()`). Slot statuses are tracking lamps only (`protected` / `approaching` / `unprotected` / `optional`).
- **Cat heartworm optional:** unset (no `nextDue`) → `optional`; set records use normal status — aligns with contracts.
- `APPROACHING_DAYS === 7` exposed and used consistently; boundary tests cover status / dual / optional paths.
