import type { AbilityScoringEntry } from "@/schemas/diagnosis";

export type AbilityKey = "logic" | "execution" | "sales" | "creativity" | "management";

/** Theoretical max U_k per ability: 2 × (number of contributing questions). */
export const ABILITY_N: Record<AbilityKey, number> = {
  logic:      12,
  execution:   8,
  sales:       4,
  creativity:  7,
  management:  5,
};

export type AbilityUScores = Record<AbilityKey, number>;
export type AbilityVScores = Record<AbilityKey, number>;

/**
 * Computes U_k raw scores from question answers.
 * U_k = sum of choice points (2 = strongly, 1 = lean) for contributing-side answers.
 * Range: [0, 2 × n_k].
 */
export function calculateAbilityUScores(
  answers: Record<string, string>,
  contributions: AbilityScoringEntry[],
): AbilityUScores {
  const u: AbilityUScores = { logic: 0, execution: 0, sales: 0, creativity: 0, management: 0 };

  for (const c of contributions) {
    const answer = answers[c.questionId];
    if (!answer) continue;
    const onSideA = answer === "strongly_a" || answer === "lean_a";
    const onSideB = answer === "strongly_b" || answer === "lean_b";
    const contributing = c.contributingSide === "a" ? onSideA : onSideB;
    if (!contributing) continue;
    const isStrong = answer === "strongly_a" || answer === "strongly_b";
    u[c.ability] += isStrong ? 2 : 1;
  }

  return u;
}

/** V_k = Math.round(50 × U_k / n_k). Range: [0, 100]. */
export function uToV(u: number, n: number): number {
  return Math.round((50 * u) / n);
}

/** Convert raw U_k scores to display V_k scores (0–100). */
export function uScoresToV(u: AbilityUScores): AbilityVScores {
  return {
    logic:      uToV(u.logic,      ABILITY_N.logic),
    execution:  uToV(u.execution,  ABILITY_N.execution),
    sales:      uToV(u.sales,      ABILITY_N.sales),
    creativity: uToV(u.creativity, ABILITY_N.creativity),
    management: uToV(u.management, ABILITY_N.management),
  };
}

/**
 * Parses av URL parameter into U_k scores.
 * Format: "1.<logicU>.<executionU>.<salesU>.<creativityU>.<managementU>"
 * Returns null on any validation failure.
 */
// Strict av format: "1." + 5 unsigned decimal integers (no spaces, signs, floats, leading zeros).
// Rejects inputs that Number() would silently coerce: " 12", "+12", "1e1", "012", fullwidth, etc.
const AV_STRICT_RE = /^1\.(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function parseAvParam(av: string | null): AbilityUScores | null {
  if (!av) return null;
  if (!AV_STRICT_RE.test(av)) return null;
  const parts = av.split(".");
  if (parts.length !== 6 || parts[0] !== "1") return null;

  const [, lS, eS, sS, cS, mS] = parts;
  const l = Number(lS);
  const e = Number(eS);
  const s = Number(sS);
  const c = Number(cS);
  const m = Number(mS);

  if (
    !Number.isSafeInteger(l) || !Number.isSafeInteger(e) ||
    !Number.isSafeInteger(s) || !Number.isSafeInteger(c) ||
    !Number.isSafeInteger(m)
  ) return null;

  if (l < 0 || l > 2 * ABILITY_N.logic)      return null;
  if (e < 0 || e > 2 * ABILITY_N.execution)  return null;
  if (s < 0 || s > 2 * ABILITY_N.sales)      return null;
  if (c < 0 || c > 2 * ABILITY_N.creativity) return null;
  if (m < 0 || m > 2 * ABILITY_N.management) return null;

  return { logic: l, execution: e, sales: s, creativity: c, management: m };
}

/** Builds av URL parameter string from U_k scores. */
export function buildAvParam(u: AbilityUScores): string {
  return `1.${u.logic}.${u.execution}.${u.sales}.${u.creativity}.${u.management}`;
}
