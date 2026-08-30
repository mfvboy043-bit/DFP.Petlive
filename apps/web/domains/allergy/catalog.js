(function initPetLiveWebAllergyCatalog(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.allergy = root.domains.allergy || {};

  /**
   * Reference catalog — TW/common pet food brands (Momo, Pet Park, vet retail).
   * labels.en is the canonical stored value; zh/ja/ko drive localized display.
   */
  const FOOD_BRAND_CATALOG = [
    {
      id: "royal-canin",
      labels: { zh: "皇家", en: "Royal Canin", ja: "ロイヤルカナン", ko: "로얄캐닌" },
      aliases: ["法國皇家", "royal canin"],
    },
    {
      id: "hills",
      labels: { zh: "希爾思", en: "Hill's", ja: "ヒルズ", ko: "힐스" },
      aliases: ["Hills", "Science Diet", "處方", "hill's"],
    },
    {
      id: "purina",
      labels: { zh: "寶路", en: "Purina", ja: "ピュリナ", ko: "퓨리나" },
      aliases: ["pedigree", "普瑞納"],
    },
    {
      id: "pro-plan",
      labels: { zh: "冠能", en: "Pro Plan", ja: "プロプラン", ko: "프로플랜" },
      aliases: ["proplan", "冠能"],
    },
    {
      id: "orijen",
      labels: { zh: "渴望", en: "Orijen", ja: "オリジン", ko: "오리젠" },
      aliases: ["歐睿健", "orijen"],
    },
    {
      id: "acana",
      labels: { zh: "愛肯拿", en: "Acana", ja: "アカナ", ko: "아카나" },
      aliases: ["acana"],
    },
    {
      id: "now-fresh",
      labels: { zh: "NOW Fresh", en: "NOW Fresh", ja: "NOW フレッシュ", ko: "NOW 프레시" },
      aliases: ["NOW", "now fresh"],
    },
    {
      id: "go",
      labels: { zh: "GO!", en: "GO!", ja: "GO!", ko: "GO!" },
      aliases: ["Go!", "go solutions", "源點"],
    },
    {
      id: "wellness",
      labels: { zh: "Wellness", en: "Wellness", ja: "ウェルネス", ko: "웰니스" },
      aliases: ["wellness core", "core"],
    },
    {
      id: "natural-balance",
      labels: {
        zh: "Natural Balance",
        en: "Natural Balance",
        ja: "ナチュラルバランス",
        ko: "내추럴발란스",
      },
      aliases: ["natural balance"],
    },
    {
      id: "mobby",
      labels: { zh: "莫比", en: "Mobby", ja: "モビー", ko: "모비" },
      aliases: ["Mobby Choice", "Momentum", "momentum", "莫比"],
    },
    {
      id: "believe",
      labels: { zh: "倍力", en: "Believe", ja: "ビリーブ", ko: "빌리브" },
      aliases: ["Belicon", "belicon", "倍力"],
    },
    {
      id: "nature-pro",
      labels: { zh: "天然密碼", en: "Nature Pro", ja: "ネイチャープロ", ko: "네이처프로" },
      aliases: ["天然密碼", "nature pro"],
    },
    {
      id: "ziwi",
      labels: { zh: "巔峰", en: "Ziwi Peak", ja: "ジウィピーク", ko: "지위피크" },
      aliases: ["Ziwi", "ziwi", "滋益巔峰"],
    },
    {
      id: "farmina",
      labels: { zh: "法米娜", en: "Farmina", ja: "ファルミナ", ko: "파르미나" },
      aliases: ["N&D", "法米納", "farmina"],
    },
    {
      id: "nutram",
      labels: { zh: "紐頓", en: "Nutram", ja: "ニュートラム", ko: "뉴트람" },
      aliases: ["nutram", "紐頓"],
    },
    {
      id: "instinct",
      labels: { zh: "原點", en: "Instinct", ja: "インスティンクト", ko: "인스틴크트" },
      aliases: ["instinct", "本能", "原點"],
    },
    {
      id: "canidae",
      labels: { zh: "卡比", en: "Canidae", ja: "カニダエ", ko: "카니대" },
      aliases: ["canidae", "卡比"],
    },
    {
      id: "stella-chewys",
      labels: {
        zh: "Stella & Chewy's",
        en: "Stella & Chewy's",
        ja: "ステラ&チューイーズ",
        ko: "스텔라앤츄이스",
      },
      aliases: ["stella", "chewys", "stellachewys"],
    },
    {
      id: "toma-pro",
      labels: { zh: "優格", en: "Toma Pro", ja: "トマプロ", ko: "토마프로" },
      aliases: ["TOMA-PRO", "優格", "toma pro"],
    },
    {
      id: "blackwood",
      labels: { zh: "柏萊富", en: "Blackwood", ja: "ブラックウッド", ko: "블랙우드" },
      aliases: ["blackwood", "柏萊富"],
    },
    {
      id: "firstmate",
      labels: { zh: "第一饗宴", en: "FirstMate", ja: "ファーストメイト", ko: "퍼스트메이트" },
      aliases: ["firstmate", "第一饗宴"],
    },
    {
      id: "nutrience",
      labels: { zh: "紐崔斯", en: "Nutrience", ja: "ニュートリエンス", ko: "뉴트리언스" },
      aliases: ["nutrience", "紐崔斯"],
    },
    {
      id: "halo",
      labels: { zh: "嘿囉", en: "HALO", ja: "ヘイロー", ko: "헤일로" },
      aliases: ["halo", "嘿囉"],
    },
    {
      id: "real-power",
      labels: { zh: "瑞威", en: "Real Power", ja: "リアルパワー", ko: "리얼파워" },
      aliases: ["real power", "瑞威"],
    },
    {
      id: "monster-tribe",
      labels: { zh: "怪獸部落", en: "Monster Tribe", ja: "モンスタートライブ", ko: "몬스터트라이브" },
      aliases: ["怪獸部落", "monster tribe"],
    },
    {
      id: "open-farm",
      labels: { zh: "開放農場", en: "Open Farm", ja: "オープンファーム", ko: "오픈팜" },
      aliases: ["open farm", "開放農場"],
    },
    {
      id: "ownat",
      labels: { zh: "歐娜特", en: "Ownat", ja: "オーナット", ko: "오왓" },
      aliases: ["ownat", "歐娜特"],
    },
    {
      id: "addiction",
      labels: { zh: "愛旺斯", en: "Addiction", ja: "アディクション", ko: "어딕션" },
      aliases: ["愛旺斯", "addiction"],
    },
    {
      id: "add",
      labels: { zh: "愛德勝", en: "ADD", ja: "ADD", ko: "ADD" },
      aliases: ["愛德勝", "addiction pet", "自然癮食"],
    },
    {
      id: "cesar",
      labels: { zh: "西莎", en: "Cesar", ja: "シーザー", ko: "시저" },
      aliases: ["cesar", "西莎"],
    },
    {
      id: "petlife",
      labels: { zh: "寶多福", en: "Petlife", ja: "ペットライフ", ko: "펫라이프" },
      aliases: ["petlife", "寶多福"],
    },
    {
      id: "nacs",
      labels: { zh: "耐吉斯", en: "Nacs", ja: "ナックス", ko: "낙스" },
      aliases: ["nacs", "耐吉斯"],
    },
    {
      id: "trilogy",
      labels: { zh: "奇境", en: "Trilogy", ja: "トリロジー", ko: "트릴로지" },
      aliases: ["trilogy", "奇境"],
    },
    {
      id: "boreal",
      labels: { zh: "波瑞歐", en: "Boreal", ja: "ボレアル", ko: "보레알" },
      aliases: ["boreal", "波瑞歐"],
    },
    {
      id: "gomo",
      labels: { zh: "GOMO", en: "GOMO", ja: "GOMO", ko: "GOMO" },
      aliases: ["gomo"],
    },
  ];

  const MEAT_PRESETS = [
    "chicken",
    "duck",
    "beef",
    "lamb",
    "pork",
    "fish",
    "venison",
    "rabbit",
  ];

  root.domains.allergy.FOOD_BRAND_CATALOG = FOOD_BRAND_CATALOG;
  root.domains.allergy.MEAT_PRESETS = MEAT_PRESETS;
})(typeof window !== "undefined" ? window : globalThis);
