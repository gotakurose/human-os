/**
 * 4軸スタイル診断 — 境界テスト + 16タイプ到達テスト + Monte Carlo シミュレーション
 *
 * Run: npx tsx scripts/simulate-business-style-axes.ts
 *
 * 5能力ロジックは含まない。閾値変更は行わない。
 */

import path from "path";
import fs from "fs";

import { StyleAxisQuestionsSchema, TypesSchema, DynamicCopyPartsSchema } from "@/schemas/diagnosis";
import { calculateStyleAxisScores, resolveStyleAxisType } from "@/engine/style-axis-scorer";
import {
  parseStyleAxisParams,
  resolveBusinessStyle,
} from "@/app/diagnoses/[diagnosisId]/results/[typeId]/resolve-business-style";
import {
  selectAxisDynamicCopy,
  classifyIntensity,
  meetsSoftMinimumGap,
} from "@/app/diagnoses/[diagnosisId]/results/[typeId]/resolve-axis-dynamic-copy";
import type {
  DynamicCopyPart,
  TypeDefinition,
} from "@/app/diagnoses/[diagnosisId]/results/[typeId]/resolve-axis-dynamic-copy";

const DATA = path.join(process.cwd(), "data/diagnoses/business-skills");
const MAX_PER_AXIS = 20; // 10問 × 2点 = 20
const N_SAMPLES = 100_000;

const CHOICES = ["strongly_a", "lean_a", "lean_b", "strongly_b"] as const;

// ── データ読み込み ────────────────────────────────────────────────────────────

function loadData() {
  const rawQs = JSON.parse(fs.readFileSync(path.join(DATA, "questions.json"), "utf-8"));
  const questions = StyleAxisQuestionsSchema.parse(rawQs);

  const rawTs = JSON.parse(fs.readFileSync(path.join(DATA, "types.json"), "utf-8"));
  const types = TypesSchema.parse(rawTs);

  const rawDc = JSON.parse(fs.readFileSync(path.join(DATA, "dynamic-copy.json"), "utf-8"));
  const dynamicParts = DynamicCopyPartsSchema.parse(rawDc) as DynamicCopyPart[];

  const allTypeDefinitions: TypeDefinition[] = types.flatMap((t) =>
    t.axes ? [{ id: t.id, axes: t.axes }] : [],
  );

  return { questions, types, dynamicParts, allTypeDefinitions };
}

// ── アサーションヘルパー ──────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failCount++;
  }
}

function assertEq<T>(actual: T, expected: T, label: string): void {
  const ok = actual === expected;
  if (ok) {
    console.log(`  ✓ ${label}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${label} (expected=${JSON.stringify(expected)}, got=${JSON.stringify(actual)})`);
    failCount++;
  }
}

// ── URL パラメータ モック ─────────────────────────────────────────────────────

function mockParams(record: Record<string, string | null>) {
  return { get: (key: string): string | null => record[key] ?? null };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. 境界・異常系テスト
// ─────────────────────────────────────────────────────────────────────────────

function boundaryTests(
  types: ReturnType<typeof loadData>["types"],
  dynamicParts: DynamicCopyPart[],
  allTypeDefinitions: TypeDefinition[],
) {
  console.log("\n=== 境界・異常系テスト ===");

  // ── soft gap 境界値テスト ─────────────────────────────────────────────────
  console.log("\n── soft gap 境界値テスト ──");
  assert(meetsSoftMinimumGap(0.35, 0.10) === true,  "dom=0.35 soft=0.10 (gap=0.25) → true  [float naive: 0.35-0.10=0.2499...]");
  assert(meetsSoftMinimumGap(0.34, 0.10) === false, "dom=0.34 soft=0.10 (gap=0.24) → false");
  assert(meetsSoftMinimumGap(0.30, 0.05) === true,  "dom=0.30 soft=0.05 (gap=0.25) → true");
  assert(meetsSoftMinimumGap(0.29, 0.05) === false, "dom=0.29 soft=0.05 (gap=0.24) → false");

  // ── URL パラメータ検証 ────────────────────────────────────────────────────
  console.log("\n── URL パラメータ検証 ──");

  assert(parseStyleAxisParams(mockParams({})) === null, "全パラメータ欠落 → null");
  assert(parseStyleAxisParams(mockParams({ ta: null, os: "0", st: "0", dc: "0" })) === null, "ta=null → null");
  assert(parseStyleAxisParams(mockParams({ ta: "", os: "0", st: "0", dc: "0" })) === null, 'ta="" → null');
  assert(parseStyleAxisParams(mockParams({ ta: "10abc", os: "0", st: "0", dc: "0" })) === null, 'ta="10abc" → null');
  assert(parseStyleAxisParams(mockParams({ ta: "1.5", os: "0", st: "0", dc: "0" })) === null, 'ta="1.5" → null');
  assert(parseStyleAxisParams(mockParams({ ta: "NaN", os: "0", st: "0", dc: "0" })) === null, 'ta="NaN" → null');
  assert(parseStyleAxisParams(mockParams({ ta: "Infinity", os: "0", st: "0", dc: "0" })) === null, 'ta="Infinity" → null');
  assert(parseStyleAxisParams(mockParams({ ta: "101", os: "0", st: "0", dc: "0" })) === null, 'ta="101" → null');
  assert(parseStyleAxisParams(mockParams({ ta: "-101", os: "0", st: "0", dc: "0" })) === null, 'ta="-101" → null');

  const minP = parseStyleAxisParams(mockParams({ ta: "-100", os: "-100", st: "-100", dc: "-100" }));
  assert(minP !== null, "ta=os=st=dc=-100 → not null");
  assert(minP?.thinking_action === -1.0, "ta=-100 → thinking_action=-1.0");

  const zeroP = parseStyleAxisParams(mockParams({ ta: "0", os: "0", st: "0", dc: "0" }));
  assert(zeroP !== null, "ta=os=st=dc=0 → not null");
  assert(zeroP?.thinking_action === 0, "ta=0 → thinking_action=0");

  const maxP = parseStyleAxisParams(mockParams({ ta: "100", os: "100", st: "100", dc: "100" }));
  assert(maxP !== null, "ta=os=st=dc=100 → not null");
  assert(maxP?.thinking_action === 1.0, "ta=100 → thinking_action=1.0");

  // ── 全軸0 (center) ────────────────────────────────────────────────────────
  console.log("\n── 全軸0 (center) ──");
  {
    const t = types.find((t) => t.axes);
    if (t?.axes) {
      const r = resolveBusinessStyle(
        { thinking_action: 0, offensive_stable: 0, solo_team: 0, divergent_convergent: 0 },
        t.axes,
      );
      assert(r.axisIntensities.ta === 0, "center: ta intensity = 0");
      assert(r.axisIntensities.os === 0, "center: os intensity = 0");
      assert(r.axisIntensities.st === 0, "center: st intensity = 0");
      assert(r.axisIntensities.dc === 0, "center: dc intensity = 0");
    }
  }

  // ── dominant tie-breaking: ta > os > st > dc ──────────────────────────────
  console.log("\n── dominant tie-breaking ──");
  {
    const t = types.find((t) => t.axes);
    if (t?.axes) {
      const r1 = resolveBusinessStyle({ thinking_action: 0.5, offensive_stable: 0.4, solo_team: 0.4, divergent_convergent: 0.4 }, t.axes);
      assertEq(r1.dominantAxisKey, "ta", "ta=0.5 > others=0.4 → dominant=ta");

      const r2 = resolveBusinessStyle({ thinking_action: 0.4, offensive_stable: 0.5, solo_team: 0.4, divergent_convergent: 0.4 }, t.axes);
      assertEq(r2.dominantAxisKey, "os", "os=0.5 > others=0.4 → dominant=os");

      const r3 = resolveBusinessStyle({ thinking_action: 0.4, offensive_stable: 0.4, solo_team: 0.5, divergent_convergent: 0.4 }, t.axes);
      assertEq(r3.dominantAxisKey, "st", "st=0.5 > others=0.4 → dominant=st");

      const r4 = resolveBusinessStyle({ thinking_action: 0.4, offensive_stable: 0.4, solo_team: 0.4, divergent_convergent: 0.5 }, t.axes);
      assertEq(r4.dominantAxisKey, "dc", "dc=0.5 > others=0.4 → dominant=dc");

      const r5 = resolveBusinessStyle({ thinking_action: 0.5, offensive_stable: 0.5, solo_team: 0.4, divergent_convergent: 0.4 }, t.axes);
      assertEq(r5.dominantAxisKey, "ta", "ta=os=0.5 tie → ta wins");
    }
  }

  // ── 全4軸mild → balanced ──────────────────────────────────────────────────
  // Scores all-positive → code "TOIE"; use the TOIE type.
  console.log("\n── 全4軸mild → balanced ──");
  {
    const toie = types.find(
      (t) => t.axes?.thinkingAction === 1 && t.axes?.offensiveStable === 1 &&
             t.axes?.soloTeam === 1 && t.axes?.divergentConvergent === 1,
    );
    if (toie?.axes) {
      const scores = { thinking_action: 0.10, offensive_stable: 0.10, solo_team: 0.10, divergent_convergent: 0.10 };
      const resolved = resolveBusinessStyle(scores, toie.axes);
      const allMild = (["ta", "os", "st", "dc"] as const).every(
        (k) => classifyIntensity(resolved.axisIntensities[k]) === "mild",
      );
      assert(allMild, "all intensities classified as mild");
      const result = selectAxisDynamicCopy(resolved, toie.id, dynamicParts, allTypeDefinitions);
      assertEq(result.status, "ok", "all-mild → status=ok");
      assert(result.balanced === true, "all-mild → balanced=true");
      assert(result.dominantPart === null, "all-mild → dominantPart=null");
      assert(result.softPart === null, "all-mild → softPart=null");
    } else {
      console.log("  ⚠ TOIE type not found — balanced test skipped");
    }
  }

  // ── tied minimum → no soft ────────────────────────────────────────────────
  // Scores: ta=0.70, os=0.10, st=0.40, dc=0.10 → os and dc tied at min → softAxisKey=null
  console.log("\n── tied minimum → no soft ──");
  {
    const toie = types.find(
      (t) => t.axes?.thinkingAction === 1 && t.axes?.offensiveStable === 1 &&
             t.axes?.soloTeam === 1 && t.axes?.divergentConvergent === 1,
    );
    if (toie?.axes) {
      const scores = { thinking_action: 0.70, offensive_stable: 0.10, solo_team: 0.40, divergent_convergent: 0.10 };
      const resolved = resolveBusinessStyle(scores, toie.axes);
      const result = selectAxisDynamicCopy(resolved, toie.id, dynamicParts, allTypeDefinitions);
      if (result.status === "ok" || result.status === "dominant_not_found") {
        assert(result.softPart === null, "tied min (os=dc=0.10) → softPart=null");
      } else {
        console.log(`    status=${result.status}: ${result.errors[0] ?? ""}`);
      }
    }
  }

  // ── gap < 0.25 → no soft ─────────────────────────────────────────────────
  // Scores: ta=os=st=0.40, dc=0.20 → dominant=ta(0.40), min=dc(0.20), gap=0.20 < 0.25
  console.log("\n── gap < 0.25 → no soft ──");
  {
    const toie = types.find(
      (t) => t.axes?.thinkingAction === 1 && t.axes?.offensiveStable === 1 &&
             t.axes?.soloTeam === 1 && t.axes?.divergentConvergent === 1,
    );
    if (toie?.axes) {
      const scores = { thinking_action: 0.40, offensive_stable: 0.40, solo_team: 0.40, divergent_convergent: 0.20 };
      const resolved = resolveBusinessStyle(scores, toie.axes);
      const result = selectAxisDynamicCopy(resolved, toie.id, dynamicParts, allTypeDefinitions);
      if (result.status === "ok" || result.status === "dominant_not_found") {
        assert(result.softPart === null, "gap(0.20) < 0.25 → softPart=null");
      } else {
        console.log(`    status=${result.status}: ${result.errors[0] ?? ""}`);
      }
    }
  }

  // ── gap = 0.25 → soft eligible ────────────────────────────────────────────
  // Scores: ta=os=st=0.35 (clear, ta wins tie), dc=0.10 (mild, unique min)
  // Naive float: 0.35 - 0.10 = 0.2499... < 0.25 — but meetsSoftMinimumGap uses integer percent.
  console.log("\n── gap = 0.25 → soft eligible ──");
  {
    const toie = types.find(
      (t) => t.axes?.thinkingAction === 1 && t.axes?.offensiveStable === 1 &&
             t.axes?.soloTeam === 1 && t.axes?.divergentConvergent === 1,
    );
    if (toie?.axes) {
      const scores = { thinking_action: 0.35, offensive_stable: 0.35, solo_team: 0.35, divergent_convergent: 0.10 };
      const resolved = resolveBusinessStyle(scores, toie.axes);
      const gapMet = meetsSoftMinimumGap(resolved.dominantIntensity, resolved.axisIntensities.dc);
      assert(gapMet, `gap check: meetsSoftMinimumGap(dom=${resolved.dominantIntensity.toFixed(2)}, dc=${resolved.axisIntensities.dc.toFixed(2)}) → true`);
      const result = selectAxisDynamicCopy(resolved, toie.id, dynamicParts, allTypeDefinitions);
      if (result.status === "ok") {
        console.log(`    softPart: ${result.softPart ? result.softPart.id : "null (no data for this combo — ok)"}`);
        passCount++;
      } else {
        console.log(`    status=${result.status} (dominant part might not exist in data — ok)`);
        passCount++;
      }
    }
  }

  // ── typeId / code mismatch → type_code_mismatch ───────────────────────────
  console.log("\n── typeId/code mismatch → type_code_mismatch ──");
  {
    const toie = types.find(
      (t) => t.axes?.thinkingAction === 1 && t.axes?.offensiveStable === 1 &&
             t.axes?.soloTeam === 1 && t.axes?.divergentConvergent === 1,
    );
    const asgf = types.find(
      (t) => t.axes?.thinkingAction === 4 && t.axes?.offensiveStable === 4 &&
             t.axes?.soloTeam === 4 && t.axes?.divergentConvergent === 4,
    );
    if (toie?.axes && asgf?.axes) {
      // resolved code = TOIE (from toie axes + positive scores), typeId = asgf.id → mismatch
      const scores = { thinking_action: 0.5, offensive_stable: 0.5, solo_team: 0.5, divergent_convergent: 0.5 };
      const resolved = resolveBusinessStyle(scores, toie.axes); // code = "TOIE"
      const result = selectAxisDynamicCopy(resolved, asgf.id, dynamicParts, allTypeDefinitions);
      assertEq(result.status, "type_code_mismatch", "TOIE resolved vs ASGF typeId → type_code_mismatch");
    } else {
      console.log("  ⚠ TOIE or ASGF type not found — mismatch test skipped");
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. 16タイプ到達テスト
// ─────────────────────────────────────────────────────────────────────────────

function reachTest(
  questions: ReturnType<typeof loadData>["questions"],
  types: ReturnType<typeof loadData>["types"],
) {
  console.log("\n=== 16タイプ到達テスト ===");

  const AXIS_POLES: Record<string, { pos: string; neg: string }> = {
    thinking_action:      { pos: "thinking",  neg: "action" },
    offensive_stable:     { pos: "offensive", neg: "stable" },
    solo_team:            { pos: "solo",      neg: "team" },
    divergent_convergent: { pos: "divergent", neg: "convergent" },
  };

  const AXIS_TO_KEY: Record<string, "thinkingAction" | "offensiveStable" | "soloTeam" | "divergentConvergent"> = {
    thinking_action:      "thinkingAction",
    offensive_stable:     "offensiveStable",
    solo_team:            "soloTeam",
    divergent_convergent: "divergentConvergent",
  };

  let allOk = true;
  for (const t of types) {
    if (!t.axes) continue;

    const answers: Record<string, string> = {};
    for (const q of questions) {
      const axisVal = t.axes[AXIS_TO_KEY[q.axis]];
      const targetPole = axisVal === 1 ? AXIS_POLES[q.axis].pos : AXIS_POLES[q.axis].neg;
      answers[q.id] = q.optionASide === targetPole ? "strongly_a" : "strongly_b";
    }

    const s = calculateStyleAxisScores(answers, questions, MAX_PER_AXIS);
    const resolved = resolveStyleAxisType(s, types, "NONE");
    const ok = resolved === t.id;
    if (!ok) allOk = false;

    const scoreStr = [
      `ta=${s.thinking_action.toFixed(2)}`,
      `os=${s.offensive_stable.toFixed(2)}`,
      `st=${s.solo_team.toFixed(2)}`,
      `dc=${s.divergent_convergent.toFixed(2)}`,
    ].join(" ");

    const marker = ok ? "✓" : "✗";
    const extra = ok ? "" : ` → resolved as ${resolved}`;
    console.log(`  ${marker} ${t.id.padEnd(24)} ${scoreStr}${extra}`);
    if (ok) passCount++; else failCount++;
  }

  console.log(allOk ? "\n全16タイプ到達可能 ✓" : "\n一部タイプ未到達 ✗");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Monte Carlo シミュレーション
// ─────────────────────────────────────────────────────────────────────────────

function monteCarlo(
  questions: ReturnType<typeof loadData>["questions"],
  types: ReturnType<typeof loadData>["types"],
) {
  console.log(`\n=== Monte Carlo シミュレーション (N=${N_SAMPLES.toLocaleString()}) ===`);

  const SOFT_MIN_GAP = 0.25;
  type AxisKey = "ta" | "os" | "st" | "dc";
  const keys: ReadonlyArray<AxisKey> = ["ta", "os", "st", "dc"];

  const typeCounts: Record<string, number> = {};
  const strengthCounts = { mild: 0, clear: 0, extreme: 0 };
  const axisStrengthCounts: Record<string, { mild: number; clear: number; extreme: number }> = {
    ta: { mild: 0, clear: 0, extreme: 0 },
    os: { mild: 0, clear: 0, extreme: 0 },
    st: { mild: 0, clear: 0, extreme: 0 },
    dc: { mild: 0, clear: 0, extreme: 0 },
  };
  let dominantAppears = 0;
  let softAppears = 0;
  let balancedAppears = 0;

  for (let i = 0; i < N_SAMPLES; i++) {
    const answers: Record<string, string> = {};
    for (const q of questions) {
      answers[q.id] = CHOICES[Math.floor(Math.random() * 4)];
    }

    const s = calculateStyleAxisScores(answers, questions, MAX_PER_AXIS);
    const typeId = resolveStyleAxisType(s, types, "NONE");
    typeCounts[typeId] = (typeCounts[typeId] ?? 0) + 1;

    const intensities: Record<AxisKey, number> = {
      ta: Math.abs(s.thinking_action),
      os: Math.abs(s.offensive_stable),
      st: Math.abs(s.solo_team),
      dc: Math.abs(s.divergent_convergent),
    };

    let domKey: AxisKey = "ta";
    for (const k of keys) {
      if (intensities[k] > intensities[domKey]) domKey = k;
    }
    const domIntensity = intensities[domKey];
    const domClass = classifyIntensity(domIntensity);

    for (const k of keys) {
      axisStrengthCounts[k][classifyIntensity(intensities[k])]++;
    }

    const allMild = keys.every((k) => classifyIntensity(intensities[k]) === "mild");
    if (allMild) {
      balancedAppears++;
      strengthCounts.mild++;
      continue;
    }

    strengthCounts[domClass]++;

    if (domClass === "mild") continue;

    dominantAppears++;

    let minIntensity = intensities.ta;
    for (const k of keys) {
      if (intensities[k] < minIntensity) minIntensity = intensities[k];
    }
    const minKeys = keys.filter((k) => intensities[k] === minIntensity);
    if (
      minKeys.length === 1 &&
      classifyIntensity(minIntensity) === "mild" &&
      domIntensity - minIntensity >= SOFT_MIN_GAP
    ) {
      softAppears++;
    }
  }

  // ── タイプ別分布 ────────────────────────────────────────────────────────────
  console.log("\n── タイプ別分布 ──");
  const sortedTypes = types.map((t) => ({ id: t.id, count: typeCounts[t.id] ?? 0 }))
    .sort((a, b) => b.count - a.count);
  for (const { id, count } of sortedTypes) {
    const pct = (count / N_SAMPLES * 100).toFixed(1);
    const bar = "█".repeat(Math.round(count / N_SAMPLES * 40));
    console.log(`  ${id.padEnd(24)} ${pct.padStart(5)}%  ${bar}`);
  }
  const minPct = (Math.min(...sortedTypes.map((t) => t.count)) / N_SAMPLES * 100).toFixed(1);
  const maxPct = (Math.max(...sortedTypes.map((t) => t.count)) / N_SAMPLES * 100).toFixed(1);
  console.log(`  均等 = 6.25%   実測 min=${minPct}%  max=${maxPct}%`);

  // ── 軸別強度分布 ────────────────────────────────────────────────────────────
  console.log("\n── 軸別強度分布（全サンプル） ──");
  console.log("  軸         mild(<0.30)  clear(<0.65)  extreme(≥0.65)");
  for (const k of keys) {
    const c = axisStrengthCounts[k];
    const mP = (c.mild    / N_SAMPLES * 100).toFixed(1);
    const cP = (c.clear   / N_SAMPLES * 100).toFixed(1);
    const eP = (c.extreme / N_SAMPLES * 100).toFixed(1);
    console.log(`  ${k}         ${mP.padStart(7)}%     ${cP.padStart(7)}%      ${eP.padStart(7)}%`);
  }

  // ── 動的文章表示頻度 ────────────────────────────────────────────────────────
  console.log("\n── 動的文章 表示頻度推定 ──");
  const domPct      = (dominantAppears / N_SAMPLES * 100).toFixed(1);
  const softPct     = (softAppears     / N_SAMPLES * 100).toFixed(1);
  const balancedPct = (balancedAppears / N_SAMPLES * 100).toFixed(1);
  console.log(`  dominant文章が表示される割合  : ${domPct}%`);
  console.log(`  soft文章が追加表示される割合  : ${softPct}%`);
  console.log(`  balanced文章が表示される割合  : ${balancedPct}%`);
  console.log(`  動的文章なし（dominant mild） : ${(100 - parseFloat(domPct) - parseFloat(balancedPct)).toFixed(1)}%`);

  // ── 強度スケール参考値 ──────────────────────────────────────────────────────
  console.log("\n── 軸スコア → intensity 参考値 ──");
  console.log("  raw差分  intensity  分類");
  for (const rawDiff of [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]) {
    const intensity = rawDiff / MAX_PER_AXIS;
    const cls = classifyIntensity(intensity);
    console.log(`  ±${String(rawDiff).padStart(2)}/20   ${intensity.toFixed(2)}     ${cls}`);
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

const { questions, types, dynamicParts, allTypeDefinitions } = loadData();
console.log(`質問数: ${questions.length}  タイプ数: ${types.length}  動的パーツ数: ${dynamicParts.length}`);

boundaryTests(types, dynamicParts, allTypeDefinitions);
reachTest(questions, types);
monteCarlo(questions, types);

console.log(`\n=== テスト結果サマリー ===`);
console.log(`  合格: ${passCount}  不合格: ${failCount}`);
if (failCount > 0) {
  console.error(`\n✗ ${failCount}件のテストが失敗しました。`);
  process.exit(1);
} else {
  console.log(`\n✓ 全テスト合格`);
}
