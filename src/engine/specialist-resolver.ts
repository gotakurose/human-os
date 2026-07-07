import type { AbilityKey, AbilityUScores } from "./ability-scorer";
import { ABILITY_N, uScoresToV } from "./ability-scorer";

// Per-ability minimum V thresholds. Compared as integers: 50 × U_k ≥ minV_k × n_k (no rounding).
// Calibrated via scripts/simulate-five-abilities.ts (N=500,000 uniform):
//   overall rate ≈9.4% | max ability share 26% | min ability share 4.6%
const SPECIALIST_MIN_V: Record<AbilityKey, number> = {
  logic:      70,   // effective U≥17 (rational V≥70.83)
  execution:  68,   // effective U≥11 (rational V≥68.75)
  sales:      76,   // effective U≥7  (rational V≥87.50)
  creativity: 71,   // effective U≥10 (rational V≥71.43)
  management: 71,   // effective U≥8  (rational V≥80.00)
};

export const SPECIALIST_THRESHOLDS = {
  minV:   SPECIALIST_MIN_V,
  /** Minimum rational gap (V_top − V_second) required. Checked via integer cross-multiplication. */
  minGap: 10,
} as const;

export interface SpecialistResult {
  ability: AbilityKey | null;
  /** Display V_k score (Math.round), or null if no specialist. */
  vScore: number | null;
  /** Display gap V_top − V_second (Math.round values), or null if no specialist. */
  gapToSecond: number | null;
}

const ALL_ABILITIES: AbilityKey[] = ["logic", "execution", "sales", "creativity", "management"];

/**
 * Resolves which specialist badge (if any) the user qualifies for.
 *
 * All ordering and threshold checks use raw U_k scores via cross-multiplication
 * (integer arithmetic, no Math.round) per spec:
 *   U_a/n_a > U_b/n_b  ⟺  U_a × n_b > U_b × n_a
 *
 * Conditions (all must hold):
 *   1. Top rational V_k strictly greater than second (unique leader):
 *      U_top × n_sec > U_sec × n_top
 *   2. minV per ability: 50 × U_top ≥ minV[top] × n_top
 *   3. gap: 50 × (U_top × n_sec − U_sec × n_top) ≥ minGap × n_top × n_sec
 *
 * vScore and gapToSecond are Math.round display values only.
 */
export function resolveSpecialist(u: AbilityUScores): SpecialistResult {
  const NONE: SpecialistResult = { ability: null, vScore: null, gapToSecond: null };
  const N = ABILITY_N;

  // Sort by rational V = U_k / n_k descending via cross-product (integers, no overflow).
  const sorted = ALL_ABILITIES.slice().sort(
    (ka, kb) => u[kb] * N[ka] - u[ka] * N[kb],
  );

  const topKey = sorted[0];
  const secKey = sorted[1];
  const uTop   = u[topKey];
  const uSec   = u[secKey];
  const nTop   = N[topKey];
  const nSec   = N[secKey];

  // 1. Unique top (strict)
  if (uTop * nSec <= uSec * nTop) return NONE;

  // 2. Per-ability minV: 50 × U_top ≥ minV[top] × n_top
  if (50 * uTop < SPECIALIST_THRESHOLDS.minV[topKey] * nTop) return NONE;

  // 3. Gap: 50 × (U_top × n_sec − U_sec × n_top) ≥ minGap × n_top × n_sec
  if (50 * (uTop * nSec - uSec * nTop) < SPECIALIST_THRESHOLDS.minGap * nTop * nSec) return NONE;

  // Display values — Math.round for output only, not used in comparisons above.
  const v = uScoresToV(u);
  return {
    ability:     topKey,
    vScore:      v[topKey],
    gapToSecond: v[topKey] - v[secKey],
  };
}
