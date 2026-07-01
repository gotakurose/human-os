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
  { id: "strongly_a", sideLabel: "強",   sideA: true  },
  { id: "lean_a",     sideLabel: "やや", sideA: true  },
  { id: "lean_b",     sideLabel: "やや", sideA: false },
  { id: "strongly_b", sideLabel: "強",   sideA: false },
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

      const result = dispatch("type16", newAnswers, { questions, scoring, types });

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
        <div
          className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--dossier-line)",
            borderTopColor: "var(--dossier-gold)",
          }}
        />
        <p className="text-sm font-jp" style={{ color: "var(--dossier-muted)" }}>
          解析中...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <Link
        href={`/diagnoses/${diagnosisId}`}
        className="text-xs font-jp transition-opacity hover:opacity-60 mb-8 inline-block"
        style={{ color: "var(--dossier-muted)" }}
      >
        ← 説明へ戻る
      </Link>

      {/* Instruction */}
      <div
        className="pl-3 mb-8"
        style={{ borderLeft: "2px solid var(--dossier-line)" }}
      >
        <p className="text-xs font-jp leading-relaxed" style={{ color: "var(--dossier-muted)" }}>
          深く考えすぎず、普段の仕事中の自分に近い方を選んでください。
        </p>
        <p className="text-xs font-jp leading-relaxed mt-0.5" style={{ color: "var(--dossier-muted)" }}>
          どちらも当てはまる場合は、より自然にやりがちな方を選んでください。
        </p>
      </div>

      {/* Progress — thin measurement line */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-2">
          <span className="font-mono-doc" style={{ color: "var(--dossier-sub)" }}>
            {currentIndex + 1} / {totalQuestions}
          </span>
          <span
            className="font-mono-doc"
            style={{ color: "var(--dossier-muted)" }}
          >
            {progressPercent}%
          </span>
        </div>
        {/* Track */}
        <div className="h-px relative" style={{ background: "var(--dossier-line)" }}>
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              background: "var(--dossier-gold)",
            }}
          />
        </div>
      </div>

      {/* Question prompt
          min-h anchors the A/B card top regardless of 1-line vs 2-line question.
          mobile: 120px covers 3-line wraps; sm: 96px covers 2-line wraps. */}
      <div className="mb-6 min-h-[120px] sm:min-h-[96px]">
        <p
          className="text-[11px] font-mono-doc mb-3"
          style={{ color: "var(--dossier-muted)" }}
        >
          Q{currentIndex + 1}
        </p>
        <p
          className="font-jp font-medium leading-relaxed"
          style={{ fontSize: "1rem", color: "var(--dossier-ink)" }}
        >
          {currentQuestion.prompt}
        </p>
      </div>

      {/* A / B option cards — dossier question field style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {/* A */}
        <div
          className="p-4 flex flex-col min-h-[120px] sm:min-h-[160px]"
          style={{
            border: "1px solid var(--dossier-line)",
            background: "var(--dossier-surface)",
          }}
        >
          <span
            className="text-[11px] font-mono-doc mb-2 shrink-0"
            style={{ color: "var(--dossier-gold)" }}
          >
            A
          </span>
          <p
            className="font-jp leading-relaxed"
            style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
          >
            {currentQuestion.optionA}
          </p>
        </div>
        {/* B */}
        <div
          className="p-4 flex flex-col min-h-[120px] sm:min-h-[160px]"
          style={{
            border: "1px solid var(--dossier-line)",
            background: "var(--dossier-surface)",
          }}
        >
          <span
            className="text-[11px] font-mono-doc mb-2 shrink-0"
            style={{ color: "var(--dossier-muted)" }}
          >
            B
          </span>
          <p
            className="font-jp leading-relaxed"
            style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
          >
            {currentQuestion.optionB}
          </p>
        </div>
      </div>

      {/* ── 4-segment connected answer strip ─────────────────────────────── */}

      {/* A/B side labels — above on PC */}
      <div className="hidden sm:flex justify-between mb-1 px-px">
        <span
          className="text-[11px] font-mono-doc"
          style={{ color: "var(--dossier-muted)" }}
        >
          ← A 側
        </span>
        <span
          className="text-[11px] font-mono-doc"
          style={{ color: "var(--dossier-muted)" }}
        >
          B 側 →
        </span>
      </div>

      {/* Connected strip — gap-px on a gold background = ruled border */}
      <div
        className="grid grid-cols-4 gap-px overflow-hidden"
        style={{ background: "var(--dossier-line)" }}
      >
        {CHOICES.map((choice, idx) => {
          const isOuter = idx === 0 || idx === 3;
          return (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              className="flex flex-col items-center justify-center gap-0.5 py-4 transition-colors"
              style={{
                background: "var(--dossier-surface)",
                minHeight: "60px",
                borderTop: isOuter
                  ? "2px solid var(--dossier-gold)"
                  : "2px solid rgba(140,122,75,0.30)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--dossier-paper)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--dossier-surface)";
              }}
            >
              {/* 強 / やや helper label */}
              <span
                className="text-[9px] leading-none font-mono-doc"
                style={{
                  color: isOuter
                    ? "var(--dossier-gold)"
                    : "var(--dossier-muted)",
                }}
              >
                {choice.sideLabel}
              </span>
              {/* A / B label */}
              <span
                className="text-xs leading-none font-jp font-medium"
                style={{
                  color: isOuter
                    ? "var(--dossier-ink)"
                    : "var(--dossier-sub)",
                }}
              >
                {choice.sideA ? "A" : "B"}寄り
              </span>
            </button>
          );
        })}
      </div>

      {/* A/B side labels — below on mobile */}
      <div className="flex justify-between mt-1 px-px sm:hidden">
        <span
          className="text-[10px] font-mono-doc"
          style={{ color: "var(--dossier-muted)" }}
        >
          ← A 側
        </span>
        <span
          className="text-[10px] font-mono-doc"
          style={{ color: "var(--dossier-muted)" }}
        >
          B 側 →
        </span>
      </div>
    </div>
  );
}
