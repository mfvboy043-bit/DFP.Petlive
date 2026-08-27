# Pharmacist — alerts view render

Scope: AL-05 C candidate. HTML extraction only; no dose/copy semantic change intended.

## Checks

- Alert type labels still via injected `alertTypeLabel` (facade i18n)
- Severity badge keys unchanged (`alertSeverityCritical` / `alertSeverityCaution`)
- Chronic since line still via injected `chronicSinceLine`
- No diagnostic tone added in domain file

## Result

pass — presentation move only; medical strings remain facade-controlled.
