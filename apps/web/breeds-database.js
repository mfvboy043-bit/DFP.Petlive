/**
 * Common dog / cat breeds for add-pet picker (Taiwan-first MVP).
 * value is stable; labels follow i18n locales.
 */
const BREED_CUSTOM_VALUE = "__custom__";

const DOG_BREEDS = [
  { value: "mixed", labels: { zh: "米克斯", en: "Mixed", ja: "ミックス", ko: "믹스" } },
  { value: "taiwan-dog", labels: { zh: "台灣犬", en: "Taiwan Dog", ja: "台湾犬", ko: "대만견" } },
  { value: "shiba", labels: { zh: "柴犬", en: "Shiba Inu", ja: "柴犬", ko: "시바" } },
  { value: "corgi", labels: { zh: "柯基", en: "Corgi", ja: "コーギー", ko: "코기" } },
  { value: "poodle", labels: { zh: "貴賓犬", en: "Poodle", ja: "プードル", ko: "푸들" } },
  { value: "maltese", labels: { zh: "瑪爾濟斯", en: "Maltese", ja: "マルチーズ", ko: "말티즈" } },
  { value: "pomeranian", labels: { zh: "博美", en: "Pomeranian", ja: "ポメラニアン", ko: "포메라니안" } },
  { value: "chihuahua", labels: { zh: "吉娃娃", en: "Chihuahua", ja: "チワワ", ko: "치와와" } },
  { value: "dachshund", labels: { zh: "臘腸犬", en: "Dachshund", ja: "ダックスフンド", ko: "닥스훈트" } },
  { value: "french-bulldog", labels: { zh: "法國鬥牛犬", en: "French Bulldog", ja: "フレンチブル", ko: "프렌치 불독" } },
  { value: "pug", labels: { zh: "巴哥", en: "Pug", ja: "パグ", ko: "퍼그" } },
  { value: "golden", labels: { zh: "黃金獵犬", en: "Golden Retriever", ja: "ゴールデン", ko: "골든 리트리버" } },
  { value: "labrador", labels: { zh: "拉布拉多", en: "Labrador Retriever", ja: "ラブラドール", ko: "래브라도" } },
  { value: "husky", labels: { zh: "哈士奇", en: "Siberian Husky", ja: "ハスキー", ko: "허스키" } },
  { value: "border-collie", labels: { zh: "邊境牧羊犬", en: "Border Collie", ja: "ボーダーコリー", ko: "보더콜리" } },
  { value: "yorkshire", labels: { zh: "約克夏", en: "Yorkshire Terrier", ja: "ヨークシャー", ko: "요크셔" } },
  { value: "schnauzer", labels: { zh: "雪納瑞", en: "Schnauzer", ja: "シュナウザー", ko: "슈나우저" } },
  { value: "bichon", labels: { zh: "比熊", en: "Bichon Frise", ja: "ビション", ko: "비숑" } },
  { value: "samoyed", labels: { zh: "薩摩耶", en: "Samoyed", ja: "サモエド", ko: "사모예드" } },
  { value: "akita", labels: { zh: "秋田犬", en: "Akita", ja: "秋田犬", ko: "아키타" } },
  { value: "beagle", labels: { zh: "米格魯", en: "Beagle", ja: "ビーグル", ko: "비글" } },
  { value: "shihtzu", labels: { zh: "西施犬", en: "Shih Tzu", ja: "シーズー", ko: "시츄" } },
  { value: "bulldog", labels: { zh: "英國鬥牛犬", en: "Bulldog", ja: "ブルドッグ", ko: "불독" } },
  {
    value: BREED_CUSTOM_VALUE,
    labels: {
      zh: "其他（自行輸入）",
      en: "Other (type yourself)",
      ja: "その他（手入力）",
      ko: "기타 (직접 입력)",
    },
  },
];

const CAT_BREEDS = [
  { value: "mixed", labels: { zh: "米克斯／家貓", en: "Domestic / Mixed", ja: "ミックス／雑種", ko: "믹스/집고양이" } },
  { value: "orange-tabby", labels: { zh: "橘貓", en: "Orange tabby", ja: "茶トラ", ko: "치즈태비" } },
  { value: "american-shorthair", labels: { zh: "美國短毛貓", en: "American Shorthair", ja: "アメリカンショートヘア", ko: "아메리칸 숏헤어" } },
  { value: "british-shorthair", labels: { zh: "英國短毛貓", en: "British Shorthair", ja: "ブリティッシュショートヘア", ko: "브리티시 숏헤어" } },
  { value: "persian", labels: { zh: "波斯貓", en: "Persian", ja: "ペルシャ", ko: "페르시안" } },
  { value: "siamese", labels: { zh: "暹羅貓", en: "Siamese", ja: "シャム", ko: "샴" } },
  { value: "ragdoll", labels: { zh: "布偶貓", en: "Ragdoll", ja: "ラグドール", ko: "렉돌" } },
  { value: "scottish-fold", labels: { zh: "蘇格蘭摺耳", en: "Scottish Fold", ja: "スコティッシュフォールド", ko: "스코티시 폴드" } },
  { value: "bengal", labels: { zh: "孟加拉貓", en: "Bengal", ja: "ベンガル", ko: "벵갈" } },
  { value: "maine-coon", labels: { zh: "緬因貓", en: "Maine Coon", ja: "メインクーン", ko: "메인쿤" } },
  { value: "russian-blue", labels: { zh: "俄羅斯藍貓", en: "Russian Blue", ja: "ロシアンブルー", ko: "러시안 블루" } },
  { value: "munchkin", labels: { zh: "曼赤肯", en: "Munchkin", ja: "マンチカン", ko: "먼치킨" } },
  { value: "exotic", labels: { zh: "異國短毛貓", en: "Exotic Shorthair", ja: "エキゾチック", ko: "엑조틱 숏헤어" } },
  { value: "norwegian", labels: { zh: "挪威森林貓", en: "Norwegian Forest", ja: "ノルウェージャン", ko: "노르웨이숲" } },
  { value: "sphynx", labels: { zh: "斯芬克斯", en: "Sphynx", ja: "スフィンクス", ko: "스핑크스" } },
  { value: "abyssinian", labels: { zh: "阿比西尼亞", en: "Abyssinian", ja: "アビシニアン", ko: "아비시니안" } },
  {
    value: BREED_CUSTOM_VALUE,
    labels: {
      zh: "其他（自行輸入）",
      en: "Other (type yourself)",
      ja: "その他（手入力）",
      ko: "기타 (직접 입력)",
    },
  },
];

/** Group order for dog chips (Taiwan-common first). Values only — no new breeds. */
const DOG_BREED_GROUPS = [
  { id: "common-tw", i18nKey: "breedGroupCommonTw", members: ["mixed", "taiwan-dog", "shiba"] },
  {
    id: "toy-companion",
    i18nKey: "breedGroupToyCompanion",
    members: [
      "maltese",
      "pomeranian",
      "chihuahua",
      "yorkshire",
      "bichon",
      "pug",
      "shihtzu",
      "poodle",
    ],
  },
  {
    id: "herding-working",
    i18nKey: "breedGroupHerdingWorking",
    members: ["corgi", "border-collie", "husky", "samoyed", "akita"],
  },
  {
    id: "hunting-retriever",
    i18nKey: "breedGroupHuntingRetriever",
    members: ["golden", "labrador", "beagle", "dachshund"],
  },
  { id: "bully", i18nKey: "breedGroupBully", members: ["french-bulldog", "bulldog"] },
  { id: "other", i18nKey: "breedGroupOther", members: ["schnauzer"] },
  { id: "custom", i18nKey: "breedGroupCustom", members: [BREED_CUSTOM_VALUE] },
];

/** Group order for cat chips (common home first). */
const CAT_BREED_GROUPS = [
  { id: "common-home", i18nKey: "breedGroupCommonHome", members: ["mixed", "orange-tabby"] },
  {
    id: "shorthair",
    i18nKey: "breedGroupShorthair",
    members: [
      "american-shorthair",
      "british-shorthair",
      "siamese",
      "russian-blue",
      "exotic",
      "bengal",
      "abyssinian",
      "scottish-fold",
      "munchkin",
      "sphynx",
    ],
  },
  {
    id: "longhair",
    i18nKey: "breedGroupLonghair",
    members: ["persian", "ragdoll", "maine-coon", "norwegian"],
  },
  { id: "custom", i18nKey: "breedGroupCustom", members: [BREED_CUSTOM_VALUE] },
];

function getBreedListForSpecies(species) {
  if (species === "dog") return DOG_BREEDS;
  if (species === "cat") return CAT_BREEDS;
  return [];
}

function getBreedGroupsForSpecies(species) {
  if (species === "dog") return DOG_BREED_GROUPS;
  if (species === "cat") return CAT_BREED_GROUPS;
  return [];
}

function getCommonBreedGroupId(species) {
  if (species === "dog") return "common-tw";
  if (species === "cat") return "common-home";
  return "";
}

function findBreedByValue(species, value) {
  return getBreedListForSpecies(species).find((breed) => breed.value === value) || null;
}

function breedLangKey() {
  const lang =
    (typeof getCurrentLang === "function" && getCurrentLang()) ||
    (typeof currentLang === "string" ? currentLang : "zh");
  if (lang === "zh-Hant" || lang === "zh-TW" || lang === "zh") return "zh";
  if (lang === "ja" || lang === "ko" || lang === "en") return lang;
  return "zh";
}

function breedOptionLabel(breed) {
  const key = breedLangKey();
  return breed.labels[key] || breed.labels.zh || breed.value;
}
