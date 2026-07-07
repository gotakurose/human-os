"use client";

import { useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { parseStyleAxisParams, resolveBusinessStyle } from "./resolve-business-style";
import type { TypeAxesFallback } from "./resolve-business-style";
import { selectAxisDynamicCopy } from "./resolve-axis-dynamic-copy";
import type { DynamicCopyPart, TypeDefinition } from "./resolve-axis-dynamic-copy";
import { ProseBody } from "./ProseBody";

interface Props {
  targetSlot: string;
  typeId: string;
  typeAxesFallback: TypeAxesFallback;
  parts: DynamicCopyPart[];
  allTypeDefinitions: TypeDefinition[];
  className?: string;
  paragraphClassName?: string;
  style?: CSSProperties;
}

export function DynamicCopySlot({
  targetSlot,
  typeId,
  typeAxesFallback,
  parts,
  allTypeDefinitions,
  className = "space-y-3 mt-4",
  paragraphClassName = "font-jp prose-text",
  style,
}: Props) {
  const searchParams = useSearchParams();
  const styleScores = parseStyleAxisParams(searchParams);
  if (styleScores === null) return null;

  const resolved = resolveBusinessStyle(styleScores, typeAxesFallback);
  const selection = selectAxisDynamicCopy(resolved, typeId, parts, allTypeDefinitions);

  if (selection.status !== "ok") {
    if (process.env.NODE_ENV === "development" && selection.errors.length > 0) {
      console.error("[DynamicCopySlot]", selection.status, selection.errors);
    }
    return null;
  }

  const slotParts = selection.parts.filter((p) => p.targetSlot === targetSlot);
  if (slotParts.length !== 1) return null;

  return (
    <ProseBody
      text={slotParts[0].text}
      className={className}
      paragraphClassName={paragraphClassName}
      style={style}
    />
  );
}
