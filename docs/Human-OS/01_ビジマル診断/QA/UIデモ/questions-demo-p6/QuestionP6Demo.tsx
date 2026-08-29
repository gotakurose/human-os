"use client";

import { useState, useRef } from "react";
import styles from "./question-p6-demo.module.css";

type Choice = "strongly_a" | "lean_a" | "lean_b" | "strongly_b";

const CHOICES: Array<{
  id: Choice;
  label: string;
  bg: string;
  color: string;
  diamondBorder: string;
}> = [
  { id: "strongly_a", label: "強くA", bg: "#5E7466", color: "#FFFDF8", diamondBorder: "#F3F5F0" },
  { id: "lean_a",     label: "ややA", bg: "#E4E8E2", color: "#31453A", diamondBorder: "#557064" },
  { id: "lean_b",     label: "ややB", bg: "#ECE2DD", color: "#5E4035", diamondBorder: "#8A6757" },
  { id: "strongly_b", label: "強くB", bg: "#7A5C4C", color: "#FFFDF8", diamondBorder: "#F4EEE9" },
];

const QUESTIONS = [
  {
    num: 1,
    prompt: "初めての仕事で、まだ全体が見えていない時",
    optionA: "先にやることを整理してから始める",
    optionB: "できるところから始めて考える",
  },
  {
    num: 14,
    prompt: "今のやり方で問題なく進んでいるが、もっと良くなりそうな案が出た時",
    optionA: "今のやり方を残し、良い部分だけ試す",
    optionB: "一時的に慣れなくても、新しいやり方に替える",
  },
  {
    num: 24,
    prompt: "社員旅行の計画で、あと一か所だけ観光地を決める時、魅力的な候補が複数出たら",
    optionA: "今のルートに合う候補を一つに絞る",
    optionB: "魅力的な候補を複数入れられるよう、ルートを組み直す",
  },
] as const;

const TOTAL = 40;
const HOLD_MS = 180;
const FADE_MS = 80;

export interface Props {
  initialIndex: number;
}

export function QuestionP6Demo({ initialIndex }: Props) {
  const [qIndex, setQIndex]   = useState(initialIndex);
  const [answers, setAnswers] = useState<Partial<Record<number, Choice>>>({});
  const [fading, setFading]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q             = QUESTIONS[qIndex];
  const currentAnswer = answers[qIndex] ?? null;
  const hasSelection  = currentAnswer !== null;
  const qNumStr       = String(q.num).padStart(2, "0");
  const progressPct   = Math.round((q.num / TOTAL) * 100);

  function handleChoice(choice: Choice) {
    if (fading) return;
    setAnswers(prev => ({ ...prev, [qIndex]: choice }));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFading(true);
      timerRef.current = setTimeout(() => {
        setQIndex(prev => (prev + 1) % QUESTIONS.length);
        setFading(false);
      }, FADE_MS);
    }, HOLD_MS);
  }

  function handleBack() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setFading(false);
    setQIndex(prev => (prev - 1 + QUESTIONS.length) % QUESTIONS.length);
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgLayer} aria-hidden="true" />
      <div className={styles.bgOverlay} aria-hidden="true" />

      <div className={styles.container}>
        <button type="button" onClick={handleBack} className={styles.backBtn}>
          ← 前の質問
        </button>

        <div className={styles.progressWrap}>
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>Q.{qNumStr} / {TOTAL}</span>
            <span className={styles.progressLabel}>{progressPct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className={styles.contentSheet}>
          {/* Fading zone: question text + A/B blocks only */}
          <div className={[styles.qContent, fading ? styles.qFading : ""].join(" ")}>
            <p className={styles.questionText}>{q.prompt}</p>

            <div className={styles.abSection}>
              {/* A block — left rail, left-aligned */}
              <div className={styles.abBlockA}>
                <span className={styles.aLabel}>A</span>
                <p className={styles.abText}>{q.optionA}</p>
              </div>

              {/* B block — right rail, shifted right */}
              <div className={styles.abBlockB}>
                <span className={styles.bLabel}>B</span>
                <p className={styles.abText}>{q.optionB}</p>
              </div>
            </div>
          </div>

          {/* Answer section — non-fading, no divider, no guide text */}
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
                    disabled={fading}
                    className={[
                      styles.answerBtn,
                      isSelected ? styles.answerBtnSelected : "",
                    ].join(" ")}
                    style={{
                      "--btn-bg":        choice.bg,
                      "--btn-color":     choice.color,
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
