import type { StyleAxisQuestion, DiagnosisType } from "@/schemas/diagnosis";

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
