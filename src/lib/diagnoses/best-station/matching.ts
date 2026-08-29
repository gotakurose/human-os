import type {
  Station,
  PersonProfile,
  StationMatchBreakdown,
  StationMatchResult,
  DiagnosisResult,
  GapIndicators,
  TemptingMismatchStation,
  IdealEnvironment,
} from "./types";
import type { StationBenefits } from "./types";

// ── ユーティリティ ────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

// ── benefit shortfall ────────────────────────────────────────────────────────

function computeBenefitShortfall(station: Station, profile: PersonProfile): number {
  const { E, B } = profile;
  const b = station.benefits;

  // E01-E07 vs station benefits; E05 uses abs() per spec
  const e01 = Math.max(0, E.E01 - b.stimulation);
  const e02 = Math.max(0, E.E02 - b.recovery);
  const e03 = Math.max(0, E.E03 - b.convenience);
  const e04 = Math.max(0, E.E04 - b.activity);
  const e05 = Math.abs(E.E05 - b.community);  // abs, not max(0, ...)
  const e06 = Math.max(0, E.E06 - b.spontaneity);
  const e07 = Math.max(0, E.E07 - b.space);

  // B01 home load — if high B01, benefit shortfall adjusted by space match
  void B;

  return (e01 + e02 + e03 + e04 + e05 + e06 + e07) / 7;
}

// ── load overrun ─────────────────────────────────────────────────────────────

function computeLoadOverrun(station: Station, profile: PersonProfile): number {
  const { T, B } = profile;
  const l = station.loads;

  // Exposure factors per spec
  const expT01 = 0.5 + 0.5 * (B.B01 / 100);
  const expT02 = 0.5 + 0.5 * (Math.max(B.B03, B.B05, B.B07) / 100);
  const expT03 = 1.0;
  const expT04 = 0.5 + 0.5 * (B.B04 / 100);
  const expT06 = 0.5 + 0.5 * (Math.max(B.B01, B.B02) / 100);
  const expT07 = 0.5 + 0.5 * (B.B04 / 100);

  const o01 = Math.max(0, l.noise - T.T01) * expT01;
  const o02 = Math.max(0, l.crowd - T.T02) * expT02;
  const o03 = Math.max(0, l.isolation - T.T03) * expT03;
  const o04 = Math.max(0, l.inconvenience - T.T04) * expT04;
  const o06 = Math.max(0, l.small_space - T.T06) * expT06;
  const o07 = Math.max(0, l.intrusion - T.T07) * expT07;

  // 6 load metrics (T05 = commute tolerance, handled separately via B08)
  return (o01 + o02 + o03 + o04 + o06 + o07) / 6;
}

// ── economic penalty ─────────────────────────────────────────────────────────

const TIER_GAP_PENALTY: Record<string, number> = {
  "0": 0,
  "1": 8,
  "2": 20,
  "3": 40,
  "4_plus": 70,
};

function computeEconomicPenalty(station: Station, profile: PersonProfile): number {
  const budgetTier = profile.F.F01;
  if (budgetTier === null) return 0;

  const gap = station.rentTier - budgetTier;
  if (gap <= 0) return 0;

  const key = gap >= 4 ? "4_plus" : String(gap);
  return TIER_GAP_PENALTY[key] ?? 0;
}

// ── destination penalty ──────────────────────────────────────────────────────

const BASE_PER_BAND = 15;
const PRIMARY_MULT = 1.0;
const SECONDARY_MULT = 0.4;

function computeDestinationPenalty(station: Station, profile: PersonProfile): number {
  const reality = profile.reality;
  const primary = reality.primaryTokyoDestinationZone;
  const secondary = reality.secondaryTokyoDestinationZones;
  const days = reality.commuteDaysPerWeek;

  if (!primary || primary === "none") return 0;

  const frequencyFactor = days !== null ? Math.min(1, days / 5) : 0.6;
  const primaryBand = station.destinationZonePenalty[primary] ?? null;
  if (primaryBand === null) return 0;  // unknownPolicy: omit_and_lower_confidence

  const primaryPenalty = primaryBand * BASE_PER_BAND * PRIMARY_MULT * frequencyFactor;

  let secSum = 0;
  let secCount = 0;
  for (const zone of secondary) {
    const band = station.destinationZonePenalty[zone];
    if (band !== undefined) {
      secSum += band * BASE_PER_BAND * SECONDARY_MULT;
      secCount++;
    }
  }
  const secAvg = secCount > 0 ? secSum / secCount : 0;

  return clamp(primaryPenalty + secAvg);
}

// ── 単駅スコアリング ──────────────────────────────────────────────────────────

export function scoreStation(station: Station, profile: PersonProfile): StationMatchBreakdown {
  const benefitShortfall = clamp(computeBenefitShortfall(station, profile));
  const loadOverrun = clamp(computeLoadOverrun(station, profile));
  const economicPenalty = clamp(computeEconomicPenalty(station, profile));
  const destinationPenalty = clamp(computeDestinationPenalty(station, profile));

  const totalScore = clamp(
    100
      - benefitShortfall * 0.45
      - loadOverrun * 0.20
      - economicPenalty * 0.20
      - destinationPenalty * 0.15,
  );

  return { benefitShortfall, loadOverrun, economicPenalty, destinationPenalty, totalScore };
}

// ── aspirationAffinity / actualMismatch (Phase 3) ───────────────────────────

const I_TO_BENEFIT: Record<string, keyof StationBenefits> = {
  I01: "stimulation",
  I02: "recovery",
  I03: "convenience",
  I04: "activity",
  I05: "community",
  I06: "spontaneity",
  I07: "space",
};

// aspirationAffinity: 観測済みI=100(must_have)項目と駅の便益特徴の一致度
function computeAspirationAffinity(
  station: Station,
  profile: PersonProfile,
): { value: number; coverage: number } {
  const { I } = profile;
  let mustHaveAligned = 0;
  let mustHaveCount = 0;
  let observedCount = 0;

  const iKeys = Object.keys(I_TO_BENEFIT) as (keyof IdealEnvironment)[];
  for (const key of iKeys) {
    const iv = I[key];
    if (iv === null) continue;
    observedCount++;
    if (iv === 100) {
      const bKey = I_TO_BENEFIT[key];
      mustHaveAligned += station.benefits[bKey];
      mustHaveCount++;
    }
  }

  const affinity = mustHaveCount > 0 ? mustHaveAligned / mustHaveCount : 0;
  return { value: clamp(affinity), coverage: observedCount / 7 };
}

// actualMismatch: 総合不一致 (= 100 - totalScore)
function computeActualMismatch(breakdown: StationMatchBreakdown): number {
  return clamp(100 - breakdown.totalScore);
}

// 惹かれやすいが無理が出やすい駅の選定閾値
const ASPIRATION_THRESHOLD = 40;   // aspirationAffinityの最低ライン
const MISMATCH_THRESHOLD = 18;     // actualMismatchの最低ライン
const COVERAGE_THRESHOLD = 2 / 7;  // I観測数の最低ライン

function findTemptingMismatchStation(
  scored: Array<{ station: Station; breakdown: StationMatchBreakdown }>,
  profile: PersonProfile,
  excludeIds: Set<string>,
): TemptingMismatchStation | null {
  const candidates = scored
    .filter((s) => !excludeIds.has(s.station.stationId))
    .map((s) => {
      const { value: aspirationAffinity, coverage } = computeAspirationAffinity(s.station, profile);
      const actualMismatch = computeActualMismatch(s.breakdown);
      return { ...s, aspirationAffinity, actualMismatch, coverage };
    })
    .filter(
      (c) =>
        c.coverage >= COVERAGE_THRESHOLD &&
        c.aspirationAffinity >= ASPIRATION_THRESHOLD &&
        c.actualMismatch >= MISMATCH_THRESHOLD,
    )
    .sort((a, b) => {
      const sa = a.aspirationAffinity * 0.5 + a.actualMismatch * 0.5;
      const sb = b.aspirationAffinity * 0.5 + b.actualMismatch * 0.5;
      return sb - sa;
    });

  if (candidates.length === 0) return null;
  const best = candidates[0];
  return {
    station: best.station,
    breakdown: best.breakdown,
    aspirationAffinity: best.aspirationAffinity,
    actualMismatch: best.actualMismatch,
    coverage: best.coverage,
    reasonTags: [],
    warningTags: profile.warningTags,
  };
}

// ── G13 更新 ─────────────────────────────────────────────────────────────────

function computeG13(primaryStation: Station, profile: PersonProfile): number {
  // I vs primary result distance — 推薦受容ギャップ
  const { I, E } = profile;
  const b = primaryStation.benefits;

  const featureOfI: [keyof typeof I, number][] = [
    ["I01", b.stimulation],
    ["I02", b.recovery],
    ["I03", b.convenience],
    ["I04", b.activity],
    ["I05", b.community],
    ["I06", b.spontaneity],
    ["I07", b.space],
  ];

  // Corresponding E needs for weighting
  const eVals = [E.E01, E.E02, E.E03, E.E04, E.E05, E.E06, E.E07];

  let distSum = 0;
  let count = 0;
  featureOfI.forEach(([iKey, stationBenefit], idx) => {
    const iv = I[iKey];
    if (iv === null) return;  // unobserved — skip
    // iv is 100 (must_have) or 0 (compromise)
    // Gap = how far the station is from ideal expectation for this feature
    const idealExpect = iv === 100 ? eVals[idx] : 0;  // must_have → high need; compromise → 0
    distSum += Math.abs(idealExpect - stationBenefit);
    count++;
  });

  return count > 0 ? clamp(distSum / count) : 0;
}

// ── 全駅マッチング ────────────────────────────────────────────────────────────

export function matchStations(
  stations: Station[],
  profile: PersonProfile,
): DiagnosisResult {
  const scored = stations
    .filter((s) => s.active)
    .map((station) => {
      const breakdown = scoreStation(station, profile);
      return { station, breakdown };
    })
    .sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);

  if (scored.length < 3) {
    throw new Error("Station dataset too small for matching (need >= 3 active stations)");
  }

  const topStation = scored[0];
  const topScore = topStation.breakdown.totalScore;

  // G13: update after knowing primary result
  const updatedG: GapIndicators = {
    ...profile.G,
    G13: computeG13(topStation.station, profile),
  };
  const updatedProfile: PersonProfile = { ...profile, G: updatedG };

  // Primary result
  const primary: StationMatchResult = {
    station: topStation.station,
    breakdown: topStation.breakdown,
    reasonTags: updatedProfile.reasonTags,
    warningTags: updatedProfile.warningTags,
  };

  // Alternative selection: prefer different archetype AND different accessGroup
  const maxGap = 12;
  const candidates = scored.slice(1).filter(
    (s) => topScore - s.breakdown.totalScore <= maxGap,
  );

  const alternatives: StationMatchResult[] = [];
  const usedArchetypes = new Set([topStation.station.archetypeId]);
  const usedAccessGroups = new Set([topStation.station.accessGroup]);

  // First pass: different archetype AND accessGroup
  for (const c of candidates) {
    if (alternatives.length >= 2) break;
    const diffArch = !usedArchetypes.has(c.station.archetypeId);
    const diffGroup = !usedAccessGroups.has(c.station.accessGroup);
    if (diffArch && diffGroup) {
      alternatives.push({
        station: c.station,
        breakdown: c.breakdown,
        reasonTags: updatedProfile.reasonTags,
        warningTags: updatedProfile.warningTags,
      });
      usedArchetypes.add(c.station.archetypeId);
      usedAccessGroups.add(c.station.accessGroup);
    }
  }

  // Second pass: different archetype only
  if (alternatives.length < 2) {
    for (const c of candidates) {
      if (alternatives.length >= 2) break;
      if (alternatives.some((a) => a.station.stationId === c.station.stationId)) continue;
      const diffArch = !usedArchetypes.has(c.station.archetypeId);
      if (diffArch) {
        alternatives.push({
          station: c.station,
          breakdown: c.breakdown,
          reasonTags: updatedProfile.reasonTags,
          warningTags: updatedProfile.warningTags,
        });
        usedArchetypes.add(c.station.archetypeId);
      }
    }
  }

  // Third pass: fill from remaining high-score candidates
  for (const c of candidates) {
    if (alternatives.length >= 2) break;
    if (alternatives.some((a) => a.station.stationId === c.station.stationId)) continue;
    alternatives.push({
      station: c.station,
      breakdown: c.breakdown,
      reasonTags: updatedProfile.reasonTags,
      warningTags: updatedProfile.warningTags,
    });
  }

  // If still short, take from rest of scored list
  for (const c of scored.slice(1)) {
    if (alternatives.length >= 2) break;
    if (alternatives.some((a) => a.station.stationId === c.station.stationId)) continue;
    alternatives.push({
      station: c.station,
      breakdown: c.breakdown,
      reasonTags: updatedProfile.reasonTags,
      warningTags: updatedProfile.warningTags,
    });
  }

  // 主結果・別候補の除外IDセット
  const excludeIds = new Set([
    topStation.station.stationId,
    ...alternatives.map((a) => a.station.stationId),
  ]);

  const temptingMismatch = findTemptingMismatchStation(scored, updatedProfile, excludeIds);

  return {
    primary,
    alternatives: [alternatives[0], alternatives[1]],
    temptingMismatch,
    profile: updatedProfile,
    dataVersion: "0.3.1-review",
    specVersion: updatedProfile.specVersion,
    timestamp: Date.now(),
  };
}
