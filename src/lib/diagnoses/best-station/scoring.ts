import type {
  RealityConditions,
  EnvironmentNeeds,
  EnvironmentTolerances,
  BehaviorIndicators,
  IdealEnvironment,
  MotiveIndicators,
  EconomicFactors,
  GapIndicators,
  PersonProfile,
} from "./types";

// ── ユーティリティ ────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

// 欠損をnullとして扱い、50へ変換しない
function safeNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "prefer_not" || v === "unknown") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ── 生回答から現実条件を抽出 ─────────────────────────────────────────────────

export function extractRealityConditions(raw: Record<string, unknown>): RealityConditions {
  const secondary = raw["secondary_tokyo_destination_zones"];
  return {
    currentPrefectureCode: (raw["current_prefecture_code"] as string) ?? null,
    currentAreaType: (raw["current_area_type"] as string) ?? null,
    currentNoiseBand: (raw["current_noise_band"] as string) ?? null,
    currentDensityBand: (raw["current_density_band"] as string) ?? null,
    currentConvenienceBand: (raw["current_convenience_band"] as string) ?? null,
    housingType: (raw["housing_type"] as string) ?? null,
    householdType: (raw["household_type"] as string) ?? null,
    totalHousingCostBand: (raw["total_housing_cost_band"] as string) ?? null,
    personalHousingCostBand: (raw["personal_housing_cost_band"] as string) ?? null,
    personalIncomeBand: (raw["personal_income_band"] as string) ?? null,
    costSharing: (raw["cost_sharing"] as string) ?? null,
    supportStability: (raw["support_stability"] as string) ?? null,
    currentStatus: (raw["current_status"] as string) ?? null,
    commuteDaysPerWeek: safeNum(raw["commute_days_per_week"]),
    oneWayTravelTime: safeNum(raw["one_way_travel_time"]),
    transferCount: safeNum(raw["transfer_count"]),
    primaryTokyoDestinationZone: (raw["primary_tokyo_destination_zone"] as string) ?? null,
    secondaryTokyoDestinationZones: Array.isArray(secondary)
      ? (secondary as string[]).filter((z) => z !== "none")
      : [],
  };
}

// ── E01-E07 (L2) ─────────────────────────────────────────────────────────────

export function computeEnvironmentNeeds(raw: Record<string, unknown>): EnvironmentNeeds {
  return {
    E01: safeNum(raw["e01"]) ?? 50,
    E02: safeNum(raw["e02"]) ?? 50,
    E03: safeNum(raw["e03"]) ?? 50,
    E04: safeNum(raw["e04"]) ?? 50,
    E05: safeNum(raw["e05"]) ?? 50,
    E06: safeNum(raw["e06"]) ?? 50,
    E07: safeNum(raw["e07"]) ?? 50,
  };
}

// ── T01-T07 (L3) ─────────────────────────────────────────────────────────────

export function computeTolerances(raw: Record<string, unknown>): EnvironmentTolerances {
  return {
    T01: safeNum(raw["t01"]) ?? 50,
    T02: safeNum(raw["t02"]) ?? 50,
    T03: safeNum(raw["t03"]) ?? 50,
    T04: safeNum(raw["t04"]) ?? 50,
    T05: safeNum(raw["t05"]) ?? 50,
    T06: safeNum(raw["t06"]) ?? 50,
    T07: safeNum(raw["t07"]) ?? 50,
  };
}

// ── B01-B08 (L4) ─────────────────────────────────────────────────────────────

function computeB02(raw: Record<string, unknown>): number {
  // B02 = 自宅機能負荷: room_comfort + home_function_conflict + b02_home_functions + b02_conflict_impact
  const roomComfort = safeNum(raw["room_comfort"]) ?? 50;
  const funcConflict = safeNum(raw["home_function_conflict"]) ?? 25;
  const functions: string[] = Array.isArray(raw["b02_home_functions"])
    ? (raw["b02_home_functions"] as string[])
    : [];
  const conflictImpact = safeNum(raw["b02_conflict_impact"]) ?? 0;

  // 機能数が多いほど負荷が増える (sleep は基本、2つ目以降)
  const funcCount = Math.max(0, functions.length - 1);
  const funcLoad = Math.min(100, funcCount * 15);

  // 総合: 部屋快適度の逆(不満度) + 機能競合 + 実際の支障
  const discomfort = 100 - roomComfort;
  const raw02 = (discomfort * 0.3) + (funcConflict * 0.2) + (funcLoad * 0.2) + (conflictImpact * 0.3);
  return clamp(raw02);
}

function computeB08(raw: Record<string, unknown>): number {
  const days = safeNum(raw["commute_days_per_week"]) ?? 0;
  const time = safeNum(raw["one_way_travel_time"]) ?? 0;
  const transfers = safeNum(raw["transfer_count"]) ?? 0;
  const exhaustion = safeNum(raw["post_commute_exhaustion"]) ?? 0;
  const damage = safeNum(raw["b08_current_travel_damage"]) ?? 0;

  if (days === 0) return 0;

  const freqFactor = clamp(days / 5);
  const timePart = time * freqFactor;
  const transferPart = transfers * freqFactor;
  const raw08 = (timePart * 0.35) + (transferPart * 0.20) + (exhaustion * 0.25) + (damage * 0.20);
  return clamp(raw08);
}

export function computeBehaviors(raw: Record<string, unknown>): BehaviorIndicators {
  return {
    B01: safeNum(raw["b01_home_centered"]) ?? 50,
    B02: computeB02(raw),
    B03: safeNum(raw["b03_external_activity"]) ?? 25,
    B04: safeNum(raw["b04_local_use"]) ?? 25,
    B05: safeNum(raw["b05_destination_city_use"]) ?? 25,
    B06: safeNum(raw["b06_night_activity"]) ?? 25,
    B07: safeNum(raw["b07_daily_range"]) ?? 50,
    B08: computeB08(raw),
  };
}

// ── I01-I07 (L5A) ────────────────────────────────────────────────────────────
// dual_bucket_rank: must_have=100, can_compromise=0, unobserved=null

export function computeIdeal(raw: Record<string, unknown>): IdealEnvironment {
  const ranking = raw["ideal_priority_ranking"] as Record<string, string> | null | undefined;
  const metrics = ["I01", "I02", "I03", "I04", "I05", "I06", "I07"] as const;

  const result: Partial<IdealEnvironment> = {};
  for (const m of metrics) {
    if (!ranking || !(m in ranking)) {
      result[m] = null;
    } else {
      const v = ranking[m];
      if (v === "must_have") result[m] = 100;
      else if (v === "can_compromise") result[m] = 0;
      else result[m] = null;
    }
  }
  return result as IdealEnvironment;
}

// ── D01-D06 (L5B) ────────────────────────────────────────────────────────────

export function computeMotives(raw: Record<string, unknown>): MotiveIndicators {
  return {
    D01: safeNum(raw["d01_address_display"]) ?? 50,
    D02: safeNum(raw["d02_urban_exit_anxiety"]) ?? 50,
    D03: safeNum(raw["d03_option_ownership"]) ?? 50,
    D04: safeNum(raw["d04_cost_minimization"]) ?? 50,
    D05: safeNum(raw["d05_status_quo"]) ?? 50,
    D06: safeNum(raw["d06_ideal_projection"]) ?? 50,
  };
}

// ── F01-F05 (経済派生) ────────────────────────────────────────────────────────

const INCOME_TO_TIER: Record<string, number> = {
  none: 1, under_300: 2, "300_499": 3, "500_699": 4,
  "700_999": 5, "1000_1499": 6, "1500_1999": 7,
  "2000_2999": 8, "3000_plus": 10,
};

function computeBudgetTier(raw: Record<string, unknown>): number | null {
  const incomeBand = raw["personal_income_band"] as string | null | undefined;
  if (!incomeBand || incomeBand === "prefer_not") return null;
  const base = INCOME_TO_TIER[incomeBand] ?? null;
  if (base === null) return null;

  let tier = base;
  const sharing = raw["cost_sharing"] as string | null;
  if (sharing === "family_support" || sharing === "company_support" || sharing === "mixed") tier += 1;
  const stability = raw["support_stability"] as string | null;
  if (stability === "stable") tier += 0; // already counted in sharing
  if (stability === "temporary") tier -= 1;

  const willingness = raw["future_housing_spend_willingness"] as string | null;
  if (willingness === "slightly_more") tier += 1;
  else if (willingness === "more") tier += 2;
  else if (willingness === "decrease") tier -= 1;

  return clamp(tier, 1, 10);
}

export function computeEconomicFactors(raw: Record<string, unknown>): EconomicFactors {
  const budgetTier = computeBudgetTier(raw);

  const burdenFeeling = safeNum(raw["housing_burden_feeling"]);
  const F02 = burdenFeeling;

  // F03: 支援・安全網
  const sharing = raw["cost_sharing"] as string | null;
  let supportLevel: number | null = null;
  if (sharing && sharing !== "prefer_not") {
    if (sharing === "self_only") supportLevel = 0;
    else if (sharing === "shared_partner") supportLevel = 33;
    else if (sharing === "company_support") supportLevel = 50;
    else if (sharing === "family_support") supportLevel = 60;
    else if (sharing === "mixed") supportLevel = 70;
  }

  // F05: 過剰節約リスク (高budgetTierなのに現状維持/安く住みたい傾向)
  let F05: number | null = null;
  if (budgetTier !== null) {
    const d04 = safeNum(raw["d04_cost_minimization"]);
    const burden = F02;
    if (d04 !== null && burden !== null) {
      // 支払余力があるのに必要環境へ投資していない傾向
      if (budgetTier >= 4 && burden <= 33 && d04 >= 50) {
        F05 = clamp((budgetTier - 3) * 10 + d04 * 0.3);
      } else {
        F05 = 0;
      }
    }
  }

  return {
    F01: budgetTier,
    F02,
    F03: supportLevel,
    F04: raw["future_housing_spend_willingness"] as string | null ?? null,
    F05,
  };
}

// ── G01-G13 (L6 派生) ────────────────────────────────────────────────────────

function noiseBandToNum(band: string | null): number {
  if (band === "low") return 20;
  if (band === "mid") return 50;
  if (band === "high") return 80;
  return 50;
}
function densityBandToNum(band: string | null): number {
  return noiseBandToNum(band);
}
function convenienceBandToNum(band: string | null): number {
  return noiseBandToNum(band);
}

export function computeGapIndicators(
  E: EnvironmentNeeds,
  T: EnvironmentTolerances,
  B: BehaviorIndicators,
  I: IdealEnvironment,
  D: MotiveIndicators,
  F: EconomicFactors,
  reality: RealityConditions,
): GapIndicators {
  // G01: 理想環境乖離 (E vs I distance)
  const iMetrics: [keyof IdealEnvironment, keyof EnvironmentNeeds][] = [
    ["I01", "E01"], ["I02", "E02"], ["I03", "E03"], ["I04", "E04"],
    ["I05", "E05"], ["I06", "E06"], ["I07", "E07"],
  ];
  let iDistSum = 0; let iCount = 0;
  for (const [ik, ek] of iMetrics) {
    const iv = I[ik];
    if (iv !== null) {
      iDistSum += Math.abs(iv - E[ek]);
      iCount++;
    }
  }
  const G01 = iCount > 0 ? clamp(iDistSum / iCount) : 0;

  // G02: 現在地適合度 (E vs current env features) — 低いほど不適合
  const currentNoise = noiseBandToNum(reality.currentNoiseBand);
  const currentDensity = densityBandToNum(reality.currentDensityBand);
  const currentConv = convenienceBandToNum(reality.currentConvenienceBand);

  const noiseGap = Math.max(0, currentNoise - (100 - E["E02"]));
  const densityGap = Math.max(0, currentDensity - T["T02"]);
  const convFit = Math.max(0, E["E03"] - currentConv);
  const G02raw = (noiseGap + densityGap + convFit) / 3;
  const G02 = clamp(100 - G02raw);  // 高いほど適合

  // G03: 現在負荷超過 (current env loads vs T)
  const noiseExcess = Math.max(0, currentNoise - T["T01"]);
  const densityExcess = Math.max(0, currentDensity - T["T02"]);
  const G03 = clamp((noiseExcess + densityExcess) / 2);

  // G04: 言行不一致度 (E04/E06 vs B03/B06)
  const actGap = Math.abs(E["E04"] - B["B03"]);
  const spontGap = Math.abs(E["E06"] - B["B06"]);
  const G04 = clamp((actGap + spontGap) / 2);

  // G05: 街の実利用率
  const G05 = clamp((B["B03"] + B["B04"] + B["B05"] + B["B06"]) / 4);

  // G06: 使わない利便性課金
  // 高い利便性エリアにいるのに実利用が低い
  const convHigh = currentConv >= 70 ? 1 : 0;
  const localLowUse = B["B04"] < 30 ? 1 : 0;
  const G06 = clamp(convHigh * localLowUse * ((100 - B["B04"]) * 0.5 + (currentConv - 50) * 0.5));

  // G07: 住居費無理度
  const burden = F["F02"] ?? 50;
  const G07 = clamp(burden);

  // G08: 住居費価値整合度 (E必要性 vs 実際の価値)
  const rentTierEst = F["F01"] ?? 5;
  const eNeedAvg = (E["E01"] + E["E03"] + E["E04"] + E["E06"]) / 4;
  const G08raw = rentTierEst * 10 - eNeedAvg;
  const G08 = clamp(Math.abs(G08raw) * 0.5);

  // G09: 過剰節約リスク
  const G09 = clamp(F["F05"] ?? 0);

  // G10: 通勤消耗度
  const commuteDamage = B["B08"];
  const commuteTolerance = T["T05"];
  const G10 = clamp(Math.max(0, commuteDamage - commuteTolerance));

  // G11: 現状維持固定度
  const G11 = clamp((D["D05"] * 0.6) + (100 - G02) * 0.4);

  // G12: 総合無理発生リスク
  const G12 = clamp((G03 * 0.25) + (G07 * 0.25) + (G10 * 0.25) + (G04 * 0.25));

  // G13: 推薦受容ギャップ (matching後に更新するがここでは初期値)
  const G13 = G01;

  return { G01, G02, G03, G04, G05, G06, G07, G08, G09, G10, G11, G12, G13 };
}

// ── タグ生成 (判定タグ) ──────────────────────────────────────────────────────

export function computeReasonTags(
  E: EnvironmentNeeds,
  T: EnvironmentTolerances,
  B: BehaviorIndicators,
): string[] {
  const tags: string[] = [];
  if (E["E01"] >= 65) tags.push("NEEDS_STIMULATION");
  if (E["E02"] >= 65) tags.push("NEEDS_RECOVERY");
  if (E["E03"] >= 65) tags.push("NEEDS_CONVENIENCE");
  if (E["E04"] >= 65) tags.push("NEEDS_ACTIVITY");
  if (E["E05"] <= 30) tags.push("PREFERS_ANONYMITY");
  if (E["E05"] >= 70) tags.push("PREFERS_COMMUNITY");
  if (E["E06"] >= 65) tags.push("NEEDS_SPONTANEITY");
  if (E["E07"] >= 65) tags.push("NEEDS_SPACE");
  if (B["B01"] >= 65) tags.push("HOME_CENTERED");
  if (B["B08"] >= 60) tags.push("HIGH_COMMUTE_LOAD");
  if (T["T01"] < 40) tags.push("LOW_NOISE_TOLERANCE");
  if (T["T02"] < 40) tags.push("LOW_CROWD_TOLERANCE");
  return tags;
}

export function computeWarningTags(
  E: EnvironmentNeeds,
  T: EnvironmentTolerances,
  B: BehaviorIndicators,
  D: MotiveIndicators,
  F: EconomicFactors,
  G: GapIndicators,
  reality: RealityConditions,
): string[] {
  const tags: string[] = [];
  const currentNoise = noiseBandToNum(reality.currentNoiseBand);
  const currentConv = convenienceBandToNum(reality.currentConvenienceBand);

  // QUIET_NEED_LOAD_EXCESS: 回復環境が必要なのに現在が騒がしい
  if (E["E02"] >= 65 && currentNoise >= 70) tags.push("QUIET_NEED_LOAD_EXCESS");

  // UNUSED_CONVENIENCE_COST: 利便性高い場所にいるが使っていない
  if (currentConv >= 70 && B["B04"] < 35 && B["B03"] < 40) tags.push("UNUSED_CONVENIENCE_COST");

  // ADDRESS_BRAND_COST: 住所ブランドへの課金傾向
  if (D["D01"] >= 60 && D["D02"] >= 50) tags.push("ADDRESS_BRAND_COST");

  // COMMUTE_DAMAGE: 通勤で生活が削れている
  if (G["G10"] >= 50) tags.push("COMMUTE_DAMAGE");

  // HOME_SPACE_MISMATCH: 自宅中心なのに空間が足りない
  if (B["B01"] >= 60 && B["B02"] >= 55) tags.push("HOME_SPACE_MISMATCH");

  // UNDERINVESTMENT_RISK: 支払余力があるのに環境投資が足りない
  if ((F["F05"] ?? 0) >= 40) tags.push("UNDERINVESTMENT_RISK");

  // URBAN_EXIT_ANXIETY: 都会から離れることへの不安
  if (D["D02"] >= 65) tags.push("URBAN_EXIT_ANXIETY");

  // OPTION_HOARDING: 使わない選択肢を保有していたい
  if (D["D03"] >= 65 && B["B03"] < 40 && B["B05"] < 40) tags.push("OPTION_HOARDING");

  // STATUS_QUO_LOCK: 現状維持で環境を変えられていない
  if (D["D05"] >= 65 && G["G02"] < 55) tags.push("STATUS_QUO_LOCK");

  return tags;
}

// ── 信頼度算出 ────────────────────────────────────────────────────────────────

export function computeConfidence(raw: Record<string, unknown>): number {
  let confidence = 100;
  if (!raw["personal_income_band"] || raw["personal_income_band"] === "prefer_not") confidence -= 15;
  if (!raw["total_housing_cost_band"] || raw["total_housing_cost_band"] === "prefer_not") confidence -= 5;
  if (!raw["personal_housing_cost_band"] || raw["personal_housing_cost_band"] === "prefer_not") confidence -= 5;
  if (!raw["cost_sharing"] || raw["cost_sharing"] === "prefer_not") confidence -= 5;
  if (!raw["housing_burden_feeling"] || raw["housing_burden_feeling"] === null) confidence -= 5;
  return clamp(confidence);
}

// ── メインエントリ ────────────────────────────────────────────────────────────

export function computeProfile(
  rawAnswers: Record<string, unknown>,
  specVersion: string,
): Omit<PersonProfile, "G"> & { G: GapIndicators } {
  const reality = extractRealityConditions(rawAnswers);
  const E = computeEnvironmentNeeds(rawAnswers);
  const T = computeTolerances(rawAnswers);
  const B = computeBehaviors(rawAnswers);
  const I = computeIdeal(rawAnswers);
  const D = computeMotives(rawAnswers);
  const F = computeEconomicFactors(rawAnswers);
  const G = computeGapIndicators(E, T, B, I, D, F, reality);
  const reasonTags = computeReasonTags(E, T, B);
  const warningTags = computeWarningTags(E, T, B, D, F, G, reality);
  const confidence = computeConfidence(rawAnswers);

  return { E, T, B, I, D, F, G, reality, reasonTags, warningTags, confidence, specVersion };
}
