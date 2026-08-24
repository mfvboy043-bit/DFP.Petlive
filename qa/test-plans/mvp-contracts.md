# MVP Contract Test Plan

Automated coverage required by contracts §9 plus fault isolation:

1. Medication `complete` field/enum validation; `pending_drug_name` may omit drug name
2. Visit create syncs PetWeight with matching weight + sourceVisitId
3. Emergency Card filters complete, non-expired medications via durationDays
4. Drug search hits same drug via zh / en / alias
5. Fault injection: Alert module failure must not break Pet / Timeline access
6. Vaccine lamp: protected / approaching (≤90 days) / expired
7. Cat heartworm unset = optional, not unprotected alarm
