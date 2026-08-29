import type { PersonProfile, DiagnosisResult } from "./types";

// ── 警告タグ名定数 ────────────────────────────────────────────────────────────

export const WARNING_TAGS = {
  QUIET_NEED_LOAD_EXCESS: "QUIET_NEED_LOAD_EXCESS",
  UNUSED_CONVENIENCE_COST: "UNUSED_CONVENIENCE_COST",
  ADDRESS_BRAND_COST: "ADDRESS_BRAND_COST",
  COMMUTE_DAMAGE: "COMMUTE_DAMAGE",
  HOME_SPACE_MISMATCH: "HOME_SPACE_MISMATCH",
  UNDERINVESTMENT_RISK: "UNDERINVESTMENT_RISK",
  URBAN_EXIT_ANXIETY: "URBAN_EXIT_ANXIETY",
  OPTION_HOARDING: "OPTION_HOARDING",
  STATUS_QUO_LOCK: "STATUS_QUO_LOCK",
} as const;

// ── タグ強度計算 (1-3) ────────────────────────────────────────────────────────

function toLevel(value: number): 1 | 2 | 3 {
  if (value >= 75) return 3;
  if (value >= 55) return 2;
  return 1;
}

// 各タグの「強度に使う代表指標」を返す
function tagIntensitySource(tag: string, profile: PersonProfile): number {
  const { E, B, D, G } = profile;
  switch (tag) {
    case WARNING_TAGS.QUIET_NEED_LOAD_EXCESS:
      return (G.G03 + E.E02) / 2;
    case WARNING_TAGS.UNUSED_CONVENIENCE_COST:
      return G.G06;
    case WARNING_TAGS.ADDRESS_BRAND_COST:
      return (D.D01 + D.D02) / 2;
    case WARNING_TAGS.COMMUTE_DAMAGE:
      return G.G10;
    case WARNING_TAGS.HOME_SPACE_MISMATCH:
      return (B.B01 * 0.4 + B.B02 * 0.6);
    case WARNING_TAGS.UNDERINVESTMENT_RISK:
      return G.G09;
    case WARNING_TAGS.URBAN_EXIT_ANXIETY:
      return D.D02;
    case WARNING_TAGS.OPTION_HOARDING:
      return (D.D03 + (100 - G.G05)) / 2;
    case WARNING_TAGS.STATUS_QUO_LOCK:
      return G.G11;
    default:
      return 50;
  }
}

export function getTagLevel(tag: string, profile: PersonProfile): 1 | 2 | 3 {
  return toLevel(tagIntensitySource(tag, profile));
}

// ── アクティブ警告タグリスト (最大3件) ────────────────────────────────────────

export function getTopWarningTags(
  result: DiagnosisResult,
  maxTags = 3,
): Array<{ tag: string; level: 1 | 2 | 3 }> {
  const profile = result.profile;
  return profile.warningTags
    .map((tag) => ({
      tag,
      level: getTagLevel(tag, profile),
      intensity: tagIntensitySource(tag, profile),
    }))
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, maxTags)
    .map(({ tag, level }) => ({ tag, level }));
}

// ── 推薦理由タグ (E上位3件) ─────────────────────────────────────────────────

const E_TO_FEATURE: Record<string, string> = {
  E01: "stimulation",
  E02: "recovery",
  E03: "convenience",
  E04: "activity",
  E05: "community",
  E06: "spontaneity",
  E07: "space",
};

export function getTopReasonFeatures(
  result: DiagnosisResult,
  maxFeatures = 3,
): string[] {
  const { E, B } = result.profile;
  const scores: [string, number][] = [
    ["E01", E.E01 + B.B03 * 0.1],
    ["E02", E.E02 + B.B01 * 0.1],
    ["E03", E.E03 + B.B04 * 0.1],
    ["E04", E.E04 + B.B05 * 0.1],
    ["E05", E.E05],
    ["E06", E.E06 + B.B06 * 0.1],
    ["E07", E.E07 + B.B02 * 0.1],
  ];
  return scores
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxFeatures)
    .map(([eKey]) => E_TO_FEATURE[eKey]);
}
