import type { StyleAxisQuestion, DiagnosisType } from "@/schemas/diagnosis";

// ── 能力値マッピング ─────────────────────────────────────────────────────────
// 各能力値に寄与する極と重みを定義する。weights の合計は各能力で 1.0。
const ABILITY_WEIGHTS: Record<string, Record<string, number>> = {
  logic:      { thinking: 0.50, convergent: 0.40, solo:      0.10 },
  execution:  { action:   0.50, convergent: 0.35, offensive: 0.15 },
  sales:      { offensive: 0.45, team:      0.35, action:    0.20 },
  creativity: { divergent: 0.50, offensive: 0.30, solo:      0.20 },
  management: { stable:   0.40, team:      0.35, convergent: 0.25 },
};

const ABILITY_KEYS = ["logic", "execution", "sales", "creativity", "management"] as const;

export interface StyleAxisScores {
  thinking_action: number; // -1.0 〜 +1.0 (正 = thinking 優勢)
  offensive_stable: number; // -1.0 〜 +1.0 (正 = offensive 優勢)
  solo_team: number; // -1.0 〜 +1.0 (正 = solo 優勢)
  divergent_convergent: number; // -1.0 〜 +1.0 (正 = divergent 優勢)
}

// 回答選択肢 → (どちら側か, 加算点)
const CHOICE_MAP: Record<string, { side: "a" | "b"; points: number }> = {
  strongly_a: { side: "a", points: 2 },
  lean_a: { side: "a", points: 1 },
  lean_b: { side: "b", points: 1 },
  strongly_b: { side: "b", points: 2 },
};

/**
 * 40問の回答から4スタイル軸のノーマライズスコアを算出する。
 * 逆転項目は各質問の optionASide / optionBSide で解決する。
 * maxScorePerAxis = 10問 × 2点 = 20。
 */
export function calculateStyleAxisScores(
  answers: Record<string, string>,
  questions: StyleAxisQuestion[],
  maxScorePerAxis: number
): StyleAxisScores {
  // 各極の累計点
  const poles: Record<string, number> = {
    thinking: 0,
    action: 0,
    offensive: 0,
    stable: 0,
    solo: 0,
    team: 0,
    divergent: 0,
    convergent: 0,
  };

  for (const q of questions) {
    const answer = answers[q.id];
    const choice = answer ? CHOICE_MAP[answer] : undefined;
    if (!choice) continue;

    const poleName = choice.side === "a" ? q.optionASide : q.optionBSide;
    if (poleName in poles) {
      poles[poleName] += choice.points;
    }
  }

  return {
    thinking_action: (poles.thinking - poles.action) / maxScorePerAxis,
    offensive_stable: (poles.offensive - poles.stable) / maxScorePerAxis,
    solo_team: (poles.solo - poles.team) / maxScorePerAxis,
    divergent_convergent: (poles.divergent - poles.convergent) / maxScorePerAxis,
  };
}

/**
 * 4軸スコアの符号から 16タイプを判定する。
 * types[].axes.thinkingAction: 1 = 思考型（正寄り）, 4 = 行動型（負寄り）
 * 同様に offensiveStable / soloTeam / divergentConvergent も 1 か 4。
 */
export function resolveStyleAxisType(
  axisScores: StyleAxisScores,
  types: DiagnosisType[],
  fallback: string
): string {
  for (const type of types) {
    if (!type.axes) continue;

    const { thinkingAction: ta, offensiveStable: os, soloTeam: st, divergentConvergent: dc } =
      type.axes;

    // 値 1 → 正極（スコア >= 0 で一致）、値 4 → 負極（スコア < 0 で一致）
    const taMatch = ta === 1 ? axisScores.thinking_action >= 0 : axisScores.thinking_action < 0;
    const osMatch = os === 1 ? axisScores.offensive_stable >= 0 : axisScores.offensive_stable < 0;
    const stMatch = st === 1 ? axisScores.solo_team >= 0 : axisScores.solo_team < 0;
    const dcMatch =
      dc === 1 ? axisScores.divergent_convergent >= 0 : axisScores.divergent_convergent < 0;

    if (taMatch && osMatch && stMatch && dcMatch) return type.id;
  }

  return fallback;
}

/**
 * 4スタイル軸のノーマライズスコアから 5能力値（25〜95 の整数）を算出する。
 *
 * 各軸を bilateral pole strength に変換する（0〜1、中立 = 0.5）:
 *   thinking = (1 + ta) / 2,  action = (1 - ta) / 2  など
 *
 * ABILITY_WEIGHTS で加重和 raw ∈ [0, 1] を求め、25 + raw * 70 でスケーリング。
 * 中立ユーザー (全軸 0) → raw = 0.5 → score = 60。
 * 完全一致ユーザー → score = 95, 完全逆方向 → score = 25。
 */
export function deriveAbilityScores(axisScores: StyleAxisScores): Record<string, number> {
  const { thinking_action: ta, offensive_stable: os, solo_team: st, divergent_convergent: dc } =
    axisScores;

  // bilateral pole strengths (0〜1, 中立 = 0.5)
  const poles: Record<string, number> = {
    thinking:   (1 + ta) / 2,
    action:     (1 - ta) / 2,
    offensive:  (1 + os) / 2,
    stable:     (1 - os) / 2,
    solo:       (1 + st) / 2,
    team:       (1 - st) / 2,
    divergent:  (1 + dc) / 2,
    convergent: (1 - dc) / 2,
  };

  const result: Record<string, number> = {};
  for (const ability of ABILITY_KEYS) {
    const weights = ABILITY_WEIGHTS[ability];
    const raw = Object.entries(weights).reduce(
      (sum, [pole, w]) => sum + (poles[pole] ?? 0) * w,
      0
    );
    result[ability] = Math.min(95, Math.max(25, Math.round(25 + raw * 70)));
  }
  return result;
}
