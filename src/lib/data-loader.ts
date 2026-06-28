import path from "path";
import fs from "fs";
import {
  MetaSchema,
  QuestionsSchema,
  TypesSchema,
  ScoringSchema,
  type Meta,
  type Question,
  type DiagnosisType,
  type Scoring,
} from "@/schemas/diagnosis";

const DATA_ROOT = path.join(process.cwd(), "data", "diagnoses");

function readJson(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function loadMeta(diagnosisId: string): Meta {
  const file = path.join(DATA_ROOT, diagnosisId, "meta.json");
  return MetaSchema.parse(readJson(file));
}

export function loadQuestions(diagnosisId: string): Question[] {
  const file = path.join(DATA_ROOT, diagnosisId, "questions.json");
  return QuestionsSchema.parse(readJson(file));
}

export function loadTypes(diagnosisId: string): DiagnosisType[] {
  const file = path.join(DATA_ROOT, diagnosisId, "types.json");
  return TypesSchema.parse(readJson(file));
}

export function loadScoring(diagnosisId: string): Scoring {
  const file = path.join(DATA_ROOT, diagnosisId, "scoring.json");
  return ScoringSchema.parse(readJson(file));
}

export function loadAllMeta(): Meta[] {
  const indexPath = path.join(process.cwd(), "data", "index.json");
  if (!fs.existsSync(indexPath)) return [];
  const index = JSON.parse(fs.readFileSync(indexPath, "utf-8")) as {
    diagnoses: string[];
  };
  return index.diagnoses
    .map((id) => {
      try {
        return loadMeta(id);
      } catch {
        return null;
      }
    })
    .filter((m): m is Meta => m !== null);
}
