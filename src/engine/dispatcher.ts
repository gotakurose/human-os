import type { EngineType, DiagnosisResult, AxisScore } from "./types";

export interface RawAnswers {
  [questionId: string]: string; // optionId
}

/**
 * エンジンディスパッチャー。
 * engineType を見て適切なエンジンに処理を振り分ける。
 * Phase 1 では "radar" のみ完全実装。その他はスケルトン。
 */
export function dispatch(
  engineType: EngineType,
  answers: RawAnswers,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  diagnosisData: any
): DiagnosisResult {
  switch (engineType) {
    case "radar":
      return runRadar(answers, diagnosisData);
    case "type16":
      throw new Error("type16 engine is not implemented yet (Phase 3)");
    case "branch":
      throw new Error("branch engine is not implemented yet (Phase 2)");
    case "score":
      throw new Error("score engine is not implemented yet");
  }
}

function runRadar(
  _answers: RawAnswers,
  _diagnosisData: unknown
): DiagnosisResult {
  // Phase 1 で実装予定。scorer.ts と resolver.ts に処理を委譲する。
  throw new Error("radar engine implementation pending (scorer.ts / resolver.ts)");
}

export type { AxisScore };
