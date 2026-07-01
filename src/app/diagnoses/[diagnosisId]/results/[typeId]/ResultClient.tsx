"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

interface StyleAxes {
  thinkingAction: number;
  offensiveStable: number;
  soloTeam: number;
  divergentConvergent: number;
}

interface Props {
  fallbackScores: Record<string, number>;
  sarcasticComments: string[];
  typeColor: string;
  styleAxes?: StyleAxes;
}

// ── Radar chart constants & helpers ──────────────────────────────────────────
// Pentagon vertices go clockwise from top.

const RADAR_AXES = [
  { id: "logic",      label: "論理力" },
  { id: "execution",  label: "実行力" },
  { id: "sales",      label: "営業力" },
  { id: "creativity", label: "創造力" },
  { id: "management", label: "管理力" },
] as const;

// 4 style axes: left pole = 1, right pole = 4
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

const GRID_COLOR = "rgba(255,255,255,0.08)";

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

export function ResultClient({ fallbackScores, sarcasticComments, typeColor, styleAxes }: Props) {
  const searchParams = useSearchParams();

  const { scores, individualScoreMode } = useMemo(() => {
    const parsed: Record<string, number> = {};
    let allValid = true;

    for (const axis of RADAR_AXES) {
      const raw = searchParams.get(axis.id);
      if (raw === null) {
        allValid = false;
        break;
      }
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n)) {
        allValid = false;
        break;
      }
      parsed[axis.id] = Math.min(100, Math.max(0, n));
    }

    if (allValid) {
      return { scores: parsed, individualScoreMode: true };
    }

    // 1つでも欠損・不正値があれば representativeScores に全切替え（混在させない）
    const fallback: Record<string, number> = {};
    for (const axis of RADAR_AXES) {
      fallback[axis.id] = fallbackScores[axis.id] ?? 0;
    }
    return { scores: fallback, individualScoreMode: false };
  }, [searchParams, fallbackScores]);

  // Stable comment selection based on highest-score axis (avoids hydration mismatch)
  const topAxis = RADAR_AXES.reduce<string>(
    (top, axis) => (scores[axis.id] > (scores[top] ?? 0) ? axis.id : top),
    RADAR_AXES[0].id
  );
  const commentIndex = topAxis.length % sarcasticComments.length;
  const sarcasticComment = sarcasticComments[commentIndex] ?? sarcasticComments[0];

  const GRID_LEVELS = [1 / 3, 2 / 3, 1] as const;

  return (
    <div className="mb-10">

      {/* ── Radar chart ───────────────────────────────────────────────────── */}
      <div className="border border-white/[0.08] rounded-2xl p-5 mb-4">
        <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-4">
          {individualScoreMode ? "Ability Scores" : "このタイプの代表的な能力傾向"}
        </p>

        {/*
          viewBox 320×320, center (160,160), outer ring R=90.
          Labels at radius 122 — all fit within the 320px square.
          Dark mode: grid lines rgba(255,255,255,0.08), score text near-white.
        */}
        <svg
          viewBox="0 0 320 320"
          className="w-full max-w-xs mx-auto block"
          aria-label="能力値レーダーチャート"
        >
          {/* Axis lines (center → outer vertex) */}
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

          {/* Background grid pentagons (3 levels) */}
          {GRID_LEVELS.map((lv) => (
            <polygon
              key={lv}
              points={gridPoly(lv)}
              fill="none"
              stroke={GRID_COLOR}
              strokeWidth="1"
            />
          ))}

          {/* Score fill polygon */}
          <polygon
            points={buildScorePoly(scores)}
            fill={typeColor}
            fillOpacity="0.18"
            stroke={typeColor}
            strokeWidth="1.5"
          />

          {/* Score dots at each vertex */}
          {RADAR_AXES.map(({ id }, i) => {
            const v = Math.min(100, Math.max(0, scores[id] ?? 0));
            const [x, y] = rPt((v / 100) * RR, i);
            return (
              <circle
                key={id}
                cx={x.toFixed(1)} cy={y.toFixed(1)}
                r="3"
                fill={typeColor}
              />
            );
          })}

          {/* Axis labels: ability name + score value */}
          {RADAR_AXES.map(({ id, label }, i) => {
            const [lx, ly] = rPt(LR, i);
            const anchor = labelAnchor(i);
            const score = scores[id] ?? 0;
            return (
              <g key={id}>
                <text
                  x={lx.toFixed(1)} y={ly.toFixed(1)}
                  textAnchor={anchor}
                  fontSize="11"
                  fill="#4b5563"
                >
                  {label}
                </text>
                <text
                  x={lx.toFixed(1)} y={(ly + 15).toFixed(1)}
                  textAnchor={anchor}
                  fontSize="13"
                  fontWeight="600"
                  fill="#e2e8f0"
                >
                  {score}
                </text>
              </g>
            );
          })}
        </svg>

        {!individualScoreMode && (
          <div className="mt-5 border border-amber-700/40 bg-amber-950/20 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-500/80 leading-relaxed">
              これは診断回答から算出された個人スコアではなく、このタイプの代表的な傾向です。個人スコアを確認するには診断を受けてください。
            </p>
          </div>
        )}
      </div>

      {/* ── Style Profile ─────────────────────────────────────────────────── */}
      {styleAxes && (
        <div className="border border-white/[0.08] rounded-2xl p-5 mb-6">
          <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-5">
            Style Profile
          </p>
          <div className="space-y-4">
            {STYLE_AXES_DEF.map(({ key, leftLabel, rightLabel }) => {
              const value = styleAxes[key]; // 1–4
              const leftActive = value <= 2;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${leftActive ? "text-neutral-300" : "text-neutral-700"}`}>
                      {leftLabel}
                    </span>
                    <span className={`text-xs ${!leftActive ? "text-neutral-300" : "text-neutral-700"}`}>
                      {rightLabel}
                    </span>
                  </div>
                  {/* 4-segment bar: one segment per axis value position */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className="flex-1 h-1 rounded-full"
                        style={{
                          backgroundColor:
                            seg === value ? typeColor : "rgba(255,255,255,0.06)",
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

      {/* ── From Human OS ─────────────────────────────────────────────────── */}
      <div className="border-l-2 border-white/[0.08] pl-4">
        <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-1.5">
          From Human OS
        </p>
        <p className="text-sm text-neutral-500 italic leading-relaxed">
          {sarcasticComment}
        </p>
      </div>

    </div>
  );
}
