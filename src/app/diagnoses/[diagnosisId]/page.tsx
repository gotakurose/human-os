import { loadMeta, loadAllMeta } from "@/lib/data-loader";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ChevronRight, BarChart2 } from "lucide-react";

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
  logic: "論理力",
  execution: "実行力",
  sales: "営業力",
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

  return (
    <main className="flex-1 px-5 py-12 max-w-2xl mx-auto w-full">
      <Link
        href="/"
        className="text-xs text-neutral-400 hover:text-neutral-600 mb-10 inline-block transition-colors"
      >
        ← トップへ
      </Link>

      {/* Category + time */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
          {meta.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-neutral-400">
          <Clock size={12} />
          約{meta.estimatedMinutes}分
        </span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
        {meta.title}
      </h1>
      <p className="text-sm text-neutral-500 leading-relaxed mb-8">
        {meta.description}
      </p>

      {/* Info card */}
      <div className="border border-neutral-100 rounded-2xl p-5 mb-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">質問数</span>
          <span className="font-medium">{meta.questionCount}問</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">タイプ数</span>
          <span className="font-medium">{meta.typeCount}タイプ</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">診断方式</span>
          <span className="font-medium">4スタイル軸 × 5能力値</span>
        </div>
      </div>

      {/* Axes */}
      {axes.length > 0 && (
        <div className="border border-neutral-100 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="text-neutral-400" />
            <p className="text-xs text-neutral-400">
              評価軸
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {axes.map((axis) => (
              <span
                key={axis}
                className="text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 px-3 py-1 rounded-full"
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
        className="flex items-center justify-center gap-2 w-full bg-neutral-900 text-white rounded-2xl py-4 font-medium hover:bg-neutral-700 transition-colors"
      >
        診断を開始する
        <ChevronRight size={16} />
      </Link>
    </main>
  );
}
