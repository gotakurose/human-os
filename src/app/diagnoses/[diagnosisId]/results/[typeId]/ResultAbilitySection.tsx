"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { parseAvParam, uScoresToDisplayScores } from "@/engine/ability-scorer";
import { PentagonRadarChart } from "./PentagonRadarChart";

export function ResultAbilitySection() {
  const searchParams = useSearchParams();

  const vScores = useMemo(() => {
    const u = parseAvParam(searchParams.get("av"));
    if (!u) return null;
    return uScoresToDisplayScores(u);
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
        スキルバランス
      </h2>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div className="w-full md:w-[min(72vw,720px)] md:mx-auto">
          <PentagonRadarChart scores={vScores} />
        </div>
      </div>

      <p
        className="font-jp mx-auto mt-4"
        style={{
          maxWidth: "760px",
          fontSize: "clamp(12px, 1.3vw, 14px)",
          color: "rgba(33,22,13,0.52)",
          lineHeight: "1.75",
        }}
      >
        回答から観測された仕事上の行動傾向を、比較しやすい50〜100の表示スコアで示しています。実技能の達成率や順位ではなく、50も能力不足を意味しません。
      </p>
    </div>
  );
}
