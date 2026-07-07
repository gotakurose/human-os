"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { parseAvParam } from "@/engine/ability-scorer";
import { resolveSpecialist } from "@/engine/specialist-resolver";
import { SPECIALIST_BADGES } from "./result-assets";

export function ResultSpecialistBadge() {
  const searchParams = useSearchParams();

  const specialist = useMemo(() => {
    const u = parseAvParam(searchParams.get("av"));
    if (!u) return null;
    const result = resolveSpecialist(u);
    if (!result.ability) return null;
    return SPECIALIST_BADGES[result.ability] ?? null;
  }, [searchParams]);

  if (!specialist) return null;

  return (
    <div
      data-slot="result-specialist-badge"
      className="flex items-center justify-center mt-3 md:mt-4"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-slot="specialist-badge-img"
        src={specialist.image}
        alt={specialist.displayNameJp}
        className="specialist-badge-img"
        style={{ height: "clamp(56px, 10vw, 80px)", width: "auto" }}
      />
    </div>
  );
}
