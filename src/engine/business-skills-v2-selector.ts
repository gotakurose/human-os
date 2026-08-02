import type { StyleAxisScores } from "@/engine/style-axis-scorer";
import {
  uScoresToDisplayScores,
  type AbilityUScores,
  type AbilityKey,
} from "@/engine/ability-scorer";
import type {
  BusinessSkillsV2Routing,
  BusinessSkillsV2Route,
} from "@/schemas/business-skills-v2";

// ── Exported types ────────────────────────────────────────────────────────────

export type BusinessSkillsV2Choice =
  | "strongly_a"
  | "lean_a"
  | "lean_b"
  | "strongly_b";

export type BusinessSkillsV2Answers = Record<string, BusinessSkillsV2Choice>;

export type BusinessSkillsV2Confidence = "high" | "medium" | "low";

export interface BusinessSkillsV2RouteScore {
  mainRouteId: string;
  subRouteId: string;
  routeOrder: number;
  total: number;
  evidence: number;
  abilities: number;
  axes: number;
}

export interface BusinessSkillsV2SelectionResult {
  typeId: string;
  mainRouteId: string;
  subRouteId: string;
  confidence: BusinessSkillsV2Confidence;
  gap: number;
  winner: BusinessSkillsV2RouteScore;
  runnerUp: BusinessSkillsV2RouteScore;
}

// ── Internal types ────────────────────────────────────────────────────────────

type AxisPole = BusinessSkillsV2Route["axisProfile"]["top1"];

// ── Constants ─────────────────────────────────────────────────────────────────

const ABILITY_PRIORITY: AbilityKey[] = [
  "logic",
  "execution",
  "sales",
  "creativity",
  "management",
];

const AXIS_PAIR_PRIORITY = [
  "thinking_action",
  "offensive_stable",
  "solo_team",
  "divergent_convergent",
] as const;

const BASE_CODE_TO_POLE: Readonly<Record<string, AxisPole>> = {
  T: "thinking",
  A: "action",
  O: "offensive",
  S: "stable",
  I: "individual",
  G: "group",
  E: "divergent",
  F: "convergent",
};

const EPSILON = 1e-12;

// ── Internal helpers ──────────────────────────────────────────────────────────

function rankByPriority<K extends string>(
  values: Record<K, number>,
  priority: readonly K[],
): Record<K, number> {
  const ordered = [...priority].sort((left, right) => {
    const scoreDiff = values[right] - values[left];
    if (Math.abs(scoreDiff) > EPSILON) return scoreDiff;
    return priority.indexOf(left) - priority.indexOf(right);
  });

  return Object.fromEntries(
    ordered.map((key, index) => [key, index + 1]),
  ) as Record<K, number>;
}

function responseMatch(
  targetSide: "A" | "B",
  answer: BusinessSkillsV2Choice,
  scoring: BusinessSkillsV2Routing["scoring"],
): number {
  const strongTarget =
    (targetSide === "A" && answer === "strongly_a") ||
    (targetSide === "B" && answer === "strongly_b");
  if (strongTarget) return scoring.evidenceResponseMatch.strongTarget;

  const slightTarget =
    (targetSide === "A" && answer === "lean_a") ||
    (targetSide === "B" && answer === "lean_b");
  if (slightTarget) return scoring.evidenceResponseMatch.slightTarget;

  const slightOpposite =
    (targetSide === "A" && answer === "lean_b") ||
    (targetSide === "B" && answer === "lean_a");
  if (slightOpposite) return scoring.evidenceResponseMatch.slightOpposite;

  return scoring.evidenceResponseMatch.strongOpposite;
}

function calculateEvidenceMatch(
  answers: BusinessSkillsV2Answers,
  route: BusinessSkillsV2Route,
  scoring: BusinessSkillsV2Routing["scoring"],
): number {
  let numerator = 0;
  let denominator = 0;

  for (const evidence of route.evidence) {
    const answer = answers[evidence.questionId];
    if (!answer) {
      throw new Error(`Missing answer: ${evidence.questionId}`);
    }
    numerator +=
      evidence.weight * responseMatch(evidence.targetSide, answer, scoring);
    denominator += evidence.weight;
  }

  if (denominator <= 0) {
    throw new Error(`No evidence weight: ${route.subRouteId}`);
  }
  return numerator / denominator;
}

function calculateAbilityMatch(
  abilityU: AbilityUScores,
  route: BusinessSkillsV2Route,
  scoring: BusinessSkillsV2Routing["scoring"],
): number {
  const display = uScoresToDisplayScores(abilityU);
  const ranks = rankByPriority(display, ABILITY_PRIORITY);
  const match = scoring.abilityRankMatch;

  const top1 =
    match[`rank${ranks[route.abilityProfile.top1]}` as keyof typeof match];
  const top2 =
    match[`rank${ranks[route.abilityProfile.top2]}` as keyof typeof match];

  return (
    top1 * scoring.abilityProfileWeights.top1 +
    top2 * scoring.abilityProfileWeights.top2
  );
}

function typeSideAxisValues(
  style: StyleAxisScores,
  baseCode: string,
): Record<AxisPole, number> {
  const positive = {
    thinking_action: 50 + Math.round(style.thinking_action * 50),
    offensive_stable: 50 + Math.round(style.offensive_stable * 50),
    solo_team: 50 + Math.round(style.solo_team * 50),
    divergent_convergent: 50 + Math.round(style.divergent_convergent * 50),
  };

  const all: Record<AxisPole, number> = {
    thinking: positive.thinking_action,
    action: 100 - positive.thinking_action,
    offensive: positive.offensive_stable,
    stable: 100 - positive.offensive_stable,
    individual: positive.solo_team,
    group: 100 - positive.solo_team,
    divergent: positive.divergent_convergent,
    convergent: 100 - positive.divergent_convergent,
  };

  const result = {} as Record<AxisPole, number>;
  for (let index = 0; index < 4; index += 1) {
    const letter = baseCode[index];
    if (letter !== undefined) {
      const pole = BASE_CODE_TO_POLE[letter];
      if (pole !== undefined) {
        result[pole] = all[pole];
      }
    }
  }
  return result;
}

function calculateAxisMatch(
  style: StyleAxisScores,
  baseCode: string,
  route: BusinessSkillsV2Route,
  scoring: BusinessSkillsV2Routing["scoring"],
): number {
  const values = typeSideAxisValues(style, baseCode);

  const typePolePriority = AXIS_PAIR_PRIORITY.map((_, index) => {
    const letter = baseCode[index] ?? "";
    return BASE_CODE_TO_POLE[letter] as AxisPole;
  });

  const ranks = rankByPriority(values, typePolePriority);
  const roleMatch = scoring.axisRoleRankMatch;

  const top1 =
    roleMatch.top1[
      `rank${ranks[route.axisProfile.top1]}` as keyof typeof roleMatch.top1
    ];
  const top2 =
    roleMatch.top2[
      `rank${ranks[route.axisProfile.top2]}` as keyof typeof roleMatch.top2
    ];
  const central =
    roleMatch.central[
      `rank${ranks[route.axisProfile.central]}` as keyof typeof roleMatch.central
    ];

  return (
    top1 * scoring.axisRankWeights.top1 +
    top2 * scoring.axisRankWeights.top2 +
    central * scoring.axisRankWeights.central
  );
}

function compareRouteScores(
  left: BusinessSkillsV2RouteScore,
  right: BusinessSkillsV2RouteScore,
): number {
  const checks: Array<[number, number]> = [
    [left.total, right.total],
    [left.evidence, right.evidence],
    [left.abilities, right.abilities],
    [left.axes, right.axes],
  ];

  for (const [leftValue, rightValue] of checks) {
    if (Math.abs(leftValue - rightValue) > EPSILON) {
      return rightValue - leftValue;
    }
  }
  return left.routeOrder - right.routeOrder;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function selectBusinessSkillsV2Route(input: {
  answers: BusinessSkillsV2Answers;
  typeId: string;
  styleAxisScores: StyleAxisScores;
  abilityUScores: AbilityUScores;
  routing: BusinessSkillsV2Routing;
}): BusinessSkillsV2SelectionResult {
  const type = input.routing.types.find(
    (candidate) => candidate.typeId === input.typeId,
  );
  if (!type) throw new Error(`Unknown V2 typeId: ${input.typeId}`);

  const allScores = type.routes.map(
    (route, routeOrder): BusinessSkillsV2RouteScore => {
      const evidence = calculateEvidenceMatch(
        input.answers,
        route,
        input.routing.scoring,
      );
      const abilities = calculateAbilityMatch(
        input.abilityUScores,
        route,
        input.routing.scoring,
      );
      const axes = calculateAxisMatch(
        input.styleAxisScores,
        type.baseCode,
        route,
        input.routing.scoring,
      );

      const weights = input.routing.scoring.componentWeights;
      return {
        mainRouteId: route.mainRouteId,
        subRouteId: route.subRouteId,
        routeOrder,
        total:
          evidence * weights.evidence +
          abilities * weights.abilities +
          axes * weights.axes,
        evidence,
        abilities,
        axes,
      };
    },
  );

  const bestPerMain = new Map<string, BusinessSkillsV2RouteScore>();
  for (const score of allScores) {
    const current = bestPerMain.get(score.mainRouteId);
    if (!current || compareRouteScores(score, current) < 0) {
      bestPerMain.set(score.mainRouteId, score);
    }
  }

  const winningMain = [...bestPerMain.values()]
    .sort(compareRouteScores)[0]
    ?.mainRouteId;
  if (!winningMain) throw new Error(`No V2 main route: ${input.typeId}`);

  const winner = allScores
    .filter((score) => score.mainRouteId === winningMain)
    .sort(compareRouteScores)[0];
  if (!winner) throw new Error(`No V2 sub route: ${input.typeId}`);

  const overall = [...allScores].sort(compareRouteScores);
  const runnerUp = overall.find(
    (score) => score.subRouteId !== winner.subRouteId,
  );
  if (!runnerUp) throw new Error(`No V2 runner-up: ${input.typeId}`);

  const gap = winner.total - runnerUp.total;
  const thresholds = input.routing.scoring.confidenceThresholds;
  const confidence: BusinessSkillsV2Confidence =
    gap >= thresholds.highMinGap
      ? "high"
      : gap >= thresholds.mediumMinGap
        ? "medium"
        : "low";

  return {
    typeId: input.typeId,
    mainRouteId: winner.mainRouteId,
    subRouteId: winner.subRouteId,
    confidence,
    gap,
    winner,
    runnerUp,
  };
}
