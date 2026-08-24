---
id: 20260812-ui-align-optimize
title: UI 對齊檢視與優化
status: proposed
author: planner
candidate_branch: ""
candidate_path: ""
created: 2026-08-12
updated: 2026-08-12
---

# Proposal: UI 對齊檢視與優化

Companion: `state.yaml`（v2 gate / iteration 來源）。

承接 `proposals/20260812-ui-html-dock`（六職能：urgency / trust / emergency / home presence / form calm / desktop path）。Victor 已選 **dock-not-revert**；本輪是 **對齊檢視 + 精修**，不是再做一次換皮或倒退舊 CSS。

## Goal

把 `index.html` 結構、`app.js` 已 emit 的 class、與 `styles.css`（UI v2 + §36 compat + §37 mobile + §38 dock，約 4670 行）的對應關係清乾淨：修 **對不齊／死規則／疊層互打**，並在既有 hooks 上做 **高槓桿視覺優化**（手機優先、護照節奏、急診可讀、信任識讀），讓 CSS 單一真相來源更靠近 §38，而不是繼續往檔尾堆 override。

---

## Short alignment audit

| Area | Status | Note |
|---|---|---|
| Pet picker `.pet-option` cards + lift/select | **Aligned** | §36/§37 明確禁止 pill；手機 stack CTA 已對 |
| Parasite strip `is-protected\|approaching\|unprotected` | **Aligned** | JS ↔ §38 狀態色對得上 |
| Alert list `alert-item.severity-*` + `alert-source.is-owner\|is-linked` | **Partial** | JS 正確 emit `severity-*`；仍殘留死名 `.alert-critical`／雙重規則（§17/§36/§38） |
| Vaccine pills `pill-ok\|soon\|expired\|history` | **Partial** | pill 有色；列表 `<li>` 常無狀態 class；`is-superseded` **無 CSS** |
| Emergency `.e-card` / `.e-alerts.is-*` / vax nav | **Partial** | 緊迫色對了；卡面仍偏玻璃／儀表板裝飾，非讀優先 |
| Med tags `.tag-owner\|tag-owner-proof\|tag-clinic-ref` | **Partial** | 有色差；§16 `.owner-stamp`／`.clinic-stamp` 死碼；診所用 leaf 綠有「已驗證」誤讀風險 |
| Timeline `.tl-item` / compound / proof | **Partial** | 主結構有樣式；`tl-visit-rx-empty`／remove、部分 proof 細類偏弱 |
| Photo crop | **Aligned** | hooks + `html.is-photo-crop-open` 有對 |
| Archive / manage chrome | **Missing / Partial** | `.pet-archive-btn` **完全無 CSS**；`.archive-item`／empty 靠泛用 `li` |
| Interaction states | **Missing** | JS 有 `is-updating`、`is-dragging`，CSS 無回饋 |
| Dead / wrong CSS names | **Conflicting leftover** | `.alert-critical`、`.badge-*`、`.status-badge`、stamp 別名與真實 hooks 脫鉤 |
| CSS layer stack §1–38 | **Conflicting** | 同 selector（`.e-card`、`.alert-item.severity-*`、`.pet-option`、`.parasite-row`）重複 3–4 層 + `!important` |

---

## Findings（P0 / P1 / P2）

### P0 — 修對齊或誤讀風險（本輪應先做）

| ID | Gap | Evidence |
|---|---|---|
| F1 | **CSS 層堆疊互打**：§17 死名 + §36 dual-target + §38 dock 對同一警示／急診／pet 規則重複覆寫（含 `!important`） | `.alert-item`／`.e-card`／`.parasite-row` 各出現約 10–18 次 |
| F2 | **死／錯名仍當權威**：`.alert-critical`、`.alert-caution`（JS 從不 emit；真實為 `severity-*`）；`.owner-stamp`／`.clinic-stamp`／`.source-stamp`；`.badge-*`／`.status-badge` | HTML/JS 無對應；§38 仍掛 stamp 別名 |
| F3 | **Trust：診所綠 ≈ 驗證感**：`.tag-clinic-ref`／死碼 `.clinic-stamp` 用 `--leaf`；與「印章 ≠ 醫療已驗證」職能衝突 | §16 + §38 trust block |
| F4 | **`.pet-archive-btn` 無樣式**：管理模式 JS 會輸出 archive 熱點，CSS 只做了 `.pet-remove-btn` | `app.js` render pet-option；styles 無 `pet-archive` |

### P1 — 高槓桿優化（對齊六職能，不改行為）

| ID | Gap | Opportunity |
|---|---|---|
| F5 | **Emergency 仍偏 dashboard-y** | 降低玻璃／重陰影／裝飾層；強化 `.e-card-top`／姓名／警示區塊字級層級；quick-nav 視覺降權 |
| F6 | **Home hero 節奏** | 手機首屏品牌 + 寵物在場再精修（lede／switcher 呼吸）；避免 cream 儀表板回潮（§37 已擋一批，需守住） |
| F7 | **Alert 列表層級** | 合併為單一 severity 規則來源；強化 type／badge／source 掃描順序 |
| F8 | **Timeline／med 卡冷靜** | 減少後台列表感；compound／proof 區與 visit 正文層級更清楚 |
| F9 | **Vaccine 列對齊不足** | `is-superseded` 無樣式；活躍列無 row tone（僅靠 pill）— 可純 CSS 補強，不改 JS |
| F10 | **Desktop ≥760 enrichment 漏感** | §32–33 + §38 尾段並存；釐清「桌面加值不回灌手機」的單一寫法 |

### P2 — 弱 CSS／可刪或可補（低風險）

| ID | Gap |
|---|---|
| F11 | 結構 class 幾乎無專屬樣式：`.e-card-top-main`、`.alert-form-actions`、`.pending-compound-hint`／`label`、`.med-photo-lede`、`.med-proof-form`、`.e-owner-empty`、`.e-pet-photo-pen`、`.tl-visit-rx-empty`／`remove` |
| F12 | `.archive-item`／`.archive-empty`／`.archive-item-photo` 僅吃 `.archive-list > li` 泛用規則 |
| F13 | `.is-updating`、`.is-dragging` 無視覺回饋 |
| F14 | `.breed-chips`、`.parasite-interval-chips` 可繼續吃 `.chips`（無需強加 class 規則，除非要區隔密度） |

---

## In scope

- 主改 **`apps/web/styles.css`**：
  - 對齊真實 hooks（以 JS/HTML 為準）。
  - **Consolidation**：把 urgency／trust／emergency／home／form／desktop 的權威規則收斂到接近 §38（或明確「§38 = SoT，刪／折疊上游重複」）；減少 `!important` 互打。
  - 可刪死 CSS（錯誤 class 名、未使用 stamp／badge 別名）— 刪前對照本 Findings。
  - 優化：急診讀優先、首頁手機節奏、警示／時間軸／用藥卡冷靜、信任色（診所 ≠ mint 驗證）、桌面 enrichment 不漏下手機。
- **`index.html`**：僅 cache bust；極少數展示用 class **僅在純 CSS 無法表達時**（須寫進 Builder 清單）。
- 可選：為 archive／manage 熱點補齊既有 class 的樣式（仍不改 JS）。

## Out of scope

- **`app.js` 行為**（含改 emit class 名稱、severity 多步 UX、資料寫入）。
- Home **dashboard v2**、severity 多步「發生什麼／ER／證據」模型。
- Source／verification **資料模型**拆分。
- `i18n.js` 文案結構、drugs DB、`contracts/` 語意變更（token 名稱若僅註解對齊可提，不改 severity 契約）。
- 整包退回舊 CSS 或再做與 hooks 脫鉤的全站換皮。

## Likely files

| File | Role |
|---|---|
| `apps/web/styles.css` | 主戰場：對齊、刪死碼、收斂層、視覺優化 |
| `apps/web/index.html` | Cache bust；極少 class（可選） |
| `proposals/20260812-ui-align-optimize/` | 本提案 + 之後 contrast／preview 註記 |

不碰：`app.js`、`i18n.js`、drugs／modules、contracts 語意。

## Risks

- **Medical／severity 誤讀**： consolidation 時弄亂 `severity-critical` vs caution／rose；紅必須只留給 critical。
- **Trust 誤讀**：診所色若仍偏「通過綠」，會強化錯誤驗證感；應與 owner milktea 對比清楚、且 **不**用 safe-mint 當診所語意。
- **回歸手機**：誤把桌面 flex CTA／pill pet／密網格規則漏回 `<760px`。
- **刪死碼過猛**：某些 dual-target 是防舊 markup；刪前確認無外部／舊 cache 依賴（本 app 以現行 JS 為準即可，仍建議分批刪）。
- Disclaimer／劑量：只動呈現，不暗示診斷或治療權威。

## Acceptance criteria

### Alignment

- [ ] 警示視覺只認 `.alert-item.severity-critical|caution`（死名 `.alert-critical` 等已刪或不再當權威）。
- [ ] Trust：`.tag-owner*` vs `.tag-clinic-ref`／`.alert-source.is-owner|is-linked` 可辨；綠／mint **不**表示醫療已驗證。
- [ ] `.pet-archive-btn` 在 manage 模式下可視、可點、不壓扁 `.pet-option`。
- [ ] Parasite／vaccine pill／emergency alert tone 與 dock 六職能一致；無新的 broad `.is-critical` 誤傷。

### Polish（mobile-first）

- [ ] `.e-card` 讀優先：姓名／警示層級清楚；quick-nav 不搶主摘要。
- [ ] Home：品牌 + 寵物在場節奏；CTA 手機全寬直向 stack；`.pet-option` lift／select 正常。
- [ ] Timeline／pending med／compound 區更冷靜、較少 admin-console 感。
- [ ] Desktop ≥760 加值不破壞上述手機行為。

### Process

- [ ] 候選在平行路徑；主線不覆寫「先給你看」。
- [ ] 不改 `app.js` 行為；若任何 HTML class 新增，列在實作清單。

## Notes for Victor

- 策略延續 dock：**升級對齊，不換皮、不倒退**。
- Findings 表即 Builder 優先序；Gate A 可「修改：只做 P0」或「P0+P1」縮放範圍。
- 本輪最大槓桿通常是 **CSS 收斂 + 急診／信任／archive 熱點**，不是再疊一節 §39。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
