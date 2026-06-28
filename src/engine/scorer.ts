import type { Question } from "@/schemas/diagnosis";

export type AxisScoreMap = Record<string, number>;

export function aggregateScores(
  answers: Record<string, string>,
  questions: Question[]
): AxisScoreMap {
  const raw: AxisScoreMap = {};

  for (const question of questions) {
    const selectedOptionId = answers[question.id];
    if (!selectedOptionId) continue;

    const option = question.options.find((o) => o.id === selectedOptionId);
    if (!option) continue;

    for (const [axis, pts] of Object.entries(option.scores)) {
      raw[axis] = (raw[axis] ?? 0) + pts;
    }
  }

  return raw;
}

// Compute maximum possible score per axis across all questions
// (sum of the best option score for each axis in each question)
export function computeMaxScores(questions: Question[]): AxisScoreMap {
  const max: AxisScoreMap = {};

  for (const question of questions) {
    const questionMax: AxisScoreMap = {};

    for (const option of question.options) {
      for (const [axis, pts] of Object.entries(option.scores)) {
        questionMax[axis] = Math.max(questionMax[axis] ?? 0, pts);
      }
    }

    for (const [axis, pts] of Object.entries(questionMax)) {
      max[axis] = (max[axis] ?? 0) + pts;
    }
  }

  return max;
}

export function normalize(
  raw: AxisScoreMap,
  maxScores: AxisScoreMap
): AxisScoreMap {
  return Object.fromEntries(
    Object.entries(maxScores).map(([axis, maxPts]) => [
      axis,
      maxPts > 0 ? Math.round(((raw[axis] ?? 0) / maxPts) * 100) : 0,
    ])
  );
}
