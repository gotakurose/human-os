import type { EngineType, DiagnosisResult } from "./types";
import type { Question, Scoring } from "@/schemas/diagnosis";
import { aggregateScores, computeMaxScores, normalize } from "./scorer";
import { resolveType } from "./resolver";

export interface RawAnswers {
  [questionId: string]: string;
}

interface RadarData {
  questions: Question[];
  scoring: Scoring;
  axes: string[];
}

export function dispatch(
  engineType: EngineType,
  answers: RawAnswers,
  data: RadarData | unknown
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
    case "type16":
      throw new Error("type16 engine: not implemented (Phase 3)");
    case "branch":
      throw new Error("branch engine: not implemented (Phase 2)");
    case "score":
      throw new Error("score engine: not implemented");
  }
}
