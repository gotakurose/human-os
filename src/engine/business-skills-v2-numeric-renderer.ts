import type { StyleAxisScores } from "@/engine/style-axis-scorer";
import {
  uScoresToDisplayScores,
  type AbilityUScores,
  type AbilityKey,
} from "@/engine/ability-scorer";
import type {
  BusinessSkillsV2Route,
  BusinessSkillsV2NumericTypeRule,
  BusinessSkillsV2QuantitativeRouteTemplates,
} from "@/schemas/business-skills-v2";
import type { BusinessSkillsV2Confidence } from "@/engine/business-skills-v2-selector";

// ── Public types ──────────────────────────────────────────────────────────────

type AxisPole =
  | "thinking"
  | "action"
  | "offensive"
  | "stable"
  | "individual"
  | "group"
  | "divergent"
  | "convergent";

export type BusinessSkillsV2AxisDisplayValues = Record<AxisPole, number>;
export type BusinessSkillsV2AbilityDisplayValues = Record<AbilityKey, number>;

// NOTE: templates are stored in numeric-rules.json > global > templates,
// NOT inside BusinessSkillsV2NumericTypeRule. They must be passed separately
// until the caller-side type is resolved. See structural report below.
export interface BusinessSkillsV2NumericRenderInput {
  route: BusinessSkillsV2Route;
  typeNumericRules: BusinessSkillsV2NumericTypeRule;
  templates: Record<string, string>; // from numericRules.global.templates
  quantitativeRouteTemplates: BusinessSkillsV2QuantitativeRouteTemplates;
  styleAxisScores: StyleAxisScores;
  abilityUScores: AbilityUScores;
  confidence: BusinessSkillsV2Confidence;
}

export interface BusinessSkillsV2NumericRenderResult {
  currentYouAppendParagraphs: string[];
  quantitativeParagraphs: string[];
  failureCorrectionParagraphs: string[];
  axisDisplayValues: BusinessSkillsV2AxisDisplayValues;
  abilityDisplayValues: BusinessSkillsV2AbilityDisplayValues;
}

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

type AxisPairKey = (typeof AXIS_PAIR_PRIORITY)[number];

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
const LAG_MIN_DISPLAY_GAP = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  const result = tpl.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = vars[key];
    if (val === undefined) {
      throw new Error(`Template variable not found: {{${key}}}`);
    }
    return val;
  });
  if (/\{\{[^}]+\}\}/.test(result)) {
    throw new Error(`Unresolved placeholder after fill: ${result.slice(0, 80)}`);
  }
  return result;
}

function sortedDesc<K extends string>(
  values: Record<K, number>,
  priority: readonly K[],
): K[] {
  return [...priority].sort((a, b) => {
    const diff = values[b] - values[a];
    if (Math.abs(diff) > EPSILON) return diff;
    return priority.indexOf(a) - priority.indexOf(b);
  });
}

/** Return true only when key's axisDisplayValue is strictly greater than every other type-side pole's. */
function isStrictlyMaxAmong(
  key: string,
  axisSorted: AxisPole[],
  axisDisplayValues: BusinessSkillsV2AxisDisplayValues,
): boolean {
  const v = (axisDisplayValues as Record<string, number>)[key] ?? 0;
  return axisSorted.every(
    (p) => p === key || ((axisDisplayValues as Record<string, number>)[p] ?? 0) < v,
  );
}

// ── Quantitative paragraph processing ────────────────────────────────────────

type QuantParaType = "topAxis" | "central" | "topAbility" | "lag" | "other";

function classifyQuantParagraph(p: string): QuantParaType {
  if (p.startsWith("4軸では")) return "topAxis";
  if (p.includes("中央に近")) return "central";
  if (p.startsWith("5能力では")) return "topAbility";
  if (
    p.includes("低いという意味ではありません") ||
    p.includes("低い能力ではありません") ||
    p.includes("上位の能力と比べると")
  )
    return "lag";
  return "other";
}

/** Extract ordered (label, axisKey) pairs from text containing label{{axis.key}} patterns */
function extractAxisMentions(
  text: string,
): Array<{ label: string; key: string }> {
  // Matches Japanese label text immediately before {{axis.key}}
  const RE =
    /([぀-ヿ一-鿿㐀-䶿＀-￯・ー]+)\{\{axis\.([a-z]+)\}\}/g;
  const out: Array<{ label: string; key: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = RE.exec(text)) !== null) {
    out.push({ label: m[1].replace(/^と/, ""), key: m[2] });
  }
  return out;
}

/** Normalize undefined-threshold expressions to rank-only equivalents */
function normalizeOrderingExpressions(s: string): string {
  s = s.replace(/が非常に高く、/g, "が最も高く、");
  s = s.replace(/が非常に高く出ています/g, "が最も高く出ています");
  s = s.replace(/が特に高く、/g, "が高く、");
  s = s.replace(/がほぼ同じ水準で続きます/g, "が続きます");
  s = s.replace(/も近い水準です/g, "が続きます");
  return s;
}

/**
 * Return true when the ordering claim in the normalized first sentence
 * matches runtime axis ranks (axisSorted[0] = rank1 = most type-side dominant).
 */
function isTopAxisOrderingConsistent(
  normalizedSentence: string,
  mentions: Array<{ label: string; key: string }>,
  axisSorted: AxisPole[],
  axisDisplayValues: BusinessSkillsV2AxisDisplayValues,
): boolean {
  const rank = (key: string) => axisSorted.indexOf(key as AxisPole) + 1;
  const disp = (key: string) =>
    (axisDisplayValues as Record<string, number>)[key] ?? 0;
  const n = mentions.length;
  if (n === 0) return true;

  // "Xが最も高く出ています" (1 axis) → rank1
  if (n === 1 && normalizedSentence.includes("が最も高く出ています")) {
    return rank(mentions[0].key) === 1 && isStrictlyMaxAmong(mentions[0].key, axisSorted, axisDisplayValues);
  }

  if (n === 2) {
    // "Xが最も高く、Yが続きます" → rank(X)=1, rank(Y)=2
    if (
      normalizedSentence.includes("が最も高く") &&
      normalizedSentence.includes("が続きます")
    ) {
      return rank(mentions[0].key) === 1 && rank(mentions[1].key) === 2 && isStrictlyMaxAmong(mentions[0].key, axisSorted, axisDisplayValues);
    }
    // "Xが高く、Yが続きます" (normalized from 特に) → rank(X)=1, rank(Y)=2
    if (
      normalizedSentence.includes("が高く") &&
      normalizedSentence.includes("が続きます")
    ) {
      return rank(mentions[0].key) === 1 && rank(mentions[1].key) === 2;
    }
    // "XとYが最も高く並びます" → rank(X)≤2 && rank(Y)≤2 && display values are exactly equal
    if (normalizedSentence.includes("が最も高く並びます")) {
      const v0 = disp(mentions[0].key);
      return (
        rank(mentions[0].key) <= 2 &&
        rank(mentions[1].key) <= 2 &&
        Math.abs(disp(mentions[0].key) - disp(mentions[1].key)) < EPSILON &&
        axisSorted.every(
          (p) =>
            p === mentions[0].key ||
            p === mentions[1].key ||
            disp(p) < v0 - EPSILON,
        )
      );
    }
  }

  if (n === 3) {
    // "Xが最も高く、Y/Zが続きます" → rank(X)=1, rank(Y)≤3, rank(Z)≤3, X strictly max
    if (normalizedSentence.includes("が最も高く")) {
      return (
        rank(mentions[0].key) === 1 &&
        rank(mentions[1].key) <= 3 &&
        rank(mentions[2].key) <= 3 &&
        isStrictlyMaxAmong(mentions[0].key, axisSorted, axisDisplayValues)
      );
    }
    // "XとYが高く、Zが続きます" (normalized from 特に) → rank(X/Y)≤2, rank(Z)≤3
    if (normalizedSentence.includes("が高く")) {
      return (
        rank(mentions[0].key) <= 2 &&
        rank(mentions[1].key) <= 2 &&
        rank(mentions[2].key) <= 3
      );
    }
  }

  if (n === 4) {
    // "Xが最も高く、Y/Z/Wが続きます" → rank(X)=1, X strictly max
    if (normalizedSentence.includes("が最も高く")) {
      return rank(mentions[0].key) === 1 && isStrictlyMaxAmong(mentions[0].key, axisSorted, axisDisplayValues);
    }
    // "XとYが高く、ZとWが続きます" (normalized from 特に) → rank(X/Y)≤2
    if (normalizedSentence.includes("が高く")) {
      return rank(mentions[0].key) <= 2 && rank(mentions[1].key) <= 2;
    }
  }

  return true; // Unknown pattern — keep as-is
}

/** Build neutral fallback: "4軸では、label1{val}、label2{val}という出方です。" */
function buildNeutralAxisSentence(
  mentions: Array<{ label: string; key: string }>,
  axisDisplayValues: BusinessSkillsV2AxisDisplayValues,
): string {
  const parts = mentions.map(
    (m) =>
      `${m.label}${String((axisDisplayValues as Record<string, number>)[m.key] ?? "")}`,
  );
  return `4軸では、${parts.join("、")}という出方です。`;
}

/**
 * Process a TopAxis paragraph:
 * 1. Split at first sentence boundary
 * 2. Normalize threshold expressions
 * 3. Check ordering consistency against runtime ranks
 * 4. If consistent: keep normalized first sentence, substitute all values
 * 5. If inconsistent: neutral first sentence + weaken "強く出ています" in rest
 */
function processTopAxisParagraph(
  raw: string,
  axisSorted: AxisPole[],
  axisDisplayValues: BusinessSkillsV2AxisDisplayValues,
  abilityDisplayValues: BusinessSkillsV2AbilityDisplayValues,
): string {
  const dotIdx = raw.indexOf("。");
  const firstRaw = dotIdx >= 0 ? raw.slice(0, dotIdx + 1) : raw;
  const rest = dotIdx >= 0 ? raw.slice(dotIdx + 1) : "";

  const mentions = extractAxisMentions(firstRaw);
  const firstNorm = normalizeOrderingExpressions(firstRaw);
  const consistent = isTopAxisOrderingConsistent(firstNorm, mentions, axisSorted, axisDisplayValues);

  const substituteAll = (s: string): string => {
    let r = s.replace(/\{\{axis\.([a-z]+)\}\}/g, (_m: string, key: string) => {
      const val = (axisDisplayValues as Record<string, number>)[key];
      if (val === undefined)
        throw new Error(
          `Unknown axis key in quantitative template: {{axis.${key}}}`,
        );
      return String(val);
    });
    r = r.replace(/\{\{ability\.([a-z]+)\}\}/g, (_m: string, key: string) => {
      const val = (abilityDisplayValues as Record<string, number>)[key];
      if (val === undefined)
        throw new Error(
          `Unknown ability key in quantitative template: {{ability.${key}}}`,
        );
      return String(val);
    });
    return r;
  };

  if (consistent) {
    return substituteAll(firstNorm) + substituteAll(rest);
  }

  // Ordering inconsistent: use neutral first sentence
  const neutralFirst = buildNeutralAxisSentence(mentions, axisDisplayValues);
  // Weaken "〜傾向が強く出ています" in the rest to avoid false strength claims
  const weakenedRest = rest.replace(/傾向が強く出ています/g, "傾向が表れています");
  return neutralFirst + substituteAll(weakenedRest);
}

/**
 * Return true when the Central axis qualifies for display at runtime.
 * typeSideDisplay sorts descending: axisSorted[3] (rank4) = most central (closest to 50).
 *
 * Multi-axis: the N mentioned axes must be the N closest to 50 among all 4 type-side axes.
 * Distance = typeSideDisplay - 50 (always ≥ 0); ties → show.
 * typeSideDisplay[pole] === axisDisplayValues[pole] for every type-side pole.
 */
function isCentralParagraphShown(
  centralKey: AxisPole,
  paragraph: string,
  axisSorted: AxisPole[],
  axisDisplayValues: BusinessSkillsV2AxisDisplayValues,
): boolean {
  const dist = (key: string) =>
    Math.abs(((axisDisplayValues as Record<string, number>)[key] ?? 50) - 50);
  const mentions = extractAxisMentions(paragraph);

  if (mentions.length > 1) {
    const n = mentions.length;
    // Sort type-side axes ascending by distance from 50 (closest first)
    const sorted = [...axisSorted].sort((a, b) => dist(a) - dist(b));
    const nthDist = dist(sorted[n - 1] ?? "");
    // Each mentioned axis must be within the N closest (ties → show)
    return mentions.every((m) => dist(m.key) <= nthDist);
  }

  // Single-axis: use the axis actually mentioned in the paragraph text
  const paragraphKey = mentions.length === 1 ? mentions[0].key : centralKey;

  // "最も中央に近い" → paragraph axis must have minimum |value−50| among all type-side poles
  if (paragraph.includes("最も中央に近")) {
    const minDist = Math.min(...axisSorted.map((p) => dist(p)));
    return dist(paragraphKey) <= minDist + EPSILON;
  }
  // "中央に近い" / "中央に比較的近い" → paragraph axis must be in bottom 2 closest to 50
  if (paragraph.includes("中央に近")) {
    const sortedAsc = [...axisSorted].sort((a, b) => dist(a) - dist(b));
    const cutoffDist = dist(sortedAsc[1] ?? sortedAsc[0]);
    return dist(paragraphKey) <= cutoffDist + EPSILON;
  }

  return true; // Unknown pattern — keep
}

/** Extract ordered (label, abilityKey) pairs from text containing label{{ability.key}} patterns */
function extractAbilityMentions(
  text: string,
): Array<{ label: string; key: string }> {
  const RE =
    /([぀-ヿ一-鿿㐀-䶿＀-￯・ー]+)\{\{ability\.([a-z]+)\}\}/g;
  const out: Array<{ label: string; key: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = RE.exec(text)) !== null) {
    out.push({ label: m[1].replace(/^[と、]+/, ""), key: m[2] });
  }
  return out;
}

/** Build neutral fallback: "5能力では、label1{val}[と/、]label2{val}という出方です。" */
function buildNeutralAbilitySentence(
  mentions: Array<{ label: string; key: string }>,
  abilityDisplayValues: BusinessSkillsV2AbilityDisplayValues,
): string {
  const parts = mentions.map(
    (m) =>
      `${m.label}${String((abilityDisplayValues as Record<string, number>)[m.key] ?? "")}`,
  );
  if (parts.length === 1) return `5能力では、${parts[0]}という出方です。`;
  if (parts.length === 2) return `5能力では、${parts[0]}と${parts[1]}という出方です。`;
  return `5能力では、${parts.join("、")}という出方です。`;
}

/**
 * Return true when the ordering claim in the first sentence matches runtime ability ranks.
 * abilitySorted[0] = rank1 = highest ability.
 */
function isTopAbilityOrderingConsistent(
  firstSentence: string,
  mentions: Array<{ label: string; key: string }>,
  abilitySorted: AbilityKey[],
  abilityDisplayValues: BusinessSkillsV2AbilityDisplayValues,
): boolean {
  const rank = (key: string) => abilitySorted.indexOf(key as AbilityKey) + 1;
  const disp = (key: string) =>
    (abilityDisplayValues as Record<string, number>)[key] ?? 0;
  const n = mentions.length;
  if (n === 0) return true;

  // "Xが最も高く" → X must be strictly rank 1 with no tie with rank 2
  if (firstSentence.includes("が最も高く")) {
    if (rank(mentions[0].key) !== 1) return false;
    const rank2Key = abilitySorted[1];
    if (rank2Key !== undefined && Math.abs(disp(mentions[0].key) - disp(rank2Key)) < EPSILON)
      return false;
    return true;
  }

  // "が上位" → all mentioned must exactly be the actual top-n
  if (firstSentence.includes("が上位")) {
    const topNKeys = new Set<string>(abilitySorted.slice(0, n));
    return mentions.every((m) => topNKeys.has(m.key));
  }

  return true; // Unknown pattern — keep
}

/**
 * Process a TopAbility paragraph:
 * Validate ordering claim in first sentence; replace with neutral fallback if inconsistent.
 * Subsequent sentences (ability roles etc.) are always kept unchanged.
 */
function processTopAbilityParagraph(
  raw: string,
  abilitySorted: AbilityKey[],
  abilityDisplayValues: BusinessSkillsV2AbilityDisplayValues,
  substituteValues: (s: string) => string,
): string {
  const dotIdx = raw.indexOf("。");
  const firstRaw = dotIdx >= 0 ? raw.slice(0, dotIdx + 1) : raw;
  const rest = dotIdx >= 0 ? raw.slice(dotIdx + 1) : "";

  const mentions = extractAbilityMentions(firstRaw);
  const consistent = isTopAbilityOrderingConsistent(
    firstRaw,
    mentions,
    abilitySorted,
    abilityDisplayValues,
  );

  if (consistent) {
    return substituteValues(raw);
  }

  // Ordering inconsistent: neutral first sentence + rest intact
  const neutralFirst = buildNeutralAbilitySentence(mentions, abilityDisplayValues);
  return neutralFirst + substituteValues(rest);
}

/**
 * In "other" paragraphs: replace "{{axis.key}}も高く、" with "{{axis.key}}は、"
 * when the axis display value is exactly 50 (neutral midpoint — neither high nor low).
 */
function neutralizeAxisHighClaims(
  raw: string,
  axisDisplayValues: BusinessSkillsV2AxisDisplayValues,
): string {
  return raw.replace(
    /\{\{axis\.([a-z]+)\}\}も高く、/g,
    (_match: string, key: string) => {
      const val = (axisDisplayValues as Record<string, number>)[key];
      if (val === 50) return `{{axis.${key}}}は、`;
      return _match;
    },
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

// Confidence × paragraph rules:
//
//   currentYouAppendParagraphs:
//     high:         [topAbilities, +relativeLagAbility if showLag]
//     medium / low: [topAbilities]
//
//   quantitativeParagraphs (from per-subRoute template):
//     TopAxis paragraph: ordering expression validated against runtime axis ranks;
//       neutralized to "4軸では、X{val}、Y{val}という出方です。" when inconsistent.
//       Undefined-threshold words (非常に/特に/ほぼ同じ) normalized before check.
//     Central paragraph: shown only when centralAxis typeSideDisplay rank qualifies
//       ("最も中央に近い" → rank4 only; "中央に近い" → rank3–4).
//     Lag paragraph: shown only when confidence === "high" && showLag === true.
//     All other paragraphs: included as-is (values substituted).
//     No artificial paragraph count limit by confidence level.
//
//   failureCorrectionParagraphs:
//     high:   up to 2 — lagImpact (if showLag), overuseRisk
//     medium: up to 1 — lagImpact (if showLag), overuseRisk
//     low:    [] always empty

export function renderBusinessSkillsV2NumericCopy(
  input: BusinessSkillsV2NumericRenderInput,
): BusinessSkillsV2NumericRenderResult {
  const {
    route,
    typeNumericRules,
    templates,
    quantitativeRouteTemplates,
    styleAxisScores,
    abilityUScores,
    confidence,
  } = input;

  // 1. All-8-pole axis display values (positive-side formula, pairs sum to 100)
  const posTA = Math.max(0, Math.min(100, 50 + Math.round(styleAxisScores.thinking_action * 50)));
  const posOS = Math.max(0, Math.min(100, 50 + Math.round(styleAxisScores.offensive_stable * 50)));
  const posST = Math.max(0, Math.min(100, 50 + Math.round(styleAxisScores.solo_team * 50)));
  const posDC = Math.max(
    0,
    Math.min(100, 50 + Math.round(styleAxisScores.divergent_convergent * 50)),
  );

  const axisDisplayValues: BusinessSkillsV2AxisDisplayValues = {
    thinking:   posTA,
    action:     100 - posTA,
    offensive:  posOS,
    stable:     100 - posOS,
    individual: posST,
    group:      100 - posST,
    divergent:  posDC,
    convergent: 100 - posDC,
  };

  // 2. Ability display values (50–100)
  const abilityDisplayValues: BusinessSkillsV2AbilityDisplayValues =
    uScoresToDisplayScores(abilityUScores);

  // 3. Rank abilities descending, tiebreak by ABILITY_PRIORITY
  const abilitySorted = sortedDesc(abilityDisplayValues, ABILITY_PRIORITY);
  const top1AbilKey = abilitySorted[0] as AbilityKey;
  const top2AbilKey = abilitySorted[1] as AbilityKey;

  // 4. Type-side axis display values (abs formula for ranking: always 50–100)
  const baseCode = typeNumericRules.baseCode;
  const rawScore: Record<AxisPairKey, number> = {
    thinking_action:      styleAxisScores.thinking_action,
    offensive_stable:     styleAxisScores.offensive_stable,
    solo_team:            styleAxisScores.solo_team,
    divergent_convergent: styleAxisScores.divergent_convergent,
  };

  const typeSidePoles: AxisPole[] = [];
  const typeSideDisplay: Partial<Record<AxisPole, number>> = {};
  for (let i = 0; i < 4; i++) {
    const letter = baseCode[i];
    const pair = AXIS_PAIR_PRIORITY[i];
    if (!letter || !pair) continue;
    const pole = BASE_CODE_TO_POLE[letter];
    if (!pole) continue;
    typeSidePoles.push(pole);
    typeSideDisplay[pole] = 50 + Math.round(Math.abs(rawScore[pair]) * 50);
  }

  // Pole order from baseCode positions — used as axis tiebreak
  const axisPolePriority = typeSidePoles;

  // 5. Rank type-side axes descending by typeSideDisplay, tiebreak by baseCode position
  const axisSorted = [...typeSidePoles].sort((a, b) => {
    const diff = (typeSideDisplay[b] ?? 50) - (typeSideDisplay[a] ?? 50);
    if (Math.abs(diff) > EPSILON) return diff;
    return axisPolePriority.indexOf(a) - axisPolePriority.indexOf(b);
  });

  const top1AxisPole = axisSorted[0] as AxisPole;

  // 6. Lag ability eligibility (route specifies the candidate; conditions must hold)
  const lagKey = route.abilityProfile.relativeLag;
  const lagRank = abilitySorted.indexOf(lagKey);
  const lagGap = abilityDisplayValues[top1AbilKey] - abilityDisplayValues[lagKey];
  const showLag = lagRank >= 2 && lagGap >= LAG_MIN_DISPLAY_GAP;

  // 7. Convenience accessors
  const tpl = (name: string): string => {
    const t = templates[name];
    if (!t) throw new Error(`Missing template: ${name}`);
    return t;
  };
  const ar = typeNumericRules.axes;
  const ab = typeNumericRules.abilities;

  // 8. currentYouAppendParagraphs
  //    high:         [topAbilities, +lag?]  — relativeLag appears only here
  //    medium / low: [topAbilities]          — no lag; low ability count = 1
  const currentYouAppendParagraphs: string[] = [];

  currentYouAppendParagraphs.push(
    fillTemplate(tpl("currentYouTopAbilities"), {
      topAbility1Label: ab[top1AbilKey].label,
      topAbility2Label: ab[top2AbilKey].label,
      topAbility1Role:  ab[top1AbilKey].role,
      topAbility2Role:  ab[top2AbilKey].role,
    }),
  );

  if (confidence === "high" && showLag) {
    currentYouAppendParagraphs.push(
      fillTemplate(tpl("currentYouLag"), {
        lagAbilityLabel:  ab[lagKey].label,
        lagAbilityImpact: ab[lagKey].lagImpact,
      }),
    );
  }

  // 9. quantitativeParagraphs — per-subRoute template with classification-aware processing
  const quantitativeParagraphs: string[] = [];
  const routeTemplate = quantitativeRouteTemplates[route.subRouteId];
  if (!routeTemplate) {
    throw new Error(`Missing quantitative template for subRouteId: ${route.subRouteId}`);
  }

  const substituteValues = (s: string): string => {
    let r = s.replace(/\{\{axis\.([a-z]+)\}\}/g, (_m: string, key: string) => {
      const val = (axisDisplayValues as Record<string, number>)[key];
      if (val === undefined)
        throw new Error(
          `Unknown axis key in quantitative template: {{axis.${key}}}`,
        );
      return String(val);
    });
    r = r.replace(/\{\{ability\.([a-z]+)\}\}/g, (_m: string, key: string) => {
      const val = (abilityDisplayValues as Record<string, number>)[key];
      if (val === undefined)
        throw new Error(
          `Unknown ability key in quantitative template: {{ability.${key}}}`,
        );
      return String(val);
    });
    if (/\{\{[^}]+\}\}/.test(r)) {
      throw new Error(
        `Unresolved placeholder in quantitative template for ${route.subRouteId}: ${r.slice(0, 80)}`,
      );
    }
    return r;
  };

  for (const rawParagraph of routeTemplate.paragraphs) {
    const paraType = classifyQuantParagraph(rawParagraph);

    if (paraType === "lag") {
      // Lag shown only for high confidence with showLag condition satisfied
      if (confidence !== "high" || !showLag) continue;
      quantitativeParagraphs.push(substituteValues(rawParagraph));
      continue;
    }

    if (paraType === "central") {
      // Central shown only when the central axis qualifies at runtime
      if (
        !isCentralParagraphShown(
          route.axisProfile.central,
          rawParagraph,
          axisSorted,
          axisDisplayValues,
        )
      )
        continue;
      quantitativeParagraphs.push(substituteValues(rawParagraph));
      continue;
    }

    if (paraType === "topAxis") {
      // Ordering validated and normalized; value substitution handled inside
      quantitativeParagraphs.push(
        processTopAxisParagraph(
          rawParagraph,
          axisSorted,
          axisDisplayValues,
          abilityDisplayValues,
        ),
      );
      continue;
    }

    if (paraType === "topAbility") {
      quantitativeParagraphs.push(
        processTopAbilityParagraph(rawParagraph, abilitySorted, abilityDisplayValues, substituteValues),
      );
      continue;
    }
    // other — neutralize axis=50 "も高く" before value substitution
    quantitativeParagraphs.push(substituteValues(neutralizeAxisHighClaims(rawParagraph, axisDisplayValues)));
  }

  // 10. failureCorrectionParagraphs
  //     high:   up to 2 — lagImpact (if showLag), then overuseRisk (if not null)
  //     medium: up to 1 — lagImpact (if showLag), then overuseRisk (if not null)
  //     low:    [] — always empty
  const failureCorrectionParagraphs: string[] = [];

  if (confidence !== "low") {
    const maxCorrections = confidence === "high" ? 2 : 1;
    const candidates: string[] = [];

    if (showLag) {
      const impact = ab[lagKey]?.lagImpact;
      if (impact) {
        const trimmed = impact.trimEnd().replace(/。$/, "");
        candidates.push(`${ab[lagKey].label}が相対的に遅い場合、${trimmed}。`);
      }
    }

    const overuse = ar[top1AxisPole]?.overuseRisk;
    if (overuse !== null && overuse !== undefined) {
      candidates.push(overuse);
    }

    failureCorrectionParagraphs.push(...candidates.slice(0, maxCorrections));
  }

  return {
    currentYouAppendParagraphs,
    quantitativeParagraphs,
    failureCorrectionParagraphs,
    axisDisplayValues,
    abilityDisplayValues,
  };
}
