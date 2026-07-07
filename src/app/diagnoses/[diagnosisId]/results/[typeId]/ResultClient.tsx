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
  { key: "thinking_action"      as const, leftLabel: "思考型",   rightLabel: "行動型"   },
  { key: "offensive_stable"     as const, leftLabel: "攻め型",   rightLabel: "安定型"   },
  { key: "solo_team"            as const, leftLabel: "個人突破", rightLabel: "組織推進" },
  { key: "divergent_convergent" as const, leftLabel: "発散型",   rightLabel: "収束型"   },
];

const STYLE_AXES_DEF = [
  { key: "thinkingAction"      as const, leftLabel: "思考型",   rightLabel: "行動型"   },
  { key: "offensiveStable"     as const, leftLabel: "攻め型",   rightLabel: "安定型"   },
  { key: "soloTeam"            as const, leftLabel: "個人突破", rightLabel: "組織推進" },
  { key: "divergentConvergent" as const, leftLabel: "発散型",   rightLabel: "収束型"   },
];

// ── Shared style bar row ──────────────────────────────────────────────────────

function StyleBar({
  leftLabel,
  rightLabel,
  markerLeft,
  valueText,
}: {
  leftLabel: string;
  rightLabel: string;
  markerLeft: number;
  valueText?: string;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr_80px] md:grid-cols-[120px_1fr_120px] items-center gap-3 md:gap-6 min-h-[74px] md:min-h-[82px]">
      <span
        className="text-sm md:text-base font-jp font-semibold text-right"
        style={{ color: markerLeft < 50 ? "#21160D" : "rgba(33,22,13,0.28)" }}
      >
        {leftLabel}
      </span>

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

      <span
        className="text-sm md:text-base font-jp font-semibold"
        style={{ color: markerLeft >= 50 ? "#21160D" : "rgba(33,22,13,0.28)" }}
      >
        {rightLabel}
      </span>
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
            className="font-heading text-[2.4rem] md:text-[4rem] leading-[1.1] tracking-[0.04em] mb-3"
            style={{ color: "#17100A" }}
          >
            スタイル傾向
          </h2>

          {resolvedStyle && (
            <p
              className="font-mono-doc text-center style-code-text"
              style={{ color: "#8A713C" }}
            >
              {resolvedStyle.code}
            </p>
          )}

          <p
            className="font-mono-doc text-[11px] tracking-[0.24em] mb-7"
            style={{ color: "rgba(111,85,44,0.72)" }}
          >
            {hasIndividualStyle ? "あなたのスタイル傾向" : "このタイプの代表的な傾向"}
          </p>

          <div
            className="px-5 py-5 md:px-8 md:py-6"
            style={{
              background: "rgba(248,243,230,0.55)",
              border: "1px solid rgba(111,85,44,0.22)",
            }}
          >
            <div className="divide-y" style={{ borderColor: "rgba(111,85,44,0.14)" }}>
              {hasIndividualStyle && styleScores
                ? STYLE_AXES_SLIDER.map(({ key, leftLabel, rightLabel }) => {
                    const score = styleScores[key];
                    const leftwardPct  = Math.round((1 + score) / 2 * 100);
                    const rightwardPct = 100 - leftwardPct;
                    return (
                      <StyleBar
                        key={key}
                        leftLabel={leftLabel}
                        rightLabel={rightLabel}
                        markerLeft={rightwardPct}
                        valueText={`${leftwardPct} / ${rightwardPct}`}
                      />
                    );
                  })
                : styleAxesFallback
                ? STYLE_AXES_DEF.map(({ key, leftLabel, rightLabel }) => {
                    const value = styleAxesFallback[key];
                    const markerLeft = Math.round((value - 0.5) / 4 * 100);
                    return (
                      <StyleBar
                        key={key}
                        leftLabel={leftLabel}
                        rightLabel={rightLabel}
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
