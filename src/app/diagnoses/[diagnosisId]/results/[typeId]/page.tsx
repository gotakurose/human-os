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
    // TODO: Use person+background-only images — no text burned in.
    //       All 16 character images: unified framing, background, lighting.
    //       Type name / english name are rendered in UI, not embedded in image.
  } as { characterImage: string; traitBadgeImage: string; traitLabel: string },
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
    <div className="rounded-lg p-5 mb-4"
         style={{ background: "#1C1A16", border: "1px solid #2E2A24" }}>
      <p className="text-xs mb-4" style={{ color: "#8A8378" }}>能力値</p>
      <div
        className="w-full max-w-xs mx-auto rounded-lg animate-pulse"
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

  // ── Shared style shortcuts ────────────────────────────────────────────────
  const card = {
    className: "rounded-lg p-4",
    style: { background: "#1C1A16", border: "1px solid #2E2A24" },
  } as const;

  const cardP5 = {
    className: "rounded-lg p-5",
    style: { background: "#1C1A16", border: "1px solid #2E2A24" },
  } as const;

  return (
    <main
      className="flex-1 result-fade-in"
      style={{ background: "#14120F", color: "#EDE9E1" }}
    >
      <div className="max-w-2xl mx-auto px-5 py-10 w-full">

        {/* ── Identity Panel ────────────────────────────────────────────────── */}
        <section className="mb-8">

          {/* Header row */}
          <div className="flex items-start justify-between mb-5">
            <span
              className="text-xs font-mono tracking-[0.15em] uppercase"
              style={{ color: "#8A8378" }}
            >
              {meta.title}
            </span>
            <span
              className="text-xs font-mono tracking-[0.12em] shrink-0 ml-4"
              style={{ color: "#6B6560" }}
            >
              TYPE-{String(typeIndex).padStart(2, "0")}
            </span>
          </div>

          {/* Type name */}
          <div className="mb-5">
            <h1
              className="text-4xl md:text-5xl font-semibold leading-tight font-zen"
              style={{ color: "#EDE9E1", letterSpacing: "0.04em" }}
            >
              {type.name}
            </h1>
            {type.englishName && (
              <p
                className="text-sm tracking-[0.06em] mt-2 font-mono"
                style={{ color: `${tc}bb` }}
              >
                {type.englishName}
              </p>
            )}
          </div>

          {/* FV grid (character image present) */}
          {resolvedCharacterImage ? (
            <div className="sm:grid sm:grid-cols-[1fr_200px] sm:gap-7 mb-6">
              <div className="mb-5 sm:mb-0">
                {type.shareCatch && (
                  <p
                    className="text-lg font-semibold leading-snug mb-3 font-jp"
                    style={{ color: "#EDE9E1" }}
                  >
                    {type.shareCatch}
                  </p>
                )}
                {type.catchCopy && (
                  <p
                    className="text-sm leading-relaxed font-jp"
                    style={{ color: "#8A8378" }}
                  >
                    {type.catchCopy}
                  </p>
                )}
              </div>

              {/* Character image + badge overlay */}
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvedCharacterImage}
                  alt={type.name}
                  className="w-full max-w-[240px] sm:max-w-none mx-auto rounded-lg object-cover"
                  style={{ border: "1px solid #2E2A24" }}
                />
                {/* Badge: small overlay bottom-right */}
                {traitBadge && (
                  <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={traitBadge.image}
                      alt={traitBadge.label}
                      className="w-[56px] sm:w-[72px] h-auto opacity-85"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* No character image: simple stack */
            <div className="mb-6">
              {type.shareCatch && (
                <p
                  className="text-lg font-semibold leading-snug mb-3 font-jp"
                  style={{ color: "#EDE9E1" }}
                >
                  {type.shareCatch}
                </p>
              )}
              {type.catchCopy && (
                <p
                  className="text-sm leading-relaxed mb-4 font-jp"
                  style={{ color: "#8A8378" }}
                >
                  {type.catchCopy}
                </p>
              )}
              {/* Badge inline when no character image */}
              {traitBadge && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={traitBadge.image}
                  alt={traitBadge.label}
                  className="w-[72px] sm:w-[88px] h-auto mb-4 opacity-85"
                />
              )}
            </div>
          )}
        </section>

        {/* ── 解析コメント (Human OS Comment — outside FV) ─────────────────── */}
        {type.humanOsComment && (
          <section className="mb-8">
            <div className="pl-4" style={{ borderLeft: `2px solid ${tc}55` }}>
              <p
                className="text-xs mb-2 tracking-[0.06em]"
                style={{ color: "#6B6560" }}
              >
                解析コメント
              </p>
              <p
                className="text-base italic leading-relaxed font-jp"
                style={{ color: "#C8C3BB" }}
              >
                {type.humanOsComment}
              </p>
            </div>
          </section>
        )}

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
          <section
            className="pt-8 mb-8"
            style={{ borderTop: "1px solid #2E2A24" }}
          >
            <p className="text-xs mb-4 tracking-[0.06em]" style={{ color: "#8A8378" }}>
              あなたの社会人OS
            </p>
            {type.oneLine && (
              <p
                className="text-base font-semibold mb-3 leading-snug font-jp"
                style={{ color: "#D4CFC6" }}
              >
                {type.oneLine}
              </p>
            )}
            {type.osDescription && (
              <div {...cardP5}>
                <p
                  className="text-sm leading-relaxed whitespace-pre-line font-jp"
                  style={{ color: "#8A8378" }}
                >
                  {type.osDescription}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── 強み・弱み ───────────────────────────────────────────────────── */}
        <section
          className="pt-8 mb-8"
          style={{ borderTop: "1px solid #2E2A24" }}
        >
          <p className="text-xs mb-4 tracking-[0.06em]" style={{ color: "#8A8378" }}>
            強み・弱み
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div {...card}>
              <p className="text-xs mb-3 tracking-[0.05em]" style={{ color: "#8A8378" }}>強み</p>
              <ul className="space-y-2">
                {type.strengths.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2 font-jp" style={{ color: "#B8B3AB" }}>
                    <span className="shrink-0" style={{ color: "#4A4540" }}>—</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div {...card}>
              <p className="text-xs mb-3 tracking-[0.05em]" style={{ color: "#8A8378" }}>弱み</p>
              <ul className="space-y-2">
                {type.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm flex gap-2 font-jp" style={{ color: "#B8B3AB" }}>
                    <span className="shrink-0" style={{ color: "#4A4540" }}>—</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {type.fatalWeakness && (
            <div
              className="rounded-lg p-4"
              style={{ border: "1px solid #6B2E2A", background: "#1E0F0E" }}
            >
              <p className="text-xs mb-2 tracking-[0.05em]" style={{ color: "#B5544A" }}>
                致命的な弱点
              </p>
              <p className="text-sm leading-relaxed font-jp" style={{ color: "#D4A09B" }}>
                {type.fatalWeakness}
              </p>
            </div>
          )}
        </section>

        {/* ── 自己成長 ─────────────────────────────────────────────────────── */}
        {(type.brokenEnvironment ?? (type.growthTips && type.growthTips.length > 0)) && (
          <section
            className="pt-8 mb-8"
            style={{ borderTop: "1px solid #2E2A24" }}
          >
            <p className="text-xs mb-4 tracking-[0.06em]" style={{ color: "#8A8378" }}>
              自己成長
            </p>
            {type.brokenEnvironment && (
              <div
                className="rounded-lg p-4 mb-3"
                style={{ border: "1px solid #6B4523", background: "#1C1108" }}
              >
                <p className="text-xs mb-2 tracking-[0.05em]" style={{ color: "#B87A3D" }}>
                  壊れる環境
                </p>
                <p className="text-sm leading-relaxed font-jp" style={{ color: "#D4B08C" }}>
                  {type.brokenEnvironment}
                </p>
              </div>
            )}
            {type.growthTips && type.growthTips.length > 0 && (
              <div {...card}>
                <p className="text-xs mb-3 tracking-[0.05em]" style={{ color: "#8A8378" }}>
                  成長のヒント
                </p>
                <ul className="space-y-3">
                  {type.growthTips.map((tip, i) => (
                    <li key={i} className="text-sm flex gap-2 font-jp" style={{ color: "#8A8378" }}>
                      <span className="shrink-0 font-mono" style={{ color: "#4A4540" }}>{i + 1}.</span>
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
          <section
            className="pt-8 mb-8"
            style={{ borderTop: "1px solid #2E2A24" }}
          >
            <p className="text-xs mb-4 tracking-[0.06em]" style={{ color: "#8A8378" }}>
              キャリア適性
            </p>
            {type.recommendedCareers && type.recommendedCareers.length > 0 && (
              <div className="mb-4">
                <p className="text-xs mb-3 tracking-[0.05em]" style={{ color: "#8A8378" }}>
                  向いている職種
                </p>
                <div className="flex flex-wrap gap-2">
                  {type.recommendedCareers.map((career, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-full font-jp"
                      style={{
                        background: "#1C1A16",
                        border: "1px solid #2E2A24",
                        color: "#8A8378",
                      }}
                    >
                      {career}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {type.recommendedTasks && type.recommendedTasks.length > 0 && (
              <div {...card} className="rounded-lg p-4 mb-3">
                <p className="text-xs mb-3 tracking-[0.05em]" style={{ color: "#8A8378" }}>
                  向いている仕事
                </p>
                <ul className="space-y-2">
                  {type.recommendedTasks.map((task, i) => (
                    <li key={i} className="text-sm flex gap-2 font-jp" style={{ color: "#8A8378" }}>
                      <span className="shrink-0" style={{ color: "#4A4540" }}>—</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {type.notRecommendedWork && (
              <div {...card}>
                <p className="text-xs mb-2 tracking-[0.05em]" style={{ color: "#8A8378" }}>
                  避けた方がいい仕事
                </p>
                <p className="text-sm leading-relaxed font-jp" style={{ color: "#6B6560" }}>
                  {type.notRecommendedWork}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── 人間関係 ─────────────────────────────────────────────────────── */}
        {(compatibleNames.length > 0 || conflictNames.length > 0) && (
          <section
            className="pt-8 mb-8"
            style={{ borderTop: "1px solid #2E2A24" }}
          >
            <p className="text-xs mb-4 tracking-[0.06em]" style={{ color: "#8A8378" }}>
              人間関係
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {compatibleNames.length > 0 && (
                <div {...card}>
                  <p className="text-xs mb-3 tracking-[0.05em]" style={{ color: "#8A8378" }}>
                    相性が良いタイプ
                  </p>
                  <ul className="space-y-2">
                    {compatibleNames.map((name, i) => (
                      <li key={i} className="text-sm flex gap-2 font-jp" style={{ color: "#8A8378" }}>
                        <span className="shrink-0" style={{ color: "#4E7A5A" }}>◎</span>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {conflictNames.length > 0 && (
                <div {...card}>
                  <p className="text-xs mb-3 tracking-[0.05em]" style={{ color: "#8A8378" }}>
                    ぶつかりやすいタイプ
                  </p>
                  <ul className="space-y-2">
                    {conflictNames.map((name, i) => (
                      <li key={i} className="text-sm flex gap-2 font-jp" style={{ color: "#8A8378" }}>
                        <span className="shrink-0" style={{ color: "#7A4E4E" }}>△</span>
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
          <section
            className="pt-8 mb-8"
            style={{ borderTop: "1px solid #2E2A24" }}
          >
            <p className="text-xs mb-4 tracking-[0.06em]" style={{ color: "#8A8378" }}>
              チーム内での役割
            </p>
            <div {...cardP5}>
              <p className="text-sm leading-relaxed font-jp" style={{ color: "#8A8378" }}>
                {type.teamRole}
              </p>
            </div>
          </section>
        )}

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="pt-8 flex flex-col gap-3" style={{ borderTop: "1px solid #2E2A24" }}>
          <Link
            href={`/diagnoses/${diagnosisId}/questions`}
            className="flex items-center justify-center gap-2 w-full rounded-lg py-3.5 text-sm font-medium transition-colors"
            style={{
              border: "1px solid #3E3A33",
              color: "#8A8378",
            }}
          >
            <RotateCcw size={14} />
            もう一度診断する
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full text-sm py-2 transition-colors"
            style={{ color: "#4A4540" }}
          >
            <Home size={14} />
            トップへ戻る
          </Link>
        </div>

      </div>
    </main>
  );
}
