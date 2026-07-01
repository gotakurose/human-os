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
      robots: { index: false, follow: false },
    };
  } catch {
    return {};
  }
}

// ── Character image slot ──────────────────────────────────────────────────────
// Shown when characterImage is absent or empty. Looks like an analysis screen placeholder.
function CharacterSlot({ typeColor }: { typeColor: string }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden w-full"
      style={{
        border: `1px solid ${typeColor}25`,
        background: `${typeColor}05`,
        aspectRatio: "3 / 4",
      }}
    >
      {/* Grid + crosshair decoration */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="cgrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke={typeColor}
              strokeWidth="0.4"
              opacity="0.18"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cgrid)" />
        <line x1="50%" y1="38%" x2="50%" y2="62%" stroke={typeColor} strokeWidth="0.5" opacity="0.22" />
        <line x1="38%" y1="50%" x2="62%" y2="50%" stroke={typeColor} strokeWidth="0.5" opacity="0.22" />
        <circle cx="50%" cy="50%" r="14" fill="none" stroke={typeColor} strokeWidth="0.5" opacity="0.18" />
      </svg>
      {/* Labels */}
      <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
        <p className="text-[9px] font-mono tracking-[0.15em] text-neutral-700 uppercase">
          Character Profile
        </p>
        <div>
          <div className="w-full h-px mb-1.5" style={{ backgroundColor: `${typeColor}20` }} />
          <p className="text-[9px] font-mono tracking-[0.12em] text-neutral-800 uppercase">
            Visual Module
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoreFallback({ typeColor }: { typeColor: string }) {
  return (
    <div className="border border-white/[0.08] rounded-2xl p-5 mb-4">
      <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-4">
        Ability Scores
      </p>
      <div
        className="w-full max-w-xs mx-auto rounded-2xl animate-pulse"
        style={{
          aspectRatio: "1",
          background: `${typeColor}08`,
          border: `1px solid ${typeColor}15`,
        }}
      />
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

  const typeIndex = types.findIndex((t) => t.id === typeId) + 1;
  const tc = type.character.color;

  const compatibleIds = computeCompatibleTypes(type, types);
  const conflictIds = computeConflictTypes(type, types);
  const typeNameMap = new Map(types.map((t) => [t.id, t.name]));
  const compatibleNames = compatibleIds.map((id) => typeNameMap.get(id) ?? id);
  const conflictNames = conflictIds.map((id) => typeNameMap.get(id) ?? id);

  return (
    <main className="flex-1 bg-[#0d0f14] text-neutral-100 result-fade-in">
      <div className="max-w-2xl mx-auto px-5 py-10 w-full">

        {/* ── 0. Identity Panel ────────────────────────────────────────────── */}
        <section className="mb-10">
          {/* Header row */}
          <div className="flex items-start justify-between mb-6">
            <span className="text-xs font-mono tracking-[0.2em] text-neutral-600 uppercase">
              {meta.title} — Result
            </span>
            <span className="text-xs font-mono text-neutral-700 tracking-widest shrink-0 ml-4">
              TYPE-{String(typeIndex).padStart(2, "0")}
            </span>
          </div>

          {/* Name */}
          <div className="mb-5">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {type.name}
            </h1>
            {type.englishName && (
              <p
                className="text-xs font-mono tracking-[0.18em] uppercase mt-2"
                style={{ color: `${tc}cc` }}
              >
                {type.englishName}
              </p>
            )}
          </div>

          {/* Copy + Character slot */}
          <div className="sm:grid sm:grid-cols-[1fr_148px] sm:gap-6 mb-6">
            <div className="mb-5 sm:mb-0">
              {type.shareCatch && (
                <p className="text-lg font-semibold text-neutral-100 leading-snug mb-3">
                  {type.shareCatch}
                </p>
              )}
              {type.catchCopy && (
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {type.catchCopy}
                </p>
              )}
            </div>
            <div>
              {type.characterImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={type.characterImage}
                  alt={type.name}
                  className="w-full rounded-xl object-cover"
                  style={{ aspectRatio: "3 / 4" }}
                />
              ) : (
                <CharacterSlot typeColor={tc} />
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06] mb-5" />

          {/* Unique Trait badge slot */}
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-sm border tracking-[0.12em] uppercase"
              style={{ borderColor: `${tc}35`, color: `${tc}99` }}
            >
              Unique Trait
            </span>
            <span className="text-xs text-neutral-700">解析待ち</span>
          </div>
        </section>

        {/* ── System Comment ───────────────────────────────────────────────── */}
        {type.humanOsComment && (
          <section className="mb-10">
            <div className="border-l-[2px] pl-4" style={{ borderColor: tc }}>
              <p className="text-xs font-mono text-neutral-600 uppercase tracking-[0.15em] mb-2">
                System Comment
              </p>
              <p className="text-base text-neutral-300 italic leading-relaxed">
                {type.humanOsComment}
              </p>
            </div>
          </section>
        )}

        {/* ── Ability Scores + Style Profile (client) ───────────────────── */}
        <Suspense fallback={<ScoreFallback typeColor={tc} />}>
          <ResultClient
            fallbackScores={type.representativeScores}
            sarcasticComments={type.sarcasticComments}
            typeColor={tc}
            styleAxes={type.axes}
          />
        </Suspense>

        {/* ── あなたの社会人OS ─────────────────────────────────────────────── */}
        {(type.oneLine ?? type.osDescription) && (
          <section className="border-t border-white/[0.06] pt-8 mb-8">
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">
              あなたの社会人OS
            </p>
            {type.oneLine && (
              <p className="text-base font-semibold text-neutral-200 mb-3 leading-snug">
                {type.oneLine}
              </p>
            )}
            {type.osDescription && (
              <div className="border border-white/[0.08] rounded-2xl p-5">
                <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line">
                  {type.osDescription}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── 強み・弱み ───────────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] pt-8 mb-8">
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">
            強み・弱み
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="border border-white/[0.08] rounded-2xl p-4">
              <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-3">Strengths</p>
              <ul className="space-y-2">
                {type.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-neutral-300 flex gap-2">
                    <span className="text-neutral-700 shrink-0">—</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-white/[0.08] rounded-2xl p-4">
              <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-3">Weaknesses</p>
              <ul className="space-y-2">
                {type.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-neutral-300 flex gap-2">
                    <span className="text-neutral-700 shrink-0">—</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {type.fatalWeakness && (
            <div className="border border-red-900/40 bg-red-950/20 rounded-2xl p-4">
              <p className="text-xs font-mono text-red-700/80 uppercase tracking-widest mb-2">Fatal Weakness</p>
              <p className="text-sm text-red-400 leading-relaxed">{type.fatalWeakness}</p>
            </div>
          )}
        </section>

        {/* ── 自己成長 ─────────────────────────────────────────────────────── */}
        {(type.brokenEnvironment ?? (type.growthTips && type.growthTips.length > 0)) && (
          <section className="border-t border-white/[0.06] pt-8 mb-8">
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">
              自己成長
            </p>
            {type.brokenEnvironment && (
              <div className="border border-amber-800/30 bg-amber-950/20 rounded-2xl p-4 mb-4">
                <p className="text-xs font-mono text-amber-700/80 uppercase tracking-widest mb-2">Broken Environment</p>
                <p className="text-sm text-amber-400 leading-relaxed">{type.brokenEnvironment}</p>
              </div>
            )}
            {type.growthTips && type.growthTips.length > 0 && (
              <div className="border border-white/[0.08] rounded-2xl p-4">
                <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-3">Growth Tips</p>
                <ul className="space-y-3">
                  {type.growthTips.map((tip, i) => (
                    <li key={i} className="text-sm text-neutral-400 flex gap-2">
                      <span className="text-neutral-700 shrink-0 font-mono">{i + 1}.</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* ── キャリア適性 ─────────────────────────────────────────────────── */}
        {(type.recommendedCareers ?? type.recommendedTasks ?? type.notRecommendedWork) && (
          <section className="border-t border-white/[0.06] pt-8 mb-8">
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">
              キャリア適性
            </p>
            {type.recommendedCareers && type.recommendedCareers.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-3">Recommended Careers</p>
                <div className="flex flex-wrap gap-2">
                  {type.recommendedCareers.map((career, i) => (
                    <span
                      key={i}
                      className="text-xs text-neutral-400 bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-full"
                    >
                      {career}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {type.recommendedTasks && type.recommendedTasks.length > 0 && (
              <div className="border border-white/[0.08] rounded-2xl p-4 mb-4">
                <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-3">Recommended Tasks</p>
                <ul className="space-y-2">
                  {type.recommendedTasks.map((task, i) => (
                    <li key={i} className="text-sm text-neutral-400 flex gap-2">
                      <span className="text-neutral-700 shrink-0">—</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {type.notRecommendedWork && (
              <div className="border border-white/[0.08] rounded-2xl p-4">
                <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-2">Not Recommended</p>
                <p className="text-sm text-neutral-500 leading-relaxed">{type.notRecommendedWork}</p>
              </div>
            )}
          </section>
        )}

        {/* ── 人間関係 ─────────────────────────────────────────────────────── */}
        {(compatibleNames.length > 0 || conflictNames.length > 0) && (
          <section className="border-t border-white/[0.06] pt-8 mb-8">
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">
              人間関係
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {compatibleNames.length > 0 && (
                <div className="border border-white/[0.08] rounded-2xl p-4">
                  <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-3">相性が良いタイプ</p>
                  <ul className="space-y-2">
                    {compatibleNames.map((name, i) => (
                      <li key={i} className="text-sm text-neutral-400 flex gap-2">
                        <span className="text-green-600 shrink-0">◎</span>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {conflictNames.length > 0 && (
                <div className="border border-white/[0.08] rounded-2xl p-4">
                  <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-3">ぶつかりやすいタイプ</p>
                  <ul className="space-y-2">
                    {conflictNames.map((name, i) => (
                      <li key={i} className="text-sm text-neutral-400 flex gap-2">
                        <span className="text-red-700 shrink-0">△</span>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── チーム内での役割 ──────────────────────────────────────────────── */}
        {type.teamRole && (
          <section className="border-t border-white/[0.06] pt-8 mb-8">
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">
              チーム内での役割
            </p>
            <div className="border border-white/[0.08] rounded-2xl p-5">
              <p className="text-sm text-neutral-400 leading-relaxed">{type.teamRole}</p>
            </div>
          </section>
        )}

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col gap-3">
          <Link
            href={`/diagnoses/${diagnosisId}/questions`}
            className="flex items-center justify-center gap-2 w-full border border-white/15 rounded-2xl py-3.5 text-sm font-medium text-neutral-400 hover:border-white/30 hover:text-white transition-colors"
          >
            <RotateCcw size={14} />
            もう一度診断する
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full text-sm text-neutral-700 hover:text-neutral-500 py-2 transition-colors"
          >
            <Home size={14} />
            トップへ戻る
          </Link>
        </div>

      </div>
    </main>
  );
}
