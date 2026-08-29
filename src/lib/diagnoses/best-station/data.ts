import path from "path";
import fs from "fs";
import {
  PrefecturesDataSchema,
  DestinationZonesDataSchema,
  StationsDataSchema,
  MatchingRulesSchema,
  ResultCopySchema,
  QuestionsDataSchema,
} from "./schemas";
import type { Station, QuestionStep } from "./types";

const DATA_ROOT = path.join(process.cwd(), "data", "diagnoses", "best-station");

function readJson(file: string): unknown {
  const raw = fs.readFileSync(path.join(DATA_ROOT, file), "utf-8");
  return JSON.parse(raw);
}

export function loadQuestions(): QuestionStep[] {
  const data = QuestionsDataSchema.parse(readJson("questions.json"));
  return data.steps as QuestionStep[];
}

export function loadPrefectures() {
  return PrefecturesDataSchema.parse(readJson("prefectures.json"));
}

export function loadDestinationZones() {
  return DestinationZonesDataSchema.parse(readJson("destination-zones.json"));
}

export function loadStations(): Station[] {
  const data = StationsDataSchema.parse(readJson("stations.json"));
  return data.stations.filter((s) => s.active) as Station[];
}

export function loadMatchingRules() {
  return MatchingRulesSchema.parse(readJson("matching-rules.json"));
}

export function loadResultCopy() {
  return ResultCopySchema.parse(readJson("result-copy.json"));
}
