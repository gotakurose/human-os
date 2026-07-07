import { z } from "zod";

// ── engineType ──────────────────────────────────────────────
export const EngineTypeSchema = z.enum(["radar", "type16", "branch", "score"]);

// ── meta.json ───────────────────────────────────────────────
export const MetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()),
  questionCount: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive(),
  engineType: EngineTypeSchema,
  axes: z.array(z.string()).optional(),
  typeCount: z.number().int().positive(),
  published: z.boolean(),
  createdAt: z.string(),
});

// ── questions.json (radar / 旧形式) ─────────────────────────
const OptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  scores: z.record(z.string(), z.number()),
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  options: z.array(OptionSchema).min(2),
});

export const QuestionsSchema = z.array(QuestionSchema);

// ── questions.json (type16 / 4スタイル軸形式) ───────────────
export const StyleAxisNameSchema = z.enum([
  "thinking_action",
  "offensive_stable",
  "solo_team",
  "divergent_convergent",
]);

export const StyleAxisChoiceSchema = z.enum([
  "strongly_a",
  "lean_a",
  "lean_b",
  "strongly_b",
]);

export const StyleAxisQuestionSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  axis: StyleAxisNameSchema,
  prompt: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionASide: z.string().min(1), // 各軸のどちらの極か (e.g. "thinking" / "action")
  optionBSide: z.string().min(1),
});

export const StyleAxisQuestionsSchema = z.array(StyleAxisQuestionSchema);

// ── types.json ──────────────────────────────────────────────

// 4スタイル軸（各軸 1〜4 の整数: 1=左極, 4=右極）
const StyleAxesSchema = z.object({
  thinkingAction: z.union([z.literal(1), z.literal(4)]),
  offensiveStable: z.union([z.literal(1), z.literal(4)]),
  soloTeam: z.union([z.literal(1), z.literal(4)]),
  divergentConvergent: z.union([z.literal(1), z.literal(4)]),
});

export const DiagnosisTypeSchema = z.object({
  // ── 必須（後方互換）──────────────────────────────────────
  id: z.string().min(1),
  name: z.string().min(1),
  character: z.object({
    name: z.string().optional(),
    imageUrl: z.string().optional(),
    color: z.string(), // ResultClient で使用するため必須維持
  }),
  representativeScores: z.record(z.string(), z.number()),
  summary: z.string(),
  detail: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  compatibleTypes: z.array(z.string()),
  recommendedRoles: z.array(z.string()),
  sarcasticComments: z.array(z.string()),

  // ── 任意（旧フィールド・後方互換）──────────────────────
  idealEnvironments: z.array(z.string()).optional(),
  growthTips: z.array(z.string()).optional(),
  affiliateLinks: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .optional(),

  // ── 任意（新フィールド・将来の結果画面向け）─────────────
  englishName: z.string().optional(),
  axes: StyleAxesSchema.optional(),
  catchCopy: z.string().optional(),
  shortDescription: z.string().optional(),
  fatalWeakness: z.string().optional(),
  badEnvironments: z.array(z.string()).optional(),
  characterConcept: z.string().optional(),
  characterImage: z.string().optional(),
  accentColorKey: z.string().optional(),

  // ── 任意（結果ページ拡充用・v2コンテンツ）──────────────────
  oneLine: z.string().optional(),
  osDescription: z.string().optional(),
  humanOsComment: z.string().optional(),
  brokenEnvironment: z.string().optional(),
  recommendedCareers: z.array(z.string()).optional(),
  recommendedTasks: z.array(z.string()).optional(),
  notRecommendedWork: z.string().optional(),
  conflictTypes: z.array(z.string()).optional(),
  teamRole: z.string().optional(),
  shareCatch: z.string().optional(),  // SNS/OGP向け超短文キャッチ
});

export const TypesSchema = z.array(DiagnosisTypeSchema);

// ── scoring.json ─────────────────────────────────────────────
const ScoringRuleSchema = z.object({
  typeId: z.string(),
  condition: z.object({
    dominant: z.array(z.string()),
    minScore: z.record(z.string(), z.number()).optional(),
  }),
});

export const ScoringSchema = z.object({
  method: z.enum(["dominant-axis", "style-axis"]),
  // dominant-axis 用
  rules: z.array(ScoringRuleSchema).optional(),
  // style-axis 用
  maxScorePerAxis: z.number().int().positive().optional(),
  fallback: z.string(),
});

// ── fixed-copy.json ──────────────────────────────────────────

// baseCode: 4 chars — position 1: T/A, 2: O/S, 3: I/G, 4: E/F
const BaseCodeSchema = z.string().regex(/^[TA][OS][IG][EF]$/);

// {id, text} leaf
const FixedTextFieldSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

// {title, body} pair
const FixedTitleBodySchema = z.object({
  title: FixedTextFieldSchema,
  body: FixedTextFieldSchema,
});

// exactly-3 arrays
const FixedArray3TitleBodySchema = z.array(FixedTitleBodySchema).min(3).max(3);
const FixedArray3TextSchema = z.array(FixedTextFieldSchema).min(3).max(3);

export const FixedCopyTypeSchema = z.object({
  typeId: z.string().min(1),
  baseCode: BaseCodeSchema,
  catch: FixedTextFieldSchema,
  overview: FixedTextFieldSchema,
  harsh: FixedTitleBodySchema,
  thinking: FixedTextFieldSchema,
  strengths: FixedArray3TitleBodySchema,
  weaknesses: FixedArray3TitleBodySchema,
  fatal: FixedTitleBodySchema,
  growthTips: FixedArray3TitleBodySchema,
  career: FixedTextFieldSchema,
  fitJobs: z.object({
    labels: FixedArray3TextSchema,
    body: FixedTextFieldSchema,
  }),
  avoidJobs: z.object({
    labels: FixedArray3TextSchema,
    body: FixedTextFieldSchema,
  }),
  relationships: FixedTextFieldSchema,
  teamRole: FixedTextFieldSchema,
  conclusion: FixedTextFieldSchema,
});

export const FixedCopySchema = z.object({
  schemaVersion: z.number().int().positive(),
  types: z.array(FixedCopyTypeSchema),
});

// ── dynamic-copy.json ─────────────────────────────────────────

const DynamicCopyAxisRoleSchema = z.enum(["dominant", "soft", "balanced"]);
const DynamicCopyPoleSchema = z.enum([
  "think", "act", "offense", "stability",
  "individual", "group", "expand", "focus", "none",
]);
const DynamicCopyStrengthSchema = z.enum(["mild", "clear", "extreme"]);

export const DynamicCopyPartSchema = z.object({
  id: z.string().min(1),
  layer: z.string().min(1),
  axisRole: DynamicCopyAxisRoleSchema,
  pole: DynamicCopyPoleSchema,
  strength: DynamicCopyStrengthSchema,
  section: z.string().min(1),
  targetSlot: z.string().min(1),
  renderMode: z.enum(["append_paragraph", "replace_slot"]),
  conditions: z.array(z.string()),
  targetTypes: z.array(z.string()),
  forbiddenTypes: z.array(z.string()),
  priority: z.number().int(),
  text: z.string().min(1),
});

export const DynamicCopyPartsSchema = z.array(DynamicCopyPartSchema);

// ── ability-scoring.json ─────────────────────────────────────

const AbilityKeySchema = z.enum(["logic", "execution", "sales", "creativity", "management"]);

export const AbilityScoringEntrySchema = z.object({
  questionId: z.string().min(1),
  contributingSide: z.enum(["a", "b"]),
  ability: AbilityKeySchema,
});

export const AbilityScoringSchema = z.object({
  schemaVersion: z.number().int().positive(),
  contributions: z.array(AbilityScoringEntrySchema),
});

// ── inferred types ───────────────────────────────────────────
export type Meta = z.infer<typeof MetaSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type StyleAxisQuestion = z.infer<typeof StyleAxisQuestionSchema>;
export type StyleAxisChoice = z.infer<typeof StyleAxisChoiceSchema>;
export type DiagnosisType = z.infer<typeof DiagnosisTypeSchema>;
export type Scoring = z.infer<typeof ScoringSchema>;
export type FixedCopyType = z.infer<typeof FixedCopyTypeSchema>;
export type FixedCopy = z.infer<typeof FixedCopySchema>;
export type DynamicCopyPartEntry = z.infer<typeof DynamicCopyPartSchema>;
export type AbilityKey = z.infer<typeof AbilityKeySchema>;
export type AbilityScoringEntry = z.infer<typeof AbilityScoringEntrySchema>;
export type AbilityScoring = z.infer<typeof AbilityScoringSchema>;
