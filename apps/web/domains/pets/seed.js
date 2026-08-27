(function initPetLiveWebPetsSeed(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.domains = root.domains || {};
  root.domains.pets = root.domains.pets || {};

  const SEED_PETS = [
  {
    id: "p1",
    name: "米醬",
    species: "dog",
    speciesLabel: "犬",
    breedKey: "mixed",
    breed: "米克斯",
    gender: "female",
    isNeutered: "yes",
    birthDate: "2023-08-09",
    genderLabel: "母 · 已絕育",
    ageLabel: "3 歲",
    weight: 6.8,
    weightDate: "2026-08-02",
    tone: "linear-gradient(160deg, #7fafa0, #355f54)",
    alertCount: 2,
    alerts: [
      {
        id: "a-p1-1",
        alertType: "drug_allergy",
        source: "linked",
        type: "藥物過敏",
        text: { "zh-Hant": "Penicillin — 臉部腫脹", "en": "Penicillin — facial swelling", "ja": "ペニシリン — 顔面腫脹", "ko": "페니실린 — 안면 부종" },
        desc: { "zh-Hant": "Penicillin — 曾出現臉部腫脹", "en": "Penicillin — prior facial swelling", "ja": "ペニシリン — 以前に顔面腫脹", "ko": "페니실린 — 과거 안면 부종" },
        note: { "zh-Hant": "急診請避免同類抗生素", "en": "Avoid related antibiotics in emergencies", "ja": "救急では同類抗生物質を避ける", "ko": "응급 시 유사 항생제 피하기" },
        severity: "critical",
      },
      {
        id: "a-p1-2",
        alertType: "chronic_disease",
        source: "linked",
        type: "慢性病",
        text: { "zh-Hant": "異位性皮膚炎", "en": "Atopic dermatitis", "ja": "アトピー性皮膚炎", "ko": "아토피 피부염" },
        desc: { "zh-Hant": "異位性皮膚炎", "en": "Atopic dermatitis", "ja": "アトピー性皮膚炎", "ko": "아토피 피부염" },
        sinceDate: "2023-06",
      },
    ],
    // Emergency「目前用藥」改由 visits 推導（此寵物示範藥程至 8/6、8/8，於 8/10 起應為空）
    meds: [],
    visits: [
      {
        date: "2026-08-02",
        clinicId: "c1",
        clinic: "幸福動物醫院",
        tags: ["gastrointestinal", "dermatology"],
        weightAtVisit: 6.8,
        note: { "zh-Hant": "軟便兩天，皮膚搔癢加劇", "en": "Soft stool for 2 days; itch worse", "ja": "軟便が2日、かゆみ悪化", "ko": "연변 이틀 · 가려움 악화" },
        medications: [
          {
            id: "m-p1-1",
            name: "Prednisolone",
            dose: "5 mg · BID · 5 天",
            source: "owner",
            frequency: "BID",
            startDate: "2026-08-02",
            durationDays: 5,
            amount: 5,
            unit: "mg",
          },
          {
            id: "m-p1-2",
            name: "Apoquel",
            dose: "5.4 mg · SID · 7 天",
            source: "clinic_ref",
            frequency: "SID",
            startDate: "2026-08-02",
            durationDays: 7,
            amount: 5.4,
            unit: "mg",
          },
        ],
      },
      {
        date: "2026-06-18",
        clinicId: "c2",
        clinic: "夜間急診動物醫院",
        tags: ["gastrointestinal"],
        weightAtVisit: 6.5,
        note: { "zh-Hant": "半夜嘔吐三次，急診輸液後穩定", "en": "Vomited 3× overnight; stable after ER fluids", "ja": "夜間に3回嘔吐、救急輸液後安定", "ko": "밤중 구토 3회 · 응급 수액 후 안정" },
        medications: [
          {
            id: "m-p1-3",
            name: "Metronidazole",
            dose: "50 mg · BID · 5 天",
            source: "owner",
          },
        ],
      },
      {
        date: "2026-04-22",
        clinicId: "c3",
        clinic: "綠葉動物醫院",
        tags: ["dermatology", "ear"],
        note: { "zh-Hant": "耳道發炎合併搔癢，換院追蹤", "en": "Ear infection with itch — switched clinics for follow-up", "ja": "耳道炎とかゆみ、転院して経過観察", "ko": "외이도염+가려움 · 전원해 경과 관찰" },
        medications: [
          {
            name: "Prednisolone",
            dose: "2.5 mg · SID · 7 天",
            source: "clinic_ref",
          },
        ],
      },
      {
        date: "2026-03-10",
        clinicId: "c1",
        clinic: "幸福動物醫院",
        tags: ["checkup", "vaccine"],
        weightAtVisit: 6.5,
        note: { "zh-Hant": "年度健檢，體重 6.5 kg", "en": "Annual checkup; weight 6.5 kg", "ja": "年次健診、体重 6.5 kg", "ko": "연간 검진 · 체중 6.5 kg" },
        medications: [],
      },
    ],
    vaccines: [
      {
        name: "狂犬病",
        key: "vRabies",
        given: "2025-09-12",
        next: "2026-09-12",
        status: "soon",
      },
      {
        name: "五合一",
        key: "v5in1",
        given: "2025-09-12",
        next: "2026-09-12",
        status: "soon",
      },
    ],
    parasitePrevention: {
      external: null,
      heartworm: null,
    },
  },
  {
    id: "p2",
    name: "小黑",
    species: "dog",
    speciesLabel: "犬",
    breedKey: "shiba",
    breed: "柴犬",
    gender: "male",
    isNeutered: "yes",
    birthDate: "2021-08-09",
    genderLabel: "公 · 已絕育",
    ageLabel: "5 歲",
    weight: 12.4,
    weightDate: "2026-07-20",
    chipNumber: "982000100234567",
    tone: "linear-gradient(160deg, #5c6b74, #243039)",
    alertCount: 2,
    alerts: [
      {
        id: "a-p2-1",
        alertType: "food_allergy",
        source: "linked",
        type: "食物過敏",
        text: { "zh-Hant": "雞肉 — 會抓癢與軟便", "en": "Chicken — itching and soft stool", "ja": "鶏肉 — かゆみと軟便", "ko": "닭고기 — 가려움과 연변" },
        desc: { "zh-Hant": "雞肉 — 會抓癢與軟便", "en": "Chicken — itching and soft stool", "ja": "鶏肉 — かゆみと軟便", "ko": "닭고기 — 가려움과 연변" },
        note: { "zh-Hant": "處方糧請避免雞肉蛋白", "en": "Avoid chicken protein in prescription diets", "ja": "処方食では鶏肉たんぱくを避ける", "ko": "처방사료에서 닭 단백질 피하기" },
        severity: "caution",
      },
      {
        id: "a-p2-2",
        alertType: "chronic_disease",
        source: "linked",
        type: "慢性病",
        text: { "zh-Hant": "退化性關節炎（右後肢）", "en": "Degenerative joint disease (right hind)", "ja": "変性性関節炎（右後肢）", "ko": "퇴행성 관절염(오른쪽 뒷다리)" },
        desc: { "zh-Hant": "退化性關節炎，右後肢間歇跛行", "en": "DJD with intermittent right-hind lameness", "ja": "変性性関節炎、右後肢の間欠跛行", "ko": "퇴행성 관절염, 오른쪽 뒷다리 간헐 파행" },
        sinceDate: "2025-01",
      },
    ],
    // Emergency「目前用藥」改由 visits 推導
    meds: [],
    visits: [
      {
        date: "2026-07-20",
        clinicId: "c4",
        clinic: "忠孝動物醫院",
        tags: ["orthopedic"],
        weightAtVisit: 12.4,
        note: { "zh-Hant": "右後肢跛行兩週，X 光顯示輕度關節退化", "en": "Right-hind limp 2 weeks; X-ray mild DJD", "ja": "右後肢跛行2週間、X線で軽度の関節退化", "ko": "오른쪽 뒷다리 파행 2주 · X-ray상 경도 퇴행" },
        medications: [
          {
            name: "Gabapentin",
            dose: "100 mg · BID · 14 天",
            source: "clinic_ref",
            frequency: "BID",
            startDate: "2026-08-02",
            durationDays: 14,
            amount: 100,
            unit: "mg",
          },
        ],
      },
      {
        date: "2026-05-03",
        clinicId: "c5",
        clinic: "城市寵物診所",
        tags: ["gastrointestinal"],
        weightAtVisit: 12.4,
        note: { "zh-Hant": "誤食雞肉零食後軟便與抓癢", "en": "Soft stool and itch after chicken treats", "ja": "鶏肉おやつ後に軟便とかゆみ", "ko": "닭 간식 후 연변·가려움" },
        medications: [
          {
            name: "Metronidazole",
            dose: "125 mg · BID · 5 天",
            source: "owner",
          },
        ],
      },
      {
        date: "2026-02-14",
        clinicId: "c2",
        clinic: "夜間急診動物醫院",
        tags: ["urinary"],
        note: { "zh-Hant": "血尿急診，結石排除後觀察出院", "en": "ER for hematuria; observed after ruling out stones", "ja": "血尿で救急、結石除外後に経過観察して退院", "ko": "혈뇨 응급 · 결석 배제 후 관찰 퇴원" },
        medications: [
          {
            name: "Amoxicillin",
            dose: "150 mg · BID · 7 天",
            source: "owner",
          },
        ],
      },
      {
        date: "2025-11-08",
        clinicId: "c4",
        clinic: "忠孝動物醫院",
        tags: ["checkup", "vaccine"],
        note: { "zh-Hant": "年度健檢，建議控制體重", "en": "Annual checkup; advise weight control", "ja": "年次健診、体重管理を推奨", "ko": "연간 검진 · 체중 관리 권고" },
        medications: [],
      },
    ],
    vaccines: [
      {
        name: "狂犬病",
        key: "vRabies",
        given: "2025-11-08",
        next: "2026-11-08",
        status: "ok",
      },
      {
        name: "八合一",
        key: "v8in1",
        given: "2025-11-08",
        next: "2026-11-08",
        status: "ok",
      },
    ],
    parasitePrevention: {
      external: {
        productKey: "ppFrontline",
        product: "蚤不到 Frontline",
        lastGiven: "2026-07-15",
        intervalDays: 30,
        nextDue: "2026-08-14",
      },
      heartworm: {
        productKey: "ppMilbemax",
        product: "倍脈心 Milbemax",
        lastGiven: "2026-07-20",
        intervalDays: 30,
        nextDue: "2026-09-10",
      },
    },
  },
  {
    id: "p3",
    name: "橘寶",
    species: "cat",
    speciesLabel: "貓",
    breedKey: "orange-tabby",
    breed: "橘貓",
    gender: "male",
    isNeutered: "yes",
    birthDate: "2024-08-09",
    genderLabel: "公 · 已絕育",
    ageLabel: "2 歲",
    weight: 4.9,
    weightDate: "2026-08-01",
    tone: "linear-gradient(160deg, #d4a06a, #8a5a2b)",
    alertCount: 2,
    alerts: [
      {
        id: "a-p3-1",
        alertType: "chronic_disease",
        source: "linked",
        type: "慢性病",
        text: { "zh-Hant": "氣喘（貓氣喘）", "en": "Asthma (feline asthma)", "ja": "喘息（猫喘息）", "ko": "천식(고양이 천식)" },
        desc: { "zh-Hant": "貓氣喘，季節轉換易發作", "en": "Feline asthma — flares with season changes", "ja": "猫喘息、季節の変わり目に悪化しやすい", "ko": "고양이 천식 · 환절기에 악화되기 쉬움" },
        note: { "zh-Hant": "急診若喘鳴請優先給氧", "en": "If wheezing in ER, prioritize oxygen", "ja": "救急で喘鳴があれば酸素を優先", "ko": "응급 시 천명 있으면 산소 우선" },
        severity: "caution",
        sinceDate: "2025-09",
      },
      {
        id: "a-p3-2",
        alertType: "special_note",
        source: "linked",
        type: "特別提醒",
        text: { "zh-Hant": "看診時需防逃，建議使用提籠", "en": "Flight risk at visits — use a carrier", "ja": "通院時は逃走注意、キャリー推奨", "ko": "병원 방문 시 탈출 주의 · 이동장 사용 권장" },
        desc: { "zh-Hant": "看診時需防逃，建議使用提籠", "en": "Flight risk at visits — use a carrier", "ja": "通院時は逃走注意、キャリー推奨", "ko": "병원 방문 시 탈출 주의 · 이동장 사용 권장" },
      },
    ],
    // Emergency「目前用藥」改由 visits 推導；不再手維 pet.meds
    meds: [],
    visits: [
      {
        date: "2026-08-09",
        clinicId: "c6",
        clinic: "喵星人專科醫院",
        tags: ["respiratory", "gastrointestinal", "dermatology", "urinary"],
        note: { "zh-Hant": "【驗證用】同一筆就診含三種調劑：藥水（3藥）、膠囊 A（2藥）、膠囊 B（4藥）—請往下捲動同一卡片內查看", "en": "[Demo] One visit has 3 compounds: liquid (3), capsule A (2), capsule B (4)—scroll within the same card", "ja": "【検証用】同一受診に3種の調剤：水剤(3)、カプセルA(2)、カプセルB(4)—同じカード内で下にスクロール", "ko": "[검증용] 한 진료에 조제의약품 3종: 물약(3), 캡슐 A(2), 캡슐 B(4)—같은 카드에서 아래로 스크롤" },
        medications: [
          {
            id: "m-p3-compound-liquid",
            kind: "compound_bundle",
            name: "調劑藥水 A",
            dose: "一天兩次（BID） · 5 天",
            source: "clinic_ref",
            compoundForm: "liquid_a",
            frequency: "BID",
            startDate: "2026-08-09",
            durationDays: 5,
            ingredients: [
              {
                name: "Theophylline",
                dose: "12.5 mg · 一天兩次（BID） · 5 天",
                source: "clinic_ref",
              },
              {
                name: "Prednisolone",
                dose: "2.5 mg · 一天兩次（BID） · 5 天",
                source: "clinic_ref",
              },
              {
                name: "Maropitant",
                dose: "4 mg · 一天兩次（BID） · 5 天",
                source: "clinic_ref",
              },
            ],
          },
          {
            id: "m-p3-compound-cap-a",
            kind: "compound_bundle",
            name: "調劑膠囊 A",
            dose: "一天一次（SID） · 7 天",
            source: "owner",
            compoundForm: "capsule_a",
            frequency: "SID",
            startDate: "2026-08-09",
            durationDays: 7,
            ingredients: [
              {
                name: "Apoquel",
                dose: "5.4 mg · 一天一次（SID） · 7 天",
                source: "owner",
              },
              {
                name: "Cetirizine",
                dose: "2.5 mg · 一天一次（SID） · 7 天",
                source: "owner",
              },
            ],
          },
          {
            id: "m-p3-compound-cap-b",
            kind: "compound_bundle",
            name: "調劑膠囊 B",
            dose: "一天兩次（BID） · 4 天",
            source: "clinic_ref",
            compoundForm: "capsule_b",
            frequency: "BID",
            startDate: "2026-08-09",
            durationDays: 4,
            ingredients: [
              {
                name: "Amoxicillin",
                dose: "50 mg · 一天兩次（BID） · 4 天",
                source: "clinic_ref",
              },
              {
                name: "Metronidazole",
                dose: "25 mg · 一天兩次（BID） · 4 天",
                source: "clinic_ref",
              },
              {
                name: "Ondansetron",
                dose: "1 mg · 一天兩次（BID） · 4 天",
                source: "clinic_ref",
              },
              {
                name: "Sucralfate",
                dose: "250 mg · 一天兩次（BID） · 4 天",
                source: "clinic_ref",
              },
            ],
          },
        ],
      },
      {
        date: "2026-08-01",
        clinicId: "c6",
        clinic: "喵星人專科醫院",
        tags: ["respiratory"],
        note: { "zh-Hant": "換季喘鳴與腹式呼吸，吸入治療後改善", "en": "Seasonal wheeze & abdominal breathing; improved after inhaler", "ja": "季節の変わり目の喘鳴と腹式呼吸、吸入後改善", "ko": "환절기 천명·복식호흡 · 흡입 치료 후 개선" },
        medications: [
          {
            name: "Theophylline",
            dose: "25 mg · BID · 10 天",
            source: "clinic_ref",
          },
        ],
      },
      {
        date: "2026-06-09",
        clinicId: "c1",
        clinic: "幸福動物醫院",
        tags: ["urinary"],
        note: { "zh-Hant": "頻尿、蹲廁所時間變長，FLUTD 發作", "en": "Pollakiuria, long litter-box time; FLUTD flare", "ja": "頻尿・長いトイレ時間、FLUTD発作", "ko": "빈뇨·화장실 시간 증가 · FLUTD 발작" },
        medications: [
          {
            name: "Prazosin",
            dose: "0.5 mg · SID · 7 天",
            source: "owner",
          },
        ],
      },
      {
        date: "2026-03-28",
        clinicId: "c2",
        clinic: "夜間急診動物醫院",
        tags: ["urinary", "gastrointestinal"],
        note: { "zh-Hant": "無法排尿急診導尿，隔日轉回專科追蹤", "en": "Could not urinate; ER cath, then specialty follow-up", "ja": "排尿困難で救急導尿、翌日専門科へ", "ko": "배뇨 불가 · 응급 도뇨 후 전문과 추적" },
        medications: [
          {
            name: "Prazosin",
            dose: "0.5 mg · BID · 5 天",
            source: "owner",
          },
        ],
      },
      {
        date: "2026-01-15",
        clinicId: "c6",
        clinic: "喵星人專科醫院",
        tags: ["checkup", "vaccine"],
        note: { "zh-Hant": "年度健檢，建議維持濕食比例", "en": "Annual checkup; keep wet-food share", "ja": "年次健診、ウェット食の比率維持を推奨", "ko": "연간 검진 · 습식 비율 유지 권고" },
        medications: [],
      },
    ],
    vaccines: [
      {
        name: "三合一",
        key: "v3in1",
        given: "2026-01-15",
        next: "2027-01-15",
        status: "ok",
      },
      {
        name: "貓白血病",
        key: "vFelv",
        given: "2025-08-20",
        next: "2026-08-20",
        status: "soon",
      },
    ],
    parasitePrevention: {
      external: null,
      heartworm: null,
    },
  },
];

  function cloneSeedPets() {
    try {
      return JSON.parse(JSON.stringify(SEED_PETS));
    } catch {
      return SEED_PETS.map((pet) => ({ ...pet }));
    }
  }

  root.domains.pets.SEED_PETS = SEED_PETS;
  root.domains.pets.cloneSeedPets = cloneSeedPets;
})(typeof window !== "undefined" ? window : globalThis);
