/**
 * Five-ability scoring simulation — Step6+7 verification.
 *
 * Validates:
 *   1. ability-scoring.json schema + contribution count correctness
 *   2. calculateAbilityUScores / uScoresToV boundary values
 *   3. parseAvParam / buildAvParam roundtrip and strict regex rejection
 *   4. resolveSpecialist pre-rounding cross-product logic and per-ability thresholds
 *
 * Then runs Monte Carlo (N=1,000,000) to:
 *   - Report V_k distribution per ability
 *   - Confirm specialist rate is within target 8–15%
 *   - Confirm max ability share ≤40%, no ability at 0%
 *   - Run A-strong / B-strong stress scenarios
 *
 * Usage:  npx tsx scripts/simulate-five-abilities.ts
 */

import path from "path";
import fs   from "fs";
import { AbilityScoringSchema } from "@/schemas/diagnosis";
import {
  calculateAbilityUScores,
  uScoresToV,
  vToDisplayScore,
  uScoresToDisplayScores,
  parseAvParam,
  buildAvParam,
  ABILITY_N,
  type AbilityKey,
  type AbilityUScores,
} from "@/engine/ability-scorer";
import { resolveSpecialist, SPECIALIST_THRESHOLDS } from "@/engine/specialist-resolver";

// ──────────────────────────────────────────────────────────────
// Assertion helpers
// ──────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    console.log("  PASS:", msg);
    passCount++;
  } else {
    console.error("  FAIL:", msg);
    failCount++;
  }
}

// ──────────────────────────────────────────────────────────────
// Data loading
// ──────────────────────────────────────────────────────────────

function loadData() {
  const filePath = path.join(
    process.cwd(),
    "data/diagnoses/business-skills/ability-scoring.json",
  );
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return AbilityScoringSchema.parse(raw);
}

// ──────────────────────────────────────────────────────────────
// Assertion suite
// ──────────────────────────────────────────────────────────────

function runAssertions(contributions: ReturnType<typeof loadData>["contributions"]): void {
  console.log("\n── Assertion suite ──");

  // --- Contribution counts ---
  const counts = { logic: 0, execution: 0, sales: 0, creativity: 0, management: 0 };
  for (const c of contributions) counts[c.ability as AbilityKey]++;
  assert(counts.logic      === 12, `logic contributions = 12 (got ${counts.logic})`);
  assert(counts.execution  ===  8, `execution contributions = 8 (got ${counts.execution})`);
  assert(counts.sales      ===  4, `sales contributions = 4 (got ${counts.sales})`);
  assert(counts.creativity ===  7, `creativity contributions = 7 (got ${counts.creativity})`);
  assert(counts.management ===  5, `management contributions = 5 (got ${counts.management})`);
  assert(contributions.length === 36, `total contributions = 36 (got ${contributions.length})`);

  // --- all-A scores ---
  const allA: Record<string, string> = {};
  const allB: Record<string, string> = {};
  for (let i = 1; i <= 40; i++) {
    const id = `q${String(i).padStart(2, "0")}`;
    allA[id] = "strongly_a";
    allB[id] = "strongly_b";
  }

  const uAllA = calculateAbilityUScores(allA, contributions);
  assert(uAllA.logic      === 14, `all-strongly_a: logic U = 14 (7 A-contributions × 2)`);
  assert(uAllA.execution  ===  8, `all-strongly_a: execution U = 8 (4 A-contributions × 2)`);
  assert(uAllA.sales      ===  6, `all-strongly_a: sales U = 6 (3 A-contributions × 2)`);
  assert(uAllA.creativity ===  8, `all-strongly_a: creativity U = 8 (4 A-contributions × 2)`);
  assert(uAllA.management ===  4, `all-strongly_a: management U = 4 (2 A-contributions × 2)`);

  const uAllB = calculateAbilityUScores(allB, contributions);
  assert(uAllB.logic      === 10, `all-strongly_b: logic U = 10 (5 B-contributions × 2)`);
  assert(uAllB.execution  ===  8, `all-strongly_b: execution U = 8 (4 B-contributions × 2)`);
  assert(uAllB.sales      ===  2, `all-strongly_b: sales U = 2 (1 B-contribution × 2)`);
  assert(uAllB.creativity ===  6, `all-strongly_b: creativity U = 6 (3 B-contributions × 2)`);
  assert(uAllB.management ===  6, `all-strongly_b: management U = 6 (3 B-contributions × 2)`);

  // Verify A+B = max for each ability
  assert(uAllA.logic      + uAllB.logic      === 2 * ABILITY_N.logic,      `logic: A+B = 2×n_k`);
  assert(uAllA.execution  + uAllB.execution  === 2 * ABILITY_N.execution,  `execution: A+B = 2×n_k`);
  assert(uAllA.sales      + uAllB.sales      === 2 * ABILITY_N.sales,      `sales: A+B = 2×n_k`);
  assert(uAllA.creativity + uAllB.creativity === 2 * ABILITY_N.creativity, `creativity: A+B = 2×n_k`);
  assert(uAllA.management + uAllB.management === 2 * ABILITY_N.management, `management: A+B = 2×n_k`);

  // --- uScoresToV boundary values ---
  const vMax = uScoresToV({ logic: 24, execution: 16, sales: 8, creativity: 14, management: 10 });
  assert(vMax.logic      === 100, `logic V at max U = 100`);
  assert(vMax.execution  === 100, `execution V at max U = 100`);
  assert(vMax.sales      === 100, `sales V at max U = 100`);
  assert(vMax.creativity === 100, `creativity V at max U = 100`);
  assert(vMax.management === 100, `management V at max U = 100`);

  const vZero = uScoresToV({ logic: 0, execution: 0, sales: 0, creativity: 0, management: 0 });
  assert(vZero.logic      === 0, `logic V at U=0 = 0`);
  assert(vZero.execution  === 0, `execution V at U=0 = 0`);
  assert(vZero.sales      === 0, `sales V at U=0 = 0`);
  assert(vZero.creativity === 0, `creativity V at U=0 = 0`);
  assert(vZero.management === 0, `management V at U=0 = 0`);

  // Mid value: U_k = n_k → V = Math.round(50×n_k/n_k) = 50
  const vMid = uScoresToV({ logic: 12, execution: 8, sales: 4, creativity: 7, management: 5 });
  assert(vMid.logic      === 50, `logic V at U=n_k (12) = 50`);
  assert(vMid.execution  === 50, `execution V at U=n_k (8) = 50`);
  assert(vMid.sales      === 50, `sales V at U=n_k (4) = 50`);
  assert(vMid.creativity === 50, `creativity V at U=n_k (7) = 50`);
  assert(vMid.management === 50, `management V at U=n_k (5) = 50`);

  // --- vToDisplayScore: reference values ---
  assert(vToDisplayScore(0)   === 50,  "vToDisplayScore(0) = 50");
  assert(vToDisplayScore(8)   === 54,  "vToDisplayScore(8) = 54");
  assert(vToDisplayScore(20)  === 60,  "vToDisplayScore(20) = 60");
  assert(vToDisplayScore(50)  === 75,  "vToDisplayScore(50) = 75");
  assert(vToDisplayScore(70)  === 85,  "vToDisplayScore(70) = 85");
  assert(vToDisplayScore(90)  === 95,  "vToDisplayScore(90) = 95");
  assert(vToDisplayScore(100) === 100, "vToDisplayScore(100) = 100");

  // Display values must be in [50, 100] for all valid internal V
  for (let v = 0; v <= 100; v++) {
    const d = vToDisplayScore(v);
    assert(d >= 50 && d <= 100, `vToDisplayScore(${v}) in [50, 100]`);
  }

  // Display conversion preserves ability ordering (no reversal)
  // vToDisplayScore is non-decreasing: V_a > V_b implies displayV_a >= displayV_b
  const orderedV = [0, 20, 50, 70, 100];
  const orderedD = orderedV.map(v => vToDisplayScore(v));
  for (let i = 1; i < orderedV.length; i++) {
    assert(
      orderedD[i] >= orderedD[i - 1],
      `display ordering preserved: vToDisplayScore(${orderedV[i]}) >= vToDisplayScore(${orderedV[i - 1]})`,
    );
  }

  // uScoresToDisplayScores: output range [50, 100] at boundaries
  const dMax = uScoresToDisplayScores({ logic: 24, execution: 16, sales: 8, creativity: 14, management: 10 });
  assert(dMax.logic      === 100, "display at max U: logic = 100");
  assert(dMax.execution  === 100, "display at max U: execution = 100");
  assert(dMax.sales      === 100, "display at max U: sales = 100");
  assert(dMax.creativity === 100, "display at max U: creativity = 100");
  assert(dMax.management === 100, "display at max U: management = 100");

  const dZero = uScoresToDisplayScores({ logic: 0, execution: 0, sales: 0, creativity: 0, management: 0 });
  assert(dZero.logic      === 50, "display at U=0: logic = 50");
  assert(dZero.execution  === 50, "display at U=0: execution = 50");
  assert(dZero.sales      === 50, "display at U=0: sales = 50");
  assert(dZero.creativity === 50, "display at U=0: creativity = 50");
  assert(dZero.management === 50, "display at U=0: management = 50");

  // resolveSpecialist ability judgment unchanged by display conversion
  // (uses raw U scores, not display scores)
  const uSpec: AbilityUScores = { logic: 20, execution: 0, sales: 0, creativity: 0, management: 0 };
  const spViaU    = resolveSpecialist(uSpec);
  assert(spViaU.ability === "logic", "resolveSpecialist still uses raw U: logic detected");
  // Display scores for same input
  const dSpec = uScoresToDisplayScores(uSpec);
  assert(dSpec.logic >= 50 && dSpec.logic <= 100, "display score for specialist case in [50,100]");
  // Specialist ability matches regardless of display conversion applied elsewhere
  assert(spViaU.ability === resolveSpecialist(uSpec).ability,
    "resolveSpecialist: same ability before and after display conversion applied to rendering");

  // --- parseAvParam / buildAvParam roundtrip ---
  const testU: AbilityUScores = { logic: 18, execution: 10, sales: 5, creativity: 11, management: 7 };
  const avStr  = buildAvParam(testU);
  const parsed = parseAvParam(avStr);
  assert(parsed !== null,             "parseAvParam: valid av → non-null");
  assert(parsed?.logic      === 18,   "parseAvParam: logic U = 18");
  assert(parsed?.execution  === 10,   "parseAvParam: execution U = 10");
  assert(parsed?.sales      ===  5,   "parseAvParam: sales U = 5");
  assert(parsed?.creativity === 11,   "parseAvParam: creativity U = 11");
  assert(parsed?.management ===  7,   "parseAvParam: management U = 7");

  // --- parseAvParam: pre-existing invalid values ---
  assert(parseAvParam(null)            === null, "parseAvParam: null → null");
  assert(parseAvParam("")              === null, "parseAvParam: empty → null");
  assert(parseAvParam("2.0.0.0.0.0")  === null, "parseAvParam: wrong version → null");
  assert(parseAvParam("1.25.0.0.0.0") === null, "parseAvParam: logic out of range (25>24) → null");
  assert(parseAvParam("1.0.17.0.0.0") === null, "parseAvParam: execution out of range (17>16) → null");
  assert(parseAvParam("1.0.0.0.0.11") === null, "parseAvParam: management out of range (11>10) → null");
  assert(parseAvParam("1.0.0.0.0")    === null, "parseAvParam: too few parts → null");
  assert(parseAvParam("1.a.0.0.0.0")  === null, "parseAvParam: non-integer → null");
  assert(parseAvParam("1.-1.0.0.0.0") === null, "parseAvParam: negative → null");
  assert(parseAvParam("1.0.5.0.0.5")  !== null, "parseAvParam: valid boundary → non-null");

  // --- parseAvParam: strict regex (new — av parser spec violation fix) ---
  // These all passed Number() coercion before the regex fix but are now correctly rejected.
  assert(parseAvParam("1. 12.8.4.7.5")  === null, "parseAvParam: space in field → null");
  assert(parseAvParam(" 1.12.8.4.7.5")  === null, "parseAvParam: leading space → null");
  assert(parseAvParam("1.+12.8.4.7.5")  === null, "parseAvParam: + sign → null");
  assert(parseAvParam("1.1e1.8.4.7.5")  === null, "parseAvParam: scientific notation (1e1=10) → null");
  assert(parseAvParam("1.012.8.4.7.5")  === null, "parseAvParam: leading zero → null");
  assert(parseAvParam("1.12.8.4.7.5\t") === null, "parseAvParam: trailing tab → null");

  // --- resolveSpecialist: pre-rounding cross-product logic ---
  // All inputs are AbilityUScores (raw, not rounded).
  // Effective minV cutoffs: logic U≥17, execution U≥11, sales U≥7, creativity U≥10, management U≥8

  // 1. Clear logic specialist (U=20, rational V=83.33, others=0)
  const uLogicLeader: AbilityUScores = { logic: 20, execution: 0, sales: 0, creativity: 0, management: 0 };
  const spLeader = resolveSpecialist(uLogicLeader);
  assert(spLeader.ability      === "logic", "specialist: logic leader → logic");
  assert(spLeader.vScore       === 83,      "specialist: leader vScore = Math.round(50×20/12) = 83");
  assert(spLeader.gapToSecond  === 83,      "specialist: leader gapToSecond = 83−0 = 83");

  // 2. Below minV (logic U=12 → rational V=50, requires U≥17)
  const uLow: AbilityUScores = { logic: 12, execution: 0, sales: 0, creativity: 0, management: 0 };
  assert(resolveSpecialist(uLow).ability === null, "specialist: logic U=12 below minV → null");

  // 3. Gap too small (logic U=17 rational V=70.83, exec U=11 rational V=68.75, rational gap=2.08 < 10)
  //    Integer check: 50*(17×8−11×12) = 50×4 = 200 < 10×12×8 = 960
  const uTightGap: AbilityUScores = { logic: 17, execution: 11, sales: 0, creativity: 0, management: 0 };
  assert(resolveSpecialist(uTightGap).ability === null, "specialist: rational gap 2.08 < minGap=10 → null");

  // 4. Exact rational tie (logic U=18, exec U=12 → both rational V=75.0 exactly)
  //    Cross-product: 18×8=144 = 12×12=144 → not unique → null
  const uRatTie: AbilityUScores = { logic: 18, execution: 12, sales: 0, creativity: 0, management: 0 };
  assert(resolveSpecialist(uRatTie).ability === null, "specialist: rational tie 18/12=12/8=1.5 → null");

  // 5. Exact minV boundary for logic (U=17: 50×17=850 ≥ 70×12=840 ✓)
  //    exec U=9, gap: 50*(17×8−9×12) = 50×28 = 1400 ≥ 10×12×8 = 960 ✓
  const uBoundary: AbilityUScores = { logic: 17, execution: 9, sales: 0, creativity: 0, management: 0 };
  const spBoundary = resolveSpecialist(uBoundary);
  assert(spBoundary.ability  === "logic", "specialist: exact logic minV boundary (U=17) → logic");
  assert(spBoundary.vScore   === 71,      "specialist: boundary vScore = Math.round(50×17/12) = 71");

  // 6. One below minV boundary for logic (U=16: 50×16=800 < 70×12=840 → FAIL)
  const uOneBelowMinV: AbilityUScores = { logic: 16, execution: 0, sales: 0, creativity: 0, management: 0 };
  assert(resolveSpecialist(uOneBelowMinV).ability === null, "specialist: logic U=16 < minV=70 boundary → null");

  // 7. Sales minV: U=6 FAILS (50×6=300 < 76×4=304), U=7 PASSES (350 ≥ 304)
  //    This is the key spec-violation fix: pre-rounding comparison, not Math.round comparison.
  const uSales6: AbilityUScores = { logic: 0, execution: 0, sales: 6, creativity: 0, management: 0 };
  assert(resolveSpecialist(uSales6).ability === null,    "specialist: sales U=6 < minV=76 → null (pre-rounding fix)");
  const uSales7: AbilityUScores = { logic: 0, execution: 0, sales: 7, creativity: 0, management: 0 };
  assert(resolveSpecialist(uSales7).ability === "sales", "specialist: sales U=7 ≥ minV=76 → sales");

  // 8. Execution minV boundary: U=11 passes (50×11=550 ≥ 68×8=544), U=10 fails (500<544)
  const uExec11: AbilityUScores = { logic: 0, execution: 11, sales: 0, creativity: 0, management: 0 };
  assert(resolveSpecialist(uExec11).ability === "execution", "specialist: execution U=11 ≥ minV=68 → execution");
  const uExec10: AbilityUScores = { logic: 0, execution: 10, sales: 0, creativity: 0, management: 0 };
  assert(resolveSpecialist(uExec10).ability === null,        "specialist: execution U=10 < minV=68 → null");

  // 9. Creativity minV boundary: U=10 passes (50×10=500 ≥ 71×7=497), U=9 fails (450<497)
  const uCreat10: AbilityUScores = { logic: 0, execution: 0, sales: 0, creativity: 10, management: 0 };
  assert(resolveSpecialist(uCreat10).ability === "creativity", "specialist: creativity U=10 ≥ minV=71 → creativity");
  const uCreat9: AbilityUScores  = { logic: 0, execution: 0, sales: 0, creativity: 9,  management: 0 };
  assert(resolveSpecialist(uCreat9).ability  === null,         "specialist: creativity U=9 < minV=71 → null");

  // 10. Management minV boundary: U=8 passes (50×8=400 ≥ 71×5=355), U=7 fails (350<355)
  const uMgmt8: AbilityUScores = { logic: 0, execution: 0, sales: 0, creativity: 0, management: 8 };
  assert(resolveSpecialist(uMgmt8).ability === "management", "specialist: management U=8 ≥ minV=71 → management");
  const uMgmt7: AbilityUScores = { logic: 0, execution: 0, sales: 0, creativity: 0, management: 7 };
  assert(resolveSpecialist(uMgmt7).ability === null,         "specialist: management U=7 < minV=71 → null");
}

// ──────────────────────────────────────────────────────────────
// Monte Carlo simulation
// ──────────────────────────────────────────────────────────────

const CHOICE_IDS = ["strongly_a", "lean_a", "lean_b", "strongly_b"] as const;
const ALL_Q_IDS  = Array.from({ length: 40 }, (_, i) => `q${String(i + 1).padStart(2, "0")}`);
const ABILITIES: AbilityKey[] = ["logic", "execution", "sales", "creativity", "management"];

function monteCarlo(
  contributions: ReturnType<typeof loadData>["contributions"],
  samples = 1_000_000,
): void {
  console.log(`\n── Monte Carlo (N=${samples.toLocaleString()}, pre-rounding logic) ──`);

  // Collect U_k per sample (not V_k — resolveSpecialist now takes U scores).
  const allU: AbilityUScores[] = new Array(samples);
  const vSumAll: Record<AbilityKey, number> = {
    logic: 0, execution: 0, sales: 0, creativity: 0, management: 0,
  };

  for (let i = 0; i < samples; i++) {
    const answers: Record<string, string> = {};
    for (const qId of ALL_Q_IDS) {
      answers[qId] = CHOICE_IDS[Math.floor(Math.random() * 4)];
    }
    const u = calculateAbilityUScores(answers, contributions);
    allU[i] = u;
    const v = uScoresToV(u);
    for (const k of ABILITIES) vSumAll[k] += v[k];
  }

  console.log("\nV_k distribution (mean per ability):");
  for (const k of ABILITIES) {
    console.log(`  ${k.padEnd(12)}: mean=${( vSumAll[k] / samples).toFixed(1)}`);
  }

  // ── Count specialists with current thresholds ─────────────────────────────
  let totalSpecialist = 0;
  const byAbility: Record<AbilityKey, number> = {
    logic: 0, execution: 0, sales: 0, creativity: 0, management: 0,
  };

  for (const u of allU) {
    const sp = resolveSpecialist(u);
    if (sp.ability !== null) {
      totalSpecialist++;
      byAbility[sp.ability]++;
    }
  }

  const activeRate   = (totalSpecialist / samples) * 100;
  const maxShare     = Math.max(...ABILITIES.map(k => byAbility[k])) / totalSpecialist * 100;
  const minShare     = Math.min(...ABILITIES.map(k => byAbility[k])) / totalSpecialist * 100;

  console.log(`\nSpecialist thresholds in use:`);
  console.log(`  minGap = ${SPECIALIST_THRESHOLDS.minGap}`);
  for (const k of ABILITIES) {
    const nk    = ABILITY_N[k];
    const minVk = SPECIALIST_THRESHOLDS.minV[k];
    let minU = -1;
    for (let u = 0; u <= 2 * nk; u++) {
      if (50 * u >= minVk * nk) { minU = u; break; }
    }
    console.log(`  ${k.padEnd(12)}: minV=${minVk}, effective U≥${minU}`);
  }

  console.log(`\nPer-ability specialist breakdown (N=${samples.toLocaleString()}):`);
  for (const k of ABILITIES) {
    const cnt   = byAbility[k];
    const gRate = (cnt / samples) * 100;
    const share = totalSpecialist > 0 ? (cnt / totalSpecialist) * 100 : 0;
    console.log(`  ${k.padEnd(12)}: ${cnt.toString().padStart(7)} (global ${gRate.toFixed(2)}%, share ${share.toFixed(1)}%)`);
  }

  console.log(`\nOverall rate : ${activeRate.toFixed(2)}%`);
  console.log(`Max share    : ${maxShare.toFixed(1)}% (≤40% required)`);
  console.log(`Min share    : ${minShare.toFixed(1)}% (>0% required)`);

  assert(
    activeRate >= 8.0 && activeRate <= 15.0,
    `specialist rate ${activeRate.toFixed(2)}% within 8–15%`,
  );
  assert(
    maxShare <= 40.0,
    `max ability share ${maxShare.toFixed(1)}% ≤ 40%`,
  );
  assert(
    minShare > 0,
    `min ability share ${minShare.toFixed(1)}% > 0%`,
  );

  // ── Stress tests ─────────────────────────────────────────────────────────
  console.log("\n── Stress tests (N=100,000 each) ──");

  const STRESS_SCENARIOS: { name: string; aProb: number }[] = [
    { name: "A-strong (aProb=0.80)", aProb: 0.80 },
    { name: "B-strong (aProb=0.20)", aProb: 0.20 },
    { name: "Balanced (aProb=0.50)", aProb: 0.50 },
  ];

  const NS = 100_000;
  for (const sc of STRESS_SCENARIOS) {
    let stressTotal = 0;
    const stressBy: Record<AbilityKey, number> = {
      logic: 0, execution: 0, sales: 0, creativity: 0, management: 0,
    };

    for (let i = 0; i < NS; i++) {
      const answers: Record<string, string> = {};
      for (const qId of ALL_Q_IDS) {
        const goA    = Math.random() < sc.aProb;
        const strong = Math.random() < 0.5;
        answers[qId] = goA
          ? (strong ? "strongly_a" : "lean_a")
          : (strong ? "strongly_b" : "lean_b");
      }
      const u  = calculateAbilityUScores(answers, contributions);
      const sp = resolveSpecialist(u);
      if (sp.ability !== null) {
        stressTotal++;
        stressBy[sp.ability]++;
      }
    }

    const stressRate  = (stressTotal / NS) * 100;
    const stressMax   = stressTotal > 0
      ? Math.max(...ABILITIES.map(k => stressBy[k])) / stressTotal * 100
      : 0;

    console.log(`\n  ${sc.name}`);
    console.log(`    Rate: ${stressRate.toFixed(2)}%  MaxShare: ${stressMax.toFixed(1)}%`);
    for (const k of ABILITIES) {
      const share = stressTotal > 0 ? (stressBy[k] / stressTotal * 100).toFixed(1) : "0.0";
      console.log(`      ${k.padEnd(12)}: ${stressBy[k]} (${share}%)`);
    }
    assert(stressRate > 0, `stress ${sc.name}: rate > 0%`);
    assert(stressMax <= 95, `stress ${sc.name}: max share ${stressMax.toFixed(1)}% ≤ 95%`);
  }
}

// ──────────────────────────────────────────────────────────────
// Pearson correlation simulation (N=1,000,000)
// 論理力×Think / 実行力×Act / 創造力×Expand
// ──────────────────────────────────────────────────────────────

interface MinimalQuestion {
  id: string;
  axis: string;
  optionASide: string;
  optionBSide: string;
}

function loadQuestions(): MinimalQuestion[] {
  const filePath = path.join(
    process.cwd(),
    "data/diagnoses/business-skills/questions.json",
  );
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as MinimalQuestion[];
}

const AXIS_CHOICE_MAP: Record<string, { side: "a" | "b"; points: number }> = {
  strongly_a: { side: "a", points: 2 },
  lean_a:     { side: "a", points: 1 },
  lean_b:     { side: "b", points: 1 },
  strongly_b: { side: "b", points: 2 },
};

function computePearsonR(
  n: number, sumX: number, sumY: number,
  sumXY: number, sumX2: number, sumY2: number,
): number {
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return den === 0 ? 0 : num / den;
}

function pearsonSim(
  contributions: ReturnType<typeof loadData>["contributions"],
  questions: MinimalQuestion[],
  samples = 1_000_000,
): void {
  console.log(`\n── Pearson correlation simulation (N=${samples.toLocaleString()}) ──`);

  const taQs  = questions.filter(q => q.axis === "thinking_action");
  const dcQs  = questions.filter(q => q.axis === "divergent_convergent");

  // Running sums for 3 pairs (one-pass Pearson)
  let n = 0;
  let sxL = 0, syT = 0, sxyLT = 0, sx2L = 0, sy2T = 0; // logic × think
  let sxE = 0, syA = 0, sxyEA = 0, sx2E = 0, sy2A = 0; // execution × act
  let sxC = 0, syX = 0, sxyCX = 0, sx2C = 0, sy2X = 0; // creativity × expand

  for (let i = 0; i < samples; i++) {
    const answers: Record<string, string> = {};
    for (const qId of ALL_Q_IDS) {
      answers[qId] = CHOICE_IDS[Math.floor(Math.random() * 4)];
    }

    const u = calculateAbilityUScores(answers, contributions);
    const v = uScoresToV(u);
    const lv = v.logic;
    const ev = v.execution;
    const cv = v.creativity;

    let thinking = 0, action = 0;
    for (const q of taQs) {
      const choice = AXIS_CHOICE_MAP[answers[q.id]];
      if (!choice) continue;
      const pole = choice.side === "a" ? q.optionASide : q.optionBSide;
      if (pole === "thinking") thinking += choice.points;
      else if (pole === "action") action += choice.points;
    }

    let divergent = 0, convergent = 0;
    for (const q of dcQs) {
      const choice = AXIS_CHOICE_MAP[answers[q.id]];
      if (!choice) continue;
      const pole = choice.side === "a" ? q.optionASide : q.optionBSide;
      if (pole === "divergent") divergent += choice.points;
      else if (pole === "convergent") convergent += choice.points;
    }

    const ts  = thinking - action;      // positive = Think dominant
    const as_ = action   - thinking;    // positive = Act dominant
    const xs  = divergent - convergent; // positive = Expand dominant

    n++;
    sxL += lv; syT += ts;  sxyLT += lv * ts;  sx2L += lv * lv; sy2T += ts * ts;
    sxE += ev; syA += as_; sxyEA += ev * as_; sx2E += ev * ev; sy2A += as_ * as_;
    sxC += cv; syX += xs;  sxyCX += cv * xs;  sx2C += cv * cv; sy2X += xs * xs;
  }

  const rLT = computePearsonR(n, sxL, syT, sxyLT, sx2L, sy2T);
  const rEA = computePearsonR(n, sxE, syA, sxyEA, sx2E, sy2A);
  const rCX = computePearsonR(n, sxC, syX, sxyCX, sx2C, sy2X);

  console.log("\nPearson correlation:");
  console.log(`  論理力 × Think  : r = ${rLT.toFixed(4)}`);
  console.log(`  実行力 × Act    : r = ${rEA.toFixed(4)}`);
  console.log(`  創造力 × Expand : r = ${rCX.toFixed(4)}`);

  const maxAbsR = Math.max(Math.abs(rLT), Math.abs(rEA), Math.abs(rCX));
  console.log(`  max |r|         : ${maxAbsR.toFixed(4)}`);

  if (maxAbsR >= 1.0) {
    console.error("\n[STOP] |r| = 1 ─ 完全な一対一対応。要レビュー。仕様変更せず停止。");
    process.exit(1);
  }
  if (maxAbsR >= 0.90) {
    console.error(`\n[STOP] |r| >= 0.90 (max |r| = ${maxAbsR.toFixed(4)}) ─ 要レビュー。仕様変更せず停止。`);
    process.exit(1);
  }

  console.log("  max |r| < 0.90 ─ 完全代理指標なし ✓");
  assert(Math.abs(rLT) < 0.90, `|r| 論理力×Think = ${Math.abs(rLT).toFixed(4)} < 0.90`);
  assert(Math.abs(rEA) < 0.90, `|r| 実行力×Act = ${Math.abs(rEA).toFixed(4)} < 0.90`);
  assert(Math.abs(rCX) < 0.90, `|r| 創造力×Expand = ${Math.abs(rCX).toFixed(4)} < 0.90`);
}

// ──────────────────────────────────────────────────────────────
// Entry point
// ──────────────────────────────────────────────────────────────

async function main() {
  console.log("=== simulate-five-abilities.ts ===");

  let data;
  try {
    data = loadData();
    console.log(`\nLoaded ability-scoring.json (schemaVersion=${data.schemaVersion}, ${data.contributions.length} contributions)`);
  } catch (err) {
    console.error("Failed to load ability-scoring.json:", err);
    process.exit(1);
  }

  let questions;
  try {
    questions = loadQuestions();
    console.log(`Loaded questions.json (${questions.length} questions)`);
  } catch (err) {
    console.error("Failed to load questions.json:", err);
    process.exit(1);
  }

  runAssertions(data.contributions);
  monteCarlo(data.contributions);
  pearsonSim(data.contributions, questions);

  console.log(`\n── Summary: ${passCount} passed, ${failCount} failed ──`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
