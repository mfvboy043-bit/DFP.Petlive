# UI review
Verdict: conditional

## Findings

- [P2] 警示畫面密度 — 表單（類型 chips + 兩欄位）置於三分區之上，首屏在小手機可能先見表單、列表需下捲。建議可接受（編輯任務面非 landing hero）；若覺擠可把類型 chips 改單列橫滑，勿再加成卡片堆疊。
- [P3] 來源標籤 — `alert-source` 用小字色差區分 linked／owner，未用紫光輝或大 pill 群；符合克制。急診卡飼主括號亦可讀。
- [P3] 既有 `.alert-item` 白底細邊延續疫苗列互動容器模式；非行銷 hero，卡片用於可編輯列表可接受。
- [P2] 免責 `field-hint` 在表單上方——位置正確；確認行動版字級仍可讀、勿被 topbar 遮。

## Notes

- 未引入紫靛／奶油陶土／報紙風 AI 預設。
- 條件：實機確認類型 chip 點擊區 ≥ ~42px（沿用 `.chip`）。
