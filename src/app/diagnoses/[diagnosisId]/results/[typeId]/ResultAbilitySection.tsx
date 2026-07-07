"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { parseAvParam, uScoresToV } from "@/engine/ability-scorer";
import { PentagonRadarChart } from "./PentagonRadarChart";

const ABILITY_LABELS: { key: string; jp: string }[] = [
  { key: "logic",      jp: "論理力" },
  { key: "execution",  jp: "実行力" },
  { key: "sales",      jp: "営業力" },
  { key: "creativity", jp: "創造力" },
  { key: "management", jp: "管理力" },
];

export function ResultAbilitySection() {
  const searchParams = useSearchParams();

  const vScores = useMemo(() => {
    const u = parseAvParam(searchParams.get("av"));
    if (!u) return null;
    return uScoresToV(u);
  }, [searchParams]);

  if (!vScores) return null;

  return (
    <div
      className="max-w-[960px] mx-auto px-5 md:px-7 lg:px-8 w-full pb-8"
    >
      <h2
        className="font-heading tracking-[0.04em] section-heading"
        style={{ color: "#17100A" }}
      >
        5能力値
      </h2>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12" style={{ maxWidth: "760px" }}>

        {/* Pentagon chart */}
        <div style={{ flexShrink: 0, width: "clamp(200px, 50%, 280px)" }}>
          <PentagonRadarChart scores={vScores} />
        </div>

        {/* Score bars */}
        <div style={{ flex: 1, width: "100%", maxWidth: "320px" }}>
          <ul style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {ABILITY_LABELS.map(({ key, jp }) => {
              const v = vScores[key as keyof typeof vScores];
              return (
                <li key={key}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span
                      className="font-jp"
                      style={{ fontSize: "13px", color: "rgba(33,22,13,0.72)" }}
                    >
                      {jp}
                    </span>
                    <span
                      className="font-mono-doc"
                      style={{ fontSize: "13px", color: "#6F552C", fontWeight: 600 }}
                    >
                      {v}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "4px",
                      background: "rgba(154,124,70,0.18)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${v}%`,
                        background: "#9A7C46",
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

      </div>
    </div>
  );
}
