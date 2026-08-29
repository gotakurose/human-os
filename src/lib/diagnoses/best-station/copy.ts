import type { DiagnosisResult, StationMatchResult, TemptingMismatchStation } from "./types";
import { getTopWarningTags, getTopReasonFeatures } from "./tags";

// ── コピー構造 ────────────────────────────────────────────────────────────────

export interface ActiveShout {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

export interface ResultCopyData {
  stationName: string;
  resultLine: string;
  sharpOpening: string;
  coreAnalysisText: string;
  strainTexts: string[];
  stationFitTexts: string[];
  stationTradeoff: string | null;
  temptingText: string | null;
  temptingStationName: string | null;
  supportiveClosing: string;
  // Legacy
  shouts: ActiveShout[];
  reasonLines: string[];
  closing: string;
}

type ShoutRecord = {
  id: string;
  requiredTag: string;
  levels: Record<"1" | "2" | "3", string>;
};

type CopyJson = {
  copySpecVersion?: string;
  sharpOpenings?: Record<string, string>;
  coreAnalysisTemplates?: Record<string, string>;
  strainTemplates?: Record<string, string>;
  tradeoffTemplates?: Record<string, string>;
  temptingMismatchTemplates?: Record<string, string>;
  supportiveClosings?: string[];
  shouts: ShoutRecord[];
  reasonTemplates: Record<string, string>;
  closings: string[];
};

// ── コピー生成 ────────────────────────────────────────────────────────────────

function pickSharpOpening(result: DiagnosisResult, openings: Record<string, string>): string {
  const topTags = result.profile.warningTags;
  if (topTags.length === 0) return openings["fit"] ?? openings["default"] ?? "";
  for (const tag of topTags) {
    if (openings[tag]) return openings[tag];
  }
  return openings["default"] ?? "";
}

function pickCoreAnalysis(result: DiagnosisResult, templates: Record<string, string>): string {
  const { E } = result.profile;
  const eScores: [string, number][] = [
    ["E01", E.E01],
    ["E02", E.E02],
    ["E03", E.E03],
    ["E04", E.E04],
    ["E06", E.E06],
    ["E07", E.E07],
  ];
  const sorted = eScores.sort((a, b) => b[1] - a[1]);
  const top1 = sorted[0]?.[0];
  const top2 = sorted[1]?.[0];
  // 両方高い組み合わせチェック
  if (top1 === "E01" && top2 === "E02" && E.E01 >= 50 && E.E02 >= 50) {
    return templates["high_E01_high_E02"] ?? templates["high_E01"] ?? templates["default"] ?? "";
  }
  const keyMap: Record<string, string> = {
    E01: "high_E01",
    E02: "high_E02",
    E03: "high_E03",
    E04: "high_E04",
    E06: "high_E06",
    E07: "high_E07",
  };
  if (top1 && sorted[0][1] >= 60) {
    return templates[keyMap[top1]] ?? templates["default"] ?? "";
  }
  if (E.E01 <= 30 && E.E04 <= 30) {
    return templates["low_E01_low_E04"] ?? templates["default"] ?? "";
  }
  return templates["default"] ?? "";
}

function pickStrainTexts(result: DiagnosisResult, strainTemplates: Record<string, string>): string[] {
  const topTags = getTopWarningTags(result, 2);
  const texts: string[] = [];
  for (const { tag } of topTags) {
    const t = strainTemplates[tag] ?? strainTemplates["default"];
    if (t) texts.push(t);
  }
  return texts;
}

function pickTemptingText(
  tempting: TemptingMismatchStation | null,
  templates: Record<string, string>,
  profile: DiagnosisResult["profile"],
): string | null {
  if (!tempting) return null;
  const topWarning = profile.warningTags[0];
  return templates[topWarning] ?? templates["default"] ?? null;
}

export function assembleCopy(
  result: DiagnosisResult,
  copyJson: CopyJson,
  closingIndex?: number,
): ResultCopyData {
  const primary = result.primary;
  const profile = result.profile;

  // ── New modules ────────────────────────────────────────────────────────────
  const sharpOpening = pickSharpOpening(result, copyJson.sharpOpenings ?? {});
  const coreAnalysisText = pickCoreAnalysis(result, copyJson.coreAnalysisTemplates ?? {});
  const strainTexts = pickStrainTexts(result, copyJson.strainTemplates ?? {});
  const stationFitTexts = getTopReasonFeatures(result, 3)
    .map((f) => copyJson.reasonTemplates[f])
    .filter(Boolean);
  const stationTradeoff = copyJson.tradeoffTemplates?.["default"] ?? null;
  const temptingText = pickTemptingText(
    result.temptingMismatch ?? null,
    copyJson.temptingMismatchTemplates ?? {},
    profile,
  );
  const temptingStationName = result.temptingMismatch?.station.stationName ?? null;

  const closingCount = (copyJson.supportiveClosings ?? copyJson.closings).length;
  const closingArr = copyJson.supportiveClosings ?? copyJson.closings;
  const idx =
    closingIndex !== undefined
      ? closingIndex % closingCount
      : Math.abs(Math.floor(profile.E.E01 + profile.E.E02 * 2 + profile.B.B01 * 3)) % closingCount;
  const supportiveClosing = closingArr[idx] ?? closingArr[0] ?? "";

  // ── Legacy ─────────────────────────────────────────────────────────────────
  const topTags = getTopWarningTags(result, 3);
  const shoutMap = new Map(copyJson.shouts.map((s) => [s.requiredTag, s]));
  const shouts: ActiveShout[] = topTags.flatMap(({ tag, level }) => {
    const shout = shoutMap.get(tag);
    if (!shout) return [];
    return [{ id: shout.id, level, text: shout.levels[String(level) as "1" | "2" | "3"] }];
  });
  const reasonLines = getTopReasonFeatures(result, 3)
    .map((f) => copyJson.reasonTemplates[f])
    .filter(Boolean);
  const closing = closingArr[idx] ?? closingArr[0] ?? "";

  return {
    stationName: primary.station.stationName,
    resultLine: primary.station.resultLine,
    sharpOpening,
    coreAnalysisText,
    strainTexts,
    stationFitTexts,
    stationTradeoff,
    temptingText,
    temptingStationName,
    supportiveClosing,
    shouts,
    reasonLines,
    closing,
  };
}

// ── 代替駅用サブコピー ────────────────────────────────────────────────────────

export function alternativeLine(alt: StationMatchResult): string {
  return `${alt.station.stationName} — ${alt.station.resultLine}`;
}
