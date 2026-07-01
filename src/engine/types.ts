export type EngineType = "radar" | "type16" | "branch" | "score";

export interface DiagnosisMeta {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  questionCount: number;
  estimatedMinutes: number;
  engineType: EngineType;
  typeCount: number;
  published: boolean;
  createdAt: string;
}

export interface AxisScore {
  axisId: string;
  score: number; // 0–100 normalized
}

export interface StyleAxisScoreMap {
  thinking_action: number;
  offensive_stable: number;
  solo_team: number;
  divergent_convergent: number;
}

export interface DiagnosisResult {
  typeId: string;
  scores: AxisScore[];
  styleAxisScores?: StyleAxisScoreMap;
}
