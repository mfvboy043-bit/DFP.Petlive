---
id: 20260812-ui-html-dock
title: UI 對接既有 HTML（升級不換皮）
status: candidate_ready
author: planner
candidate_branch: ""
candidate_path: "apps/web (mainline — Victor 直接修改)"
created: 2026-08-12
updated: 2026-08-12
---

# Proposal: UI 對接既有 HTML（升級不換皮）

Companion: `state.yaml`（v2 gate / iteration 來源）。

## Goal

**不要**退回舊 CSS、也**不要**再做一次 wholesale UI System v2 換皮。改為：**UI 對接（dock）既有 HTML／JS hooks**——HTML 負責結構與互動；CSS（+ 極少數必要 class）負責意義、信任、緊迫感與護照隱喻，並在手機上修正 v2 衝突造成的回歸。

本輪先寫清「UI 該達成什麼」（對標），再依現有 `index.html` 的 `data-screen` / `data-go` / `data-i18n` 與 `app.js` 已輸出的 class，做 **in-place 升級**。

---

## A. Job split（對標）

| Layer | Job |
|---|---|
| **HTML** | 結構、導航、表單、資料 hooks、i18n chrome、醫療資訊順序 |
| **UI（CSS + 選擇性 class polish）** | 意義、信任、緊迫反應速度、護照隱喻、手機觸控清晰、桌面加值——**不重寫 HTML IA** |

### UI 應幫助 Petlive 達成的結果

1. **Urgency literacy（緊迫識讀）** — 一眼分出 critical / caution / due-soon / safe，不必讀完每個標籤才知道該多快反應。
2. **Trust literacy（信任識讀）** — owner stamp vs clinic／linked 清楚；**絕不**暗示綠色印章＝醫療已驗證。
3. **Emergency readability（急診可讀）** — `.e-card` 是壓力下要讀的醫療摘要；quick-nav 次要。
4. **Home as pet presence（首頁＝寵物在場）** — 品牌 + 當前寵物 + prevention strip + 主 CTA；手機不是密儀表板。
5. **Form calm（表單冷靜）** — 降低後台／admin-console 感；chips／fields **維持同一套 hooks**。
6. **Desktop upgrade path** — ≥760px 才允許較寬版面／dashboard 向加值；手機維持護照節奏。

### Victor 設計準則（本輪對齊）

- Brand-first；hero budget（首屏不堆 stats／行程／次要行銷）。
- 避免整站落成 AI-default cream／terracotta 儀表板貌。
- Cards 僅在互動需要時；急診卡是「讀」不是「操作面板」。
- Critical 紅（`--alert`）**只**用於真危險。

### 色票（與 contracts 對齊，不另造一套）

| 層級 | Token | 用途 |
|---|---|---|
| critical | `--alert` `#c23b3b` | **唯一紅** |
| caution／逾期留意 | rose／beige 或 attention apricot（依層） | 需留意、已到期等 |
| approaching | `--status-apricot` | 快到期 |
| safe | `--status-mint` | 保護中；**品牌葉綠不當狀態燈** |
| stamps | `--milktea` | 飼主記錄印章 |
| 剛投藥 | `--sun` | 今日完成小強調 |

---

## B. In scope — Docking principles

- **保留** `index.html` 結構與 screen IA（home、emergency、alerts、vaccines、parasite、timeline、forms、archive、photo crop、i18n、lang switcher）；本輪不做 IA 重寫。
- 把 UI tokens／元件 **對到既有 selectors**，例如：
  - `.pet-option`（含 lift／select）
  - `.parasite-row.is-protected` / `.is-approaching` / `.is-unprotected`（及 expired 等既有狀態）
  - `.alert-item.severity-critical` / `.severity-caution`
  - `.e-card`、`.e-alerts` 與急診區塊
  - `.tl-item`、`.btn-*`、chips、stamps／tags（owner vs clinic）
- 主改 **`styles.css`**；HTML 僅在「不加 class 無法對接」時極小量加 class，且必須列在下方「允許的 HTML 微調」。
- **不改** `app.js` 行為；若必須對齊 JS 已 emit 的 class 名稱，僅限列出的理由與範圍。
- 路徑是 **upgrade-in-place docking**，不是另一張全站皮膚。

### Borrow from v2（可借）

- Token／色階與護照質感（紙感、印章溫度、非 flat 單色死白）。
- 桌面（≥760px）排版 enrichment：較寬欄、較鬆呼吸、可選的次要視覺層——**不得回灌破壞手機**。
- 表單／時間軸的「冷靜、非後台」字級與間距節奏（在既有 class 上調）。
- Severity／prevention 狀態色與 contracts 一致的視覺語言。

### Keep original mobile behavior（手機必須保住）

- Pet cards：lift／select／觸控回饋；**禁止**把 pill／compact chip 規則硬套在 `.pet-option` 上導致點擊與可讀性崩壞。
- 主 CTA：**全寬、直向 stack**（不要並排擠窄 tap）。
- Tap targets：**約 48px** 量級。
- 首頁手機節奏：品牌 + 寵物在場 + prevention strip + CTA——**不是** cream dashboard 密網格。
- Severity 色正確綁在既有 `severity-*` / `is-*`；急診卡可讀優先於裝飾。

### 允許的 HTML 微調（若不可避免才做）

- Cache bust query（`styles.css?v=…` 等）。
- Atmosphere／wrapper 上 **1–2 個** 純展示用 class（不改 `data-screen` / `data-go` / `data-i18n` 語意）。
- 任何新增 class 必須寫進 Builder 實作清單與 acceptance；預設以純 CSS 對接為先。

---

## C. Out of scope

- Home **dashboard v2**（stats grid 等）→ 之後另開提案。
- 警示 severity UX 改成多步「發生什麼／ER／證據」模型 → 之後。
- Source／verification **資料模型**拆分（綠章≠驗證的完整產品語意）→ 之後；本輪只做視覺信任識讀，不改資料契約。
- 替換 i18n runtime、drugs DB、`app.js` 業務邏輯。
- 退回「舊 CSS 整包」或再做一次與 hooks 脫鉤的全站換皮。

---

## D. Likely files

| File | Role |
|---|---|
| `apps/web/styles.css` | **主戰場**：對接既有 selectors、修手機回歸、桌面 enrichment |
| `apps/web/index.html` | Cache bust；可選 atmosphere／極少 class |
| `contracts/pet-health-passport-contracts.md` | **僅當** token 名稱需與實作同步時；不改 severity 語意 |
| `apps/web/app.js` | **預設不動**；僅若需對齊「已 emit、文件已列」的 class 名稱（須在 notes 寫明理由） |

不碰：`i18n.js` 文案結構、drugs DB、modules 種子（除非之後另案）。

---

## E. Risks

- **Medical / severity 誤讀**：紅用太多或 mint 被當成「診所驗證」→ 違反 urgency／trust literacy；Builder 必須嚴格對 contracts 四層梯度與 stamp 語意。
- **再打一架 hooks**：v2 式全域 pill／dashboard 規則若未 scoped，會重演手機回歸（pet cards、CTA、tap）。
- **桌面規則漏下手機**：`min-width: 760px`（或專案既有 breakpoint）必須包住 enrichment；預設 mobile-first。
- **急診卡變操作面板**：過多按鈕樣式／卡片堆疊降低壓力下可讀性。
- Disclaimer／劑量文案：本輪不改醫療文案邏輯；只動呈現時不得暗示診斷或治療權威。

---

## F. Acceptance criteria

### Mobile

- [ ] 品牌在首屏可讀（brand-first，非僅 nav 小字）。
- [ ] `.pet-option` lift／select 正常，無錯誤 pill 壓扁。
- [ ] 主 CTA 全寬直向 stack；主要可點約 48px。
- [ ] `severity-critical` / `severity-caution` 與 parasite／vaccine `is-*` 色正確（紅僅 critical）。
- [ ] 急診 `.e-card` 可讀優先；quick-nav 不搶主摘要。
- [ ] Owner vs clinic／linked stamps／tags 可辨；綠／mint **不**表示醫療已驗證。

### Desktop（≥760px）

- [ ] 允許 v2 向 enrichment（寬度、呼吸、次要層），且不破壞上述手機行為。

### Hooks

- [ ] `data-screen` / `data-go` / `data-i18n` 與 JS 依賴 class 無斷裂；導航、表單、picker、警示、prevention、時間軸仍可用。

---

## Notes for Victor

本提案定義的是 **對標 + 對接策略**，不是另做一版 HTML IA。確認後 Builder 只在平行路徑改 CSS（與列出的極小 HTML），主線不覆寫「先給你看」。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
