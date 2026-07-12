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
  bgImage?: string;
}

export function DiagnosisCard({
  title,
  description,
  category,
  estimatedMinutes,
  status,
  href,
  bgImage,
}: DiagnosisCardProps) {
  const isAvailable = status === "available";

  const inner = (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200 p-6 transition-colors relative overflow-hidden",
        isAvailable
          ? "hover:border-neutral-400 cursor-pointer"
          : "opacity-60 cursor-default",
        /* responsive background-position: mobile=58% center, md+=center center */
        bgImage ? "[background-position:58%_center] md:[background-position:center_center]" : ""
      )}
      style={bgImage ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
      } : undefined}
    >
      {/* Overlay: left→right gradient keeps text readable while image shows through on the right */}
      {bgImage && (
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ background: "linear-gradient(to right, rgba(250,247,241,0.88) 40%, rgba(248,244,236,0.72) 100%)" }}
        />
      )}

      <div className={bgImage ? "relative z-10" : undefined}>
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
    </div>
  );

  if (isAvailable && href) {
    return <a href={href}>{inner}</a>;
  }

  return <div>{inner}</div>;
}
