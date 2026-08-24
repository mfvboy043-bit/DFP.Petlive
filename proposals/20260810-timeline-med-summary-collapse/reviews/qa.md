# QA review

Verdict: pass

## Findings

### 展開／收合
- Severity: low
- Steps: 點摘要「展開」→ 見成分劑量 →「收合」
- Expected: aria-expanded 與面板 hidden 同步
- Actual: 應正常（實機點一次確認）

### 備註鈕在展開內
- Severity: low
- Steps: 展開調劑 → 點某成分「備註」
- Expected: 不誤觸發摘要收合
- Actual: 備註在 detail 內、與 summary button 分離 — OK

### 主線未改
- Severity: low
- Steps: 開 apps/web 時間軸
- Expected: 仍為舊全開模組
- Actual: 採用前應如此

## Notes

無存檔路徑變更。
