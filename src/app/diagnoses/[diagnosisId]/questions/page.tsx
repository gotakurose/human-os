import {
  loadMeta,
  loadQuestions,
  loadScoring,
  loadStyleAxisQuestions,
  loadTypes,
} from "@/lib/data-loader";
import { notFound } from "next/navigation";
import { QuestionFlow } from "./QuestionFlow";
import { StyleAxisQuestionFlow } from "./StyleAxisQuestionFlow";

interface Props {
  params: Promise<{ diagnosisId: string }>;
}

export default async function QuestionsPage({ params }: Props) {
  const { diagnosisId } = await params;

  let meta, scoring, styleAxisQuestions, radarQuestions, types;

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
    return (
      <main className="flex-1 px-5 py-12 max-w-2xl mx-auto w-full">
        <StyleAxisQuestionFlow
          diagnosisId={diagnosisId}
          meta={meta}
          questions={styleAxisQuestions}
          scoring={scoring}
          types={types}
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
