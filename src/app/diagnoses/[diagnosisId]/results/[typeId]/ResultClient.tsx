"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

interface Axis {
  id: string;
  label: string;
}

interface Props {
  axes: Axis[];
  fallbackScores: Record<string, number>;
  sarcasticComments: string[];
  typeColor: string;
}

// ── Radar chart constants & helpers ──────────────────────────────────────────
// Pentagon vertices go clockwise from top.
// Axis order is chosen so that cognitively-related abilities are adjacent.

const RADAR_AXES = [
  { id: "logic",      label: "論理力" },
  { id: "creativity", label: "創造力" },
  { id: "sales",      label: "営業力" },
  { id: "execution",  label: "実行力" },
  { id: "management", label: "管理力" },
] as const;

const RN  = RADAR_AXES.length; // 5
const RCX = 160;               // SVG center x
const RCY = 160;               // SVG center y
const RR  = 90;                // outer ring radius (px in viewBox units)
const LR  = 122;               // label placement radius

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

export function ResultClient({
  axes,
  fallbackScores,
  sarcasticComments,
  typeColor,
}: Props) {
  const searchParams = useSearchParams();

  const { scores, individualScoreMode } = useMemo(() => {
    const parsed: Record<string, number> = {};
    let allValid = true;

    for (const axis of axes) {
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
    for (const axis of axes) {
      fallback[axis.id] = fallbackScores[axis.id] ?? 0;
    }
    return { scores: fallback, individualScoreMode: false };
  }, [searchParams, axes, fallbackScores]);

  // Stable comment selection based on highest-score axis (avoids hydration mismatch)
  const topAxis = axes.reduce(
    (top, axis) => (scores[axis.id] > (scores[top] ?? 0) ? axis.id : top),
    axes[0]?.id ?? ""
  );
  const commentIndex = topAxis.length % sarcasticComments.length;
  const sarcasticComment = sarcasticComments[commentIndex] ?? sarcasticComments[0];

  const GRID_LEVELS = [1 / 3, 2 / 3, 1] as const;

  return (
    <div>
      {/* ── Radar chart ─────────────────────────────────────────────────── */}
      <div className="border border-neutral-100 rounded-2xl p-5 mb-6">
        <p className="text-xs font-mono text-neutral-400 uppercase mb-4">
          {individualScoreMode ? "Ability Scores" : "このタイプの代表的な能力傾向"}
        </p>

        {/*
          viewBox 320×320, center (160,160), outer ring R=90.
          Labels at radius 122 — all fit within the 320px square.
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
                stroke="#e5e7eb" strokeWidth="1"
              />
            );
          })}

          {/* Background grid pentagons (3 levels) */}
          {GRID_LEVELS.map((lv) => (
            <polygon
              key={lv}
              points={gridPoly(lv)}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Score fill polygon */}
          <polygon
            points={buildScorePoly(scores)}
            fill={typeColor}
            fillOpacity="0.12"
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
                  fill="#9ca3af"
                >
                  {label}
                </text>
                <text
                  x={lx.toFixed(1)} y={(ly + 15).toFixed(1)}
                  textAnchor={anchor}
                  fontSize="13"
                  fontWeight="600"
                  fill="#111827"
                >
                  {score}
                </text>
              </g>
            );
          })}
        </svg>

        {!individualScoreMode && (
          <div className="mt-5 border border-amber-200 bg-amber-50 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700 leading-relaxed">
              これは診断回答から算出された個人スコアではなく、このタイプの代表的な傾向です。個人スコアを確認するには診断を受けてください。
            </p>
          </div>
        )}
      </div>

      {/* Sarcastic comment */}
      <div className="border-l-2 border-neutral-200 pl-4 mb-8">
        <p className="text-xs font-mono text-neutral-400 mb-1.5">
          From Human OS
        </p>
        <p className="text-sm text-neutral-600 italic leading-relaxed">
          {sarcasticComment}
        </p>
      </div>
    </div>
  );
}
