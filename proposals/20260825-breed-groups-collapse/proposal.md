---
id: 20260825-breed-groups-collapse
title: "品種 chip 預設摺疊＋犬／貓分組"
status: proposed
author: planner
candidate_branch: "proposal/breed-groups-collapse"
candidate_path: "proposals/20260825-breed-groups-collapse"
created: 2026-08-25
updated: 2026-08-25
---

# Proposal: 品種 chip 預設摺疊＋犬／貓分組

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

在正式版 B（`apps/web/`）新增／編輯寵物表單的品種欄，長 chip 清單不再一打開就佔滿手機畫面：預設摺疊預覽，並可展開／收合；展開時依台灣常見度與犬種類型分組顯示。既有 `breed` `value` 鍵不變，無需資料遷移。

## In scope

- **摺疊控制（`#breed-select-field` / `#breed-chips`）**
  - 欄位旁或下方提供明確的展開／收合控制（按鈕或同等可聚焦控件）
  - 預設 **collapsed**：只顯示「常見／台灣」（犬）或「常見／家貓」（貓）組內 chip，加上**目前已選品種**（若選中項不在預覽組內，仍須可見並標為 selected），以及 **自訂／其他**（`__custom__`）永遠可見
  - 展開後顯示完整分組清單（含組標題）；再點可收合
  - `aria-expanded`、可鍵盤操作；語言切換後 toggle／組標籤重算
- **犬種分組（既有 `DOG_BREEDS` 值，不新增品種）**

  | group id | 建議中文 | members |
  |---|---|---|
  | `common-tw` | 常見／台灣 | `mixed`, `taiwan-dog`, `shiba` |
  | `toy-companion` | 玩具／伴侶 | `maltese`, `pomeranian`, `chihuahua`, `yorkshire`, `bichon`, `pug`, `shihtzu`, `poodle` |
  | `herding-working` | 牧羊／工作 | `corgi`, `border-collie`, `husky`, `samoyed`, `akita` |
  | `hunting-retriever` | 獵犬／尋回 | `golden`, `labrador`, `beagle`, `dachshund` |
  | `bully` | 獒犬／鬥牛 | `french-bulldog`, `bulldog` |
  | `other` | 其他 | `schnauzer` |
  | `custom` | （沿用既有「其他／自行輸入」label） | `__custom__` — 永遠在清單末、collapsed 也顯示 |

  - `shiba` 放在「常見／台灣」（台灣極常見），不另開「日本犬」組，避免單犬一組
- **貓種分組（輕量，同一套 UI 模式）**

  | group id | 建議中文 | members |
  |---|---|---|
  | `common-home` | 常見／家貓 | `mixed`, `orange-tabby` |
  | `shorthair` | 短毛 | `american-shorthair`, `british-shorthair`, `siamese`, `russian-blue`, `exotic`, `bengal`, `abyssinian`, `scottish-fold`, `munchkin`, `sphynx` |
  | `longhair` | 長毛 | `persian`, `ragdoll`, `maine-coon`, `norwegian` |
  | `custom` | 自訂 | `__custom__` |

- **資料結構**：在 `breeds-database.js`（或同檔旁）為每條 breed 加穩定 `group` 欄位，或另建 `DOG_BREED_GROUPS` / `CAT_BREED_GROUPS` 對照；**不改**既有 `value` 字串
- **i18n**：組標題、展開／收合文案（zh / en / ja / ko）；既有品種 labels 不動
- **樣式**：組標題低調、不卡片化堆疊；手機寬度下摺疊明顯縮短表單高度；貼合既有 chip-field
- **行為相容**：`syncBreedFields` / `setSelectedBreed` / species 切換／自訂輸入欄仍正常；`breedKey` 儲存格式不變

## Out of scope

- 擴充品種資料庫（只 regroup 現有 list）
- C 面（`apps/web/c/`）同步 — 可作 Gate B 後 follow-up；本提案只做正式 B
- 醫療／劑量／診斷文案
- 品種搜尋、autocomplete、圖片、AKC 官方分類權威化
- 儲存 schema／雲端 sync 變更

## Likely files

- `apps/web/breeds-database.js` — group 對照或 breed.`group`；匯出 helper（依 species 取分組）
- `apps/web/app.js` — `syncBreedFields` 改為分組渲染；collapsed 預覽邏輯；toggle handler；選中項在 collapsed 時強制可見
- `apps/web/index.html` — toggle 控件 markup（若不用純 JS 注入）
- `apps/web/styles.css` — group header、collapsed／expanded、toggle
- `apps/web/i18n.js` — 組名 + expand／collapse keys；cache `?v=` bump 於 HTML script／link

## Risks

- **選中品種被藏住：** collapsed 若只顯示「常見」組，編輯已選 `golden` 等時使用者看不到目前選擇 → **必須**把 selected chip 釘在預覽區（或預覽區含 selected + 常見組去重）
- **自訂欄聯動：** `__custom__` 須在 collapsed／expanded 皆可點；選自訂後自訂輸入欄行為不變
- **i18n：** 組標題與 toggle 漏語系；語言切換後須重跑 `syncBreedFields`（或同等）
- **無障礙：** toggle 需 `aria-expanded`、可聚焦；listbox／option 語意勿因組標題 `<div>` 破壞（組標題用非 option 的靜態標籤）
- **species = other：** 仍無 chip 清單；toggle 應隱藏或停用
- **醫療：** 無劑量／診斷風險；Pharmacist 可 skip
- **C 漂移：** 本提案不改 C；確認前勿假設 cover

## Acceptance criteria

- [ ] 新增寵物（犬）：品種區預設摺疊，首屏高度明顯短於現況；可見「常見／台灣」chip + 自訂；有明確展開控制
- [ ] 展開後可見分組標題與全部既有犬種 chip；收合後回到預覽規則
- [ ] 編輯已選非「常見」犬種（如 `labrador`）：collapsed 時仍可見該選中 chip（selected），可改選或展開瀏覽
- [ ] 貓種：同等摺疊＋輕量分組；自訂／米克斯行為正確
- [ ] 切換犬↔貓／其他：清單與摺疊狀態合理重設；`__custom__` 與自訂輸入欄聯動不變
- [ ] 既有寵物 `breedKey`（如 `golden`）讀寫不變，無需 migration
- [ ] zh/en/ja/ko 組名與 expand／collapse 字串正確；無 console 錯；手機寬度可用
- [ ] toggle 鍵盤可操作且 `aria-expanded` 正確

## Proposed UX detail (Builder hint)

1. Collapsed preview = `common-*` group chips ∪ selected breed chip ∪ `__custom__`（去重，順序：常見組順序 → selected if foreign → custom last）。
2. Expanded = 各組 `h`/legend 式小標 + 該組 chips；`custom` 組僅一顆自訂 chip，置底。
3. Toggle 文案建議：`展開全部品種` / `收合品種`（四語）；collapsed 可加短 hint「顯示常見品種」可選、非必須。

## Notes for Victor

- 犬組為台灣飼主常見度優先，非 AKC 權威分類；若要改組（例如 `shiba` 獨立、`poodle` 移到其他），Gate A 用「修改：…」。
- 貓組採短毛／長毛輕量切；若只要犬分組、貓維持扁清單＋摺疊，也可「修改」。
- C 面不同步；要用再說 cover。

確認後回覆「確認」；要改範圍請寫「修改：…」；不進行請「否決」。
