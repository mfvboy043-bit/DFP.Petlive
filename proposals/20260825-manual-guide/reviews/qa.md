# QA review
Verdict: conditional

## Findings

### Demo mode treats seed pets as empty account on manual CTAs
- ID: QA-001
- Severity: medium
- Steps:
  1. Open formal B, open menu → 說明書 (confirm guide loads without `?demo=1`).
  2. Tap「體驗範例護照」and land on `?demo=1` with seed pets.
  3. Open menu → 說明書 again.
  4. Read primary CTA label and tap it; optionally fill add-pet and submit.
- Expected: With demo seed pets present, primary CTA is「回到護照」/`manualCtaHome` → `home`. Add-pet is not framed as the empty-account primary path.
- Actual: `paintManualScreen` uses `!pets.length || isSeedOnlyPets(pets)`, so DEMO seed matches “empty”. Primary becomes「去新增寵物」→ `add-pet`. Submit is blocked by demo read-only capture (toast), so the CTA is a dead-end.

### Manual header「返回」always forces home (not history back)
- ID: QA-002
- Severity: low
- Steps:
  1. From home open 疫苗 or 時間軸 (any non-home screen with `data-back`).
  2. Open menu → 說明書.
  3. Tap header ← (`aria`「返回」).
- Expected: Return to the previous screen (nav history / `data-back`), matching other menu destinations such as 醫療警示.
- Actual: Manual header uses `data-go="home"`, so ← always goes home and pushes `manual` onto history instead of popping. (Same pattern as emergency/add-visit; still mismatches「返回」when entered from a deep screen.)

## Acceptance spot-check (no defect)

- Menu「說明書」→ `go("manual")`; dedicated `?demo=1` listener removed; `nav-manual-btn` has `data-go="manual"`.
- Screen markup: misconception + 5 steps + boundaries + FAQ `<details>` + CTA footer; tour control `disabled` /「即將開放」; no manual spotlight wiring.
-「體驗範例護照」is `<a href="?demo=1">`.
- `manual` absent from `needsPet`; empty formal account primary CTA → `add-pet`.
- Manual i18n keys present for `zh-Hant` / `en` / `ja` / `ko` (34 keys); language change re-paints CTAs when manual is active.
