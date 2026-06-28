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

// ── questions.json ──────────────────────────────────────────
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

// ── types.json ──────────────────────────────────────────────
export const DiagnosisTypeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  character: z.object({
    name: z.string(),
    imageUrl: z.string(),
    color: z.string(),
  }),
  representativeScores: z.record(z.string(), z.number()),
  summary: z.string(),
  detail: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  compatibleTypes: z.array(z.string()),
  recommendedRoles: z.array(z.string()),
  idealEnvironments: z.array(z.string()),
  growthTips: z.array(z.string()),
  sarcasticComments: z.array(z.string()),
  affiliateLinks: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .optional(),
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
  method: z.enum(["dominant-axis"]),
  rules: z.array(ScoringRuleSchema),
  fallback: z.string(),
});

// ── inferred types ───────────────────────────────────────────
export type Meta = z.infer<typeof MetaSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type DiagnosisType = z.infer<typeof DiagnosisTypeSchema>;
export type Scoring = z.infer<typeof ScoringSchema>;
