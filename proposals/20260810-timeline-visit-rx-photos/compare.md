# Contrast: mainline vs candidate

## Candidate

- Path: `proposals/20260810-timeline-visit-rx-photos/preview/apps/web/`

## Behavior diffs

1. **Mainline**：醫院名純文字；佐證只在單藥列／med-proof。  
   **Candidate**：名旁「藥單」toggle，展開就診層佐證面板。
2. **Mainline**：無 visit 層照片欄位寫入入口（僅 med）。  
   **Candidate**：補傳存 `visit.bagPhoto/rxPhoto/drugPhoto`；並彙總 med 既有圖。
3. **Mainline**：先拍藥單只掛在 photo_bundle med。  
   **Candidate**：同時寫入 visit 層，面板可直接看到。
4. **Mainline**：無「本次就診藥單佐證」收合面板。  
   **Candidate**：有空狀態／補傳／更新 CTA。

## Files touched

- `preview/apps/web/app.js`
- `preview/apps/web/i18n.js`
- `preview/apps/web/styles.css`
- `preview/apps/web/index.html`

## Reviewer verdicts

- Pharmacist: pass
- QA: conditional
- UI: pass

## Merge checklist (after 採用 only)

- [x] Victor said 採用
- [x] Copy four files; restore index `./` script paths
- [x] Set proposal `status: adopted`
