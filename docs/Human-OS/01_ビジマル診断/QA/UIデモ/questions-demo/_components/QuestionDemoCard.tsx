"use client";

import { useState } from "react";
import Link from "next/link";

// ──────────────────────────────────────────────────────────────
// Types & constants
// ──────────────────────────────────────────────────────────────

type Choice = "strongly_a" | "lean_a" | "lean_b" | "strongly_b";

const CHOICES: Array<{ id: Choice; label: string; squareSize: number }> = [
  { id: "strongly_a", label: "強くA", squareSize: 17 }, // ≈ 24px diamond
  { id: "lean_a",     label: "ややA", squareSize: 14 }, // ≈ 20px diamond
  { id: "lean_b",     label: "ややB", squareSize: 14 },
  { id: "strongly_b", label: "強くB", squareSize: 17 },
];

// Fixed demo content
const Q = {
  instruction: "深く考えすぎず、普段の仕事中の自分に近い方を選んでください。",
  prompt:      "初めての仕事で、まだ全体像が見えない時",
  promptBreak: ["初めての仕事で、", "まだ全体像が見えない時"],
  optionA:     "目的や条件を整理し、進め方を考えてから動く",
  optionB:     "まず少し動き、わかったことをもとに進め方を考える",
  guide:       "近いものを1つ選んでください",
};

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

interface Props {
  layout: "pc" | "mobile";
}

export function QuestionDemoCard({ layout }: Props) {
  const [selected, setSelected] = useState<Choice | null>(null);
  const isMobile = layout === "mobile";

  const selectedSide: "a" | "b" | null =
    selected === "strongly_a" || selected === "lean_a" ? "a" :
    selected === "lean_b"     || selected === "strongly_b" ? "b" :
    null;

  // Sizing tokens that differ between PC and Mobile
  const maxW    = isMobile ? "max-w-lg"  : "max-w-3xl";
  const px      = isMobile ? "px-4"      : "px-5";
  const pb      = isMobile ? "pb-2"      : "pb-6 md:pb-10";
  const cardPad = isMobile ? "12px 12px" : "1.25rem 1.25rem";
  const optSize = isMobile ? "14px"      : "1.0625rem";
  const btnH    = isMobile ? "60px"      : "64px";
  const btnGap  = isMobile ? "gap-2"     : "gap-3";
  const answerMt = isMobile ? "mt-4"    : "mt-6";

  return (
    <div className="dossier-page min-h-screen">

      {/* ── Stage header ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden h-[190px] md:h-[320px]"
        style={{ backgroundColor: "var(--dossier-dark)" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url(/images/diagnoses/business-skills/hero-question-temp.png)",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            animation: "stagePan 10s ease-in-out infinite",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(245,243,239,0.05) 0%, rgba(245,243,239,0.28) 58%, var(--dossier-bg) 100%)",
          }}
        />

        {/* Nav + progress — max-width matches content area */}
        <div
          className={`relative z-10 ${maxW} mx-auto ${px} pt-8`}
          style={{ background: "rgba(252,251,249,0.10)" }}
        >
          <Link
            href="/diagnoses/business-skills"
            className="text-sm font-jp transition-opacity hover:opacity-70 inline-block mb-7"
            style={{ color: "rgba(245,243,239,0.92)" }}
          >
            ← 説明へ戻る
          </Link>

          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="font-mono-doc" style={{ color: "rgba(245,243,239,0.96)" }}>
                Q.01 / 40
              </span>
              <span className="font-mono-doc" style={{ color: "rgba(245,243,239,0.72)" }}>
                0%
              </span>
            </div>
            <div className="h-px relative" style={{ background: "rgba(245,243,239,0.35)" }}>
              <div
                className="absolute inset-y-0 left-0"
                style={{ width: "0%", background: "var(--dossier-gold)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card + answer area ───────────────────────────────────── */}
      <div
        className={`relative z-30 ${maxW} mx-auto ${px} ${pb}`}
        style={{ marginTop: "-4rem" }}
      >

        {/* ── Question card ───────────────────────────────────────── */}
        <div
          style={{
            background: "var(--dossier-surface)",
            border: "1px solid var(--dossier-line)",
            borderRadius: "12px",
            padding: cardPad,
            boxShadow:
              "0 2px 20px rgba(26,24,21,0.07), 0 1px 4px rgba(26,24,21,0.04)",
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
            {Q.instruction}
          </p>

          {/* Q number */}
          <p
            className="font-mono-doc mb-2"
            style={{ fontSize: "11px", color: "var(--dossier-gold)", letterSpacing: "0.18em" }}
          >
            Q1
          </p>

          {/* Prompt */}
          <div className="mb-3">
            <p
              className="font-jp font-medium"
              style={{
                fontSize: isMobile ? "22px" : "1.0625rem",
                lineHeight: "1.60",
                color: "#21160D",
              }}
            >
              {isMobile ? (
                <>
                  {Q.promptBreak[0]}
                  <br />
                  {Q.promptBreak[1]}
                </>
              ) : (
                Q.prompt
              )}
            </p>
          </div>

          {/* Ruled divider */}
          <div className="mb-3" style={{ borderTop: "1px solid var(--dossier-line-soft)" }} />

          {/* ── A/B: Mobile = 1-col with ornament; PC = 2-col grid ─ */}
          {isMobile ? (
            <>
              {/* Mobile A section */}
              <div
                className="mb-1"
                style={{
                  borderLeft: selectedSide === "a"
                    ? "3px solid var(--dossier-gold)"
                    : "3px solid transparent",
                  paddingLeft: selectedSide === "a" ? "8px" : "0px",
                  transition: "border-color 160ms ease, padding-left 160ms ease",
                }}
              >
                <span
                  className="font-mono-doc block mb-1.5"
                  style={{ fontSize: "11px", letterSpacing: "0.22em", color: "var(--dossier-gold)" }}
                >
                  A
                </span>
                <p
                  className="font-jp"
                  style={{ fontSize: optSize, lineHeight: 1.6, color: "#21160D" }}
                >
                  {Q.optionA}
                </p>
              </div>

              {/* A/B ornament separator */}
              <div className="flex items-center" style={{ margin: "12px 0" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--dossier-line-soft)" }} />
                <div
                  aria-hidden="true"
                  style={{
                    width: "6px",
                    height: "6px",
                    background: "rgba(140,122,75,0.32)",
                    transform: "rotate(45deg)",
                    margin: "0 8px",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, height: "1px", background: "var(--dossier-line-soft)" }} />
              </div>

              {/* Mobile B section */}
              <div
                style={{
                  borderLeft: selectedSide === "b"
                    ? "3px solid var(--dossier-gold)"
                    : "3px solid transparent",
                  paddingLeft: selectedSide === "b" ? "8px" : "0px",
                  transition: "border-color 160ms ease, padding-left 160ms ease",
                }}
              >
                <span
                  className="font-mono-doc block mb-1.5"
                  style={{ fontSize: "11px", letterSpacing: "0.22em", color: "var(--dossier-muted)" }}
                >
                  B
                </span>
                <p
                  className="font-jp"
                  style={{ fontSize: optSize, lineHeight: 1.6, color: "#21160D" }}
                >
                  {Q.optionB}
                </p>
              </div>
            </>
          ) : (
            /* PC A/B — 2-column grid (matches production) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* A card */}
              <div
                className="flex flex-col"
                style={{
                  padding: "0.75rem 1rem",
                  border:
                    "1px solid " +
                    (selectedSide === "a"
                      ? "rgba(140,122,75,0.55)"
                      : "var(--dossier-line)"),
                  borderLeft:
                    selectedSide === "a"
                      ? "4px solid var(--dossier-gold)"
                      : "2px solid rgba(140,122,75,0.55)",
                  borderRadius: "6px",
                  background:
                    selectedSide === "a"
                      ? "rgba(237,232,223,0.92)"
                      : "rgba(252,251,249,0.78)",
                  minHeight: "100px",
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
                  className="font-jp leading-relaxed flex-1"
                  style={{ fontSize: optSize, color: "#21160D" }}
                >
                  {Q.optionA}
                </p>
              </div>

              {/* B card */}
              <div
                className="flex flex-col"
                style={{
                  padding: "0.75rem 1rem",
                  border:
                    "1px solid " +
                    (selectedSide === "b"
                      ? "rgba(140,122,75,0.55)"
                      : "var(--dossier-line)"),
                  borderLeft:
                    selectedSide === "b"
                      ? "4px solid var(--dossier-gold)"
                      : "2px solid rgba(140,122,75,0.55)",
                  borderRadius: "6px",
                  background:
                    selectedSide === "b"
                      ? "rgba(237,232,223,0.92)"
                      : "rgba(252,251,249,0.78)",
                  minHeight: "100px",
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
                  className="font-jp leading-relaxed flex-1"
                  style={{ fontSize: optSize, color: "#21160D" }}
                >
                  {Q.optionB}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Answer area (outside card, shared) ──────────────────── */}
        <div className={answerMt}>
          {/* Guide text */}
          <p
            className="text-center font-jp mb-3"
            style={{ fontSize: "13px", color: "var(--dossier-muted)" }}
          >
            {Q.guide}
          </p>

          {/* 4 answer buttons */}
          <div className={`grid grid-cols-4 ${btnGap}`}>
            {CHOICES.map((choice) => {
              const isSel = selected === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => setSelected(choice.id)}
                  aria-label={choice.label}
                  aria-pressed={isSel}
                  className="touch-manipulation flex flex-col items-center justify-center"
                  style={{
                    height: btnH,
                    width: "100%",
                    gap: "7px",
                    cursor: "pointer",
                    borderRadius: "6px",
                    border: isSel
                      ? "1px solid rgba(100,85,55,0.75)"
                      : "1px solid rgba(140,122,75,0.30)",
                    background: isSel
                      ? "rgba(100,85,55,0.82)"
                      : "rgba(244,240,231,0.55)",
                    transition: "background 130ms ease, border-color 130ms ease",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {/* Label */}
                  <span
                    className="font-jp select-none"
                    style={{
                      fontSize: "13px",
                      lineHeight: 1.2,
                      color: isSel ? "rgba(252,250,245,0.95)" : "var(--dossier-sub)",
                      fontWeight: isSel ? 500 : 400,
                      transition: "color 130ms ease",
                    }}
                  >
                    {choice.label}
                  </span>

                  {/* Diamond (rotated square) */}
                  <span
                    aria-hidden="true"
                    style={{
                      display: "block",
                      width: `${choice.squareSize}px`,
                      height: `${choice.squareSize}px`,
                      transform: "rotate(45deg)",
                      background: isSel ? "rgba(252,250,245,0.85)" : "transparent",
                      border: isSel
                        ? "none"
                        : "1.5px solid rgba(140,122,75,0.50)",
                      transition: "background 130ms ease, border-color 130ms ease",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
