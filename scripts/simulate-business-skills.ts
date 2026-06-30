/**
 * scripts/simulate-business-skills.ts
 *
 * 社会人能力値診断（business-skills）合成回答シミュレーター
 *
 * 使い方:
 *   npm run simulate:business-skills -- --runs=1000
 *   npm run simulate:business-skills -- --runs=10000 --mode=persona
 */

import { readFileSync } from "fs";
import { join } from "path";
import { calculateStyleAxisScores, resolveStyleAxisType, deriveAbilityScores } from "@/engine/style-axis-scorer";
import type { DiagnosisType } from "@/schemas/diagnosis";

// ── スクリプトローカル型定義 ──────────────────────────────────────────────
// StyleAxisQuestion と同一構造（型互換を保つため全フィールドを列挙）
type StyleAxisName =
  | "thinking_action"
  | "offensive_stable"
  | "solo_team"
  | "divergent_convergent";

interface SimQuestion {
  id: string;
  order: number;
  axis: StyleAxisName;
  prompt: string;
  optionA: string;
  optionB: string;
  optionASide: string;
  optionBSide: string;
}

// types.json は DiagnosisType の全フィールドを持つが、スクリプト側は最小フィールドのみ使用する。
// resolveStyleAxisType へは as unknown as DiagnosisType[] でキャストして渡す。
interface SimType {
  id: string;
  name: string;
  axes?: {
    thinkingAction: number;
    offensiveStable: number;
    soloTeam: number;
    divergentConvergent: number;
  };
}

// ── 定数 ─────────────────────────────────────────────────────────────────
const DATA_ROOT = join(process.cwd(), "data", "diagnoses", "business-skills");
const CHOICES = ["strongly_a", "lean_a", "lean_b", "strongly_b"] as const;
const MAX_SCORE_PER_AXIS = 20;
const BORDERLINE_THRESHOLD = 0.2;
const FALLBACK_TYPE = "closer";

const AXIS_KEYS: StyleAxisName[] = [
  "thinking_action",
  "offensive_stable",
  "solo_team",
  "divergent_convergent",
];

const ABILITY_KEYS = ["logic", "execution", "sales", "creativity", "management"] as const;
type AbilityKey = (typeof ABILITY_KEYS)[number];

// ── 回答生成 ──────────────────────────────────────────────────────────────
function generateRandomAnswers(questions: SimQuestion[]): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const q of questions) {
    answers[q.id] = CHOICES[Math.floor(Math.random() * CHOICES.length)];
  }
  return answers;
}

/**
 * 指定タイプが高くなる極へ寄せた回答を生成する。
 * optionASide / optionBSide を参照して逆転項目を正しく処理する。
 */
function generatePersonaAnswers(
  questions: SimQuestion[],
  type: SimType
): Record<string, string> {
  if (!type.axes) return generateRandomAnswers(questions);

  const targetPoles: Record<string, string> = {
    thinking_action: type.axes.thinkingAction === 1 ? "thinking" : "action",
    offensive_stable: type.axes.offensiveStable === 1 ? "offensive" : "stable",
    solo_team: type.axes.soloTeam === 1 ? "solo" : "team",
    divergent_convergent: type.axes.divergentConvergent === 1 ? "divergent" : "convergent",
  };

  const answers: Record<string, string> = {};
  for (const q of questions) {
    const target = targetPoles[q.axis];
    const rand = Math.random();
    if (q.optionASide === target) {
      answers[q.id] = rand < 0.5 ? "strongly_a" : "lean_a";
    } else {
      answers[q.id] = rand < 0.5 ? "strongly_b" : "lean_b";
    }
  }
  return answers;
}

// ── 統計ヘルパー ──────────────────────────────────────────────────────────
function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function arrayMin(arr: number[]): number {
  return arr.reduce((mn, v) => (v < mn ? v : mn), Infinity);
}

function arrayMax(arr: number[]): number {
  return arr.reduce((mx, v) => (v > mx ? v : mx), -Infinity);
}

// ── ランダムモード ────────────────────────────────────────────────────────
function runRandomMode(questions: SimQuestion[], types: SimType[], runs: number): void {
  const typeCounts: Record<string, number> = {};
  for (const t of types) typeCounts[t.id] = 0;

  const axisHistory: Record<StyleAxisName, number[]> = {
    thinking_action: [],
    offensive_stable: [],
    solo_team: [],
    divergent_convergent: [],
  };

  const abilityHistory: Record<AbilityKey, number[]> = {
    logic: [], execution: [], sales: [], creativity: [], management: [],
  };
  const typeAbilityHistory: Record<string, Record<AbilityKey, number[]>> = {};
  for (const t of types) {
    typeAbilityHistory[t.id] = { logic: [], execution: [], sales: [], creativity: [], management: [] };
  }

  for (let i = 0; i < runs; i++) {
    const answers = generateRandomAnswers(questions);
    const scores = calculateStyleAxisScores(answers, questions, MAX_SCORE_PER_AXIS);
    const typeId = resolveStyleAxisType(
      scores,
      types as unknown as DiagnosisType[],
      FALLBACK_TYPE
    );
    const abilities = deriveAbilityScores(scores);

    typeCounts[typeId] = (typeCounts[typeId] ?? 0) + 1;
    for (const key of AXIS_KEYS) {
      axisHistory[key].push(scores[key]);
    }
    for (const key of ABILITY_KEYS) {
      abilityHistory[key].push(abilities[key]);
      (typeAbilityHistory[typeId] ?? typeAbilityHistory["closer"])[key].push(abilities[key]);
    }
  }

  // ─── 16タイプ分布 ────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  16タイプ分布 (降順)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const dist = types
    .map((t) => ({ id: t.id, name: t.name, count: typeCounts[t.id] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  for (const entry of dist) {
    const pct = (entry.count / runs) * 100;
    const bar = "█".repeat(Math.max(0, Math.round(pct / 2)));
    const flag =
      pct < 1 ? " [⚠  LOW ]" : pct > 15 ? " [⚠  HIGH]" : "          ";
    console.log(
      `  ${flag} ${entry.id.padEnd(24)} ${entry.count.toString().padStart(5)}  ${pct
        .toFixed(1)
        .padStart(5)}%  ${bar}`
    );
  }

  // ─── 軸スコア統計 ────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  軸スコア統計 (normalized -1.0〜+1.0)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `  ${"軸".padEnd(28)} ${"平均".padStart(7)} ${"SD".padStart(7)} ${"最小".padStart(7)} ${"最大".padStart(7)} ${"境界率".padStart(7)}`
  );
  console.log("  " + "─".repeat(68));

  for (const key of AXIS_KEYS) {
    const s = axisHistory[key];
    const avg = mean(s);
    const sd = stddev(s);
    const mn = arrayMin(s);
    const mx = arrayMax(s);
    const borderlinePct =
      (s.filter((v) => Math.abs(v) < BORDERLINE_THRESHOLD).length / runs) * 100;
    const warn = borderlinePct > 35 ? " ⚠" : "";
    console.log(
      `  ${key.padEnd(28)} ${avg.toFixed(3).padStart(7)} ${sd.toFixed(3).padStart(7)} ${mn
        .toFixed(3)
        .padStart(7)} ${mx.toFixed(3).padStart(7)} ${(borderlinePct.toFixed(1) + "%").padStart(
        6
      )}${warn}`
    );
  }

  // ─── 境界率サマリー ───────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  境界率サマリー  (|normalized| < 0.2)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const key of AXIS_KEYS) {
    const s = axisHistory[key];
    const pct =
      (s.filter((v) => Math.abs(v) < BORDERLINE_THRESHOLD).length / runs) * 100;
    const warn = pct > 35 ? "  ⚠ HIGH BORDERLINE" : "";
    console.log(`  ${key.padEnd(30)} borderline: ${pct.toFixed(1)}%${warn}`);
  }

  // ─── 5能力値統計 ───────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  5能力値統計 (25〜95 の整数)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `  ${"能力値".padEnd(16)} ${"平均".padStart(6)} ${"SD".padStart(6)} ${"最小".padStart(5)} ${"最大".padStart(5)} ${"床(25)".padStart(8)} ${"天(95)".padStart(8)}`
  );
  console.log("  " + "─".repeat(68));

  for (const key of ABILITY_KEYS) {
    const s = abilityHistory[key];
    const avg = mean(s);
    const sd = stddev(s);
    const mn = arrayMin(s);
    const mx = arrayMax(s);
    const floorPct = (s.filter((v) => v <= 25).length / runs) * 100;
    const ceilPct  = (s.filter((v) => v >= 95).length / runs) * 100;
    const warn = floorPct > 10 || ceilPct > 10 ? " ⚠" : "";
    console.log(
      `  ${key.padEnd(16)} ${avg.toFixed(1).padStart(6)} ${sd.toFixed(1).padStart(6)} ${mn
        .toString().padStart(5)} ${mx.toString().padStart(5)} ${(floorPct.toFixed(1) + "%").padStart(7)} ${(ceilPct.toFixed(1) + "%").padStart(7)}${warn}`
    );
  }

  // ─── タイプ別平均能力値 ─────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  タイプ別平均能力値 (ランダム回答平均)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const header = ["logic", "exec", "sales", "creat", "mgmt"].map((h) => h.padStart(6)).join(" ");
  console.log(`  ${"タイプID".padEnd(26)} ${header}  件数`);
  console.log("  " + "─".repeat(70));

  const sortedTypes = [...types].sort((a, b) =>
    (typeCounts[b.id] ?? 0) - (typeCounts[a.id] ?? 0)
  );
  for (const t of sortedTypes) {
    const hist = typeAbilityHistory[t.id];
    const n = typeCounts[t.id] ?? 0;
    const row = ABILITY_KEYS.map((k) => {
      const vals = hist[k];
      return vals.length > 0 ? mean(vals).toFixed(0).padStart(6) : "   N/A";
    }).join(" ");
    console.log(`  ${t.id.padEnd(26)} ${row}  ${n}`);
  }
}

// ── ペルソナモード ────────────────────────────────────────────────────────
function runPersonaMode(questions: SimQuestion[], types: SimType[], runs: number): void {
  const runsPerType = Math.max(1, Math.floor(runs / types.length));

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  ペルソナ正解率 (各タイプ ${runsPerType} 件)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  let totalRuns = 0;
  let totalCorrect = 0;

  for (const type of types) {
    let correct = 0;
    for (let i = 0; i < runsPerType; i++) {
      const answers = generatePersonaAnswers(questions, type);
      const scores = calculateStyleAxisScores(answers, questions, MAX_SCORE_PER_AXIS);
      const got = resolveStyleAxisType(
        scores,
        types as unknown as DiagnosisType[],
        FALLBACK_TYPE
      );
      if (got === type.id) correct++;
    }
    totalRuns += runsPerType;
    totalCorrect += correct;

    const acc = (correct / runsPerType) * 100;
    const flag = acc < 80 ? " ⚠  LOW " : "        ";
    console.log(
      `  ${flag} ${type.id.padEnd(24)} ${correct.toString().padStart(4)} / ${runsPerType}  (${acc
        .toFixed(1)
        .padStart(5)}%)`
    );
  }

  const overallAcc = (totalCorrect / totalRuns) * 100;
  console.log(
    `\n  全体正解率: ${totalCorrect} / ${totalRuns}  (${overallAcc.toFixed(1)}%)`
  );
}

// ── 理論タイプ別プロファイル ──────────────────────────────────────────────
/**
 * 各タイプの axes (1 or 4) を ±1.0 の normalized スコアに変換して
 * deriveAbilityScores を適用。タイプ固有の"純粋極"での能力値を示す。
 */
function showTypeProfiles(types: SimType[]): void {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  理論タイプ別プロファイル (axes を ±1.0 に投影して算出)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const header = ["logic", "exec", "sales", "creat", "mgmt"].map((h) => h.padStart(6)).join(" ");
  console.log(`  ${"タイプID".padEnd(26)} ${header}`);
  console.log("  " + "─".repeat(60));

  for (const t of types) {
    if (!t.axes) {
      console.log(`  ${t.id.padEnd(26)} (axes なし)`);
      continue;
    }
    // axes 値 1 → 正極 (+1.0), 4 → 負極 (-1.0)
    const axisScores = {
      thinking_action:     t.axes.thinkingAction     === 1 ? 1.0 : -1.0,
      offensive_stable:    t.axes.offensiveStable    === 1 ? 1.0 : -1.0,
      solo_team:           t.axes.soloTeam           === 1 ? 1.0 : -1.0,
      divergent_convergent: t.axes.divergentConvergent === 1 ? 1.0 : -1.0,
    };
    const profile = deriveAbilityScores(axisScores);
    const row = ABILITY_KEYS.map((k) => String(profile[k]).padStart(6)).join(" ");
    console.log(`  ${t.id.padEnd(26)} ${row}`);
  }
}

// ── エントリーポイント ────────────────────────────────────────────────────
function main(): void {
  const args = process.argv.slice(2);
  const runs = parseInt(
    (args.find((a) => a.startsWith("--runs=")) ?? "--runs=1000").split("=")[1],
    10
  );
  const mode = (args.find((a) => a.startsWith("--mode=")) ?? "--mode=random").split("=")[1];

  const questions = JSON.parse(
    readFileSync(join(DATA_ROOT, "questions.json"), "utf-8")
  ) as SimQuestion[];
  const types = JSON.parse(
    readFileSync(join(DATA_ROOT, "types.json"), "utf-8")
  ) as SimType[];

  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║   社会人能力値診断 — 合成回答シミュレーション                 ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log(`\n実行件数         : ${runs.toLocaleString()}`);
  console.log(`モード           : ${mode}`);
  console.log(`質問数           : ${questions.length}`);
  console.log(`各軸最大スコア   : ±${MAX_SCORE_PER_AXIS}`);
  console.log(`境界しきい値     : |normalized| < ${BORDERLINE_THRESHOLD}`);

  if (mode === "persona") {
    runPersonaMode(questions, types, runs);
  } else {
    runRandomMode(questions, types, runs);
  }

  showTypeProfiles(types);
  console.log("\n  シミュレーション完了\n");
}

main();
