import type { Scoring } from "@/schemas/diagnosis";
import type { AxisScoreMap } from "./scorer";

export function resolveType(scores: AxisScoreMap, scoring: Scoring): string {
  // Find the axis with the highest score
  const topAxis = Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0];

  if (!topAxis) return scoring.fallback;

  for (const rule of (scoring.rules ?? [])) {
    // Top axis must be in the dominant list for this rule
    if (!rule.condition.dominant.includes(topAxis)) continue;

    // All minScore conditions must be met
    const minScore = rule.condition.minScore ?? {};
    const meetsMin = Object.entries(minScore).every(
      ([axis, min]) => (scores[axis] ?? 0) >= min
    );

    if (meetsMin) return rule.typeId;
  }

  return scoring.fallback;
}
