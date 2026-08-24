# Contrast: mainline vs candidate

## Candidate

`proposals/20260810-timeline-med-summary-collapse/preview/apps/web/`

## Behavior diffs

1. **Mainline**：調劑全開大模組（標題＋內含＋每藥列）。  
   **Candidate**：預設摘要列（短標＋成分＋療程）；點「展開」才見細節。
2. **Mainline**：並排「調劑藥水 A」與 badge。  
   **Candidate**：只留短標 badge，摘要以成分名為主。
3. **Mainline**：過重 compound module 框。  
   **Candidate**：輕量 summary 列 + 展開左色條。

## Files

- `app.js` / `styles.css` / `i18n.js` / `index.html`

## Reviewer verdicts

- Pharmacist: pass
- QA: pass
- UI: pass

## Merge checklist

- [x] Victor 採用
- [x] 四檔進主線、index 路徑還原
- [x] status: adopted
