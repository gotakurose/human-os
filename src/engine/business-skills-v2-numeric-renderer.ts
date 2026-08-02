import type { StyleAxisScores } from "@/engine/style-axis-scorer";
import {
  uScoresToDisplayScores,
  type AbilityUScores,
  type AbilityKey,
} from "@/engine/ability-scorer";
import type {
  BusinessSkillsV2Route,
  BusinessSkillsV2NumericTypeRule,
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

// ── Public API ────────────────────────────────────────────────────────────────

// Confidence-based paragraph limits (per section):
//
//   high:   currentYou=[topAbilities, +lag?] ≤2  quant=[topAxes,centralAxis,topAbilities,+lag?]≤4  failure≤2
//   medium: currentYou=[topAbilities]         =1  quant=[topAxes,centralAxis,topAbilities]          =3  failure≤1
//   low:    currentYou=[topAbilities]         =1  quant=[topAxes,centralAxis,topAbilities]          =3  failure=0
//
// relativeLag appears only in HIGH (when showLag=true).
// LOW upper limits: currentYou ability=1, quant ability=1, quant topAxes=1, failure=0.

export function renderBusinessSkillsV2NumericCopy(
  input: BusinessSkillsV2NumericRenderInput,
): BusinessSkillsV2NumericRenderResult {
  const { route, typeNumericRules, templates, styleAxisScores, abilityUScores, confidence } =
    input;

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
  const top2AxisPole = axisSorted[1] as AxisPole;
  const centralAxisPole = axisSorted[3] as AxisPole; // rank-4 = closest to 50

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

  // 9. quantitativeParagraphs
  //    high:         [topAxes, centralAxis, topAbilities, +lag?]  — relativeLag appears only here
  //    medium / low: [topAxes, centralAxis, topAbilities]          — no lag
  //    low limits:   topAxes=1 paragraph, topAbilities=1 paragraph (same structure as medium)
  const quantitativeParagraphs: string[] = [];

  quantitativeParagraphs.push(
    fillTemplate(tpl("quantTopAxes"), {
      topAxis1Label: ar[top1AxisPole]?.label ?? top1AxisPole,
      topAxis1Value: String(typeSideDisplay[top1AxisPole] ?? 50),
      topAxis2Label: ar[top2AxisPole]?.label ?? top2AxisPole,
      topAxis2Value: String(typeSideDisplay[top2AxisPole] ?? 50),
      topAxis1Role:  ar[top1AxisPole]?.role ?? "",
      topAxis2Role:  ar[top2AxisPole]?.role ?? "",
    }),
  );

  quantitativeParagraphs.push(
    fillTemplate(tpl("quantCentralAxis"), {
      centralAxisLabel:   ar[centralAxisPole]?.label ?? centralAxisPole,
      centralAxisValue:   String(typeSideDisplay[centralAxisPole] ?? 50),
      centralAxisCentral: ar[centralAxisPole]?.central ?? "",
    }),
  );

  quantitativeParagraphs.push(
    fillTemplate(tpl("quantTopAbilities"), {
      topAbility1Label: ab[top1AbilKey].label,
      topAbility1Value: String(abilityDisplayValues[top1AbilKey]),
      topAbility2Label: ab[top2AbilKey].label,
      topAbility2Value: String(abilityDisplayValues[top2AbilKey]),
      topAbility1Role:  ab[top1AbilKey].role,
      topAbility2Role:  ab[top2AbilKey].role,
    }),
  );

  if (confidence === "high" && showLag) {
    quantitativeParagraphs.push(
      fillTemplate(tpl("quantLag"), {
        lagAbilityLabel:  ab[lagKey].label,
        lagAbilityValue:  String(abilityDisplayValues[lagKey]),
        lagAbilityImpact: ab[lagKey].lagImpact,
      }),
    );
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
      if (impact) candidates.push(impact);
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
