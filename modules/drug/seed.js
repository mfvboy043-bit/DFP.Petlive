/**
 * Pet Health Passport — Drug Database seed (MVP)
 * Used by modules/drug/index.js
 * Shape follows contracts: Drug
 *
 * 備註寫作原則（飼主可見）：
 * - 盡量短，像藥袋條列（用途 1 句；副作用／警語各最多 3 點）
 * - 只放分類常見提醒，不寫長篇衛教
 * - 畫面必須標明「請以當次藥袋／仿單為準」；此處非官方仿單全文
 */
export const DRUG_CLASS_GUIDES = {
  類固醇: {
    purpose: "抗發炎／免疫抑制",
    commonSideEffects: ["多喝多尿", "食欲增加", "喘氣"],
    precautions: ["勿自行突然停藥", "依藥袋漸停／回診"],
  },
  止癢藥: {
    purpose: "緩解過敏搔癢",
    commonSideEffects: ["腸胃不適", "嗜睡"],
    precautions: ["依處方使用", "搔癢惡化或感染跡象請回診"],
  },
  免疫抑制劑: {
    purpose: "調節免疫反應",
    commonSideEffects: ["腸胃不適", "感染風險↑"],
    precautions: ["依處方追蹤抽血", "勿自行調量"],
  },
  抗組織胺: {
    purpose: "輔助抗過敏",
    commonSideEffects: ["嗜睡", "口乾"],
    precautions: ["勿自行加量", "依藥袋使用"],
  },
  抗生素: {
    purpose: "治療細菌感染",
    commonSideEffects: ["軟便", "食欲下降"],
    precautions: ["吃完處方天數", "勿轉給他寵"],
  },
  抗真菌藥: {
    purpose: "治療黴菌感染",
    commonSideEffects: ["食欲下降", "嘔吐"],
    precautions: ["完成療程", "依指示追蹤"],
  },
  "止痛／消炎": {
    purpose: "止痛／抗發炎（NSAID）",
    commonSideEffects: ["嘔吐", "黑便", "不吃"],
    precautions: ["勿用人用止痛藥", "不適立刻停藥就醫"],
  },
  "止痛／鎮靜": {
    purpose: "止痛／鎮靜輔助",
    commonSideEffects: ["嗜睡", "走路不穩"],
    precautions: ["勿自行加量", "依藥袋使用"],
  },
  止吐藥: {
    purpose: "止吐",
    commonSideEffects: ["嗜睡", "流涎"],
    precautions: ["持續嘔吐請回診", "依處方時間給藥"],
  },
  腸胃藥: {
    purpose: "保護／緩解腸胃不適",
    commonSideEffects: ["軟便或便秘"],
    precautions: ["注意空腹／間隔", "依藥袋使用"],
  },
  食慾促進劑: {
    purpose: "促進食欲",
    commonSideEffects: ["興奮或嗜睡"],
    precautions: ["整天不吃請回診", "依處方劑量"],
  },
  心臟藥: {
    purpose: "支持心臟功能",
    commonSideEffects: ["食欲下降", "活力變差"],
    precautions: ["規律給藥勿漏", "喘／昏倒請急診"],
  },
  利尿劑: {
    purpose: "排水腫",
    commonSideEffects: ["多尿", "脫水風險"],
    precautions: ["確保飲水", "依指示抽血追蹤"],
  },
  血壓藥: {
    purpose: "控制血壓",
    commonSideEffects: ["活力下降"],
    precautions: ["勿突然停藥", "依指示追蹤血壓"],
  },
  泌尿放鬆劑: {
    purpose: "協助排尿",
    commonSideEffects: ["虛弱", "低血壓"],
    precautions: ["無法排尿請急診", "依藥袋使用"],
  },
  泌尿藥: {
    purpose: "泌尿相關症狀",
    commonSideEffects: ["興奮或不適"],
    precautions: ["依處方使用", "血尿請回診"],
  },
  支氣管擴張劑: {
    purpose: "緩解呼吸不順",
    commonSideEffects: ["心跳快", "興奮"],
    precautions: ["極度喘請急診", "依處方調量"],
  },
  甲狀腺藥: {
    purpose: "調節甲狀腺",
    commonSideEffects: ["嘔吐", "皮膚癢"],
    precautions: ["定期抽血調量", "勿自行停藥"],
  },
  內分泌藥: {
    purpose: "內分泌疾病控制",
    commonSideEffects: ["食欲下降", "嘔吐"],
    precautions: ["需回診監測", "勿自行調量"],
  },
  糖尿病藥: {
    purpose: "控制血糖",
    commonSideEffects: ["低血糖風險"],
    precautions: ["配合餵食時間", "無力發抖立刻處理並就醫"],
  },
  抗癲癇藥: {
    purpose: "減少癲癇發作",
    commonSideEffects: ["嗜睡", "走路不穩"],
    precautions: ["勿突然停藥", "連續發作請急診"],
  },
  體外驅蟲藥: {
    purpose: "跳蚤／壁蝨預防",
    commonSideEffects: ["嘔吐", "腹瀉", "嗜睡"],
    precautions: ["癲癇或神經病史請先告知獸醫", "顫抖／站不穩／抽搐請回診"],
  },
  體內外驅蟲藥: {
    purpose: "體內外寄生蟲預防",
    commonSideEffects: ["短暫流涎／嘔吐"],
    precautions: ["依體重選規格", "依藥袋週期"],
  },
  體內驅蟲藥: {
    purpose: "驅除體內寄生蟲",
    commonSideEffects: ["短暫嘔吐／軟便"],
    precautions: ["依體重投藥", "依藥袋使用"],
  },
  驅蟲藥: {
    purpose: "寄生蟲預防／治療",
    commonSideEffects: ["嘔吐"],
    precautions: ["依處方／藥袋", "敏感品種需獸醫評估"],
  },
  肝膽藥: {
    purpose: "支持肝膽功能",
    commonSideEffects: ["腹瀉", "嘔吐"],
    precautions: ["依指示使用", "配合回診追蹤"],
  },
  護肝藥: {
    purpose: "護肝支持",
    commonSideEffects: ["少數腸胃不適"],
    precautions: ["依藥袋使用", "不能取代病因治療"],
  },
  補充劑: {
    purpose: "營養／電解質補充",
    commonSideEffects: ["腸胃不適"],
    precautions: ["依抽血結果調整", "勿自行加量"],
  },
};

/** 單品短備註：有填則覆寫分類，不再合併（避免重複變長） */
export const DRUG_OVERRIDES = {
  d001: {
    purpose: "抗發炎／免疫抑制",
    commonSideEffects: ["多喝多尿", "食欲增加", "喘氣"],
    precautions: ["勿突然停藥，依指示漸停", "確保充足飲水"],
  },
  d010: {
    purpose: "過敏搔癢控制",
    commonSideEffects: ["嘔吐／腹瀉", "嗜睡", "食欲下降"],
    precautions: ["規律投予，僅依處方給該寵", "感染或皮膚問題惡化請回診"],
  },
  d011: {
    purpose: "過敏搔癢控制（注射）",
    commonSideEffects: ["短暫嗜睡", "腸胃不適", "注射處不適"],
    precautions: ["僅犬用，依回診週期施打", "臉腫／蕁麻疹／呼吸困難請急診"],
  },
  d050: {
    purpose: "NSAID 止痛消炎",
    commonSideEffects: ["嘔吐", "黑便", "不吃"],
    precautions: ["勿併用其他 NSAID／類固醇", "不適停藥就醫"],
  },
  d051: {
    purpose: "NSAID 止痛消炎（多用於犬）",
    commonSideEffects: ["嘔吐", "黑便"],
    precautions: ["通常不建議用於貓", "依藥袋與食物併用"],
  },
  d070: {
    purpose: "慢性心臟病支持",
    commonSideEffects: ["食欲下降", "活力變差"],
    precautions: ["定時給藥，漏藥勿雙倍", "喘或夜間咳請回診"],
  },
  d103: {
    purpose: "胰島素控糖",
    commonSideEffects: ["低血糖"],
    precautions: ["配合餵食注射", "無力發抖立刻處理並就醫"],
  },
  d120: {
    purpose: "跳蚤／壁蝨預防（異噁唑啉類）",
    commonSideEffects: ["嘔吐", "腹瀉", "嗜睡"],
    precautions: ["癲癇或神經病史請先告知獸醫", "顫抖／站不穩／抽搐請回診"],
  },
  d121: {
    purpose: "跳蚤／壁蝨預防（異噁唑啉類）",
    commonSideEffects: ["嘔吐", "腹瀉", "嗜睡"],
    precautions: ["癲癇或神經病史請先告知獸醫", "顫抖／站不穩／抽搐請回診"],
  },
  d122: {
    purpose: "跳蚤／壁蝨預防（異噁唑啉類）",
    commonSideEffects: ["嘔吐", "腹瀉", "嗜睡"],
    precautions: ["癲癇或神經病史請先告知獸醫", "顫抖／站不穩／抽搐請回診"],
  },
  d056: {
    purpose: "犬骨關節炎止痛（非傳統 NSAID）",
    commonSideEffects: ["嘔吐", "腹瀉", "食欲下降"],
    precautions: ["依處方使用", "不適請回診"],
  },
  d057: {
    purpose: "犬骨關節炎止痛（注射）",
    commonSideEffects: ["注射處不適", "嗜睡", "腸胃不適"],
    precautions: ["僅犬用，依回診週期施打", "過敏徵象請急診"],
  },
  d058: {
    purpose: "貓骨關節炎止痛（注射）",
    commonSideEffects: ["注射處不適", "嘔吐", "皮膚刺激"],
    precautions: ["僅貓用，依回診週期施打", "過敏徵象請急診"],
  },
  d067: {
    purpose: "促進食欲",
    commonSideEffects: ["流涎", "腸胃不適"],
    precautions: ["依處方劑量", "整天不吃請回診"],
  },
  d076: {
    purpose: "控制血壓／蛋白尿（多用於貓）",
    commonSideEffects: ["活力下降", "腸胃不適"],
    precautions: ["勿突然停藥", "依指示追蹤血壓"],
  },
  d077: {
    purpose: "抗血小板（血栓風險管理）",
    commonSideEffects: ["出血傾向", "腸胃不適"],
    precautions: ["依處方規律給藥", "異常出血請急診"],
  },
  d128: {
    purpose: "跳蚤／壁蝨預防（異噁唑啉類）",
    commonSideEffects: ["嘔吐", "腹瀉", "嗜睡"],
    precautions: ["癲癇或神經病史請先告知獸醫", "顫抖／站不穩／抽搐請回診"],
  },
  d129: {
    purpose: "體內外寄生蟲預防（含異噁唑啉）",
    commonSideEffects: ["嘔吐", "腹瀉", "嗜睡"],
    precautions: ["癲癇或神經病史請先告知獸醫", "顫抖／站不穩／抽搐請回診"],
  },
  d130: {
    purpose: "體內外寄生蟲預防（含異噁唑啉）",
    commonSideEffects: ["嘔吐", "腹瀉", "嗜睡"],
    precautions: ["癲癇或神經病史請先告知獸醫", "顫抖／站不穩／抽搐請回診"],
  },
  d131: {
    purpose: "體內外寄生蟲預防",
    commonSideEffects: ["局部刺激", "流涎", "腸胃不適"],
    precautions: ["確認犬貓適用", "勿讓舔到藥液"],
  },
  d132: {
    purpose: "體內外寄生蟲預防（含異噁唑啉）",
    commonSideEffects: ["局部刺激", "嘔吐", "嗜睡"],
    precautions: ["癲癇或神經病史請先告知獸醫", "顫抖／站不穩／抽搐請回診"],
  },
};

export function takeShort(list = [], max = 3) {
  return [...list].filter(Boolean).slice(0, max);
}

export function enrichDrug(drug) {
  const guide = DRUG_CLASS_GUIDES[drug.drugClass] || {
    purpose: drug.drugClass || "依獸醫指示",
    commonSideEffects: [],
    precautions: ["請以藥袋／仿單為準"],
  };
  const override = DRUG_OVERRIDES[drug.id] || {};
  const sides = override.commonSideEffects || guide.commonSideEffects;
  const precautions = override.precautions || guide.precautions;
  return {
    ...drug,
    purpose: override.purpose || guide.purpose,
    commonSideEffects: takeShort(sides, 3),
    precautions: takeShort(precautions, 3),
    noteSource: "bag_summary",
  };
}

const drugSeed = [
  // —— 類固醇 ——
  {
    id: "d001",
    genericName: "Prednisolone",
    brandNameZh: "普力松",
    brandNameEn: "Prednisolone",
    drugClass: "類固醇",
    commonAliases: ["Pred", "普力", "普力松", "類固醇", "潑尼松龍"],
  },
  {
    id: "d002",
    genericName: "Dexamethasone",
    brandNameZh: "地塞米松",
    brandNameEn: "Dexamethasone",
    drugClass: "類固醇",
    commonAliases: ["Dex", "Dexa", "地塞米松", "DEX"],
  },
  {
    id: "d003",
    genericName: "Methylprednisolone",
    brandNameZh: "甲基培尼皮質醇",
    brandNameEn: "Depo-Medrol",
    drugClass: "類固醇",
    commonAliases: ["Depo", "Depo-Medrol", "甲基類固醇"],
  },

  // —— 止癢／過敏 ——
  {
    id: "d010",
    genericName: "Oclacitinib",
    brandNameZh: "艾撲克",
    brandNameEn: "Apoquel",
    drugClass: "止癢藥",
    commonAliases: ["Apoquel", "艾撲克", "止癢", "奧拉替尼"],
  },
  {
    id: "d011",
    genericName: "Lokivetmab",
    brandNameZh: "賽妥點",
    brandNameEn: "Cytopoint",
    drugClass: "止癢藥",
    commonAliases: ["Cytopoint", "賽妥點", "止癢針"],
  },
  {
    id: "d012",
    genericName: "Cyclosporine",
    brandNameZh: "環孢靈",
    brandNameEn: "Atopica",
    drugClass: "免疫抑制劑",
    commonAliases: ["Atopica", "環孢素", "環孢靈", "CsA"],
  },
  {
    id: "d013",
    genericName: "Cetirizine",
    brandNameZh: "西替利嗪",
    brandNameEn: "Zyrtec",
    drugClass: "抗組織胺",
    commonAliases: ["Zyrtec", "仙特明", "抗組織胺"],
  },
  {
    id: "d014",
    genericName: "Diphenhydramine",
    brandNameZh: "苯海拉明",
    brandNameEn: "Benadryl",
    drugClass: "抗組織胺",
    commonAliases: ["Benadryl", "苯海拉明", "抗敏"],
  },

  // —— 抗生素 ——
  {
    id: "d020",
    genericName: "Amoxicillin",
    brandNameZh: "安莫西林",
    brandNameEn: "Amoxicillin",
    drugClass: "抗生素",
    commonAliases: ["Amox", "安莫西林", "阿莫西林"],
  },
  {
    id: "d021",
    genericName: "Amoxicillin-Clavulanate",
    brandNameZh: "奧格門",
    brandNameEn: "Clavamox",
    drugClass: "抗生素",
    commonAliases: ["Clavamox", "Synulox", "奧格門", "安莫西林＋clav", "Augmentin"],
  },
  {
    id: "d022",
    genericName: "Metronidazole",
    brandNameZh: "滅滴靈",
    brandNameEn: "Flagyl",
    drugClass: "抗生素",
    commonAliases: ["Flagyl", "滅滴靈", "Metro", "甲硝唑"],
  },
  {
    id: "d023",
    genericName: "Cephalexin",
    brandNameZh: "頭孢氨苄",
    brandNameEn: "Keflex",
    drugClass: "抗生素",
    commonAliases: ["Keflex", "頭孢", "頭孢氨苄", "Cefa"],
  },
  {
    id: "d024",
    genericName: "Cefovecin",
    brandNameZh: "便利妥",
    brandNameEn: "Convenia",
    drugClass: "抗生素",
    commonAliases: ["Convenia", "便利妥", "長效抗生素針"],
  },
  {
    id: "d025",
    genericName: "Enrofloxacin",
    brandNameZh: "拜有利",
    brandNameEn: "Baytril",
    drugClass: "抗生素",
    commonAliases: ["Baytril", "拜有利", "恩諾沙星", "喹諾酮"],
  },
  {
    id: "d026",
    genericName: "Marbofloxacin",
    brandNameZh: "馬波沙星",
    brandNameEn: "Zeniquin",
    drugClass: "抗生素",
    commonAliases: ["Zeniquin", "Marbocyl", "馬波沙星"],
  },
  {
    id: "d027",
    genericName: "Doxycycline",
    brandNameZh: "去氧羥四環黴素",
    brandNameEn: "Doxycycline",
    drugClass: "抗生素",
    commonAliases: ["Doxy", "強力黴素", "去氧羥四環素", "四環黴素"],
  },
  {
    id: "d028",
    genericName: "Clindamycin",
    brandNameZh: "克林達黴素",
    brandNameEn: "Antirobe",
    drugClass: "抗生素",
    commonAliases: ["Antirobe", "克林達", "Clinda"],
  },
  {
    id: "d029",
    genericName: "Trimethoprim-Sulfamethoxazole",
    brandNameZh: "百炎淨",
    brandNameEn: "Bactrim",
    drugClass: "抗生素",
    commonAliases: ["Bactrim", "TMP-SMX", "百炎淨", "磺胺"],
  },

  // —— 抗真菌 ——
  {
    id: "d040",
    genericName: "Itraconazole",
    brandNameZh: "伊曲康唑",
    brandNameEn: "Itrafungol",
    drugClass: "抗真菌藥",
    commonAliases: ["Itra", "伊曲康唑", "Sporanox", "黴菌藥"],
  },
  {
    id: "d041",
    genericName: "Ketoconazole",
    brandNameZh: "酮康唑",
    brandNameEn: "Ketoconazole",
    drugClass: "抗真菌藥",
    commonAliases: ["Keto", "酮康唑", "Nizoral"],
  },
  {
    id: "d042",
    genericName: "Terbinafine",
    brandNameZh: "特比萘芬",
    brandNameEn: "Lamisil",
    drugClass: "抗真菌藥",
    commonAliases: ["Lamisil", "特比萘芬", "皮膚黴菌"],
  },
  {
    id: "d043",
    genericName: "Fluconazole",
    brandNameZh: "氟康唑",
    brandNameEn: "Diflucan",
    drugClass: "抗真菌藥",
    commonAliases: ["Diflucan", "氟康唑", "Flu"],
  },

  // —— 止痛／消炎 ——
  {
    id: "d050",
    genericName: "Meloxicam",
    brandNameZh: "莫適疼",
    brandNameEn: "Metacam",
    drugClass: "止痛／消炎",
    commonAliases: ["Metacam", "莫適疼", "美洛昔康", "NSAID"],
  },
  {
    id: "d051",
    genericName: "Carprofen",
    brandNameZh: "卡布洛芬",
    brandNameEn: "Rimadyl",
    drugClass: "止痛／消炎",
    commonAliases: ["Rimadyl", "卡布洛芬", "NSAID"],
  },
  {
    id: "d052",
    genericName: "Robenacoxib",
    brandNameZh: "昂適妥",
    brandNameEn: "Onsior",
    drugClass: "止痛／消炎",
    commonAliases: ["Onsior", "昂適妥", "羅苯昔布"],
  },
  {
    id: "d053",
    genericName: "Gabapentin",
    brandNameZh: "加巴噴丁",
    brandNameEn: "Gabapentin",
    drugClass: "止痛／鎮靜",
    commonAliases: ["Gaba", "加巴", "加巴噴丁", "神經痛"],
  },
  {
    id: "d054",
    genericName: "Tramadol",
    brandNameZh: "曲馬多",
    brandNameEn: "Tramadol",
    drugClass: "止痛／鎮靜",
    commonAliases: ["Tramadol", "曲馬多", "止痛"],
  },
  {
    id: "d055",
    genericName: "Firocoxib",
    brandNameZh: "菲羅昔布",
    brandNameEn: "Previcox",
    drugClass: "止痛／消炎",
    commonAliases: ["Previcox", "菲羅昔布"],
  },
  {
    id: "d056",
    genericName: "Grapiprant",
    brandNameZh: "Galliprant",
    brandNameEn: "Galliprant",
    drugClass: "止痛／消炎",
    commonAliases: ["Galliprant", "格拉普蘭", "犬關節炎"],
  },
  {
    id: "d057",
    genericName: "Bedinvetmab",
    brandNameZh: "Librela",
    brandNameEn: "Librela",
    drugClass: "止痛／消炎",
    commonAliases: ["Librela", "貝替單抗", "犬關節針"],
  },
  {
    id: "d058",
    genericName: "Frunevetmab",
    brandNameZh: "Solensia",
    brandNameEn: "Solensia",
    drugClass: "止痛／消炎",
    commonAliases: ["Solensia", "弗魯單抗", "貓關節針"],
  },

  // —— 腸胃 ——
  {
    id: "d060",
    genericName: "Maropitant",
    brandNameZh: "止吐寧",
    brandNameEn: "Cerenia",
    drugClass: "止吐藥",
    commonAliases: ["Cerenia", "止吐寧", "止吐", "馬羅皮坦"],
  },
  {
    id: "d061",
    genericName: "Metoclopramide",
    brandNameZh: "胃復安",
    brandNameEn: "Primperan",
    drugClass: "腸胃藥",
    commonAliases: ["Primperan", "胃復安", "MCP"],
  },
  {
    id: "d062",
    genericName: "Omeprazole",
    brandNameZh: "奧美拉唑",
    brandNameEn: "Losec",
    drugClass: "腸胃藥",
    commonAliases: ["Losec", "奧美拉唑", "胃藥", "PPI"],
  },
  {
    id: "d063",
    genericName: "Famotidine",
    brandNameZh: "法莫替丁",
    brandNameEn: "Pepcid",
    drugClass: "腸胃藥",
    commonAliases: ["Pepcid", "法莫替丁", "H2"],
  },
  {
    id: "d064",
    genericName: "Sucralfate",
    brandNameZh: "硫糖鋁",
    brandNameEn: "Sucralfate",
    drugClass: "腸胃藥",
    commonAliases: ["Sucralfate", "硫糖鋁", "胃黏膜保護"],
  },
  {
    id: "d065",
    genericName: "Ondansetron",
    brandNameZh: "昂丹司瓊",
    brandNameEn: "Zofran",
    drugClass: "止吐藥",
    commonAliases: ["Zofran", "昂丹司瓊", "止吐"],
  },
  {
    id: "d066",
    genericName: "Mirtazapine",
    brandNameZh: "米氮平",
    brandNameEn: "Mirataz",
    drugClass: "食慾促進劑",
    commonAliases: ["Mirataz", "米氮平", "開胃", "食慾"],
  },
  {
    id: "d067",
    genericName: "Capromorelin",
    brandNameZh: "Entyce",
    brandNameEn: "Entyce",
    drugClass: "食慾促進劑",
    commonAliases: ["Entyce", "Elura", "卡普莫瑞林", "開胃"],
  },

  // —— 心臟／血壓 ——
  {
    id: "d070",
    genericName: "Pimobendan",
    brandNameZh: "維心",
    brandNameEn: "Vetmedin",
    drugClass: "心臟藥",
    commonAliases: ["Vetmedin", "維心", "匹莫苯丹", "心衰竭"],
  },
  {
    id: "d071",
    genericName: "Furosemide",
    brandNameZh: "呋塞米",
    brandNameEn: "Lasix",
    drugClass: "利尿劑",
    commonAliases: ["Lasix", "呋塞米", "利尿劑", "Furo"],
  },
  {
    id: "d072",
    genericName: "Benazepril",
    brandNameZh: "貝那普利",
    brandNameEn: "Fortekor",
    drugClass: "心臟藥",
    commonAliases: ["Fortekor", "貝那普利", "ACEI"],
  },
  {
    id: "d073",
    genericName: "Enalapril",
    brandNameZh: "依那普利",
    brandNameEn: "Enalapril",
    drugClass: "心臟藥",
    commonAliases: ["Enalapril", "依那普利", "ACEI"],
  },
  {
    id: "d074",
    genericName: "Spironolactone",
    brandNameZh: "螺內酯",
    brandNameEn: "Spironolactone",
    drugClass: "利尿劑",
    commonAliases: ["Spiro", "螺內酯", "保鉀利尿"],
  },
  {
    id: "d075",
    genericName: "Amlodipine",
    brandNameZh: "氨氯地平",
    brandNameEn: "Amlodipine",
    drugClass: "血壓藥",
    commonAliases: ["Amlodipine", "氨氯地平", "降血壓", "貓高血壓"],
  },
  {
    id: "d076",
    genericName: "Telmisartan",
    brandNameZh: "替米沙坦",
    brandNameEn: "Semintra",
    drugClass: "血壓藥",
    commonAliases: ["Semintra", "替米沙坦", "貓高血壓", "蛋白尿"],
  },
  {
    id: "d077",
    genericName: "Clopidogrel",
    brandNameZh: "氯吡格雷",
    brandNameEn: "Plavix",
    drugClass: "心臟藥",
    commonAliases: ["Plavix", "氯吡格雷", "抗血小板", "心肌病"],
  },

  // —— 泌尿 ——
  {
    id: "d080",
    genericName: "Prazosin",
    brandNameZh: "派唑嗪",
    brandNameEn: "Minipress",
    drugClass: "泌尿放鬆劑",
    commonAliases: ["Minipress", "派唑嗪", "泌尿", "尿道放鬆"],
  },
  {
    id: "d081",
    genericName: "Phenylpropanolamine",
    brandNameZh: "苯丙醇胺",
    brandNameEn: "Proin",
    drugClass: "泌尿藥",
    commonAliases: ["Proin", "PPA", "尿失禁"],
  },

  // —— 呼吸道 ——
  {
    id: "d090",
    genericName: "Theophylline",
    brandNameZh: "茶鹼",
    brandNameEn: "Theophylline",
    drugClass: "支氣管擴張劑",
    commonAliases: ["茶鹼", "喘藥", "氣管"],
  },
  {
    id: "d091",
    genericName: "Terbutaline",
    brandNameZh: "特布他林",
    brandNameEn: "Terbutaline",
    drugClass: "支氣管擴張劑",
    commonAliases: ["Terbutaline", "特布他林", "喘"],
  },

  // —— 內分泌 ——
  {
    id: "d100",
    genericName: "Methimazole",
    brandNameZh: "甲硫咪唑",
    brandNameEn: "Felimazole",
    drugClass: "甲狀腺藥",
    commonAliases: ["Felimazole", "甲硫咪唑", "甲亢", "貓甲亢"],
  },
  {
    id: "d101",
    genericName: "Levothyroxine",
    brandNameZh: "左甲狀腺素",
    brandNameEn: "Thyroxine",
    drugClass: "甲狀腺藥",
    commonAliases: ["Thyroxine", "左旋甲狀腺素", "甲減", "T4"],
  },
  {
    id: "d102",
    genericName: "Trilostane",
    brandNameZh: "曲洛司坦",
    brandNameEn: "Vetoryl",
    drugClass: "內分泌藥",
    commonAliases: ["Vetoryl", "曲洛司坦", "庫欣", "Cushing"],
  },
  {
    id: "d103",
    genericName: "Insulin",
    brandNameZh: "胰島素",
    brandNameEn: "Caninsulin",
    drugClass: "糖尿病藥",
    commonAliases: ["Caninsulin", "Lantus", "胰島素", "糖尿病", "Insulin"],
  },

  // —— 神經／癲癇 ——
  {
    id: "d110",
    genericName: "Phenobarbital",
    brandNameZh: "苯巴比妥",
    brandNameEn: "Phenobarbital",
    drugClass: "抗癲癇藥",
    commonAliases: ["PB", "Pheno", "苯巴比妥", "癲癇"],
  },
  {
    id: "d111",
    genericName: "Levetiracetam",
    brandNameZh: "左乙拉西坦",
    brandNameEn: "Keppra",
    drugClass: "抗癲癇藥",
    commonAliases: ["Keppra", "左乙拉西坦", "癲癇"],
  },
  {
    id: "d112",
    genericName: "Potassium Bromide",
    brandNameZh: "溴化鉀",
    brandNameEn: "KBr",
    drugClass: "抗癲癇藥",
    commonAliases: ["KBr", "溴化鉀", "Bromide"],
  },

  // —— 驅蟲／體外寄生蟲 ——
  {
    id: "d120",
    genericName: "Fluralaner",
    brandNameZh: "必威除",
    brandNameEn: "Bravecto",
    drugClass: "體外驅蟲藥",
    commonAliases: ["Bravecto", "必威除", "除蚤", "蜱"],
  },
  {
    id: "d121",
    genericName: "Afoxolaner",
    brandNameZh: "內斯加",
    brandNameEn: "NexGard",
    drugClass: "體外驅蟲藥",
    commonAliases: ["NexGard", "內斯加", "除蚤"],
  },
  {
    id: "d122",
    genericName: "Sarolaner",
    brandNameZh: "辛帕力",
    brandNameEn: "Simparica",
    drugClass: "體外驅蟲藥",
    commonAliases: ["Simparica", "辛帕力", "除蚤"],
  },
  {
    id: "d123",
    genericName: "Selamectin",
    brandNameZh: "大寵愛",
    brandNameEn: "Revolution",
    drugClass: "體內外驅蟲藥",
    commonAliases: ["Revolution", "Stronghold", "大寵愛", "滴劑"],
  },
  {
    id: "d124",
    genericName: "Milbemycin Oxime",
    brandNameZh: "美貝黴素",
    brandNameEn: "Interceptor",
    drugClass: "體內驅蟲藥",
    commonAliases: ["Interceptor", "Milbemax", "美貝黴素", "心絲蟲"],
  },
  {
    id: "d125",
    genericName: "Fenbendazole",
    brandNameZh: "芬苯達唑",
    brandNameEn: "Panacur",
    drugClass: "體內驅蟲藥",
    commonAliases: ["Panacur", "芬苯達唑", "驅蟲"],
  },
  {
    id: "d126",
    genericName: "Praziquantel",
    brandNameZh: "吡喹酮",
    brandNameEn: "Droncit",
    drugClass: "體內驅蟲藥",
    commonAliases: ["Droncit", "吡喹酮", "絛蟲"],
  },
  {
    id: "d127",
    genericName: "Ivermectin",
    brandNameZh: "伊維菌素",
    brandNameEn: "Ivomec",
    drugClass: "驅蟲藥",
    commonAliases: ["Ivomec", "伊維菌素", "心絲蟲"],
  },
  {
    id: "d128",
    genericName: "Lotilaner",
    brandNameZh: "克雷德利歐",
    brandNameEn: "Credelio",
    drugClass: "體外驅蟲藥",
    commonAliases: ["Credelio", "Lotilaner", "除蚤"],
  },
  {
    id: "d129",
    genericName: "Sarolaner-Moxidectin-Pyrantel",
    brandNameZh: "辛帕力三合一",
    brandNameEn: "Simparica Trio",
    drugClass: "體內外驅蟲藥",
    commonAliases: ["Simparica Trio", "辛帕力Trio", "三合一"],
  },
  {
    id: "d130",
    genericName: "Afoxolaner-Milbemycin",
    brandNameZh: "內斯加光譜",
    brandNameEn: "NexGard Spectra",
    drugClass: "體內外驅蟲藥",
    commonAliases: ["NexGard Spectra", "內斯加Spectra", "光譜"],
  },
  {
    id: "d131",
    genericName: "Selamectin-Sarolaner",
    brandNameZh: "大寵愛Plus",
    brandNameEn: "Revolution Plus",
    drugClass: "體內外驅蟲藥",
    commonAliases: ["Revolution Plus", "Stronghold Plus", "大寵愛Plus"],
  },
  {
    id: "d132",
    genericName: "Fluralaner-Moxidectin",
    brandNameZh: "必威除Plus",
    brandNameEn: "Bravecto Plus",
    drugClass: "體內外驅蟲藥",
    commonAliases: ["Bravecto Plus", "必威除Plus", "貓用"],
  },

  // —— 肝膽／其他常用 ——
  {
    id: "d140",
    genericName: "Ursodeoxycholic Acid",
    brandNameZh: "熊去氧膽酸",
    brandNameEn: "Ursodiol",
    drugClass: "肝膽藥",
    commonAliases: ["Ursodiol", "UDCA", "熊去氧膽酸", "利膽"],
  },
  {
    id: "d141",
    genericName: "S-Adenosylmethionine",
    brandNameZh: "SAMe",
    brandNameEn: "Denosyl",
    drugClass: "護肝藥",
    commonAliases: ["Denosyl", "SAMe", "護肝", "S-Adenosyl"],
  },
  {
    id: "d142",
    genericName: "Lactulose",
    brandNameZh: "乳果糖",
    brandNameEn: "Lactulose",
    drugClass: "腸胃藥",
    commonAliases: ["Lactulose", "乳果糖", "通便", "肝性腦病"],
  },
  {
    id: "d143",
    genericName: "Potassium Gluconate",
    brandNameZh: "葡萄糖酸鉀",
    brandNameEn: "Tumil-K",
    drugClass: "補充劑",
    commonAliases: ["Tumil-K", "補鉀", "低血鉀"],
  },
  {
    id: "d144",
    genericName: "SAMe-Silybin",
    brandNameZh: "Denamarin",
    brandNameEn: "Denamarin",
    drugClass: "護肝藥",
    commonAliases: ["Denamarin", "SAMe", "水飛薊", "護肝"],
  },
].map(enrichDrug);

export const drugs = drugSeed;

