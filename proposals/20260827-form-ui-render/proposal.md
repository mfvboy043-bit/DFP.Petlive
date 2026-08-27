---
id: 20260827-form-ui-render
title: Form UI render — extract填表畫面 HTML from app.js
status: proposed
author: planner
candidate_branch: "proposal/form-ui-render"
candidate_path: "proposals/20260827-form-ui-render"
created: 2026-08-27
updated: 2026-08-27
---

# Proposal: Form UI render building blocks (FO-05)

Companion: `state.yaml`.

## Goal

把「填表時會跳出來的小元件」的 HTML 組裝，從 `app.js` 搬到各 domain 的 `render.js`（跟之前 timeline / alerts / pet picker 同一套路）。

使用者看到的畫面不變；只是程式碼分類更清楚、可以寫測試。

## 白話說明（給 Victor）

想像 `app.js` 是一個大背包，裡面塞了所有東西。  
之前我們已經把「列表頁」和「寵物列、裁照片」拿出來放小盒子了。

**這一批要拿出来的，是「填表時的小零件」：**

| 你在 app 里会看到的 | 像什么 |
|---|---|
| 选品种：搜索下拉、一排品种按钮 | 选「柴犬还是米克斯」的按钮区 |
| 加药：待加入清单、复方选项、颜色圆点 | 购物车清单 + 药的颜色标签 |
| 找诊所 / 找药：搜索结果列表 | 打字后跳出来的建议清单 |
| 验血 / 影像：已选照片预览 | 贴图预览 + 删除钮 |
| 寄生虫：产品 chip | 选「心丝虫药 A 还是 B」 |
| 药袋照片预览 | 小图 + 清除 |

**这次不动：** 表单怎么存、怎么验证、按送出后写进宠物资料 — 这些「大脑」还在 controller / facade。

---

## Audit（现在在 facade 里）

| 函数 | ~行 | 建议去向 |
|---|---|---|
| `renderBreedResults` | 30 | **new** `domains/breed/render.js` |
| `breedChipButtonHtml`, `renderCollapsed/ExpandedBreedChips` | 45 | ↑ |
| `renderLabPhotoPreviews` | 15 | **extend** `domains/labs/render.js` |
| `renderLabClinicResults` | 25 | ↑ |
| `renderImagingSlotPreviews` | 20 | **extend** `domains/imaging/render.js` |
| `parasiteProductChipMarkup`, `renderParasiteProductChips` | 25 | **extend** `domains/parasite/render.js` |
| `renderClinicResults` | 25 | **new** `domains/medications/render.js` |
| `renderDrugResults`, `renderDrugInfoCard`* | 50 | ↑ |
| `renderPendingMeds`, `renderPendingCompoundOptions` | 95 | ↑ |
| `renderCompoundColorSwatches` | 30 | ↑ |
| `renderProofPreview` | 15 | **new** `shell/proof-preview.js` |

\* `renderDrugInfoCard` 会拆成 **HTML 字串 builder**（side effects / precautions 列表）；facade 仍负责 `hidden`、`scrollIntoView` 等 DOM 操作。

## In scope

### FO-05-01 — `domains/breed/render.js`

- `buildBreedResultsHtml(list, { label, breedOptionLabel })`
- `buildBreedChipHtml(breed, { breedOptionLabel })`
- `buildCollapsedChipsHtml(species, selectedValue, deps)`
- `buildExpandedGroupsHtml(species, deps)`

Inject: `label`, `breedOptionLabel`, `breedSelectors`（collapsed/expanded 数据来自既有 selectors）

### FO-05-02 — `domains/medications/render.js`

- `buildClinicResultsHtml(list)` — 共用 visit + lab 诊所搜索 UI 结构
- `buildDrugResultsHtml(list)`
- `buildDrugInfoListsHtml(drug, { label })` — purpose + `<li>` lists（facade 赋给 innerHTML）
- `buildPendingMedItemHtml(med, ctx)` + `buildPendingMedsListHtml(pendingMeds, ctx)`
- `buildPendingCompoundOptionsHtml(med, ctx)` — 依赖 injected `compoundFormOptions`, tone/icon/color helpers
- `buildCompoundColorSwatchesHtml(group, currentHex, swatches, label)`

### FO-05-03 — Extend labs + imaging render

- labs: `buildPhotoPreviewsHtml(urls)`, `buildClinicResultsHtml(list)`（或复用 medications clinic builder）
- imaging: `buildSlotPreviewsHtml(urls, slot)`

### FO-05-04 — Extend parasite render

- `buildProductChipsHtml({ kind, products, selectedKey, isDual, label })`

### FO-05-05 — `shell/proof-preview.js`

- `buildProofPreviewHtml(dataUrl, { label, clearKey })` — 图片 + 可选清除钮

### FO-05-06 — Wire C first

- `c/app.js`：各 `render*` 变一行 delegate
- `c/index.html`：新 script tags + `?v=`

### FO-05-07 — Tests

- `web-breed-render.test.js`
- `web-medications-render.test.js`
- 补 labs / imaging / parasite render test cases
- `web-shell-proof-preview.test.js`

### FO-05-08 — Cover B after adopt

## Out of scope

- 表单 read/validate/submit（`readMedDraftFromForm`, `readParasiteForm` 等）
- 搜索逻辑（`searchClinics`, `searchDrugs`, breed search）
- `syncLabTypeChips`, `setSelectedBreed` DOM 状态切换
- 药理学语义改动、新 UI 样式
- PERF / CSS bundler

## Likely files

| Layer | Path |
|---|---|
| Domain | `domains/breed/render.js`, `domains/medications/render.js` (new) |
| Domain extend | `domains/labs/render.js`, `domains/imaging/render.js`, `domains/parasite/render.js` |
| Shell | `shell/proof-preview.js` (new) |
| Facade | `apps/web/c/app.js`, later B |
| Load | `apps/web/c/index.html`, later B |
| QA | 4 test files above |

## Risks

- **Pharmacist**：drug info card、pending med dose 行不可改语气或漏 escape。
- **Compound 颜色**：swatch `is-on` 与 `--compound-chip-color` 须与现行为一致。
- **Breed collapsed 逻辑**：chips 数据仍由 `breedSelectors` + facade 驱动，render 只产出 HTML。
- **Clinic 结构重复**：visit clinic 与 lab clinic 几乎相同 — 可共用 medications builder，避免两套 drift。

## Acceptance

- [ ] 上表所有 HTML builder 搬入 domain/shell，facade 无 inline 模板（除 thin wrapper）
- [ ] C 面填表 UI 行为不变（搜索、chip 选中、预览、pending list）
- [ ] 新测试 + `node --check apps/web/c/app.js` pass
- [ ] Pharmacist review on medications builders

## Notes for Victor

这一批比较大，但每一块都是同一类型工作：**把 HTML 字符串搬到 render.js**。  
建议一次做完，免得 clinic 搜索结果写两套。

请确认此提案：回覆「**确认**」开始平行制作，「**修改：…**」调整范围，或「**否决**」。
