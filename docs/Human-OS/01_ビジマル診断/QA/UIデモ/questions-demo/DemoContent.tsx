"use client";

import { useState } from "react";
import Link from "next/link";

type Choice = "strongly_a" | "lean_a" | "lean_b" | "strongly_b";

const CHOICES: Array<{ id: Choice; label: string; squareSize: number }> = [
  { id: "strongly_a", label: "強くA", squareSize: 17 },
  { id: "lean_a",     label: "ややA", squareSize: 14 },
  { id: "lean_b",     label: "ややB", squareSize: 14 },
  { id: "strongly_b", label: "強くB", squareSize: 17 },
];

export function DemoContent() {
  const [selected, setSelected] = useState<Choice | null>(null);

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

        <div
          className="relative z-10 max-w-3xl mx-auto px-5 pt-8"
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

      {/* ── Question card + answer area ───────────────────────────── */}
      <div
        className="relative z-30 max-w-3xl mx-auto px-5 pb-2 md:pb-6"
        style={{ marginTop: "-4rem" }}
      >
        {/* Question card */}
        <div
          style={{
            background: "var(--dossier-surface)",
            border: "1px solid var(--dossier-line)",
            borderRadius: "12px",
            padding: "12px 16px",
            boxShadow: "0 2px 20px rgba(26,24,21,0.07), 0 1px 4px rgba(26,24,21,0.04)",
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
            直感で近い方を選んでください。
          </p>

          {/* Q number */}
          <p
            className="font-mono-doc mb-2"
            style={{ fontSize: "11px", color: "var(--dossier-gold)", letterSpacing: "0.18em" }}
          >
            Q1
          </p>

          {/* Prompt */}
          <p
            className="font-jp font-medium mb-3"
            style={{ fontSize: "22px", lineHeight: "1.60", color: "#21160D" }}
          >
            初めての仕事で、
            <br />
            まだ全体がよく分からない時
          </p>

          {/* Ruled divider */}
          <div className="mb-3" style={{ borderTop: "1px solid var(--dossier-line-soft)" }} />

          {/* A option */}
          <div className="mb-1">
            <span
              className="font-mono-doc block mb-1.5"
              style={{ fontSize: "11px", letterSpacing: "0.22em", color: "var(--dossier-gold)" }}
            >
              A
            </span>
            <p
              className="font-jp"
              style={{ fontSize: "18px", lineHeight: 1.55, color: "#21160D" }}
            >
              目的や条件を整理してから動く
            </p>
          </div>

          {/* A/B decorative separator */}
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

          {/* B option */}
          <div>
            <span
              className="font-mono-doc block mb-1.5"
              style={{ fontSize: "11px", letterSpacing: "0.22em", color: "var(--dossier-muted)" }}
            >
              B
            </span>
            <p
              className="font-jp"
              style={{ fontSize: "18px", lineHeight: 1.55, color: "#21160D" }}
            >
              まず少し動き、分かったことから考える
            </p>
          </div>
        </div>

        {/* ── Answer area (outside card) ─────────────────────────── */}
        <div className="mt-4">
          {/* Guide text */}
          <p
            className="text-center font-jp mb-3"
            style={{ fontSize: "13px", color: "var(--dossier-muted)" }}
          >
            近いものを1つ選んでください
          </p>

          {/* Labels + diamond buttons — 4-column grid */}
          <div className="grid grid-cols-4">
            {CHOICES.map((choice) => {
              const isSel = selected === choice.id;
              return (
                <div
                  key={choice.id}
                  className="flex flex-col items-center"
                  style={{ gap: "6px" }}
                >
                  {/* Label */}
                  <span
                    className="font-jp text-center select-none"
                    style={{
                      fontSize: "13px",
                      lineHeight: 1.2,
                      color: isSel ? "var(--dossier-gold)" : "var(--dossier-sub)",
                      fontWeight: isSel ? 600 : 400,
                      transition: "color 130ms ease",
                    }}
                  >
                    {choice.label}
                  </span>

                  {/* 48×48 tap area — diamond (rotated square) inside */}
                  <button
                    type="button"
                    onClick={() => setSelected(choice.id)}
                    aria-label={choice.label}
                    aria-pressed={isSel}
                    className="touch-manipulation"
                    style={{
                      width: "48px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: "block",
                        width: `${choice.squareSize}px`,
                        height: `${choice.squareSize}px`,
                        transform: isSel
                          ? "rotate(45deg) scale(1.18)"
                          : "rotate(45deg) scale(1)",
                        background: isSel
                          ? "var(--dossier-gold)"
                          : "rgba(244,240,231,0.70)",
                        border: `1.5px solid rgba(140,122,75,${isSel ? "0" : "0.55"})`,
                        transition:
                          "transform 130ms ease, background 130ms ease, border-color 130ms ease",
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
