# QA review

Verdict: conditional

## Findings

### 補傳後面板預設收合
- Severity: low
- Steps: 1. 點藥單→補傳→儲存 2. 回到時間軸
- Expected: 可見新圖（提案未強制自動展開）
- Actual: 需再點「藥單」展開 — 可接受；若要自動展開可後續加

### 僅 visit 層新圖、med 列縮圖仍空
- Severity: medium
- Steps: 1. 只從醫院名旁補傳 2. 看單藥列
- Expected: 藥單面板有圖；單藥列未必有「已有佐證」按鈕狀態
- Actual: 依設計 visit 與 med 分離 — 文件化即可，勿當 bug

### 主線未改
- Severity: low（流程）
- Steps: 開 `apps/web` 時間軸
- Expected: 仍無「藥單」按鈕
- Actual: 應無 — 採用前正確

## Notes

建議實機點一次：展開／收合、補傳取消返回、多 visit 各自獨立。
