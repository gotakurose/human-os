"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StyleAxisQuestion, Scoring, Meta, DiagnosisType, AbilityScoringEntry } from "@/schemas/diagnosis";
import { dispatch } from "@/engine/dispatcher";
import { calculateAbilityUScores, buildAvParam } from "@/engine/ability-scorer";

interface Props {
  diagnosisId: string;
  meta: Meta;
  questions: StyleAxisQuestion[];
  scoring: Scoring;
  types: DiagnosisType[];
  abilityContributions?: AbilityScoringEntry[];
}

const CHOICES = [
  { id: "strongly_a", label: "強くA", sideA: true  },
  { id: "lean_a",     label: "ややA", sideA: true  },
  { id: "lean_b",     label: "ややB", sideA: false },
  { id: "strongly_b", label: "強くB", sideA: false },
] as const;

// Gold indicator position on the measurement bar per selected choice
const INDICATOR_CONFIG: Record<string, { left: string; width: string }> = {
  strongly_a: { left: "0%",   width: "50%" },
  lean_a:     { left: "25%",  width: "25%" },
  lean_b:     { left: "50%",  width: "25%" },
  strongly_b: { left: "50%",  width: "50%" },
};

// Per-diagnosis stage background image
const STAGE_BG: Record<string, string> = {
  "business-skills": "/images/diagnoses/business-skills/hero-question-temp.png",
};

export function StyleAxisQuestionFlow({ diagnosisId, questions, scoring, types, abilityContributions = [] }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions]
  );

  const currentQuestion = sortedQuestions[currentIndex];
  const totalQuestions = sortedQuestions.length;
  const progressPercent = Math.round((currentIndex / totalQuestions) * 100);

  const stageBg = STAGE_BG[diagnosisId] ?? null;
  const hasImage = !!stageBg;

  // Derived selection state for current question
  const currentAnswer = answers[currentQuestion?.id] ?? null;
  const selectedSide =
    currentAnswer === "strongly_a" || currentAnswer === "lean_a" ? "a" :
    currentAnswer === "lean_b"    || currentAnswer === "strongly_b" ? "b" :
    null;
  const indicator = currentAnswer ? (INDICATOR_CONFIG[currentAnswer] ?? null) : null;

  const promptLen      = (currentQuestion?.prompt ?? "").length;
  const promptFontSize = promptLen >= 28 ? "clamp(16px,1.8vw,1.0625rem)" : "1.0625rem";
  const optALen        = (currentQuestion?.optionA ?? "").length;
  const optBLen        = (currentQuestion?.optionB ?? "").length;
  const optAClamp      = optALen >= 31 ? "clamp(14px,1.8vw,1.0625rem)" : optALen >= 27 ? "clamp(15px,1.8vw,1.0625rem)" : "clamp(16px,1.8vw,1.0625rem)";
  const optBClamp      = optBLen >= 31 ? "clamp(14px,1.8vw,1.0625rem)" : optBLen >= 27 ? "clamp(15px,1.8vw,1.0625rem)" : "clamp(16px,1.8vw,1.0625rem)";

  function handleChoice(choiceId: string) {
    if (isFinalizing) return;

    const newAnswers = { ...answers, [currentQuestion.id]: choiceId };
    setAnswers(newAnswers);

    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinalizing(true);

      const result = dispatch("type16", newAnswers, { questions, scoring, types });

      const params = new URLSearchParams();
      if (result.styleAxisScores) {
        const sa = result.styleAxisScores;
        params.set("ta", String(Math.round(sa.thinking_action * 100)));
        params.set("os", String(Math.round(sa.offensive_stable * 100)));
        params.set("st", String(Math.round(sa.solo_team * 100)));
        params.set("dc", String(Math.round(sa.divergent_convergent * 100)));
      }
      if (abilityContributions.length > 0) {
        const u = calculateAbilityUScores(newAnswers, abilityContributions);
        params.set("av", buildAvParam(u));
      }

      const url = `/diagnoses/${diagnosisId}/results/${result.typeId}?${params.toString()}`;

      // Respect reduced-motion — short delay only
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const delay = prefersReduced ? 200 : 1400;
      setTimeout(() => router.push(url), delay);
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  // ── 鑑定中 loading screen ──────────────────────────────────────────────────
  if (isFinalizing) {
    return (
      <div
        className="dossier-page flex flex-col items-center justify-center min-h-screen gap-10"
        style={{ color: "#21160D" }}
      >
        {/* Diamond pulse */}
        <div
          className="finalizing-diamond w-10 h-10"
          style={{ background: "#8A713C" }}
        />

        <div className="text-center space-y-4">
          <p
            className="font-heading text-[2.4rem] md:text-[4rem] leading-[1.1] tracking-[0.04em]"
            style={{ color: "#17100A" }}
          >
            鑑定中
          </p>
          <p
            className="font-mono-doc text-xs tracking-[0.32em]"
            style={{ color: "rgba(111,85,44,0.72)" }}
          >
            ANALYZING YOUR OS...
          </p>
        </div>
      </div>
    );
  }

  // Colors that adapt based on whether a background image is present
  const navColor      = hasImage ? "rgba(245,243,239,0.92)" : "var(--dossier-muted)";
  const qCountColor   = hasImage ? "rgba(245,243,239,0.96)" : "var(--dossier-sub)";
  const pctColor      = hasImage ? "rgba(245,243,239,0.72)" : "var(--dossier-muted)";
  const progressBg    = hasImage ? "rgba(245,243,239,0.35)" : "var(--dossier-line)";

  return (
    <div className="dossier-page min-h-screen">

      {/* ── Stage header ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden h-[190px] md:h-[320px]"
        style={{ backgroundColor: hasImage ? "var(--dossier-dark)" : "var(--dossier-bg)" }}
      >
        {/* Background image — slow horizontal pan animation */}
        {stageBg && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${stageBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
              animation: "stagePan 10s ease-in-out infinite",
            }}
          />
        )}

        {/* Gradient: image stays visible top → fades to dossier-bg at bottom */}
        {hasImage && (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(245,243,239,0.05) 0%, rgba(245,243,239,0.28) 58%, var(--dossier-bg) 100%)",
            }}
          />
        )}

        {/* Controls overlay — subtle backdrop when image is present for readability */}
        <div
          className="relative z-10 max-w-3xl mx-auto px-5 pt-8"
          style={hasImage ? { background: "rgba(252,251,249,0.10)" } : undefined}
        >

          {/* Back navigation: ← 前の質問 on Q2+, ← 説明へ戻る on Q1 */}
          {currentIndex > 0 ? (
            <button
              onClick={handleBack}
              className="text-sm font-jp transition-opacity hover:opacity-70 inline-block mb-7"
              style={{ color: navColor }}
            >
              ← 前の質問
            </button>
          ) : (
            <Link
              href={`/diagnoses/${diagnosisId}`}
              className="text-sm font-jp transition-opacity hover:opacity-70 inline-block mb-7"
              style={{ color: navColor }}
            >
              ← 説明へ戻る
            </Link>
          )}

          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="font-mono-doc" style={{ color: qCountColor }}>
                Q.{String(currentIndex + 1).padStart(2, "0")} / {totalQuestions}
              </span>
              <span className="font-mono-doc" style={{ color: pctColor }}>
                {progressPercent}%
              </span>
            </div>
            <div className="h-px relative" style={{ background: progressBg }}>
              <div
                className="absolute inset-y-0 left-0 transition-all duration-300"
                style={{ width: `${progressPercent}%`, background: "var(--dossier-gold)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Question card — animates in on each question change ──── */}
      <div className="max-w-3xl mx-auto px-5 pb-4 md:pb-8" style={{ marginTop: "-4rem" }}>
        <div
          key={currentIndex}
          className="relative z-20"
          style={{
            background: "var(--dossier-surface)",
            border: "1px solid var(--dossier-line)",
            borderRadius: "12px",
            padding: "1rem 1rem 0",
            boxShadow: "0 2px 20px rgba(26,24,21,0.07), 0 1px 4px rgba(26,24,21,0.04)",
            overflow: "hidden",
            animation: "questionCardEnter 240ms ease-out both",
          }}
        >
          {/* Instruction */}
          <p
            className="text-xs font-jp leading-relaxed mb-3"
            style={{
              color: "var(--dossier-muted)",
              borderLeft: "2px solid var(--dossier-line)",
              paddingLeft: "0.625rem",
            }}
          >
            深く考えすぎず、普段の仕事中の自分に近い方を選んでください。
          </p>

          {/* Q number */}
          <p className="text-[11px] font-mono-doc mb-2" style={{ color: "var(--dossier-gold)" }}>
            Q{currentIndex + 1}
          </p>

          {/* Question text */}
          <div className="mb-3 h-[60px] md:h-auto flex items-center md:items-start">
            <p
              className="font-jp font-medium leading-relaxed"
              style={{ fontSize: promptFontSize, lineHeight: "1.60", color: "#21160D" }}
            >
              {currentQuestion.prompt}
            </p>
          </div>

          {/* Ruled divider */}
          <div className="mb-3" style={{ borderTop: "1px solid var(--dossier-line-soft)" }} />

          {/* A / B comparison cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:items-stretch gap-2 mb-3">
            {/* A card */}
            <div
              className="flex flex-col h-[112px] md:h-auto"
              style={{
                padding: "0.75rem 1rem",
                border: "1px solid " + (selectedSide === "a" ? "rgba(140,122,75,0.55)" : "var(--dossier-line)"),
                borderLeft: selectedSide === "a"
                  ? "4px solid var(--dossier-gold)"
                  : "2px solid rgba(140,122,75,0.55)",
                borderRadius: "6px",
                background: selectedSide === "a" ? "rgba(237,232,223,0.92)" : "rgba(252,251,249,0.78)",
                transition: "background 200ms ease, border-color 200ms ease",
              }}
            >
              <span
                className="font-mono-doc block mb-2"
                style={{ fontSize: "11px", letterSpacing: "0.22em", color: "var(--dossier-gold)" }}
              >
                A
              </span>
              <p
                className="font-jp leading-[1.60] flex-1"
                style={{ fontSize: optAClamp, color: "#21160D" }}
              >
                {currentQuestion.optionA}
              </p>
            </div>

            {/* B card */}
            <div
              className="flex flex-col h-[112px] md:h-auto"
              style={{
                padding: "0.75rem 1rem",
                border: "1px solid " + (selectedSide === "b" ? "rgba(140,122,75,0.55)" : "var(--dossier-line)"),
                borderLeft: selectedSide === "b"
                  ? "4px solid var(--dossier-gold)"
                  : "2px solid rgba(140,122,75,0.55)",
                borderRadius: "6px",
                background: selectedSide === "b" ? "rgba(237,232,223,0.92)" : "rgba(252,251,249,0.78)",
                transition: "background 200ms ease, border-color 200ms ease",
              }}
            >
              <span
                className="font-mono-doc block mb-2"
                style={{ fontSize: "11px", letterSpacing: "0.22em", color: "var(--dossier-muted)" }}
              >
                B
              </span>
              <p
                className="font-jp leading-[1.60] flex-1"
                style={{ fontSize: optBClamp, color: "#21160D" }}
              >
                {currentQuestion.optionB}
              </p>
            </div>
          </div>

          {/* ── Measurement bar (indicator only — buttons are in sticky footer) ── */}
          <div>
            <div className="flex justify-between mb-2 px-0.5">
              <span className="text-xs font-mono-doc" style={{ color: "rgba(65,55,40,0.62)", letterSpacing: "0.12em" }}>A側</span>
              <span className="text-xs font-mono-doc" style={{ color: "rgba(65,55,40,0.62)", letterSpacing: "0.12em" }}>B側</span>
            </div>
            <div className="relative h-[3px]" style={{ background: "rgba(190,174,137,0.72)", borderRadius: "2px" }}>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: "6px",
                  height: "6px",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(140,122,75,0.38)",
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                }}
              />
              {indicator && (
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: indicator.left,
                    width: indicator.width,
                    background: "var(--dossier-gold)",
                    transition: "left 260ms ease, width 260ms ease",
                    borderRadius: "2px",
                  }}
                />
              )}
            </div>
          </div>

          {/* ── 4-choice buttons — inside card, flush with card edges */}
          <div
            className="grid grid-cols-4 mt-4"
            style={{ marginLeft: "-1rem", marginRight: "-1rem" }}
          >
            {CHOICES.map((choice, idx) => {
              const isSelected = currentAnswer === choice.id;
              return (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice.id)}
                  className="flex items-center justify-center font-semibold font-jp active:scale-[0.99]"
                  style={{
                    height: "56px",
                    fontSize: "clamp(0.8125rem, 1.6vw, 0.9375rem)",
                    background: isSelected ? "rgba(140,122,75,0.10)" : "transparent",
                    color: isSelected ? "#21160D" : "var(--dossier-sub)",
                    borderLeft: idx > 0 ? "1px solid rgba(216,205,189,0.65)" : "none",
                    borderTop: "1px solid var(--dossier-line-soft)",
                    borderBottom: isSelected
                      ? "3px solid var(--dossier-gold)"
                      : "3px solid transparent",
                    transition: "background 160ms ease, color 160ms ease",
                  }}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/diagnoses/business-skills/ornaments/corner-ornament.png"
          alt=""
          aria-hidden="true"
          className="hidden md:block pointer-events-none select-none absolute bottom-8 right-8 w-[180px] opacity-40"
          style={{ transform: "rotate(180deg)" }}
        />
      }

    </div>
  );
}
