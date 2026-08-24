# Pet Health Passport — 跨模組介面定義（Contracts v0.2）

> 本文件是所有模組之間溝通的「唯一真相來源」。
> 任何模組**不得**自行變更本文件定義的欄位名稱、型別或關聯方式。
> 若需新增欄位，必須先改此文件，再改模組／UI。
>
> 版本策略：MVP／驗證原型。刻意不含：
> - 信任分級存取控制、hash 鎖定、獸醫／醫院身份驗證
> - Petlive 自建雲端物件儲存（照片與紀錄以**飼主裝置**為主；之後可綁信箱／iCloud）
>
> v0.2 對齊已上畫面的：調劑分組、先拍照後補藥名、醫療警示來源、疫苗燈號、寄生蟲預防、本機照片壓縮。

---

## 0. 共用型別（Shared Types）

```typescript
// packages/db-schema/shared-types.ts

type UUID = string;
type ISODate = string;      // "2026-08-09"
type ISODateTime = string;  // "2026-08-09T14:30:00Z"

/** UI 顯示用來源；clinic_staff 已由 clinic_ref 取代（僅供參考，非正式核可） */
type InputSource = 'owner' | 'owner_proof' | 'clinic_ref';

type NeuterStatus = 'yes' | 'no' | 'unknown';

type SymptomTag =
  | 'eye'                 // 眼睛
  | 'ear'                 // 耳朵
  | 'dental'              // 牙科／口腔
  | 'respiratory'         // 呼吸道
  | 'gastrointestinal'   // 腸胃
  | 'urinary'             // 泌尿
  | 'dermatology'         // 皮膚
  | 'orthopedic'          // 骨科
  | 'neurology'           // 神經
  | 'autoimmune'          // 自體免疫
  | 'checkup'             // 健康檢查
  | 'vaccine';            // 疫苗

type MedicationStatus = 'complete' | 'pending_drug_name';
type MedicationKind = 'single' | 'compound_ingredient' | 'compound_bundle' | 'photo_bundle';
type CompoundForm =
  | 'liquid_a' | 'liquid_b' | 'liquid_c'
  | 'capsule_a' | 'capsule_b' | 'capsule_c';

type VaccineProtectionStatus = 'protected' | 'approaching' | 'expired';
type ParasiteKind = 'external' | 'heartworm';
type ParasiteSlotStatus = 'protected' | 'approaching' | 'unprotected' | 'optional';

type AlertSource = 'linked' | 'owner';
type AlertSeverity = 'critical' | 'caution';
```

### 用色：四層警覺梯度（不是裝飾色）

顏色對應「看到當下該有的反應速度」。品牌葉綠不當狀態燈。

| 層級 | 用途 | Token | Hex |
|---|---|---|---|
| 危險（唯一用紅） | 藥物過敏、不良反應、疫苗反應 | `--alert` | `#c23b3b` |
| 需留意 | 疫苗／驅蟲已到期、慢性病等 caution 警示 | `--macaron-rose` / `--status-rose` | `#e8a0a0` |
| 快到期 | 疫苗 90 天內、驅蟲 7 天內 | `--status-apricot` | `#e8a868` |
| 安全 | 保護中、無異常 | `--status-mint` | `#5fbf95` |

輔色（溫度，不當狀態）：

| Token | Hex | 用途 |
|---|---|---|
| `--beige` | `#f2e8d8` | caution 警示卡底、溫和提醒 |
| `--milktea` | `#b98f5e` | 飼主記錄印章墨色、佐證元件邊框 |
| `--sun` | `#e8a83d` | 「剛投藥（今天）」等完成動作小強調 |

### 本機儲存與照片（原型／飼主端）

- 結構化資料存在飼主裝置（記憶體種子 + `localStorage`／之後 IndexedDB）。不上傳到 Petlive 主機。
- 頭像：最長邊約 **480px** JPEG。
- 藥袋／藥單／藥物佐證：最長邊約 **1280px** JPEG（不可把相機原圖原封存進記憶體）。
- `attachmentUrl` 等「URL」在本機階段可為 data URL 或之後的裝置檔案路徑，**不是**必須的 S3 網址。

---

## 1. Pet Module

### 對外暴露的資料型別

```typescript
interface Pet {
  id: UUID;
  ownerId?: UUID;            // 原型可省略；之後綁信箱／iCloud 再填
  name: string;              // 飼主自訂暱稱，不隨 UI 語系翻譯
  species: 'dog' | 'cat' | 'other';
  breedKey?: string;         // 品種選單穩定鍵（如 mixed、shiba）；自訂則為自訂標記
  breed: string;             // 顯示／自訂文字；切語系時優先用 breedKey 重算
  gender: 'male' | 'female' | 'unknown';
  isNeutered: NeuterStatus;
  birthDate: ISODate;        // 年齡標籤由生日 + 語系重算，勿快取「3 歲」字串當真相
  chipNumber?: string;
  photo?: string;            // 本機頭像（壓縮後）
  createdAt?: ISODateTime;
}

interface PetWeight {
  id: UUID;
  petId: UUID;
  weight: number;             // 單位固定為 kg，不接受其他單位
  recordedDate: ISODate;
  sourceVisitId?: UUID;       // 若此筆體重來自某次就診，記錄關聯
}
```

### 對其他模組提供的介面（Pet Module 必須實作）

```typescript
// 其他模組只能透過這些函式取得 Pet 資料，不可直接查詢 Pet 的資料表
getPetById(petId: UUID): Pet;
getLatestWeight(petId: UUID): PetWeight | null;
getWeightHistory(petId: UUID): PetWeight[];
```

### 依賴關係
- **不依賴**任何其他模組。這是最底層的積木，其他模組都依賴它。
- 因此 Pet Module 建議**第一個開工、第一個合併**。

---

## 2. Drug Database（藥品標準化資料庫）

### 對外暴露的資料型別

```typescript
interface Drug {
  id: UUID;
  genericName: string;         // 學名，例如 Prednisolone
  brandNameZh?: string;        // 中文商品名，例如 普力松
  brandNameEn?: string;        // 英文商品名
  drugClass: string;           // 藥物分類，例如 "類固醇"
  commonAliases: string[];     // 搜尋別名，例如 ["Pred", "普力", "類固醇"]

  // —— 藥品說明／警語（MVP 新增；僅供參考，不取代獸醫師與藥袋標示）——
  purpose: string;             // 用途簡述，例如「抗發炎、免疫抑制」
  commonSideEffects: string[]; // 常見副作用（飼主可觀察的一般描述）
  precautions: string[];       // 使用警語／注意事項
}
```

### 顯示規則（給 Frontend Agent）
- 選取標準藥品後，必須顯示：`drugClass`、`purpose`、常見副作用、使用警語。
- 必須附帶固定免責：「僅供參考，不取代獸醫師說明與藥袋標示。」
- 此資訊只做顯示，不做診斷、不做劑量建議、不做自動停藥判斷。

### 對其他模組提供的介面

```typescript
searchDrugs(query: string): Drug[];   // 支援中英文、縮寫、分類、用途搜尋
getDrugById(drugId: UUID): Drug;
```

### 依賴關係
- 不依賴其他模組。
- Medication Module 依賴它。
- 建議與 Pet Module 同時、優先開工（兩者都是被依賴最多的底層積木）。

---

## 3. Visit Module（就診紀錄）

### 對外暴露的資料型別

```typescript
interface Visit {
  id: UUID;
  petId: UUID;
  visitDate: ISODate;
  clinicId?: string;           // 預設院所 id（c1…）；專有名不翻譯
  clinicName: string;
  weightAtVisit?: number;      // kg；有值時同步 PetWeight
  symptomTags: SymptomTag[];   // 存 key，顯示時 i18n
  notes?: string;              // 飼主／示範文案；示範可為多語物件，飼主輸入不翻譯
  bagPhoto?: string;           // 本機壓縮圖
  rxPhoto?: string;
  drugPhoto?: string;
  createdBy?: UUID;
  createdAt?: ISODateTime;
}
```

### 對其他模組提供的介面

```typescript
getVisitsByPetId(petId: UUID): Visit[];   // 依 visitDate 排序，供 Timeline 使用
getVisitById(visitId: UUID): Visit;
```

### 建立 Visit 時的行為規則（給 Backend Agent）
- 建立 Visit 時，`weightAtVisit` 必須同步寫入一筆 `PetWeight`（`sourceVisitId` 指向此 Visit）。
- 不可讓 Visit 與 PetWeight 的體重資料不一致。

### 依賴關係
- 依賴 Pet Module（`petId` 必須是存在的 Pet）。
- Medication Module 依賴它（每筆用藥掛在某次 Visit 下）。

---

## 3.1 Lab Report Module（檢驗報告）

> 飼主裝置上的原件存檔。急診卡只讀列表，不擁有此資料表。不存數值、參考區間或 H/L。

```typescript
type LabReportType =
  | 'blood'       // 血液／CBC
  | 'chemistry'   // 生化
  | 'urine'       // 尿液
  | 'fecal'       // 糞便
  | 'snap'        // 快篩／SNAP
  | 'other';

interface LabReport {
  id: UUID;
  petId: UUID;
  reportDate: ISODate;
  types: LabReportType[];     // 可複選；顯示時 i18n
  clinicId?: string;          // 預設院所 id；專有名不翻譯
  clinicName?: string;
  /** Prototype visits often lack id; link only when the owner picks a visit. */
  visitDate?: ISODate;
  visitClinicId?: string;
  notes?: string;             // 飼主輸入，不翻譯
  photos: string[];           // 本機壓縮圖；至少一張才可存成 owner_proof
  source: InputSource;        // 有照片時 owner_proof
  createdAt?: ISODateTime;
}
```

```typescript
getLabReportsByPetId(petId: UUID): LabReport[];  // 依 reportDate 新到舊
```

- 依賴 Pet。可選關聯 Visit（`visitDate` + `visitClinicId`／院所名）。
- Emergency Card 可讀取以更新按鈕副標與開啟列表；不把報告正文塞進急診卡。
- 本機 key 與藥單／頭像照片分開。相機原圖須壓縮後再存。

---

## 4. Medication Module（用藥紀錄）

> 這是整個專案最核心、風險最高的模組，欄位定義務必嚴格遵守。

### 對外暴露的資料型別

```typescript
interface Medication {
  id: UUID;
  visitId: UUID;
  kind: MedicationKind;         // 預設 single
  status: MedicationStatus;     // 預設 complete

  drugId: UUID | null;
  unrecognizedDrugName?: string;

  dosageAmount?: number;        // complete 時必填 > 0
  dosageUnit?: 'mg' | 'ml' | 'tablet' | 'unknown';
  // omit / empty = 未紀錄（表單預設）；'unknown' = 飼主標示單位未知
  frequency?: string;           // SID | BID | TID | EOD
  durationDays?: number;
  startDate?: ISODate;          // 急診「未到期」用；缺則用 Visit.visitDate

  inputSource: InputSource;
  hasDisclaimer?: boolean;      // 可由 inputSource === 'owner_proof' | 'clinic_ref' 推導

  bagPhoto?: string;
  rxPhoto?: string;
  drugPhoto?: string;
  attachmentUrl?: string;       // 舊欄位；新資料用分項照片

  // —— 調劑（同一餵食單位）——
  compoundForm?: CompoundForm;
  compoundColor?: string;       // #RRGGBB，飼主可改晶片色
  compoundGroup?: string;       // 草稿分組鍵
  ingredients?: Array<{         // kind === compound_bundle 時
    name: string;
    dose?: string;
    source?: InputSource;
  }>;

  createdAt?: ISODateTime;
}
```

### 顯示標籤邏輯（純顯示，不影響權限）

| inputSource | 顯示標籤 |
|---|---|
| owner | 「飼主自行記錄」 |
| owner_proof | 「飼主記錄（有藥單佐證）」 |
| clinic_ref | 「動物醫院協助記錄，僅供參考」 |

### 驗證規則

**`status === 'complete'`（結構化藥名已填）**
- `dosageAmount` > 0；`dosageUnit` 為 enum；`durationDays` 為正整數
- `drugId` 與 `unrecognizedDrugName` 不可同時有值
- 兩者至少一個：有 `drugId`，或非空 `unrecognizedDrugName`

**`status === 'pending_drug_name'`（先拍佐證／待補藥名）**
- 允許 `drugId` 與 `unrecognizedDrugName` 皆空
- 劑量欄位可缺；急診「目前用藥」**不列入**此狀態
- `kind` 可為 `photo_bundle`

**調劑**
- 多筆藥可掛同一 `compoundForm`（藥水 A／膠囊 A…）成為一個餵食單位
- `compound_bundle` 是顯示用彙整，不取代各成分列；結束日以該組課程計算

### 對其他模組提供的介面

```typescript
getMedicationsByVisitId(visitId: UUID): Medication[];
getMedicationHistory(petId: UUID): Medication[];   // 內部會先查 Visit，再彙整
```

### 依賴關係
- 依賴 Visit Module、Drug Database。
- Emergency Card Module 依賴它。

---

## 5. Medical Alert Module（醫療警示）

### 對外暴露的資料型別

```typescript
interface MedicalAlert {
  id: UUID;
  petId: UUID;
  alertType: 'drug_allergy' | 'food_allergy' | 'vaccine_reaction'
           | 'adverse_drug_reaction' | 'chronic_disease' | 'special_note';
  source: AlertSource;          // linked = 紀錄／示範串接；owner = 飼主自訂
  severity: AlertSeverity;      // 顯示用；不由類型硬鎖，飼主可改
  description: string;
  severityNote?: string;
  sinceDate?: ISODate | `${number}-${number}`; // 慢性病：大約開始控制時間（YYYY-MM 或日）
  createdAt?: ISODateTime;
}
```

**預設 severity（類型只給預設，顏色跟 severity 走）：**

| alertType | 預設 | 樣式 |
|---|---|---|
| drug_allergy / adverse_drug_reaction / vaccine_reaction | `critical` | `--alert` 紅 |
| food_allergy / chronic_disease / special_note | `caution` | `--beige` 底 |

- 急診與警示清單同源。排序：過敏／反應 → 慢性病 → 飼主注意。
- 飼主自訂必須標 `owner`，不可顯示成醫院確診。
- 舊值 `high` 視為 `critical`。

### 對其他模組提供的介面

```typescript
getAlertsByPetId(petId: UUID): MedicalAlert[];
```

### 依賴關係
- 依賴 Pet Module。
- Emergency Card Module 依賴它（且優先權最高，急診時第一眼要看到這個）。

---

## 6. Vaccine Module（疫苗管理）

```typescript
interface VaccineRecord {
  id: UUID;
  petId: UUID;
  vaccineKey?: string;          // 預設鍵（v5in1、vRabies…）；自訂名可空
  vaccineName: string;          // 有 key 時顯示用 i18n 重算
  administeredDate: ISODate;
  nextDueDate?: ISODate;
  visitId?: UUID;
}

/** 計算欄位，不要當獨立寫入真相（以免獸醫端與飼主端燈號不一致） */
function getVaccineProtectionStatus(nextDueDate?: ISODate): VaccineProtectionStatus | null {
  // 無 nextDueDate → null（尚未設定）
  // daysUntil(nextDueDate) <= 0 → 'expired'     紅
  // daysUntil(nextDueDate) <= 90 → 'approaching' 橘
  // else → 'protected'                           綠
}
```

```typescript
getVaccinesByPetId(petId: UUID): VaccineRecord[];
getUpcomingVaccineReminders(petId: UUID): VaccineRecord[];
getVaccineProtectionStatus(nextDueDate?: ISODate): VaccineProtectionStatus | null;
```

- 同一保護線（如核心多合一）較新一針可銜接較舊一針（supersede），燈號看「目前有效那筆」。
- 依賴 Pet；可選 Visit。

---

## 6b. Parasite Prevention Module（寄生蟲預防）

與 Vaccine 分開：體外驅蟲／心絲蟲各一槽，有產品鍵、間隔天、下次日、可匯出行事曆。

```typescript
interface ParasiteRecord {
  productKey?: string;          // 目錄鍵（ppFrontline…）；自訂則空
  product?: string;             // 自訂產品名
  lastGiven?: ISODate;
  intervalDays: number;         // 預設隨產品（常 30／365）
  nextDue?: ISODate;
}

interface ParasitePrevention {
  external: ParasiteRecord | null;
  heartworm: ParasiteRecord | null;
}
```

燈號（計算，不存）：
- 無 `nextDue`：犬 → `unprotected`；貓之心絲蟲 → `optional`（未設不警報）
- `daysUntil(nextDue) <= 0` → `unprotected`
- `daysUntil(nextDue) <= 7` → `approaching`
- 否則 → `protected`

雙效產品（同時 covers external + heartworm）寫入一側時可同步另一側。

```typescript
getParasitePrevention(petId: UUID): ParasitePrevention;
getParasiteSlotStatus(pet: Pet, kind: ParasiteKind): ParasiteSlotStatus;
```

依賴 Pet。Emergency／首頁條可讀取，但不取代疫苗燈號。

---

## 7. Emergency Card Module（急診資訊卡）

> 這個模組**不擁有自己的資料表**，純粹是彙整其他模組資料的「唯讀視圖」。

```typescript
interface OwnerProfile {           // 本機；之後可隨 iCloud／信箱走
  name: string;
  phone: string;
  email?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  address?: string;
}

interface EmergencyCardData {
  pet: Pet;
  latestWeight: PetWeight | null;
  alerts: MedicalAlert[];
  currentMedications: Medication[];  // 僅 status=complete 且課程未到期（含結束日當天）
  vaccinesSummary?: { nextDue?: ISODate; status?: VaccineProtectionStatus };
  parasiteSummary?: ParasitePrevention;
  ownerContact: OwnerProfile;
  generatedAt: ISODateTime;
}
```

```typescript
generateEmergencyCard(petId: UUID): EmergencyCardData;
// getPetById → getLatestWeight → getAlertsByPetId
// → getMedicationHistory（complete + 未到期）→ 疫苗／寄生蟲摘要 → OwnerProfile
```

依賴：Pet、Medical Alert、Medication；可讀 Vaccine、Parasite、OwnerProfile。最後組裝。

---

## 8. 模組開工與合併順序建議

```
第一批： Pet Module、Drug Database、OwnerProfile（本機）
第二批： Visit、Medical Alert、Vaccine、Parasite Prevention
第三批： Medication（含 pending_drug_name、compound、photo_bundle）
第四批： Emergency Card、Timeline
```

合併回主分支時，請依照上述批次順序合併，避免下游模組合併時發現上游介面尚未穩定。

---

## 9. 給 QA Agent 的提醒

以下情境務必寫成自動化測試，不依賴人工判斷：
1. Medication `complete` 的欄位／enum 驗證；`pending_drug_name` 允許無藥名
2. Visit 有體重時是否同步 PetWeight
3. Emergency Card 只列 complete 且未到期用藥（結束日當天仍算未到期）
4. Drug 搜尋：中文／英文／別名命中同一筆
5. `getVaccineProtectionStatus`：>90 綠、≤90 且未過期橘、≤0 紅
6. 貓未設心絲蟲為 optional，不當作 unprotected 警報

---

*本文件版本：v0.2 — 對齊驗證原型 UI。第二階段（獸醫端、iCloud 同步）另擴充，不在此假裝已有雲端相簿。*
