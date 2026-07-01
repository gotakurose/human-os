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

    // 1つでも欠損・不正値があれば representativeScores に全切替え
    const fallback: Record<string, number> = {};
    for (const axis of axes) {
      fallback[axis.id] = fallbackScores[axis.id] ?? 0;
    }
    return { scores: fallback, individualScoreMode: false };
  }, [searchParams, axes, fallbackScores]);

  // Stable comment selection based on highest score axis (avoids hydration mismatch)
  const topAxis = axes.reduce(
    (top, axis) => (scores[axis.id] > (scores[top] ?? 0) ? axis.id : top),
    axes[0]?.id ?? ""
  );
  const commentIndex = topAxis.length % sarcasticComments.length;
  const sarcasticComment = sarcasticComments[commentIndex] ?? sarcasticComments[0];

  return (
    <div>
      {/* Score bars */}
      <div className="border border-neutral-100 rounded-2xl p-5 mb-6">
        <p className="text-xs font-mono text-neutral-400 uppercase mb-5">
          {individualScoreMode ? "Ability Scores" : "このタイプの代表的な能力傾向"}
        </p>
        <div className="space-y-4">
          {axes.map((axis) => {
            const score = scores[axis.id] ?? 0;
            return (
              <div key={axis.id}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-sm text-neutral-600">{axis.label}</span>
                  <span className="font-mono text-sm font-semibold text-neutral-900">
                    {score}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${score}%`,
                      backgroundColor: typeColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

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
