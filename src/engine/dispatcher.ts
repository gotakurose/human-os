import type { EngineType, DiagnosisResult } from "./types";
import type { Question, Scoring, StyleAxisQuestion, DiagnosisType } from "@/schemas/diagnosis";
import { aggregateScores, computeMaxScores, normalize } from "./scorer";
import { resolveType } from "./resolver";
import { calculateStyleAxisScores, resolveStyleAxisType, deriveAbilityScores } from "./style-axis-scorer";

export interface RawAnswers {
  [questionId: string]: string;
}

interface RadarData {
  questions: Question[];
  scoring: Scoring;
  axes: string[];
}

interface StyleAxisData {
  questions: StyleAxisQuestion[];
  scoring: Scoring;
  types: DiagnosisType[];
}

export function dispatch(
  engineType: EngineType,
  answers: RawAnswers,
  data: RadarData | StyleAxisData | unknown
): DiagnosisResult {
  switch (engineType) {
    case "radar": {
      const { questions, scoring, axes } = data as RadarData;

      const raw = aggregateScores(answers, questions);
      const maxFromQuestions = computeMaxScores(questions);

      // Ensure all declared axes are in the max map (default to 1 to avoid division by zero)
      const maxScores: Record<string, number> = Object.fromEntries(
        axes.map((a) => [a, maxFromQuestions[a] ?? 1])
      );

      const normalized = normalize(raw, maxScores);

      // Ensure all axes have a value in the output
      const scores = Object.fromEntries(
        axes.map((a) => [a, normalized[a] ?? 0])
      );

      const typeId = resolveType(scores, scoring);

      return {
        typeId,
        scores: Object.entries(scores).map(([axisId, score]) => ({
          axisId,
          score,
        })),
      };
    }

    case "type16": {
      const { questions, scoring, types } = data as StyleAxisData;
      const maxScore = scoring.maxScorePerAxis ?? 20;

      // 4スタイル軸スコアを算出 (-1.0 〜 +1.0)
      const axisScores = calculateStyleAxisScores(answers, questions, maxScore);

      // 符号マッチングでタイプ確定
      const typeId = resolveStyleAxisType(axisScores, types, scoring.fallback);

      // 5能力値: 4軸スコアから算出（abilityWeights による bilateral 加重和）
      const abilityScores = deriveAbilityScores(axisScores);

      return {
        typeId,
        scores: Object.entries(abilityScores).map(([axisId, score]) => ({
          axisId,
          score,
        })),
      };
    }

    case "branch":
      throw new Error("branch engine: not implemented (Phase 2)");
    case "score":
      throw new Error("score engine: not implemented");
  }
}
