"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  resolveBusinessStyle,
  parseStyleAxisParams,
  type TypeAxesFallback,
} from "./resolve-business-style";
import { parseAvParam } from "@/engine/ability-scorer";
import { resolveSpecialist } from "@/engine/specialist-resolver";
import { SPECIALIST_BADGES } from "./result-assets";

interface Props {
  typeAxesFallback: TypeAxesFallback;
}

export function ResultBadgeGroup({ typeAxesFallback }: Props) {
  const searchParams = useSearchParams();

  const resolvedStyle = useMemo(
    () => resolveBusinessStyle(parseStyleAxisParams(searchParams), typeAxesFallback),
    [searchParams, typeAxesFallback],
  );

  const specialist = useMemo(() => {
    const u = parseAvParam(searchParams.get("av"));
    if (!u) return null;
    const result = resolveSpecialist(u);
    if (!result.ability) return null;
    return SPECIALIST_BADGES[result.ability] ?? null;
  }, [searchParams]);

  if (specialist) {
    return (
      <div className="specialist-badge-grid">
        <div className="badge-cell">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedStyle.tribe.image}
            alt={`${resolvedStyle.tribe.label}バッジ`}
          />
        </div>
        <div className="badge-cell">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={specialist.image}
            alt={`${specialist.displayNameJp}バッジ`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="single-badge-wrapper">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedStyle.tribe.image}
        alt={`${resolvedStyle.tribe.label}バッジ`}
        className="tribe-badge-img"
      />
    </div>
  );
}
