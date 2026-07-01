"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

interface StyleAxesFallback {
  thinkingAction: number;
  offensiveStable: number;
  soloTeam: number;
  divergentConvergent: number;
}

interface StyleScores {
  thinking_action: number;
  offensive_stable: number;
  solo_team: number;
  divergent_convergent: number;
}

interface Props {
  fallbackScores: Record<string, number>;
  typeColor: string;
  styleAxesFallback?: StyleAxesFallback;
}

// ── Radar chart constants ─────────────────────────────────────────────────────

const RADAR_AXES = [
  { id: "logic",      label: "論理力" },
  { id: "execution",  label: "実行力" },
  { id: "sales",      label: "営業力" },
  { id: "creativity", label: "創造力" },
  { id: "management", label: "管理力" },
] as const;

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

const RN  = RADAR_AXES.length;
const RCX = 160;
const RCY = 160;
const RR  = 90;
const LR  = 124;
// Paper-tone measurement diagram grid: warm antique gold at low opacity
const GRID_STROKE = "rgba(140,122,75,0.22)";

function rAngle(i: number): number {
  return (i / RN) * 2 * Math.PI - Math.PI / 2;
}

function rPt(r: number, i: number): [number, number] {
  const a = rAngle(i);
  return [RCX + r * Math.cos(a), RCY + r * Math.sin(a)];
}

function gridPoly(level: number): string {
  return Array.from({ length: RN }, (_, i) => {
    const [x, y] = rPt(RR * level, i);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function buildScorePoly(s: Record<string, number>): string {
  return RADAR_AXES.map(({ id }, i) => {
    const v = Math.min(100, Math.max(0, s[id] ?? 0));
    const [x, y] = rPt((v / 100) * RR, i);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function labelAnchor(i: number): "start" | "middle" | "end" {
  const c = Math.cos(rAngle(i));
  if (c > 0.15)  return "start";
  if (c < -0.15) return "end";
  return "middle";
}

// ── Section wrapper (shared card feel — cream surface, thin ruled border) ────

const sectionStyle = {
  borderTop: "1px solid var(--dossier-line)",
  paddingTop: "1.75rem",
  paddingBottom: "1.75rem",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ResultClient({ fallbackScores, styleAxesFallback }: Props) {
  const searchParams = useSearchParams();

  const { scores, individualScoreMode } = useMemo(() => {
    const parsed: Record<string, number> = {};
    let allValid = true;

    for (const axis of RADAR_AXES) {
      const raw = searchParams.get(axis.id);
      if (raw === null) { allValid = false; break; }
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n)) { allValid = false; break; }
      parsed[axis.id] = Math.min(100, Math.max(0, n));
    }

    if (allValid) return { scores: parsed, individualScoreMode: true };

    const fallback: Record<string, number> = {};
    for (const axis of RADAR_AXES) {
      fallback[axis.id] = fallbackScores[axis.id] ?? 0;
    }
    return { scores: fallback, individualScoreMode: false };
  }, [searchParams, fallbackScores]);

  const { styleScores, hasIndividualStyle } = useMemo((): {
    styleScores: StyleScores | null;
    hasIndividualStyle: boolean;
  } => {
    const ta = searchParams.get("ta");
    const os = searchParams.get("os");
    const st = searchParams.get("st");
    const dc = searchParams.get("dc");

    if (ta === null || os === null || st === null || dc === null) {
      return { styleScores: null, hasIndividualStyle: false };
    }

    const taV = parseInt(ta, 10);
    const osV = parseInt(os, 10);
    const stV = parseInt(st, 10);
    const dcV = parseInt(dc, 10);

    if (!Number.isFinite(taV) || !Number.isFinite(osV) || !Number.isFinite(stV) || !Number.isFinite(dcV)) {
      return { styleScores: null, hasIndividualStyle: false };
    }

    return {
      styleScores: {
        thinking_action: taV / 100,
        offensive_stable: osV / 100,
        solo_team: stV / 100,
        divergent_convergent: dcV / 100,
      },
      hasIndividualStyle: true,
    };
  }, [searchParams]);

  const GRID_LEVELS = [1 / 3, 2 / 3, 1] as const;

  return (
    <div>

      {/* ── 能力値 — paper measurement diagram ──────────────────────────── */}
      <div style={sectionStyle}>
        <p
          className="text-[10px] font-mono-doc tracking-[0.14em] mb-5"
          style={{ color: "var(--dossier-gold)" }}
        >
          {individualScoreMode ? "能力値" : "このタイプの代表的な能力傾向"}
        </p>

        <svg
          viewBox="0 0 320 320"
          className="w-full max-w-xs sm:max-w-[400px] mx-auto block"
          aria-label="能力値レーダーチャート"
        >
          {/* Axis lines */}
          {Array.from({ length: RN }, (_, i) => {
            const [x, y] = rPt(RR, i);
            return (
              <line
                key={i}
                x1={RCX} y1={RCY}
                x2={x.toFixed(1)} y2={y.toFixed(1)}
                stroke={GRID_STROKE}
                strokeWidth="1"
              />
            );
          })}

          {/* Grid pentagons */}
          {GRID_LEVELS.map((lv) => (
            <polygon
              key={lv}
              points={gridPoly(lv)}
              fill="none"
              stroke={GRID_STROKE}
              strokeWidth="1"
            />
          ))}

          {/* Score polygon — very subtle warm fill, clear gold stroke */}
          <polygon
            points={buildScorePoly(scores)}
            fill="rgba(140,122,75,0.08)"
            stroke="#8C7A4B"
            strokeWidth="1.5"
          />

          {/* Dots */}
          {RADAR_AXES.map(({ id }, i) => {
            const v = Math.min(100, Math.max(0, scores[id] ?? 0));
            const [x, y] = rPt((v / 100) * RR, i);
            return (
              <circle
                key={id}
                cx={x.toFixed(1)}
                cy={y.toFixed(1)}
                r="2.5"
                fill="#8C7A4B"
              />
            );
          })}

          {/* Labels and score values */}
          {RADAR_AXES.map(({ id, label }, i) => {
            const [lx, ly] = rPt(LR, i);
            const anchor = labelAnchor(i);
            const score = scores[id] ?? 0;
            return (
              <g key={id}>
                <text
                  x={lx.toFixed(1)}
                  y={ly.toFixed(1)}
                  textAnchor={anchor}
                  fontSize="10"
                  fill="#6B655C"
                >
                  {label}
                </text>
                <text
                  x={lx.toFixed(1)}
                  y={(ly + 14).toFixed(1)}
                  textAnchor={anchor}
                  fontSize="12"
                  fontWeight="500"
                  fill="#1A1815"
                >
                  {score}
                </text>
              </g>
            );
          })}
        </svg>

        {!individualScoreMode && (
          <div
            className="mt-5 px-4 py-3"
            style={{
              border: "1px solid var(--dossier-line)",
              background: "var(--dossier-paper)",
            }}
          >
            <p
              className="font-jp leading-relaxed"
              style={{ fontSize: "0.8125rem", color: "var(--dossier-muted)" }}
            >
              これは診断回答から算出された個人スコアではなく、このタイプの代表的な傾向です。個人スコアを確認するには診断を受けてください。
            </p>
          </div>
        )}
      </div>

      {/* ── スタイル傾向: 個人スコア測定棒 ──────────────────────────────── */}
      {hasIndividualStyle && styleScores && (
        <div style={sectionStyle}>
          <p
            className="text-[10px] font-mono-doc tracking-[0.14em] mb-6"
            style={{ color: "var(--dossier-gold)" }}
          >
            スタイル傾向
          </p>
          <div className="space-y-6">
            {STYLE_AXES_SLIDER.map(({ key, leftLabel, rightLabel }) => {
              const score = styleScores[key];
              const leftPct  = Math.round((1 + score) / 2 * 100);
              const rightPct = 100 - leftPct;
              const dotLeft  = 100 - leftPct;
              const isBalanced = leftPct >= 45 && leftPct <= 55;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1.5">
                    <span
                      className="text-xs font-jp"
                      style={{
                        color: leftPct >= 50
                          ? "var(--dossier-ink)"
                          : "var(--dossier-muted)",
                        fontWeight: leftPct >= 60 ? 500 : 400,
                      }}
                    >
                      {leftLabel}
                    </span>
                    <span
                      className="text-xs font-jp"
                      style={{
                        color: rightPct >= 50
                          ? "var(--dossier-ink)"
                          : "var(--dossier-muted)",
                        fontWeight: rightPct >= 60 ? 500 : 400,
                      }}
                    >
                      {rightLabel}
                    </span>
                  </div>
                  {/* Measurement track */}
                  <div className="relative h-px" style={{ background: "var(--dossier-line)" }}>
                    {/* Tick marks at 25 / 50 / 75% */}
                    {[25, 50, 75].map((pct) => (
                      <div
                        key={pct}
                        className="absolute top-0 w-px"
                        style={{
                          left: `${pct}%`,
                          height: "5px",
                          top: "-2px",
                          background: "var(--dossier-line)",
                        }}
                      />
                    ))}
                    {/* Position marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2"
                      style={{
                        left: `${dotLeft}%`,
                        background: "var(--dossier-gold)",
                        clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                      }}
                    />
                  </div>
                  {isBalanced && (
                    <p
                      className="text-center mt-1"
                      style={{ fontSize: "10px", color: "var(--dossier-muted)" }}
                    >
                      バランス型
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── スタイル傾向: タイプ代表値（URLパラメータなし時） ────────────── */}
      {!hasIndividualStyle && styleAxesFallback && (
        <div style={sectionStyle}>
          <p
            className="text-[10px] font-mono-doc tracking-[0.14em] mb-6"
            style={{ color: "var(--dossier-gold)" }}
          >
            このタイプの代表的なスタイル傾向
          </p>
          <div className="space-y-5">
            {STYLE_AXES_DEF.map(({ key, leftLabel, rightLabel }) => {
              const value = styleAxesFallback[key];
              const leftActive = value <= 2;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-2">
                    <span
                      className="text-xs font-jp"
                      style={{
                        color: leftActive ? "var(--dossier-ink)" : "var(--dossier-muted)",
                        fontWeight: leftActive ? 500 : 400,
                      }}
                    >
                      {leftLabel}
                    </span>
                    <span
                      className="text-xs font-jp"
                      style={{
                        color: !leftActive ? "var(--dossier-ink)" : "var(--dossier-muted)",
                        fontWeight: !leftActive ? 500 : 400,
                      }}
                    >
                      {rightLabel}
                    </span>
                  </div>
                  {/* 4-segment bar */}
                  <div className="flex gap-px">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className="flex-1 h-0.5"
                        style={{
                          background:
                            seg === value
                              ? "var(--dossier-gold)"
                              : "var(--dossier-line-soft)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
