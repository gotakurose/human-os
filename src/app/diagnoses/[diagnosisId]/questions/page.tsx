import {
  loadMeta,
  loadQuestions,
  loadScoring,
  loadStyleAxisQuestions,
  loadTypes,
  loadAbilityScoring,
} from "@/lib/data-loader";
import type { AbilityScoringEntry } from "@/schemas/diagnosis";
import { notFound } from "next/navigation";
import { QuestionFlow } from "./QuestionFlow";
import { StyleAxisQuestionFlow } from "./StyleAxisQuestionFlow";

export const metadata = {
  robots: { index: false, follow: true },
};

interface Props {
  params: Promise<{ diagnosisId: string }>;
}

export default async function QuestionsPage({ params }: Props) {
  const { diagnosisId } = await params;

  let meta, scoring, styleAxisQuestions, radarQuestions, types;
  let abilityContributions: AbilityScoringEntry[] = [];

  try {
    meta = loadMeta(diagnosisId);
    scoring = loadScoring(diagnosisId);
    if (meta.engineType === "type16") {
      styleAxisQuestions = loadStyleAxisQuestions(diagnosisId);
      types = loadTypes(diagnosisId);
    } else {
      radarQuestions = loadQuestions(diagnosisId);
    }
  } catch {
    notFound();
  }

  // null-guards で TypeScript を絞り込む（JSX は try/catch 外で返す）
  if (!meta || !scoring) return notFound();

  if (meta.engineType === "type16") {
    if (!styleAxisQuestions || !types) return notFound();
    try {
      abilityContributions = loadAbilityScoring(diagnosisId).contributions;
    } catch { /* ability-scoring.json is optional */ }
    return (
      <main className="flex-1">
        <StyleAxisQuestionFlow
          diagnosisId={diagnosisId}
          meta={meta}
          questions={styleAxisQuestions}
          scoring={scoring}
          types={types}
          abilityContributions={abilityContributions}
        />
      </main>
    );
  }

  if (!radarQuestions) return notFound();
  return (
    <main className="flex-1 px-5 py-12 max-w-2xl mx-auto w-full">
      <QuestionFlow
        diagnosisId={diagnosisId}
        meta={meta}
        questions={radarQuestions}
        scoring={scoring}
      />
    </main>
  );
}
