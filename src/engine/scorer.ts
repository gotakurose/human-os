// Phase 1 implementation: radar engine scoring
// Aggregates per-axis scores from answers and normalizes to 0–100.

export type AxisScoreMap = Record<string, number>;

export function aggregateScores(
  _answers: Record<string, string>,
  _questions: unknown[]
): AxisScoreMap {
  // TODO: implement in Phase 1 engine work
  throw new Error("scorer.ts: not yet implemented");
}

export function normalize(raw: AxisScoreMap, maxPerAxis: number): AxisScoreMap {
  return Object.fromEntries(
    Object.entries(raw).map(([axis, score]) => [
      axis,
      Math.round((score / maxPerAxis) * 100),
    ])
  );
}
