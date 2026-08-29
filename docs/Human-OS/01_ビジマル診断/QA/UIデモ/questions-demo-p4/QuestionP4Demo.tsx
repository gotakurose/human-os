"use client";

import { useState, useRef } from "react";
import styles from "./question-p4-demo.module.css";

type Choice = "strongly_a" | "lean_a" | "lean_b" | "strongly_b";

const CHOICES: Array<{
  id: Choice;
  label: string;
  clrRgb: string;
  clrAlpha: string;
  diaSize: string;
}> = [
  { id: "strongly_a", label: "強くA", clrRgb: "92, 116, 96",  clrAlpha: "1",    diaSize: "17px" },
  { id: "lean_a",     label: "ややA", clrRgb: "92, 116, 96",  clrAlpha: "0.65", diaSize: "15px" },
  { id: "lean_b",     label: "ややB", clrRgb: "122, 82, 80",  clrAlpha: "0.65", diaSize: "15px" },
  { id: "strongly_b", label: "強くB", clrRgb: "122, 82, 80",  clrAlpha: "1",    diaSize: "17px" },
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

export function QuestionP4Demo({ initialIndex }: Props) {
  const [qIndex, setQIndex]   = useState(initialIndex);
  const [answers, setAnswers] = useState<Partial<Record<number, Choice>>>({});
  const [fading, setFading]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q             = QUESTIONS[qIndex];
  const currentAnswer = answers[qIndex] ?? null;
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

        <div className={styles.contentCard}>
          {/* Fading zone: question text + A/B blocks */}
          <div
            className={[
              styles.questionContent,
              fading ? styles.questionContentFading : "",
            ].join(" ")}
          >
            <p className={styles.questionText}>{q.prompt}</p>

            <div className={styles.abSection}>
              {/* A block — left side, green rail */}
              <div className={styles.abBlockA}>
                <span className={styles.abLabelA}>A</span>
                <p className={styles.abText}>{q.optionA}</p>
              </div>
              {/* B block — shifted right, red-brown rail */}
              <div className={styles.abBlockB}>
                <span className={styles.abLabelB}>B</span>
                <p className={styles.abText}>{q.optionB}</p>
              </div>
            </div>
          </div>

          {/* Non-fading: guide + 4 answer buttons */}
          <div className={styles.answerSection}>
            <p className={styles.answerGuide}>近い位置を1つ選んでください</p>

            <div className={styles.answerRow}>
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
                      "--clr-rgb":   choice.clrRgb,
                      "--clr-alpha": choice.clrAlpha,
                      "--dia-size":  choice.diaSize,
                    } as React.CSSProperties}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        styles.diamond,
                        isSelected ? styles.diamondFilled : "",
                      ].join(" ")}
                    />
                    <span
                      className={[
                        styles.btnLabel,
                        isSelected ? styles.btnLabelSelected : "",
                      ].join(" ")}
                    >
                      {choice.label}
                    </span>
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
