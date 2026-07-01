"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StyleAxisQuestion, Scoring, Meta, DiagnosisType } from "@/schemas/diagnosis";
import { dispatch } from "@/engine/dispatcher";

interface Props {
  diagnosisId: string;
  meta: Meta;
  questions: StyleAxisQuestion[];
  scoring: Scoring;
  types: DiagnosisType[];
}

const CHOICES = [
  { id: "strongly_a", label: "Aに近い" },
  { id: "lean_a",     label: "ややA寄り" },
  { id: "lean_b",     label: "ややB寄り" },
  { id: "strongly_b", label: "Bに近い" },
] as const;

export function StyleAxisQuestionFlow({ diagnosisId, questions, scoring, types }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions]
  );

  const currentQuestion = sortedQuestions[currentIndex];
  const totalQuestions = sortedQuestions.length;
  const progressPercent = Math.round((currentIndex / totalQuestions) * 100);

  function handleChoice(choiceId: string) {
    if (isSubmitting) return;

    const newAnswers = { ...answers, [currentQuestion.id]: choiceId };
    setAnswers(newAnswers);

    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsSubmitting(true);

      const result = dispatch("type16", newAnswers, {
        questions,
        scoring,
        types,
      });

      const params = new URLSearchParams();
      for (const { axisId, score } of result.scores) {
        params.set(axisId, String(Math.round(score)));
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

      {/* Instruction */}
      <div className="border-l-2 border-neutral-100 pl-3 mb-8">
        <p className="text-xs text-neutral-400 leading-relaxed">
          深く考えすぎず、普段の仕事中の自分に近い方を選んでください。
        </p>
        <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
          どちらも当てはまる場合は、「より自然にやりがちな方」を選んでください。
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
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

      {/* Question prompt — min-h reduces shift between 1-line and 2-line prompts */}
      <div className="mb-6 min-h-[3.5rem]">
        <p className="text-xs font-mono text-neutral-400 mb-3">
          Q{currentIndex + 1}
        </p>
        <p className="text-base font-medium leading-relaxed text-neutral-900">
          {currentQuestion.prompt}
        </p>
      </div>

      {/* A / B option cards
          min-h-[120px] sm:min-h-[160px] stabilises the button Y-position across questions on desktop.
          flex flex-col lets content grow naturally while keeping the card height floored. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <div className="border border-neutral-100 rounded-xl p-4 flex flex-col min-h-[120px] sm:min-h-[160px]">
          <span className="text-xs font-mono text-neutral-400 mb-2 block shrink-0">A</span>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {currentQuestion.optionA}
          </p>
        </div>
        <div className="border border-neutral-100 rounded-xl p-4 flex flex-col min-h-[120px] sm:min-h-[160px]">
          <span className="text-xs font-mono text-neutral-400 mb-2 block shrink-0">B</span>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {currentQuestion.optionB}
          </p>
        </div>
      </div>

      {/* 4-choice buttons: 2×2 on mobile (easier tap targets), 1×4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CHOICES.map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleChoice(choice.id)}
            className="border border-neutral-200 rounded-xl py-3 text-xs text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 active:bg-neutral-50 transition-colors min-h-[44px] flex items-center justify-center"
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}
