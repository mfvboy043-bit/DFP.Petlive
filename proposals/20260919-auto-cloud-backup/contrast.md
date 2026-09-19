# Contrast — 20260919-auto-cloud-backup (iteration 1)

Candidate: `.worktrees/auto-cloud-backup` · `proposal/auto-cloud-backup`  
Mainline: current checkout (untouched `apps/web` for this slice)

| | 現行正式 B | 候選 |
|--|--|--|
| 寫入後 | `scheduleCloudBackup` 1.8s，但 **沒有 Drive GIS session 就略過** | 同一 debounce 進 `domains/cloud/scheduler.js`；無 Drive 標記 pending，不假備份 |
| 開機 dirty | 不 pull 也不 push，等按鈕 | 有 Drive → silent **push**；仍 **不 pull** |
| 離開分頁 | 只 flush 照片 | 有 Drive 時一併 flush 待備份 JSON |
| Drive 授權 | 每次都要按「同步到雲端」才 `ensureDriveAccess` | **G1：** 按一次「開啟自動備份」後該 session 自動上傳；鈕改 retry |
| Silent 路徑 | 不彈 GIS | 仍不彈 GIS（一彈窗法） |
| C | stub / 無 GIS | 同一 scheduler，transport no-op |

**Security diff scan (2026-09-19, orchestrator):** High none.

- C2: 仍 `drive.file`；未加 G2 scopes  
- C3: token 仍 `sessionStorage`；`auth/google-drive.js` 未改存放  
- I1: scheduler demo no-op  
- I2: dirty 不 auto-pull  
- A2 / L1: push 失敗不 `applyCloudPayload`  
- L2: 登出清 token、不刪本機寵物  
- H1: 無 Phase 2 寵物列 / RLS  
- Silent / flush / boot 無 `ensureDriveAccess`（僅 popover 同步／還原）
