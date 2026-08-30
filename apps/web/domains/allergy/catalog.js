(function initPetLiveWebAllergyCatalog(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.allergy = root.domains.allergy || {};

  /** Reference catalog — TW/common pet food brands (search only). */
  const FOOD_BRAND_CATALOG = [
    { id: "royal-canin", name: "皇家", aliases: ["Royal Canin", "royal canin", "法國皇家"] },
    { id: "hills", name: "希爾思", aliases: ["Hill's", "Hills", "Science Diet", "處方"] },
    { id: "purina", name: "寶路", aliases: ["Purina", "Pro Plan", "冠能"] },
    { id: "orijen", name: "渴望", aliases: ["Orijen", "orijen"] },
    { id: "acana", name: "愛肯拿", aliases: ["Acana", "acana"] },
    { id: "now", name: "NOW Fresh", aliases: ["NOW", "now fresh"] },
    { id: "go", name: "GO!", aliases: ["Go!", "go solutions"] },
    { id: "natural-balance", name: "Natural Balance", aliases: ["natural balance"] },
    { id: "wellness", name: "Wellness", aliases: ["wellness core"] },
    { id: "momentum", name: "莫比", aliases: ["Momentum", "momentum"] },
    { id: "belicon", name: "Belicon", aliases: ["倍力", "belicon"] },
    { id: "nature-pro", name: "Nature Pro", aliases: ["天然密碼", "nature pro"] },
    { id: "stella", name: "Stella & Chewy's", aliases: ["stella", "chewys"] },
    { id: "ziwi", name: "巔峰", aliases: ["Ziwi Peak", "ziwi"] },
    { id: "farmina", name: "Farmina", aliases: ["法米娜", "farmina"] },
    { id: "nutram", name: "紐頓", aliases: ["Nutram", "nutram"] },
    { id: "instinct", name: "Instinct", aliases: ["instinct", "本能"] },
    { id: "canidae", name: "Canidae", aliases: ["canidae", "卡比"] },
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
