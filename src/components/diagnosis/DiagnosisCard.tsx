import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

type DiagnosisStatus = "available" | "coming_soon";

interface DiagnosisCardProps {
  title: string;
  description: string;
  category: string;
  estimatedMinutes: number;
  status: DiagnosisStatus;
  href?: string;
}

export function DiagnosisCard({
  title,
  description,
  category,
  estimatedMinutes,
  status,
  href,
}: DiagnosisCardProps) {
  const isAvailable = status === "available";

  const inner = (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200 p-6 transition-colors",
        isAvailable
          ? "hover:border-neutral-400 cursor-pointer"
          : "opacity-60 cursor-default"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
            {category}
          </span>
          {!isAvailable && (
            <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-400 shrink-0">
          <Clock size={12} />
          <span>{estimatedMinutes}分</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>

      {/* CTA */}
      {isAvailable && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <span className="text-sm font-medium text-neutral-900">
            診断を始める →
          </span>
        </div>
      )}
    </div>
  );

  if (isAvailable && href) {
    return <a href={href}>{inner}</a>;
  }

  return <div>{inner}</div>;
}
