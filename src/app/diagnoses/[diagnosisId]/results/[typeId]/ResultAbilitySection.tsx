"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { parseAvParam, uScoresToV } from "@/engine/ability-scorer";
import { PentagonRadarChart } from "./PentagonRadarChart";

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
        スキルバランス
      </h2>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div className="w-full md:w-[min(72vw,720px)] md:mx-auto">
          <PentagonRadarChart scores={vScores} />
        </div>
      </div>
    </div>
  );
}
