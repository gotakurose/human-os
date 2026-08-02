import { z } from "zod";

// ── Shared enums ──────────────────────────────────────────────────────────────

const AbilityKeyV2Schema = z.enum([
  "logic",
  "execution",
  "sales",
  "creativity",
  "management",
]);

const AxisPoleKeyV2Schema = z.enum([
  "thinking",
  "action",
  "offensive",
  "stable",
  "individual",
  "group",
  "divergent",
  "convergent",
]);

// ── routing.json — internal schemas ──────────────────────────────────────────

const V2EvidenceItemSchema = z
  .object({
    questionId: z.string().regex(/^q(?:0[1-9]|[1-3][0-9]|40)$/),
    targetSide: z.enum(["A", "B"]),
    weight: z.number().min(1.0).max(1.45),
  })
  .strict();

const V2RepresentativeScoresSchema = z
  .object({
    axes: z
      .object({
        thinking: z.number().int().min(0).max(100),
        action: z.number().int().min(0).max(100),
        offensive: z.number().int().min(0).max(100),
        stable: z.number().int().min(0).max(100),
        individual: z.number().int().min(0).max(100),
        group: z.number().int().min(0).max(100),
        divergent: z.number().int().min(0).max(100),
        convergent: z.number().int().min(0).max(100),
      })
      .strict(),
    abilities: z
      .object({
        logic: z.number().int().min(50).max(100),
        execution: z.number().int().min(50).max(100),
        sales: z.number().int().min(50).max(100),
        creativity: z.number().int().min(50).max(100),
        management: z.number().int().min(50).max(100),
      })
      .strict(),
  })
  .strict();

const V2RouteSchema = z
  .object({
    mainRouteId: z.string().regex(/^[a-z0-9-]+\.m\d{2}$/),
    mainRouteName: z.string().min(1),
    subRouteId: z.string().regex(/^[a-z0-9-]+\.m\d{2}\.s\d{2}$/),
    subRouteName: z.string().min(1),
    evidence: z.array(V2EvidenceItemSchema).min(3),
    abilityProfile: z
      .object({
        top1: AbilityKeyV2Schema,
        top2: AbilityKeyV2Schema,
        relativeLag: AbilityKeyV2Schema,
      })
      .strict(),
    axisProfile: z
      .object({
        top1: AxisPoleKeyV2Schema,
        top2: AxisPoleKeyV2Schema,
        central: AxisPoleKeyV2Schema,
      })
      .strict(),
    representativeScores: V2RepresentativeScoresSchema,
    bestPartnerTypeId: z.string().regex(/^[a-z0-9-]+$/),
  })
  .strict();

const V2AxisRoleRankScoreSchema = z
  .object({
    rank1: z.number().min(0).max(1),
    rank2: z.number().min(0).max(1),
    rank3: z.number().min(0).max(1),
    rank4: z.number().min(0).max(1),
  })
  .strict();

const V2ScoringConfigSchema = z
  .object({
    componentWeights: z
      .object({
        evidence: z.literal(0.55),
        abilities: z.literal(0.3),
        axes: z.literal(0.15),
      })
      .strict(),
    evidenceResponseMatch: z
      .object({
        strongTarget: z.literal(1.0),
        slightTarget: z.literal(0.75),
        slightOpposite: z.literal(0.25),
        strongOpposite: z.literal(0.0),
      })
      .strict(),
    abilityRankMatch: z
      .object({
        rank1: z.literal(1.0),
        rank2: z.literal(0.82),
        rank3: z.literal(0.58),
        rank4: z.literal(0.34),
        rank5: z.literal(0.15),
      })
      .strict(),
    abilityProfileWeights: z
      .object({
        top1: z.literal(0.6),
        top2: z.literal(0.4),
      })
      .strict(),
    axisRankWeights: z
      .object({
        top1: z.literal(0.5),
        top2: z.literal(0.3),
        central: z.literal(0.2),
      })
      .strict(),
    confidenceThresholds: z
      .object({
        highMinGap: z.literal(0.04),
        mediumMinGap: z.literal(0.015),
      })
      .strict(),
    tieBreakOrder: z.tuple([
      z.literal("evidence"),
      z.literal("abilities"),
      z.literal("axes"),
      z.literal("routeArrayOrder"),
    ]),
    minEvidencePerRoute: z.literal(3),
    evidenceWeightFormula: z.string().min(1),
    abilityRankSource: z.literal("displayScoreD"),
    abilityTiePriority: z.tuple([
      z.literal("logic"),
      z.literal("execution"),
      z.literal("sales"),
      z.literal("creativity"),
      z.literal("management"),
    ]),
    axisRankSource: z.literal("typeSideDisplayScore"),
    axisTiePriority: z.tuple([
      z.literal("thinking_action"),
      z.literal("offensive_stable"),
      z.literal("solo_team"),
      z.literal("divergent_convergent"),
    ]),
    axisRoleRankMatch: z
      .object({
        top1: V2AxisRoleRankScoreSchema,
        top2: V2AxisRoleRankScoreSchema,
        central: V2AxisRoleRankScoreSchema,
      })
      .strict(),
    axisMatchFormula: z.string().min(1),
    confidenceGapScope: z.literal("topTwoSubRoutesWithinType"),
    finalTieBreak: z.literal("routeArrayOrder"),
    selectionLocation: z.literal("questionFlowBeforeNavigation"),
    resultUrlParams: z.tuple([
      z.literal("ta"),
      z.literal("os"),
      z.literal("st"),
      z.literal("dc"),
      z.literal("av"),
      z.literal("sr"),
      z.literal("cf"),
    ]),
  })
  .strict();

const V2RoutingTypeSchema = z
  .object({
    typeNo: z.number().int().min(1).max(16),
    typeId: z.string().regex(/^[a-z0-9-]+$/),
    typeName: z.string().min(1),
    englishName: z.string().min(1),
    baseCode: z.string().regex(/^[TA][OS][IG][EF]$/),
    routes: z.array(V2RouteSchema).min(1),
  })
  .strict();

// ── routing.json — public schema ──────────────────────────────────────────────

export const BusinessSkillsV2RoutingSchema = z
  .object({
    schemaVersion: z.literal("2.0.0"),
    contentVersion: z.string(),
    status: z.literal("locked-implementation-ready"),
    diagnosisId: z.literal("business-skills"),
    scoring: V2ScoringConfigSchema,
    types: z.array(V2RoutingTypeSchema).min(16).max(16),
  })
  .strict();

// ── result-copy.json — internal schemas ──────────────────────────────────────

const V2ParagraphsSchema = z.array(z.string().min(1)).min(1);

const V2ThinkingSchema = z
  .object({
    see: V2ParagraphsSchema,
    decide: V2ParagraphsSchema,
    move: V2ParagraphsSchema,
    land: V2ParagraphsSchema,
  })
  .strict();

const V2SceneSchema = z
  .object({
    title: z.string().min(1),
    body: V2ParagraphsSchema,
  })
  .strict();

const V2ResultRouteSchema = z
  .object({
    mainRouteId: z.string(),
    subRouteId: z.string(),
    internalNames: z
      .object({
        mainRoute: z.string(),
        subRoute: z.string(),
      })
      .strict(),
    currentYou: z
      .object({
        baseSentences: z.array(z.string().min(1)).min(1).max(4),
        numericAppendSlots: z.tuple([
          z.literal("topAbilities"),
          z.literal("relativeLagAbility"),
          z.literal("axisPair"),
        ]),
      })
      .strict(),
    quantitativeAnalysis: z
      .object({
        mode: z.literal("generated-from-numeric-rules"),
        slots: z.tuple([
          z.literal("topAxes"),
          z.literal("centralAxis"),
          z.literal("topAbilities"),
          z.literal("relativeLagAbility"),
        ]),
      })
      .strict(),
    harshOneLiner: z.string().min(1),
    workThinking: V2ThinkingSchema,
    strengthScenes: z.array(V2SceneSchema).min(3).max(3),
    failureFlow: V2ParagraphsSchema,
    perception: z
      .object({
        intent: V2ParagraphsSchema,
        external: V2ParagraphsSchema,
      })
      .strict(),
    environment: z
      .object({
        fit: V2ParagraphsSchema,
        avoid: V2ParagraphsSchema,
      })
      .strict(),
    roles: V2ParagraphsSchema,
    partner: z
      .object({
        typeId: z.string(),
        typeName: z.string(),
        body: V2ParagraphsSchema,
      })
      .strict(),
    oneChange: V2ParagraphsSchema,
    share: z
      .object({
        typeLine: z.string(),
        bodyLines: z.array(z.string().min(1)).min(1),
      })
      .strict(),
  })
  .strict();

const V2ResultCopyTypeSchema = z
  .object({
    typeNo: z.number().int().min(1).max(16),
    typeId: z.string(),
    typeName: z.string(),
    englishName: z.string(),
    baseCode: z.string().regex(/^[TA][OS][IG][EF]$/),
    catchCopy: z.string().min(1),
    routes: z.array(V2ResultRouteSchema).min(1),
  })
  .strict();

// ── result-copy.json — public schema ─────────────────────────────────────────

export const BusinessSkillsV2ResultCopySchema = z
  .object({
    schemaVersion: z.literal("2.0.0"),
    contentVersion: z.string(),
    status: z.literal("locked-not-implemented"),
    diagnosisId: z.literal("business-skills"),
    renderingPolicy: z
      .object({
        representativeNumericCopyIncluded: z.literal(false),
        currentYou: z.string(),
        quantitativeAnalysis: z.string(),
        stableSections: z.string(),
      })
      .strict(),
    types: z.array(V2ResultCopyTypeSchema).min(16).max(16),
  })
  .strict();

// ── numeric-rules.json — internal schemas ────────────────────────────────────

const V2PoleSchema = z
  .object({
    key: z.string(),
    label: z.string(),
  })
  .strict();

const V2AxisRuleSchema = z
  .object({
    label: z.string(),
    role: z.string().min(1),
    strongest: z.string().min(1),
    central: z.string().min(1),
    overuseRisk: z.string().nullable(),
  })
  .strict();

const V2AbilityRuleSchema = z
  .object({
    label: z.string(),
    role: z.string().min(1),
    lagImpact: z.string().min(1),
  })
  .strict();

const V2PairSchema = z
  .object({
    labels: z.array(z.string()).min(2),
    effect: z.string().min(1),
  })
  .strict();

const V2InteractionSchema = z
  .object({
    condition: z.string(),
    effect: z.string(),
  })
  .strict();

const V2NumericTypeRuleSchema = z
  .object({
    typeId: z.string(),
    typeName: z.string(),
    baseCode: z.string().regex(/^[TA][OS][IG][EF]$/),
    displayPoles: z
      .object({
        thinking_action: V2PoleSchema,
        offensive_stable: V2PoleSchema,
        solo_team: V2PoleSchema,
        divergent_convergent: V2PoleSchema,
      })
      .strict(),
    axes: z.record(z.string(), V2AxisRuleSchema),
    abilities: z
      .object({
        logic: V2AbilityRuleSchema,
        execution: V2AbilityRuleSchema,
        sales: V2AbilityRuleSchema,
        creativity: V2AbilityRuleSchema,
        management: V2AbilityRuleSchema,
      })
      .strict(),
    axisPairs: z.array(V2PairSchema),
    abilityPairs: z.array(V2PairSchema),
    interactions: z.array(V2InteractionSchema),
    sourceFile: z.string(),
    sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

// ── numeric-rules.json — public schema ───────────────────────────────────────

export const BusinessSkillsV2NumericRulesSchema = z
  .object({
    schemaVersion: z.literal("2.0.0"),
    contentVersion: z.string(),
    status: z.literal("locked-not-implemented"),
    diagnosisId: z.literal("business-skills"),
    global: z
      .object({
        abilityDisplayRange: z
          .object({
            min: z.literal(50),
            max: z.literal(100),
          })
          .strict(),
        axisDisplayRange: z
          .object({
            min: z.literal(0),
            max: z.literal(100),
            pairSum: z.literal(100),
          })
          .strict(),
        sectionLimits: z.record(z.string(), z.unknown()),
        lagAbilityMinDisplayGap: z.number().int().min(0),
        templates: z.record(z.string(), z.string().min(1)),
      })
      .strict(),
    types: z.array(V2NumericTypeRuleSchema).min(16).max(16),
  })
  .strict();

// ── representative-tests.json — internal schemas ─────────────────────────────

const V2AnswerChoiceSchema = z.enum([
  "strongly_a",
  "lean_a",
  "lean_b",
  "strongly_b",
]);

const V2TestCaseSchema = z
  .object({
    caseId: z.string(),
    typeId: z.string(),
    baseCode: z.string().regex(/^[TA][OS][IG][EF]$/),
    mainRouteId: z.string(),
    subRouteId: z.string(),
    answers: z
      .record(z.string(), V2AnswerChoiceSchema)
      .refine((v) => Object.keys(v).length === 40, {
        message: "answers must have exactly 40 properties",
      }),
  })
  .strict();

// ── representative-tests.json — public schema ────────────────────────────────

export const BusinessSkillsV2RepresentativeTestsSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    contentVersion: z.string(),
    status: z.literal("locked-implementation-test"),
    diagnosisId: z.literal("business-skills"),
    qaThresholds: z
      .object({
        caseCount: z.literal(163),
        minimumRepresentativeGap: z.literal(0.0624),
        minimumOneAnswerChangeRetention: z.literal(0.85),
        leaveOneEvidencePassCount: z.literal(1514),
        minimumLeaveOneEvidenceGap: z.literal(0.0295),
        deterministicRunsPerCase: z.literal(3),
      })
      .strict(),
    cases: z.array(V2TestCaseSchema).min(163).max(163),
  })
  .strict();

// ── Inferred types ────────────────────────────────────────────────────────────

export type BusinessSkillsV2Routing = z.infer<
  typeof BusinessSkillsV2RoutingSchema
>;
export type BusinessSkillsV2ResultCopy = z.infer<
  typeof BusinessSkillsV2ResultCopySchema
>;
export type BusinessSkillsV2NumericRules = z.infer<
  typeof BusinessSkillsV2NumericRulesSchema
>;
export type BusinessSkillsV2RepresentativeTests = z.infer<
  typeof BusinessSkillsV2RepresentativeTestsSchema
>;

export type BusinessSkillsV2Route = z.infer<typeof V2RouteSchema>;
export type BusinessSkillsV2ResultRoute = z.infer<typeof V2ResultRouteSchema>;
export type BusinessSkillsV2NumericTypeRule = z.infer<
  typeof V2NumericTypeRuleSchema
>;
