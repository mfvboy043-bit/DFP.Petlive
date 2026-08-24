# QA — proof clear + pending meds

Candidate: `proposals/20260811-proof-clear-pending-meds/preview/apps/web/`

## Findings

None blocking (static review against acceptance).

## Smoke checklist (for Victor)

1. Expand visit Rx → Remove on a thumb → toast → refresh / re-open → slot gone  
2. Update proof → Remove on preview → Save → timeline reflects clear  
3. Add med → back to visit → Next → pending list remains  
4. Home → new visit → pending empty  

## Note

Clearing a visit slot clears the same slot on all meds under that visit (intentional visit-level Rx).
