// Pure helper: derives 4-char style code + tribe badge from normalized axis scores.
// Input: style axis scores in [-1, +1] range (positive = positive pole).
// No scoring logic — display only.

import { TRIBE_BADGES } from "./result-assets";

// Axis order used for dominant axis and tribe tie-breaking — first entry wins.
export const TRIBE_AXIS_TIE_PRIORITY = ["ta", "os", "st", "dc"] as const;
type TieAxisKey = (typeof TRIBE_AXIS_TIE_PRIORITY)[number];

export type TribeLetter = "T" | "A" | "O" | "S" | "I" | "G" | "E" | "F";

export type DominantPole =
  | "think" | "act"
  | "offense" | "stability"
  | "individual" | "group"
  | "expand" | "focus";

export interface ResolvedBusinessStyle {
  /** 4-character style code, e.g. "TOIE" */
  code: string;
  axes: {
    ta: { letter: "T" | "A"; strength: number };
    os: { letter: "O" | "S"; strength: number };
    st: { letter: "I" | "G"; strength: number };
    dc: { letter: "E" | "F"; strength: number };
  };
  tribe: {
    letter: TribeLetter;
    label: string;
    image: string;
  };
  /** Per-axis intensities: abs(axisScore) / axisMaxScore.
   *  axisMaxScore = 1.0 for [-1, +1] input, so intensity equals the per-axis strength. */
  axisIntensities: { ta: number; os: number; st: number; dc: number };
  /** Axis key with the highest intensity, tie-broken by TRIBE_AXIS_TIE_PRIORITY order. */
  dominantAxisKey: TieAxisKey;
  /** Pole of the dominant axis — always the same source as the tribe badge. */
  dominantPole: DominantPole;
  /** Intensity of the dominant axis. 0 when all axes are at centre. */
  dominantIntensity: number;
}

/** Normalized style axis scores in [-1, +1] range.
 *  Positive = positive pole (T, O, I, E). Negative = negative pole (A, S, G, F). */
export interface NormalizedStyleScores {
  thinking_action: number;
  offensive_stable: number;
  solo_team: number;
  divergent_convergent: number;
}

/** Type axes from types.json.
 *  1 = positive pole, 4 = negative pole (matches resolveStyleAxisType convention). */
export interface TypeAxesFallback {
  thinkingAction: number;
  offensiveStable: number;
  soloTeam: number;
  divergentConvergent: number;
}

/**
 * Parses ta/os/st/dc URL search params into normalized [-1, +1] style axis scores.
 * Returns null if any param is absent, non-finite integer, or outside [-100, 100].
 * Callers must fall back to typeAxes when null is returned; do NOT substitute 0.
 */
export function parseStyleAxisParams(
  searchParams: { get(key: string): string | null },
): NormalizedStyleScores | null {
  const ta = searchParams.get("ta");
  const os = searchParams.get("os");
  const st = searchParams.get("st");
  const dc = searchParams.get("dc");

  if (ta === null || os === null || st === null || dc === null) return null;

  // Reject partial-match strings ("10abc"), floats ("1.5"), NaN, Infinity.
  // Number("10abc") = NaN but parseInt("10abc", 10) = 10 — the regex guards against parseInt.
  if (
    !/^-?\d+$/.test(ta) || !/^-?\d+$/.test(os) ||
    !/^-?\d+$/.test(st) || !/^-?\d+$/.test(dc)
  ) return null;

  const taV = Number(ta);
  const osV = Number(os);
  const stV = Number(st);
  const dcV = Number(dc);

  if (
    !Number.isSafeInteger(taV) || !Number.isSafeInteger(osV) ||
    !Number.isSafeInteger(stV) || !Number.isSafeInteger(dcV)
  ) return null;

  if (
    taV < -100 || taV > 100 || osV < -100 || osV > 100 ||
    stV < -100 || stV > 100 || dcV < -100 || dcV > 100
  ) {
    return null;
  }

  return {
    thinking_action:      taV / 100,
    offensive_stable:     osV / 100,
    solo_team:            stV / 100,
    divergent_convergent: dcV / 100,
  };
}

export const LETTER_TO_POLE: Record<TribeLetter, DominantPole> = {
  T: "think",
  A: "act",
  O: "offense",
  S: "stability",
  I: "individual",
  G: "group",
  E: "expand",
  F: "focus",
};

/** Derives letter + strength for one axis.
 *  score > 0 → positive pole; score < 0 → negative pole; score = 0 → fallback from type axes. */
function resolveAxis<P extends string, N extends string>(
  score: number,
  posLetter: P,
  negLetter: N,
  fallbackPoleValue: number,
): { letter: P | N; strength: number } {
  if (score > 0) return { letter: posLetter, strength: score };
  if (score < 0) return { letter: negLetter, strength: -score };
  // Exact centre: use the type's own pole to avoid contradicting the result type
  return { letter: fallbackPoleValue === 1 ? posLetter : negLetter, strength: 0 };
}

/**
 * Derives the 4-char style code and tribe badge from normalized axis scores.
 *
 * @param styleScores  Normalized [-1, +1] scores, or null when URL params are absent.
 * @param typeAxes     Type's axes from types.json (1/4 per axis). Always required.
 */
export function resolveBusinessStyle(
  styleScores: NormalizedStyleScores | null,
  typeAxes: TypeAxesFallback,
): ResolvedBusinessStyle {
  const s: NormalizedStyleScores = styleScores ?? {
    thinking_action: 0,
    offensive_stable: 0,
    solo_team: 0,
    divergent_convergent: 0,
  };

  const ta = resolveAxis(s.thinking_action,      "T", "A", typeAxes.thinkingAction);
  const os = resolveAxis(s.offensive_stable,     "O", "S", typeAxes.offensiveStable);
  const st = resolveAxis(s.solo_team,            "I", "G", typeAxes.soloTeam);
  const dc = resolveAxis(s.divergent_convergent, "E", "F", typeAxes.divergentConvergent);

  const code = `${ta.letter}${os.letter}${st.letter}${dc.letter}`;

  // Intensities: abs(axisScore) / axisMaxScore. axisMaxScore = 1.0 for [-1, +1] input,
  // so intensity equals the already-computed per-axis strength.
  const axisIntensities = { ta: ta.strength, os: os.strength, st: st.strength, dc: dc.strength };

  // Single pass: dominant axis = highest intensity, tie-broken by TRIBE_AXIS_TIE_PRIORITY.
  // Tribe badge is always derived from this same dominant axis — no separate max pass.
  let dominantAxisKey: TieAxisKey = TRIBE_AXIS_TIE_PRIORITY[0];
  for (const k of TRIBE_AXIS_TIE_PRIORITY) {
    if (axisIntensities[k] > axisIntensities[dominantAxisKey]) dominantAxisKey = k;
  }

  const byAxis = { ta, os, st, dc };
  const dominantLetter = byAxis[dominantAxisKey].letter as TribeLetter;
  const dominantPole = LETTER_TO_POLE[dominantLetter];
  const dominantIntensity = axisIntensities[dominantAxisKey];

  const badge = TRIBE_BADGES[dominantPole];

  return {
    code,
    axes: {
      ta: { letter: ta.letter as "T" | "A", strength: ta.strength },
      os: { letter: os.letter as "O" | "S", strength: os.strength },
      st: { letter: st.letter as "I" | "G", strength: st.strength },
      dc: { letter: dc.letter as "E" | "F", strength: dc.strength },
    },
    tribe: {
      letter: dominantLetter,
      label:  badge.displayName,
      image:  badge.image,
    },
    axisIntensities,
    dominantAxisKey,
    dominantPole,
    dominantIntensity,
  };
}
