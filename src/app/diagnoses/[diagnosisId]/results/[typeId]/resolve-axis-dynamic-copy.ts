// Pure selection logic for 4-axis dynamic copy V1.
// Data loading (dynamic-copy.json) is the caller's responsibility — this module is I/O-free.

import { LETTER_TO_POLE } from "./resolve-business-style";
import type { ResolvedBusinessStyle, TribeLetter, TypeAxesFallback } from "./resolve-business-style";

// ──────────────────────────────────────────────────────────────
// Public types
// ──────────────────────────────────────────────────────────────

export type DynamicCopyAxisRole = "dominant" | "soft" | "balanced";

export type DynamicCopyPole =
  | "think" | "act"
  | "offense" | "stability"
  | "individual" | "group"
  | "expand" | "focus"
  | "none";

export type DynamicCopyStrength = "mild" | "clear" | "extreme";

export type AxisKey = "ta" | "os" | "st" | "dc";

/** Minimal type definition from types.json — passed as an array so the function can look up internally. */
export interface TypeDefinition {
  id: string;
  axes: TypeAxesFallback;
}

export interface DynamicCopyPart {
  id: string;
  layer: string;
  axisRole: DynamicCopyAxisRole;
  pole: DynamicCopyPole;
  strength: DynamicCopyStrength;
  section: string;
  targetSlot: string;
  renderMode: "append_paragraph" | "replace_slot";
  conditions: string[];
  targetTypes: string[];
  forbiddenTypes: string[];
  priority: number;
  text: string;
}

export interface SelectDynamicCopyResult {
  /** All selected parts (0–2 items). */
  parts: DynamicCopyPart[];
  /** True when all 4 axes are mild — only balanced profile applies. */
  balanced: boolean;
  /** Selected dominant part, or null when balanced or not found. */
  dominantPart: DynamicCopyPart | null;
  /** Selected soft axis part, or null when conditions are not met. */
  softPart: DynamicCopyPart | null;
  /** Axis key of the soft axis when softPart is not null; otherwise null. */
  softAxisKey: AxisKey | null;
  /** Pole of the soft axis when softPart is not null; otherwise null. */
  softPole: DynamicCopyPole | null;
  /** Intensity of the soft axis when softPart is not null; otherwise null. */
  softIntensity: number | null;
  /** "ok" unless a data lookup anomaly is detected. */
  status:
    | "ok" | "dominant_not_found" | "dominant_multiple"
    | "invalid_type" | "invalid_expected_code"
    | "invalid_resolved_code" | "type_code_mismatch"
    | "data_conflict";
  /** Non-empty only when status is not "ok". */
  errors: string[];
}

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

/** Intensity classification boundaries.
 *  mild = [0, mildMax); clear = [mildMax, clearMax); extreme = [clearMax, 1.0] */
export const INTENSITY_THRESHOLDS = {
  mildMax: 0.30,
  clearMax: 0.65,
} as const;

/** Minimum required gap between dominant and soft intensities for soft to appear.
 *  Condition: dominantIntensity - softIntensity >= SOFT_MIN_GAP */
const SOFT_MIN_GAP = 0.25;

const ALL_AXIS_KEYS: ReadonlyArray<AxisKey> = ["ta", "os", "st", "dc"];

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

export type IntensityClass = "mild" | "clear" | "extreme";

/** Classifies a [0, 1] intensity value into mild / clear / extreme. */
export function classifyIntensity(intensity: number): IntensityClass {
  if (intensity < INTENSITY_THRESHOLDS.mildMax) return "mild";
  if (intensity < INTENSITY_THRESHOLDS.clearMax) return "clear";
  return "extreme";
}

/** Converts intensity to integer percentage (rounds to avoid IEEE 754 drift). */
function toIntensityPercent(value: number): number {
  return Math.round(value * 100);
}

/**
 * Returns true when dominantIntensity - softIntensity >= SOFT_MIN_GAP (0.25).
 * Uses integer-percentage arithmetic to avoid floating-point precision errors
 * (e.g. 0.35 - 0.10 = 0.2499... in IEEE 754 double).
 */
export function meetsSoftMinimumGap(
  dominantIntensity: number,
  softIntensity: number,
): boolean {
  return (
    toIntensityPercent(dominantIntensity) - toIntensityPercent(softIntensity)
  ) >= Math.round(SOFT_MIN_GAP * 100);
}

// ──────────────────────────────────────────────────────────────
// Integrity check helpers
// ──────────────────────────────────────────────────────────────

/** Valid 4-char style code: [TA][OS][IG][EF]. Defined once — do not copy this pattern. */
const VALID_CODE_RE = /^[TA][OS][IG][EF]$/;

/** Derives the expected 4-char base code from type axis values.
 *  Convention from types.json: 1 = positive pole, 4 = negative pole. */
function codeFromAxes(axes: TypeAxesFallback): string {
  return (
    (axes.thinkingAction      === 1 ? "T" : "A") +
    (axes.offensiveStable     === 1 ? "O" : "S") +
    (axes.soloTeam            === 1 ? "I" : "G") +
    (axes.divergentConvergent === 1 ? "E" : "F")
  );
}

/** Returns true when all axis values are exactly 1 or 4 (the only valid values in types.json). */
function isValidTypeAxes(axes: TypeAxesFallback): boolean {
  const ok = (v: number): boolean => v === 1 || v === 4;
  return ok(axes.thinkingAction) && ok(axes.offensiveStable) &&
         ok(axes.soloTeam)       && ok(axes.divergentConvergent);
}

/** Returns an empty selection result with the given status and a single error message. */
function emptyResult(
  s: SelectDynamicCopyResult["status"],
  msg: string,
): SelectDynamicCopyResult {
  return {
    parts: [], balanced: false, dominantPart: null, softPart: null,
    softAxisKey: null, softPole: null, softIntensity: null,
    status: s, errors: [msg],
  };
}

// ──────────────────────────────────────────────────────────────
// Main selection function
// ──────────────────────────────────────────────────────────────

/**
 * Selects 0–2 dynamic copy parts from the full pre-loaded parts array.
 *
 * Selection order:
 *   1. All-mild check → balanced profile (terminates; no dominant or soft).
 *   2. Dominant axis → one clear/extreme part.
 *   3. Soft axis → zero or one mild part (only when dominant was found).
 *
 * @param resolved            Output of resolveBusinessStyle — provides axisIntensities, dominantPole, etc.
 * @param typeId              The current result type ID (e.g. "vision-architect").
 * @param parts               All DynamicCopyPart entries loaded from dynamic-copy.json at call site.
 * @param allTypeDefinitions  All type definitions from types.json. The function searches internally for typeId.
 */
export function selectAxisDynamicCopy(
  resolved: ResolvedBusinessStyle,
  typeId: string,
  parts: DynamicCopyPart[],
  allTypeDefinitions: TypeDefinition[],
): SelectDynamicCopyResult {
  // Step 0: typeId / code integrity check — must pass before any selection logic runs.
  // The function resolves typeId → record internally; caller-supplied axes are never trusted directly.
  const typeMatches = allTypeDefinitions.filter(t => t.id === typeId);
  if (typeMatches.length === 0)
    return emptyResult("invalid_type", `typeId not found in types: ${typeId}`);
  if (typeMatches.length > 1)
    return emptyResult("data_conflict", `${typeMatches.length} records found for typeId=${typeId}`);
  const typeEntry = typeMatches[0];
  if (!isValidTypeAxes(typeEntry.axes))
    return emptyResult("invalid_expected_code", `Unexpected axis values for typeId=${typeId}`);
  const expectedCode = codeFromAxes(typeEntry.axes);
  const codeCollision = allTypeDefinitions.some(
    t => t.id !== typeId && codeFromAxes(t.axes) === expectedCode,
  );
  if (codeCollision)
    return emptyResult("invalid_expected_code",
      `Base code ${expectedCode} for typeId=${typeId} conflicts with another type entry`);
  if (!VALID_CODE_RE.test(resolved.code))
    return emptyResult("invalid_resolved_code", `Invalid resolved code: "${resolved.code}"`);
  if (resolved.code !== expectedCode)
    return emptyResult("type_code_mismatch",
      `resolved.code=${resolved.code} vs expected=${expectedCode} for typeId=${typeId}`);

  const { axisIntensities, dominantPole, dominantIntensity } = resolved;

  // Step 1: All-mild check → balanced profile.
  const allMild = ALL_AXIS_KEYS.every(k => classifyIntensity(axisIntensities[k]) === "mild");
  if (allMild) {
    const balancedCandidates = parts.filter(
      p => p.axisRole === "balanced" &&
           p.pole === "none" &&
           p.strength === "mild" &&
           p.targetSlot === "overview.axisBalanceNote" &&
           p.targetTypes.includes(typeId) &&
           !p.forbiddenTypes.includes(typeId),
    );
    if (balancedCandidates.length > 1) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          `[DynamicCopy] Multiple balanced parts for typeId=${typeId}: ${balancedCandidates.map(p => p.id).join(", ")}`,
        );
      }
      return emptyResult("data_conflict",
        `Multiple balanced parts for typeId=${typeId}: ${balancedCandidates.map(p => p.id).join(", ")}`);
    }
    const balancedPart = balancedCandidates[0] ?? null;
    return {
      parts: balancedPart !== null ? [balancedPart] : [],
      balanced: true,
      dominantPart: null,
      softPart: null,
      softAxisKey: null,
      softPole: null,
      softIntensity: null,
      status: "ok",
      errors: [],
    };
  }

  // Step 2: Dominant axis.
  // dominantPole and dominantIntensity are pre-computed by resolveBusinessStyle using the same
  // tie-breaking order as the tribe badge, so no separate max pass is needed here.
  const dominantStrength = classifyIntensity(dominantIntensity);
  const dominantCandidates = parts.filter(
    p => p.axisRole === "dominant" &&
         p.pole === dominantPole &&
         p.strength === dominantStrength &&
         p.targetTypes.includes(typeId) &&
         !p.forbiddenTypes.includes(typeId),
  );

  if (dominantCandidates.length === 0) {
    return {
      parts: [],
      balanced: false,
      dominantPart: null,
      softPart: null,
      softAxisKey: null,
      softPole: null,
      softIntensity: null,
      status: "dominant_not_found",
      errors: [`No dominant part: pole=${dominantPole} strength=${dominantStrength} typeId=${typeId}`],
    };
  }

  if (dominantCandidates.length > 1) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[DynamicCopy] Multiple dominant parts for pole=${dominantPole} strength=${dominantStrength} typeId=${typeId}: ${dominantCandidates.map(p => p.id).join(", ")}`,
      );
    }
    return {
      parts: [],
      balanced: false,
      dominantPart: null,
      softPart: null,
      softAxisKey: null,
      softPole: null,
      softIntensity: null,
      status: "dominant_multiple",
      errors: [`Multiple dominant parts: ${dominantCandidates.map(p => p.id).join(", ")}`],
    };
  }

  const dominantPart = dominantCandidates[0];

  // Step 3: Soft axis.
  // Find minimum intensity across all 4 axes.
  let minIntensity = axisIntensities[ALL_AXIS_KEYS[0]];
  for (const k of ALL_AXIS_KEYS) {
    if (axisIntensities[k] < minIntensity) minIntensity = axisIntensities[k];
  }
  // Minimum must be unique — tied minimum suppresses soft axis display.
  const minAxes = ALL_AXIS_KEYS.filter(k => axisIntensities[k] === minIntensity);
  const softAxisKey: AxisKey | null = minAxes.length === 1 ? minAxes[0] : null;

  let softPart: DynamicCopyPart | null = null;
  let softPole: DynamicCopyPole | null = null;
  let softIntensity: number | null = null;

  if (softAxisKey !== null) {
    const softi = axisIntensities[softAxisKey];
    if (
      classifyIntensity(softi) === "mild" &&
      meetsSoftMinimumGap(dominantIntensity, softi)
    ) {
      const softLetter: TribeLetter = resolved.axes[softAxisKey].letter;
      const candidatePole = LETTER_TO_POLE[softLetter];
      const softCandidates = parts.filter(
        p => p.axisRole === "soft" &&
             p.pole === candidatePole &&
             p.strength === "mild" &&
             p.targetTypes.includes(typeId) &&
             !p.forbiddenTypes.includes(typeId),
      );
      if (softCandidates.length === 1) {
        softPart = softCandidates[0];
        softPole = candidatePole;
        softIntensity = softi;
      } else if (softCandidates.length > 1) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            `[DynamicCopy] Multiple soft parts for pole=${candidatePole} typeId=${typeId}: ${softCandidates.map(p => p.id).join(", ")}`,
          );
        }
        return {
          parts: [dominantPart],
          balanced: false,
          dominantPart,
          softPart: null,
          softAxisKey: null,
          softPole: null,
          softIntensity: null,
          status: "data_conflict",
          errors: [`Multiple soft parts for pole=${candidatePole} typeId=${typeId}: ${softCandidates.map(p => p.id).join(", ")}`],
        };
      }
    }
  }

  return {
    parts: [dominantPart, ...(softPart !== null ? [softPart] : [])],
    balanced: false,
    dominantPart,
    softPart,
    softAxisKey: softPart !== null ? softAxisKey : null,
    softPole,
    softIntensity,
    status: "ok",
    errors: [],
  };
}
