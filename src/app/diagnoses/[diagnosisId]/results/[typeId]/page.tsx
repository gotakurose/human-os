import { loadTypes, loadMeta, loadAllMeta } from "@/lib/data-loader";
import { computeCompatibleTypes, computeConflictTypes } from "@/lib/type-compatibility";
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
      description: type.shareCatch ?? type.summary,
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

  // 相性タイプを type-compatibility.ts の関数から導出
  const compatibleIds = computeCompatibleTypes(type, types);
  const conflictIds = computeConflictTypes(type, types);
  const typeNameMap = new Map(types.map((t) => [t.id, t.name]));
  const compatibleNames = compatibleIds.map((id) => typeNameMap.get(id) ?? id);
  const conflictNames = conflictIds.map((id) => typeNameMap.get(id) ?? id);

  return (
    <main className="flex-1 px-5 py-12 max-w-2xl mx-auto w-full">

      {/* ── 1. ファーストビュー ──────────────────────────────── */}
      <section className="mb-10">
        <p className="text-xs font-mono tracking-widest text-neutral-400 uppercase mb-2">
          {meta.title} — Result
        </p>

        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-1">
          {type.name}
        </h1>

        {type.shareCatch && (
          <p className="text-base font-semibold text-neutral-700 mb-3">
            {type.shareCatch}
          </p>
        )}

        {type.catchCopy && (
          <p className="text-sm text-neutral-500 leading-relaxed mb-6">
            {type.catchCopy}
          </p>
        )}

        {type.humanOsComment && (
          <div className="border-l-2 border-neutral-200 pl-4 mb-6">
            <p className="text-xs font-mono text-neutral-400 mb-1.5">Human OS Comment</p>
            <p className="text-sm text-neutral-600 italic leading-relaxed">
              {type.humanOsComment}
            </p>
          </div>
        )}

        <Suspense fallback={<ScoreFallback />}>
          <ResultClient
            axes={AXES}
            fallbackScores={type.representativeScores}
            sarcasticComments={type.sarcasticComments}
            typeColor={type.character.color}
          />
        </Suspense>
      </section>

      {/* ── 2. あなたの社会人OS ─────────────────────────────── */}
      {(type.oneLine ?? type.osDescription) && (
        <section className="mb-8">
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-4">
            あなたの社会人OS
          </p>
          {type.oneLine && (
            <p className="text-base font-semibold text-neutral-800 mb-3 leading-snug">
              {type.oneLine}
            </p>
          )}
          {type.osDescription && (
            <div className="border border-neutral-100 rounded-2xl p-5">
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                {type.osDescription}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── 3. 強み・弱み ───────────────────────────────────── */}
      <section className="mb-8">
        <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-4">
          強み・弱み
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="border border-neutral-100 rounded-2xl p-4">
            <p className="text-xs font-mono text-neutral-400 uppercase mb-3">Strengths</p>
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
            <p className="text-xs font-mono text-neutral-400 uppercase mb-3">Weaknesses</p>
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

        {type.fatalWeakness && (
          <div className="border border-red-100 bg-red-50/50 rounded-2xl p-4">
            <p className="text-xs font-mono text-red-300 uppercase mb-2">Fatal Weakness</p>
            <p className="text-sm text-red-700 leading-relaxed">{type.fatalWeakness}</p>
          </div>
        )}
      </section>

      {/* ── 4. 自己成長 ─────────────────────────────────────── */}
      {(type.brokenEnvironment ?? (type.growthTips && type.growthTips.length > 0)) && (
        <section className="mb-8">
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-4">
            自己成長
          </p>

          {type.brokenEnvironment && (
            <div className="border border-amber-100 bg-amber-50/50 rounded-2xl p-4 mb-4">
              <p className="text-xs font-mono text-amber-400 uppercase mb-2">Broken Environment</p>
              <p className="text-sm text-amber-800 leading-relaxed">{type.brokenEnvironment}</p>
            </div>
          )}

          {type.growthTips && type.growthTips.length > 0 && (
            <div className="border border-neutral-100 rounded-2xl p-4">
              <p className="text-xs font-mono text-neutral-400 uppercase mb-3">Growth Tips</p>
              <ul className="space-y-3">
                {type.growthTips.map((tip, i) => (
                  <li key={i} className="text-sm text-neutral-700 flex gap-2">
                    <span className="text-neutral-300 shrink-0 font-mono">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── 5. キャリア適性 ─────────────────────────────────── */}
      {(type.recommendedCareers ?? type.recommendedTasks ?? type.notRecommendedWork) && (
        <section className="mb-8">
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-4">
            キャリア適性
          </p>

          {type.recommendedCareers && type.recommendedCareers.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-mono text-neutral-400 uppercase mb-3">Recommended Careers</p>
              <div className="flex flex-wrap gap-2">
                {type.recommendedCareers.map((career, i) => (
                  <span
                    key={i}
                    className="text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 px-3 py-1 rounded-full"
                  >
                    {career}
                  </span>
                ))}
              </div>
            </div>
          )}

          {type.recommendedTasks && type.recommendedTasks.length > 0 && (
            <div className="border border-neutral-100 rounded-2xl p-4 mb-4">
              <p className="text-xs font-mono text-neutral-400 uppercase mb-3">Recommended Tasks</p>
              <ul className="space-y-2">
                {type.recommendedTasks.map((task, i) => (
                  <li key={i} className="text-sm text-neutral-700 flex gap-2">
                    <span className="text-neutral-300 shrink-0">—</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {type.notRecommendedWork && (
            <div className="border border-neutral-100 rounded-2xl p-4">
              <p className="text-xs font-mono text-neutral-400 uppercase mb-2">Not Recommended</p>
              <p className="text-sm text-neutral-500 leading-relaxed">{type.notRecommendedWork}</p>
            </div>
          )}
        </section>
      )}

      {/* ── 6. 人間関係 ─────────────────────────────────────── */}
      {(compatibleNames.length > 0 || conflictNames.length > 0) && (
        <section className="mb-8">
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-4">
            人間関係
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {compatibleNames.length > 0 && (
              <div className="border border-neutral-100 rounded-2xl p-4">
                <p className="text-xs font-mono text-neutral-400 uppercase mb-3">相性が良いタイプ</p>
                <ul className="space-y-2">
                  {compatibleNames.map((name, i) => (
                    <li key={i} className="text-sm text-neutral-700 flex gap-2">
                      <span className="text-green-400 shrink-0">◎</span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {conflictNames.length > 0 && (
              <div className="border border-neutral-100 rounded-2xl p-4">
                <p className="text-xs font-mono text-neutral-400 uppercase mb-3">ぶつかりやすいタイプ</p>
                <ul className="space-y-2">
                  {conflictNames.map((name, i) => (
                    <li key={i} className="text-sm text-neutral-700 flex gap-2">
                      <span className="text-red-300 shrink-0">△</span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 7. チーム内での役割 ──────────────────────────────── */}
      {type.teamRole && (
        <section className="mb-8">
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-4">
            チーム内での役割
          </p>
          <div className="border border-neutral-100 rounded-2xl p-5">
            <p className="text-sm text-neutral-600 leading-relaxed">{type.teamRole}</p>
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-4">
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
