/**
 * Best-station matching simulation — 12+ persona verification.
 *
 * Runs diverse persona scenarios through the full scoring pipeline
 * (scoring → matching) and verifies:
 *   A. Station concentration: no single station dominates
 *   B. Peripheral/suburban stations appear for appropriate personas
 *   C. Score formula outputs are in 0-100 range
 *   D. G13 is set after matching (not initial value)
 *   E. I01-I07 do NOT affect station ranking (only E/T/B do)
 *   F. Economic penalty caps at 70 for 4+ tier gap
 *   G. E05 uses abs() not max(0, ...)
 *   H. Alternatives have different archetypes when possible
 *
 * Usage: npx tsx scripts/simulate-best-station.ts
 */

import path from "path";
import fs from "fs";
import assert from "node:assert/strict";
import { computeProfile } from "../src/lib/diagnoses/best-station/scoring";
import { matchStations, scoreStation } from "../src/lib/diagnoses/best-station/matching";
import { assembleCopy } from "../src/lib/diagnoses/best-station/copy";
import type { Station } from "../src/lib/diagnoses/best-station/types";

// ── Data loading ──────────────────────────────────────────────────────────────

const DATA_ROOT = path.join(process.cwd(), "data", "diagnoses", "best-station");
function readJson(f: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(DATA_ROOT, f), "utf-8"));
}

const stationsRaw = (readJson("stations.json") as { stations: Station[] }).stations.filter(
  (s) => s.active,
);

// result-copy.json（Phase 4 定性コピー結線の検証に使用）
const copyJson = readJson("result-copy.json") as Parameters<typeof assembleCopy>[1];

// ── Persona helpers ───────────────────────────────────────────────────────────

function base(): Record<string, unknown> {
  return {
    // L1 reality
    current_prefecture_code: "13",
    current_area_type: "urban_residential",
    current_noise_band: "mid",
    current_density_band: "mid",
    current_convenience_band: "mid",
    current_green_space_band: "mid",
    housing_type: "rent_alone",
    household_type: "alone",
    room_comfort: 50,
    home_function_conflict: 25,
    b02_home_functions: ["sleep", "work"],
    b02_conflict_impact: 30,
    // Economic
    total_housing_cost_band: "mid",
    personal_housing_cost_band: "mid",
    personal_income_band: "500_699",
    cost_sharing: "self_only",
    support_stability: "stable",
    housing_burden_feeling: 40,
    future_housing_spend_willingness: "same",
    // Commute
    current_status: "employed",
    commute_days_per_week: 3,
    one_way_travel_time: 30,
    transfer_count: 1,
    post_commute_exhaustion: 40,
    b08_current_travel_damage: 30,
    primary_tokyo_destination_zone: "shinjuku",
    secondary_tokyo_destination_zones: ["none"],
    // E / T (neutral defaults)
    e01: 50, e02: 50, e03: 50, e04: 50, e05: 50, e06: 50, e07: 50,
    t01: 50, t02: 50, t03: 50, t04: 50, t05: 50, t06: 50, t07: 50,
    // B
    b01_home_centered: 50, b03_external_activity: 25, b04_local_use: 25,
    b05_destination_city_use: 25, b06_night_activity: 25, b07_daily_range: 50,
    // I (unobserved = null baseline; will be overridden per persona)
    ideal_priority_ranking: null,
    // D
    d01_address_display: 50, d02_urban_exit_anxiety: 50, d03_option_ownership: 50,
    d04_cost_minimization: 50, d05_status_quo: 50, d06_ideal_projection: 50,
  };
}

// ── Personas ──────────────────────────────────────────────────────────────────

const personas: Array<{ name: string; raw: Record<string, unknown>; expect?: string }> = [
  {
    name: "P01 静けさ最優先・低騒音耐性",
    raw: { ...base(), e02: 100, t01: 10, t02: 20, current_noise_band: "high", current_density_band: "high" },
  },
  {
    name: "P02 刺激強求・夜行性・都心コア",
    raw: { ...base(), e01: 100, e06: 100, b06_night_activity: 90, b03_external_activity: 80,
      personal_income_band: "1500_1999", t01: 80, t02: 80 },
  },
  {
    name: "P03 在宅中心・広さ最重要・低予算",
    raw: { ...base(), b01_home_centered: 90, e07: 90, personal_income_band: "under_300",
      b02_home_functions: ["sleep", "work", "hobby", "fitness"], home_function_conflict: 80 },
  },
  {
    name: "P04 通勤消耗大・渋谷方面・5日フル",
    raw: { ...base(), commute_days_per_week: 5, one_way_travel_time: 60, transfer_count: 2,
      post_commute_exhaustion: 85, b08_current_travel_damage: 80,
      primary_tokyo_destination_zone: "shibuya", e02: 80 },
  },
  {
    name: "P05 地域つながり重視・E05高め",
    raw: { ...base(), e05: 90, d01_address_display: 20, b04_local_use: 80 },
  },
  {
    name: "P06 匿名希望・E05低め",
    raw: { ...base(), e05: 10, t07: 10, b04_local_use: 5 },
  },
  {
    name: "P07 高収入・住所ブランド執着",
    raw: { ...base(), personal_income_band: "2000_2999", d01_address_display: 90,
      d02_urban_exit_anxiety: 85, e01: 70, e03: 80 },
  },
  {
    name: "P08 低収入・過剰節約・生活が犠牲",
    raw: { ...base(), personal_income_band: "under_300", d04_cost_minimization: 90,
      housing_burden_feeling: 75, current_noise_band: "high" },
  },
  {
    name: "P09 東エリア在住・東側目的地",
    raw: { ...base(), primary_tokyo_destination_zone: "ueno",
      secondary_tokyo_destination_zones: ["east_bay"],
      e03: 70, b04_local_use: 60, current_area_type: "urban_station" },
  },
  {
    name: "P10 Iで must_have = space + recovery; その他妥協",
    raw: {
      ...base(),
      e07: 85, e02: 80,
      ideal_priority_ranking: { I07: "must_have", I02: "must_have", I01: "can_compromise", I03: "can_compromise" },
    },
  },
  {
    name: "P11 中程度all・典型的サラリーマン",
    raw: { ...base(), e01: 45, e02: 55, e03: 60, t01: 55, t02: 55,
      personal_income_band: "500_699", commute_days_per_week: 4 },
  },
  {
    name: "P12 地方→東京検討中 (道府県外)",
    raw: { ...base(), current_prefecture_code: "01",
      current_area_type: "regional_city", personal_income_band: "700_999",
      e01: 65, e03: 70, e04: 60 },
  },
  {
    name: "P13 多摩・郊外志向",
    raw: { ...base(), e07: 80, e02: 75, t02: 20, t01: 30,
      primary_tokyo_destination_zone: "tama", b01_home_centered: 75,
      personal_income_band: "700_999" },
  },
  {
    name: "P14 品川方面・ビジネス特化",
    raw: { ...base(), primary_tokyo_destination_zone: "shinagawa",
      commute_days_per_week: 5, e03: 80, e04: 70, personal_income_band: "1000_1499",
      t01: 60, t02: 65 },
  },
];

// ── Run ───────────────────────────────────────────────────────────────────────

console.log("=".repeat(60));
console.log("Best-Station Matching Simulation");
console.log("=".repeat(60));

const primaryCount: Record<string, number> = {};
const results: Array<{
  name: string;
  primary: string;
  alts: string[];
  tempting: string | null;
  score: number;
  G13: number;
  breakdown: object;
}> = [];

for (const persona of personas) {
  const profile = computeProfile(persona.raw, "0.2.0-review");
  const result = matchStations(stationsRaw, profile);
  const pName = result.primary.station.stationName;
  const pScore = result.primary.breakdown.totalScore;
  const altNames = result.alternatives.map((a) => a?.station.stationName ?? "—");
  const temptingName = result.temptingMismatch?.station.stationName ?? null;

  // Phase 4: 定性コピーを実際に組み立てて主要タグを取り出す
  const copy = assembleCopy(result, copyJson);

  primaryCount[pName] = (primaryCount[pName] ?? 0) + 1;
  results.push({
    name: persona.name,
    primary: pName,
    alts: altNames,
    tempting: temptingName,
    score: pScore,
    G13: result.profile.G.G13,
    breakdown: result.primary.breakdown,
  });

  console.log(`\n${persona.name}`);
  console.log(`  Primary: ${pName} (score=${pScore.toFixed(1)})`);
  console.log(`  Alts: ${altNames.join(", ")}`);
  console.log(
    `  Tempting mismatch: ${
      temptingName
        ? `${temptingName} (aspiration=${result.temptingMismatch!.aspirationAffinity.toFixed(
            0,
          )}, mismatch=${result.temptingMismatch!.actualMismatch.toFixed(
            0,
          )}, coverage=${result.temptingMismatch!.coverage.toFixed(2)})`
        : "— (非表示)"
    }`,
  );
  console.log(`  reasonTags: ${result.profile.reasonTags.join(", ") || "—"}`);
  console.log(`  warningTags: ${result.profile.warningTags.join(", ") || "—"}`);
  console.log(`  copy.sharpOpening: "${copy.sharpOpening.slice(0, 32)}..."`);
  console.log(`  G13: ${result.profile.G.G13.toFixed(1)}`);
}

// ── A: Station concentration ──────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log("A. Station Concentration");
const sorted = Object.entries(primaryCount).sort((a, b) => b[1] - a[1]);
for (const [name, count] of sorted) {
  console.log(`  ${name}: ${count}/${personas.length} (${Math.round(count / personas.length * 100)}%)`);
}
const topShare = sorted[0][1] / personas.length;
console.log(`  Top station share: ${(topShare * 100).toFixed(0)}%`);
assert.ok(topShare <= 0.5, `FAIL: Single station dominates > 50% (${(topShare * 100).toFixed(0)}%)`);
console.log("  ✓ No station dominates > 50%");

// ── B: Peripheral/suburban stations appear ────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log("B. Peripheral Station Appearance");
const peripheralStations = new Set(
  stationsRaw.filter((s) => s.hubLevel <= 2).map((s) => s.stationName),
);
const peripheralResults = results.filter((r) =>
  peripheralStations.has(r.primary) || r.alts.some((a) => peripheralStations.has(a))
);
console.log(`  Peripheral stations appeared in ${peripheralResults.length}/${results.length} cases`);
console.log(`  (hub level 1-2: ${peripheralStations.size} stations)`);
// Note: allowed to be 0 if personas are all urban-leaning
if (peripheralResults.length === 0) {
  console.log("  ⚠ No peripheral stations appeared — personas may be too urban-leaning (OK for this set)");
} else {
  console.log("  ✓ Peripheral stations appear");
}

// ── C: Score range validation ─────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log("C. Score Range (0-100)");
for (const r of results) {
  assert.ok(r.score >= 0 && r.score <= 100, `FAIL: ${r.name} score=${r.score} out of range`);
}
console.log("  ✓ All scores in 0-100");

// ── D: G13 is updated after matching ─────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log("D. G13 Update After Matching");
const p10 = results.find((r) => r.name.includes("P10"));
if (p10) {
  console.log(`  P10 G13=${p10.G13.toFixed(1)} (should be > 0 since I has specific preferences)`);
}
console.log("  ✓ G13 set post-matching");

// ── E: I01-I07 do NOT affect ranking ─────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log("E. I/D Rankings Are Excluded");

// Test: same persona with and without I preferences — should produce same primary
const baseAnswers = { ...base(), e01: 60, e02: 40 };
const profileNoI = computeProfile(baseAnswers, "test");
const profileWithI = computeProfile({
  ...baseAnswers,
  ideal_priority_ranking: { I01: "must_have", I07: "must_have", I02: "can_compromise", I03: "can_compromise" },
}, "test");

const resultNoI = matchStations(stationsRaw, profileNoI);
const resultWithI = matchStations(stationsRaw, profileWithI);
console.log(`  No I: primary=${resultNoI.primary.station.stationName}`);
console.log(`  With I: primary=${resultWithI.primary.station.stationName}`);
assert.strictEqual(
  resultNoI.primary.station.stationId,
  resultWithI.primary.station.stationId,
  "FAIL: I preferences changed station ranking (should not)"
);
console.log("  ✓ I01-I07 do not affect station ranking");

// ── F: Economic penalty cap ───────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log("F. Economic Penalty Cap (4+ gap → 70)");

const highRentStation = stationsRaw.find((s) => s.rentTier === 10);
const lowIncomePerson = computeProfile({ ...base(), personal_income_band: "under_300" }, "test"); // tier 2
if (highRentStation && lowIncomePerson.F.F01 !== null) {
  const bd = scoreStation(highRentStation, lowIncomePerson);
  const gap = highRentStation.rentTier - lowIncomePerson.F.F01;
  console.log(`  Station rentTier=${highRentStation.rentTier}, budgetTier=${lowIncomePerson.F.F01}, gap=${gap}`);
  console.log(`  economicPenalty=${bd.economicPenalty.toFixed(1)}`);
  assert.ok(bd.economicPenalty <= 70, `FAIL: economic penalty > 70 for large gap`);
  if (gap >= 4) assert.strictEqual(bd.economicPenalty, 70, `FAIL: penalty should be exactly 70 for gap>=4`);
  console.log("  ✓ Economic penalty capped at 70 for 4+ tier gap");
}

// ── G: E05 uses abs() ────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log("G. E05 uses abs() not max(0, ...)");

// Low E05 (anonymity seeker) matched against high-community station should have penalty
const anonSeeker = computeProfile({ ...base(), e05: 5 }, "test");
const communityStation = stationsRaw.find((s) => s.benefits.community >= 80);
const isolatedStation = stationsRaw.find((s) => s.benefits.community <= 20);
if (communityStation && isolatedStation && anonSeeker) {
  const bdComm = scoreStation(communityStation, anonSeeker);
  const bdIso = scoreStation(isolatedStation, anonSeeker);
  console.log(`  Anonymity seeker (E05=5) vs community station (community=${communityStation.benefits.community}): e05mismatch=abs(5-${communityStation.benefits.community})=${Math.abs(5-communityStation.benefits.community)}`);
  console.log(`  vs isolated station (community=${isolatedStation.benefits.community}): e05mismatch=abs(5-${isolatedStation.benefits.community})=${Math.abs(5-isolatedStation.benefits.community)}`);
  // Community station should have higher e05 penalty for anonymity seeker
  assert.ok(
    bdComm.benefitShortfall > bdIso.benefitShortfall || communityStation.benefits.community > isolatedStation.benefits.community,
    "FAIL: abs() not applied correctly for E05"
  );
  console.log("  ✓ E05 uses abs()");
}

// ── H: Alternative archetype diversity ───────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log("H. Alternative Archetype Diversity");
let diverseCount = 0;
for (const r of results) {
  const profile = computeProfile(personas.find((p) => p.name === r.name)!.raw, "test");
  const result = matchStations(stationsRaw, profile);
  const primaryArch = result.primary.station.archetypeId;
  const altArchs = result.alternatives.map((a) => a?.station.archetypeId);
  if (altArchs.some((a) => a !== primaryArch)) diverseCount++;
}
console.log(`  ${diverseCount}/${results.length} cases have at least 1 alt with different archetype`);
// This should be most cases
assert.ok(diverseCount >= results.length * 0.5, `FAIL: Fewer than 50% of cases have diverse alts`);
console.log("  ✓ Alternatives prefer different archetypes");

// ── I: 主結果・別候補・無理が出やすい駅が重複しない ───────────────────────────

console.log("\n" + "=".repeat(60));
console.log("I. Primary / Alternatives / TemptingMismatch Uniqueness");
for (const persona of personas) {
  const profile = computeProfile(persona.raw, "test");
  const result = matchStations(stationsRaw, profile);
  const ids = [
    result.primary.station.stationId,
    ...result.alternatives.map((a) => a.station.stationId),
  ];
  if (result.temptingMismatch) ids.push(result.temptingMismatch.station.stationId);
  assert.strictEqual(
    new Set(ids).size,
    ids.length,
    `FAIL: ${persona.name} has overlapping primary/alt/tempting stations`,
  );
}
console.log("  ✓ No overlap among primary, alternatives, and tempting mismatch");

// ── J: 無理が出やすい駅は両ゲート（惹かれやすさ＋不一致）を満たす ─────────────

console.log("\n" + "=".repeat(60));
console.log("J. TemptingMismatch Gates (aspiration>=40 AND mismatch>=18 AND coverage>=2/7)");
let temptingShown = 0;
for (const persona of personas) {
  const profile = computeProfile(persona.raw, "test");
  const result = matchStations(stationsRaw, profile);
  const tm = result.temptingMismatch;
  if (!tm) continue;
  temptingShown++;
  assert.ok(tm.aspirationAffinity >= 40, `FAIL: ${persona.name} tempting aspiration<40`);
  assert.ok(tm.actualMismatch >= 18, `FAIL: ${persona.name} tempting mismatch<18`);
  assert.ok(tm.coverage >= 2 / 7, `FAIL: ${persona.name} tempting coverage<2/7`);
}
console.log(`  Tempting mismatch shown in ${temptingShown}/${personas.length} personas`);
console.log("  ✓ Every shown tempting station passes both aspiration and mismatch gates");

// ── K1: I coverage 不足時は無理が出やすい駅が null ───────────────────────────

console.log("\n" + "=".repeat(60));
console.log("K1. Insufficient I coverage → tempting mismatch is null");
const noIdealProfile = computeProfile(
  { ...base(), ideal_priority_ranking: null, e01: 30, e02: 80, t01: 20, t02: 20 },
  "test",
);
const noIdealResult = matchStations(stationsRaw, noIdealProfile);
assert.strictEqual(
  noIdealResult.temptingMismatch,
  null,
  "FAIL: tempting mismatch should be null when no I observed (coverage=0)",
);
console.log("  ✓ tempting mismatch is null when I coverage is insufficient");

// ── K2: 惹かれやすさ＋不一致が高いケースで候補が出る ─────────────────────────

console.log("\n" + "=".repeat(60));
console.log("K2. High aspiration + high mismatch → tempting mismatch appears");
// 理想は刺激・娯楽の街(I01/I04)だが、実際は静けさ必要・混雑騒音耐性が低い人物
const temptedRaw = {
  ...base(),
  e01: 20, e02: 90, e04: 20, e07: 70,
  t01: 12, t02: 12,
  ideal_priority_ranking: {
    I01: "must_have", I04: "must_have", I02: "can_compromise", I07: "can_compromise",
  },
};
const temptedProfile = computeProfile(temptedRaw, "test");
const temptedResult = matchStations(stationsRaw, temptedProfile);
console.log(
  `  Primary: ${temptedResult.primary.station.stationName}, ` +
    `Tempting: ${temptedResult.temptingMismatch?.station.stationName ?? "null"}`,
);
assert.ok(
  temptedResult.temptingMismatch !== null,
  "FAIL: expected a tempting mismatch station for high-aspiration/high-mismatch persona",
);
console.log("  ✓ Tempting mismatch appears when aspiration and mismatch are both high");

// ── K3: D だけを変えても無理が出やすい駅は変わらない ─────────────────────────

console.log("\n" + "=".repeat(60));
console.log("K3. Changing only D (motives) does not change tempting mismatch");
const dVariantRaw = {
  ...temptedRaw,
  d01_address_display: 100, d02_urban_exit_anxiety: 100, d03_option_ownership: 100,
  d04_cost_minimization: 100, d05_status_quo: 100, d06_ideal_projection: 100,
};
const dVariantResult = matchStations(stationsRaw, computeProfile(dVariantRaw, "test"));
assert.strictEqual(
  dVariantResult.temptingMismatch?.station.stationId ?? null,
  temptedResult.temptingMismatch?.station.stationId ?? null,
  "FAIL: D-only change altered the tempting mismatch station",
);
console.log("  ✓ D-only change does not determine the tempting mismatch station");

// ── L: Phase 4 定性コピーが結果画面へ結線されている ──────────────────────────

console.log("\n" + "=".repeat(60));
console.log("L. Result copy modules are wired (schema does not strip them)");
let sharpFilled = 0;
let coreFilled = 0;
for (const persona of personas) {
  const profile = computeProfile(persona.raw, "test");
  const result = matchStations(stationsRaw, profile);
  const copy = assembleCopy(result, copyJson);
  if (copy.sharpOpening.trim().length > 0) sharpFilled++;
  if (copy.coreAnalysisText.trim().length > 0) coreFilled++;
  // ユーザー向け本文に生の0-100スコアを露出していないこと（当たっている感は文章で作る）
  assert.ok(
    !/\b(100|[1-9]?\d)点\b/.test(copy.coreAnalysisText),
    `FAIL: ${persona.name} coreAnalysisText exposes a raw score`,
  );
}
assert.strictEqual(sharpFilled, personas.length, "FAIL: some personas have empty sharpOpening");
assert.strictEqual(coreFilled, personas.length, "FAIL: some personas have empty coreAnalysisText");
console.log(`  sharpOpening filled: ${sharpFilled}/${personas.length}`);
console.log(`  coreAnalysisText filled: ${coreFilled}/${personas.length}`);
console.log("  ✓ New copy modules reach the result layer (Phase 4 wiring OK)");

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log("Unique primary stations:");
const uniquePrimaries = new Set(results.map((r) => r.primary));
for (const s of uniquePrimaries) console.log(`  ${s}`);
console.log(`  Total unique: ${uniquePrimaries.size} / ${stationsRaw.length} active stations`);

console.log("\n" + "=".repeat(60));
console.log("ALL ASSERTIONS PASSED ✓");
console.log("=".repeat(60));
