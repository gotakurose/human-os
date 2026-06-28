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

  const { scores, hasUrlScores } = useMemo(() => {
    const result: Record<string, number> = {};
    let found = false;

    for (const axis of axes) {
      const raw = searchParams.get(axis.id);
      if (raw !== null) {
        result[axis.id] = Math.min(100, Math.max(0, parseInt(raw, 10)));
        found = true;
      } else {
        result[axis.id] = fallbackScores[axis.id] ?? 0;
      }
    }

    return { scores: result, hasUrlScores: found };
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
          Ability Scores
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
        {!hasUrlScores && (
          <p className="text-xs text-neutral-300 mt-4">
            ※ 代表的なスコアを表示しています
          </p>
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
