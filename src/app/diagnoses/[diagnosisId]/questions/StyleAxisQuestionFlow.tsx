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
  { id: "strongly_a", sideLabel: "強", sideA: true,  mainLabel: "A寄り" },
  { id: "lean_a",     sideLabel: "やや", sideA: true,  mainLabel: "A寄り" },
  { id: "lean_b",     sideLabel: "やや", sideA: false, mainLabel: "B寄り" },
  { id: "strongly_b", sideLabel: "強", sideA: false, mainLabel: "B寄り" },
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
      if (result.styleAxisScores) {
        const sa = result.styleAxisScores;
        params.set("ta", String(Math.round(sa.thinking_action * 100)));
        params.set("os", String(Math.round(sa.offensive_stable * 100)));
        params.set("st", String(Math.round(sa.solo_team * 100)));
        params.set("dc", String(Math.round(sa.divergent_convergent * 100)));
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

      {/* Question prompt
          min-h anchors the A/B card top regardless of 1-line vs 2-line question.
          mobile: 120px covers 3-line wraps; sm: 96px covers 2-line wraps. */}
      <div className="mb-6 min-h-[120px] sm:min-h-[96px]">
        <p className="text-xs font-mono text-neutral-400 mb-3">
          Q{currentIndex + 1}
        </p>
        <p className="text-base font-medium leading-relaxed text-neutral-900">
          {currentQuestion.prompt}
        </p>
      </div>

      {/* A / B option cards */}
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

      {/* ── 4-segment connected choice UI ──────────────────────────────────── */}
      {/* A label row (PC: above buttons; mobile: shown as in-button text only) */}
      <div className="hidden sm:flex justify-between mb-1 px-px">
        <span className="text-[11px] text-neutral-400">← A側</span>
        <span className="text-[11px] text-neutral-400">B側 →</span>
      </div>

      {/* Connected button strip: gap-px on bg = accent border colour */}
      <div
        className="grid grid-cols-4 gap-px rounded-lg overflow-hidden"
        style={{ background: "#D6CEB8" }}
      >
        {CHOICES.map((choice, idx) => {
          const isOuter = idx === 0 || idx === 3;
          return (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              className="flex flex-col items-center justify-center gap-0.5 py-4 transition-colors"
              style={{
                background: "#FAFAF8",
                minHeight: "64px",
                borderTop: isOuter
                  ? "2px solid #8C7A4B"
                  : "2px solid rgba(140,122,75,0.28)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#F0EDE6";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#FAFAF8";
              }}
            >
              {/* 強 / やや helper label */}
              <span
                className="text-[9px] leading-none font-mono"
                style={{ color: isOuter ? "#8C7A4B" : "#B0A99A" }}
              >
                {choice.sideLabel}
              </span>
              {/* Main label */}
              <span
                className="text-xs font-medium leading-none"
                style={{ color: isOuter ? "#1A1815" : "#6B655C" }}
              >
                {choice.sideA ? "A" : "B"}寄り
              </span>
            </button>
          );
        })}
      </div>

      {/* A/B side labels below (mobile) */}
      <div className="flex justify-between mt-1 px-px sm:hidden">
        <span className="text-[10px] text-neutral-400">← A側</span>
        <span className="text-[10px] text-neutral-400">B側 →</span>
      </div>
    </div>
  );
}
