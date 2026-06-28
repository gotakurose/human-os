import { loadMeta, loadQuestions, loadScoring } from "@/lib/data-loader";
import { notFound } from "next/navigation";
import { QuestionFlow } from "./QuestionFlow";

interface Props {
  params: Promise<{ diagnosisId: string }>;
}

export default async function QuestionsPage({ params }: Props) {
  const { diagnosisId } = await params;

  let meta, questions, scoring;
  try {
    meta = loadMeta(diagnosisId);
    questions = loadQuestions(diagnosisId);
    scoring = loadScoring(diagnosisId);
  } catch {
    notFound();
  }

  return (
    <main className="flex-1 px-5 py-12 max-w-2xl mx-auto w-full">
      <QuestionFlow
        diagnosisId={diagnosisId}
        meta={meta}
        questions={questions}
        scoring={scoring}
      />
    </main>
  );
}
