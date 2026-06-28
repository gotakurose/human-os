"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Question, Scoring, Meta } from "@/schemas/diagnosis";
import { dispatch } from "@/engine/dispatcher";

interface Props {
  diagnosisId: string;
  meta: Meta;
  questions: Question[];
  scoring: Scoring;
}

export function QuestionFlow({ diagnosisId, meta, questions, scoring }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = Math.round((currentIndex / totalQuestions) * 100);

  function handleSelectOption(optionId: string) {
    if (isSubmitting) return;

    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(newAnswers);

    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((i) => i + 1);
    } else {
      // All questions answered — compute result
      setIsSubmitting(true);

      const result = dispatch("radar", newAnswers, {
        questions,
        scoring,
        axes: meta.axes ?? [],
      });

      const params = new URLSearchParams();
      for (const { axisId, score } of result.scores) {
        params.set(axisId, String(score));
      }

      router.push(
        `/diagnoses/${diagnosisId}/results/${result.typeId}?${params.toString()}`
      );
    }
  }

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        <p className="text-sm text-neutral-400">診断中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <Link
        href={`/diagnoses/${diagnosisId}`}
        className="text-xs text-neutral-400 hover:text-neutral-600 mb-8 inline-block transition-colors"
      >
        ← 説明へ戻る
      </Link>

      {/* Progress */}
      <div className="mb-10">
        <div className="flex justify-between text-xs text-neutral-400 mb-2">
          <span className="font-mono">
            {currentIndex + 1} / {totalQuestions}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-1 bg-neutral-900 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <p className="text-xs font-mono text-neutral-400 mb-3">
          Q{currentIndex + 1}
        </p>
        <p className="text-lg font-medium leading-relaxed text-neutral-900">
          {currentQuestion.text}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {currentQuestion.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelectOption(option.id)}
            className="text-left border border-neutral-200 rounded-2xl px-5 py-4 text-sm leading-relaxed text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 active:bg-neutral-50 transition-colors"
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}
