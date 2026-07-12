"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { StyleAxisQuestion, Scoring, Meta, DiagnosisType, AbilityScoringEntry } from "@/schemas/diagnosis";
import { dispatch } from "@/engine/dispatcher";
import { calculateAbilityUScores, buildAvParam } from "@/engine/ability-scorer";
import styles from "./style-axis-question-flow.module.css";

type Choice = "strongly_a" | "lean_a" | "lean_b" | "strongly_b";

const CHOICES: Array<{ id: Choice; label: string; bg: string; diamondBorder: string }> = [
  { id: "strongly_a", label: "強くA", bg: "#CBD2C5", diamondBorder: "#65705F" },
  { id: "lean_a",     label: "ややA", bg: "#E1E5DD", diamondBorder: "#65705F" },
  { id: "lean_b",     label: "ややB", bg: "#E9E1DA", diamondBorder: "#7B6658" },
  { id: "strongly_b", label: "強くB", bg: "#D8CBC0", diamondBorder: "#7B6658" },
];

const HOLD_MS = 180;
const FADE_MS = 80;

interface Props {
  diagnosisId: string;
  meta: Meta;
  questions: StyleAxisQuestion[];
  scoring: Scoring;
  types: DiagnosisType[];
  abilityContributions?: AbilityScoringEntry[];
}

export function StyleAxisQuestionFlow({ diagnosisId, questions, scoring, types, abilityContributions = [] }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions]
  );

  const currentQuestion = sortedQuestions[currentIndex];
  const totalQuestions = sortedQuestions.length;

  const currentAnswer = (answers[currentQuestion?.id] ?? null) as Choice | null;
  const hasSelection = currentAnswer !== null;

  const qNumStr = String(currentIndex + 1).padStart(2, "0");
  const progressPct = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  function handleChoice(choiceId: Choice) {
    if (isFinalizing || fading) return;

    const newAnswers = { ...answers, [currentQuestion.id]: choiceId };
    setAnswers(newAnswers);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFading(true);
      timerRef.current = setTimeout(() => {
        setFading(false);
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

          const prefersReduced =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

          const delay = prefersReduced ? 200 : 1400;
          setTimeout(() => router.push(url), delay);
        }
      }, FADE_MS);
    }, HOLD_MS);
  }

  function handleBack() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setFading(false);
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  // ── 鑑定中 loading screen ─────────────────────────────────
  if (isFinalizing) {
    return (
      <div
        className="dossier-page flex flex-col items-center justify-center min-h-screen gap-10"
        style={{ color: "#21160D" }}
      >
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

  return (
    <div className={styles.page}>
      <div className={styles.bgLayer} aria-hidden="true" />
      <div className={styles.bgOverlay} aria-hidden="true" />

      <div className={styles.container}>
        {/* Back navigation: link to LP on Q1, button on Q2+ */}
        {currentIndex > 0 ? (
          <button type="button" onClick={handleBack} className={styles.backBtn}>
            ← 前の質問
          </button>
        ) : (
          <Link href={`/diagnoses/${diagnosisId}`} className={styles.backBtn}>
            ← 説明へ戻る
          </Link>
        )}

        {/* Progress */}
        <div className={styles.progressWrap}>
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>Q.{qNumStr} / {totalQuestions}</span>
            <span className={styles.progressLabel}>{progressPct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className={styles.contentSheet}>
          {/* Fading zone: question text + divider + A/B blocks */}
          <div className={[styles.qContent, fading ? styles.qFading : ""].join(" ")}>
            <p className={styles.questionText}>{currentQuestion.prompt}</p>

            {/* Divider ornament */}
            <div className={styles.dividerWrap} aria-hidden="true">
              <span className={styles.dividerLine} />
              <Image
                src="/images/diagnoses/business-skills/ornaments/divider-ornament.png"
                alt=""
                width={2400}
                height={240}
                className={styles.dividerImg}
                aria-hidden={true}
              />
              <span className={styles.dividerLine} />
            </div>

            {/* A/B section */}
            <div className={styles.abSection}>
              {/* A block: rail on left (mobile + PC) */}
              <div className={styles.abBlockA}>
                <div className={styles.railA} />
                <div className={styles.abContentA}>
                  <span className={styles.aLabel}>A</span>
                  <p className={styles.abText}>{currentQuestion.optionA}</p>
                </div>
              </div>

              {/*
               * B block: rail on left (mobile) / rail on right (PC).
               * DOM order stays the same; CSS grid-column placement
               * handles the visual reordering on PC.
               */}
              <div className={styles.abBlockB}>
                <div className={styles.railB} />
                <div className={styles.abContentB}>
                  <span className={styles.bLabel}>B</span>
                  <p className={styles.abText}>{currentQuestion.optionB}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Answer section — non-fading */}
          <div className={styles.answerSection}>
            <div
              className={[
                styles.answerRow,
                hasSelection ? styles.hasSelection : "",
              ].join(" ")}
            >
              {CHOICES.map(choice => {
                const isSelected = currentAnswer === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleChoice(choice.id)}
                    aria-pressed={isSelected}
                    aria-label={choice.label}
                    disabled={fading || isFinalizing}
                    className={[
                      styles.answerBtn,
                      isSelected ? styles.answerBtnSelected : "",
                    ].join(" ")}
                    style={{
                      "--btn-bg":         choice.bg,
                      "--diamond-border": choice.diamondBorder,
                    } as React.CSSProperties}
                  >
                    <span className={styles.diamond} aria-hidden="true" />
                    <span className={styles.btnLabel}>{choice.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
