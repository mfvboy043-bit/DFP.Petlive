---
id: 20260825-breed-typeahead
title: "品種輸入型別提示（對齊藥品搜尋）"
status: adopted
author: planner
candidate_branch: "proposal/breed-typeahead"
candidate_path: "proposals/20260825-breed-typeahead"
created: 2026-08-25
updated: 2026-08-25
---

# Proposal: 品種輸入型別提示（對齊藥品搜尋）

Companion: `state.yaml` (v2 source of truth for gates / iteration).

## Goal

在正式版 B（`apps/web/`）新增／編輯寵物表單，讓品種可用關鍵字過濾既有犬／貓清單並跳出建議選單（對齊 `#drug-search` + `#drug-results` 模式）。選到已知品種時寫入穩定 `breedKey`；無匹配或使用者繼續自訂文字時，仍可存自訂名稱（與今日 `__custom__` 行為相容）。搜尋**補充** chip／摺疊分組，不預設取代它們。

## Recommended UX (Option A — prefer)

1. 在品種區提供可打字的搜尋／自訂欄（可重用或重構 `#breed-custom`，或並排一個 search input + `#breed-results` list）。
2. 依目前 species 過濾 `DOG_BREEDS` / `CAT_BREEDS`（對齊 locale labels zh/en/ja/ko + value／別名若已有）。
3. 輸入時顯示建議選單（樣式／互動 mirror `.drug-results`：list、button rows、hidden 空狀態）。
4. **選中建議** → 設 `breedKey` 為該品種 `value`；同步 chip selected；清空或收合自訂文字路徑；隱藏／收合 results。
5. **無匹配或繼續打字不選** → `breedKey = __custom__`，自訂顯示名稱存現有 custom 字串欄位（與今日相同）。
6. 空 query：不顯示全清單（或僅顯示極短提示）；避免一打開就蓋住表單。Chip 仍可點選已知品種。
7. 與 chip 雙向同步：點 chip 已知種 → 搜尋欄可顯示該品種 label；點「其他」→ 聚焦自訂／搜尋欄並允許自由輸入。

## Narrower alternative (Option B — if Victor 修改範圍)

僅在選 `__custom__`／「其他」後，對 `#breed-custom` 加 suggestions；不新增獨立 search-first 欄。已知種仍主要靠 chip。

**Planner default for Gate A:** Option A（搜尋互補 chip）。若要 B，回覆「修改：改 Option B」。

## In scope

- Formal B only：`apps/web/` index / app / styles / i18n / breeds helpers as needed
- Typeahead UI mirroring drug-results pattern (`#breed-results` 或同等；reuse / adapt `.drug-results` styles carefully so med + breed 不互相破壞)
- Species-aware list from existing `breeds-database.js`（`value` + labels）；**不改**既有 `breedKey` value 字串
- i18n：placeholder、hint、空結果文案（zh/en/ja/ko）；語言切換後重算 labels／results
- Mobile：選單不溢出、可點選、鍵盤／螢幕鍵盤可用；`autocomplete="off"`
- 與 chip（及假設已採用的摺疊／分組）共存：搜尋選中 ↔ chip selected ↔ form resolve 一致
- 儲存／讀回：已知 key vs custom 路徑與 `resolveBreedKeyFromForm` / `setSelectedBreed` / `syncBreedFields` 相容

## Out of scope

- C 面（`apps/web/c/`）
- 擴充品種 DB（新犬種／圖／AKC）
- 醫療／藥品／診斷文案
- 取代或重做 chip UI（除非 Victor 明確要求 search-first only）
- 改動 `proposals/20260825-breed-groups-collapse` 的 Gate B 狀態或合併該 candidate
- 儲存 schema／雲端 sync

## Likely files

- `apps/web/index.html` — breed search／results markup（近 `#breed-custom`）
- `apps/web/app.js` — filter／render results；select handler；chip ↔ typeahead sync；species change clear
- `apps/web/styles.css` — breed-results（可共享 drug-results 基礎或 scoped 變體）
- `apps/web/i18n.js` — keys + cache `?v=` bump
- `apps/web/breeds-database.js` — 可選：小型 `searchBreeds(query, species, locale)` helper（不擴資料）

## Risks

- **與 chip 衝突：** 搜尋選 A 後 chip 未同步，或 chip 選 B 後搜尋欄仍顯示舊字 → 必須單一 source of truth（`breedSelect` / selected chip value）
- **custom vs known key：** 使用者打出與某 label 極像的字卻未點選 → 應存 custom，勿靜默改寫成 known key（避免「以為選了柴犬卻存成自訂字串」的反向：點選才 commit known key）
- **空 query／過長 list：** 空字串勿 dump 全庫；需 debounce 或最小字元可選（建議 ≥1 字元才出選單）
- **species = other：** 無 chip／清單時僅自由文字；隱藏 results
- **摺疊 candidate 並存：** 若 Gate B 採用 groups-collapse，typeahead 須在 collapsed／expanded 下仍能正確選中並釘住 selected chip
- **樣式耦合：** 共用 `.drug-results` 時勿破壞藥品選單；優先 class 共用 + `#breed-results` 範圍
- **醫療：** 無劑量風險；Pharmacist 可 skip
- **i18n：** 建議列必須依當前語言比對 labels

## Acceptance criteria

- [ ] 犬／貓下輸入關鍵字可過濾既有品種並顯示建議選單（對齊 drug-results 互動感覺）
- [ ] 點選建議 → `breedKey` 為該品種穩定 `value`；chip 顯示 selected；自訂欄路徑正確關閉或清空
- [ ] 無匹配或未點選即儲存 → `__custom__` + 自訂名稱，行為與今日一致
- [ ] 空 query 不刷出全清單；選單可關閉（blur／Escape／選中後）
- [ ] 點 chip 已知種與 typeahead 狀態一致；點「其他」可自由輸入
- [ ] 語言切換後建議列 labels 重算；既有 `breedKey` 無需遷移
- [ ] 手機寬度可操作；不改 C、不擴 DB
- [ ] 與 chip 摺疊／分組（若已在 mainline 或稍後採用）不互相打斷選中狀態

## Notes for Victor

- **獨立提案：** 本請求是額外 scope，**不** silently 併入 `20260825-breed-groups-collapse`。
- **Gate B 提醒：** `proposals/20260825-breed-groups-collapse/` 仍為 `candidate_ready`、Gate B pending — 採用摺疊／分組請另回「採用」；與本 typeahead 的 Gate A「確認」分開。
- 確認後回覆「確認」；要改範圍請寫「修改：…」（例如改 Option B）；不進行請「否決」。

## Builder notes (iteration 1)

- Implemented Option A on `proposal/breed-typeahead`.
- `#breed-custom` face replaced by always-visible `#breed-search` (`name="breedCustom"` kept for form resolve).
- `searchBreeds` in `breeds-database.js`; pick → `setSelectedBreed(value)`; free text → `__custom__` without silent coerce.
