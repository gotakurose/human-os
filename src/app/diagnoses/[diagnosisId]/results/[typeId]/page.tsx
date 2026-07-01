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

// Temporary per-type image mapping until characterImage/badgeImage are in types.json
const TEMP_TYPE_ASSETS: Record<string, {
  characterImage: string;
  traitBadgeImage: string;
  traitLabel: string;
}> = {
  "vision-architect": {
    characterImage: "/images/diagnoses/business-skills/characters/structure-hacker.png",
    traitBadgeImage: "/images/diagnoses/business-skills/badges/logical-specialist.png",
    traitLabel: "論理特化型",
  },
};

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

function ScoreFallback({ typeColor }: { typeColor: string }) {
  return (
    <div className="border border-white/[0.06] rounded-xl p-5 mb-4">
      <p className="text-xs text-neutral-500 mb-4">能力値</p>
      <div
        className="w-full max-w-xs mx-auto rounded-xl animate-pulse"
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

  const tempAssets = TEMP_TYPE_ASSETS[typeId] ?? null;
  const resolvedCharacterImage =
    tempAssets?.characterImage ?? (type.characterImage || null);
  const traitBadge = tempAssets
    ? { image: tempAssets.traitBadgeImage, label: tempAssets.traitLabel }
    : null;

  const compatibleIds = computeCompatibleTypes(type, types);
  const conflictIds = computeConflictTypes(type, types);
  const typeNameMap = new Map(types.map((t) => [t.id, t.name]));
  const compatibleNames = compatibleIds.map((id) => typeNameMap.get(id) ?? id);
  const conflictNames = conflictIds.map((id) => typeNameMap.get(id) ?? id);

  const humanOsCommentBlock = type.humanOsComment ? (
    <div className="border-l-[2px] pl-4" style={{ borderColor: tc }}>
      <p className="text-xs text-neutral-600 mb-2">Human OS Comment</p>
      <p className="text-base text-neutral-300 italic leading-relaxed font-jp">
        {type.humanOsComment}
      </p>
    </div>
  ) : null;

  return (
    <main className="flex-1 bg-[#0d0f14] text-neutral-100 result-fade-in">
      <div className="max-w-2xl mx-auto px-5 py-10 w-full">

        {/* ── Identity Panel ────────────────────────────────────────────────── */}
        <section className="mb-8">
          {/* Header row */}
          <div className="flex items-start justify-between mb-5">
            <span className="text-xs font-mono tracking-[0.18em] text-neutral-700 uppercase">
              {meta.title}
            </span>
            <span className="text-xs font-mono text-neutral-700 tracking-widest shrink-0 ml-4">
              TYPE-{String(typeIndex).padStart(2, "0")}
            </span>
          </div>

          {/* Type name */}
          <div className="mb-5">
            <h1
              className="text-4xl md:text-5xl font-semibold text-white tracking-[0.05em] leading-tight font-zen"
            >
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

          {/* FV: with or without character image */}
          {resolvedCharacterImage ? (
            <>
              <div className="sm:grid sm:grid-cols-[1fr_200px] sm:gap-7 mb-6">
                <div className="mb-5 sm:mb-0">
                  {type.shareCatch && (
                    <p className="text-lg font-semibold text-neutral-100 leading-snug mb-3 font-jp">
                      {type.shareCatch}
                    </p>
                  )}
                  {type.catchCopy && (
                    <p className="text-sm text-neutral-500 leading-relaxed mb-4 font-jp">
                      {type.catchCopy}
                    </p>
                  )}
                  {traitBadge && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={traitBadge.image}
                      alt={traitBadge.label}
                      className="max-w-[180px] w-auto mt-2"
                    />
                  )}
                  {/* Human OS Comment: PC only (inside left column) */}
                  {humanOsCommentBlock && (
                    <div className="hidden sm:block mt-5">
                      {humanOsCommentBlock}
                    </div>
                  )}
                </div>
                {/* Character image: right column */}
                <div className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedCharacterImage}
                    alt={type.name}
                    className="w-full max-w-[240px] sm:max-w-none mx-auto rounded-lg object-cover"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                  />
                </div>
              </div>
              {/* Human OS Comment: mobile only (below image) */}
              {humanOsCommentBlock && (
                <div className="sm:hidden mb-6">{humanOsCommentBlock}</div>
              )}
            </>
          ) : (
            /* No character image: simple stack */
            <div className="mb-6">
              {type.shareCatch && (
                <p className="text-lg font-semibold text-neutral-100 leading-snug mb-3 font-jp">
                  {type.shareCatch}
                </p>
              )}
              {type.catchCopy && (
                <p className="text-sm text-neutral-500 leading-relaxed mb-4 font-jp">
                  {type.catchCopy}
                </p>
              )}
              {traitBadge && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={traitBadge.image}
                  alt={traitBadge.label}
                  className="max-w-[180px] w-auto mb-4"
                />
              )}
              {humanOsCommentBlock && (
                <div className="mt-5">{humanOsCommentBlock}</div>
              )}
            </div>
          )}
        </section>

        {/* ── 能力値 + スタイル傾向 (client) ──────────────────────────────── */}
        <Suspense fallback={<ScoreFallback typeColor={tc} />}>
          <ResultClient
            fallbackScores={type.representativeScores}
            typeColor={tc}
            styleAxesFallback={type.axes}
          />
        </Suspense>

        {/* ── あなたの社会人OS ─────────────────────────────────────────────── */}
        {(type.oneLine ?? type.osDescription) && (
          <section className="border-t border-white/[0.06] pt-8 mb-8">
            <p className="text-xs text-neutral-500 mb-4">あなたの社会人OS</p>
            {type.oneLine && (
              <p className="text-base font-semibold text-neutral-200 mb-3 leading-snug font-jp">
                {type.oneLine}
              </p>
            )}
            {type.osDescription && (
              <div className="border border-white/[0.06] rounded-xl p-5">
                <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line font-jp">
                  {type.osDescription}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── 強み・弱み ───────────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] pt-8 mb-8">
          <p className="text-xs text-neutral-500 mb-4">強み・弱み</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="border border-white/[0.06] rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-3">強み</p>
              <ul className="space-y-2">
                {type.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-neutral-300 flex gap-2 font-jp">
                    <span className="text-neutral-700 shrink-0">—</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-white/[0.06] rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-3">弱み</p>
              <ul className="space-y-2">
                {type.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-neutral-300 flex gap-2 font-jp">
                    <span className="text-neutral-700 shrink-0">—</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {type.fatalWeakness && (
            <div className="border border-red-900/40 bg-red-950/20 rounded-xl p-4">
              <p className="text-xs text-red-700/80 mb-2">致命的な弱点</p>
              <p className="text-sm text-red-400 leading-relaxed font-jp">{type.fatalWeakness}</p>
            </div>
          )}
        </section>

        {/* ── 自己成長 ─────────────────────────────────────────────────────── */}
        {(type.brokenEnvironment ?? (type.growthTips && type.growthTips.length > 0)) && (
          <section className="border-t border-white/[0.06] pt-8 mb-8">
            <p className="text-xs text-neutral-500 mb-4">自己成長</p>
            {type.brokenEnvironment && (
              <div className="border border-amber-800/30 bg-amber-950/20 rounded-xl p-4 mb-4">
                <p className="text-xs text-amber-700/80 mb-2">壊れる環境</p>
                <p className="text-sm text-amber-400 leading-relaxed font-jp">{type.brokenEnvironment}</p>
              </div>
            )}
            {type.growthTips && type.growthTips.length > 0 && (
              <div className="border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs text-neutral-500 mb-3">成長のヒント</p>
                <ul className="space-y-3">
                  {type.growthTips.map((tip, i) => (
                    <li key={i} className="text-sm text-neutral-400 flex gap-2 font-jp">
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
            <p className="text-xs text-neutral-500 mb-4">キャリア適性</p>
            {type.recommendedCareers && type.recommendedCareers.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-neutral-500 mb-3">向いている職種</p>
                <div className="flex flex-wrap gap-2">
                  {type.recommendedCareers.map((career, i) => (
                    <span
                      key={i}
                      className="text-xs text-neutral-400 bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-full font-jp"
                    >
                      {career}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {type.recommendedTasks && type.recommendedTasks.length > 0 && (
              <div className="border border-white/[0.06] rounded-xl p-4 mb-4">
                <p className="text-xs text-neutral-500 mb-3">向いている仕事</p>
                <ul className="space-y-2">
                  {type.recommendedTasks.map((task, i) => (
                    <li key={i} className="text-sm text-neutral-400 flex gap-2 font-jp">
                      <span className="text-neutral-700 shrink-0">—</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {type.notRecommendedWork && (
              <div className="border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs text-neutral-500 mb-2">避けた方がいい仕事</p>
                <p className="text-sm text-neutral-500 leading-relaxed font-jp">{type.notRecommendedWork}</p>
              </div>
            )}
          </section>
        )}

        {/* ── 人間関係 ─────────────────────────────────────────────────────── */}
        {(compatibleNames.length > 0 || conflictNames.length > 0) && (
          <section className="border-t border-white/[0.06] pt-8 mb-8">
            <p className="text-xs text-neutral-500 mb-4">人間関係</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {compatibleNames.length > 0 && (
                <div className="border border-white/[0.06] rounded-xl p-4">
                  <p className="text-xs text-neutral-500 mb-3">相性が良いタイプ</p>
                  <ul className="space-y-2">
                    {compatibleNames.map((name, i) => (
                      <li key={i} className="text-sm text-neutral-400 flex gap-2 font-jp">
                        <span className="text-green-600 shrink-0">◎</span>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {conflictNames.length > 0 && (
                <div className="border border-white/[0.06] rounded-xl p-4">
                  <p className="text-xs text-neutral-500 mb-3">ぶつかりやすいタイプ</p>
                  <ul className="space-y-2">
                    {conflictNames.map((name, i) => (
                      <li key={i} className="text-sm text-neutral-400 flex gap-2 font-jp">
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
            <p className="text-xs text-neutral-500 mb-4">チーム内での役割</p>
            <div className="border border-white/[0.06] rounded-xl p-5">
              <p className="text-sm text-neutral-400 leading-relaxed font-jp">{type.teamRole}</p>
            </div>
          </section>
        )}

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col gap-3">
          <Link
            href={`/diagnoses/${diagnosisId}/questions`}
            className="flex items-center justify-center gap-2 w-full border border-white/15 rounded-xl py-3.5 text-sm font-medium text-neutral-400 hover:border-white/30 hover:text-white transition-colors"
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
