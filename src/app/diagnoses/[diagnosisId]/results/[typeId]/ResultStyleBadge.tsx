"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  resolveBusinessStyle,
  parseStyleAxisParams,
  type TypeAxesFallback,
} from "./resolve-business-style";

interface Props {
  typeAxesFallback: TypeAxesFallback;
}

export function ResultStyleBadge({ typeAxesFallback }: Props) {
  const searchParams = useSearchParams();

  const resolvedStyle = useMemo(
    () => resolveBusinessStyle(parseStyleAxisParams(searchParams), typeAxesFallback),
    [searchParams, typeAxesFallback],
  );

  return (
    <div
      data-slot="result-badges"
      className="flex items-center justify-center mt-4 md:mt-5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-slot="tribe-badge"
        src={resolvedStyle.tribe.image}
        alt={resolvedStyle.tribe.label}
        className="tribe-badge-img"
      />
    </div>
  );
}
