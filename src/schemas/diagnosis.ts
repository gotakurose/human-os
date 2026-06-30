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
  thinkingAction: z.number().int().min(1).max(4),
  offensiveStable: z.number().int().min(1).max(4),
  soloTeam: z.number().int().min(1).max(4),
  divergentConvergent: z.number().int().min(1).max(4),
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

// ── inferred types ───────────────────────────────────────────
export type Meta = z.infer<typeof MetaSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type StyleAxisQuestion = z.infer<typeof StyleAxisQuestionSchema>;
export type StyleAxisChoice = z.infer<typeof StyleAxisChoiceSchema>;
export type DiagnosisType = z.infer<typeof DiagnosisTypeSchema>;
export type Scoring = z.infer<typeof ScoringSchema>;
