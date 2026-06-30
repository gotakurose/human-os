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
import { calculateStyleAxisScores, resolveStyleAxisType } from "@/engine/style-axis-scorer";
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

  for (let i = 0; i < runs; i++) {
    const answers = generateRandomAnswers(questions);
    const scores = calculateStyleAxisScores(answers, questions, MAX_SCORE_PER_AXIS);
    const typeId = resolveStyleAxisType(
      scores,
      types as unknown as DiagnosisType[],
      FALLBACK_TYPE
    );

    typeCounts[typeId] = (typeCounts[typeId] ?? 0) + 1;
    for (const key of AXIS_KEYS) {
      axisHistory[key].push(scores[key]);
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

  console.log("\n  シミュレーション完了\n");
}

main();
