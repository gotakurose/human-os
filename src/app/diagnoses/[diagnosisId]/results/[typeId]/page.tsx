import { loadTypes, loadMeta, loadAllMeta } from "@/lib/data-loader";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ResultClient } from "./ResultClient";
import { RotateCcw, Home } from "lucide-react";

interface Props {
  params: Promise<{ diagnosisId: string; typeId: string }>;
}

export async function generateStaticParams() {
  const allMeta = loadAllMeta();
  const params: { diagnosisId: string; typeId: string }[] = [];

  for (const meta of allMeta) {
    try {
      const types = loadTypes(meta.id);
      for (const type of types) {
        params.push({ diagnosisId: meta.id, typeId: type.id });
      }
    } catch {
      // skip diagnoses with missing types.json
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props) {
  const { diagnosisId, typeId } = await params;
  try {
    const types = loadTypes(diagnosisId);
    const type = types.find((t) => t.id === typeId);
    if (!type) return {};
    return {
      title: `${type.name} — 社会人能力値診断`,
      description: type.summary,
    };
  } catch {
    return {};
  }
}

const AXES = [
  { id: "logic", label: "論理力" },
  { id: "execution", label: "実行力" },
  { id: "sales", label: "営業力" },
  { id: "creativity", label: "創造力" },
  { id: "management", label: "管理力" },
];

function ScoreFallback() {
  return (
    <div className="border border-neutral-100 rounded-2xl p-5 mb-6">
      <p className="text-xs font-mono text-neutral-400 uppercase mb-5">
        Ability Scores
      </p>
      <div className="space-y-4">
        {AXES.map((axis) => (
          <div key={axis.id}>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-sm text-neutral-600">{axis.label}</span>
              <span className="font-mono text-sm text-neutral-300">--</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ResultPage({ params }: Props) {
  const { diagnosisId, typeId } = await params;

  let types, meta;
  try {
    types = loadTypes(diagnosisId);
    meta = loadMeta(diagnosisId);
  } catch {
    notFound();
  }

  const type = types.find((t) => t.id === typeId);
  if (!type) notFound();

  return (
    <main className="flex-1 px-5 py-12 max-w-2xl mx-auto w-full">
      {/* Label */}
      <p className="text-xs font-mono tracking-widest text-neutral-400 uppercase mb-2">
        {meta.title} — Result
      </p>

      {/* Type name */}
      <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
        {type.name}
      </h1>
      <p className="text-sm text-neutral-500 leading-relaxed mb-8">
        {type.summary}
      </p>

      {/* Scores + sarcastic comment (client — reads URL params) */}
      <Suspense fallback={<ScoreFallback />}>
        <ResultClient
          axes={AXES}
          fallbackScores={type.representativeScores}
          sarcasticComments={type.sarcasticComments}
          typeColor={type.character.color}
        />
      </Suspense>

      {/* Detail */}
      <p className="text-sm text-neutral-600 leading-relaxed mb-6">
        {type.detail}
      </p>

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="border border-neutral-100 rounded-2xl p-4">
          <p className="text-xs font-mono text-neutral-400 uppercase mb-3">
            Strengths
          </p>
          <ul className="space-y-2">
            {type.strengths.map((s, i) => (
              <li key={i} className="text-sm text-neutral-700 flex gap-2">
                <span className="text-neutral-300 shrink-0">—</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-neutral-100 rounded-2xl p-4">
          <p className="text-xs font-mono text-neutral-400 uppercase mb-3">
            Weaknesses
          </p>
          <ul className="space-y-2">
            {type.weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-neutral-700 flex gap-2">
                <span className="text-neutral-300 shrink-0">—</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended roles */}
      <div className="border border-neutral-100 rounded-2xl p-4 mb-8">
        <p className="text-xs font-mono text-neutral-400 uppercase mb-3">
          Recommended Roles
        </p>
        <div className="flex flex-wrap gap-2">
          {type.recommendedRoles.map((role, i) => (
            <span
              key={i}
              className="text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 px-3 py-1 rounded-full"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link
          href={`/diagnoses/${diagnosisId}/questions`}
          className="flex items-center justify-center gap-2 w-full border border-neutral-900 rounded-2xl py-3.5 text-sm font-medium text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
        >
          <RotateCcw size={14} />
          もう一度診断する
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full text-sm text-neutral-400 hover:text-neutral-600 py-2 transition-colors"
        >
          <Home size={14} />
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
