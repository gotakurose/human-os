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
const LR  = 122;
const GRID_COLOR = "rgba(184,160,106,0.12)";

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

// ── Component ─────────────────────────────────────────────────────────────────

export function ResultClient({ fallbackScores, typeColor, styleAxesFallback }: Props) {
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

  const cardStyle = {
    background: "#1C1A16",
    border: "1px solid #2E2A24",
  } as const;

  return (
    <div className="mb-10">

      {/* ── 能力値 (Radar chart) ──────────────────────────────────────────── */}
      <div className="rounded-lg p-5 mb-4" style={cardStyle}>
        <p className="text-xs mb-4 tracking-[0.05em]" style={{ color: "#8A8378" }}>
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
                stroke={GRID_COLOR}
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
              stroke={GRID_COLOR}
              strokeWidth="1"
            />
          ))}

          {/* Score polygon */}
          <polygon
            points={buildScorePoly(scores)}
            fill={typeColor}
            fillOpacity="0.12"
            stroke={typeColor}
            strokeWidth="1.5"
          />

          {/* Score dots — gold accent */}
          {RADAR_AXES.map(({ id }, i) => {
            const v = Math.min(100, Math.max(0, scores[id] ?? 0));
            const [x, y] = rPt((v / 100) * RR, i);
            return <circle key={id} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill="#B8A06A" />;
          })}

          {/* Labels */}
          {RADAR_AXES.map(({ id, label }, i) => {
            const [lx, ly] = rPt(LR, i);
            const anchor = labelAnchor(i);
            const score = scores[id] ?? 0;
            return (
              <g key={id}>
                <text x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor={anchor} fontSize="11" fill="#8A8378">
                  {label}
                </text>
                <text x={lx.toFixed(1)} y={(ly + 15).toFixed(1)} textAnchor={anchor} fontSize="13" fontWeight="600" fill="#EDE9E1">
                  {score}
                </text>
              </g>
            );
          })}
        </svg>

        {!individualScoreMode && (
          <div
            className="mt-5 rounded-lg px-4 py-3"
            style={{ border: "1px solid #3D2E18", background: "#1A1208" }}
          >
            <p className="text-xs leading-relaxed" style={{ color: "#8C7A4B" }}>
              これは診断回答から算出された個人スコアではなく、このタイプの代表的な傾向です。個人スコアを確認するには診断を受けてください。
            </p>
          </div>
        )}
      </div>

      {/* ── スタイル傾向: 個人スコアスライダー ─────────────────────────────── */}
      {hasIndividualStyle && styleScores && (
        <div className="rounded-lg p-5 mb-5" style={cardStyle}>
          <p className="text-xs mb-5 tracking-[0.05em]" style={{ color: "#8A8378" }}>スタイル傾向</p>
          <div className="space-y-5">
            {STYLE_AXES_SLIDER.map(({ key, leftLabel, rightLabel }) => {
              const score = styleScores[key];
              const leftPct = Math.round((1 + score) / 2 * 100);
              const rightPct = 100 - leftPct;
              const dotLeft = 100 - leftPct;
              const isExtreme = leftPct >= 80 || rightPct >= 80;
              const isBalanced = leftPct >= 45 && leftPct <= 55;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between">
                    <span
                      className="text-xs"
                      style={{ color: leftPct >= 50 ? "#C8C3BB" : "#4A4540" }}
                    >
                      {leftLabel}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: rightPct >= 50 ? "#C8C3BB" : "#4A4540" }}
                    >
                      {rightLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-mono tabular-nums w-7 text-right shrink-0"
                      style={{ color: leftPct >= 50 ? "#8A8378" : "#4A4540" }}
                    >
                      {leftPct}
                    </span>
                    <div className="relative flex-1 h-px" style={{ background: "#2E2A24" }}>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                        style={{
                          left: `${dotLeft}%`,
                          backgroundColor: "#B8A06A",
                          ...(isExtreme ? { boxShadow: "0 0 5px rgba(184,160,106,0.4)" } : {}),
                        }}
                      />
                    </div>
                    <span
                      className="text-[11px] font-mono tabular-nums w-7 shrink-0"
                      style={{ color: rightPct >= 50 ? "#8A8378" : "#4A4540" }}
                    >
                      {rightPct}
                    </span>
                  </div>
                  {isBalanced && (
                    <p className="text-center text-[10px]" style={{ color: "#4A4540" }}>バランス寄り</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── スタイル傾向: タイプ代表値チップ（URLパラメータなし時） ─────────── */}
      {!hasIndividualStyle && styleAxesFallback && (
        <div className="rounded-lg p-5 mb-5" style={cardStyle}>
          <p className="text-xs mb-5 tracking-[0.05em]" style={{ color: "#8A8378" }}>
            このタイプの代表的なスタイル傾向
          </p>
          <div className="space-y-4">
            {STYLE_AXES_DEF.map(({ key, leftLabel, rightLabel }) => {
              const value = styleAxesFallback[key];
              const leftActive = value <= 2;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs"
                      style={{ color: leftActive ? "#C8C3BB" : "#4A4540" }}
                    >
                      {leftLabel}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: !leftActive ? "#C8C3BB" : "#4A4540" }}
                    >
                      {rightLabel}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className="flex-1 h-0.5 rounded-full"
                        style={{
                          backgroundColor:
                            seg === value ? "#B8A06A" : "rgba(46,42,36,0.8)",
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
