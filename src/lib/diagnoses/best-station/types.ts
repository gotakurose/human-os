// ── L2: 基礎環境要件 (E01-E07) ─────────────────────────────────────────────
export interface EnvironmentNeeds {
  E01: number;        // 刺激必要量
  E02: number;        // 回復環境必要量
  E03: number;        // 生活摩擦回避度
  E04: number;        // 活動接続必要量
  E05: number;        // 生活圏対人距離 (0=匿名 100=地域接続)
  E06: number;        // 即応性欲求
  E07: number;        // 住空間優先度
}

// ── L3: 環境耐性 (T01-T07) ─────────────────────────────────────────────────
export interface EnvironmentTolerances {
  T01: number;        // 騒音耐性
  T02: number;        // 混雑・高密度耐性
  T03: number;        // 孤立耐性
  T04: number;        // 生活不便耐性
  T05: number;        // 反復移動耐性
  T06: number;        // 狭小空間耐性
  T07: number;        // 地域干渉耐性
}

// ── L4: 現在の生活行動 (B01-B08) ───────────────────────────────────────────
export interface BehaviorIndicators {
  B01: number;                      // 自宅中心度
  B02: number;                      // 自宅機能負荷
  B03: number;                      // 外部活動頻度
  B04: number;                      // 近隣生活圏利用率
  B05: number;                      // 目的地型都市利用率
  B06: number;                      // 夜間活動率
  B07: number;                      // 日常移動範囲
  B08: number;                      // 反復移動曝露量
}

// ── L5A: 本人が選びたがる環境 (I01-I07) ────────────────────────────────────
export type IValue = 100 | 0 | null;   // must_have=100, compromise=0, unobserved=null
export interface IdealEnvironment {
  I01: IValue;        // 街の活気・刺激がある
  I02: IValue;        // 静けさ・緑・余白がある
  I03: IValue;        // 日常生活がすぐ済む
  I04: IValue;        // 飲食・文化・娯楽へ近い
  I05: IValue;        // 地域とのつながりがある
  I06: IValue;        // 思い立った時に動ける
  I07: IValue;        // 広さ・収納・設備を得やすい
}

// ── L5B: 街選び動機 (D01-D06) ──────────────────────────────────────────────
export interface MotiveIndicators {
  D01: number;        // 住所・地名自己演出
  D02: number;        // 都会離脱不安
  D03: number;        // 選択肢保有執着
  D04: number;        // コスト最小化執着
  D05: number;        // 現状維持・変化回避
  D06: number;        // 理想自己投影
}

// ── L1: 経済派生値 (F01-F05) ───────────────────────────────────────────────
export interface EconomicFactors {
  F01: number | null;   // 支払可能性 (budgetTier 1-10)
  F02: number | null;   // 住居費圧迫度
  F03: number | null;   // 支援・安全網レベル
  F04: string | null;   // 住居費価値整合傾向
  F05: number | null;   // 住居投資不足リスク
}

// ── L6: 派生ギャップ指標 (G01-G13) ────────────────────────────────────────
export interface GapIndicators {
  G01: number;   // 理想環境乖離 (I vs E distance)
  G02: number;   // 現在地適合度 (E vs current env)
  G03: number;   // 現在負荷超過 (current loads vs T)
  G04: number;   // 言行不一致度 (intent vs B)
  G05: number;   // 街の実利用率
  G06: number;   // 使わない利便性課金
  G07: number;   // 住居費無理度
  G08: number;   // 住居費価値整合度
  G09: number;   // 過剰節約リスク
  G10: number;   // 通勤消耗度
  G11: number;   // 現状維持固定度
  G12: number;   // 総合無理発生リスク
  G13: number;   // 推薦受容ギャップ (set after matching)
}

// ── 現実条件 (L1 raw) ───────────────────────────────────────────────────────
export interface RealityConditions {
  currentPrefectureCode: string | null;
  currentAreaType: string | null;
  currentNoiseBand: string | null;
  currentDensityBand: string | null;
  currentConvenienceBand: string | null;
  housingType: string | null;
  householdType: string | null;
  totalHousingCostBand: string | null;
  personalHousingCostBand: string | null;
  personalIncomeBand: string | null;
  costSharing: string | null;
  supportStability: string | null;
  currentStatus: string | null;
  commuteDaysPerWeek: number | null;
  oneWayTravelTime: number | null;
  transferCount: number | null;
  primaryTokyoDestinationZone: string | null;
  secondaryTokyoDestinationZones: string[];
}

// ── 人物プロファイル ─────────────────────────────────────────────────────────
export interface PersonProfile {
  E: EnvironmentNeeds;
  T: EnvironmentTolerances;
  B: BehaviorIndicators;
  I: IdealEnvironment;
  D: MotiveIndicators;
  F: EconomicFactors;
  G: GapIndicators;
  reality: RealityConditions;
  reasonTags: string[];
  warningTags: string[];
  confidence: number;           // 0-100
  specVersion: string;
}

// ── 駅データ ─────────────────────────────────────────────────────────────────
export interface StationBenefits {
  stimulation: number;
  recovery: number;
  convenience: number;
  activity: number;
  community: number;
  spontaneity: number;
  space: number;
}

export interface StationLoads {
  noise: number;
  crowd: number;
  isolation: number;
  inconvenience: number;
  small_space: number;
  intrusion: number;
}

export interface Station {
  stationId: string;
  stationName: string;
  active: boolean;
  archetypeId: string;
  stationTypeLabel: string;
  accessGroup: string;
  hubLevel: number;
  recognition: number;
  benefits: StationBenefits;
  loads: StationLoads;
  rentTier: number;
  destinationZonePenalty: Record<string, number>;
  resultLine: string;
  dataStatus: string;
}

// ── マッチング結果 ────────────────────────────────────────────────────────────
export interface StationMatchBreakdown {
  benefitShortfall: number;
  loadOverrun: number;
  economicPenalty: number;
  destinationPenalty: number;
  totalScore: number;
}

export interface StationMatchResult {
  station: Station;
  breakdown: StationMatchBreakdown;
  reasonTags: string[];
  warningTags: string[];
}

// ── 惹かれやすいが無理が出やすい駅 ─────────────────────────────────────────────
export interface TemptingMismatchStation {
  station: Station;
  breakdown: StationMatchBreakdown;
  aspirationAffinity: number;   // 0-100 (観測済みI必須項目と駅便益の一致度)
  actualMismatch: number;       // 0-100 (100 - totalScore)
  coverage: number;             // 0-1 (観測済みI項目数 / 7)
  reasonTags: string[];
  warningTags: string[];
}

// ── 診断最終結果 ──────────────────────────────────────────────────────────────
export interface DiagnosisResult {
  primary: StationMatchResult;
  alternatives: [StationMatchResult, StationMatchResult];
  temptingMismatch: TemptingMismatchStation | null;
  profile: PersonProfile;
  dataVersion: string;
  specVersion: string;
  timestamp: number;
}

// ── sessionStorage ペイロード ─────────────────────────────────────────────────
export interface SessionPayload {
  schemaVersion: string;
  diagnosisVersion: string;
  rawAnswers: Record<string, unknown>;
  result: DiagnosisResult | null;
}

// ── 質問定義 ──────────────────────────────────────────────────────────────────
export interface QuestionOption {
  value: string | number | null;
  label: string;
  band?: number | null;
}

export interface DualBucketItem {
  metric: string;
  label: string;
}

export interface QuestionField {
  fieldId: string;
  type: "single_select" | "multi_select" | "segmented" | "prefecture_select" | "dual_bucket_rank";
  required: boolean;
  options?: QuestionOption[];
  items?: DualBucketItem[];
  maxSelections?: number;
  mustHaveCount?: number;
  compromiseCount?: number;
  source?: string;
  layer?: string;
  metric?: string;
  metrics?: string[];
  scoring?: { mode: string; weight?: number } | null;
  [key: string]: unknown;
}

export interface QuestionStep {
  stepId: string;
  section: string;
  title: string;
  subtitle: string;
  required: boolean;
  fields: QuestionField[];
}
