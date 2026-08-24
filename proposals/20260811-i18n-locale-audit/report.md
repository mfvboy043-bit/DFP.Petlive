# i18n language-switch audit — 2026-08-11

## Verdict (after fix)

Chrome（按鈕／`data-i18n`）四語鍵本已對齊。真正的切語 bug 在**把顯示字串寫死進資料**；已改為 canonical 欄位＋顯示時重算。

## Fixed

| Area | Change |
|------|--------|
| 品種 | `breedKey` + `breedLabelOf()`（種子／新增寵物） |
| 年齡 | `birthDate` + `ageLabelOf()`；英文 `{n} years old` |
| 性別／絕育 | `gender` + `isNeutered` + `genderLabelOf()` |
| 症狀標籤 | seed 改 key；`visitTagLabel()` |
| 藥程文案 | `medCourse` / `durationDaysCount` i18n；劑量字串內「N 天」可展開 |
| 疫苗名 | `vaccineLabelOf()` 用 key 重翻 |
| 示範警示／就診備註 | `locField({ zh-Hant, en, ja, ko })` 四語包 |
| 院所名 | **維持原文不翻譯**（依 Victor） |

## Intentionally not translated

- 寵物暱稱、飼主自填自由文字、院所名稱
- 藥名（Apoquel 等）多語共用

## How to verify

1. 硬重新整理（cache `?v=20260811-i18n-labels`）
2. 米醬 → `#pet-sub` 英：`Dog · Mixed · 3 years old · Latest 6.8 kg`
3. 切 ja／ko：品種／歲／性別隨語系
4. 時間軸症狀標籤、急診卡副標、醫療警示類型＋示範說明隨語系
5. 院所名仍為中文專有名
