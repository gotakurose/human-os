import { loadMeta, loadAllMeta } from "@/lib/data-loader";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Props {
  params: Promise<{ diagnosisId: string }>;
}

export async function generateStaticParams() {
  const allMeta = loadAllMeta();
  return allMeta
    .filter((m) => m.published)
    .map((m) => ({ diagnosisId: m.id }));
}

export async function generateMetadata({ params }: Props) {
  const { diagnosisId } = await params;
  try {
    const meta = loadMeta(diagnosisId);
    return { title: meta.title, description: meta.description };
  } catch {
    return {};
  }
}

const AXIS_LABELS: Record<string, string> = {
  logic:      "論理力",
  execution:  "実行力",
  sales:      "営業力",
  creativity: "創造力",
  management: "管理力",
};

export default async function DiagnosisPage({ params }: Props) {
  const { diagnosisId } = await params;

  let meta;
  try {
    meta = loadMeta(diagnosisId);
  } catch {
    notFound();
  }

  const axes = meta.axes ?? [];

  const DL  = "1px solid var(--dossier-line)";
  const DLS = "1px solid var(--dossier-line-soft)";

  return (
    <main
      className="dossier-page flex-1 px-5 py-10 max-w-2xl mx-auto w-full"
      style={{ color: "var(--dossier-ink)" }}
    >
      {/* Back */}
      <Link
        href="/"
        className="text-xs font-jp transition-opacity hover:opacity-60 mb-10 inline-block"
        style={{ color: "var(--dossier-muted)" }}
      >
        ← トップへ
      </Link>

      {/* Page header */}
      <div className="mb-6" style={{ borderBottom: DL, paddingBottom: "0.75rem" }}>
        <p
          className="text-[10px] font-mono-doc tracking-[0.15em]"
          style={{ color: "var(--dossier-gold)" }}
        >
          解析申請書
        </p>
      </div>

      {/* Category + time */}
      <div className="flex items-center gap-3 mb-5">
        <span
          className="text-[11px] font-jp px-2.5 py-0.5"
          style={{
            border: "1px solid var(--dossier-line)",
            background: "var(--dossier-surface)",
            color: "var(--dossier-sub)",
          }}
        >
          {meta.category}
        </span>
        <span
          className="text-[11px] font-mono-doc"
          style={{ color: "var(--dossier-muted)" }}
        >
          約 {meta.estimatedMinutes} 分
        </span>
      </div>

      {/* Title */}
      <h1
        className="font-zen leading-tight mb-3"
        style={{
          fontSize: "clamp(1.5rem, 6vw, 2.25rem)",
          letterSpacing: "0.04em",
          color: "var(--dossier-ink)",
        }}
      >
        {meta.title}
      </h1>

      {/* Description */}
      <p
        className="font-jp leading-relaxed mb-8"
        style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
      >
        {meta.description}
      </p>

      {/* Spec table */}
      <div className="mb-6" style={{ border: DL }}>
        <div
          className="px-4 py-2"
          style={{ borderBottom: DLS, background: "var(--dossier-paper)" }}
        >
          <p
            className="text-[10px] font-mono-doc tracking-[0.12em]"
            style={{ color: "var(--dossier-gold)" }}
          >
            解析仕様
          </p>
        </div>
        <div>
          {[
            { label: "質問数",    value: `${meta.questionCount} 問` },
            { label: "タイプ数",  value: `${meta.typeCount} タイプ` },
            { label: "診断方式",  value: "4スタイル軸 × 5能力値" },
          ].map(({ label, value }, i) => (
            <div
              key={i}
              className="flex justify-between items-baseline px-4 py-3 text-sm"
              style={{ borderTop: i === 0 ? undefined : DLS }}
            >
              <span
                className="font-jp"
                style={{ color: "var(--dossier-muted)" }}
              >
                {label}
              </span>
              <span
                className="font-mono-doc"
                style={{ color: "var(--dossier-ink)", fontSize: "0.875rem" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Axes */}
      {axes.length > 0 && (
        <div className="mb-8" style={{ borderTop: DL, paddingTop: "1.25rem" }}>
          <p
            className="text-[10px] font-mono-doc tracking-[0.12em] mb-3"
            style={{ color: "var(--dossier-gold)" }}
          >
            評価軸
          </p>
          <div className="flex flex-wrap gap-2">
            {axes.map((axis) => (
              <span
                key={axis}
                className="text-xs font-jp px-3 py-1"
                style={{
                  border: "1px solid var(--dossier-line)",
                  background: "var(--dossier-surface)",
                  color: "var(--dossier-sub)",
                }}
              >
                {AXIS_LABELS[axis] ?? axis}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/diagnoses/${diagnosisId}/questions`}
        className="flex items-center justify-center gap-2 w-full py-4 font-jp font-medium transition-opacity hover:opacity-80"
        style={{
          background: "var(--dossier-dark)",
          color: "var(--dossier-bg)",
          fontSize: "0.9375rem",
        }}
      >
        診断を開始する
        <ChevronRight size={16} />
      </Link>
    </main>
  );
}
