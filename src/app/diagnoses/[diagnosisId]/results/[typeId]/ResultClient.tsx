"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { resolveBusinessStyle, parseStyleAxisParams } from "./resolve-business-style";

interface StyleAxesFallback {
  thinkingAction: number;
  offensiveStable: number;
  soloTeam: number;
  divergentConvergent: number;
}

interface Props {
  styleAxesFallback?: StyleAxesFallback;
}

const STYLE_AXES_SLIDER = [
  { key: "thinking_action"      as const, leftLabel: "思考型",   rightLabel: "行動型",   leftEnglish: "Think",      rightEnglish: "Act"       },
  { key: "offensive_stable"     as const, leftLabel: "攻め型",   rightLabel: "安定型",   leftEnglish: "Offense",    rightEnglish: "Stability" },
  { key: "solo_team"            as const, leftLabel: "個人突破", rightLabel: "組織推進", leftEnglish: "Individual", rightEnglish: "Group"     },
  { key: "divergent_convergent" as const, leftLabel: "発散型",   rightLabel: "収束型",   leftEnglish: "Expand",     rightEnglish: "Focus"     },
];

const STYLE_AXES_DEF = [
  { key: "thinkingAction"      as const, leftLabel: "思考型",   rightLabel: "行動型",   leftEnglish: "Think",      rightEnglish: "Act"       },
  { key: "offensiveStable"     as const, leftLabel: "攻め型",   rightLabel: "安定型",   leftEnglish: "Offense",    rightEnglish: "Stability" },
  { key: "soloTeam"            as const, leftLabel: "個人突破", rightLabel: "組織推進", leftEnglish: "Individual", rightEnglish: "Group"     },
  { key: "divergentConvergent" as const, leftLabel: "発散型",   rightLabel: "収束型",   leftEnglish: "Expand",     rightEnglish: "Focus"     },
];

// ── Shared style bar row ──────────────────────────────────────────────────────

function StyleBar({
  leftLabel,
  rightLabel,
  leftEnglish,
  rightEnglish,
  markerLeft,
  valueText,
}: {
  leftLabel: string;
  rightLabel: string;
  leftEnglish: string;
  rightEnglish: string;
  markerLeft: number;
  valueText?: string;
}) {
  const leftActive  = markerLeft <= 50;
  const rightActive = markerLeft >= 50;
  const leftEngColor  = leftActive  ? "#6B4E20" : "rgba(95,72,40,0.55)";
  const rightEngColor = rightActive ? "#6B4E20" : "rgba(95,72,40,0.55)";
  const leftJpColor   = leftActive  ? "rgba(33,22,13,0.82)" : "rgba(33,22,13,0.48)";
  const rightJpColor  = rightActive ? "rgba(33,22,13,0.82)" : "rgba(33,22,13,0.48)";

  return (
    <div className="grid grid-cols-[88px_1fr_88px] md:grid-cols-[130px_1fr_130px] items-center gap-2 md:gap-5 min-h-[72px] md:min-h-[80px]">
      <div className="text-right">
        <span
          className="font-serif-en block leading-[1.1]"
          style={{ fontSize: "clamp(14px,1.7vw,17px)", fontWeight: 600, letterSpacing: "0.08em", color: leftEngColor }}
        >
          {leftEnglish}
        </span>
        <span
          className="font-jp block"
          style={{ fontSize: "clamp(12px,1.4vw,14px)", fontWeight: 500, color: leftJpColor, marginTop: "3px" }}
        >
          {leftLabel}
        </span>
      </div>

      <div>
        <div
          className="relative h-[6px] rounded-[999px]"
          style={{ background: "rgba(216,205,189,0.9)" }}
        >
          {[25, 50, 75].map((pct) => (
            <div
              key={pct}
              className="absolute"
              style={{
                left: `${pct}%`,
                top: "-3px",
                width: "1px",
                height: "12px",
                background: "rgba(111,85,44,0.30)",
                transform: "translateX(-50%)",
              }}
            />
          ))}
          <div
            className="absolute w-3.5 h-3.5"
            style={{
              left: `${markerLeft}%`,
              top: "50%",
              transform: "translate(-50%, -50%) rotate(45deg)",
              background: "#8A713C",
            }}
          />
        </div>
        {valueText && (
          <p
            className="text-center mt-2 font-mono-doc"
            style={{ fontSize: "0.6875rem", color: "rgba(33,22,13,0.50)" }}
          >
            {valueText}
          </p>
        )}
      </div>

      <div>
        <span
          className="font-serif-en block leading-[1.1]"
          style={{ fontSize: "clamp(14px,1.7vw,17px)", fontWeight: 600, letterSpacing: "0.08em", color: rightEngColor }}
        >
          {rightEnglish}
        </span>
        <span
          className="font-jp block"
          style={{ fontSize: "clamp(12px,1.4vw,14px)", fontWeight: 500, color: rightJpColor, marginTop: "3px" }}
        >
          {rightLabel}
        </span>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ResultClient({ styleAxesFallback }: Props) {
  const searchParams = useSearchParams();

  const styleScores = useMemo(
    () => parseStyleAxisParams(searchParams),
    [searchParams],
  );
  const hasIndividualStyle = styleScores !== null;

  const resolvedStyle = useMemo(
    () => (styleAxesFallback ? resolveBusinessStyle(styleScores, styleAxesFallback) : null),
    [styleScores, styleAxesFallback],
  );

  return (
    <div>

      {/* ── スタイル傾向 ────────────────────────────────────────────────── */}
      {(hasIndividualStyle || styleAxesFallback) && (
        <div>
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A" }}
          >
            ビジネススタイル
          </h2>

          {resolvedStyle && (
            <p
              className="font-serif-en text-center style-code-text"
              style={{ color: "#8A713C", fontWeight: 550 }}
            >
              {resolvedStyle.code}
            </p>
          )}

          <div
            className="px-5 py-5 md:px-8 md:py-6"
            style={{
              background: "rgba(248,243,230,0.55)",
              border: "1px solid rgba(111,85,44,0.22)",
            }}
          >
            <div className="divide-y" style={{ borderColor: "rgba(111,85,44,0.14)" }}>
              {hasIndividualStyle && styleScores
                ? STYLE_AXES_SLIDER.map(({ key, leftLabel, rightLabel, leftEnglish, rightEnglish }) => {
                    const score = styleScores[key];
                    const leftwardPct  = Math.round((1 + score) / 2 * 100);
                    const rightwardPct = 100 - leftwardPct;
                    return (
                      <StyleBar
                        key={key}
                        leftLabel={leftLabel}
                        rightLabel={rightLabel}
                        leftEnglish={leftEnglish}
                        rightEnglish={rightEnglish}
                        markerLeft={rightwardPct}
                        valueText={`${leftwardPct} / ${rightwardPct}`}
                      />
                    );
                  })
                : styleAxesFallback
                ? STYLE_AXES_DEF.map(({ key, leftLabel, rightLabel, leftEnglish, rightEnglish }) => {
                    const value = styleAxesFallback[key];
                    const markerLeft = Math.round((value - 0.5) / 4 * 100);
                    return (
                      <StyleBar
                        key={key}
                        leftLabel={leftLabel}
                        rightLabel={rightLabel}
                        leftEnglish={leftEnglish}
                        rightEnglish={rightEnglish}
                        markerLeft={markerLeft}
                      />
                    );
                  })
                : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
