// Drug seed: modules/drug/seed.js via runtime/petlive.js → window.drugs

const CLINIC_PRESETS = [
  { id: "c1", name: "幸福動物醫院", noteKey: "clinicGeneral", anonymous: false },
  { id: "c2", name: "夜間急診動物醫院", noteKey: "clinicEmergency", anonymous: false },
  { id: "c3", name: "綠葉動物醫院", noteKey: "clinicGeneral", anonymous: false },
  { id: "c4", name: "忠孝動物醫院", noteKey: "clinicGeneral", anonymous: false },
  { id: "c5", name: "城市寵物診所", noteKey: "clinicGeneral", anonymous: false },
  { id: "c6", name: "喵星人專科醫院", noteKey: "clinicCat", anonymous: false },
];

function clinicNameOf(clinic) {
  if (!clinic) return "";
  return clinic.name || (clinic.nameKey ? t(clinic.nameKey) : "");
}

function getAnonymousClinic() {
  return {
    id: "anonymous",
    name: t("anonymousClinic"),
    note: t("anonymousClinicNote"),
    anonymous: true,
  };
}

function getClinicDirectory() {
  const anonymous = getAnonymousClinic();
  const presets = CLINIC_PRESETS.map((clinic) => ({
    ...clinic,
    name: clinicNameOf(clinic),
    note: t(clinic.noteKey),
  }));
  const fromVisits = pets.flatMap((pet) =>
    (pet.visits || []).map((visit) => visitClinicLabel(visit)).filter(Boolean)
  );
  const names = new Set(presets.map((clinic) => clinic.name));
  const extra = fromVisits
    .filter((name) => !names.has(name) && name !== anonymous.name)
    .filter((name, index, arr) => arr.indexOf(name) === index)
    .map((name, index) => ({
      id: `extra-${index}`,
      name,
      note: t("clinicFromHistory"),
      anonymous: false,
    }));
  // Pin anonymous first so clinics that prefer not to be named see it immediately.
  return [anonymous, ...presets, ...extra];
}

function getSourceTags() {
  return {
    owner: { label: t("sourceOwner"), className: "tag-owner" },
    owner_proof: { label: t("sourceOwnerProof"), className: "tag-owner-proof" },
    clinic_ref: { label: t("sourceClinicRef"), className: "tag-clinic-ref" },
  };
}

function speciesLabelOf(pet) {
  return t(pet.species) || pet.speciesLabel || t("other");
}

/** Symptom tag key → i18n key (includes legacy zh seed labels). */
const VISIT_TAG_I18N = {
  gastrointestinal: "tagGi",
  urinary: "tagUrinary",
  respiratory: "tagRespiratory",
  dermatology: "tagDerm",
  ear: "tagEar",
  eye: "tagEye",
  dental: "tagDental",
  neurology: "tagNeuro",
  orthopedic: "tagOrtho",
  autoimmune: "tagAutoimmune",
  checkup: "tagCheckup",
  vaccine: "tagVaccine",
  腸胃: "tagGi",
  泌尿: "tagUrinary",
  呼吸道: "tagRespiratory",
  皮膚: "tagDerm",
  耳朵: "tagEar",
  眼睛: "tagEye",
  牙科: "tagDental",
  口腔: "tagDental",
  "牙科／口腔": "tagDental",
  神經: "tagNeuro",
  骨科: "tagOrtho",
  自體免疫: "tagAutoimmune",
  健康檢查: "tagCheckup",
  疫苗: "tagVaccine",
};

function visitTagLabel(tag) {
  const key = VISIT_TAG_I18N[tag];
  return key ? t(key) : tag;
}

function breedLabelOf(pet) {
  const breedKey = pet.breedKey;
  if (breedKey && breedKey !== BREED_CUSTOM_VALUE) {
    const list = getBreedListForSpecies(pet.species);
    const found = list.find((breed) => breed.value === breedKey);
    if (found) return breedOptionLabel(found);
  }
  return pet.breed || "";
}

function ageLabelOf(pet) {
  if (pet.birthDate) return formatAgeLabel(pet.birthDate);
  return pet.ageLabel || t("ageUnknown");
}

function genderLabelOf(pet) {
  if (pet.gender) {
    return formatGenderLabel(pet.gender, pet.isNeutered || "unknown");
  }
  return pet.genderLabel || "";
}

/** Localized demo/content field: plain string or { "zh-Hant"|en|ja|ko: "..." }. */
function locField(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const lang =
      (typeof getCurrentLang === "function" && getCurrentLang()) || "zh-Hant";
    return (
      value[lang] ||
      value["zh-Hant"] ||
      value.zh ||
      value.en ||
      value.ja ||
      value.ko ||
      ""
    );
  }
  return String(value);
}

function visitClinicLabel(visit) {
  if (!visit) return "";
  if (visit.clinicId) {
    const preset = CLINIC_PRESETS.find((clinic) => clinic.id === visit.clinicId);
    if (preset) return clinicNameOf(preset);
    if (visit.clinicId === "anonymous") return t("anonymousClinic");
  }
  return locField(visit.clinic);
}

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

const pets = [];
const archivedPets = [];

const PETS_GRAPH_KEY = "petlive-pets-graph";
const SYNC_META_KEY = "petlive-sync-meta";
const INTRO_SEEN_KEY = "petlive-intro-seen";
const DEMO_TOUR_SEEN_KEY = "petlive-demo-tour-seen";

function isFreshBootMode() {
  try {
    return new URLSearchParams(window.location.search || "").get("fresh") === "1";
  } catch {
    return false;
  }
}

function isRestoreBootMode() {
  try {
    return new URLSearchParams(window.location.search || "").get("restore") === "1";
  } catch {
    return false;
  }
}

const FRESH_BOOT = isFreshBootMode();
const RESTORE_BOOT = isRestoreBootMode();

function clearLocalPetliveData() {
  const keys = [
    PETS_GRAPH_KEY,
    SYNC_META_KEY,
    INTRO_SEEN_KEY,
    DEMO_TOUR_SEEN_KEY,
    "petlive-pet-alerts",
    "petlive-suppressed-alerts",
    "petlive-pet-photos",
    "petlive-lab-reports",
    "petlive-owner-profile",
  ];
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    sessionStorage.removeItem("petlive-google-token");
    sessionStorage.removeItem("petlive-google-profile");
  } catch {
    /* ignore */
  }
}

if (FRESH_BOOT) {
  clearLocalPetliveData();
}

function isDemoMode() {
  try {
    return new URLSearchParams(window.location.search || "").get("demo") === "1";
  } catch {
    return false;
  }
}

const DEMO_MODE = isDemoMode();

function cloneSeedPets() {
  try {
    return JSON.parse(JSON.stringify(SEED_PETS));
  } catch {
    return SEED_PETS.map((pet) => ({ ...pet }));
  }
}

function isPetsGraphShape(value) {
  return (
    value &&
    typeof value === "object" &&
    Array.isArray(value.pets) &&
    Array.isArray(value.archivedPets)
  );
}

const petsGraphSlot = PetLiveWeb.storage.createJsonSlot({
  key: PETS_GRAPH_KEY,
  fallback: () => ({
    version: 1,
    pets: [],
    archivedPets: [],
    currentPetId: null,
  }),
  validate: isPetsGraphShape,
  coalesceMs: 220,
});

function hasStoredPetsGraph() {
  try {
    return Boolean(localStorage.getItem(PETS_GRAPH_KEY));
  } catch {
    return false;
  }
}

function hydratePetsGraphFromStorage() {
  if (DEMO_MODE) {
    pets.length = 0;
    archivedPets.length = 0;
    for (const pet of cloneSeedPets()) pets.push(pet);
    return pets[0]?.id || null;
  }
  if (!hasStoredPetsGraph()) {
    pets.length = 0;
    archivedPets.length = 0;
    return null;
  }
  const data = petsGraphSlot.read();
  // Never rehydrate prototype seed when the stored graph is empty.
  const nextPets = Array.isArray(data.pets) ? data.pets : [];
  const nextArchived = Array.isArray(data.archivedPets) ? data.archivedPets : [];
  pets.length = 0;
  archivedPets.length = 0;
  for (const pet of nextPets) pets.push(pet);
  for (const pet of nextArchived) archivedPets.push(pet);
  // Drop leftover prototype seed graphs left from unsigned browsing.
  if (isSeedOnlyPets(pets) && !DEMO_MODE) {
    pets.length = 0;
    archivedPets.length = 0;
    try {
      petsGraphSlot.write({
        version: 1,
        pets: [],
        archivedPets: [],
        currentPetId: null,
      });
    } catch {
      /* ignore */
    }
    return null;
  }
  return data.currentPetId || pets[0]?.id || null;
}

function loadSeedPetsIntoMemory() {
  pets.length = 0;
  archivedPets.length = 0;
  for (const pet of cloneSeedPets()) pets.push(pet);
  const nextId = pets[0]?.id || null;
  if (nextId) {
    currentPetId = nextId;
    appState.setCurrentPetId(nextId);
  }
  return nextId;
}

function schedulePetsGraphPersist() {
  if (DEMO_MODE) return;
  const id =
    typeof appState !== "undefined" && appState?.getCurrentPetId
      ? appState.getCurrentPetId()
      : currentPetId;
  petsGraphSlot.scheduleWrite({
    version: 1,
    pets,
    archivedPets,
    currentPetId: id || null,
  });
  bumpLocalDataRevision();
}

hydratePetsGraphFromStorage();

const app = document.getElementById("app");
const toastEl = document.getElementById("toast");
const petPicker = document.getElementById("pet-picker");
const petSwitcher = document.getElementById("pet-switcher");
const petSwitcherHint = document.getElementById("pet-switcher-hint");
const petManageBtn = document.getElementById("pet-manage-btn");
const petAddBtn = document.getElementById("pet-add-btn");
const petNameEl = document.getElementById("pet-name");
const petSubEl = document.getElementById("pet-sub");
const petCurrentEl = document.getElementById("pet-current");
const alertCountBtn = document.getElementById("alert-count-btn");
const archiveList = document.getElementById("archive-list");
const archiveBtn = document.getElementById("archive-btn");
const timelineSub = document.getElementById("timeline-sub");
const timelineList = document.getElementById("timeline-list");
const alertList = document.getElementById("alert-list");
const alertSections = document.getElementById("alert-sections");
const alertForm = document.getElementById("alert-form");
const alertTypeChips = document.getElementById("alert-type-chips");
const alertSeverityChips = document.getElementById("alert-severity-chips");
const alertDescriptionInput = document.getElementById("alert-description");
const alertSeverityInput = document.getElementById("alert-severity-note");
const alertEditIdInput = document.getElementById("alert-edit-id");
const alertSubmitBtn = document.getElementById("alert-submit-btn");
const alertCancelEditBtn = document.getElementById("alert-cancel-edit");
let selectedAlertType = "drug_allergy";
let selectedAlertSeverity = "critical";
const vaccineList = document.getElementById("vaccine-list");
const vaccineSub = document.getElementById("vaccine-sub");
const vaccineForm = document.getElementById("vaccine-form");
const vaccineChipsEl = document.getElementById("vaccine-chips");
const vaccineCustomName = document.getElementById("vaccine-custom-name");
const vaccineGivenInput = document.getElementById("vaccine-given");
const vaccineNextDueInput = document.getElementById("vaccine-next-due");
const selectedVaccineKeys = new Set();
const visitFormSub = document.getElementById("visit-form-sub");
const eName = document.getElementById("e-name");
const eSub = document.getElementById("e-sub");
const eBirthLine = document.getElementById("e-birth-line");
const eChipLine = document.getElementById("e-chip-line");
const eWeight = document.getElementById("e-weight");
const eAlerts = document.getElementById("e-alerts");
const eMeds = document.getElementById("e-meds");

const selectedTags = new Set();
let selectedDrug = null;
let selectedClinic = null;
let currentPetId = pets[0]?.id || null;
const appState = PetLiveWeb.state.createAppState({
  pets,
  archivedPets,
  initialPetId: currentPetId,
});
currentPetId = appState.getCurrentPetId();
let isManagingPets = false;
let pendingRemovePetId = null;
let removeStep = 1;
let pendingArchivePetId = null;
let pendingProofMed = null;
let pendingProofVisitIndex = null;
let pendingBagPhoto = null;
let pendingRxPhoto = null;
let pendingDrugPhoto = null;
let pendingImagingVisitIndex = null;
let pendingXrayPhotos = [];
let pendingUsPhotos = [];
/** In-flight `readAndCompressImage` ops for imaging-proof; Save must wait while > 0. */
let imagingCompressInFlight = 0;
let pendingVisitImagingIndex = null;
/** User collapsed the latest visit’s 藥單 this timeline visit; skip auto-expand until leave. */
let latestRxUserCollapsed = false;
let pendingMeds = [];
let medEntryMode = "photo";
let liveBagPhoto = null;
let liveRxPhoto = null;
let liveDrugPhoto = null;
/** When set, structured med saves append to this visit instead of creating from the visit form. */
let completingVisitRef = null;
/** Session overrides: compoundGroup → hex */
const compoundColorByGroup = Object.create(null);

function showToast(message) {
  toastEl.hidden = false;
  toastEl.textContent = message;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toastEl.hidden = true;
  }, 2200);
}

function showPersistenceFailure() {
  const language = document.documentElement.lang || "zh-Hant";
  const message = language.startsWith("en")
    ? "Could not save—please try again"
    : language.startsWith("ja")
      ? "保存できませんでした。もう一度お試しください"
      : language.startsWith("ko")
        ? "저장하지 못했습니다. 다시 시도해 주세요"
        : "儲存失敗，請再試一次";
  showToast(message);
}

function notifyDemoReadOnly() {
  showToast(t("demoReadOnlyToast"));
}

function demoBlocksWrite() {
  if (!DEMO_MODE) return false;
  notifyDemoReadOnly();
  return true;
}

function getCurrentPet() {
  const pet = appState.getCurrentPet();
  currentPetId = appState.getCurrentPetId();
  return pet;
}

function formatShortDate(isoDate) {
  const [, month, day] = isoDate.split("-");
  return `${month}/${day}`;
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getMedEndDate(med) {
  return addDays(med.startDate, med.durationDays - 1);
}

function todayIsoLocal() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDurationDaysFromDose(dose) {
  const match = String(dose || "").match(/(\d+)\s*天/);
  if (!match) return null;
  const days = Number(match[1]);
  return Number.isInteger(days) && days > 0 ? days : null;
}

function resolveMedCourse(med, visit) {
  const startDate = med.startDate || visit?.date || null;
  const durationDays =
    med.durationDays ||
    parseDurationDaysFromDose(med.dose) ||
    null;
  if (!startDate || !durationDays || !(durationDays > 0)) return null;
  return {
    startDate,
    durationDays,
    endDate: addDays(startDate, durationDays - 1),
  };
}

function isMedCourseActive(course, today = todayIsoLocal()) {
  if (!course) return false;
  return today >= course.startDate && today <= course.endDate;
}

/** Active courses for emergency card / copy — derived from visits only.
 *  Compound bundles are flattened to ingredient rows (no “調劑藥水 A” type header).
 */
function deriveActiveEmergencyMeds(pet) {
  const today = todayIsoLocal();
  const active = [];

  (pet.visits || []).forEach((visit) => {
    (visit.medications || []).forEach((med) => {
      if (med.kind === "photo_bundle") return;
      const course = resolveMedCourse(med, visit);
      if (!isMedCourseActive(course, today)) return;

      if (med.kind === "compound_bundle") {
        const ingredients = med.ingredients || [];
        if (!ingredients.length) return;
        ingredients.forEach((ing) => {
          if (!ing?.name) return;
          active.push({
            kind: "single",
            name: ing.name,
            dose: ing.dose,
            frequency: med.frequency,
            startDate: course.startDate,
            durationDays: course.durationDays,
            source: ing.source || med.source,
          });
        });
        return;
      }

      const amount = med.amount ?? med.dosageAmount;
      const unit = med.unit || med.dosageUnit;
      active.push({
        kind: "single",
        name: med.name,
        dose: med.dose,
        frequency: med.frequency,
        dosageAmount: amount,
        dosageUnit: unit,
        startDate: course.startDate,
        durationDays: course.durationDays,
        source: med.source,
      });
    });
  });

  return active;
}

function formatFrequencyLabel(frequency) {
  const raw = String(frequency || "").trim();
  if (!raw || raw === "unrecorded") return "";
  const code = raw.toUpperCase();
  const labels = {
    SID: t("freqLabelSid"),
    BID: t("freqLabelBid"),
    TID: t("freqLabelTid"),
    EOD: t("freqLabelEod"),
  };
  if (labels[code]) return `${labels[code]} (${code})`;
  return code;
}

/** Expand SID/BID/… and localized day counts inside stored dose strings. */
function expandFrequencyInText(text) {
  if (!text) return text;
  return String(text)
    .replace(/ · SID(?= · |$)/g, ` · ${formatFrequencyLabel("SID")}`)
    .replace(/ · BID(?= · |$)/g, ` · ${formatFrequencyLabel("BID")}`)
    .replace(/ · TID(?= · |$)/g, ` · ${formatFrequencyLabel("TID")}`)
    .replace(/ · EOD(?= · |$)/g, ` · ${formatFrequencyLabel("EOD")}`)
    .replace(/ · (\d+) 天(?= · |$)/g, (_, n) => ` · ${t("durationDaysCount", { n })}`);
}

function formatMedDose(med) {
  return medicationsSelectors.formatMedDose(med);
}

function formatMedCourse(med) {
  return medicationsSelectors.formatMedCourse(med);
}

function formatMedLine(med) {
  const dose = formatMedDose(med);
  const course = formatMedCourse(med);
  return [med.name, dose, course].filter(Boolean).join(" · ");
}

function formatDraftDoseLine(draft) {
  return medicationsSelectors.formatDraftDoseLine(draft);
}

function renderEmergencyMeds(pet) {
  const active = deriveActiveEmergencyMeds(pet);
  if (!active.length) {
    eMeds.innerHTML = `<li>${t("noMeds")}</li>`;
    return;
  }

  eMeds.innerHTML = active
    .map((med, medIndex) => {
      const notesId = `e-drug-notes-${pet.id}-${medIndex}`;
      return `
      <li class="e-med">
        <div class="tl-med-name-row">
          <strong>${med.name}</strong>
          <button
            type="button"
            class="tl-drug-notes-btn"
            data-drug-notes-toggle
            aria-expanded="false"
            aria-controls="${notesId}"
          >${t("timelineDrugNotesBtn")}</button>
        </div>
        <span class="e-med-dose">${formatMedDose(med)}</span>
        <span class="e-med-course">${formatMedCourse(med)}</span>
        ${renderTimelineDrugNotes(med, notesId)}
        <p class="e-med-detail-hint">${t("emergencyMedDetailHint")}</p>
      </li>`;
    })
    .join("");
}

function findDrugByMedName(name) {
  if (!name || typeof drugs === "undefined") return null;
  const q = String(name).trim().toLowerCase();
  if (!q) return null;
  return (
    drugs.find((drug) => {
      const keys = [
        drug.genericName,
        drug.brandNameZh,
        drug.brandNameEn,
        ...(drug.commonAliases || []),
      ]
        .filter(Boolean)
        .map((item) => String(item).toLowerCase());
      return keys.some((key) => key === q || key.includes(q) || q.includes(key));
    }) || null
  );
}

function renderTimelineDrugNotes(med, notesId) {
  let body;
  if (med.kind === "photo_bundle" || med.structuredPending) {
    body = `<p class="tl-drug-notes-empty">${t("timelineDrugPendingNotes")}</p>`;
  } else {
    const drug = findDrugByMedName(med.name);
    if (!drug) {
      body = `<p class="tl-drug-notes-empty">${t("drugInfoUnavailable")}</p>`;
    } else {
      const sides = (drug.commonSideEffects || [])
        .map((item) => `<li>${item}</li>`)
        .join("");
      const precautions = (drug.precautions || [])
        .map((item) => `<li>${item}</li>`)
        .join("");
      body = `
        <p class="tl-drug-purpose"><span>${t("timelineDrugPurpose")}</span>${drug.purpose || drug.drugClass}</p>
        <div class="tl-drug-block">
          <h4>${t("drugSideEffects")}</h4>
          <ul>${sides || `<li>${t("drugInfoUnavailable")}</li>`}</ul>
        </div>
        <div class="tl-drug-block">
          <h4>${t("drugPrecautions")}</h4>
          <ul>${precautions || `<li>${t("drugInfoUnavailable")}</li>`}</ul>
        </div>
        <p class="tl-drug-disclaimer">${t("timelineDrugSource")}</p>`;
    }
  }

  return `<div class="tl-drug-notes" id="${notesId}" hidden>
    <p class="tl-drug-notes-title">${t("timelineDrugNotes")}</p>
    ${body}
  </div>`;
}

function collectVisitProofPhotos(visit) {
  return visitsController.collectVisitProofPhotos(visit);
}

function visitHasAnyProof(visit) {
  return visitsController.visitHasAnyProof(visit);
}

function renderVisitProofThumbs(slots, visitIndex) {
  const parts = [];
  const fig = (slot, url, labelKey) => `
    <figure class="tl-visit-rx-fig">
      <button
        type="button"
        class="tl-visit-rx-zoom"
        data-proof-lightbox
        data-proof-caption="${labelKey}"
        aria-label="${t("proofLightboxOpen")}"
      >
        <img src="${url}" alt="" />
      </button>
      <figcaption>${t(labelKey)}</figcaption>
      <button
        type="button"
        class="tl-visit-rx-remove"
        data-visit-proof-clear-slot="${slot}"
        data-visit-index="${visitIndex}"
      >${t("proofPhotoClear")}</button>
    </figure>`;

  slots.bag.forEach((url) => {
    parts.push(fig("bag", url, "medBagPhoto"));
  });
  slots.rx.forEach((url) => {
    parts.push(fig("rx", url, "medRxPhoto"));
  });
  slots.drug.forEach((url) => {
    parts.push(fig("drug", url, "medDrugPhoto"));
  });
  return parts.join("");
}

function clearVisitProofSlot(visit, slot) {
  visitsController.clearVisitProofSlot(visit, slot);
}

function getVisitImaging(visit) {
  return visitsController.getVisitImaging(visit);
}

function ensureVisitImaging(visit) {
  return visitsController.ensureVisitImaging(visit);
}

function visitHasImaging(visit) {
  return visitsController.visitHasImaging(visit);
}

function formatImagingTypes(visit) {
  const img = getVisitImaging(visit);
  const parts = [];
  if (img.xrayPhotos.length) parts.push(t("imagingXrayCaption"));
  if (img.usPhotos.length) parts.push(t("imagingUsCaption"));
  return parts.join("／");
}

function getImagingVisitEntries(pet) {
  return visitsController.getImagingVisitEntries(pet);
}

function renderVisitImagingThumbs(imaging, visitIndex) {
  const parts = [];
  const fig = (slot, url, index, labelKey) => `
    <figure class="tl-visit-rx-fig">
      <button
        type="button"
        class="tl-visit-rx-zoom"
        data-proof-lightbox
        data-proof-caption="${labelKey}"
        aria-label="${t("proofLightboxOpen")}"
      >
        <img src="${url}" alt="" />
      </button>
      <figcaption>${t(labelKey)}</figcaption>
      <button
        type="button"
        class="tl-visit-rx-remove"
        data-visit-imaging-clear-slot="${slot}"
        data-visit-imaging-clear-index="${index}"
        data-visit-index="${visitIndex}"
      >${t("proofPhotoClear")}</button>
    </figure>`;

  (imaging.xrayPhotos || []).forEach((url, index) => {
    parts.push(fig("xray", url, index, "imagingXrayCaption"));
  });
  (imaging.usPhotos || []).forEach((url, index) => {
    parts.push(fig("us", url, index, "imagingUsCaption"));
  });
  return parts.join("");
}

function clearVisitImagingPhoto(visit, slot, index) {
  visitsController.clearVisitImagingPhoto(visit, slot, index);
}

function getProofLightboxEls() {
  return {
    root: document.getElementById("proof-lightbox"),
    img: document.getElementById("proof-lightbox-img"),
    title: document.getElementById("proof-lightbox-title"),
  };
}

function closeProofLightbox() {
  const { root, img, title } = getProofLightboxEls();
  if (!root || root.hidden) return;
  root.hidden = true;
  document.documentElement.classList.remove("is-proof-lightbox-open");
  if (img) {
    img.removeAttribute("src");
    img.alt = "";
  }
  if (title) title.textContent = t("proofLightboxTitle");
}

function openProofLightbox(src, captionKey) {
  const { root, img, title } = getProofLightboxEls();
  if (!root || !img || !src) return;
  const caption = captionKey ? t(captionKey) : t("proofLightboxTitle");
  img.src = src;
  img.alt = caption;
  if (title) title.textContent = caption;
  root.querySelectorAll("[data-proof-lightbox-close]").forEach((el) => {
    if (el.classList.contains("proof-lightbox-scrim")) {
      el.setAttribute("aria-label", t("proofLightboxClose"));
    }
  });
  root.hidden = false;
  document.documentElement.classList.add("is-proof-lightbox-open");
  root.querySelector(".proof-lightbox-close")?.focus?.();
}

function visitWeightKg(visit) {
  return visitsController.visitWeightKg(visit);
}

/** Calendar-day gap between ISO dates (same day → 0). */
function calendarDaysBetween(fromIso, toIso) {
  return visitsController.calendarDaysBetween(fromIso, toIso);
}

/**
 * Previous visit = immediately prior in chronological order.
 * Newest-first display list: same-day ties use higher index as older.
 */
function buildPreviousVisitByIndex(visits) {
  return visitsController.buildPreviousVisitByIndex(visits);
}

function formatWeightDeltaKg(delta) {
  return visitsController.formatWeightDeltaKg(delta);
}

function renderVisitWeightVsPrevious(visit, previousVisit) {
  if (!previousVisit) return "";
  const days = calendarDaysBetween(previousVisit.date, visit.date);
  const parts = [];
  if (days != null && days >= 0) {
    parts.push(
      `<span class="tl-weight-days">${t("visitWeightDaysSince", {
        days,
      })}</span>`
    );
  }
  const cur = visitWeightKg(visit);
  const prev = visitWeightKg(previousVisit);
  if (cur != null && prev != null) {
    const delta = Math.round((cur - prev) * 10) / 10;
    if (delta === 0) {
      parts.push(
        `<span class="tl-weight-delta is-same"><span class="tl-weight-delta-mark" aria-hidden="true">=</span> ${t(
          "visitWeightSame"
        )}</span>`
      );
    } else if (delta > 0) {
      parts.push(
        `<span class="tl-weight-delta is-up"><span class="tl-weight-delta-mark" aria-hidden="true">↑</span> ${t(
          "visitWeightIncreased",
          { kg: formatWeightDeltaKg(delta) }
        )}</span>`
      );
    } else {
      parts.push(
        `<span class="tl-weight-delta is-down"><span class="tl-weight-delta-mark" aria-hidden="true">↓</span> ${t(
          "visitWeightDecreased",
          { kg: formatWeightDeltaKg(delta) }
        )}</span>`
      );
    }
  }
  if (!parts.length) return "";
  return `<span class="tl-weight-vs">${parts.join("")}</span>`;
}

function renderVisitWeightParts(visit, visitIndex, previousVisit = null) {
  const weightPanelId = `visit-weight-${visitIndex}`;
  const weightNum = visitWeightKg(visit);
  const weightVs = renderVisitWeightVsPrevious(visit, previousVisit);
  const weightHtml =
    weightNum != null
      ? `<span class="tl-weight">${weightVs}<span class="tl-weight-label">${t(
          "visitWeightLabel"
        )}</span> <button
          type="button"
          class="tl-weight-value"
          data-visit-weight-toggle
          aria-expanded="false"
          aria-controls="${weightPanelId}"
          aria-label="${t("visitWeightEditAria", { weight: weightNum })}"
        >${weightNum} kg</button></span>`
      : `<span class="tl-weight">${weightVs}<button
          type="button"
          class="tl-weight-pending"
          data-visit-weight-toggle
          aria-expanded="false"
          aria-controls="${weightPanelId}"
        >${t("visitWeightPending")}</button></span>`;
  const weightPrefill =
    weightNum != null ? ` value="${weightNum}"` : "";
  const weightEdit = `<form class="tl-weight-edit" id="${weightPanelId}" hidden data-visit-weight-form="${visitIndex}">
          <label class="tl-weight-edit-field">
            <span data-i18n="visitWeightFillLabel">${t("visitWeightFillLabel")}</span>
            <input
              type="number"
              id="visit-weight-input-${visitIndex}"
              name="weightAtVisit"
              step="0.1"
              min="0.1"
              inputmode="decimal"
              placeholder="6.8"
              required${weightPrefill}
            />
          </label>
          <button class="btn btn-primary tl-weight-save" type="submit">${t(
            "visitWeightSave"
          )}</button>
        </form>`;
  return { weightHtml, weightEdit };
}

function renderVisitRxBlock(
  visit,
  visitIndex,
  previousVisit = null,
  year = "",
  medsHtml = ""
) {
  const panelId = `visit-rx-${visitIndex}`;
  const imagingPanelId = `visit-imaging-${visitIndex}`;
  const slots = collectVisitProofPhotos(visit);
  const hasProof = visitHasAnyProof(visit);
  const imaging = getVisitImaging(visit);
  const hasImaging = visitHasImaging(visit);
  const { weightEdit } = renderVisitWeightParts(
    visit,
    visitIndex,
    previousVisit
  );
  const medsBlock = medsHtml
    ? `<p class="tl-visit-rx-kicker">${t("timelineVisitRxMedsTitle")}</p>${medsHtml}`
    : "";
  const body = hasProof
    ? `<div class="tl-visit-rx-thumbs">${renderVisitProofThumbs(
         slots,
         visitIndex
       )}</div>
       <button type="button" class="med-proof-btn" data-visit-proof-upload="${visitIndex}">${t(
         "timelineVisitRxUpdate"
       )}</button>`
    : `<p class="tl-visit-rx-empty">${t("timelineVisitRxEmpty")}</p>
       <button type="button" class="med-proof-btn" data-visit-proof-upload="${visitIndex}">${t(
         "timelineVisitRxUpload"
       )}</button>`;
  const imagingBody = hasImaging
    ? `<div class="tl-visit-rx-thumbs">${renderVisitImagingThumbs(
         imaging,
         visitIndex
       )}</div>
       <button type="button" class="med-proof-btn" data-visit-imaging-upload="${visitIndex}">${t(
         "timelineVisitImagingUpdate"
       )}</button>`
    : `<p class="tl-visit-rx-empty">${t("timelineVisitImagingEmpty")}</p>
       <button type="button" class="med-proof-btn" data-visit-imaging-upload="${visitIndex}">${t(
         "timelineVisitImagingUpload"
       )}</button>`;
  const yearHtml = year
    ? `<span class="tl-item-year">${year}</span>`
    : "";

  return `
    <div class="tl-clinic-row">
      <p class="tl-clinic">${visitClinicLabel(visit)}</p>
      <div class="tl-visit-actions">
        <button
          type="button"
          class="tl-drug-notes-btn tl-visit-rx-btn"
          data-visit-rx-toggle
          aria-expanded="false"
          aria-controls="${panelId}"
        >${t("timelineVisitRxBtn")}</button>
        <button
          type="button"
          class="tl-drug-notes-btn tl-visit-imaging-btn"
          data-visit-imaging-toggle
          aria-expanded="false"
          aria-controls="${imagingPanelId}"
        >${t("timelineVisitImagingBtn")}</button>
      </div>
      ${yearHtml}
    </div>
    ${weightEdit}
    ${renderVisitLabsLine(visit)}
    <div class="tl-visit-rx" id="${panelId}" hidden>
      ${medsBlock}
      <p class="tl-visit-rx-kicker">${t("timelineVisitRxTitle")}</p>
      ${body}
    </div>
    <div class="tl-visit-imaging" id="${imagingPanelId}" hidden>
      <p class="tl-visit-rx-kicker">${t("timelineVisitImagingTitle")}</p>
      ${imagingBody}
      <button type="button" class="med-proof-btn" disabled aria-disabled="true">${t(
        "imagingVideoBtn"
      )}</button>
      <p class="tl-visit-imaging-soon">${t("imagingVideoSoon")}</p>
    </div>`;
}

function renderTimeline(pet) {
  if (!pet.visits?.length) {
    timelineList.innerHTML = `<li class="tl-item tl-item-empty"><div class="tl-body"><p class="tl-note">${t(
      "noVisits"
    )}</p></div></li>`;
    return;
  }

  const sourceTags = getSourceTags();
  const entries = timelineSelectors.buildTimelineEntries(pet);
  timelineList.innerHTML = entries
    .map((entry) => {
      const { visit, visitIndex, previousVisit, year } = entry;
      const tags = visit.tags
        .map((tag) => `<span class="tl-tag">${visitTagLabel(tag)}</span>`)
        .join("");
      const noteText = locField(visit.note);
      const note = noteText ? `<p class="tl-note">${noteText}</p>` : "";
      const meds =
        entry.hasRx
          ? `<ul class="med-list">${visit.medications
              .map((med, medIndex) =>
                renderTimelineMedItem(med, pet, visitIndex, medIndex, sourceTags)
              )
              .join("")}</ul>`
          : "";
      const { weightHtml } = renderVisitWeightParts(
        visit,
        visitIndex,
        previousVisit
      );

      return `
        <li class="tl-item" style="--i:${visitIndex}">
          <header class="tl-item-head">
            <time datetime="${visit.date}">${formatShortDate(visit.date)}</time>
            ${weightHtml}
          </header>
          <div class="tl-body">
            ${renderVisitRxBlock(visit, visitIndex, previousVisit, year, meds)}
            <p class="tl-tags">${tags}</p>
            ${note}
          </div>
        </li>`;
    })
    .join("");
  const imagingPending = pendingVisitImagingIndex;
  applyPendingVisitImagingExpand();
  if (imagingPending == null) expandLatestVisitRx();
}

const ALERT_TYPE_ORDER = [
  "drug_allergy",
  "food_allergy",
  "adverse_drug_reaction",
  "vaccine_reaction",
  "chronic_disease",
  "special_note",
];

const ALERT_SECTION_DEFS = [
  {
    id: "allergy",
    titleKey: "alertsSectionAllergy",
    emptyKey: "alertsSectionAllergyEmpty",
    types: [
      "drug_allergy",
      "food_allergy",
      "adverse_drug_reaction",
      "vaccine_reaction",
    ],
  },
  {
    id: "chronic",
    titleKey: "alertsSectionChronic",
    emptyKey: "alertsSectionChronicEmpty",
    types: ["chronic_disease"],
  },
  {
    id: "owner",
    titleKey: "alertsSectionOwner",
    emptyKey: "alertsSectionOwnerEmpty",
    types: ["special_note"],
  },
];

const OWNER_ALERTS_KEY = "petlive-pet-alerts";
const SUPPRESSED_ALERTS_KEY = "petlive-suppressed-alerts";
const isStorageMap = (value) =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));
const ownerAlertsSlot = PetLiveWeb.storage.createJsonSlot({
  key: OWNER_ALERTS_KEY,
  fallback: () => ({}),
  validate: isStorageMap,
});
const suppressedAlertsSlot = PetLiveWeb.storage.createJsonSlot({
  key: SUPPRESSED_ALERTS_KEY,
  fallback: () => ({}),
  validate: isStorageMap,
});
const editingAlertSectionIds = new Set();

const DEFAULT_ALERT_SEVERITY = {
  drug_allergy: "critical",
  adverse_drug_reaction: "critical",
  vaccine_reaction: "critical",
  food_allergy: "caution",
  chronic_disease: "caution",
  special_note: "caution",
};

function defaultSeverityForType(alertType) {
  return DEFAULT_ALERT_SEVERITY[alertType] || "caution";
}

function normalizeSeverity(value, alertType) {
  if (value === "critical" || value === "high") return "critical";
  if (value === "caution") return "caution";
  return defaultSeverityForType(alertType);
}

function highestAlertSeverity(alerts) {
  if ((alerts || []).some((alert) => alert.severity === "critical")) return "critical";
  if ((alerts || []).some((alert) => alert.severity === "caution")) return "caution";
  return null;
}

function escapeAlertHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function alertTypeLabel(alertType) {
  const map = {
    drug_allergy: "alertTypeDrugAllergy",
    food_allergy: "alertTypeFoodAllergy",
    adverse_drug_reaction: "alertTypeAdr",
    vaccine_reaction: "alertTypeVaccineReaction",
    chronic_disease: "alertTypeChronic",
    special_note: "alertTypeSpecialNote",
  };
  return t(map[alertType] || "alertTypeSpecialNote");
}

function inferAlertType(alert) {
  if (ALERT_TYPE_ORDER.includes(alert.alertType)) return alert.alertType;
  const label = String(alert.type || "");
  if (/藥物過敏|drug.?allerg/i.test(label)) return "drug_allergy";
  if (/食物過敏|food.?allerg/i.test(label)) return "food_allergy";
  if (/不良反應|adverse/i.test(label)) return "adverse_drug_reaction";
  if (/疫苗|vaccine/i.test(label)) return "vaccine_reaction";
  if (/慢性|chronic/i.test(label)) return "chronic_disease";
  if (/特別|注意|special|note/i.test(label)) return "special_note";
  return "special_note";
}

function normalizeAlert(alert, fallbackSource = "linked") {
  const alertType = inferAlertType(alert);
  const description = alert.desc || alert.text || alert.description || "";
  const note = alert.note || alert.severityNote || "";
  const source = alert.source === "owner" ? "owner" : fallbackSource;
  const sinceRaw = alert.sinceDate || alert.since || "";
  const sinceDate = typeof sinceRaw === "string" ? sinceRaw.trim() : "";
  return {
    id: alert.id || `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    alertType,
    source,
    type: alertTypeLabel(alertType),
    text: alert.text || description,
    desc: description,
    description,
    note,
    severityNote: note,
    severity: normalizeSeverity(alert.severity, alertType),
    sinceDate: sinceDate || null,
    createdAt: alert.createdAt || null,
  };
}

function loadOwnerAlertsMap() {
  return ownerAlertsSlot.read();
}

function saveOwnerAlertsMap(map) {
  if (DEMO_MODE) return false;
  const ok = ownerAlertsSlot.write(map);
  if (ok) bumpLocalDataRevision();
  return ok;
}

function loadSuppressedAlertsMap() {
  return suppressedAlertsSlot.read();
}

function saveSuppressedAlertsMap(map) {
  if (DEMO_MODE) return false;
  const ok = suppressedAlertsSlot.write(map);
  if (ok) bumpLocalDataRevision();
  return ok;
}

function getSuppressedAlertIds(petId) {
  const map = loadSuppressedAlertsMap();
  const list = Array.isArray(map[petId]) ? map[petId] : [];
  return new Set(list.map(String));
}

function suppressLinkedAlert(petId, alertId) {
  if (!petId || !alertId) return false;
  const map = loadSuppressedAlertsMap();
  const next = new Set(Array.isArray(map[petId]) ? map[petId].map(String) : []);
  next.add(String(alertId));
  map[petId] = [...next];
  return saveSuppressedAlertsMap(map);
}

function getLinkedAlerts(pet) {
  const suppressed = getSuppressedAlertIds(pet.id);
  return (pet.alerts || [])
    .filter((alert) => alert.source !== "owner")
    .filter((alert) => !suppressed.has(String(alert.id)))
    .map((alert) => normalizeAlert(alert, "linked"));
}

function getOwnerAlerts(petId) {
  const map = loadOwnerAlertsMap();
  const list = Array.isArray(map[petId]) ? map[petId] : [];
  return list.map((alert) => normalizeAlert(alert, "owner"));
}

function persistOwnerAlertsForPet(petId, ownerAlerts) {
  const map = loadOwnerAlertsMap();
  map[petId] = ownerAlerts.map((alert) => ({
    id: alert.id,
    alertType: alert.alertType,
    source: "owner",
    description: alert.description || alert.desc || alert.text,
    text: alert.text || alert.description || alert.desc,
    desc: alert.desc || alert.description || alert.text,
    note: alert.note || alert.severityNote || "",
    severityNote: alert.note || alert.severityNote || "",
    severity: alert.severity,
    sinceDate: alert.sinceDate || null,
    createdAt: alert.createdAt || new Date().toISOString(),
  }));
  if (!map[petId].length) delete map[petId];
  return saveOwnerAlertsMap(map);
}

function sortAlerts(alerts) {
  const rank = { critical: 0, caution: 1 };
  return [...alerts].sort((a, b) => {
    const sr = (rank[a.severity] ?? 2) - (rank[b.severity] ?? 2);
    if (sr) return sr;
    const ai = ALERT_TYPE_ORDER.indexOf(a.alertType);
    const bi = ALERT_TYPE_ORDER.indexOf(b.alertType);
    if (ai !== bi) return ai - bi;
    return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
  });
}

function getAlertsForPet(pet) {
  if (!pet) return [];
  const owner = getOwnerAlerts(pet.id);
  const ownerIds = new Set(owner.map((alert) => String(alert.id)));
  const linked = getLinkedAlerts(pet).filter((alert) => !ownerIds.has(String(alert.id)));
  return sortAlerts([...linked, ...owner]);
}

function alertLineText(alert) {
  return (
    locField(alert.desc) ||
    locField(alert.text) ||
    locField(alert.description) ||
    ""
  );
}

function formatAlertSince(sinceDate) {
  if (!sinceDate) return "";
  const raw = String(sinceDate).trim();
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
  return raw;
}

function toMonthInputValue(sinceDate) {
  const formatted = formatAlertSince(sinceDate);
  return /^\d{4}-\d{2}$/.test(formatted) ? formatted : "";
}

function chronicSinceLine(alert) {
  if (alert?.alertType !== "chronic_disease") return "";
  const since = formatAlertSince(alert.sinceDate);
  if (since) return t("alertChronicOngoing", { since });
  return t("alertChronicOngoingUnknown");
}

function syncAlertSinceFieldVisibility() {
  const field = document.getElementById("alert-since-field");
  if (!field) return;
  field.hidden = selectedAlertType !== "chronic_disease";
}

function setSelectedAlertSeverity(severity) {
  selectedAlertSeverity = severity === "critical" ? "critical" : "caution";
  alertSeverityChips?.querySelectorAll("[data-alert-severity]").forEach((chip) => {
    chip.classList.toggle("is-on", chip.dataset.alertSeverity === selectedAlertSeverity);
  });
}

function setSelectedAlertType(type, { keepSeverity = false } = {}) {
  selectedAlertType = ALERT_TYPE_ORDER.includes(type) ? type : "special_note";
  alertTypeChips?.querySelectorAll("[data-alert-type]").forEach((chip) => {
    chip.classList.toggle("is-on", chip.dataset.alertType === selectedAlertType);
  });
  if (!keepSeverity) setSelectedAlertSeverity(defaultSeverityForType(selectedAlertType));
  syncAlertSinceFieldVisibility();
  if (selectedAlertType !== "chronic_disease") {
    const sinceInput = document.getElementById("alert-since-date");
    if (sinceInput) sinceInput.value = "";
  }
}

function resetAlertForm({ keepType = null } = {}) {
  if (alertEditIdInput) alertEditIdInput.value = "";
  if (alertDescriptionInput) alertDescriptionInput.value = "";
  if (alertSeverityInput) alertSeverityInput.value = "";
  const sinceInput = document.getElementById("alert-since-date");
  if (sinceInput) sinceInput.value = "";
  setSelectedAlertType(
    ALERT_TYPE_ORDER.includes(keepType) ? keepType : "drug_allergy"
  );
  syncAlertSubmitLabel();
  syncAlertComposeChrome();
  if (alertCancelEditBtn) alertCancelEditBtn.hidden = true;
}

function syncAlertSubmitLabel() {
  if (!alertSubmitBtn) return;
  const editing = Boolean(alertEditIdInput?.value);
  alertSubmitBtn.textContent = t(editing ? "updateAlert" : "saveAlert");
}

function syncAlertComposeChrome() {
  const title = document.querySelector(".alert-compose-title");
  const hint = document.querySelector(".alert-compose > .field-hint");
  const editing = Boolean(alertEditIdInput?.value);
  if (title) title.textContent = t(editing ? "alertComposeTitleEdit" : "alertComposeTitle");
  if (hint) hint.textContent = t(editing ? "alertComposeHintEdit" : "alertComposeHint");
}

function startNewAlert(alertType) {
  const type = ALERT_TYPE_ORDER.includes(alertType) ? alertType : "special_note";
  resetAlertForm({ keepType: type });
  document.querySelector(".alert-compose")?.scrollIntoView({ behavior: "smooth", block: "start" });
  alertDescriptionInput?.focus({ preventScroll: true });
}

function beginEditAlert(alert) {
  if (!alert) return;
  setSelectedAlertType(alert.alertType, { keepSeverity: true });
  setSelectedAlertSeverity(normalizeSeverity(alert.severity, alert.alertType));
  if (alertEditIdInput) alertEditIdInput.value = alert.id;
  if (alertDescriptionInput) {
    alertDescriptionInput.value = alertLineText(alert);
  }
  if (alertSeverityInput) alertSeverityInput.value = locField(alert.note) || "";
  const sinceInput = document.getElementById("alert-since-date");
  if (sinceInput) sinceInput.value = toMonthInputValue(alert.sinceDate);
  syncAlertSinceFieldVisibility();
  syncAlertSubmitLabel();
  syncAlertComposeChrome();
  if (alertCancelEditBtn) alertCancelEditBtn.hidden = false;
  document.querySelector(".alert-compose")?.scrollIntoView({ behavior: "smooth", block: "start" });
  alertDescriptionInput?.focus({ preventScroll: true });
}

function renderAlertItem(alert) {
  const severity = alert.severity === "critical" ? "critical" : "caution";
  const noteText = locField(alert.note);
  const note = noteText
    ? `<p class="alert-note">${escapeAlertHtml(noteText)}</p>`
    : "";
  const sinceText = chronicSinceLine(alert);
  const since = sinceText
    ? `<p class="alert-since">${escapeAlertHtml(sinceText)}</p>`
    : "";
  const sourceLabel =
    alert.source === "owner" ? t("alertSourceOwner") : t("alertSourceLinked");
  const sourceClass = alert.source === "owner" ? "is-owner" : "is-linked";
  const severityLabel =
    severity === "critical" ? t("alertSeverityCritical") : t("alertSeverityCaution");
  const actions = `<div class="alert-item-actions">
          <button type="button" class="text-btn" data-alert-edit="${escapeAlertHtml(
            alert.id
          )}">${t("editAlert")}</button>
          <button type="button" class="text-btn alert-delete" data-alert-delete="${escapeAlertHtml(
            alert.id
          )}">${t("deleteAlert")}</button>
        </div>`;

  return `
    <li class="alert-item severity-${severity}" data-alert-id="${escapeAlertHtml(
      alert.id
    )}">
      <div class="alert-item-top">
        <p class="alert-type">${escapeAlertHtml(alertTypeLabel(alert.alertType))}</p>
        <div class="alert-item-meta">
          <span class="alert-severity-badge is-${severity}">${escapeAlertHtml(severityLabel)}</span>
          <span class="alert-source ${sourceClass}">${escapeAlertHtml(sourceLabel)}</span>
        </div>
      </div>
      <p class="alert-desc">${escapeAlertHtml(alertLineText(alert))}</p>
      ${since}
      ${note}
      ${actions}
    </li>`;
}

function renderAlerts(pet) {
  const alertsTitle = document.getElementById("alerts-title");
  const alertsSub = document.getElementById("alerts-sub");
  if (alertsTitle) alertsTitle.textContent = t("alertsTitleFor", { name: pet.name });
  if (alertsSub) alertsSub.textContent = t("alertsSubFor", { name: pet.name });

  const alerts = getAlertsForPet(pet);
  if (!alertSections) {
    if (!alertList) return;
    if (!alerts.length) {
      alertList.innerHTML = `<li class="alert-item"><p class="alert-desc">${t(
        "noAlertItems"
      )}</p></li>`;
      return;
    }
    alertList.innerHTML = alerts.map(renderAlertItem).join("");
    return;
  }

  alertSections.innerHTML = ALERT_SECTION_DEFS.map((section) => {
    const items = alerts.filter((alert) => section.types.includes(alert.alertType));
    const addType = section.types[0];
    const editing = editingAlertSectionIds.has(section.id);
    const body = items.length
      ? `<ul class="alert-list">${items.map(renderAlertItem).join("")}</ul>`
      : `<p class="alert-section-empty">${t(section.emptyKey)}</p>`;
    return `
      <section class="alert-section${editing ? " is-editing" : ""}" data-alert-section="${section.id}">
        <div class="alert-section-head">
          <h3>${t(section.titleKey)}</h3>
          <div class="alert-section-actions">
            <button
              type="button"
              class="text-btn alert-section-edit"
              data-alert-section-edit="${escapeAlertHtml(section.id)}"
              aria-pressed="${editing ? "true" : "false"}"
            >${t(editing ? "alertSectionEditDone" : "alertSectionEdit")}</button>
            <button
              type="button"
              class="text-btn alert-section-add"
              data-alert-add-type="${escapeAlertHtml(addType)}"
            >${t("alertAddItem")}</button>
          </div>
        </div>
        ${body}
      </section>`;
  }).join("");
}

function saveAlertFromForm() {
  if (demoBlocksWrite()) return;
  const pet = getCurrentPet();
  if (!pet) return;
  const description = alertDescriptionInput?.value.trim() || "";
  const note = alertSeverityInput?.value.trim() || "";
  const sinceInput = document.getElementById("alert-since-date");
  const sinceDate =
    selectedAlertType === "chronic_disease"
      ? formatAlertSince(sinceInput?.value || "") || null
      : null;
  if (!description) {
    showToast(t("toastNeedAlertDescription"));
    return;
  }

  const editId = alertEditIdInput?.value || "";
  let ownerAlerts = getOwnerAlerts(pet.id);

  if (editId) {
    const index = ownerAlerts.findIndex((alert) => alert.id === editId);
    const base =
      index >= 0
        ? ownerAlerts[index]
        : getAlertsForPet(pet).find((alert) => alert.id === editId) || {};
    const updated = normalizeAlert(
      {
        ...base,
        id: editId,
        alertType: selectedAlertType,
        source: "owner",
        description,
        text: description,
        desc: description,
        note,
        severityNote: note,
        severity: selectedAlertSeverity,
        sinceDate,
        createdAt: base.createdAt || new Date().toISOString(),
      },
      "owner"
    );
    if (index >= 0) ownerAlerts[index] = updated;
    else ownerAlerts = [...ownerAlerts, updated];
    if (!persistOwnerAlertsForPet(pet.id, ownerAlerts)) {
      showPersistenceFailure();
      return;
    }
    showToast(t("toastAlertUpdated"));
  } else {
    const created = normalizeAlert(
      {
        id: `a-owner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        alertType: selectedAlertType,
        source: "owner",
        description,
        text: description,
        desc: description,
        note,
        severityNote: note,
        severity: selectedAlertSeverity,
        sinceDate,
        createdAt: new Date().toISOString(),
      },
      "owner"
    );
    ownerAlerts = [...ownerAlerts, created];
    if (!persistOwnerAlertsForPet(pet.id, ownerAlerts)) {
      showPersistenceFailure();
      return;
    }
    showToast(t("toastAlertSaved"));
  }

  const keepType = selectedAlertType;
  resetAlertForm({ keepType });
  applySelectedPet();
}

function deleteAlertById(alertId) {
  const pet = getCurrentPet();
  if (!pet || !alertId) return;
  const ownerAlerts = getOwnerAlerts(pet.id);
  const inOwner = ownerAlerts.some((alert) => alert.id === alertId);
  const linkedIds = new Set(
    (pet.alerts || [])
      .filter((alert) => alert.source !== "owner")
      .map((alert) => String(alert.id))
  );

  if (inOwner) {
    const saved = persistOwnerAlertsForPet(
      pet.id,
      ownerAlerts.filter((alert) => alert.id !== alertId)
    );
    if (!saved) {
      showPersistenceFailure();
      return;
    }
  }
  if (linkedIds.has(String(alertId))) {
    if (!suppressLinkedAlert(pet.id, alertId)) {
      showPersistenceFailure();
      return;
    }
  }

  if (alertEditIdInput?.value === alertId) resetAlertForm();
  showToast(t("toastAlertDeleted"));
  applySelectedPet();
}

function getNextVaccine(pet) {
  const currents = [...getCurrentVaccinesByGroup(pet).values()];
  if (!currents.length) return null;
  return currents.slice().sort(compareVaccinesForStatusDisplay)[0];
}

function daysUntil(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

/** @returns {"protected"|"approaching"|"expired"} */
function getVaccineProtectionStatus(nextDate) {
  const days = daysUntil(nextDate);
  if (days <= 0) return "expired";
  if (days <= 90) return "approaching";
  return "protected";
}

function isVaccineApproaching(nextDate) {
  return getVaccineProtectionStatus(nextDate) === "approaching";
}

function addYears(isoDate, years) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setFullYear(date.getFullYear() + years);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayISODate() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const PARASITE_APPROACHING_DAYS = 7;
const PARASITE_KINDS = ["external", "heartworm"];
/** covers: which tracking slots this product can fill; dual = external+heartworm */
const PARASITE_PRODUCT_CATALOG = {
  ppRevolution: { intervalDays: 30, covers: ["external", "heartworm"] },
  ppFrontline: { intervalDays: 30, covers: ["external"] },
  ppAdvantix: { intervalDays: 30, covers: ["external"] },
  ppNexGardSpectra: { intervalDays: 30, covers: ["external", "heartworm"] },
  ppMilbemax: { intervalDays: 30, covers: ["heartworm"] },
  ppProHeart: { intervalDays: 365, covers: ["heartworm"] },
};

const PARASITE_PRODUCTS = {
  external: ["ppFrontline", "ppAdvantix", "ppRevolution", "ppNexGardSpectra"].map(
    (key) => ({ key, ...PARASITE_PRODUCT_CATALOG[key] })
  ),
  heartworm: [
    "ppRevolution",
    "ppNexGardSpectra",
    "ppMilbemax",
    "ppProHeart",
  ].map((key) => ({ key, ...PARASITE_PRODUCT_CATALOG[key] })),
};

let pendingParasiteFocus = null;
const selectedParasiteProduct = { external: "", heartworm: "" };

function isParasiteDualProduct(productKey) {
  const covers = PARASITE_PRODUCT_CATALOG[productKey]?.covers || [];
  return covers.includes("external") && covers.includes("heartworm");
}

function parasiteProductChipLabel(item) {
  const name = t(item.key);
  return isParasiteDualProduct(item.key)
    ? `${name}（${t("parasiteDualTag")}）`
    : name;
}

function ensureParasitePrevention(pet) {
  if (!pet.parasitePrevention) {
    pet.parasitePrevention = { external: null, heartworm: null };
  }
  return pet.parasitePrevention;
}

/** @returns {"protected"|"approaching"|"unprotected"} */
function getParasiteStatus(nextDue) {
  if (!nextDue) return "unprotected";
  const days = daysUntil(nextDue);
  if (days < 0) return "unprotected";
  if (days <= PARASITE_APPROACHING_DAYS) return "approaching";
  return "protected";
}

function parasiteStatusLabel(status) {
  if (status === "protected") return t("parasiteProtected");
  if (status === "approaching") return t("parasiteApproaching");
  return t("parasiteUnprotected");
}

function parasiteKindTitle(kind) {
  return kind === "heartworm" ? t("parasiteHeartworm") : t("parasiteExternal");
}

function getParasiteRecord(pet, kind) {
  const pp = ensureParasitePrevention(pet);
  return pp[kind] || null;
}

function resolveParasiteProductName(kind, productKey, customValue) {
  const custom = (customValue || "").trim();
  if (custom) return custom;
  if (productKey) return t(productKey);
  return "";
}

function syncParasiteNextFromLast(kind) {
  const lastEl = document.getElementById(`parasite-last-${kind}`);
  const intervalEl = document.getElementById(`parasite-interval-${kind}`);
  const nextEl = document.getElementById(`parasite-next-${kind}`);
  if (!lastEl?.value || !intervalEl?.value || !nextEl) return;
  const days = Number(intervalEl.value);
  if (!Number.isFinite(days) || days < 1) return;
  nextEl.value = addDays(lastEl.value, days);
  syncDateProxies(document.getElementById(`parasite-form-${kind}`) || document);
}

function parasiteProductChipMarkup(kind, item) {
  return `<button type="button" class="chip${
    selectedParasiteProduct[kind] === item.key ? " is-on" : ""
  }" data-parasite-product="${item.key}" data-interval="${item.intervalDays}">${parasiteProductChipLabel(
    item
  )}</button>`;
}

function renderParasiteProductChips(kind) {
  const el = document.getElementById(`parasite-chips-${kind}`);
  if (!el) return;
  const list = PARASITE_PRODUCTS[kind] || [];
  const exclusive = list.filter((item) => !isParasiteDualProduct(item.key));
  const dual = list.filter((item) => isParasiteDualProduct(item.key));
  el.innerHTML = `<div class="parasite-chip-row">${exclusive
    .map((item) => parasiteProductChipMarkup(kind, item))
    .join("")}</div><div class="parasite-chip-row">${dual
    .map((item) => parasiteProductChipMarkup(kind, item))
    .join("")}</div>`;
}

function fillParasiteKindForm(pet, kind) {
  const record = getParasiteRecord(pet, kind);
  selectedParasiteProduct[kind] = record?.productKey || "";
  renderParasiteProductChips(kind);

  const customEl = document.getElementById(`parasite-custom-${kind}`);
  const lastEl = document.getElementById(`parasite-last-${kind}`);
  const intervalEl = document.getElementById(`parasite-interval-${kind}`);
  const nextEl = document.getElementById(`parasite-next-${kind}`);

  if (customEl) {
    customEl.value =
      record && !record.productKey && record.product ? record.product : "";
  }
  if (lastEl) lastEl.value = record?.lastGiven || "";
  if (intervalEl) intervalEl.value = record?.intervalDays || 30;
  if (nextEl) nextEl.value = record?.nextDue || "";
  syncDateProxies(document.getElementById(`parasite-form-${kind}`) || document);
}

function fillParasiteScreen(pet) {
  if (!pet) return;
  const sub = document.getElementById("parasite-sub");
  if (sub) sub.textContent = t("parasiteSubFor", { name: pet.name });
  PARASITE_KINDS.forEach((kind) => fillParasiteKindForm(pet, kind));

  const hwHint = document.getElementById("parasite-heartworm-hint");
  if (hwHint) {
    const show = pet.species === "cat";
    hwHint.hidden = !show;
    if (show) hwHint.textContent = t("parasiteHeartwormCatHint");
  }

  if (pendingParasiteFocus) {
    const block = document.getElementById(`parasite-form-${pendingParasiteFocus}`);
    block?.scrollIntoView({ behavior: "smooth", block: "start" });
    pendingParasiteFocus = null;
  }
}

function paintParasiteStripRowEmpty(kind) {
  const row = document.getElementById(`parasite-row-${kind}`);
  const meta = document.getElementById(`parasite-meta-${kind}`);
  const statusEl = document.getElementById(`parasite-status-${kind}`);
  if (!row || !meta || !statusEl) return;
  row.classList.remove(
    "is-protected",
    "is-approaching",
    "is-unprotected",
    "is-optional"
  );
  row.classList.add("is-unprotected");
  meta.textContent =
    kind === "vaccine" ? t("vaccineNotSet") : t("parasiteNotSet");
  statusEl.textContent = t("parasiteUnprotected");
}

/** No pet (or shell only): same CTA cues as unset records on a pet. */
function paintParasiteStripEmpty() {
  if (!document.getElementById("parasite-strip")) return;
  paintParasiteStripRowEmpty("vaccine");
  paintParasiteStripRowEmpty("external");
  paintParasiteStripRowEmpty("heartworm");
}

function renderParasiteStrip(pet) {
  ensureParasitePrevention(pet);
  PARASITE_KINDS.forEach((kind) => {
    const row = document.getElementById(`parasite-row-${kind}`);
    const meta = document.getElementById(`parasite-meta-${kind}`);
    const statusEl = document.getElementById(`parasite-status-${kind}`);
    if (!row || !meta || !statusEl) return;

    const record = getParasiteRecord(pet, kind);
    row.classList.remove(
      "is-protected",
      "is-approaching",
      "is-unprotected",
      "is-optional"
    );

    // Cats: heartworm is optional — unset = no alarm; set = normal status UI.
    if (pet.species === "cat" && kind === "heartworm" && !record?.nextDue) {
      row.classList.add("is-optional");
      meta.textContent = t("parasiteHeartwormOptional");
      statusEl.textContent = t("parasiteOptional");
      return;
    }

    const status = getParasiteStatus(record?.nextDue);
    row.classList.add(`is-${status}`);

    if (!record?.nextDue) {
      meta.textContent = t("parasiteNotSet");
    } else {
      const product = record.productKey
        ? t(record.productKey)
        : record.product || t("parasiteProductFallback");
      meta.textContent = t("parasiteStripMeta", {
        product,
        date: record.nextDue,
      });
    }
    statusEl.textContent = parasiteStatusLabel(status);
  });
  renderVaccineStrip(pet);
}

function renderVaccineStrip(pet) {
  const row = document.getElementById("parasite-row-vaccine");
  const meta = document.getElementById("parasite-meta-vaccine");
  const statusEl = document.getElementById("parasite-status-vaccine");
  if (!row || !meta || !statusEl) return;

  row.classList.remove(
    "is-protected",
    "is-approaching",
    "is-unprotected",
    "is-optional"
  );

  const nextVaccine = getNextVaccine(pet);
  if (!nextVaccine) {
    paintParasiteStripRowEmpty("vaccine");
    return;
  }

  const status = getVaccineProtectionStatus(nextVaccine.next);
  if (status === "expired") {
    row.classList.add("is-unprotected");
    statusEl.textContent = t("parasiteUnprotected");
  } else if (status === "approaching") {
    row.classList.add("is-approaching");
    statusEl.textContent = t("parasiteApproaching");
  } else {
    row.classList.add("is-protected");
    statusEl.textContent = t("parasiteProtected");
  }
  meta.textContent = t("vaccineStripMeta", {
    name: vaccineLabelOf(nextVaccine),
    date: nextVaccine.next,
  });
}

function readParasiteForm(kind) {
  const productKey = selectedParasiteProduct[kind] || "";
  const custom = document.getElementById(`parasite-custom-${kind}`)?.value || "";
  const product = resolveParasiteProductName(kind, productKey, custom);
  const lastGiven = document.getElementById(`parasite-last-${kind}`)?.value || "";
  const intervalRaw = document.getElementById(`parasite-interval-${kind}`)?.value;
  const intervalDays = Number(intervalRaw);
  let nextDue = document.getElementById(`parasite-next-${kind}`)?.value || "";

  if (lastGiven && Number.isFinite(intervalDays) && intervalDays >= 1 && !nextDue) {
    nextDue = addDays(lastGiven, intervalDays);
  }

  return {
    productKey: custom.trim() ? "" : productKey,
    product,
    lastGiven,
    intervalDays: Number.isFinite(intervalDays) && intervalDays >= 1 ? intervalDays : 30,
    nextDue,
  };
}

function saveParasiteKind(kind, { dosedToday = false, quiet = false } = {}) {
  if (demoBlocksWrite()) return;
  const pet = getCurrentPet();
  if (!pet) return false;
  const pp = ensureParasitePrevention(pet);
  const draft = readParasiteForm(kind);

  if (dosedToday) {
    const lastEl = document.getElementById(`parasite-last-${kind}`);
    const intervalEl = document.getElementById(`parasite-interval-${kind}`);
    const nextEl = document.getElementById(`parasite-next-${kind}`);
    const typedDays = Number(intervalEl?.value);
    const intervalDays =
      Number.isFinite(typedDays) && typedDays >= 1 ? typedDays : draft.intervalDays || 30;

    draft.lastGiven = todayISODate();
    draft.intervalDays = intervalDays;
    draft.nextDue = addDays(draft.lastGiven, intervalDays);

    if (lastEl) lastEl.value = draft.lastGiven;
    if (intervalEl) intervalEl.value = String(intervalDays);
    if (nextEl) nextEl.value = draft.nextDue;
  }

  if (!draft.product) {
    showToast(t("toastParasiteNeedProduct"));
    return false;
  }
  if (!draft.lastGiven || !draft.nextDue) {
    showToast(t("toastParasiteNeedDates"));
    return false;
  }
  if (draft.nextDue < draft.lastGiven) {
    showToast(t("toastParasiteOrder"));
    return false;
  }

  pp[kind] = {
    productKey: draft.productKey,
    product: draft.product,
    lastGiven: draft.lastGiven,
    intervalDays: draft.intervalDays,
    nextDue: draft.nextDue,
  };

  // Dual-cover products (e.g. 寵愛 / 全能狗Ｓ) keep both strips in sync.
  if (draft.productKey && isParasiteDualProduct(draft.productKey)) {
    const other = kind === "external" ? "heartworm" : "external";
    pp[other] = {
      productKey: draft.productKey,
      product: draft.product,
      lastGiven: draft.lastGiven,
      intervalDays: draft.intervalDays,
      nextDue: draft.nextDue,
    };
    fillParasiteKindForm(pet, other);
  }

  fillParasiteKindForm(pet, kind);
  renderParasiteStrip(pet);
  if (!quiet) {
    showToast(
      t(
        draft.productKey && isParasiteDualProduct(draft.productKey)
          ? "toastParasiteSavedDual"
          : "toastParasiteSaved",
        {
          name: pet.name,
          kind: parasiteKindTitle(kind),
          product: draft.product,
        }
      )
    );
  }
  return true;
}

function isoToCompactDate(iso) {
  return String(iso || "").replace(/-/g, "");
}

function escapeIcsText(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Recompute next due from last given + interval (does not mark dosed today). */
function prepareParasiteNextDueFromLast(kind) {
  const lastEl = document.getElementById(`parasite-last-${kind}`);
  const intervalEl = document.getElementById(`parasite-interval-${kind}`);
  const nextEl = document.getElementById(`parasite-next-${kind}`);
  const lastGiven = lastEl?.value || "";
  if (!lastGiven) {
    showToast(t("toastParasiteNeedLast"));
    return false;
  }
  let days = Number(intervalEl?.value);
  if (!Number.isFinite(days) || days < 1) {
    days = 30;
    if (intervalEl) intervalEl.value = "30";
  }
  const nextDue = addDays(lastGiven, days);
  if (nextEl) nextEl.value = nextDue;
  syncDateProxies(document.getElementById(`parasite-form-${kind}`) || document);
  return true;
}

function buildParasiteCalendarPayload(pet, kind) {
  const record = getParasiteRecord(pet, kind);
  if (!record?.nextDue) return null;
  const kindTitle = parasiteKindTitle(kind);
  const title = t("parasiteCalTitle", {
    name: pet.name,
    kind: kindTitle,
    product: record.product || kindTitle,
  });
  const details = t("parasiteCalDetails", {
    name: pet.name,
    kind: kindTitle,
    product: record.product || "—",
    last: record.lastGiven || "—",
    next: record.nextDue,
  });
  return { title, details, nextDue: record.nextDue };
}

let pendingCalendarPayload = null;

function closeCalendarChooser() {
  const overlay = document.getElementById("parasite-cal-chooser");
  if (!overlay) return;
  overlay.hidden = true;
  delete overlay.dataset.parasiteKind;
  pendingCalendarPayload = null;
}

function showCalendarChooser(payload, metaText) {
  const overlay = document.getElementById("parasite-cal-chooser");
  const meta = document.getElementById("parasite-cal-chooser-meta");
  if (!overlay || !payload?.nextDue) {
    showToast(t("toastParasiteNeedNext"));
    return false;
  }
  pendingCalendarPayload = payload;
  if (meta) meta.textContent = metaText || t("parasiteCalChooserMeta", { date: payload.nextDue });
  overlay.hidden = false;
  return true;
}

function showParasiteCalendarChooser(kind) {
  const pet = getCurrentPet();
  const payload = buildParasiteCalendarPayload(pet, kind);
  if (!payload) {
    showToast(t("toastParasiteNeedNext"));
    return false;
  }
  const overlay = document.getElementById("parasite-cal-chooser");
  if (overlay) overlay.dataset.parasiteKind = kind;
  return showCalendarChooser(payload, t("parasiteCalChooserMeta", { date: payload.nextDue }));
}

/** Past dose: require last-given date, recompute next, save, then offer calendar. */
function saveParasitePastAndOfferCalendar(kind) {
  if (!prepareParasiteNextDueFromLast(kind)) return false;
  if (!saveParasiteKind(kind, { quiet: true })) return false;
  return showParasiteCalendarChooser(kind);
}

/** Dosed today: mark today in-app, then offer calendar for next due. */
function saveParasiteDosedTodayAndOfferCalendar(kind) {
  if (!saveParasiteKind(kind, { dosedToday: true, quiet: true })) return false;
  return showParasiteCalendarChooser(kind);
}

function buildVaccineCalendarPayload(pet, { vaccines, given, next }) {
  if (!pet || !next) return null;
  const vaccineNames = (vaccines || []).map((entry) => entry.name).filter(Boolean);
  const vaccinesLabel = vaccineNames.join("、") || t("vaccine");
  const title = t("vaccineCalTitle", {
    name: pet.name,
    vaccines: vaccinesLabel,
  });
  const details = t("vaccineCalDetails", {
    name: pet.name,
    vaccines: vaccinesLabel,
    given: given || "—",
    next,
  });
  return {
    title,
    details,
    nextDue: next,
    uid: `vaccine-${isoToCompactDate(next)}-${vaccineNames.length}`,
  };
}

function openGoogleCalendar(payload) {
  if (!payload?.nextDue) {
    showToast(t("toastParasiteNeedNext"));
    return;
  }
  const start = isoToCompactDate(payload.nextDue);
  const end = isoToCompactDate(addDays(payload.nextDue, 1));
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", payload.title);
  url.searchParams.set("dates", `${start}/${end}`);
  url.searchParams.set("details", payload.details);
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

function openAppleCalendar(payload) {
  if (!payload?.nextDue) {
    showToast(t("toastParasiteNeedNext"));
    return;
  }
  const start = isoToCompactDate(payload.nextDue);
  const end = isoToCompactDate(addDays(payload.nextDue, 1));
  const stamp = isoToCompactDate(todayISODate()) + "T000000Z";
  const uid = payload.uid || `event-${start}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Petlive//Dragon Fruit Passport//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:petlive-${uid}@petlive`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcsText(payload.title)}`,
    `DESCRIPTION:${escapeIcsText(payload.details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `petlive-${uid}.ics`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 2000);
}

function closeParasiteCalendarChooser() {
  closeCalendarChooser();
}

function openParasiteGoogleCalendar(kind) {
  const pet = getCurrentPet();
  openGoogleCalendar(buildParasiteCalendarPayload(pet, kind));
}

function openParasiteAppleCalendar(kind) {
  const pet = getCurrentPet();
  const payload = buildParasiteCalendarPayload(pet, kind);
  if (payload) payload.uid = `parasite-${kind}-${isoToCompactDate(payload.nextDue)}`;
  openAppleCalendar(payload);
}

const VACCINE_PRESETS = {
  // Chip rows: core combo → other → less-common special (heartworm inj).
  dog: [
    {
      labelKey: "vaccineChipCore",
      keys: ["v5in1", "v7in1", "v8in1", "v10in1", "v11in1"],
    },
    {
      labelKey: "vaccineChipOther",
      keys: ["vRabies", "vLyme", "vLepto"],
    },
    {
      labelKey: "vaccineChipSpecial",
      keys: ["vHeartwormInj"],
    },
  ],
  cat: [
    {
      labelKey: "vaccineChipCore",
      keys: ["v3in1", "v5in1Cat"],
    },
    {
      labelKey: "vaccineChipOther",
      // Cats: no rabies option in this product rule set
      keys: ["vFelv", "vChlamydia"],
    },
  ],
  other: [
    {
      labelKey: "vaccineChipOther",
      keys: ["vRabies"],
    },
  ],
};

/**
 * Same group = series progression (later shot supersedes earlier for that line).
 * displayRank: lower = higher priority for home/emergency status surfacing & list order.
 *   10 core combo → 20 heartworm inj → 30 rabies → 40 standalone lepto → 50 lyme → 80 custom
 */
const VACCINE_PROTECTION_META = {
  v5in1: { group: "coreCombo", tier: 5, displayRank: 10 },
  v7in1: { group: "coreCombo", tier: 7, displayRank: 10 },
  v8in1: { group: "coreCombo", tier: 8, displayRank: 10 },
  v10in1: { group: "coreCombo", tier: 10, displayRank: 10 },
  v11in1: { group: "coreCombo", tier: 11, displayRank: 10 },
  v3in1: { group: "felineCore", tier: 3, displayRank: 10 },
  v5in1Cat: { group: "felineCore", tier: 5, displayRank: 10 },
  vHeartwormInj: { group: "heartwormInj", tier: 1, displayRank: 20 },
  vRabies: { group: "rabies", tier: 1, displayRank: 30 },
  vLepto: { group: "lepto", tier: 1, displayRank: 40 },
  vLyme: { group: "lyme", tier: 1, displayRank: 50 },
  vFelv: { group: "felv", tier: 1, displayRank: 45 },
  vChlamydia: { group: "chlamydia", tier: 1, displayRank: 46 },
};

function resolveVaccineKey(vaccine) {
  if (vaccine?.key && VACCINE_PROTECTION_META[vaccine.key]) return vaccine.key;
  const name = vaccine?.name;
  if (!name || typeof I18N !== "object") return "";
  for (const table of Object.values(I18N)) {
    for (const key of Object.keys(VACCINE_PROTECTION_META)) {
      if (table[key] === name) return key;
    }
  }
  return "";
}

function vaccineLabelOf(vaccine) {
  const key = resolveVaccineKey(vaccine);
  if (key) return t(key);
  return vaccine?.name || "";
}

function getVaccineProtectionGroup(vaccine) {
  const key = resolveVaccineKey(vaccine);
  if (key) return VACCINE_PROTECTION_META[key].group;
  return `name:${vaccine?.name || ""}`;
}

function getVaccineTier(vaccine) {
  const key = resolveVaccineKey(vaccine);
  return key ? VACCINE_PROTECTION_META[key].tier : 0;
}

function getVaccineDisplayRank(vaccine) {
  const key = resolveVaccineKey(vaccine);
  if (key) return VACCINE_PROTECTION_META[key].displayRank;
  return 80;
}

/** Higher = more current within a protection group. */
function compareVaccineCurrency(a, b) {
  if (a.given !== b.given) return a.given < b.given ? -1 : 1;
  const tierDiff = getVaccineTier(a) - getVaccineTier(b);
  if (tierDiff) return tierDiff;
  if (a.next !== b.next) return a.next < b.next ? -1 : 1;
  return 0;
}

function getCurrentVaccinesByGroup(pet) {
  const map = new Map();
  (pet?.vaccines || []).forEach((vaccine) => {
    const group = getVaccineProtectionGroup(vaccine);
    const current = map.get(group);
    if (!current || compareVaccineCurrency(current, vaccine) < 0) {
      map.set(group, vaccine);
    }
  });
  return map;
}

function getVaccineSuccessor(pet, vaccine) {
  const current = getCurrentVaccinesByGroup(pet).get(getVaccineProtectionGroup(vaccine));
  return current && current !== vaccine ? current : null;
}

/** Urgency: expired > approaching > protected (lower score = more urgent). */
function vaccineStatusUrgency(nextDate) {
  const status = getVaccineProtectionStatus(nextDate);
  if (status === "expired") return 0;
  if (status === "approaching") return 1;
  return 2;
}

/**
 * Status strip / emergency nav: urgent first, then combo before rabies/add-ons,
 * then sooner next-due date.
 */
function compareVaccinesForStatusDisplay(a, b) {
  const urgency = vaccineStatusUrgency(a.next) - vaccineStatusUrgency(b.next);
  if (urgency) return urgency;
  const rank = getVaccineDisplayRank(a) - getVaccineDisplayRank(b);
  if (rank) return rank;
  if (a.next !== b.next) return a.next < b.next ? -1 : 1;
  return 0;
}

/** List order: active combo → heartworm inj → rabies → rarer; history last. */
function compareVaccinesForList(pet, a, b) {
  const aSup = Boolean(getVaccineSuccessor(pet, a));
  const bSup = Boolean(getVaccineSuccessor(pet, b));
  if (aSup !== bSup) return aSup ? 1 : -1;
  if (!aSup) {
    const rank = getVaccineDisplayRank(a) - getVaccineDisplayRank(b);
    if (rank) return rank;
    if (a.next !== b.next) return a.next < b.next ? -1 : 1;
    return getVaccineTier(b) - getVaccineTier(a);
  }
  if (a.given !== b.given) return a.given < b.given ? 1 : -1;
  return 0;
}

function isRabiesVaccineEntry(entry) {
  if (!entry) return false;
  if (entry.key === "vRabies") return true;
  const name = String(entry.name || "").trim().toLowerCase();
  if (!name) return false;
  if (name === "狂犬病" || name.includes("狂犬")) return true;
  if (name.includes("rabies")) return true;
  if (name.includes("광견병")) return true;
  // Match localized preset labels
  if (typeof I18N === "object") {
    for (const table of Object.values(I18N)) {
      const label = String(table?.vRabies || "").trim().toLowerCase();
      if (label && name === label) return true;
    }
  }
  return false;
}

function vaccineAllowedForPet(pet, entry) {
  if (pet?.species === "cat" && isRabiesVaccineEntry(entry)) return false;
  return true;
}

function syncVaccineFormHint(pet) {
  const hint = document.querySelector('[data-i18n="vaccineMultiHint"]');
  if (!hint) return;
  if (pet?.species === "cat") {
    hint.textContent = t("vaccineMultiHintCat");
  } else if (pet?.species === "dog") {
    hint.textContent = t("vaccineMultiHintDog");
  } else {
    hint.textContent = t("vaccineMultiHint");
  }
}

function fillVaccineNameOptions(pet) {
  if (!vaccineChipsEl) return;
  const groups = VACCINE_PRESETS[pet.species] || VACCINE_PRESETS.other;
  selectedVaccineKeys.clear();
  vaccineChipsEl.innerHTML = groups
    .map(
      (group) => `
        <div class="vaccine-chip-row">
          <p class="vaccine-chip-row-label">${t(group.labelKey)}</p>
          <div class="chips">
            ${group.keys
              .map(
                (key) =>
                  `<button type="button" class="chip" data-vaccine-key="${key}">${t(key)}</button>`
              )
              .join("")}
          </div>
        </div>`
    )
    .join("");
  if (vaccineCustomName) vaccineCustomName.value = "";
  syncVaccineFormHint(pet);
}

function getSelectedVaccineEntries() {
  const entries = [...selectedVaccineKeys].map((key) => ({
    key,
    name: t(key),
  }));
  const custom = vaccineCustomName?.value.trim() || "";
  if (custom) entries.push({ key: "", name: custom });
  return entries;
}

function vaccineStatusForNext(next) {
  const s = getVaccineProtectionStatus(next);
  return s === "approaching" ? "soon" : s === "expired" ? "expired" : "ok";
}

function syncVaccineNextDueFromGiven() {
  if (!vaccineGivenInput.value) return;
  vaccineNextDueInput.value = addYears(vaccineGivenInput.value, 1);
  syncDateProxies(vaccineForm || document);
}

function resetVaccineForm(pet) {
  vaccineForm.reset();
  fillVaccineNameOptions(pet);
  vaccineGivenInput.value = todayISODate();
  syncVaccineNextDueFromGiven();
  syncDateProxies(vaccineForm || document);
}

let vaccineFormPetId = null;

function refreshVaccineForm(pet) {
  if (vaccineFormPetId !== pet.id) {
    resetVaccineForm(pet);
    vaccineFormPetId = pet.id;
    return;
  }

  const draft = {
    selectedKeys: [...selectedVaccineKeys],
    customName: vaccineCustomName?.value || "",
    given: vaccineGivenInput.value,
    nextDue: vaccineNextDueInput.value,
  };
  fillVaccineNameOptions(pet);
  draft.selectedKeys.forEach((key) => selectedVaccineKeys.add(key));
  vaccineChipsEl?.querySelectorAll("[data-vaccine-key]").forEach((chip) => {
    chip.classList.toggle("is-on", selectedVaccineKeys.has(chip.dataset.vaccineKey));
  });
  if (vaccineCustomName) vaccineCustomName.value = draft.customName;
  vaccineGivenInput.value = draft.given;
  vaccineNextDueInput.value = draft.nextDue;
  syncDateProxies(vaccineForm || document);
}

function renderVaccineList(pet) {
  if (!pet.vaccines?.length) {
    vaccineList.innerHTML = `<li class="vaccine-empty">${t("noVaccines")}</li>`;
    return;
  }
  const sorted = [...pet.vaccines].sort((a, b) => compareVaccinesForList(pet, a, b));
  vaccineList.innerHTML = sorted
    .map((vaccine) => {
      const successor = getVaccineSuccessor(pet, vaccine);
      let pill;
      let itemClass = "";
      if (successor) {
        itemClass = " is-superseded";
        pill = `<span class="pill-history">${t("vaccineSupersededBy", {
          name: vaccineLabelOf(successor),
        })}</span>`;
      } else {
        const status = getVaccineProtectionStatus(vaccine.next);
        itemClass =
          status === "expired"
            ? " is-expired"
            : status === "approaching"
              ? " is-approaching"
              : " is-protected";
        pill =
          status === "expired"
            ? `<span class="pill-expired">${t("protectionLost")}</span>`
            : status === "approaching"
              ? `<span class="pill-soon">${t("dueWithin90")}</span>`
              : `<span class="pill-ok">${t("protected")}</span>`;
      }
      return `
          <li class="vaccine-item${itemClass}">
            <div class="vaccine-item-main">
              <strong class="vaccine-item-name">${vaccineLabelOf(vaccine)}</strong>
              <p class="vaccine-item-meta">${t("givenNext", { given: vaccine.given, next: vaccine.next })}</p>
            </div>
            ${pill}
          </li>`;
    })
    .join("");
}

function syncVaccineNavLights(status) {
  const lights = document.getElementById("e-vax-lights");
  if (!lights) return;
  const titleByStatus = {
    protected: t("vaxLightGreen"),
    approaching: t("vaxLightOrange"),
    expired: t("vaxLightRed"),
  };
  lights.querySelectorAll(".e-vax-dot").forEach((dot) => {
    const key = dot.dataset.status;
    const on = status && key === status;
    dot.classList.toggle("is-on", Boolean(on));
    if (titleByStatus[key]) dot.title = titleByStatus[key];
  });
  lights.setAttribute(
    "aria-label",
    status ? titleByStatus[status] : t("noVaccineNext")
  );
}

function renderEmergencyVaccineNav(pet) {
  const nextEl = document.getElementById("e-vaccine-next");
  const vaccineBtn = document.getElementById("e-vaccine-btn");
  if (!nextEl || !vaccineBtn) return;

  const nextVaccine = getNextVaccine(pet);
  vaccineBtn.classList.remove("is-protected", "is-approaching", "is-expired");

  if (!nextVaccine) {
    nextEl.textContent = t("noVaccineNext");
    nextEl.className = "";
    vaccineBtn.classList.add("is-protected");
    syncVaccineNavLights(null);
    return;
  }

  const status = getVaccineProtectionStatus(nextVaccine.next);
  nextEl.textContent = t("nextDue", { date: nextVaccine.next });
  nextEl.className =
    status === "expired"
      ? "e-nav-expired"
      : status === "approaching"
        ? "e-nav-approaching"
        : "e-nav-protected";
  vaccineBtn.classList.add(
    status === "expired"
      ? "is-expired"
      : status === "approaching"
        ? "is-approaching"
        : "is-protected"
  );
  syncVaccineNavLights(status);
}

function renderVaccines(pet) {
  renderVaccineList(pet);
  renderEmergencyVaccineNav(pet);
  renderVaccineStrip(pet);
}

function setManageMode(on) {
  isManagingPets = on;
  petSwitcher.classList.toggle("is-managing", on);
  petManageBtn.textContent = on ? t("done") : t("manage");
  petSwitcherHint.textContent = on ? t("petHintManage") : t("petHint");
  renderPetPicker();
}

const PET_PHOTOS_KEY = "petlive-pet-photos";
const PET_PHOTOS_COALESCE_MS = 80;
const petPhotosSlot = PetLiveWeb.storage.createJsonSlot({
  key: PET_PHOTOS_KEY,
  fallback: () => ({}),
  validate: isStorageMap,
  coalesceMs: PET_PHOTOS_COALESCE_MS,
  onFlushResult: (ok) => {
    if (!ok) showPersistenceFailure();
  },
});

const LAB_REPORTS_KEY = "petlive-lab-reports";
const LAB_PHOTOS_MAX = 6;
const LAB_TYPE_ORDER = [
  "blood",
  "chemistry",
  "urine",
  "fecal",
  "snap",
  "other",
];
const LAB_TYPE_I18N = {
  blood: "labTypeBlood",
  chemistry: "labTypeChem",
  urine: "labTypeUrine",
  fecal: "labTypeFecal",
  snap: "labTypeSnap",
  other: "labTypeOther",
};
const labReportsSlot = PetLiveWeb.storage.createJsonSlot({
  key: LAB_REPORTS_KEY,
  fallback: () => ({}),
  validate: isStorageMap,
});
let pendingLabPhotos = [];
let labAddBoundPetId = null;
let selectedLabClinic = null;
const selectedLabTypes = new Set();

function labTypeLabel(type) {
  return t(LAB_TYPE_I18N[type] || "labTypeOther");
}

function formatLabTypes(types) {
  const list = (types || []).filter((type) => LAB_TYPE_I18N[type]);
  if (!list.length) return t("labNoTypes");
  return list.map(labTypeLabel).join("／");
}

function visitLinkValue(visit) {
  return visitsController.visitLinkValue(visit);
}

function parseVisitLinkValue(value) {
  return visitsController.parseVisitLinkValue(value);
}

function findVisitByLink(pet, value) {
  return visitsController.findVisitByLink(pet, value);
}

function reportMatchesVisit(report, visit) {
  if (!report?.visitDate || !visit?.date) return false;
  if (report.visitDate !== visit.date) return false;
  if (report.visitClinicId && visit.clinicId) {
    return report.visitClinicId === visit.clinicId;
  }
  const reportClinic = report.clinic || "";
  if (!reportClinic && !report.visitClinicId) return true;
  return (
    reportClinic === visitClinicLabel(visit) || reportClinic === visit.clinic
  );
}

function getLabReportsForPet(petId) {
  if (!petId) return [];
  const map = labReportsSlot.read();
  const rows = map[petId];
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row && Array.isArray(row.photos) && row.photos.length)
    .slice()
    .sort((a, b) => {
      const da = String(a.date || "");
      const db = String(b.date || "");
      if (da !== db) return da < db ? 1 : -1;
      return String(b.createdAt || b.id || "").localeCompare(
        String(a.createdAt || a.id || "")
      );
    });
}

function writeLabReportsForPet(petId, reports) {
  if (!petId) return false;
  if (DEMO_MODE) return false;
  const map = labReportsSlot.read();
  map[petId] = reports;
  const ok = labReportsSlot.write(map);
  if (ok) bumpLocalDataRevision();
  return ok;
}

function renderEmergencyLabNav(pet) {
  const sub = document.getElementById("e-lab-sub");
  if (!sub) return;
  const reports = getLabReportsForPet(pet?.id);
  if (!reports.length) {
    sub.setAttribute("data-i18n", "eLabSubEmpty");
    sub.textContent = t("eLabSubEmpty");
    return;
  }
  const latest = reports[0];
  sub.removeAttribute("data-i18n");
  sub.textContent = t("eLabSubLatest", {
    date: latest.date,
    types: formatLabTypes(latest.types),
  });
}

function renderEmergencyImagingNav(pet) {
  const sub = document.getElementById("e-xray-sub");
  if (!sub) return;
  const entries = getImagingVisitEntries(pet);
  if (!entries.length) {
    sub.setAttribute("data-i18n", "eXraySubEmpty");
    sub.textContent = t("eXraySubEmpty");
    return;
  }
  const latest = entries[0].visit;
  sub.removeAttribute("data-i18n");
  sub.textContent = t("eXraySubLatest", {
    date: latest.date,
    types: formatImagingTypes(latest),
  });
}

function renderImagingList(pet) {
  const list = document.getElementById("imaging-list");
  if (!list) return;
  const entries = getImagingVisitEntries(pet);
  if (!entries.length) {
    list.innerHTML = `<li class="imaging-list-empty">
      <p>${t("imagingEmpty")}</p>
      <button type="button" class="btn btn-ghost" data-go-timeline-from-imaging>${t(
        "imagingEmptyGoTimeline"
      )}</button>
    </li>`;
    return;
  }
  list.innerHTML = entries
    .map(({ visit, index }) => {
      const clinic = escapeAlertHtml(visitClinicLabel(visit));
      return `<li class="imaging-item">
        <button
          type="button"
          class="imaging-item-btn"
          data-open-visit-imaging="${index}"
        >
          <time datetime="${escapeAlertHtml(visit.date)}">${escapeAlertHtml(
            visit.date
          )}</time>
          <span class="imaging-item-clinic">${clinic}</span>
          <span class="imaging-item-types">${escapeAlertHtml(
            formatImagingTypes(visit)
          )}</span>
        </button>
      </li>`;
    })
    .join("");
}

function renderVisitLabsLine(visit) {
  const pet = getCurrentPet();
  if (!pet || !visit) return "";
  const linked = getLabReportsForPet(pet.id).some((report) =>
    reportMatchesVisit(report, visit)
  );
  if (!linked) return "";
  return `<p class="tl-visit-labs">
      <button type="button" class="tl-visit-labs-btn" data-open-labs>
        ${t("timelineVisitLabs")}
      </button>
    </p>`;
}

function renderLabList(pet) {
  const list = document.getElementById("lab-list");
  if (!list) return;
  const reports = getLabReportsForPet(pet?.id);
  if (!reports.length) {
    list.innerHTML = `<li class="lab-list-empty">${t("labEmpty")}</li>`;
    return;
  }
  list.innerHTML = reports
    .map((report) => {
      const clinic = report.clinic
        ? escapeAlertHtml(report.clinic)
        : t("labNoClinic");
      const note = report.note
        ? `<p class="lab-item-note">${escapeAlertHtml(report.note)}</p>`
        : "";
      const thumbs = (report.photos || [])
        .map(
          (url) => `
        <button
          type="button"
          data-proof-lightbox
          data-proof-caption="labPhotoCaption"
          aria-label="${t("proofLightboxOpen")}"
        >
          <img src="${url}" alt="" />
        </button>`
        )
        .join("");
      return `<li class="lab-item" data-lab-id="${escapeAlertHtml(report.id)}">
        <div class="lab-item-head">
          <time datetime="${escapeAlertHtml(report.date)}">${escapeAlertHtml(
            report.date
          )}</time>
          <button
            type="button"
            class="btn btn-ghost lab-item-remove"
            data-lab-remove="${escapeAlertHtml(report.id)}"
          >${t("labRemove")}</button>
        </div>
        <p class="lab-item-clinic">${clinic}</p>
        <p class="lab-item-types">${escapeAlertHtml(formatLabTypes(report.types))}</p>
        ${note}
        <div class="lab-item-thumbs">${thumbs}</div>
      </li>`;
    })
    .join("");
}

function renderLabPhotoPreviews() {
  const root = document.getElementById("lab-photo-previews");
  if (!root) return;
  root.innerHTML = pendingLabPhotos
    .map(
      (url, index) => `
      <figure class="lab-photo-fig">
        <img src="${url}" alt="" />
        <button type="button" class="proof-clear-btn" data-lab-photo-remove="${index}">
          ${t("proofPhotoClear")}
        </button>
      </figure>`
    )
    .join("");
}

function setSelectedLabClinic(clinic) {
  selectedLabClinic = clinic;
  const search = document.getElementById("lab-clinic-search");
  const nameInput = document.getElementById("lab-clinic-name");
  const idInput = document.getElementById("lab-clinic-id");
  const selectedEl = document.getElementById("lab-selected-clinic");
  const results = document.getElementById("lab-clinic-results");
  if (!search || !nameInput || !idInput || !selectedEl) return;
  if (!clinic) {
    nameInput.value = "";
    idInput.value = "";
    selectedEl.hidden = true;
    selectedEl.textContent = "";
    selectedEl.classList.remove("is-anonymous");
    return;
  }
  const name = clinicNameOf(clinic);
  search.value = name;
  nameInput.value = name;
  idInput.value = clinic.id || "";
  selectedEl.hidden = false;
  selectedEl.classList.toggle("is-anonymous", Boolean(clinic.anonymous));
  selectedEl.textContent = clinic.anonymous
    ? t("selectedClinicAnon")
    : t("selectedClinic", { name });
  if (results) results.hidden = true;
}

function renderLabClinicResults(list) {
  const results = document.getElementById("lab-clinic-results");
  if (!results) return;
  if (!list.length) {
    results.hidden = true;
    results.innerHTML = "";
    return;
  }
  results.hidden = false;
  results.innerHTML = list
    .map(
      (clinic) => `
      <li>
        <button
          type="button"
          data-lab-clinic-id="${clinic.id}"
          class="${clinic.anonymous ? "is-anonymous" : ""}"
        >
          <strong>${clinic.name}</strong>
          <small>${clinic.note}</small>
        </button>
      </li>`
    )
    .join("");
}

function syncLabTypeChips() {
  document.querySelectorAll("#lab-type-chips [data-lab-type]").forEach((chip) => {
    chip.classList.toggle("is-on", selectedLabTypes.has(chip.dataset.labType));
  });
}

function fillLabVisitOptions(pet) {
  const select = document.getElementById("lab-visit-link");
  if (!select) return;
  const previous = select.value;
  const visits = (pet?.visits || []).slice();
  const options = [
    `<option value="">${t("labVisitNone")}</option>`,
    ...visits.map((visit) => {
      const value = visitLinkValue(visit);
      const label = t("labVisitOption", {
        date: visit.date,
        clinic: visitClinicLabel(visit),
      });
      return `<option value="${escapeAlertHtml(value)}">${escapeAlertHtml(
        label
      )}</option>`;
    }),
  ];
  select.innerHTML = options.join("");
  if (previous && [...select.options].some((opt) => opt.value === previous)) {
    select.value = previous;
  }
}

function resetLabAddForm(pet) {
  pendingLabPhotos = [];
  selectedLabTypes.clear();
  labAddBoundPetId = pet?.id || null;
  const form = document.getElementById("lab-add-form");
  form?.reset();
  const dateInput = document.getElementById("lab-date");
  if (dateInput) dateInput.value = todayISODate();
  const photoInput = document.getElementById("lab-photos-input");
  if (photoInput) photoInput.value = "";
  const note = document.getElementById("lab-note");
  if (note) note.value = "";
  const search = document.getElementById("lab-clinic-search");
  if (search) search.value = "";
  setSelectedLabClinic(null);
  renderLabClinicResults([]);
  renderLabPhotoPreviews();
  syncLabTypeChips();
  fillLabVisitOptions(pet);
}

function refreshLabAddChrome(pet) {
  fillLabVisitOptions(pet);
  syncLabTypeChips();
  if (selectedLabClinic) setSelectedLabClinic(selectedLabClinic);
  renderLabPhotoPreviews();
}

function ensureLabAddForPet(pet) {
  if (!pet) return;
  if (labAddBoundPetId !== pet.id) resetLabAddForm(pet);
  else refreshLabAddChrome(pet);
}

const PET_AVATAR_SVG_PAW = `
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <ellipse cx="15" cy="14" rx="5.2" ry="6.4" fill="currentColor" opacity="0.95"/>
    <ellipse cx="33" cy="14" rx="5.2" ry="6.4" fill="currentColor" opacity="0.95"/>
    <ellipse cx="10" cy="24" rx="3.4" ry="4.2" fill="currentColor" opacity="0.88"/>
    <ellipse cx="38" cy="24" rx="3.4" ry="4.2" fill="currentColor" opacity="0.88"/>
    <circle cx="24" cy="27" r="11.5" fill="currentColor"/>
    <circle cx="19.5" cy="25.5" r="1.5" fill="rgba(26,52,45,0.35)"/>
    <circle cx="28.5" cy="25.5" r="1.5" fill="rgba(26,52,45,0.35)"/>
    <ellipse cx="24" cy="29.5" rx="2.2" ry="1.5" fill="rgba(26,52,45,0.28)"/>
  </svg>
`.trim();

const PET_AVATAR_SVG_DOG = `
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path d="M10.8 22.4L16.6 5l6.8 12.8z" fill="currentColor"/>
    <path d="M37.2 22.4L31.4 5l-6.8 12.8z" fill="currentColor"/>
    <circle cx="24" cy="28" r="13.5" fill="currentColor"/>
    <circle cx="18.1" cy="26.2" r="1.9" fill="rgba(26,52,45,0.4)"/>
    <circle cx="29.9" cy="26.2" r="1.9" fill="rgba(26,52,45,0.4)"/>
    <ellipse cx="24" cy="30.4" rx="2.5" ry="1.85" fill="rgba(26,52,45,0.36)"/>
  </svg>
`.trim();

const PET_AVATAR_SVG_CAT = `
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path d="M9 22.5L15.2 5.2l8.6 12.6z" fill="currentColor"/>
    <path d="M39 22.5L32.8 5.2l-8.6 12.6z" fill="currentColor"/>
    <ellipse cx="24" cy="28.2" rx="14.2" ry="13.4" fill="currentColor"/>
    <circle cx="17.4" cy="26.4" r="1.9" fill="rgba(26,52,45,0.4)"/>
    <circle cx="30.6" cy="26.4" r="1.9" fill="rgba(26,52,45,0.4)"/>
    <path d="M24 29.6l-2.55 3.15h5.1z" fill="rgba(26,52,45,0.36)"/>
    <path d="M10.8 30h6.2M31 30h6.2M11.4 33.2h5.4M31.2 33.2h5.4" fill="none" stroke="rgba(26,52,45,0.24)" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
`.trim();

function petAvatarSvgForSpecies(species) {
  if (species === "dog") return PET_AVATAR_SVG_DOG;
  if (species === "cat") return PET_AVATAR_SVG_CAT;
  return PET_AVATAR_SVG_PAW;
}

const PET_FRAME_EMPTY_SVG = `
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <rect x="9" y="13" width="30" height="22" rx="3.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="17.5" cy="21.5" r="2.6" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M11.5 31.5l7.2-7.2 5.2 5.2 4.1-4.1 8.5 6.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`.trim();

function loadPetPhotosMap() {
  return petPhotosSlot.read();
}

function savePetPhotosMap(map) {
  if (DEMO_MODE) return false;
  const ok = petPhotosSlot.scheduleWrite(map);
  if (ok) bumpLocalDataRevision();
  return ok;
}

function flushPetPhotosMap() {
  return petPhotosSlot.flush();
}

function getPetPhoto(petId) {
  const map = loadPetPhotosMap();
  return map[petId] || null;
}

function setPetPhoto(petId, dataUrl) {
  const map = loadPetPhotosMap();
  if (dataUrl) map[petId] = dataUrl;
  else delete map[petId];
  if (!savePetPhotosMap(map)) return false;
  const pet = pets.find((p) => p.id === petId);
  if (pet) pet.photo = dataUrl || "";
  return true;
}

function flushPetPhotosOrToast() {
  if (!petPhotosSlot.hasPendingWrite()) return true;
  if (flushPetPhotosMap()) return true;
  showPersistenceFailure();
  return false;
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushPetPhotosOrToast();
});
window.addEventListener("pagehide", () => {
  flushPetPhotosOrToast();
});

function hydratePetPhotos() {
  const map = loadPetPhotosMap();
  pets.forEach((pet) => {
    if (map[pet.id]) pet.photo = map[pet.id];
  });
}

const PROOF_PHOTO_MAX_EDGE = 1280;

function resizeImageDataUrl(dataUrl, maxEdge = 480) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function petAvatarMarkup(pet, { className = "pet-option-photo" } = {}) {
  const photo = pet?.photo || getPetPhoto(pet?.id);
  if (photo) {
    return `<span class="${className} has-photo" style="background-image:url('${photo}')" aria-hidden="true"></span>`;
  }
  const species = pet?.species || "other";
  return `<span class="${className}" data-species="${species}" aria-hidden="true">${petAvatarSvgForSpecies(species)}</span>`;
}

function renderEmergencyPetPhoto(pet) {
  const frameLabel = document.getElementById("e-pet-photo");
  const frame = document.getElementById("e-pet-photo-preview");
  if (!frameLabel || !frame) return;
  const photo = pet.photo || getPetPhoto(pet.id);
  const key = photo ? "petPhotoChange" : "petPhotoUpload";
  const labelText = t(key);
  frameLabel.title = labelText;
  frameLabel.setAttribute("aria-label", labelText);
  if (photo) {
    frame.classList.add("has-photo");
    frame.style.backgroundImage = `url('${photo}')`;
    frame.innerHTML = "";
  } else {
    frame.classList.remove("has-photo");
    frame.style.backgroundImage = "";
    frame.innerHTML = PET_FRAME_EMPTY_SVG;
  }
}

const photoCropEls = {
  root: document.getElementById("photo-crop"),
  viewport: document.getElementById("photo-crop-viewport"),
  img: document.getElementById("photo-crop-img"),
  zoom: document.getElementById("photo-crop-zoom"),
  cancel: document.getElementById("photo-crop-cancel"),
  save: document.getElementById("photo-crop-save"),
};

const photoCropState = {
  open: false,
  petId: null,
  naturalW: 0,
  naturalH: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  dragging: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
};

function loadImageFromUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function getPhotoCropViewportSize() {
  const vp = photoCropEls.viewport;
  if (!vp) return 280;
  return vp.clientWidth || 280;
}

function getPhotoCropMetrics() {
  const view = getPhotoCropViewportSize();
  const { naturalW: nw, naturalH: nh, zoom } = photoCropState;
  if (!nw || !nh) {
    return { view, scale: 1, left: 0, top: 0, width: view, height: view };
  }
  const cover = Math.max(view / nw, view / nh);
  const scale = cover * zoom;
  const width = nw * scale;
  const height = nh * scale;
  const left = view / 2 - width / 2 + photoCropState.offsetX;
  const top = view / 2 - height / 2 + photoCropState.offsetY;
  return { view, scale, left, top, width, height, nw, nh };
}

function clampPhotoCropOffset() {
  const { view, width, height } = getPhotoCropMetrics();
  const maxX = Math.max(0, (width - view) / 2);
  const maxY = Math.max(0, (height - view) / 2);
  photoCropState.offsetX = Math.min(maxX, Math.max(-maxX, photoCropState.offsetX));
  photoCropState.offsetY = Math.min(maxY, Math.max(-maxY, photoCropState.offsetY));
}

function renderPhotoCropTransform() {
  if (!photoCropEls.img) return;
  clampPhotoCropOffset();
  const { left, top, width, height } = getPhotoCropMetrics();
  photoCropEls.img.style.width = `${width}px`;
  photoCropEls.img.style.height = `${height}px`;
  photoCropEls.img.style.transform = `translate(${left}px, ${top}px)`;
}

function closePetPhotoCrop() {
  if (!photoCropEls.root) return;
  photoCropState.open = false;
  photoCropState.petId = null;
  photoCropState.dragging = false;
  photoCropEls.root.hidden = true;
  document.documentElement.classList.remove("is-photo-crop-open");
  document.body.style.overflow = "";
  if (photoCropEls.img) {
    photoCropEls.img.removeAttribute("src");
    photoCropEls.img.removeAttribute("style");
  }
}

async function openPetPhotoCrop(dataUrl, petId) {
  if (!photoCropEls.root || !photoCropEls.img || !photoCropEls.zoom) return;
  const prepared = await resizeImageDataUrl(dataUrl, 1600);
  const img = await loadImageFromUrl(prepared);
  photoCropState.open = true;
  photoCropState.petId = petId;
  photoCropState.naturalW = img.naturalWidth;
  photoCropState.naturalH = img.naturalHeight;
  photoCropState.zoom = 1;
  photoCropState.offsetX = 0;
  photoCropState.offsetY = 0;
  photoCropEls.img.src = prepared;
  photoCropEls.zoom.value = "1";
  photoCropEls.root.hidden = false;
  document.documentElement.classList.add("is-photo-crop-open");
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => {
    renderPhotoCropTransform();
  });
}

function exportPetPhotoCrop(outputSize = 480) {
  const { view, scale, left, top, nw, nh } = getPhotoCropMetrics();
  if (!nw || !nh || !photoCropEls.img?.src) return null;
  const srcSize = view / scale;
  const sx = Math.max(0, Math.min(nw - srcSize, -left / scale));
  const sy = Math.max(0, Math.min(nh - srcSize, -top / scale));
  const sw = Math.min(srcSize, nw - sx);
  const sh = Math.min(srcSize, nh - sy);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#e8f1ed";
  ctx.fillRect(0, 0, outputSize, outputSize);
  ctx.drawImage(photoCropEls.img, sx, sy, sw, sh, 0, 0, outputSize, outputSize);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function bindPetPhotoCropUi() {
  if (!photoCropEls.viewport || !photoCropEls.zoom) return;

  photoCropEls.zoom.addEventListener("input", () => {
    if (!photoCropState.open) return;
    photoCropState.zoom = Number(photoCropEls.zoom.value) || 1;
    renderPhotoCropTransform();
  });

  photoCropEls.viewport.addEventListener("pointerdown", (event) => {
    if (!photoCropState.open || event.button != null && event.button !== 0) return;
    photoCropState.dragging = true;
    photoCropState.pointerId = event.pointerId;
    photoCropState.startX = event.clientX;
    photoCropState.startY = event.clientY;
    photoCropState.originX = photoCropState.offsetX;
    photoCropState.originY = photoCropState.offsetY;
    photoCropEls.viewport.classList.add("is-dragging");
    photoCropEls.viewport.setPointerCapture?.(event.pointerId);
  });

  photoCropEls.viewport.addEventListener("pointermove", (event) => {
    if (!photoCropState.dragging || event.pointerId !== photoCropState.pointerId) return;
    photoCropState.offsetX = photoCropState.originX + (event.clientX - photoCropState.startX);
    photoCropState.offsetY = photoCropState.originY + (event.clientY - photoCropState.startY);
    renderPhotoCropTransform();
  });

  const endDrag = (event) => {
    if (!photoCropState.dragging) return;
    if (event && photoCropState.pointerId != null && event.pointerId !== photoCropState.pointerId) {
      return;
    }
    photoCropState.dragging = false;
    photoCropState.pointerId = null;
    photoCropEls.viewport.classList.remove("is-dragging");
  };

  photoCropEls.viewport.addEventListener("pointerup", endDrag);
  photoCropEls.viewport.addEventListener("pointercancel", endDrag);

  photoCropEls.cancel?.addEventListener("click", () => {
    closePetPhotoCrop();
  });

  photoCropEls.save?.addEventListener("click", () => {
    const pet = pets.find((p) => p.id === photoCropState.petId) || getCurrentPet();
    if (!pet) {
      closePetPhotoCrop();
      return;
    }
    const dataUrl = exportPetPhotoCrop(480);
    if (!dataUrl) {
      showToast(t("toastPetPhotoFail"));
      return;
    }
    if (!setPetPhoto(pet.id, dataUrl)) {
      showPersistenceFailure();
      return;
    }
    renderEmergencyPetPhoto(pet);
    renderPetPicker();
    closePetPhotoCrop();
    showToast(t("toastPetPhotoSaved", { name: pet.name }));
  });

  photoCropEls.root?.addEventListener("click", (event) => {
    if (event.target === photoCropEls.root) closePetPhotoCrop();
  });

  window.addEventListener("resize", () => {
    if (photoCropState.open) renderPhotoCropTransform();
  });
}

bindPetPhotoCropUi();

function renderPetPicker() {
  petPicker.innerHTML = pets
    .map((pet) => {
      const selected = pet.id === currentPetId;
      return `
        <button
          type="button"
          class="pet-option${selected ? " is-selected" : ""}"
          role="option"
          aria-selected="${selected}"
          data-pet-id="${pet.id}"
          style="--pet-tone: ${pet.tone}"
        >
          ${petAvatarMarkup(pet)}
          <span class="pet-option-name">${pet.name}</span>
          <span
            class="pet-archive-btn"
            data-archive-pet-id="${pet.id}"
            role="button"
            aria-label="${t("archivePetAria", { name: pet.name })}"
          ></span>
          <span
            class="pet-remove-btn"
            data-remove-pet-id="${pet.id}"
            role="button"
            aria-label="${t("removePetAria", { name: pet.name })}"
          >×</span>
        </button>
      `;
    })
    .join("")
    .concat(`
      <button type="button" class="pet-option pet-option-add" id="add-pet-btn" aria-label="${t(
        "addPetLabel"
      )}">
        <span class="pet-option-photo" aria-hidden="true">+</span>
        <span class="pet-option-name">${t("addPet")}</span>
      </button>
    `);
}

/** Toggle selection without wiping pet-picker DOM (keeps CSS lift transition). */
function syncPetPickerSelection() {
  if (!petPicker) return;
  petPicker.querySelectorAll(".pet-option[data-pet-id]").forEach((btn) => {
    const selected = btn.dataset.petId === currentPetId;
    btn.classList.toggle("is-selected", selected);
    btn.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function petPickerNeedsRebuild() {
  if (!petPicker) return true;
  if (!petPicker.querySelector("#add-pet-btn")) return true;
  const buttons = [...petPicker.querySelectorAll(".pet-option[data-pet-id]")];
  if (buttons.length !== pets.length) return true;
  return pets.some((pet, i) => buttons[i]?.dataset.petId !== pet.id);
}

function renderArchiveList() {
  if (archiveBtn) {
    archiveBtn.setAttribute("aria-label", t("rainbowArchive"));
    archiveBtn.setAttribute("title", t("rainbowArchive"));
  }

  if (!archivedPets.length) {
    archiveList.innerHTML = `<li class="archive-empty">${t("archiveEmpty")}</li>`;
    return;
  }

  archiveList.innerHTML = archivedPets
    .map(
      (pet) => `
      <li class="archive-item" style="--pet-tone: ${pet.tone}">
        <div class="archive-item-photo" aria-hidden="true"></div>
        <div>
          <strong>${pet.name}</strong>
          <p>${speciesLabelOf(pet)} · ${breedLabelOf(pet)}</p>
          <p>${t("leftOn", { date: pet.passedAwayDate })}${
            pet.memorialNote ? ` · ${pet.memorialNote}` : ""
          }</p>
        </div>
      </li>`
    )
    .join("");
}

function getPendingArchivePet() {
  return pets.find((pet) => pet.id === pendingArchivePetId) || null;
}

function openArchivePetFlow(petId) {
  const pet = pets.find((item) => item.id === petId);
  if (!pet) return;
  pendingArchivePetId = petId;
  document.getElementById("archive-pet-name").textContent = pet.name;
  document.getElementById("archive-pet-meta").textContent =
    `${speciesLabelOf(pet)} · ${breedLabelOf(pet)} · ${ageLabelOf(pet)}`;
  document.getElementById("archive-pet-sub").textContent = t("archiveSubFor", {
    name: pet.name,
  });
  const form = document.getElementById("archive-pet-form");
  form.reset();
  document.getElementById("archive-passed-date").value = todayISODate();
  go("archive-pet");
}

function cancelArchivePetFlow() {
  pendingArchivePetId = null;
  setManageMode(false);
  go("home", { replace: true });
  clearNavigationHistory();
}

function confirmArchivePet(event) {
  event.preventDefault();
  const pet = getPendingArchivePet();
  if (!pet) return;

  const passedAwayDate = document.getElementById("archive-passed-date").value;
  const memorialNote = document
    .getElementById("archive-memorial-note")
    .value.trim();
  if (!passedAwayDate) {
    showToast(t("toastNeedPassedDate"));
    return;
  }

  const index = pets.findIndex((item) => item.id === pet.id);
  if (index < 0) return;
  const [archived] = pets.splice(index, 1);
  archived.passedAwayDate = passedAwayDate;
  archived.memorialNote = memorialNote || "";
  archivedPets.unshift(archived);

  const wasCurrent = currentPetId === archived.id;
  pendingArchivePetId = null;
  setManageMode(false);
  if (wasCurrent || !pets.some((item) => item.id === currentPetId)) {
    currentPetId = pets[0]?.id || null;
    appState.setCurrentPetId(currentPetId);
  }
  applySelectedPet();
  renderArchiveList();
  showToast(t("toastArchived", { name: archived.name }));
  clearNavigationHistory();
  go("archive", { replace: true });
}

function getPendingRemovePet() {
  return pets.find((pet) => pet.id === pendingRemovePetId) || null;
}

function setRemoveStep(step) {
  removeStep = step;
  document.querySelectorAll(".remove-step").forEach((el) => {
    const n = Number(el.dataset.step);
    el.classList.toggle("is-active", n === step);
    el.classList.toggle("is-done", n < step);
  });
  document.querySelectorAll("[data-remove-step]").forEach((card) => {
    card.hidden = Number(card.dataset.removeStep) !== step;
  });

  const pet = getPendingRemovePet();
  if (!pet) return;
  document.getElementById("remove-pet-name-1").textContent = pet.name;
  document.getElementById("remove-pet-name-3").textContent = pet.name;
  document.getElementById("remove-pet-sub").textContent = t("removeStepSub", {
    name: pet.name,
    step,
  });

  if (step === 3) {
    const input = document.getElementById("remove-pet-confirm-input");
    const confirmBtn = document.getElementById("remove-pet-confirm-btn");
    input.value = "";
    confirmBtn.disabled = true;
    requestAnimationFrame(() => input.focus());
  }
}

function openRemovePetFlow(petId) {
  const pet = pets.find((item) => item.id === petId);
  if (!pet) return;
  pendingRemovePetId = petId;
  setRemoveStep(1);
  go("remove-pet");
}

function cancelRemovePetFlow() {
  pendingRemovePetId = null;
  removeStep = 1;
  setManageMode(false);
  go("home", { replace: true });
  clearNavigationHistory();
}

function confirmRemovePet() {
  const pet = getPendingRemovePet();
  if (!pet) return;

  const input = document.getElementById("remove-pet-confirm-input");
  if (input.value.trim() !== pet.name) {
    showToast(t("toastNameMismatch"));
    return;
  }

  const removedName = pet.name;
  const wasCurrent = currentPetId === pet.id;
  pets.splice(
    pets.findIndex((item) => item.id === pet.id),
    1
  );
  pendingRemovePetId = null;
  setManageMode(false);

  if (wasCurrent || !pets.some((item) => item.id === currentPetId)) {
    currentPetId = pets[0]?.id || null;
    appState.setCurrentPetId(currentPetId);
  }
  applySelectedPet();
  showToast(t("toastRemoved", { name: removedName }));
  clearNavigationHistory();
  go("home", { replace: true });
}

function safeRender(sectionName, fn, onError) {
  if (window.PetLiveSafeUI?.safeRender) {
    return window.PetLiveSafeUI.safeRender(sectionName, fn, onError);
  }
  try {
    fn();
    return true;
  } catch (error) {
    console.warn(`[safeRender:${sectionName}]`, error);
    if (typeof onError === "function") onError(error);
    return false;
  }
}

function renderPetHeader(pet) {
  petCurrentEl.classList.remove("is-updating");
  void petCurrentEl.offsetWidth;
  petCurrentEl.classList.add("is-updating");
  requestAnimationFrame(() => {
    petCurrentEl.classList.remove("is-updating");
  });

  if (!pet) {
    petNameEl.textContent = t("emptyPetsTitle");
    petSubEl.textContent = t("emptyPetsSub");
    if (timelineSub) timelineSub.textContent = "";
    if (visitFormSub) visitFormSub.textContent = "";
    if (vaccineSub) vaccineSub.textContent = "";
    return;
  }

  petNameEl.textContent = pet.name;
  petSubEl.textContent = t("petSub", {
    species: speciesLabelOf(pet),
    breed: breedLabelOf(pet),
    age: ageLabelOf(pet),
    weight: pet.weight,
  });

  timelineSub.textContent = t("timelineSub", { name: pet.name });
  visitFormSub.textContent = t("visitFormSub", { name: pet.name });
  vaccineSub.textContent = t("vaccineSub", { name: pet.name });
}

function syncAlertNavTone(alerts) {
  const highest = highestAlertSeverity(alerts);
  const nav = document.querySelector(".e-nav-alerts");
  [alertCountBtn, nav].forEach((el) => {
    if (!el) return;
    el.classList.toggle("is-critical", highest === "critical");
    el.classList.toggle("is-caution", highest === "caution");
  });
  const block = eAlerts?.closest(".e-alerts");
  if (block) {
    block.classList.toggle("is-critical", highest === "critical");
    block.classList.toggle("is-caution", highest === "caution");
  }
}

function renderAlertBadge(pet) {
  const alerts = getAlertsForPet(pet);
  const n = alerts.length;
  if (alertCountBtn) {
    alertCountBtn.textContent = n
      ? t("alertsPetBtn", { name: pet.name, n })
      : t("alertsPetNone", { name: pet.name });
    alertCountBtn.setAttribute(
      "aria-label",
      n ? t("alertsPetBtnAria", { name: pet.name, n }) : t("alertsPetNone", { name: pet.name })
    );
  }
  syncAlertNavTone(alerts);
}

const OWNER_PROFILE_KEY = "petlive-owner-profile";

/** Showcase / field-demo sample owner (not real PII). */
function demoOwnerProfile() {
  return {
    name: "王陽明",
    phone: "0912345678",
    email: "wang.yangming@demo.petlive",
    emergencyName: "王守仁",
    emergencyPhone: "0987654321",
    address: "那美剋星三丁目 七龍珠巷 42 弄 99 號 B1",
  };
}

function emptyOwnerProfile() {
  return {
    name: "",
    phone: "",
    email: "",
    emergencyName: "",
    emergencyPhone: "",
    address: "",
  };
}

const ownerProfileSlot = PetLiveWeb.storage.createJsonSlot({
  key: OWNER_PROFILE_KEY,
  fallback: emptyOwnerProfile,
  validate: isStorageMap,
});

function loadOwnerProfile() {
  if (DEMO_MODE) {
    return { ...emptyOwnerProfile(), ...demoOwnerProfile() };
  }
  scrubDemoOwnerProfileFromStorage();
  return { ...emptyOwnerProfile(), ...ownerProfileSlot.read() };
}

/** Remove leftover showcase owner (王陽明) written by older prototype builds. */
function scrubDemoOwnerProfileFromStorage() {
  try {
    const raw = localStorage.getItem(OWNER_PROFILE_KEY);
    if (!raw) return;
    const profile = JSON.parse(raw);
    const isDemo =
      profile?.email === "wang.yangming@demo.petlive" ||
      (profile?.name === "王陽明" && profile?.phone === "0912345678");
    if (!isDemo) return;
    localStorage.removeItem(OWNER_PROFILE_KEY);
    ownerProfileSlot.clear?.();
    ownerProfileSlot.invalidate?.();
  } catch {
    /* ignore */
  }
}

function saveOwnerProfile(profile) {
  if (DEMO_MODE) return false;
  const ok = ownerProfileSlot.write(profile);
  if (ok) bumpLocalDataRevision();
  return ok;
}

function ownerProfileHasAny(profile) {
  return Boolean(
    profile.name ||
      profile.phone ||
      profile.email ||
      profile.emergencyName ||
      profile.emergencyPhone ||
      profile.address
  );
}

function formatPetShareLines(pet) {
  const lines = [];
  if (pet?.name) lines.push(t("copyName", { name: pet.name }));
  const species = speciesLabelOf(pet);
  if (species) lines.push(t("copySpecies", { text: species }));
  const breed = breedLabelOf(pet);
  if (breed) lines.push(t("copyBreed", { text: breed }));
  const gender = genderLabelOf(pet);
  if (gender) lines.push(t("copyGender", { text: gender }));
  const age = ageLabelOf(pet);
  if (age) lines.push(t("copyAge", { text: age }));
  const birth = String(pet?.birthDate || "").trim();
  if (birth) lines.push(t("eBirthLine", { birth }));
  if (pet?.weight != null && String(pet.weight).trim() !== "") {
    lines.push(
      pet.weightDate
        ? t("copyWeightDated", { weight: pet.weight, date: pet.weightDate })
        : t("copyWeight", { weight: pet.weight })
    );
  }
  const chip = String(pet?.chipNumber || "").trim();
  if (chip) lines.push(t("eChipLine", { chip }));
  return lines;
}

function buildEmergencyCopyText(pet) {
  const alerts = getAlertsForPet(pet);
  const alertText = alerts.length
    ? alerts.map((a) => `${alertTypeLabel(a.alertType)} ${alertLineText(a)}`).join("；")
    : t("none");
  const activeMeds = deriveActiveEmergencyMeds(pet);
  const medText = activeMeds.length
    ? activeMeds.map((med) => formatMedLine(med)).join("；")
    : t("none");
  const ownerLines = formatOwnerCopyLines(loadOwnerProfile());

  return [
    t("copyCardTitle"),
    "",
    ...formatPetShareLines(pet),
    "",
    t("copyAlerts", { text: alertText }),
    t("copyMeds", { text: medText }),
    ...(ownerLines.length ? ownerLines : [t("copyOwnerEmpty")]),
    t("copyDisclaimer"),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  if (!ok) throw new Error("copy failed");
}

function formatOwnerCopyLines(profile) {
  const lines = [];
  if (profile.name || profile.phone) {
    lines.push(
      t("copyOwnerLine", {
        text: [profile.name, profile.phone].filter(Boolean).join(" · "),
      })
    );
  }
  if (profile.email) lines.push(t("copyOwnerEmail", { email: profile.email }));
  if (profile.emergencyName || profile.emergencyPhone) {
    lines.push(
      t("copyOwnerEmergency", {
        text: [profile.emergencyName, profile.emergencyPhone]
          .filter(Boolean)
          .join(" · "),
      })
    );
  }
  if (profile.address) lines.push(t("copyOwnerAddress", { address: profile.address }));
  return lines;
}

function fillOwnerSettingsForm(profile = loadOwnerProfile()) {
  const map = {
    "owner-name": profile.name,
    "owner-phone": profile.phone,
    "owner-email": profile.email,
    "owner-emergency-name": profile.emergencyName,
    "owner-emergency-phone": profile.emergencyPhone,
    "owner-address": profile.address,
  };
  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  });
}

function readOwnerSettingsForm() {
  return {
    name: document.getElementById("owner-name")?.value.trim() || "",
    phone: document.getElementById("owner-phone")?.value.trim() || "",
    email: document.getElementById("owner-email")?.value.trim() || "",
    emergencyName: document.getElementById("owner-emergency-name")?.value.trim() || "",
    emergencyPhone: document.getElementById("owner-emergency-phone")?.value.trim() || "",
    address: document.getElementById("owner-address")?.value.trim() || "",
  };
}

function renderEmergencyOwner() {
  const el = document.getElementById("e-owner");
  if (!el) return;
  const profile = loadOwnerProfile();
  if (!ownerProfileHasAny(profile)) {
    el.innerHTML = `<p class="e-owner-empty">${t("ownerContactEmpty")}</p>`;
    return;
  }
  const row = (label, valueHtml) =>
    `<p class="e-owner-row"><span class="e-owner-k">${label}</span><span class="e-owner-v">${valueHtml}</span></p>`;
  const rows = [];
  if (profile.name || profile.phone) {
    const parts = [];
    if (profile.name) {
      parts.push(`<span class="e-owner-name">${profile.name}</span>`);
    }
    if (profile.phone) {
      parts.push(`<span class="e-owner-phone">${profile.phone}</span>`);
    }
    rows.push(row(t("ownerName"), parts.join("")));
  }
  // Card only shows filled fields — label omits「選填」.
  if (profile.email) {
    rows.push(row(t("ownerEmailShort"), profile.email));
  }
  if (profile.emergencyName || profile.emergencyPhone) {
    const parts = [];
    if (profile.emergencyName) {
      parts.push(`<span class="e-owner-name">${profile.emergencyName}</span>`);
    }
    if (profile.emergencyPhone) {
      parts.push(`<span class="e-owner-phone">${profile.emergencyPhone}</span>`);
    }
    rows.push(row(t("ownerEmergencyLabel"), parts.join("")));
  }
  if (profile.address) {
    rows.push(row(t("ownerAddressShort"), profile.address));
  }
  el.innerHTML = rows.join("");
}

function buildEmergencySnapshot(pet) {
  const alerts = getAlertsForPet(pet);
  const meds = deriveActiveEmergencyMeds(pet);
  return {
    pet: {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      gender: pet.gender,
      birthDate: pet.birthDate,
      chipNumber: pet.chipNumber || "",
      weight: pet.weight,
      weightDate: pet.weightDate,
    },
    latestWeight:
      pet.weight != null
        ? { weight: pet.weight, recordedDate: pet.weightDate || null }
        : null,
    alerts,
    currentMedications: meds,
  };
}

function renderEmergencyAlertsList(alerts) {
  if (!alerts.length) {
    eAlerts.innerHTML = `<li>${t("noAlertItem")}</li>`;
    return;
  }
  eAlerts.innerHTML = alerts
    .map((alert) => {
      const severity = alert.severity === "critical" ? "critical" : "caution";
      const line =
        alertLineText(alert) ||
        locField(alert.description) ||
        alert.description ||
        "";
      const typeLabel = alert.alertType
        ? alertTypeLabel(alert.alertType)
        : alert.type || "";
      return `<li class="is-${severity}"><strong>${escapeAlertHtml(
        typeLabel
      )}</strong> ${escapeAlertHtml(line)}${
        alert.source === "owner"
          ? ` <span class="e-alert-source">(${escapeAlertHtml(
              t("alertSourceOwnerShort")
            )})</span>`
          : ""
      }</li>`;
    })
    .join("");
}

function renderEmergencyMedsFromList(meds) {
  if (!meds.length) {
    eMeds.innerHTML = `<li>${t("noMeds")}</li>`;
    return;
  }
  eMeds.innerHTML = meds
    .map((med, medIndex) => {
      const name =
        med.name ||
        med.unrecognizedDrugName ||
        med.drugId ||
        t("emergencyMedNameUnknown");
      const view = { ...med, name };
      const notesId = `e-drug-notes-${view.id || medIndex}-${medIndex}`;
      const course =
        view.startDate != null && view.durationDays != null
          ? formatMedCourse(view)
          : view.dose
            ? escapeAlertHtml(expandFrequencyInText(view.dose))
            : "";
      return `
      <li class="e-med">
        <div class="tl-med-name-row">
          <strong>${escapeAlertHtml(name)}</strong>
          <button
            type="button"
            class="tl-drug-notes-btn"
            data-drug-notes-toggle
            aria-expanded="false"
            aria-controls="${notesId}"
          >${t("timelineDrugNotesBtn")}</button>
        </div>
        <span class="e-med-dose">${formatMedDose(view)}</span>
        <span class="e-med-course">${course}</span>
        ${renderTimelineDrugNotes(view, notesId)}
        <p class="e-med-detail-hint">${t("emergencyMedDetailHint")}</p>
      </li>`;
    })
    .join("");
}

function paintEmergencyIdentity(pet) {
  eName.textContent = pet.name;
  eSub.textContent = t("eSub", {
    species: speciesLabelOf(pet),
    breed: breedLabelOf(pet),
    gender: genderLabelOf(pet),
    age: ageLabelOf(pet),
  });
  paintEmergencyBirth(pet);
  paintEmergencyChip(pet);
}

function paintEmergencyBirth(pet) {
  if (!eBirthLine) return;
  const birth = String(pet?.birthDate || "").trim();
  if (!birth) {
    eBirthLine.hidden = true;
    eBirthLine.textContent = "";
    return;
  }
  eBirthLine.hidden = false;
  eBirthLine.textContent = t("eBirthLine", { birth });
}

function paintEmergencyChip(pet) {
  if (!eChipLine) return;
  const chip = String(pet?.chipNumber || "").trim() || t("eChipEmpty");
  eChipLine.textContent = t("eChipLine", { chip });
}

function paintEmergencyCardDegradedShell() {
  const alertsBlock = eAlerts?.closest(".e-alerts");
  alertsBlock?.classList.remove("is-critical", "is-caution");
  alertsBlock?.classList.add("is-degraded");
  if (eAlerts) {
    eAlerts.innerHTML = `<li class="is-degraded">${t("emergencyDegradedAlerts")}</li>`;
  }
  if (eMeds) {
    eMeds.innerHTML = `<li class="is-degraded">${t("emergencyDegradedMeds")}</li>`;
  }
  if (eWeight) {
    eWeight.textContent = t("emergencyDegradedWeight");
  }
}

/** Local fallback when PetLive / emergency module is unavailable. */
function renderEmergencyCardLocal(pet) {
  paintEmergencyIdentity(pet);
  eWeight.innerHTML = t("eWeight", {
    weight: pet.weight,
    date: pet.weightDate,
  });
  const alerts = getAlertsForPet(pet);
  syncAlertNavTone(alerts);
  const alertsBlock = eAlerts?.closest(".e-alerts");
  alertsBlock?.classList.remove("is-degraded");
  renderEmergencyAlertsList(alerts);
  renderEmergencyMeds(pet);
  renderEmergencyOwner();
  renderEmergencyPetPhoto(pet);
}

/**
 * Prefer modules/emergency-card composition (building-block).
 * Snapshot keeps prototype pets[] as source of truth; injectFail demos degrade.
 */
function renderEmergencyCard(pet) {
  const generate = window.PetLive?.emergency?.generateEmergencyCard;
  if (typeof generate !== "function") {
    renderEmergencyCardLocal(pet);
    return;
  }

  const profile = loadOwnerProfile();
  const snapshot = buildEmergencySnapshot(pet);
  const injectFail =
    typeof window.PetLive.readInjectFail === "function"
      ? window.PetLive.readInjectFail()
      : {};

  const result = window.PetLive.call(
    () =>
      generate(
        pet.id,
        {
          name: profile.name || "",
          phone: profile.phone || "",
        },
        undefined,
        { snapshot, injectFail }
      ),
    null
  );

  if (!result) {
    renderEmergencyCardLocal(pet);
    return;
  }

  const cardPet = result.pet || pet;
  paintEmergencyIdentity(pet);
  if (cardPet.name) eName.textContent = cardPet.name || pet.name;

  const degraded = result._degraded || {};
  const alertsBlock = eAlerts?.closest(".e-alerts");

  if (degraded.weight) {
    eWeight.textContent = t("emergencyDegradedWeight");
  } else if (result.latestWeight && result.latestWeight.weight != null) {
    eWeight.innerHTML = t("eWeight", {
      weight: result.latestWeight.weight,
      date: result.latestWeight.recordedDate || pet.weightDate || "—",
    });
  } else {
    eWeight.innerHTML = t("eWeight", {
      weight: pet.weight,
      date: pet.weightDate,
    });
  }

  // Nav tone from local truth; section chrome clears severity when alerts degraded.
  syncAlertNavTone(getAlertsForPet(pet));

  if (degraded.alerts) {
    alertsBlock?.classList.remove("is-critical", "is-caution");
    alertsBlock?.classList.add("is-degraded");
    eAlerts.innerHTML = `<li class="is-degraded">${t("emergencyDegradedAlerts")}</li>`;
  } else {
    alertsBlock?.classList.remove("is-degraded");
    renderEmergencyAlertsList(result.alerts || []);
  }

  if (degraded.medications) {
    eMeds.innerHTML = `<li class="is-degraded">${t("emergencyDegradedMeds")}</li>`;
  } else {
    renderEmergencyMedsFromList(result.currentMedications || []);
  }

  renderEmergencyOwner();
  renderEmergencyPetPhoto(pet);
}

function applySelectedPet() {
  latestRxUserCollapsed = false;
  renderCoordinator.refreshSelection();
  schedulePetsGraphPersist();
}

const renderCoordinator = PetLiveWeb.shell.createRenderCoordinator({
  safeRender,
  getCurrentPet,
  getActiveScreen: () =>
    app.querySelector(".screen.is-active")?.dataset.screen || "home",
});

renderCoordinator.register("home", "petPicker", () => {
  if (petPickerNeedsRebuild()) renderPetPicker();
  else syncPetPickerSelection();
});
renderCoordinator.register("home", "petHeader", (pet) => {
  renderPetHeader(pet);
});
renderCoordinator.register("home", "parasiteStrip", (pet) => {
  if (pet) renderParasiteStrip(pet);
  else paintParasiteStripEmpty();
});
renderCoordinator.register(
  "home",
  "alertBadge",
  (pet) => {
    if (pet) renderAlertBadge(pet);
    else if (alertCountBtn) alertCountBtn.textContent = t("noAlerts");
  },
  () => {
    if (alertCountBtn) alertCountBtn.textContent = t("noAlerts");
  }
);
renderCoordinator.register(
  "emergency",
  "emergencyCard",
  (pet) => {
    if (pet) renderEmergencyCard(pet);
  },
  paintEmergencyCardDegradedShell
);
renderCoordinator.register("emergency", "emergencyVaccineNav", (pet) => {
  if (pet) renderEmergencyVaccineNav(pet);
});
renderCoordinator.register("emergency", "emergencyLabNav", (pet) => {
  if (pet) renderEmergencyLabNav(pet);
});
renderCoordinator.register("emergency", "emergencyImagingNav", (pet) => {
  if (pet) renderEmergencyImagingNav(pet);
});
renderCoordinator.register(
  "labs",
  "labList",
  (pet) => {
    if (pet) renderLabList(pet);
  },
  () => {
    const list = document.getElementById("lab-list");
    if (list) {
      list.innerHTML = `<li class="lab-list-empty">${t("labEmpty")}</li>`;
    }
  }
);
renderCoordinator.register(
  "imaging",
  "imagingList",
  (pet) => {
    if (pet) renderImagingList(pet);
  },
  () => {
    const list = document.getElementById("imaging-list");
    if (list) {
      list.innerHTML = `<li class="imaging-list-empty"><p>${t(
        "imagingEmpty"
      )}</p></li>`;
    }
  }
);
renderCoordinator.register("lab-add", "labAddForm", (pet) => {
  if (pet) ensureLabAddForPet(pet);
});
renderCoordinator.register(
  "timeline",
  "timeline",
  (pet) => {
    if (pet) renderTimeline(pet);
  },
  () => {
    timelineList.innerHTML = `<li class="tl-item"><div class="tl-body"><p class="tl-note">${t(
      "noVisits"
    )}</p></div></li>`;
  }
);
renderCoordinator.register(
  "alerts",
  "alerts",
  (pet) => {
    if (pet) renderAlerts(pet);
  },
  () => {
    if (alertSections) {
      alertSections.innerHTML = `<p class="alert-section-empty">${t("noAlertItems")}</p>`;
    } else if (alertList) {
      alertList.innerHTML = `<li class="alert-item"><p class="alert-desc">${t(
        "noAlertItems"
      )}</p></li>`;
    }
  }
);
renderCoordinator.register("vaccines", "vaccineForm", (pet) => {
  if (pet) refreshVaccineForm(pet);
});
renderCoordinator.register(
  "vaccines",
  "vaccines",
  (pet) => {
    if (pet) renderVaccineList(pet);
  },
  () => {
    vaccineList.innerHTML = `<li class="vaccine-empty">${t("noVaccines")}</li>`;
  }
);
renderCoordinator.register("archive", "archiveList", () => renderArchiveList());

const PET_TONES = [
  "linear-gradient(160deg, #7fafa0, #355f54)",
  "linear-gradient(160deg, #5c6b74, #243039)",
  "linear-gradient(160deg, #d4a06a, #8a5a2b)",
  "linear-gradient(160deg, #8aa6c1, #3a5166)",
  "linear-gradient(160deg, #c4a0b0, #6b4558)",
  "linear-gradient(160deg, #9bb87a, #4a6435)",
];

function formatAgeLabel(birthDate) {
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return t("ageUnknown");
  if (years === 0) {
    return months <= 0 ? t("ageUnderMonth") : t("ageMonths", { n: months });
  }
  if (months === 0) return t("ageYears", { n: years });
  return t("ageYearsMonths", { y: years, m: months });
}

function formatGenderLabel(gender, isNeutered) {
  const genderText = t(gender) || t("unknown");
  if (isNeutered === "yes") return t("genderNeutered", { g: genderText });
  if (isNeutered === "no") return t("genderNotNeutered", { g: genderText });
  return t("genderNeuterUnknown", { g: genderText });
}

function toggleBreedCustomField() {
  const speciesEl = document.getElementById("pet-species");
  const breedSelectField = document.getElementById("breed-select-field");
  const breedSearchField = document.getElementById("breed-search-field");
  const breedSelect = document.getElementById("breed-select");
  const breedSearch = document.getElementById("breed-search");
  const breedExpandToggle = document.getElementById("breed-expand-toggle");
  if (!speciesEl || !breedSelect || !breedSearch) return;

  if (speciesEl.value === "other") {
    if (breedSelectField) breedSelectField.hidden = true;
    if (breedSearchField) breedSearchField.hidden = false;
    breedSearch.required = true;
    if (breedExpandToggle) breedExpandToggle.hidden = true;
    hideBreedResults();
    return;
  }

  const showCustom = breedSelect.value === BREED_CUSTOM_VALUE;
  if (breedSelectField) breedSelectField.hidden = false;
  if (breedSearchField) breedSearchField.hidden = false;
  breedSearch.required = showCustom;
  if (breedExpandToggle) breedExpandToggle.hidden = false;
}

/** Default collapsed; reset on species change. */
let breedChipsExpanded = false;
let suppressBreedSearchInput = false;
let breedResultsBlurTimer = 0;

function hideBreedResults() {
  const breedResults = document.getElementById("breed-results");
  if (!breedResults) return;
  breedResults.hidden = true;
  breedResults.innerHTML = "";
}

function updateBreedSearchFace(value) {
  const breedSearch = document.getElementById("breed-search");
  if (!breedSearch) return;
  const speciesEl = document.getElementById("pet-species");
  const species = speciesEl ? speciesEl.value : "";

  suppressBreedSearchInput = true;
  if (value && value !== BREED_CUSTOM_VALUE) {
    const breed = findBreedByValue(species, value);
    breedSearch.value = breed ? breedOptionLabel(breed) : "";
  }
  // Custom / empty: leave typed text (caller may set value explicitly).
  suppressBreedSearchInput = false;
}

function renderBreedResults(list, query) {
  const breedResults = document.getElementById("breed-results");
  if (!breedResults) return;
  const q = String(query || "").trim();
  if (!q) {
    hideBreedResults();
    return;
  }

  if (!list.length) {
    breedResults.hidden = false;
    breedResults.innerHTML = `
      <li>
        <p class="breed-results-empty">${
          typeof t === "function" ? t("breedSearchEmpty") : ""
        }</p>
      </li>`;
    return;
  }

  breedResults.hidden = false;
  breedResults.innerHTML = list
    .map(
      (breed) => `
      <li>
        <button type="button" data-breed-suggest="${breed.value}">
          <strong>${breedOptionLabel(breed)}</strong>
        </button>
      </li>`
    )
    .join("");
}

function breedChipButtonHtml(breed) {
  return `
      <button
        type="button"
        class="chip"
        role="option"
        data-breed="${breed.value}"
        aria-selected="false"
      >${breedOptionLabel(breed)}</button>`;
}

function updateBreedExpandToggle() {
  const toggle = document.getElementById("breed-expand-toggle");
  if (!toggle) return;
  const speciesEl = document.getElementById("pet-species");
  const species = speciesEl ? speciesEl.value : "";
  const show = species === "dog" || species === "cat";
  toggle.hidden = !show;
  toggle.setAttribute("aria-expanded", breedChipsExpanded ? "true" : "false");
  const label = toggle.querySelector("[data-i18n]") || toggle;
  const key = breedChipsExpanded ? "breedCollapse" : "breedExpandAll";
  label.setAttribute("data-i18n", key);
  label.textContent = typeof t === "function" ? t(key) : label.textContent;
}

function renderCollapsedBreedChips(species, selectedValue) {
  const groups = getBreedGroupsForSpecies(species);
  const commonId = getCommonBreedGroupId(species);
  const commonGroup = groups.find((g) => g.id === commonId);
  const seen = new Set();
  const chips = [];

  const pushValue = (value) => {
    if (!value || seen.has(value)) return;
    const breed = findBreedByValue(species, value);
    if (!breed) return;
    seen.add(value);
    chips.push(breedChipButtonHtml(breed));
  };

  if (commonGroup) {
    commonGroup.members.forEach(pushValue);
  }
  if (
    selectedValue &&
    selectedValue !== BREED_CUSTOM_VALUE &&
    !(commonGroup && commonGroup.members.includes(selectedValue))
  ) {
    pushValue(selectedValue);
  }
  pushValue(BREED_CUSTOM_VALUE);

  return chips.join("");
}

function renderExpandedBreedChips(species) {
  const groups = getBreedGroupsForSpecies(species);
  return groups
    .map((group) => {
      const label =
        typeof t === "function" ? t(group.i18nKey) : group.id;
      const chips = group.members
        .map((value) => findBreedByValue(species, value))
        .filter(Boolean)
        .map(breedChipButtonHtml)
        .join("");
      return `
      <div class="breed-group" data-breed-group="${group.id}">
        <div class="breed-group-label">${label}</div>
        <div class="breed-group-chips">${chips}</div>
      </div>`;
    })
    .join("");
}

function setSelectedBreed(value) {
  const breedSelect = document.getElementById("breed-select");
  const breedChips = document.getElementById("breed-chips");
  if (!breedSelect || !breedChips) return;

  breedSelect.value = value || "";

  // Collapsed preview = common ∪ current selected ∪ __custom__ (deduped).
  // Rebuild on every selection change so a previously pinned non-common chip
  // is dropped when the user picks another visible chip (QA-001).
  if (!breedChipsExpanded && typeof getBreedGroupsForSpecies === "function") {
    const speciesEl = document.getElementById("pet-species");
    const species = speciesEl ? speciesEl.value : "";
    if (species && species !== "other") {
      breedChips.innerHTML = renderCollapsedBreedChips(species, value || "");
      breedChips.classList.add("is-collapsed");
      breedChips.classList.remove("is-expanded");
    }
  }

  breedChips.querySelectorAll(".chip").forEach((chip) => {
    const on = chip.dataset.breed === value;
    chip.classList.toggle("is-on", on);
    chip.setAttribute("aria-selected", on ? "true" : "false");
  });
  updateBreedSearchFace(value);
  toggleBreedCustomField();
}

function syncBreedFields({ keepSelection = true, resetExpanded = false } = {}) {
  const speciesEl = document.getElementById("pet-species");
  const breedSelect = document.getElementById("breed-select");
  const breedSearch = document.getElementById("breed-search");
  const breedChips = document.getElementById("breed-chips");
  if (!speciesEl || !breedSelect || !breedSearch || !breedChips) return;

  if (typeof getBreedListForSpecies !== "function") {
    breedChips.innerHTML =
      "<p class='field-hint'>品種清單載入失敗，請重新整理頁面</p>";
    return;
  }

  if (resetExpanded) breedChipsExpanded = false;

  const species = speciesEl.value;
  const list = getBreedListForSpecies(species);
  const previous = keepSelection ? breedSelect.value : "";

  if (species === "other") {
    breedChips.innerHTML = "";
    breedChips.classList.remove("is-expanded", "is-collapsed");
    breedSelect.value = BREED_CUSTOM_VALUE;
    hideBreedResults();
    updateBreedExpandToggle();
    toggleBreedCustomField();
    return;
  }

  const stillValid = list.some((breed) => breed.value === previous);
  const selectedValue = stillValid ? previous : "";

  if (breedChipsExpanded && typeof getBreedGroupsForSpecies === "function") {
    breedChips.innerHTML = renderExpandedBreedChips(species);
    breedChips.classList.add("is-expanded");
    breedChips.classList.remove("is-collapsed");
  } else if (typeof getBreedGroupsForSpecies === "function") {
    breedChips.innerHTML = renderCollapsedBreedChips(species, selectedValue);
    breedChips.classList.add("is-collapsed");
    breedChips.classList.remove("is-expanded");
  } else {
    breedChips.innerHTML = list.map(breedChipButtonHtml).join("");
    breedChips.classList.remove("is-expanded", "is-collapsed");
  }

  setSelectedBreed(selectedValue);
  updateBreedExpandToggle();
}

function resolveBreedFromForm(form) {
  const species = form.species.value;
  const selectedValue = form.breedSelect.value;
  if (species === "other" || selectedValue === BREED_CUSTOM_VALUE) {
    return form.breedCustom.value.trim();
  }
  const list = getBreedListForSpecies(species);
  const selected = list.find((breed) => breed.value === selectedValue);
  return selected ? breedOptionLabel(selected) : "";
}

function resolveBreedKeyFromForm(form) {
  const species = form.species.value;
  if (species === "other") return BREED_CUSTOM_VALUE;
  return form.breedSelect.value || BREED_CUSTOM_VALUE;
}

function readPetIdentityFromForm(form) {
  const name = form.petName.value.trim();
  const species = form.species.value;
  const breedKey = resolveBreedKeyFromForm(form);
  const breed = resolveBreedFromForm(form);
  const gender = form.gender.value;
  const isNeutered = form.isNeutered.value;
  const birthDate = form.birthDate.value;
  const weight = Number(form.weight.value);
  const weightDate = form.weightDate.value;
  const chipNumber = form.chipNumber.value.trim();
  return {
    name,
    species,
    speciesLabel: t(species) || t("other"),
    breedKey,
    breed,
    gender,
    isNeutered,
    birthDate,
    weight,
    weightDate,
    chipNumber: chipNumber || undefined,
  };
}

/** Keep visible date faces in sync; native type=date stays for iOS picker + form values. */
function syncDateProxies(root = document) {
  root.querySelectorAll(".date-proxy").forEach((proxy) => {
    const native = proxy.querySelector("input.date-proxy-native, input[type='date']");
    const face = proxy.querySelector("input.date-proxy-face");
    if (!native || !face) return;
    const sync = () => {
      face.value = native.value || "";
    };
    if (proxy.dataset.proxyBound !== "1") {
      native.addEventListener("input", sync);
      native.addEventListener("change", sync);
      proxy.dataset.proxyBound = "1";
    }
    sync();
  });
}

function createPetFromForm(form) {
  return {
    id: `p${Date.now()}`,
    ...readPetIdentityFromForm(form),
    tone: PET_TONES[pets.length % PET_TONES.length],
    alertCount: 0,
    alerts: [],
    meds: [],
    visits: [],
    vaccines: [],
    parasitePrevention: {
      external: null,
      heartworm: null,
    },
  };
}

let editingPetId = null;

function paintPetFormMode() {
  const title = document.getElementById("pet-form-title");
  const sub = document.getElementById("pet-form-sub");
  const submit = document.getElementById("pet-form-submit");
  const screen = document.querySelector('[data-screen="add-pet"]');
  const editing = Boolean(editingPetId);
  if (title) title.textContent = t(editing ? "editPetTitle" : "addPetTitle");
  if (sub) sub.textContent = t(editing ? "editPetSub" : "addPetSub");
  if (submit) submit.textContent = t(editing ? "savePet" : "createPet");
  if (screen) {
    const ariaKey = editing ? "editPetTitle" : "addPetTitle";
    screen.setAttribute("aria-label", t(ariaKey));
  }
}

function fillPetFormFromPet(pet) {
  const form = document.getElementById("pet-form");
  if (!form || !pet) return;
  form.petName.value = pet.name || "";
  form.species.value = pet.species || "dog";
  form.gender.value = pet.gender || "unknown";
  form.isNeutered.value = pet.isNeutered || "unknown";
  form.birthDate.value = pet.birthDate || "";
  form.weight.value = pet.weight ?? "";
  form.weightDate.value = pet.weightDate || todayISODate();
  form.chipNumber.value = pet.chipNumber || "";
  syncDateProxies(form);
  syncBreedFields({ keepSelection: false, resetExpanded: true });
  const breedKey = pet.breedKey || "";
  if (pet.species === "other" || breedKey === BREED_CUSTOM_VALUE) {
    setSelectedBreed(BREED_CUSTOM_VALUE);
    form.breedCustom.value = pet.breed || "";
  } else {
    setSelectedBreed(breedKey);
    if (!form.breedSelect.value && pet.breed) {
      setSelectedBreed(BREED_CUSTOM_VALUE);
      form.breedCustom.value = pet.breed;
    }
  }
}

function applyPetFromForm(pet, form) {
  Object.assign(pet, readPetIdentityFromForm(form));
}

function openCreatePetForm() {
  editingPetId = null;
  const form = document.getElementById("pet-form");
  form.reset();
  form.weightDate.value = todayISODate();
  form.birthDate.value = "";
  syncDateProxies(form);
  syncBreedFields({ keepSelection: false, resetExpanded: true });
  paintPetFormMode();
  go("add-pet");
}

function openEditCurrentPet() {
  const pet = getCurrentPet();
  if (!pet) return;
  editingPetId = pet.id;
  fillPetFormFromPet(pet);
  paintPetFormMode();
  go("add-pet");
}

function selectPet(petId) {
  return petsController.select(petId);
  // No toast on switch — selection chrome is enough; toast felt like lag on phone.
}

function selectPetForced(petId) {
  return petsController.selectForced(petId);
}

const petSelectionPaintSamples = [];
let petSelectionStartedAt = null;
const petsController = PetLiveWeb.domains.pets.createController({
  state: appState,
  beforeSelect: () => {
    resetAlertForm();
    petSelectionStartedAt =
      typeof performance !== "undefined" ? performance.now() : null;
  },
  afterSelect: (pet) => {
    currentPetId = pet?.id || appState.getCurrentPetId();
    // Drop in-flight med session so Pet A pending / complete-drugs cannot write onto Pet B.
    pendingMeds = [];
    completingVisitRef = null;
    Object.keys(compoundColorByGroup).forEach((key) => {
      delete compoundColorByGroup[key];
    });
    applySelectedPet();
    if (typeof renderPendingMeds === "function") renderPendingMeds();
    if (typeof updateMedModeHint === "function") updateMedModeHint();
    if (petSelectionStartedAt != null) {
      const startedAt = petSelectionStartedAt;
      requestAnimationFrame(() => {
        petSelectionPaintSamples.push(performance.now() - startedAt);
        if (petSelectionPaintSamples.length > 100) {
          petSelectionPaintSamples.shift();
        }
      });
    }
  },
});

const visitsController = PetLiveWeb.domains.visits.createController({
  clinicLabelOf: (visit) => visitClinicLabel(visit),
});
const timelineSelectors = PetLiveWeb.domains.timeline.createSelectors({
  visits: visitsController,
});
const medicationsSelectors = PetLiveWeb.domains.medications.createSelectors({
  formatFrequencyLabelOf: formatFrequencyLabel,
  formatDosageUnitLabelOf: formatDosageUnitLabel,
  durationDaysLabelOf: (n) => t("durationDaysCount", { n }),
  pendingDoseLabelOf: () => t("medDetailsPending"),
  formatShortDateOf: formatShortDate,
  getMedEndDate,
  medCourseOf: ({ start, days, end }) => t("medCourse", { start, days, end }),
  expandFrequencyInTextOf: expandFrequencyInText,
});
const medicationsController = PetLiveWeb.domains.medications.createController({
  visits: visitsController,
  searchDrugs: (query) => {
    if (window.PetLive?.drug?.searchDrugs) {
      const result = window.PetLive.drug.searchDrugs(query);
      if (result && result.ok === false) {
        console.warn("[drug.searchDrugs]", result.error);
      }
      return result;
    }
    return null;
  },
  getDrugById: (id) => {
    if (window.PetLive?.drug?.getDrugById) {
      return window.PetLive.drug.getDrugById(id);
    }
    return null;
  },
  localDrugs: () => (typeof drugs !== "undefined" ? drugs : []),
  formatFrequencyLabelOf: formatFrequencyLabel,
  durationDaysLabelOf: (n) => t("durationDaysCount", { n }),
  compoundFormLabelOf: compoundFormLabel,
  formatDraftDoseLineOf: (draft) =>
    medicationsSelectors.formatDraftDoseLine(draft),
});
const IMAGING_PHOTOS_MAX = visitsController.IMAGING_PHOTOS_MAX;

const VIEWPORT_DEFAULT =
  "width=device-width, initial-scale=1, viewport-fit=cover";
const VIEWPORT_LOCKED =
  "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

function resetPageScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  if (window.visualViewport) {
    window.scrollTo(0, Math.max(0, window.visualViewport.offsetTop || 0));
  }
}

function resetPetPickerScroll() {
  if (!petPicker) return;
  const selected = currentPetId
    ? petPicker.querySelector(`.pet-option[data-pet-id="${currentPetId}"]`)
    : null;
  const addBtn = petPicker.querySelector("#add-pet-btn");
  if (selected) {
    let target =
      selected.offsetLeft -
      (petPicker.clientWidth - selected.offsetWidth) / 2;
    // Keep the trailing “+ 新增” card reachable (don’t scroll it fully away).
    if (addBtn) {
      const maxKeepAdd =
        addBtn.offsetLeft + addBtn.offsetWidth - petPicker.clientWidth + 12;
      if (maxKeepAdd > 0) target = Math.min(target, maxKeepAdd);
    }
    petPicker.scrollLeft = Math.max(0, target);
  } else {
    petPicker.scrollLeft = 0;
  }
}

/**
 * Every SPA screen change must land at the default page width (scale=1),
 * not the user's previous pinch-zoom. iOS/Android keep zoom across
 * show/hide screens; briefly locking the viewport meta forces a reset.
 * Zoom is re-enabled after so pinch still works on the new screen.
 */
function resetViewportZoom() {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    resetPageScroll();
    return;
  }

  meta.setAttribute("content", VIEWPORT_LOCKED);
  resetPageScroll();

  window.setTimeout(() => {
    meta.setAttribute("content", VIEWPORT_DEFAULT);
    resetPageScroll();
  }, 300);
}

const shellNavigation = PetLiveWeb.shell.createNavigation({
  app,
  beforeLeave: (currentScreen, nextScreen) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    closePetPhotoCrop();
    closeProofLightbox();
    setVaxHelpOpen(false);

    if (currentScreen === "timeline" && nextScreen !== "timeline") {
      latestRxUserCollapsed = false;
    }

    // Fresh visit flow should not inherit an abandoned pending Rx list.
    if (nextScreen === "add-visit" && currentScreen !== "add-med") {
      pendingMeds = [];
      clearLiveProofPhotos();
      completingVisitRef = null;
      clearMedDrugFields();
      renderPendingMeds();
      setMedEntryMode("photo");
    }
  },
  onEnter: (screen) => {
    renderCoordinator.flush(screen);
    if (screen === "home") {
      closeAppNavMenu();
      closeAccountMenu();
      resetPageScroll();
      resetPetPickerScroll();
    }
    if (screen === "parasite") {
      const pet = getCurrentPet();
      if (pet) safeRender("parasiteScreen", () => fillParasiteScreen(pet));
    }
    if (screen === "owner-settings") fillOwnerSettingsForm();
    if (screen === "manual") paintManualScreen();
  },
});

function go(screen, options = {}) {
  const needsPet = [
    "emergency",
    "add-visit",
    "timeline",
    "alerts",
    "vaccines",
    "parasite",
    "labs",
    "imaging",
    "add-med",
    "med-proof",
    "imaging-proof",
    "lab-add",
  ];
  if (!DEMO_MODE && needsPet.includes(screen) && !getCurrentPet()) {
    showToast(t("toastNeedPetFirst"));
    return false;
  }
  closeAppNavMenu();
  closeAccountMenu();
  const changed = shellNavigation.go(screen, options);
  if (!changed) return false;
  // Instant jump — smooth scroll made every screen change feel delayed on phone.
  resetPageScroll();
  resetViewportZoom();
  return true;
}

function goBack() {
  const active = app.querySelector(".screen.is-active")?.dataset.screen;
  if (active === "add-pet" && editingPetId) {
    editingPetId = null;
    paintPetFormMode();
  }
  const changed = shellNavigation.back();
  if (changed) {
    resetPageScroll();
    resetViewportZoom();
  }
  return changed;
}

function clearNavigationHistory() {
  shellNavigation.clearHistory();
}

function glassChromeActionsMarkup() {
  return `
    <div class="screen-head-actions" data-glass-chrome>
      <div class="app-nav-menu">
        <button
          class="app-nav-btn js-app-nav-btn"
          type="button"
          aria-expanded="false"
          aria-haspopup="true"
          aria-controls="app-nav-panel"
          data-i18n-aria="navMenuAria"
          aria-label="頁面選單"
        >
          <span class="app-nav-label app-nav-label-closed" aria-hidden="true">
            <span class="app-nav-flank">＝</span><span class="app-nav-word" data-i18n="navMenuLabel">選單</span><span class="app-nav-flank">＝</span>
          </span>
          <span class="app-nav-label app-nav-label-open" aria-hidden="true" hidden>
            <span class="app-nav-flank">×</span><span class="app-nav-word" data-i18n="navMenuLabel">選單</span><span class="app-nav-flank">×</span>
          </span>
        </button>
      </div>
      <div class="account-menu">
        <button
          class="account-chip js-account-chip"
          type="button"
          aria-expanded="false"
          aria-haspopup="true"
          aria-controls="account-popover"
          data-i18n-aria="accountChipAria"
          aria-label="帳號選單"
        >
          <img class="account-chip-avatar" alt="" width="28" height="28" hidden />
          <span class="account-chip-fallback" aria-hidden="true">?</span>
          <span class="account-chip-name"></span>
        </button>
      </div>
    </div>
  `;
}

function enhanceGlassScreenHeads() {
  document
    .querySelectorAll('[data-screen]:not([data-screen="home"]) > .screen-head')
    .forEach((head) => {
      if (head.querySelector("[data-glass-chrome]")) return;
      head.insertAdjacentHTML("beforeend", glassChromeActionsMarkup());
    });
}

function syncAppNavBtnIcons(open) {
  document.querySelectorAll(".js-app-nav-btn").forEach((btn) => {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    const closed = btn.querySelector(".app-nav-label-closed");
    const opened = btn.querySelector(".app-nav-label-open");
    if (closed) closed.hidden = !!open;
    if (opened) opened.hidden = !open;
  });
}

function closeAppNavMenu() {
  const panel = document.getElementById("app-nav-panel");
  if (panel) panel.hidden = true;
  syncAppNavBtnIcons(false);
}

function setAppNavMenuOpen(open, anchorBtn) {
  const panel = document.getElementById("app-nav-panel");
  if (!panel) return;
  panel.hidden = !open;
  syncAppNavBtnIcons(open);
  if (open && anchorBtn) {
    const rect = anchorBtn.getBoundingClientRect();
    panel.style.top = `${Math.max(rect.bottom + 10, 12)}px`;
    panel.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;
    panel.style.left = "auto";
    panel.style.marginRight = "0";
  }
}

function paintManualScreen() {
  const empty = !pets.length || isSeedOnlyPets(pets);
  const primary = document.getElementById("manual-cta-primary");
  const addAlt = document.getElementById("manual-cta-add-alt");
  if (primary) {
    primary.setAttribute("data-go", empty ? "add-pet" : "home");
    primary.setAttribute("data-i18n", empty ? "manualCtaAddPet" : "manualCtaHome");
    primary.textContent = t(empty ? "manualCtaAddPet" : "manualCtaHome");
  }
  if (addAlt) {
    // When account is empty, primary already goes to add-pet; offer home as alt.
    addAlt.setAttribute("data-go", empty ? "home" : "add-pet");
    addAlt.setAttribute("data-i18n", empty ? "manualCtaHome" : "manualCtaAddPet");
    addAlt.textContent = t(empty ? "manualCtaHome" : "manualCtaAddPet");
  }
}

function initAppNavMenu() {
  const panel = document.getElementById("app-nav-panel");
  if (!panel) return;

  document.addEventListener("click", (event) => {
    const btn = event.target.closest?.(".js-app-nav-btn");
    if (btn) {
      event.stopPropagation();
      const willOpen = panel.hidden;
      if (willOpen) closeAccountMenu();
      setAppNavMenuOpen(willOpen, btn);
      return;
    }
    if (panel.hidden) return;
    if (event.target.closest("#app-nav-panel")) return;
    closeAppNavMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (panel.hidden) return;
    closeAppNavMenu();
  });
}

document.querySelectorAll("[data-go]").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    if (event.target.closest(".e-vax-help, .e-vax-help-pop")) return;
    if (btn.dataset.parasiteKind) {
      pendingParasiteFocus = btn.dataset.parasiteKind;
    }
    go(btn.getAttribute("data-go"));
  });
  if (btn.id === "e-vaccine-btn") {
    btn.addEventListener("keydown", (event) => {
      if (event.target.closest?.(".e-vax-help")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      go(btn.getAttribute("data-go"));
    });
  }
});

function setVaxHelpOpen(open) {
  const helpBtn = document.getElementById("e-vax-help");
  const pop = document.getElementById("e-vax-help-pop");
  if (!helpBtn || !pop) return;
  pop.hidden = !open;
  helpBtn.setAttribute("aria-expanded", open ? "true" : "false");
}

document.getElementById("e-vax-help")?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  const pop = document.getElementById("e-vax-help-pop");
  setVaxHelpOpen(Boolean(pop?.hidden));
});

document.getElementById("e-vax-help-pop")?.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", (event) => {
  if (event.target.closest("#e-vax-help, #e-vax-help-pop")) return;
  setVaxHelpOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProofLightbox();
    setVaxHelpOpen(false);
  }
});

document.getElementById("proof-lightbox")?.addEventListener("click", (event) => {
  if (event.target.closest("[data-proof-lightbox-close]")) {
    closeProofLightbox();
  }
});

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", goBack);
});

petManageBtn.addEventListener("click", () => {
  setManageMode(!isManagingPets);
});

petAddBtn?.addEventListener("click", () => {
  if (isManagingPets) return;
  openCreatePetForm();
});

petPicker.addEventListener("click", (event) => {
  const archiveBtnOnPet = event.target.closest("[data-archive-pet-id]");
  if (archiveBtnOnPet) {
    event.preventDefault();
    event.stopPropagation();
    openArchivePetFlow(archiveBtnOnPet.dataset.archivePetId);
    return;
  }

  const removeBtn = event.target.closest("[data-remove-pet-id]");
  if (removeBtn) {
    event.preventDefault();
    event.stopPropagation();
    openRemovePetFlow(removeBtn.dataset.removePetId);
    return;
  }

  const addBtn = event.target.closest("#add-pet-btn");
  if (addBtn) {
    if (isManagingPets) return;
    openCreatePetForm();
    return;
  }

  if (isManagingPets) {
    showToast(t("toastManageMode"));
    return;
  }

  const option = event.target.closest("[data-pet-id]");
  if (!option) return;
  selectPet(option.dataset.petId);
});

document.getElementById("archive-pet-back").addEventListener("click", () => {
  cancelArchivePetFlow();
});

document.getElementById("archive-pet-cancel").addEventListener("click", () => {
  cancelArchivePetFlow();
});

document
  .getElementById("archive-pet-form")
  .addEventListener("submit", confirmArchivePet);

document.getElementById("remove-pet-back").addEventListener("click", () => {
  if (removeStep > 1) {
    setRemoveStep(removeStep - 1);
    return;
  }
  cancelRemovePetFlow();
});

document.querySelectorAll("[data-remove-cancel]").forEach((btn) => {
  btn.addEventListener("click", cancelRemovePetFlow);
});

document.querySelectorAll("[data-remove-prev]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (removeStep > 1) setRemoveStep(removeStep - 1);
  });
});

document.querySelectorAll("[data-remove-next]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (removeStep < 3) setRemoveStep(removeStep + 1);
  });
});

document
  .getElementById("remove-pet-confirm-input")
  .addEventListener("input", (event) => {
    const pet = getPendingRemovePet();
    const confirmBtn = document.getElementById("remove-pet-confirm-btn");
    confirmBtn.disabled = !pet || event.target.value.trim() !== pet.name;
  });

document
  .getElementById("remove-pet-confirm-btn")
  .addEventListener("click", confirmRemovePet);

petPicker.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const options = [...petPicker.querySelectorAll("[data-pet-id]")];
  const index = options.findIndex((el) => el.dataset.petId === currentPetId);
  if (index < 0) return;

  event.preventDefault();
  let nextIndex = index;
  if (event.key === "ArrowRight") nextIndex = Math.min(index + 1, options.length - 1);
  if (event.key === "ArrowLeft") nextIndex = Math.max(index - 1, 0);
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = options.length - 1;
  selectPet(options[nextIndex].dataset.petId);
  options[nextIndex].focus();
});

document.querySelectorAll("#symptom-chips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const tag = chip.dataset.tag;
    if (selectedTags.has(tag)) {
      selectedTags.delete(tag);
      chip.classList.remove("is-on");
    } else {
      selectedTags.add(tag);
      chip.classList.add("is-on");
    }
  });
});

document.querySelectorAll("#unit-chips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const unit = chip.dataset.unit || "unrecorded";
    // Always keep one selection; re-clicking a concrete unit returns to 未紀錄.
    if (chip.classList.contains("is-on") && unit !== "unrecorded") {
      setMedUnitChip("unrecorded");
      return;
    }
    setMedUnitChip(unit);
  });
});

document.querySelectorAll("#freq-chips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const freq = chip.dataset.freq || "unrecorded";
    if (chip.classList.contains("is-on") && freq !== "unrecorded") {
      setMedFreqChip("unrecorded");
      return;
    }
    setMedFreqChip(freq);
  });
});

document.querySelectorAll("#compound-chips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const next = chip.classList.contains("is-on") ? "" : chip.dataset.compound;
    setMedCompoundChip(next);
  });
});

document.getElementById("compound-color-swatches")?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-compound-color]");
  if (!btn) return;
  setMedCompoundColor(btn.dataset.compoundColor);
});

const drugSearch = document.getElementById("drug-search");
const drugResults = document.getElementById("drug-results");
const selectedDrugEl = document.getElementById("selected-drug");
const drugInfoCard = document.getElementById("drug-info-card");
const drugInfoPurpose = document.getElementById("drug-info-purpose");
const drugInfoSideEffects = document.getElementById("drug-info-side-effects");
const drugInfoPrecautions = document.getElementById("drug-info-precautions");
const clinicSearch = document.getElementById("clinic-search");
const clinicResults = document.getElementById("clinic-results");
const selectedClinicEl = document.getElementById("selected-clinic");
const clinicNameInput = document.getElementById("clinic-name");
const clinicAnonymousInput = document.getElementById("clinic-anonymous");

function searchClinics(query) {
  const q = query.trim().toLowerCase();
  const directory = getClinicDirectory();
  const anonymous = getAnonymousClinic();
  const rest = directory.filter((clinic) => clinic.id !== "anonymous");
  if (!q) return [anonymous, ...rest];
  const matched = rest.filter((clinic) => {
    const hay = `${clinic.name} ${clinic.note}`.toLowerCase();
    return hay.includes(q);
  });
  // Keep anonymous pinned while searching so the opt-out path stays visible.
  return [anonymous, ...matched];
}

function renderClinicResults(list) {
  if (!list.length) {
    clinicResults.hidden = true;
    clinicResults.innerHTML = "";
    return;
  }

  clinicResults.hidden = false;
  clinicResults.innerHTML = list
    .map(
      (clinic) => `
      <li>
        <button
          type="button"
          data-clinic-id="${clinic.id}"
          class="${clinic.anonymous ? "is-anonymous" : ""}"
        >
          <strong>${clinic.name}</strong>
          <small>${clinic.note}</small>
        </button>
      </li>`
    )
    .join("");
}

function setSelectedClinic(clinic) {
  selectedClinic = clinic;
  if (!clinic) {
    clinicNameInput.value = "";
    clinicAnonymousInput.value = "false";
    selectedClinicEl.hidden = true;
    selectedClinicEl.textContent = "";
    selectedClinicEl.classList.remove("is-anonymous");
    return;
  }

  const name = clinicNameOf(clinic);
  clinicSearch.value = name;
  clinicNameInput.value = name;
  clinicAnonymousInput.value = clinic.anonymous ? "true" : "false";
  selectedClinicEl.hidden = false;
  selectedClinicEl.classList.toggle("is-anonymous", clinic.anonymous);
  selectedClinicEl.textContent = clinic.anonymous
    ? t("selectedClinicAnon")
    : t("selectedClinic", { name });
  clinicResults.hidden = true;
}

clinicSearch.addEventListener("focus", () => {
  renderClinicResults(searchClinics(clinicSearch.value));
});

clinicSearch.addEventListener("input", () => {
  const query = clinicSearch.value;
  selectedClinic = null;
  clinicNameInput.value = "";
  clinicAnonymousInput.value = "false";
  selectedClinicEl.hidden = true;
  selectedClinicEl.classList.remove("is-anonymous");
  renderClinicResults(searchClinics(query));
});

clinicResults.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-clinic-id]");
  if (!btn) return;
  const clinic = getClinicDirectory().find((item) => item.id === btn.dataset.clinicId);
  if (!clinic) return;
  setSelectedClinic(clinic);
});

function searchDrugs(query) {
  return medicationsController.searchDrugs(query);
}

/** Prefer the enriched local seed so side effects / precautions always show. */
function resolveEnrichedDrug(drugOrId) {
  return medicationsController.resolveEnrichedDrug(drugOrId);
}

function renderDrugInfoCard(drug) {
  if (!drugInfoCard) return;
  const full = drug ? resolveEnrichedDrug(drug) : null;
  if (!full) {
    drugInfoCard.hidden = true;
    if (drugInfoPurpose) drugInfoPurpose.textContent = "";
    if (drugInfoSideEffects) drugInfoSideEffects.innerHTML = "";
    if (drugInfoPrecautions) drugInfoPrecautions.innerHTML = "";
    return;
  }

  const sides = full.commonSideEffects || [];
  const precautions = full.precautions || [];
  drugInfoPurpose.textContent = `${full.drugClass}｜${full.purpose || ""}`;
  drugInfoSideEffects.innerHTML = sides.length
    ? sides.map((item) => `<li>${item}</li>`).join("")
    : `<li>${t("drugInfoUnavailable")}</li>`;
  drugInfoPrecautions.innerHTML = precautions.length
    ? precautions.map((item) => `<li>${item}</li>`).join("")
    : `<li>${t("drugInfoUnavailable")}</li>`;
  drugInfoCard.hidden = false;
  drugInfoCard.removeAttribute("hidden");
  drugInfoCard.classList.add("is-visible");
  requestAnimationFrame(() => {
    drugInfoCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function renderDrugResults(list) {
  if (!list.length) {
    drugResults.hidden = true;
    drugResults.innerHTML = "";
    return;
  }

  drugResults.hidden = false;
  drugResults.innerHTML = list
    .map(
      (drug) => `
      <li>
        <button type="button" data-drug-id="${drug.id}">
          <strong>${drug.genericName}${drug.brandNameZh ? `（${drug.brandNameZh}）` : ""}</strong>
          <small>${drug.drugClass} · ${drug.purpose || ""}</small>
        </button>
      </li>`
    )
    .join("");
}

let suppressDrugSearchInput = false;

drugSearch.addEventListener("input", () => {
  if (suppressDrugSearchInput) return;
  selectedDrug = null;
  selectedDrugEl.hidden = true;
  renderDrugInfoCard(null);
  renderDrugResults(searchDrugs(drugSearch.value));
});

drugResults.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-drug-id]");
  if (!btn) return;
  selectedDrug = resolveEnrichedDrug(btn.dataset.drugId);
  if (!selectedDrug && window.PetLive?.drug?.getDrugById) {
    const result = window.PetLive.drug.getDrugById(btn.dataset.drugId);
    if (result?.ok) selectedDrug = resolveEnrichedDrug(result.data) || result.data;
  }
  if (!selectedDrug) return;
  drugResults.hidden = true;
  suppressDrugSearchInput = true;
  drugSearch.value = selectedDrug.genericName;
  suppressDrugSearchInput = false;
  selectedDrugEl.hidden = false;
  selectedDrugEl.textContent = t("selectedDrug", {
    name: `${selectedDrug.genericName}${
      selectedDrug.brandNameZh ? ` / ${selectedDrug.brandNameZh}` : ""
    }`,
  });
  // Stay on manual entry so the safety card is visible
  if (medEntryMode !== "manual") setMedEntryMode("manual");
  renderDrugInfoCard(selectedDrug);
});

document.getElementById("visit-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!selectedClinic && !clinicNameInput.value.trim()) {
    showToast(t("toastPickClinic"));
    renderClinicResults(searchClinics(clinicSearch.value));
    clinicSearch.focus();
    return;
  }
  if (!selectedClinic && clinicSearch.value.trim()) {
    showToast(t("toastPickClinicList"));
    renderClinicResults(searchClinics(clinicSearch.value));
    return;
  }
  if (selectedTags.size === 0) {
    showToast(t("toastNeedSymptom"));
    return;
  }
  // Keep pending meds when returning from add-med → visit → next again.
  // Only reset when starting a brand-new med entry from an empty list.
  if (!pendingMeds.length) {
    clearMedDrugFields();
    clearLiveProofPhotos();
    setMedEntryMode("photo");
  }
  completingVisitRef = null;
  go("add-med");
});

document.getElementById("pet-species").addEventListener("change", () => {
  const search = document.getElementById("breed-search");
  if (search) {
    suppressBreedSearchInput = true;
    search.value = "";
    suppressBreedSearchInput = false;
  }
  hideBreedResults();
  syncBreedFields({ keepSelection: false, resetExpanded: true });
});

document.getElementById("breed-chips").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-breed]");
  if (!chip) return;
  const value = chip.dataset.breed;
  const breedSelect = document.getElementById("breed-select");
  const previous = breedSelect ? breedSelect.value : "";
  setSelectedBreed(value);
  hideBreedResults();
  if (value === BREED_CUSTOM_VALUE) {
    const search = document.getElementById("breed-search");
    if (search) {
      if (previous && previous !== BREED_CUSTOM_VALUE) {
        suppressBreedSearchInput = true;
        search.value = "";
        suppressBreedSearchInput = false;
      }
      search.focus();
    }
  }
});

document.getElementById("breed-expand-toggle")?.addEventListener("click", () => {
  breedChipsExpanded = !breedChipsExpanded;
  syncBreedFields({ keepSelection: true });
});

(() => {
  const breedSearch = document.getElementById("breed-search");
  const breedResults = document.getElementById("breed-results");
  if (!breedSearch || !breedResults) return;

  breedSearch.addEventListener("input", () => {
    if (suppressBreedSearchInput) return;
    const speciesEl = document.getElementById("pet-species");
    const species = speciesEl ? speciesEl.value : "";
    // Free text without clicking a suggestion → custom path (no silent coerce).
    setSelectedBreed(BREED_CUSTOM_VALUE);
    if (species === "other" || typeof searchBreeds !== "function") {
      hideBreedResults();
      return;
    }
    renderBreedResults(searchBreeds(breedSearch.value, species), breedSearch.value);
  });

  breedSearch.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideBreedResults();
      breedSearch.blur();
    }
  });

  breedSearch.addEventListener("blur", () => {
    window.clearTimeout(breedResultsBlurTimer);
    breedResultsBlurTimer = window.setTimeout(() => {
      hideBreedResults();
    }, 180);
  });

  breedSearch.addEventListener("focus", () => {
    window.clearTimeout(breedResultsBlurTimer);
    const speciesEl = document.getElementById("pet-species");
    const species = speciesEl ? speciesEl.value : "";
    if (species === "other" || typeof searchBreeds !== "function") return;
    const q = breedSearch.value.trim();
    if (!q) return;
    const breedSelect = document.getElementById("breed-select");
    // Only reopen suggestions while on the free-text / custom path.
    if (breedSelect && breedSelect.value === BREED_CUSTOM_VALUE) {
      renderBreedResults(searchBreeds(q, species), q);
    }
  });

  function commitBreedSuggestion(btn) {
    const value = btn?.dataset?.breedSuggest;
    if (!value) return;
    window.clearTimeout(breedResultsBlurTimer);
    setSelectedBreed(value);
    hideBreedResults();
  }

  // pointerdown (not only mousedown): on touch, blur schedules hide at 180ms and
  // can clear the list before the delayed synthetic click, leaving __custom__.
  breedResults.addEventListener("pointerdown", (event) => {
    const btn = event.target.closest("[data-breed-suggest]");
    if (!btn) return;
    event.preventDefault();
    commitBreedSuggestion(btn);
  });

  breedResults.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-breed-suggest]");
    if (!btn) return;
    // Keyboard activation / fallback if pointerdown did not commit.
    commitBreedSuggestion(btn);
  });
})();

document.getElementById("pet-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.petName.value.trim();
  const breed = resolveBreedFromForm(form);
  const weight = Number(form.weight.value);

  if (!name) {
    showToast(t("toastNeedPetName"));
    return;
  }
  if (!breed) {
    showToast(t("toastNeedBreed"));
    return;
  }
  if (!(weight > 0)) {
    showToast(t("toastWeight"));
    return;
  }
  if (!form.birthDate.value) {
    showToast(t("toastNeedBirth"));
    return;
  }
  if (form.birthDate.value > todayISODate()) {
    showToast(t("toastBirthFuture"));
    return;
  }
  if (!form.weightDate.value) {
    showToast(t("toastNeedWeightDate"));
    return;
  }

  const pet = createPetFromForm(form);
  if (editingPetId) {
    const current = pets.find((item) => item.id === editingPetId);
    if (!current) {
      editingPetId = null;
      paintPetFormMode();
      showToast(t("toastNeedPetName"));
      return;
    }
    applyPetFromForm(current, form);
    editingPetId = null;
    paintPetFormMode();
    selectPetForced(current.id);
    showToast(t("toastPetUpdated", { name: current.name }));
    go("emergency");
    return;
  }

  pets.push(pet);
  selectPetForced(pet.id);
  showToast(t("toastPetAdded", { name: pet.name }));
  clearNavigationHistory();
  go("home", { replace: true });
});

function setMedUnitChip(unit) {
  const next = unit || "unrecorded";
  const input = document.getElementById("dosage-unit");
  if (input) input.value = next;
  document.querySelectorAll("#unit-chips .chip").forEach((chip) => {
    chip.classList.toggle("is-on", chip.dataset.unit === next);
  });
}

function formatDosageUnitLabel(unit) {
  const value = (unit || "").trim();
  if (!value || value === "unrecorded") return "";
  if (value === "unknown") return t("unitUnknown");
  return value;
}

function normalizeMedUnitForStore(unit) {
  return medicationsController.normalizeMedUnitForStore(unit);
}

function normalizeMedFreqForStore(frequency) {
  return medicationsController.normalizeMedFreqForStore(frequency);
}

function setMedFreqChip(frequency) {
  const next = frequency || "unrecorded";
  const input = document.getElementById("med-frequency");
  if (input) input.value = next;
  document.querySelectorAll("#freq-chips .chip").forEach((chip) => {
    chip.classList.toggle("is-on", chip.dataset.freq === next);
  });
}

/** Macaron-inspired swatches (max 6), deepened slightly for badge contrast */
const COMPOUND_COLOR_SWATCHES = [
  { hex: "#E8655A", labelKey: "compoundColorRose" },
  { hex: "#E38A6C", labelKey: "compoundColorPeach" },
  { hex: "#C9A227", labelKey: "compoundColorLemon" },
  { hex: "#6BAA8E", labelKey: "compoundColorPistachio" },
  { hex: "#6DA6C3", labelKey: "compoundColorSky" },
  { hex: "#9B8BC4", labelKey: "compoundColorLavender" },
];

function defaultCompoundColor(group) {
  return medicationsController.defaultCompoundColor(group);
}

function resolveCompoundColor(group, explicit) {
  return medicationsController.resolveCompoundColor(
    group,
    explicit,
    compoundColorByGroup
  );
}

function applyCompoundChipColors() {
  const selected = document.getElementById("compound-group")?.value || "";
  document.querySelectorAll("#compound-chips .chip[data-compound]").forEach((chip) => {
    const group = chip.dataset.compound;
    // Only the selected chip gets an inline override (custom swatch or resolved).
    // Others keep each group’s default tone from CSS classes.
    if (selected && group === selected) {
      chip.style.setProperty("--compound-chip-color", resolveCompoundColor(group));
    } else {
      chip.style.removeProperty("--compound-chip-color");
    }
  });
}

function renderCompoundColorSwatches(group) {
  const field = document.getElementById("compound-color-field");
  const wrap = document.getElementById("compound-color-swatches");
  const colorInput = document.getElementById("compound-color");
  if (!field || !wrap || !colorInput) return;

  if (!group) {
    field.hidden = true;
    wrap.innerHTML = "";
    colorInput.value = "";
    return;
  }

  const current = resolveCompoundColor(group);
  colorInput.value = current;
  field.hidden = false;
  wrap.innerHTML = COMPOUND_COLOR_SWATCHES.map((swatch) => {
    const on = swatch.hex.toLowerCase() === current.toLowerCase();
    return `<button
      type="button"
      class="compound-color-swatch${on ? " is-on" : ""}"
      data-compound-color="${swatch.hex}"
      style="--swatch:${swatch.hex}"
      aria-label="${t(swatch.labelKey)}"
      title="${t(swatch.labelKey)}"
    ></button>`;
  }).join("");
}

function setMedCompoundColor(hex, { persistGroup = true } = {}) {
  const groupInput = document.getElementById("compound-group");
  const colorInput = document.getElementById("compound-color");
  const group = groupInput?.value || "";
  if (!group || !hex) return;
  if (persistGroup) {
    medicationsController.setCompoundColorOverride(
      compoundColorByGroup,
      group,
      hex
    );
  }
  if (colorInput) colorInput.value = hex;
  applyCompoundChipColors();
  renderCompoundColorSwatches(group);
}

function setMedCompoundChip(group) {
  const value = group || "";
  const input = document.getElementById("compound-group");
  if (input) input.value = value;
  document.querySelectorAll("#compound-chips .chip").forEach((chip) => {
    chip.classList.toggle("is-on", Boolean(value) && chip.dataset.compound === value);
  });
  if (value) {
    const color = resolveCompoundColor(value);
    medicationsController.setCompoundColorOverride(
      compoundColorByGroup,
      value,
      color
    );
    const colorInput = document.getElementById("compound-color");
    if (colorInput) colorInput.value = color;
  } else {
    const colorInput = document.getElementById("compound-color");
    if (colorInput) colorInput.value = "";
  }
  applyCompoundChipColors();
  renderCompoundColorSwatches(value);
}

applyCompoundChipColors();

function readMedDraftFromForm(form) {
  const amountRaw = form.dosageAmount.value.trim();
  const daysRaw = form.durationDays.value.trim();
  const amount = amountRaw === "" ? null : Number(amountRaw);
  const days = daysRaw === "" ? null : Number(daysRaw);
  const unit = normalizeMedUnitForStore(form.dosageUnit.value);
  const frequency = normalizeMedFreqForStore(form.frequency.value);
  const compoundGroup = (form.compoundGroup?.value || "").trim();
  const compoundColor = compoundGroup
    ? resolveCompoundColor(compoundGroup, (form.compoundColor?.value || "").trim())
    : "";
  const sourcePreset =
    form.sourcePreset.value === "clinic_ref" ? "clinic_ref" : "owner";
  const drugName = selectedDrug
    ? selectedDrug.genericName
    : drugSearch.value.trim();

  return {
    amount: amount != null && amount > 0 ? amount : null,
    days: Number.isInteger(days) && days > 0 ? days : null,
    unit,
    frequency,
    compoundGroup,
    compoundColor,
    sourcePreset,
    drugName,
  };
}

function hasAnyMedDraftInput(form) {
  const { amount, days, drugName, unit, frequency } = readMedDraftFromForm(form);
  return Boolean(
    drugName ||
      form.dosageAmount.value.trim() ||
      form.durationDays.value.trim() ||
      unit ||
      frequency ||
      amount ||
      days
  );
}

function validateMedDraft(draft, { silent = false } = {}) {
  const result = medicationsController.validateMedDraft(draft);
  if (!result.ok && !silent) {
    if (result.reason === "need_drug") showToast(t("toastNeedDrug"));
    else if (result.reason === "dose") showToast(t("toastDose"));
    else if (result.reason === "days") showToast(t("toastDays"));
  }
  return result.ok;
}

function clearMedDrugFields() {
  const form = document.getElementById("med-form");
  if (!form) return;
  form.dosageAmount.value = "";
  form.durationDays.value = "";
  setMedUnitChip("unrecorded");
  setMedFreqChip("unrecorded");
  setMedCompoundChip("");
  drugSearch.value = "";
  selectedDrug = null;
  selectedDrugEl.hidden = true;
  drugResults.hidden = true;
  drugResults.innerHTML = "";
  renderDrugInfoCard(null);
}

function pendingMedScheduleKey(med) {
  return medicationsController.pendingMedScheduleKey(med);
}

function compoundFormLabel(form) {
  const map = {
    liquid: t("compoundLiquidAName"),
    liquid_a: t("compoundLiquidAName"),
    liquid_b: t("compoundLiquidBName"),
    liquid_c: t("compoundLiquidCName"),
    capsule_a: t("compoundCapsuleAName"),
    capsule_b: t("compoundCapsuleBName"),
    capsule_c: t("compoundCapsuleCName"),
  };
  return map[form] || t("compoundLiquidName");
}

function compoundFormBadge(form) {
  const map = {
    liquid: t("compoundLiquidA"),
    liquid_a: t("compoundLiquidA"),
    liquid_b: t("compoundLiquidB"),
    liquid_c: t("compoundLiquidC"),
    capsule_a: t("compoundCapsuleA"),
    capsule_b: t("compoundCapsuleB"),
    capsule_c: t("compoundCapsuleC"),
  };
  return map[form] || t("compoundLiquid");
}

function compoundFormClass(form) {
  return medicationsSelectors.compoundFormClass(form);
}

function compoundChipToneClass(form) {
  if (form === "liquid" || form === "liquid_a") return "is-liquid-a";
  if (form === "liquid_b") return "is-liquid-b";
  if (form === "liquid_c") return "is-liquid-c";
  if (form === "capsule_a") return "is-capsule-a";
  if (form === "capsule_b") return "is-capsule-b";
  if (form === "capsule_c") return "is-capsule-c";
  return "";
}

function compoundIconKind(form) {
  return medicationsSelectors.compoundIconKind(form);
}

const COMPOUND_FORM_OPTIONS = [
  ["liquid_a", "compoundLiquidA"],
  ["liquid_b", "compoundLiquidB"],
  ["liquid_c", "compoundLiquidC"],
  ["capsule_a", "compoundCapsuleA"],
  ["capsule_b", "compoundCapsuleB"],
  ["capsule_c", "compoundCapsuleC"],
];

function pendingMedHasCompoundTag(med) {
  return medicationsController.pendingMedHasCompoundTag(med);
}

function renderPendingCompoundOptions(med) {
  const group = med.compoundGroup || "";
  const show =
    pendingMeds.length >= 2 ||
    pendingMedHasCompoundTag(med) ||
    pendingMeds.some((item) => pendingMedHasCompoundTag(item));
  if (!show) return "";

  return `<div class="pending-compound" role="group" aria-label="${t("compoundGroupLabel")}">
    <span class="pending-compound-label">${t("compoundGroupLabel")}</span>
    <div class="pending-compound-options">
      ${COMPOUND_FORM_OPTIONS.map(([value, key]) => {
        const tone = compoundChipToneClass(value);
        const icon = compoundIconKind(value);
        const color = resolveCompoundColor(value, med.compoundColor);
        const colorStyle =
          group === value ? ` style="--compound-chip-color:${color}"` : "";
        return `
        <label class="pending-compound-opt compound-chip ${tone}${
          group === value ? " is-on" : ""
        }"${colorStyle}>
          <input
            type="radio"
            name="compound-${med.localId}"
            value="${value}"
            data-compound-for="${med.localId}"
            ${group === value ? "checked" : ""}
          />
          <span>
            <i class="compound-ico compound-ico-${icon}" aria-hidden="true"></i>
            ${t(key)}
          </span>
        </label>`;
      }).join("")}
      ${
        group
          ? `<button type="button" class="pending-compound-clear" data-compound-clear="${med.localId}">${t(
              "compoundClear"
            )}</button>`
          : ""
      }
    </div>
  </div>`;
}

function renderPendingMeds() {
  const list = document.getElementById("pending-med-list");
  const countEl = document.getElementById("pending-meds-count");
  const hintEl = document.getElementById("pending-compound-hint");
  if (!list || !countEl) return;

  if (!pendingMeds.length) {
    list.innerHTML = "";
    countEl.textContent = t("pendingMedsEmpty");
    countEl.setAttribute("data-i18n", "pendingMedsEmpty");
    countEl.removeAttribute("data-i18n-vars");
    if (hintEl) hintEl.hidden = true;
    return;
  }

  countEl.removeAttribute("data-i18n");
  countEl.removeAttribute("data-i18n-vars");
  countEl.textContent = t("pendingMedsCount", { n: pendingMeds.length });

  const showCompoundHint =
    pendingMeds.length >= 2 || pendingMeds.some((med) => pendingMedHasCompoundTag(med));
  if (hintEl) {
    hintEl.hidden = !showCompoundHint;
    if (showCompoundHint) hintEl.textContent = t("compoundHint");
  }

  list.innerHTML = pendingMeds
    .map((med) => {
      const dosePending = !med.dose || med.dose === t("medDetailsPending");
      return `
      <li class="pending-med-item" data-pending-id="${med.localId}">
        <div class="pending-med-main">
          <div>
            <strong>${med.name}</strong>
            <small class="${dosePending ? "is-pending" : ""}">${med.dose}</small>
          </div>
          <button
            class="pending-med-remove"
            type="button"
            data-remove-pending="${med.localId}"
          >${t("pendingMedRemove")}</button>
        </div>
        ${renderPendingCompoundOptions(med)}
      </li>`;
    })
    .join("");
}

function pushPendingMed(draft) {
  const item = medicationsController.pushPendingMed(pendingMeds, draft);
  renderPendingMeds();
  return item;
}

function buildVisitMedicationsFromPending(petId) {
  return medicationsController.buildVisitMedicationsFromPending(
    pendingMeds,
    petId
  );
}

function renderTimelineMedItem(med, pet, visitIndex, medIndex, sourceTags) {
  if (!med.id) med.id = `m-${pet.id}-${visitIndex}-${medIndex}`;
  const hasProof = Boolean(med.bagPhoto || med.rxPhoto || med.drugPhoto);
  if (hasProof && med.source === "owner") {
    med.source = "owner_proof";
  }
  const sourceKey = med.source || "owner";
  const source = sourceTags[sourceKey] || sourceTags.owner;
  const isPhotoBundle = med.kind === "photo_bundle";
  const isCompound = med.kind === "compound_bundle";
  const completeBtn = isPhotoBundle
    ? `<button type="button" class="med-proof-btn" data-complete-visit="${visitIndex}">${t(
        "medCompleteDrugs"
      )}</button>`
    : "";
  const detailId = `med-detail-${pet.id}-${visitIndex}-${medIndex}`;

  if (isCompound) {
    const ingredientNames = (med.ingredients || [])
      .map((ing) => ing.name)
      .filter(Boolean);
    const namesLine = ingredientNames.length
      ? ingredientNames.join("、")
      : med.name;
    const ingredients = (med.ingredients || [])
      .map((ing, ingIndex) => {
        const notesId = `drug-notes-${pet.id}-${visitIndex}-${medIndex}-${ingIndex}`;
        return `<li class="tl-ingredient">
          <div class="tl-med-name-row">
            <strong>${ing.name}</strong>
            <button
              type="button"
              class="tl-drug-notes-btn"
              data-drug-notes-toggle
              aria-expanded="false"
              aria-controls="${notesId}"
            >${t("timelineDrugNotesBtn")}</button>
          </div>
          <span class="dose">${expandFrequencyInText(ing.dose)}</span>
          ${renderTimelineDrugNotes(ing, notesId)}
        </li>`;
      })
      .join("");

    return `
      <li class="tl-med-unit tl-compound ${compoundFormClass(med.compoundForm)}">
        <button
          type="button"
          class="tl-med-summary"
          data-med-detail-toggle
          aria-expanded="false"
          aria-controls="${detailId}"
        >
          <span class="tl-compound-badge ${compoundChipToneClass(
            med.compoundForm
          )}"${
            med.compoundColor
              ? ` style="background:${med.compoundColor}"`
              : ""
          }>
            <i class="compound-ico compound-ico-${compoundIconKind(
              med.compoundForm
            )}" aria-hidden="true"></i>
            ${compoundFormBadge(med.compoundForm)}
          </span>
          <span class="tl-med-summary-body">
            <span class="tl-med-summary-names">${namesLine}</span>
            <span class="dose">${expandFrequencyInText(med.dose)}</span>
          </span>
          <span class="tl-med-summary-action">${t("timelineMedExpand")}</span>
        </button>
        <div class="tl-med-detail" id="${detailId}" hidden>
          <span class="tag ${source.className}">${source.label}</span>
          <ul class="tl-ingredients">${ingredients}</ul>
          ${
            completeBtn
              ? `<div class="med-list-actions">${completeBtn}</div>`
              : ""
          }
        </div>
      </li>`;
  }

  const notesId = `drug-notes-${pet.id}-${visitIndex}-${medIndex}`;
  if (isPhotoBundle) {
    return `
    <li class="tl-med-unit">
      <div class="tl-med-summary is-static">
        <span class="tl-med-summary-body">
          <strong class="tl-med-summary-names">${med.name}</strong>
          <span class="dose">${expandFrequencyInText(med.dose)}</span>
        </span>
        <span class="tag ${source.className}">${source.label}</span>
      </div>
      ${
        completeBtn ? `<div class="med-list-actions">${completeBtn}</div>` : ""
      }
    </li>`;
  }

  return `
    <li class="tl-med-unit">
      <div class="tl-med-summary is-static">
        <span class="tl-med-summary-body">
          <span class="tl-med-name-row">
            <strong class="tl-med-summary-names">${med.name}</strong>
            <button
              type="button"
              class="tl-drug-notes-btn"
              data-drug-notes-toggle
              aria-expanded="false"
              aria-controls="${notesId}"
            >${t("timelineDrugNotesBtn")}</button>
          </span>
          <span class="dose">${expandFrequencyInText(med.dose)}</span>
        </span>
        <span class="tag ${source.className}">${source.label}</span>
      </div>
      ${renderTimelineDrugNotes(med, notesId)}
    </li>`;
}

function tryAddCurrentMedToList({ toastOnSuccess = true } = {}) {
  const form = document.getElementById("med-form");
  const draft = readMedDraftFromForm(form);
  if (!validateMedDraft(draft)) return false;
  pushPendingMed(draft);
  clearMedDrugFields();
  if (toastOnSuccess) showToast(t("toastMedAddedToList"));
  return true;
}

function clearLiveProofPhotos() {
  liveBagPhoto = null;
  liveRxPhoto = null;
  liveDrugPhoto = null;
  ["live-bag-photo", "live-rx-photo", "live-drug-photo"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  renderProofPreview(document.getElementById("live-bag-preview"), null);
  renderProofPreview(document.getElementById("live-rx-preview"), null);
  renderProofPreview(document.getElementById("live-drug-preview"), null);
}

function updateMedModeHint() {
  const hint = document.getElementById("med-mode-hint");
  const banner = document.getElementById("med-complete-banner");
  if (!hint) return;
  if (completingVisitRef) {
    hint.textContent = t("medModeHintComplete");
    if (banner) {
      banner.hidden = false;
      banner.textContent = t("medModeHintComplete");
    }
    return;
  }
  if (banner) banner.hidden = true;
  hint.textContent =
    medEntryMode === "photo" ? t("medModeHintPhoto") : t("medModeHintManual");
}

function setMedEntryMode(mode) {
  medEntryMode = mode === "photo" ? "photo" : "manual";
  const manual = document.getElementById("med-mode-manual");
  const photo = document.getElementById("med-mode-photo");
  if (manual) manual.hidden = medEntryMode !== "manual";
  if (photo) photo.hidden = medEntryMode !== "photo";
  document.querySelectorAll("[data-med-mode]").forEach((btn) => {
    const on = btn.dataset.medMode === medEntryMode;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  updateMedModeHint();
}

function getOrCreateVisitForMedSave() {
  const pet = getCurrentPet();
  if (completingVisitRef) {
    const visit = medicationsController.findVisitForMedSave(pet, {
      date: completingVisitRef.date,
      clinicId: completingVisitRef.clinicId,
      clinicName: completingVisitRef.clinic,
    });
    if (visit) return { pet, visit };
  }

  const visitForm = document.getElementById("visit-form");
  const visitDate = visitForm?.visitDate?.value || todayISODate();
  const clinicId = selectedClinic?.id || "";
  const clinicName =
    clinicNameInput?.value ||
    clinicNameOf(selectedClinic) ||
    t("anonymousClinic");
  const weightRaw = visitForm?.weightAtVisit?.value?.trim() || "";
  const weightAtVisit = weightRaw === "" ? null : Number(weightRaw);
  const weightValue = weightAtVisit > 0 ? weightAtVisit : null;
  let visit = medicationsController.findVisitForMedSave(pet, {
    date: visitDate,
    clinicId,
    clinicName,
  });
  if (!visit) {
    visit = {
      date: visitDate,
      clinicId: clinicId || undefined,
      clinic: clinicName,
      tags: [...selectedTags],
      note: visitForm?.notes?.value?.trim() || "",
      weightAtVisit: null,
      medications: [],
    };
    pet.visits.unshift(visit);
  }
  if (weightValue != null) {
    medicationsController.applyVisitWeightOnMedSave(pet, visit, weightValue);
  }
  return { pet, visit };
}

function finishMedFlowAfterSave(pet, toastKey, toastVars) {
  selectedTags.clear();
  document.querySelectorAll("#symptom-chips .chip.is-on").forEach((chip) => {
    chip.classList.remove("is-on");
  });
  const form = document.getElementById("med-form");
  form?.reset();
  clearMedDrugFields();
  pendingMeds = [];
  renderPendingMeds();
  clearLiveProofPhotos();
  completingVisitRef = null;
  setMedEntryMode("photo");
  setSelectedClinic(null);
  if (clinicSearch) clinicSearch.value = "";
  showToast(t(toastKey, toastVars));
  applySelectedPet();
  go("timeline");
}

document.querySelectorAll("[data-med-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (completingVisitRef && btn.dataset.medMode === "photo") {
      setMedEntryMode("manual");
      return;
    }
    setMedEntryMode(btn.dataset.medMode);
  });
});

function bindLivePhotoInput(inputId, previewId, assign) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readAndCompressImage(file);
    assign(dataUrl);
    renderProofPreview(document.getElementById(previewId), dataUrl);
  });
}

bindLivePhotoInput("live-bag-photo", "live-bag-preview", (url) => {
  liveBagPhoto = url;
});
bindLivePhotoInput("live-rx-photo", "live-rx-preview", (url) => {
  liveRxPhoto = url;
});
bindLivePhotoInput("live-drug-photo", "live-drug-preview", (url) => {
  liveDrugPhoto = url;
});

document.getElementById("save-photo-rx-btn")?.addEventListener("click", () => {
  const { pet, visit } = getOrCreateVisitForMedSave();
  medicationsController.appendPhotoBundleToVisit(visit, pet, {
    bagPhoto: liveBagPhoto,
    rxPhoto: liveRxPhoto,
    drugPhoto: liveDrugPhoto,
    name: t("photoRxName", { date: formatShortDate(visit.date) }),
    dosePendingText: t("photoRxDosePending"),
  });
  finishMedFlowAfterSave(pet, "toastPhotoRxSaved", { name: pet.name });
});

document.getElementById("add-med-to-list").addEventListener("click", () => {
  tryAddCurrentMedToList();
});

document.getElementById("pending-med-list").addEventListener("click", (event) => {
  const clearBtn = event.target.closest("[data-compound-clear]");
  if (clearBtn) {
    const id = clearBtn.getAttribute("data-compound-clear");
    medicationsController.setPendingCompoundGroup(
      pendingMeds,
      id,
      "",
      compoundColorByGroup
    );
    renderPendingMeds();
    return;
  }

  const btn = event.target.closest("[data-remove-pending]");
  if (!btn) return;
  const id = btn.getAttribute("data-remove-pending");
  pendingMeds = medicationsController.removePendingMed(pendingMeds, id);
  renderPendingMeds();
});

document.getElementById("pending-med-list").addEventListener("change", (event) => {
  const input = event.target.closest("[data-compound-for]");
  if (!input) return;
  const id = input.getAttribute("data-compound-for");
  medicationsController.setPendingCompoundGroup(
    pendingMeds,
    id,
    input.value || "",
    compoundColorByGroup
  );
  renderPendingMeds();
});

document.getElementById("med-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (medEntryMode === "photo") return;

  const form = event.currentTarget;

  if (hasAnyMedDraftInput(form)) {
    if (!tryAddCurrentMedToList({ toastOnSuccess: false })) return;
  }

  if (!pendingMeds.length) {
    showToast(t("toastNeedPendingMeds"));
    return;
  }

  const { pet, visit } = getOrCreateVisitForMedSave();
  const units = buildVisitMedicationsFromPending(pet.id);
  medicationsController.appendUnitsToVisit(visit, units);

  finishMedFlowAfterSave(pet, "toastMedSaved", {
    name: pet.name,
    n: units.length,
  });
});

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Camera originals are huge; shrink before keeping in memory. */
async function readAndCompressImage(file, maxEdge = PROOF_PHOTO_MAX_EDGE) {
  const raw = await readFileAsDataUrl(file);
  return resizeImageDataUrl(raw, maxEdge);
}

function renderProofPreview(container, dataUrl, clearKey = "") {
  if (!container) return;
  if (!dataUrl) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.hidden = false;
  const clearBtn = clearKey
    ? `<button type="button" class="proof-clear-btn" data-proof-clear="${clearKey}">${t(
        "proofPhotoClear"
      )}</button>`
    : "";
  container.innerHTML = `<img src="${dataUrl}" alt="" />${clearBtn}`;
}

function openVisitProof(visitIndex) {
  const pet = getCurrentPet();
  const visit = pet.visits[visitIndex];
  if (!visit) return;

  pendingProofMed = null;
  pendingProofVisitIndex = visitIndex;
  pendingBagPhoto = visit.bagPhoto || null;
  pendingRxPhoto = visit.rxPhoto || null;
  pendingDrugPhoto = visit.drugPhoto || null;

  document.getElementById("med-proof-name").textContent = visitClinicLabel(visit);
  document.getElementById("med-proof-meta").textContent = visit.date;
  document.getElementById("med-proof-sub").textContent = t("timelineVisitRxProofSub");
  const targetKicker = document.querySelector("#med-proof-form .archive-pet-kicker");
  if (targetKicker) {
    targetKicker.setAttribute("data-i18n", "timelineVisitRxTarget");
    targetKicker.textContent = t("timelineVisitRxTarget");
  }
  document.getElementById("med-bag-photo").value = "";
  const rxInput = document.getElementById("med-rx-photo");
  if (rxInput) rxInput.value = "";
  document.getElementById("med-drug-photo").value = "";
  renderProofPreview(document.getElementById("med-bag-preview"), pendingBagPhoto, "bag");
  renderProofPreview(document.getElementById("med-rx-preview"), pendingRxPhoto, "rx");
  renderProofPreview(document.getElementById("med-drug-preview"), pendingDrugPhoto, "drug");
  go("med-proof");
}

function toggleVisitRxButton(toggle) {
  const panelId = toggle.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;
  const open = panel.hasAttribute("hidden");
  if (open) {
    panel.removeAttribute("hidden");
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = t("timelineVisitRxHide");
    toggle.classList.add("is-open");
  } else {
    panel.setAttribute("hidden", "");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = t("timelineVisitRxBtn");
    toggle.classList.remove("is-open");
  }
  if (panelId === "visit-rx-0") {
    latestRxUserCollapsed = !open;
  }
}

function expandLatestVisitRx() {
  if (latestRxUserCollapsed) return;
  const toggle = document.querySelector(
    '[data-visit-rx-toggle][aria-controls="visit-rx-0"]'
  );
  if (!toggle) return;
  const panel = document.getElementById("visit-rx-0");
  if (panel?.hasAttribute("hidden")) toggleVisitRxButton(toggle);
}

function toggleVisitImagingButton(toggle) {
  const panelId = toggle.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;
  const open = panel.hasAttribute("hidden");
  if (open) {
    panel.removeAttribute("hidden");
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = t("timelineVisitImagingHide");
    toggle.classList.add("is-open");
  } else {
    panel.setAttribute("hidden", "");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = t("timelineVisitImagingBtn");
    toggle.classList.remove("is-open");
  }
}

function revealVisitImagingPanel(visitIndex, { scroll = false } = {}) {
  const toggle = document.querySelector(
    `[data-visit-imaging-toggle][aria-controls="visit-imaging-${visitIndex}"]`
  );
  if (!toggle) return;
  const panel = document.getElementById(`visit-imaging-${visitIndex}`);
  if (panel?.hasAttribute("hidden")) toggleVisitImagingButton(toggle);
  if (scroll) {
    panel?.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

function applyPendingVisitImagingExpand() {
  if (pendingVisitImagingIndex == null) return;
  const visitIndex = pendingVisitImagingIndex;
  pendingVisitImagingIndex = null;
  revealVisitImagingPanel(visitIndex);
}

function goTimelineWithImaging(visitIndex) {
  pendingVisitImagingIndex = visitIndex;
  if (!go("timeline")) {
    const pet = getCurrentPet();
    if (pet) renderTimeline(pet);
  }
  requestAnimationFrame(() => {
    revealVisitImagingPanel(visitIndex, { scroll: true });
  });
}

function renderImagingSlotPreviews(slot) {
  const root = document.getElementById(
    slot === "us" ? "imaging-us-previews" : "imaging-xray-previews"
  );
  if (!root) return;
  const photos = slot === "us" ? pendingUsPhotos : pendingXrayPhotos;
  root.innerHTML = photos
    .map(
      (url, index) => `
      <figure class="lab-photo-fig">
        <img src="${url}" alt="" />
        <button type="button" class="proof-clear-btn" data-imaging-photo-remove="${slot}:${index}">
          ${t("proofPhotoClear")}
        </button>
      </figure>`
    )
    .join("");
}

function syncImagingProofSubmitEnabled() {
  const btn = document.querySelector(
    "#imaging-proof-form button[type='submit']"
  );
  if (!btn) return;
  const busy = imagingCompressInFlight > 0;
  btn.disabled = busy;
  btn.setAttribute("aria-disabled", busy ? "true" : "false");
}

async function appendImagingFiles(files, slot) {
  let hitCap = false;
  imagingCompressInFlight += 1;
  syncImagingProofSubmitEnabled();
  try {
    for (const file of files) {
      const before =
        slot === "us" ? pendingUsPhotos : pendingXrayPhotos;
      if (before.length >= IMAGING_PHOTOS_MAX) {
        hitCap = true;
        break;
      }
      try {
        const dataUrl = await readAndCompressImage(file);
        // Re-resolve after await — never push onto a stale bucket reference.
        const current =
          slot === "us" ? pendingUsPhotos : pendingXrayPhotos;
        if (current.length >= IMAGING_PHOTOS_MAX) {
          hitCap = true;
          break;
        }
        if (dataUrl) {
          if (slot === "us") pendingUsPhotos.push(dataUrl);
          else pendingXrayPhotos.push(dataUrl);
        }
      } catch {
        showToast(t("toastPetPhotoFail"));
      }
    }
  } finally {
    imagingCompressInFlight = Math.max(0, imagingCompressInFlight - 1);
    syncImagingProofSubmitEnabled();
  }
  if (hitCap) showToast(t("toastImagingCap"));
  renderImagingSlotPreviews(slot);
}

function openVisitImaging(visitIndex) {
  const pet = getCurrentPet();
  const visit = pet?.visits?.[visitIndex];
  if (!visit) return;

  pendingImagingVisitIndex = visitIndex;
  const imaging = getVisitImaging(visit);
  pendingXrayPhotos = [...imaging.xrayPhotos];
  pendingUsPhotos = [...imaging.usPhotos];

  document.getElementById("imaging-proof-name").textContent =
    visitClinicLabel(visit);
  document.getElementById("imaging-proof-meta").textContent = visit.date;
  document.getElementById("imaging-proof-sub").textContent = t(
    "timelineVisitImagingProofSub"
  );
  const targetKicker = document.querySelector(
    "#imaging-proof-form .archive-pet-kicker"
  );
  if (targetKicker) {
    targetKicker.setAttribute("data-i18n", "timelineVisitImagingTarget");
    targetKicker.textContent = t("timelineVisitImagingTarget");
  }
  const xrayInput = document.getElementById("imaging-xray-photo");
  const usInput = document.getElementById("imaging-us-photo");
  if (xrayInput) xrayInput.value = "";
  if (usInput) usInput.value = "";
  renderImagingSlotPreviews("xray");
  renderImagingSlotPreviews("us");
  go("imaging-proof");
}

function openCompleteDrugs(visitIndex) {
  const pet = getCurrentPet();
  const visit = pet.visits[visitIndex];
  if (!visit) return;
  completingVisitRef = {
    date: visit.date,
    clinicId: visit.clinicId,
    clinic: visitClinicLabel(visit),
  };
  pendingMeds = [];
  clearMedDrugFields();
  clearLiveProofPhotos();
  setMedEntryMode("manual");
  go("add-med");
}

function toggleDrugNotesButton(notesToggle) {
  const panelId = notesToggle.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;
  const open = panel.hasAttribute("hidden");
  if (open) {
    panel.removeAttribute("hidden");
    notesToggle.setAttribute("aria-expanded", "true");
    notesToggle.textContent = t("timelineDrugNotesHide");
    notesToggle.classList.add("is-open");
  } else {
    panel.setAttribute("hidden", "");
    notesToggle.setAttribute("aria-expanded", "false");
    notesToggle.textContent = t("timelineDrugNotesBtn");
    notesToggle.classList.remove("is-open");
  }
}

function toggleMedDetailButton(toggle) {
  const panelId = toggle.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;
  const action = toggle.querySelector(".tl-med-summary-action");
  const open = panel.hasAttribute("hidden");
  if (open) {
    panel.removeAttribute("hidden");
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("is-open");
    if (action) action.textContent = t("timelineMedCollapse");
  } else {
    panel.setAttribute("hidden", "");
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("is-open");
    if (action) action.textContent = t("timelineMedExpand");
  }
}

function toggleVisitWeightButton(toggle) {
  const panelId = toggle.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;
  const open = panel.hasAttribute("hidden");
  if (open) {
    panel.removeAttribute("hidden");
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("is-open");
    const input = panel.querySelector('input[name="weightAtVisit"]');
    input?.focus();
  } else {
    panel.setAttribute("hidden", "");
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("is-open");
  }
}

function saveVisitWeightAtIndex(visitIndex) {
  if (demoBlocksWrite()) return false;
  const pet = getCurrentPet();
  const input = document.getElementById(`visit-weight-input-${visitIndex}`);
  const weight = Number(input?.value?.trim() || "");
  const result = visitsController.saveVisitWeight(pet, visitIndex, weight);
  if (!result.ok) {
    showToast(t("toastWeight"));
    return false;
  }
  showToast(t("toastVisitWeightSaved", { weight }));
  applySelectedPet();
  return true;
}

timelineList.addEventListener("click", (event) => {
  const notesToggle = event.target.closest("[data-drug-notes-toggle]");
  if (notesToggle) {
    toggleDrugNotesButton(notesToggle);
    return;
  }
  const medDetailToggle = event.target.closest("[data-med-detail-toggle]");
  if (medDetailToggle) {
    toggleMedDetailButton(medDetailToggle);
    return;
  }
  const visitWeightToggle = event.target.closest("[data-visit-weight-toggle]");
  if (visitWeightToggle) {
    toggleVisitWeightButton(visitWeightToggle);
    return;
  }
  const visitLabsBtn = event.target.closest("[data-open-labs]");
  if (visitLabsBtn) {
    go("labs");
    return;
  }
  const visitRxToggle = event.target.closest("[data-visit-rx-toggle]");
  if (visitRxToggle) {
    toggleVisitRxButton(visitRxToggle);
    return;
  }
  const visitImagingToggle = event.target.closest("[data-visit-imaging-toggle]");
  if (visitImagingToggle) {
    toggleVisitImagingButton(visitImagingToggle);
    return;
  }
  const proofLightboxBtn = event.target.closest("[data-proof-lightbox]");
  if (proofLightboxBtn) {
    const img = proofLightboxBtn.querySelector("img");
    openProofLightbox(img?.currentSrc || img?.src, proofLightboxBtn.dataset.proofCaption);
    return;
  }
  const clearSlotBtn = event.target.closest("[data-visit-proof-clear-slot]");
  if (clearSlotBtn) {
    const pet = getCurrentPet();
    const visitIndex = Number(clearSlotBtn.dataset.visitIndex);
    const visit = pet.visits[visitIndex];
    const slot = clearSlotBtn.dataset.visitProofClearSlot;
    if (!visit || !slot) return;
    clearVisitProofSlot(visit, slot);
    showToast(t("toastProofCleared"));
    applySelectedPet();
    const toggle = document.querySelector(
      `[data-visit-rx-toggle][aria-controls="visit-rx-${visitIndex}"]`
    );
    if (toggle) toggleVisitRxButton(toggle);
    return;
  }
  const clearImagingBtn = event.target.closest("[data-visit-imaging-clear-slot]");
  if (clearImagingBtn) {
    const pet = getCurrentPet();
    const visitIndex = Number(clearImagingBtn.dataset.visitIndex);
    const visit = pet?.visits?.[visitIndex];
    const slot = clearImagingBtn.dataset.visitImagingClearSlot;
    const photoIndex = Number(clearImagingBtn.dataset.visitImagingClearIndex);
    if (!visit || !slot) return;
    clearVisitImagingPhoto(visit, slot, photoIndex);
    showToast(t("toastImagingCleared"));
    applySelectedPet();
    const toggle = document.querySelector(
      `[data-visit-imaging-toggle][aria-controls="visit-imaging-${visitIndex}"]`
    );
    if (toggle) toggleVisitImagingButton(toggle);
    return;
  }
  const visitUpload = event.target.closest("[data-visit-proof-upload]");
  if (visitUpload) {
    openVisitProof(Number(visitUpload.dataset.visitProofUpload));
    return;
  }
  const imagingUpload = event.target.closest("[data-visit-imaging-upload]");
  if (imagingUpload) {
    openVisitImaging(Number(imagingUpload.dataset.visitImagingUpload));
    return;
  }
  const completeBtn = event.target.closest("[data-complete-visit]");
  if (completeBtn) {
    openCompleteDrugs(Number(completeBtn.dataset.completeVisit));
  }
});

timelineList.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-visit-weight-form]");
  if (!form) return;
  event.preventDefault();
  saveVisitWeightAtIndex(Number(form.dataset.visitWeightForm));
});

if (eMeds) {
  eMeds.addEventListener("click", (event) => {
    const notesToggle = event.target.closest("[data-drug-notes-toggle]");
    if (!notesToggle) return;
    toggleDrugNotesButton(notesToggle);
  });
}

document.getElementById("med-bag-photo").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  pendingBagPhoto = await readAndCompressImage(file);
  renderProofPreview(document.getElementById("med-bag-preview"), pendingBagPhoto, "bag");
});

document.getElementById("med-rx-photo")?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  pendingRxPhoto = await readAndCompressImage(file);
  renderProofPreview(document.getElementById("med-rx-preview"), pendingRxPhoto, "rx");
});

document.getElementById("med-drug-photo").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  pendingDrugPhoto = await readAndCompressImage(file);
  renderProofPreview(document.getElementById("med-drug-preview"), pendingDrugPhoto, "drug");
});

document.getElementById("med-proof-form").addEventListener("click", (event) => {
  const clearBtn = event.target.closest("[data-proof-clear]");
  if (!clearBtn) return;
  const key = clearBtn.getAttribute("data-proof-clear");
  if (key === "bag") {
    pendingBagPhoto = null;
    document.getElementById("med-bag-photo").value = "";
    renderProofPreview(document.getElementById("med-bag-preview"), null);
  } else if (key === "rx") {
    pendingRxPhoto = null;
    const rxInput = document.getElementById("med-rx-photo");
    if (rxInput) rxInput.value = "";
    renderProofPreview(document.getElementById("med-rx-preview"), null);
  } else if (key === "drug") {
    pendingDrugPhoto = null;
    document.getElementById("med-drug-photo").value = "";
    renderProofPreview(document.getElementById("med-drug-preview"), null);
  }
});

document.getElementById("med-proof-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (pendingProofVisitIndex == null) {
    showToast(t("toastProofMissingVisit"));
    return;
  }

  const pet = getCurrentPet();
  const visit = pet.visits[pendingProofVisitIndex];
  if (!visit) return;

  // Assign pending as-is so cleared slots stay cleared.
  visit.bagPhoto = pendingBagPhoto || null;
  visit.rxPhoto = pendingRxPhoto || null;
  visit.drugPhoto = pendingDrugPhoto || null;
  (visit.medications || []).forEach((med) => {
    med.bagPhoto = visit.bagPhoto;
    med.rxPhoto = visit.rxPhoto;
    med.drugPhoto = visit.drugPhoto;
  });

  pendingProofVisitIndex = null;
  pendingProofMed = null;
  pendingBagPhoto = null;
  pendingRxPhoto = null;
  pendingDrugPhoto = null;

  showToast(t("toastProofSaved"));
  applySelectedPet();
  go("timeline");
});

document.getElementById("imaging-xray-photo")?.addEventListener("change", async (event) => {
  const files = [...(event.target.files || [])];
  event.target.value = "";
  if (!files.length) return;
  await appendImagingFiles(files, "xray");
});

document.getElementById("imaging-us-photo")?.addEventListener("change", async (event) => {
  const files = [...(event.target.files || [])];
  event.target.value = "";
  if (!files.length) return;
  await appendImagingFiles(files, "us");
});

document.getElementById("imaging-proof-form")?.addEventListener("click", (event) => {
  const clearBtn = event.target.closest("[data-imaging-photo-remove]");
  if (!clearBtn) return;
  const raw = clearBtn.getAttribute("data-imaging-photo-remove") || "";
  const sep = raw.indexOf(":");
  if (sep < 0) return;
  const slot = raw.slice(0, sep);
  const index = Number(raw.slice(sep + 1));
  const bucket = slot === "us" ? pendingUsPhotos : pendingXrayPhotos;
  if (!Number.isInteger(index)) return;
  bucket.splice(index, 1);
  renderImagingSlotPreviews(slot);
});

document.getElementById("imaging-proof-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (imagingCompressInFlight > 0) {
    showToast(t("toastImagingBusy"));
    return;
  }
  if (pendingImagingVisitIndex == null) {
    showToast(t("toastImagingMissingVisit"));
    return;
  }

  const pet = getCurrentPet();
  const visitIndex = pendingImagingVisitIndex;
  const visit = pet?.visits?.[visitIndex];
  if (!visit) return;

  visit.imaging = {
    xrayPhotos: pendingXrayPhotos.slice(0, IMAGING_PHOTOS_MAX),
    usPhotos: pendingUsPhotos.slice(0, IMAGING_PHOTOS_MAX),
  };

  // Clear pendings only after write; compress-guard above blocks mid-append Save.
  pendingImagingVisitIndex = null;
  pendingXrayPhotos = [];
  pendingUsPhotos = [];

  showToast(t("toastImagingSaved"));
  applySelectedPet();
  goTimelineWithImaging(visitIndex);
});

document.getElementById("imaging-list")?.addEventListener("click", (event) => {
  const goTimeline = event.target.closest("[data-go-timeline-from-imaging]");
  if (goTimeline) {
    go("timeline");
    return;
  }
  const item = event.target.closest("[data-open-visit-imaging]");
  if (!item) return;
  goTimelineWithImaging(Number(item.dataset.openVisitImaging));
});

document.getElementById("lab-type-chips")?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-lab-type]");
  if (!chip) return;
  const type = chip.dataset.labType;
  if (!LAB_TYPE_I18N[type]) return;
  if (selectedLabTypes.has(type)) selectedLabTypes.delete(type);
  else selectedLabTypes.add(type);
  syncLabTypeChips();
});

document.getElementById("lab-photos-input")?.addEventListener("change", async (event) => {
  const files = [...(event.target.files || [])];
  event.target.value = "";
  for (const file of files) {
    if (pendingLabPhotos.length >= LAB_PHOTOS_MAX) break;
    try {
      const dataUrl = await readAndCompressImage(file);
      if (dataUrl) pendingLabPhotos.push(dataUrl);
    } catch {
      showToast(t("toastPetPhotoFail"));
    }
  }
  renderLabPhotoPreviews();
});

document.getElementById("lab-photo-previews")?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-lab-photo-remove]");
  if (!btn) return;
  const index = Number(btn.dataset.labPhotoRemove);
  if (!Number.isInteger(index)) return;
  pendingLabPhotos.splice(index, 1);
  renderLabPhotoPreviews();
});

document.getElementById("lab-clinic-search")?.addEventListener("focus", (event) => {
  renderLabClinicResults(searchClinics(event.target.value));
});

document.getElementById("lab-clinic-search")?.addEventListener("input", (event) => {
  selectedLabClinic = null;
  const nameInput = document.getElementById("lab-clinic-name");
  const idInput = document.getElementById("lab-clinic-id");
  const selectedEl = document.getElementById("lab-selected-clinic");
  if (nameInput) nameInput.value = "";
  if (idInput) idInput.value = "";
  if (selectedEl) {
    selectedEl.hidden = true;
    selectedEl.textContent = "";
    selectedEl.classList.remove("is-anonymous");
  }
  renderLabClinicResults(searchClinics(event.target.value));
});

document.getElementById("lab-clinic-results")?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-lab-clinic-id]");
  if (!btn) return;
  const clinic = getClinicDirectory().find(
    (item) => item.id === btn.dataset.labClinicId
  );
  if (!clinic) return;
  setSelectedLabClinic(clinic);
});

document.getElementById("lab-visit-link")?.addEventListener("change", (event) => {
  const pet = getCurrentPet();
  const visit = findVisitByLink(pet, event.target.value);
  if (!visit) return;
  const dateInput = document.getElementById("lab-date");
  if (dateInput && (!dateInput.value || dateInput.value === todayISODate())) {
    dateInput.value = visit.date;
  }
  const preset = visit.clinicId
    ? getClinicDirectory().find((item) => item.id === visit.clinicId)
    : null;
  if (preset) {
    setSelectedLabClinic(preset);
  } else {
    const search = document.getElementById("lab-clinic-search");
    const name = visitClinicLabel(visit);
    if (search) search.value = name;
    selectedLabClinic = null;
    const nameInput = document.getElementById("lab-clinic-name");
    const idInput = document.getElementById("lab-clinic-id");
    if (nameInput) nameInput.value = name;
    if (idInput) idInput.value = visit.clinicId || "";
  }
});

document.getElementById("lab-add-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const pet = getCurrentPet();
  if (!pet) return;
  if (!pendingLabPhotos.length) {
    showToast(t("toastNeedLabPhoto"));
    return;
  }
  const dateInput = document.getElementById("lab-date");
  const date = dateInput?.value || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

  const visit = findVisitByLink(
    pet,
    document.getElementById("lab-visit-link")?.value || ""
  );
  const typedClinic = (
    document.getElementById("lab-clinic-search")?.value || ""
  ).trim();
  const clinicName = selectedLabClinic
    ? clinicNameOf(selectedLabClinic)
    : document.getElementById("lab-clinic-name")?.value.trim() || typedClinic;
  const clinicId = selectedLabClinic?.id || (visit?.clinicId && !typedClinic
    ? visit.clinicId
    : document.getElementById("lab-clinic-id")?.value || "");

  const report = {
    id: `lab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    petId: pet.id,
    date,
    types: LAB_TYPE_ORDER.filter((type) => selectedLabTypes.has(type)),
    clinic: clinicName || "",
    clinicId: clinicId && clinicId !== "anonymous" ? clinicId : undefined,
    visitDate: visit?.date || "",
    visitClinicId: visit?.clinicId || "",
    note: document.getElementById("lab-note")?.value.trim() || "",
    photos: [...pendingLabPhotos],
    source: "owner_proof",
    createdAt: new Date().toISOString(),
  };

  const next = [report, ...getLabReportsForPet(pet.id)];
  if (!writeLabReportsForPet(pet.id, next)) {
    showPersistenceFailure();
    showToast(t("toastLabSaveFail"));
    return;
  }

  labAddBoundPetId = null;
  showToast(t("toastLabSaved"));
  applySelectedPet();
  go("labs");
});

document.getElementById("lab-list")?.addEventListener("click", (event) => {
  const removeBtn = event.target.closest("[data-lab-remove]");
  if (removeBtn) {
    const pet = getCurrentPet();
    if (!pet) return;
    const id = removeBtn.dataset.labRemove;
    const next = getLabReportsForPet(pet.id).filter((row) => row.id !== id);
    if (!writeLabReportsForPet(pet.id, next)) {
      showPersistenceFailure();
      showToast(t("toastLabSaveFail"));
      return;
    }
    showToast(t("toastLabRemoved"));
    applySelectedPet();
    return;
  }
  const proofLightboxBtn = event.target.closest("[data-proof-lightbox]");
  if (proofLightboxBtn) {
    const img = proofLightboxBtn.querySelector("img");
    openProofLightbox(
      img?.currentSrc || img?.src,
      proofLightboxBtn.dataset.proofCaption
    );
  }
});

function upsertPetVaccines(pet, entries) {
  if (!Array.isArray(pet.vaccines)) pet.vaccines = [];
  const keys = new Set(entries.map((entry) => entry.key).filter(Boolean));
  const names = new Set(entries.map((entry) => entry.name));
  pet.vaccines = pet.vaccines.filter((vaccine) => {
    if (vaccine.key && keys.has(vaccine.key)) return false;
    if (names.has(vaccine.name)) return false;
    return true;
  });
  entries
    .slice()
    .reverse()
    .forEach((entry) => {
      pet.vaccines.unshift(entry);
    });
}

vaccineChipsEl?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-vaccine-key]");
  if (!chip || !vaccineChipsEl.contains(chip)) return;
  const key = chip.dataset.vaccineKey;
  const exclusiveGroups = new Set(["coreCombo", "felineCore"]);

  if (selectedVaccineKeys.has(key)) {
    selectedVaccineKeys.delete(key);
  } else {
    const group = VACCINE_PROTECTION_META[key]?.group || "";
    if (exclusiveGroups.has(group)) {
      [...selectedVaccineKeys].forEach((selectedKey) => {
        if (VACCINE_PROTECTION_META[selectedKey]?.group === group) {
          selectedVaccineKeys.delete(selectedKey);
        }
      });
    }
    selectedVaccineKeys.add(key);
  }

  vaccineChipsEl.querySelectorAll("[data-vaccine-key]").forEach((el) => {
    el.classList.toggle("is-on", selectedVaccineKeys.has(el.dataset.vaccineKey));
  });
});

alertTypeChips?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-alert-type]");
  if (!chip) return;
  setSelectedAlertType(chip.dataset.alertType);
});

alertSeverityChips?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-alert-severity]");
  if (!chip) return;
  setSelectedAlertSeverity(chip.dataset.alertSeverity);
});

alertForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveAlertFromForm();
});

alertCancelEditBtn?.addEventListener("click", () => {
  const keepType = selectedAlertType;
  resetAlertForm({ keepType });
});

alertSections?.addEventListener("click", (event) => {
  const sectionEditBtn = event.target.closest("[data-alert-section-edit]");
  if (sectionEditBtn) {
    event.stopPropagation();
    const sectionId = sectionEditBtn.dataset.alertSectionEdit;
    const section = sectionEditBtn.closest(".alert-section");
    if (!section || !sectionId) return;
    const on = !editingAlertSectionIds.has(sectionId);
    if (on) editingAlertSectionIds.add(sectionId);
    else editingAlertSectionIds.delete(sectionId);
    section.classList.toggle("is-editing", on);
    sectionEditBtn.setAttribute("aria-pressed", on ? "true" : "false");
    sectionEditBtn.textContent = t(on ? "alertSectionEditDone" : "alertSectionEdit");
    return;
  }
  const addBtn = event.target.closest("[data-alert-add-type]");
  if (addBtn) {
    event.stopPropagation();
    startNewAlert(addBtn.dataset.alertAddType);
    return;
  }
  const editBtn = event.target.closest("[data-alert-edit]");
  if (editBtn) {
    event.stopPropagation();
    const pet = getCurrentPet();
    const alert = getAlertsForPet(pet).find((item) => item.id === editBtn.dataset.alertEdit);
    beginEditAlert(alert);
    return;
  }
  const deleteBtn = event.target.closest("[data-alert-delete]");
  if (deleteBtn) {
    event.stopPropagation();
    deleteAlertById(deleteBtn.dataset.alertDelete);
  }
});

alertSections?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const editBtn = event.target.closest("[data-alert-edit]");
  if (!editBtn) return;
  event.preventDefault();
  const pet = getCurrentPet();
  const alert = getAlertsForPet(pet).find((item) => item.id === editBtn.dataset.alertEdit);
  beginEditAlert(alert);
});

vaccineGivenInput.addEventListener("change", syncVaccineNextDueFromGiven);

vaccineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const pet = getCurrentPet();
  const selected = getSelectedVaccineEntries();
  const given = vaccineGivenInput.value;
  const next = vaccineNextDueInput.value;

  if (!selected.length) {
    showToast(t("toastNeedVaccineName"));
    return;
  }
  const blocked = selected.filter((entry) => !vaccineAllowedForPet(pet, entry));
  if (blocked.length) {
    showToast(t("toastVaccineNotForCat", { name: blocked[0].name }));
    return;
  }
  if (!given || !next) {
    showToast(t("toastNeedVaccineDates"));
    return;
  }
  if (next < given) {
    showToast(t("toastVaccineOrder"));
    return;
  }

  const status = vaccineStatusForNext(next);
  const updated = selected.some((entry) =>
    pet.vaccines?.some(
      (vaccine) =>
        (entry.key && vaccine.key === entry.key) || vaccine.name === entry.name
    )
  );
  upsertPetVaccines(
    pet,
    selected.map((entry) => ({
      key: entry.key || "",
      name: entry.name,
      given,
      next,
      status,
    }))
  );

  const calPayload = buildVaccineCalendarPayload(pet, {
    vaccines: selected,
    given,
    next,
  });

  renderVaccines(pet);
  resetVaccineForm(pet);
  vaccineFormPetId = pet.id;
  showToast(
    t(updated ? "toastVaccinesUpdated" : "toastVaccinesAdded", {
      name: pet.name,
      count: selected.length,
      vaccines: selected.map((entry) => entry.name).join("、"),
    })
  );
  if (calPayload) {
    showCalendarChooser(calPayload, t("vaccineCalChooserMeta", { date: next }));
  }
});

document.getElementById("parasite-chips-external")?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-parasite-product]");
  if (!chip) return;
  const key = chip.dataset.parasiteProduct;
  selectedParasiteProduct.external =
    selectedParasiteProduct.external === key ? "" : key;
  renderParasiteProductChips("external");
  if (selectedParasiteProduct.external) {
    const custom = document.getElementById("parasite-custom-external");
    if (custom) custom.value = "";
    const intervalEl = document.getElementById("parasite-interval-external");
    if (intervalEl && chip.dataset.interval) {
      intervalEl.value = chip.dataset.interval;
      syncParasiteNextFromLast("external");
    }
  }
});

document.getElementById("parasite-chips-heartworm")?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-parasite-product]");
  if (!chip) return;
  const key = chip.dataset.parasiteProduct;
  selectedParasiteProduct.heartworm =
    selectedParasiteProduct.heartworm === key ? "" : key;
  renderParasiteProductChips("heartworm");
  if (selectedParasiteProduct.heartworm) {
    const custom = document.getElementById("parasite-custom-heartworm");
    if (custom) custom.value = "";
    const intervalEl = document.getElementById("parasite-interval-heartworm");
    if (intervalEl && chip.dataset.interval) {
      intervalEl.value = chip.dataset.interval;
      syncParasiteNextFromLast("heartworm");
    }
  }
});

PARASITE_KINDS.forEach((kind) => {
  document
    .getElementById(`parasite-last-${kind}`)
    ?.addEventListener("change", () => syncParasiteNextFromLast(kind));
  document
    .getElementById(`parasite-interval-${kind}`)
    ?.addEventListener("input", () => syncParasiteNextFromLast(kind));
  document
    .getElementById(`parasite-interval-${kind}`)
    ?.addEventListener("change", () => syncParasiteNextFromLast(kind));
});

document.getElementById("parasite-form-external")?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveParasitePastAndOfferCalendar("external");
});

document.getElementById("parasite-form-heartworm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveParasitePastAndOfferCalendar("heartworm");
});

document.querySelectorAll("[data-parasite-dosed]").forEach((btn) => {
  btn.addEventListener("click", () => {
    saveParasiteDosedTodayAndOfferCalendar(btn.dataset.parasiteDosed);
  });
});

document.getElementById("parasite-cal-chooser")?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target === event.currentTarget || target.closest("[data-parasite-cal-close]")) {
    closeCalendarChooser();
    return;
  }
  const providerBtn = target.closest("[data-parasite-cal-provider]");
  if (!providerBtn) return;
  const provider = providerBtn.getAttribute("data-parasite-cal-provider");
  const payload = pendingCalendarPayload;
  closeCalendarChooser();
  if (!payload) return;
  if (provider === "apple") openAppleCalendar(payload);
  else if (provider === "google") openGoogleCalendar(payload);
});

document.getElementById("copy-card").addEventListener("click", async () => {
  const pet = getCurrentPet();
  if (!pet) return;
  try {
    await copyTextToClipboard(buildEmergencyCopyText(pet));
    showToast(t("toastCopied"));
  } catch {
    showToast(t("toastCopyFail"));
  }
});

document.getElementById("owner-settings-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = readOwnerSettingsForm();
  if (!saveOwnerProfile(profile)) {
    showPersistenceFailure();
    return;
  }
  renderEmergencyOwner();
  showToast(t("toastOwnerSaved"));
  goBack();
});

document.getElementById("e-pet-photo-edit")?.addEventListener("click", () => {
  openEditCurrentPet();
});

document.getElementById("e-pet-photo-input")?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const pet = getCurrentPet();
  if (!pet) return;
  try {
    const raw = await readFileAsDataUrl(file);
    await openPetPhotoCrop(raw, pet.id);
  } catch {
    showToast(t("toastPetPhotoFail"));
  }
});

const langFab = document.getElementById("lang-fab");
const langMenu = document.getElementById("lang-menu");

function closeLangMenu() {
  if (!langMenu || !langFab) return;
  langMenu.hidden = true;
  langFab.setAttribute("aria-expanded", "false");
}

if (langFab && langMenu) {
  langFab.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = langMenu.hidden;
    langMenu.hidden = !open;
    langFab.setAttribute("aria-expanded", open ? "true" : "false");
  });

  langMenu.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-lang]");
    if (!btn) return;
    setLanguage(btn.dataset.lang);
    closeLangMenu();
    showToast(t("langChanged"));
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("#lang-switcher")) return;
    closeLangMenu();
  });
}

let dynamicLanguageRefreshes = 0;
window.onLanguageChange = () => {
  dynamicLanguageRefreshes += 1;
  syncAlertSubmitLabel();
  syncBreedFields();
  petManageBtn.textContent = isManagingPets ? t("done") : t("manage");
  petSwitcherHint.textContent = isManagingPets
    ? t("petHintManage")
    : t("petHint");
  paintPetFormMode();
  // Force picker chrome without full applySelectedPet.
  renderPetPicker();
  // Home (+ active non-home) only; inactive groups stay dirty until go()/flush.
  renderCoordinator.refreshLanguage();
  paintCloudChrome();
  if (app.querySelector('[data-screen="manual"]')?.classList.contains("is-active")) {
    paintManualScreen();
  }
  if (DEMO_MODE && demoTourIndex >= 0) paintDemoTourStep();
  const activeScreen =
    app.querySelector(".screen.is-active")?.dataset.screen || "home";
  if (activeScreen === "parasite") {
    const pet = getCurrentPet();
    if (pet) fillParasiteScreen(pet);
  }
  renderPendingMeds();
  updateMedModeHint();
  if (pendingRemovePetId) setRemoveStep(removeStep);
  const archivePet = getPendingArchivePet();
  if (archivePet) {
    document.getElementById("archive-pet-name").textContent = archivePet.name;
    document.getElementById("archive-pet-meta").textContent =
      `${speciesLabelOf(archivePet)} · ${breedLabelOf(archivePet)} · ${ageLabelOf(
        archivePet
      )}`;
    document.getElementById("archive-pet-sub").textContent = t("archiveSubFor", {
      name: archivePet.name,
    });
  }
  if (selectedLabClinic) {
    setSelectedLabClinic(
      selectedLabClinic.anonymous || selectedLabClinic.id === "anonymous"
        ? getAnonymousClinic()
        : selectedLabClinic
    );
  }
  if (selectedClinic) {
    setSelectedClinic(
      selectedClinic.anonymous || selectedClinic.id === "anonymous"
        ? getAnonymousClinic()
        : selectedClinic
    );
  }
};

/* ---------- Intro + Google Drive backup ---------- */

const googleDriveAuth =
  (typeof PetLiveWeb !== "undefined" && PetLiveWeb.auth && PetLiveWeb.auth.googleDrive) ||
  null;
let cloudBackupTimer = null;
let lastCloudBackupAt = null;
let cloudBusy = false;
let suppressSyncMetaBump = false;
let cloudReconcileState = "idle";
let cloudReconcilePhase = "";
let cloudSyncConflict = false;
let cloudReconcileTimeout = null;

function isSeedOnlyPets(petList) {
  if (!petList?.length) return true;
  if (petList.length !== SEED_PETS.length) return false;
  for (let i = 0; i < SEED_PETS.length; i += 1) {
    if (petList[i]?.id !== SEED_PETS[i]?.id) return false;
  }
  return true;
}

function isSeedOnlyCloudPayload(payload) {
  return isSeedOnlyPets(payload?.pets);
}

function isFreshDevice() {
  if (hasStoredPetsGraph()) return false;
  const meta = readSyncMeta();
  return meta.localRevision === 0 && meta.lastSyncedRevision === 0;
}

function hasRealLocalData() {
  const meta = readSyncMeta();
  if (meta.localRevision > 0) return true;
  if (hasStoredPetsGraph()) {
    try {
      const graph = JSON.parse(localStorage.getItem(PETS_GRAPH_KEY) || "{}");
      if (graph?.pets?.length && !isSeedOnlyPets(graph.pets)) return true;
    } catch {
      /* ignore */
    }
  }
  if (pets.length && !isSeedOnlyPets(pets)) return true;
  return false;
}

function localCloudGraphFingerprint(petList) {
  const first = petList?.[0];
  return `${petList?.length || 0}:${first?.id || ""}`;
}

function cloudPayloadGraphFingerprint(payload) {
  const petList = payload?.pets || [];
  const first = petList[0];
  return `${petList.length}:${first?.id || ""}`;
}

function hasCloudGraphConflict(payload) {
  if (!payload?.pets?.length) return false;
  if (isFreshDevice() || isSeedOnlyPets(pets)) return false;
  if (!hasRealLocalData()) return false;
  return (
    localCloudGraphFingerprint(pets) !== cloudPayloadGraphFingerprint(payload)
  );
}

function isCloudReconcileBusy() {
  return cloudReconcileState === "running";
}

function setCloudReconcileState(next, { phase } = {}) {
  cloudReconcileState = next;
  cloudReconcilePhase = phase || "";
  paintReconcileUi();
}

function paintReconcileUi() {
  const bar = document.getElementById("cloud-reconcile-status");
  if (!bar) return;
  if (FRESH_BOOT && liveGoogleSignedIn() && cloudReconcileState !== "running") {
    bar.hidden = false;
    bar.textContent = t("freshBootHint");
    return;
  }
  if (RESTORE_BOOT && liveGoogleSignedIn() && cloudReconcileState !== "running") {
    bar.hidden = false;
    bar.textContent = t("restoreBootHint");
    return;
  }
  if (
    !liveGoogleSignedIn() ||
    cloudReconcileState === "idle" ||
    cloudReconcileState === "done"
  ) {
    bar.hidden = true;
    bar.textContent = "";
    return;
  }
  bar.hidden = false;
  if (cloudReconcileState === "running") {
    bar.textContent =
      cloudReconcilePhase === "restoring"
        ? t("accountSyncRestoring")
        : t("accountSyncChecking");
  } else if (cloudReconcileState === "error") {
    bar.textContent = t("accountSyncError");
  }
}

function clearSeedPetsFromMemory() {
  if (!pets.length) return;
  if (!isSeedOnlyPets(pets)) return;
  pets.length = 0;
  archivedPets.length = 0;
  currentPetId = null;
  appState.setCurrentPetId(null);
  try {
    petsGraphSlot.write({
      version: 1,
      pets: [],
      archivedPets: [],
      currentPetId: null,
    });
  } catch {
    /* ignore */
  }
  applySelectedPet();
}

function emptySyncMeta() {
  return { localRevision: 0, lastSyncedRevision: 0, lastCloudUpdatedAt: null };
}

function readSyncMeta() {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) {
      try {
        const graphRaw = localStorage.getItem(PETS_GRAPH_KEY);
        if (graphRaw) {
          const graph = JSON.parse(graphRaw);
          if (graph?.pets?.length) {
            return {
              localRevision: 1,
              lastSyncedRevision: 0,
              lastCloudUpdatedAt: null,
            };
          }
        }
      } catch {
        /* ignore */
      }
      return emptySyncMeta();
    }
    const parsed = JSON.parse(raw);
    return {
      localRevision: Number(parsed.localRevision) || 0,
      lastSyncedRevision: Number(parsed.lastSyncedRevision) || 0,
      lastCloudUpdatedAt: parsed.lastCloudUpdatedAt || null,
    };
  } catch {
    return emptySyncMeta();
  }
}

function writeSyncMeta(meta) {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
    return true;
  } catch {
    return false;
  }
}

function isLocalDirty() {
  const meta = readSyncMeta();
  return meta.localRevision !== meta.lastSyncedRevision;
}

function bumpLocalDataRevision() {
  if (DEMO_MODE || suppressSyncMetaBump) return;
  const meta = readSyncMeta();
  meta.localRevision += 1;
  writeSyncMeta(meta);
  if (typeof scheduleCloudBackup === "function") scheduleCloudBackup();
}

function markCloudSynced(cloudUpdatedAt) {
  const meta = readSyncMeta();
  meta.lastSyncedRevision = meta.localRevision;
  if (cloudUpdatedAt) meta.lastCloudUpdatedAt = cloudUpdatedAt;
  writeSyncMeta(meta);
}

function accountSyncStatusText() {
  if (!liveGoogleSignedIn()) return t("accountPlanLocal");
  if (cloudReconcileState === "running") {
    return cloudReconcilePhase === "restoring"
      ? t("accountSyncRestoring")
      : t("accountSyncChecking");
  }
  if (cloudReconcileState === "error") return t("accountSyncError");
  if (cloudSyncConflict) return t("accountSyncConflict");
  if (isLocalDirty()) return t("accountSyncDirty");
  if (readSyncMeta().lastCloudUpdatedAt || lastCloudBackupAt) {
    return t("accountSyncOk");
  }
  if (!hasRealLocalData()) return t("accountSyncFirstBackup");
  return t("accountSyncPending");
}

async function reconcileCloudOnBoot({ silent, skipAutoPull } = {}) {
  if (DEMO_MODE || !googleDriveAuth?.getSession?.().signedIn) return;
  if (skipAutoPull || FRESH_BOOT) {
    cloudSyncConflict = false;
    setCloudReconcileState("done");
    paintCloudChrome();
    return;
  }
  if (cloudReconcileTimeout) {
    clearTimeout(cloudReconcileTimeout);
    cloudReconcileTimeout = null;
  }
  cloudSyncConflict = false;
  setCloudReconcileState("running", { phase: "checking" });
  paintCloudChrome();

  cloudReconcileTimeout = setTimeout(() => {
    if (cloudReconcileState === "running") {
      setCloudReconcileState("error");
      paintCloudChrome();
    }
  }, 15000);

  let didPull = false;
  try {
    if (isFreshDevice() || isSeedOnlyPets(pets)) {
      clearSeedPetsFromMemory();
    }

    const payload = await googleDriveAuth.downloadJson();
    if (!payload || isSeedOnlyCloudPayload(payload)) {
      if (hasRealLocalData()) {
        await pushCloudBackup({ silent: true });
      }
      setCloudReconcileState("done");
      return;
    }

    if (isLocalDirty()) {
      setCloudReconcileState("done");
      return;
    }

    const cloudAt = String(payload.updatedAt || "");
    const lastCloud = String(readSyncMeta().lastCloudUpdatedAt || "");
    const cloudNewer = cloudAt && (!lastCloud || cloudAt > lastCloud);

    if (hasCloudGraphConflict(payload) && !cloudNewer) {
      cloudSyncConflict = true;
      setCloudReconcileState("done");
      return;
    }

    if (cloudNewer) {
      setCloudReconcileState("running", { phase: "restoring" });
      paintCloudChrome();
      suppressSyncMetaBump = true;
      try {
        applyCloudPayload(payload);
        markCloudSynced(cloudAt);
        lastCloudBackupAt = Date.now();
        didPull = true;
        if (!silent) showToast(t("cloudRestoreOk"));
      } finally {
        suppressSyncMetaBump = false;
      }
    }

    setCloudReconcileState("done");
  } catch {
    setCloudReconcileState("error");
  } finally {
    if (cloudReconcileTimeout) {
      clearTimeout(cloudReconcileTimeout);
      cloudReconcileTimeout = null;
    }
    if (didPull || cloudReconcileState === "done") {
      applySelectedPet();
    }
    paintCloudChrome();
  }
}

function stripHeavyMedia(value) {
  if (Array.isArray(value)) return value.map(stripHeavyMedia);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (
      key === "bagPhoto" ||
      key === "rxPhoto" ||
      key === "drugPhoto" ||
      key === "xrayPhotos" ||
      key === "usPhotos" ||
      key === "imaging" ||
      key === "attachmentUrl"
    ) {
      continue;
    }
    if (typeof val === "string" && val.startsWith("data:image") && val.length > 8000) {
      continue;
    }
    out[key] = stripHeavyMedia(val);
  }
  return out;
}

function buildCloudPayload() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    pets: stripHeavyMedia(pets),
    archivedPets: stripHeavyMedia(archivedPets),
    currentPetId: appState.getCurrentPetId(),
    ownerProfile: ownerProfileSlot.read(),
    petAlerts: ownerAlertsSlot.read(),
    suppressedAlerts: suppressedAlertsSlot.read(),
    petPhotos: petPhotosSlot.read(),
    labReports: stripHeavyMedia(labReportsSlot.read()),
  };
}

function applyCloudPayload(payload) {
  if (DEMO_MODE) return false;
  if (!payload || !Array.isArray(payload.pets)) return false;
  if (isSeedOnlyCloudPayload(payload)) return false;
  pets.length = 0;
  archivedPets.length = 0;
  for (const pet of payload.pets) pets.push(pet);
  for (const pet of payload.archivedPets || []) archivedPets.push(pet);
  if (payload.ownerProfile) ownerProfileSlot.write(payload.ownerProfile);
  if (payload.petAlerts) ownerAlertsSlot.write(payload.petAlerts);
  if (payload.suppressedAlerts) suppressedAlertsSlot.write(payload.suppressedAlerts);
  if (payload.petPhotos) petPhotosSlot.write(payload.petPhotos);
  if (payload.labReports) labReportsSlot.write(payload.labReports);
  const nextId =
    payload.currentPetId && pets.some((p) => p.id === payload.currentPetId)
      ? payload.currentPetId
      : pets[0]?.id || null;
  if (nextId) {
    currentPetId = nextId;
    appState.setCurrentPetId(nextId);
  }
  petsGraphSlot.write({
    version: 1,
    pets,
    archivedPets,
    currentPetId: nextId,
  });
  hydratePetPhotos();
  applySelectedPet();
  return true;
}

function setIntroStatus(message) {
  const el = document.getElementById("intro-status");
  if (el) el.textContent = message || "";
}

function closeAccountMenu() {
  const popover = document.getElementById("account-popover");
  if (popover) popover.hidden = true;
  document.querySelectorAll(".js-account-chip").forEach((chip) => {
    chip.setAttribute("aria-expanded", "false");
  });
}

function getAccountSessionForChrome() {
  const live = googleDriveAuth?.getSession?.();
  if (live) return live;
  return {
    configured: false,
    signedIn: false,
    profile: null,
  };
}

function setAccountAvatar(imgEl, fallbackEl, picture, initial) {
  if (imgEl) {
    if (picture) {
      imgEl.src = picture;
      imgEl.hidden = false;
    } else {
      imgEl.removeAttribute("src");
      imgEl.hidden = true;
    }
  }
  if (fallbackEl) {
    fallbackEl.textContent = initial || "?";
    fallbackEl.hidden = Boolean(picture);
  }
}

function positionAccountPopover(anchorChip) {
  const popover = document.getElementById("account-popover");
  if (!popover || !anchorChip) return;
  const rect = anchorChip.getBoundingClientRect();
  const width = Math.min(300, window.innerWidth - 28);
  let left = rect.right - width;
  left = Math.min(Math.max(14, left), window.innerWidth - width - 14);
  popover.style.top = `${Math.max(rect.bottom + 10, 12)}px`;
  popover.style.left = `${left}px`;
  popover.style.right = "auto";
}

function paintAccountMenu(session) {
  const ownerBtn = document.getElementById("owner-settings-btn");
  const homeMenu = document.getElementById("account-menu");
  const chips = document.querySelectorAll(".js-account-chip");
  const popName = document.getElementById("account-popover-name");
  const popEmail = document.getElementById("account-popover-email");
  const popAvatar = document.getElementById("account-popover-avatar");
  const popFallback = document.getElementById("account-popover-fallback");
  const planValue = document.getElementById("account-popover-plan-value");

  const signedIn = Boolean(session?.signedIn);
  if (ownerBtn) ownerBtn.hidden = signedIn;
  if (homeMenu) homeMenu.hidden = !signedIn;
  document.querySelectorAll(".screen-head-actions .account-menu").forEach((el) => {
    el.hidden = !signedIn;
  });

  if (!signedIn) {
    closeAccountMenu();
    return;
  }

  const profile = session.profile || {};
  const email = String(profile.email || "").trim();
  const name = String(profile.name || "").trim();
  const picture = String(profile.picture || "").trim();
  const displayName = name || email || t("accountFallback");
  const initialSource = name || email || t("accountFallback");
  const initial = initialSource.charAt(0).toUpperCase() || "?";

  chips.forEach((chip) => {
    const chipAvatar = chip.querySelector(".account-chip-avatar");
    const chipFallback = chip.querySelector(".account-chip-fallback");
    const chipName = chip.querySelector(".account-chip-name");
    if (chipName) chipName.textContent = displayName;
    chip.setAttribute("aria-label", t("accountChipAria"));
    chip.title = displayName;
    setAccountAvatar(chipAvatar, chipFallback, picture, initial);
  });

  if (popName) popName.textContent = displayName;
  if (popEmail) {
    popEmail.textContent = email;
    popEmail.hidden = !email;
  }
  if (planValue) {
    planValue.textContent = accountSyncStatusText();
  }

  const popSyncBtn = document.getElementById("account-popover-edit");
  const popRestoreBtn = document.getElementById("account-popover-restore");
  const conflictHint = document.getElementById("account-popover-conflict-hint");
  const busy = isCloudReconcileBusy();
  if (popSyncBtn) {
    popSyncBtn.hidden = !signedIn;
    popSyncBtn.disabled = busy;
  }
  if (popRestoreBtn) {
    popRestoreBtn.hidden = !signedIn;
    popRestoreBtn.disabled = busy;
  }
  if (conflictHint) {
    conflictHint.hidden = !cloudSyncConflict || busy;
    conflictHint.textContent = cloudSyncConflict ? t("accountSyncConflictHint") : "";
  }

  setAccountAvatar(popAvatar, popFallback, picture, initial);
}

function liveGoogleSignedIn() {
  return Boolean(googleDriveAuth?.getSession?.().signedIn);
}

function paintCloudChrome() {
  const session = getAccountSessionForChrome();
  const loginBtn = document.getElementById("intro-login-btn");
  const account = document.getElementById("intro-account");
  const avatar = document.getElementById("intro-avatar");
  const originHint = document.getElementById("intro-origin-hint");

  paintAccountMenu(session);
  paintReconcileUi();

  if (loginBtn) loginBtn.hidden = Boolean(session.signedIn);
  if (account) account.hidden = !session.signedIn;
  if (avatar) {
    if (session.profile?.picture) {
      avatar.src = session.profile.picture;
      avatar.hidden = false;
    } else {
      avatar.removeAttribute("src");
      avatar.hidden = true;
    }
  }

  if (originHint) {
    const origin = window.location.origin || "";
    const isLanHttp =
      /^http:\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?$/i.test(origin) ||
      /^http:\/\/[^.]+\.local(:\d+)?$/i.test(origin);
    const isLocalhost =
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    if (!session.configured) {
      originHint.hidden = false;
      originHint.textContent = t("cloudBackupNeedConfig");
    } else if (isLanHttp && !isLocalhost) {
      originHint.hidden = false;
      originHint.textContent = t("oauthLanBlocked", { origin });
    } else {
      originHint.hidden = true;
      originHint.textContent = "";
    }
  }
}

function scheduleCloudBackup() {
  if (DEMO_MODE) return;
  if (!googleDriveAuth?.getSession?.().signedIn) return;
  if (cloudBackupTimer) clearTimeout(cloudBackupTimer);
  cloudBackupTimer = setTimeout(() => {
    cloudBackupTimer = null;
    pushCloudBackup({ silent: true });
  }, 1800);
}

async function pushCloudBackup({ silent } = {}) {
  if (DEMO_MODE) return false;
  if (!googleDriveAuth) return false;
  const session = googleDriveAuth.getSession();
  if (!session.configured) {
    if (!silent) {
      setIntroStatus(t("cloudBackupNeedConfig"));
      showToast(t("cloudBackupNeedConfig"));
    }
    paintCloudChrome();
    return false;
  }
  if (!session.signedIn) {
    if (!silent) setIntroStatus(t("cloudBackupPending"));
    return false;
  }
  if (cloudBusy) return false;
  if (!hasRealLocalData()) {
    if (!silent) showToast(t("accountSyncFirstBackup"));
    paintCloudChrome();
    return false;
  }
  cloudBusy = true;
  try {
    const payload = buildCloudPayload();
    await googleDriveAuth.uploadJson(payload);
    lastCloudBackupAt = Date.now();
    markCloudSynced(payload.updatedAt);
    cloudSyncConflict = false;
    if (!silent) {
      setIntroStatus(t("cloudBackupOk"));
      showToast(t("cloudBackupOk"));
    }
    paintCloudChrome();
    return true;
  } catch {
    if (!silent) {
      setIntroStatus(t("cloudBackupFail"));
      showToast(t("cloudBackupFail"));
    }
    paintCloudChrome();
    return false;
  } finally {
    cloudBusy = false;
  }
}

async function pullCloudBackup({ silent } = {}) {
  if (!googleDriveAuth) return false;
  try {
    const payload = await googleDriveAuth.downloadJson();
    if (!payload) return false;
    suppressSyncMetaBump = true;
    try {
      applyCloudPayload(payload);
      markCloudSynced(payload.updatedAt);
    } finally {
      suppressSyncMetaBump = false;
    }
    lastCloudBackupAt = Date.now();
    cloudSyncConflict = false;
    if (!silent) showToast(t("cloudRestoreOk"));
    paintCloudChrome();
    return true;
  } catch {
    if (!silent) showToast(t("cloudBackupFail"));
    return false;
  }
}

async function handleGoogleSignIn({ enterApp } = {}) {
  if (!googleDriveAuth) {
    setIntroStatus(t("cloudBackupNeedConfig"));
    return;
  }
  if (!googleDriveAuth.getSession().configured) {
    setIntroStatus(t("cloudBackupNeedConfig"));
    showToast(t("cloudBackupNeedConfig"));
    paintCloudChrome();
    return;
  }
  try {
    setIntroStatus("…");
    await googleDriveAuth.signIn();
    const session = googleDriveAuth.getSession();
    setIntroStatus(
      t("cloudSignedInAs", { email: session.profile?.email || "" })
    );
    paintCloudChrome();
    // Enter app immediately after the single login popup.
    if (enterApp !== false) {
      enterAppFromIntro();
    }
    // Silent backup only — never opens another Google popup.
    window.setTimeout(() => {
      Promise.resolve()
        .then(async () => {
          try {
            if (isFreshDevice() || isSeedOnlyPets(pets)) {
              clearSeedPetsFromMemory();
            }
            await reconcileCloudOnBoot({ silent: true, skipAutoPull: FRESH_BOOT });
          } catch {
            /* Drive may need explicit Sync later; do not re-prompt here */
          }
          paintCloudChrome();
        })
        .catch(() => {
          paintCloudChrome();
        });
    }, 400);
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg === "missing_client_id") {
      setIntroStatus(t("cloudBackupNeedConfig"));
    } else if (
      msg.includes("popup_closed") ||
      msg.includes("access_denied") ||
      msg.includes("popup_failed") ||
      msg.includes("auth_timeout")
    ) {
      setIntroStatus(t("cloudLoginCancelled"));
      showToast(t("cloudLoginCancelled"));
    } else {
      setIntroStatus(t("cloudBackupFail"));
      showToast(t("cloudBackupFail"));
    }
    paintCloudChrome();
  }
}

function markIntroSeen() {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

function enterAppFromIntro() {
  markIntroSeen();
  go("home", { replace: true });
}

function initIntroAndCloud() {
  const loginBtn = document.getElementById("intro-login-btn");
  const logoutBtn = document.getElementById("intro-logout-btn");
  const accountPopover = document.getElementById("account-popover");
  const accountPopoverSettings = document.getElementById(
    "account-popover-settings"
  );
  const accountPopoverSync = document.getElementById("account-popover-edit");
  const accountPopoverRestore = document.getElementById(
    "account-popover-restore"
  );
  const accountPopoverHome = document.getElementById("account-popover-home");
  const accountPopoverSwitch = document.getElementById(
    "account-popover-switch"
  );
  const accountPopoverLogout = document.getElementById(
    "account-popover-logout"
  );

  function doSignOut() {
    closeAccountMenu();
    googleDriveAuth?.signOut?.();
    lastCloudBackupAt = null;
    setIntroStatus("");
    paintCloudChrome();
    showToast(t("logout"));
    const introEl = app.querySelector('[data-screen="intro"]');
    if (introEl) go("intro", { replace: true });
    else go("home", { replace: true });
  }

  function openOwnerSettingsFromAccount() {
    closeAccountMenu();
    go("owner-settings");
  }

  function startWithGoogleOrEnter() {
    if (googleDriveAuth?.getSession?.().signedIn) {
      enterAppFromIntro();
      return;
    }
    handleGoogleSignIn({ enterApp: true });
  }

  function toggleAccountMenuFromChip(chip) {
    if (!accountPopover || !chip) return;
    closeAppNavMenu();
    const willOpen = accountPopover.hidden;
    document.querySelectorAll(".js-account-chip").forEach((el) => {
      el.setAttribute("aria-expanded", "false");
    });
    if (willOpen) {
      positionAccountPopover(chip);
      accountPopover.hidden = false;
      chip.setAttribute("aria-expanded", "true");
    } else {
      accountPopover.hidden = true;
    }
  }

  loginBtn?.addEventListener("click", startWithGoogleOrEnter);
  logoutBtn?.addEventListener("click", doSignOut);

  document.addEventListener("click", (event) => {
    const chip = event.target.closest?.(".js-account-chip");
    if (chip) {
      event.stopPropagation();
      toggleAccountMenuFromChip(chip);
      return;
    }
    if (!accountPopover || accountPopover.hidden) return;
    if (event.target.closest("#account-popover")) return;
    closeAccountMenu();
  });

  accountPopoverSettings?.addEventListener("click", openOwnerSettingsFromAccount);
  accountPopoverSync?.addEventListener("click", async () => {
    if (isCloudReconcileBusy()) return;
    closeAccountMenu();
    try {
      await googleDriveAuth?.ensureDriveAccess?.();
    } catch {
      showToast(t("cloudBackupFail"));
      return;
    }
    await pushCloudBackup({ silent: false });
  });
  accountPopoverRestore?.addEventListener("click", async () => {
    if (isCloudReconcileBusy()) return;
    if (!window.confirm(t("accountRestoreConfirm"))) return;
    closeAccountMenu();
    try {
      await googleDriveAuth?.ensureDriveAccess?.();
    } catch {
      showToast(t("cloudBackupFail"));
      return;
    }
    await pullCloudBackup({ silent: false });
  });
  accountPopoverHome?.addEventListener("click", () => {
    closeAccountMenu();
    go("home");
  });
  accountPopoverSwitch?.addEventListener("click", () => {
    closeAccountMenu();
    if (googleDriveAuth) {
      handleGoogleSignIn({ enterApp: false });
    } else {
      showToast(t("accountSwitchPreview"));
    }
  });
  accountPopoverLogout?.addEventListener("click", doSignOut);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!accountPopover || accountPopover.hidden) return;
    closeAccountMenu();
  });

  window.addEventListener("resize", () => {
    if (accountPopover && !accountPopover.hidden) {
      const openChip = document.querySelector(
        '.js-account-chip[aria-expanded="true"]'
      );
      if (openChip) positionAccountPopover(openChip);
    }
  });

  googleDriveAuth?.onSessionChange?.(paintCloudChrome);
  paintCloudChrome();

  // Boot: A (intro) by default → Google login enters B.
  // Already signed in → B. Escape hatch: ?app=1 skips A for local debug.
  // ?demo=1 → B in read-only demo mode (no cloud pull).
  try {
    const params = new URLSearchParams(window.location.search || "");
    const forceApp =
      DEMO_MODE ||
      params.get("app") === "1" ||
      params.get("screen") === "home";
    const intro = app.querySelector('[data-screen="intro"]');
    const home = app.querySelector('[data-screen="home"]');
    const signedIn = Boolean(googleDriveAuth?.getSession?.().signedIn);
    if (intro && home) {
      if (signedIn || forceApp) {
        intro.classList.remove("is-active");
        intro.hidden = true;
        home.hidden = false;
        home.classList.add("is-active");
        markIntroSeen();
      } else {
        home.classList.remove("is-active");
        home.hidden = true;
        intro.hidden = false;
        intro.classList.add("is-active");
      }
    }
  } catch {
    /* ignore */
  }

  if (!DEMO_MODE && googleDriveAuth?.getSession?.().signedIn) {
    reconcileCloudOnBoot({ silent: true, skipAutoPull: FRESH_BOOT });
  }
  // Formal B: never inject prototype seed pets except ?demo=1.
}


/* —— Demo mode (?demo=1): browse-only seed + optional tour —— */

let demoTourIndex = -1;
let demoTourTargetEl = null;

function getDemoTourSteps() {
  return [
    {
      screen: "home",
      selector: "#pet-picker",
      textKey: "demoTourStepPet",
    },
    {
      screen: "home",
      selector: '.cta-row [data-go="emergency"]',
      textKey: "demoTourStepCard",
      allowGo: "emergency",
    },
    {
      screen: "emergency",
      selector: 'button[data-go="timeline"]',
      textKey: "demoTourStepTimeline",
      allowGo: "timeline",
    },
    {
      screen: "home",
      selector: '.cta-row [data-go="add-visit"]',
      textKey: "demoTourStepVisit",
      allowGo: "add-visit",
    },
    {
      screen: "home",
      selector: "#demo-banner",
      textKey: "demoTourStepDone",
    },
  ];
}

function resetDemoSeed() {
  pets.length = 0;
  archivedPets.length = 0;
  for (const pet of cloneSeedPets()) pets.push(pet);
  const nextId = pets[0]?.id || null;
  currentPetId = nextId;
  if (nextId) appState.setCurrentPetId(nextId);
  pendingMeds = [];
  if (typeof clearLiveProofPhotos === "function") clearLiveProofPhotos();
  completingVisitRef = null;
  latestRxUserCollapsed = false;
  hydratePetPhotos();
  applySelectedPet();
  go("home", { replace: true });
  showToast(t("demoResetDone"));
}

function clearDemoTourHighlight() {
  demoTourTargetEl?.classList.remove("demo-tour-target");
  demoTourTargetEl = null;
  const spot = document.getElementById("demo-tour-spot");
  if (spot) spot.hidden = true;
}

function positionDemoTourSpot(el) {
  const spot = document.getElementById("demo-tour-spot");
  if (!spot || !el) {
    if (spot) spot.hidden = true;
    return;
  }
  const rect = el.getBoundingClientRect();
  const pad = 8;
  spot.hidden = false;
  spot.style.top = `${Math.max(0, rect.top - pad)}px`;
  spot.style.left = `${Math.max(0, rect.left - pad)}px`;
  spot.style.width = `${rect.width + pad * 2}px`;
  spot.style.height = `${rect.height + pad * 2}px`;
}

function endDemoTour({ markSeen = true } = {}) {
  demoTourIndex = -1;
  clearDemoTourHighlight();
  const overlay = document.getElementById("demo-tour");
  if (overlay) overlay.hidden = true;
  document.body.classList.remove("demo-tour-active");
  if (markSeen) {
    try {
      sessionStorage.setItem(DEMO_TOUR_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }
}

function paintDemoTourStep() {
  const steps = getDemoTourSteps();
  const overlay = document.getElementById("demo-tour");
  const textEl = document.getElementById("demo-tour-text");
  const stepEl = document.getElementById("demo-tour-step");
  const nextBtn = document.getElementById("demo-tour-next");
  if (!overlay || demoTourIndex < 0) return;

  if (demoTourIndex >= steps.length) {
    endDemoTour();
    return;
  }

  const step = steps[demoTourIndex];
  clearDemoTourHighlight();
  if (step.screen) go(step.screen, { replace: true });

  window.requestAnimationFrame(() => {
    const target = step.selector
      ? document.querySelector(step.selector)
      : null;
    if (target) {
      demoTourTargetEl = target;
      target.classList.add("demo-tour-target");
      target.scrollIntoView({ block: "nearest", behavior: "smooth" });
      positionDemoTourSpot(target);
    } else {
      positionDemoTourSpot(null);
    }
    if (textEl) textEl.textContent = t(step.textKey);
    if (stepEl) {
      stepEl.textContent = t("demoTourProgress", {
        current: String(demoTourIndex + 1),
        total: String(steps.length),
      });
    }
    if (nextBtn) {
      nextBtn.textContent =
        demoTourIndex >= steps.length - 1 ? t("demoTourDone") : t("demoTourNext");
    }
    overlay.hidden = false;
    document.body.classList.add("demo-tour-active");
  });
}

function startDemoTour() {
  if (!DEMO_MODE) return;
  demoTourIndex = 0;
  paintDemoTourStep();
}

function advanceDemoTour() {
  if (demoTourIndex < 0) return;
  demoTourIndex += 1;
  paintDemoTourStep();
}

function initDemoMode() {
  if (!DEMO_MODE) return;

  document.documentElement.classList.add("is-demo-mode");
  document.body.classList.add("is-demo-mode");

  const banner = document.getElementById("demo-banner");
  if (banner) banner.hidden = false;

  document.getElementById("demo-reset-btn")?.addEventListener("click", () => {
    endDemoTour({ markSeen: false });
    resetDemoSeed();
  });
  document.getElementById("demo-tour-btn")?.addEventListener("click", () => {
    startDemoTour();
  });
  document.getElementById("demo-tour-skip")?.addEventListener("click", () => {
    endDemoTour();
  });
  document.getElementById("demo-tour-next")?.addEventListener("click", () => {
    advanceDemoTour();
  });

  window.addEventListener(
    "resize",
    () => {
      if (demoTourTargetEl) positionDemoTourSpot(demoTourTargetEl);
    },
    { passive: true }
  );

  document.addEventListener(
    "submit",
    (event) => {
      if (!DEMO_MODE) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      notifyDemoReadOnly();
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      if (!DEMO_MODE) return;
      const writeBtn = event.target.closest?.(
        "#save-photo-rx-btn, #photo-crop-save, [data-parasite-dosed]"
      );
      if (!writeBtn) return;
      if (writeBtn.closest("#demo-banner, #demo-tour")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      notifyDemoReadOnly();
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      if (!DEMO_MODE || demoTourIndex < 0) return;
      if (event.target.closest("#demo-tour, #demo-banner")) return;
      const steps = getDemoTourSteps();
      const step = steps[demoTourIndex];
      const target = demoTourTargetEl;
      const onTarget = target && target.contains(event.target);
      if (onTarget) {
        const goTo = event.target
          .closest?.("[data-go]")
          ?.getAttribute("data-go");
        if (step?.allowGo && goTo === step.allowGo) {
          window.setTimeout(() => advanceDemoTour(), 280);
        }
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );

  let tourSeen = false;
  try {
    tourSeen = sessionStorage.getItem(DEMO_TOUR_SEEN_KEY) === "1";
  } catch {
    tourSeen = false;
  }
  if (!tourSeen) {
    window.setTimeout(() => startDemoTour(), 480);
  }
}


applyI18n();
syncAlertSubmitLabel();
syncBreedFields();
syncDateProxies();
hydratePetPhotos();
applySelectedPet();
setMedEntryMode("photo");
setMedUnitChip("unrecorded");
setMedFreqChip("unrecorded");
enhanceGlassScreenHeads();
applyI18n();
initAppNavMenu();
initIntroAndCloud();
initDemoMode();

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  closeAppNavMenu();
  closeAccountMenu();
  resetPageScroll();
  if (app.querySelector('[data-screen="home"]')?.classList.contains("is-active")) {
    resetPetPickerScroll();
  }
});

PetLiveWeb.metrics = {
  getSnapshot() {
    return {
      renders: renderCoordinator.getMetrics(),
      storage: {
        ownerAlerts: ownerAlertsSlot.getStats(),
        suppressedAlerts: suppressedAlertsSlot.getStats(),
        petPhotos: petPhotosSlot.getStats(),
        labReports: labReportsSlot.getStats(),
        ownerProfile: ownerProfileSlot.getStats(),
        petsGraph: petsGraphSlot.getStats(),
      },
      i18n: { dynamicLanguageRefreshes },
      timelineHtmlBytes: timelineList?.innerHTML.length || 0,
      petSelectionPaintSamples: [...petSelectionPaintSamples],
    };
  },
};
