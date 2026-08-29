import { z } from "zod";

// ── 都道府県 ──────────────────────────────────────────────────────────────────
export const PrefectureSchema = z.object({
  code: z.string().regex(/^\d{2}$/),
  name: z.string().min(1),
});
export const RegionSchema = z.object({
  regionId: z.string().min(1),
  label: z.string().min(1),
  prefectures: z.array(PrefectureSchema),
});
export const PrefecturesDataSchema = z.object({
  schemaVersion: z.string(),
  answerKey: z.string(),
  selectionMode: z.string(),
  uiMode: z.string(),
  notes: z.array(z.string()),
  regions: z.array(RegionSchema),
});

// ── 目的地ゾーン ──────────────────────────────────────────────────────────────
export const DestinationZoneSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});
export const DestinationZonesDataSchema = z.object({
  schemaVersion: z.string(),
  zones: z.array(DestinationZoneSchema),
});

// ── 駅データ ──────────────────────────────────────────────────────────────────
export const StationBenefitsSchema = z.object({
  stimulation: z.number().min(0).max(100),
  recovery: z.number().min(0).max(100),
  convenience: z.number().min(0).max(100),
  activity: z.number().min(0).max(100),
  community: z.number().min(0).max(100),
  spontaneity: z.number().min(0).max(100),
  space: z.number().min(0).max(100),
});
export const StationLoadsSchema = z.object({
  noise: z.number().min(0).max(100),
  crowd: z.number().min(0).max(100),
  isolation: z.number().min(0).max(100),
  inconvenience: z.number().min(0).max(100),
  small_space: z.number().min(0).max(100),
  intrusion: z.number().min(0).max(100),
});
export const StationSchema = z.object({
  stationId: z.string().min(1),
  stationName: z.string().min(1),
  active: z.boolean(),
  archetypeId: z.string().min(1),
  stationTypeLabel: z.string().min(1),
  accessGroup: z.string().min(1),
  hubLevel: z.number().int().min(1).max(5),
  recognition: z.number().int().min(1).max(5),
  benefits: StationBenefitsSchema,
  loads: StationLoadsSchema,
  rentTier: z.number().int().min(1).max(10),
  destinationZonePenalty: z.record(z.string(), z.number()),
  resultLine: z.string().min(1),
  dataStatus: z.string().min(1),
});
export const StationsDataSchema = z.object({
  datasetVersion: z.string(),
  featureSchemaVersion: z.string(),
  dataStatus: z.string(),
  notes: z.array(z.string()),
  featureKeys: z.object({
    benefits: z.array(z.string()),
    loads: z.array(z.string()),
  }),
  stations: z.array(StationSchema),
});

// ── マッチングルール ──────────────────────────────────────────────────────────
export const MatchingRulesSchema = z.object({
  matchingSpecVersion: z.string(),
  metricFeatureMap: z.record(z.string(), z.string()),
  benefitMismatch: z.record(z.string(), z.string()),
  loadOverrun: z.string(),
  exposureFactors: z.record(z.string(), z.string()),
  scoreWeights: z.object({
    benefitShortfall: z.number(),
    loadOverrun: z.number(),
    economicPenalty: z.number(),
    destinationPenalty: z.number(),
  }),
  finalScore: z.string(),
  incomeToBudgetTier: z.record(z.string(), z.number()),
  budgetAdjustments: z.record(z.string(), z.union([z.number(), z.string()])),
  economicPenaltyByTierGap: z.record(z.string(), z.number()),
  destinationPenalty: z.object({
    basePerAccessBand: z.number(),
    primaryMultiplier: z.number(),
    secondaryMultiplier: z.number(),
    frequencyMultiplierField: z.string(),
    unknownPolicy: z.string(),
  }),
  rankingExclusions: z.array(z.string()),
  alternativeSelection: z.object({
    count: z.number(),
    maxScoreGapFromTop: z.number(),
    preferDifferentArchetype: z.boolean(),
    preferDifferentAccessGroup: z.boolean(),
  }),
  confidence: z.object({
    start: z.number(),
    missingSensitiveFieldPenalty: z.number(),
    missingIncomePenalty: z.number(),
    missingDestinationPenalty: z.number(),
    lowCoverageIGroupDoesNotReduceStationFitConfidence: z.boolean(),
  }),
});

// ── 結果コピー ────────────────────────────────────────────────────────────────
export const ShoutLevelSchema = z.object({
  "1": z.string(),
  "2": z.string(),
  "3": z.string(),
});
export const ShoutSchema = z.object({
  id: z.string(),
  requiredTag: z.string(),
  levels: ShoutLevelSchema,
});
export const ResultCopySchema = z.object({
  copySpecVersion: z.string(),
  // Phase 4 定性強化モジュール（結果画面へ渡す本体）
  sharpOpenings: z.record(z.string(), z.string()).optional(),
  coreAnalysisTemplates: z.record(z.string(), z.string()).optional(),
  strainTemplates: z.record(z.string(), z.string().nullable()).optional(),
  tradeoffTemplates: z.record(z.string(), z.string()).optional(),
  temptingMismatchTemplates: z.record(z.string(), z.string()).optional(),
  supportiveClosings: z.array(z.string()).optional(),
  // Legacy モジュール（後方互換）
  shouts: z.array(ShoutSchema),
  reasonTemplates: z.record(z.string(), z.string()),
  closings: z.array(z.string()),
});

// ── 質問定義 (loose validation — structure validated at load) ─────────────────
export const QuestionFieldSchema = z.object({
  fieldId: z.string().min(1),
  type: z.enum(["single_select", "multi_select", "segmented", "prefecture_select", "dual_bucket_rank"]),
  required: z.boolean(),
}).passthrough();

export const QuestionStepSchema = z.object({
  stepId: z.string().min(1),
  section: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string(),
  required: z.boolean(),
  fields: z.array(QuestionFieldSchema),
});

export const QuestionsDataSchema = z.object({
  diagnosisId: z.literal("best-station"),
  questionSpecVersion: z.string(),
  totalSteps: z.number().int(),
  targetCompletionMinutes: z.tuple([z.number(), z.number()]),
  steps: z.array(QuestionStepSchema),
});
