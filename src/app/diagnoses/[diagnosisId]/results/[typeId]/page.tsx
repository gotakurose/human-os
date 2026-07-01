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
    // TODO: Replace with per-type portrait images — person + background only,
    //       no text burned in. Type name & label are rendered by UI, not in image.
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

// ── Shared shorthand helpers ──────────────────────────────────────────────────

const DL = "1px solid var(--dossier-line)";         // main ruled line
const DLS = "1px solid var(--dossier-line-soft)";  // soft divider

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-mono-doc tracking-[0.14em] mb-4"
      style={{ color: "var(--dossier-gold)" }}
    >
      {children}
    </p>
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
  const typeNo = String(typeIndex).padStart(2, "0");
  const dossierNo = String(typeIndex).padStart(3, "0");
  const tc = type.character.color;

  const tempAssets = TEMP_TYPE_ASSETS[typeId] ?? null;
  const resolvedCharacterImage = tempAssets?.characterImage ?? (type.characterImage || null);
  const traitBadge = tempAssets
    ? { image: tempAssets.traitBadgeImage, label: tempAssets.traitLabel }
    : null;

  const compatibleIds = computeCompatibleTypes(type, types);
  const conflictIds = computeConflictTypes(type, types);
  const typeNameMap = new Map(types.map((t) => [t.id, t.name]));
  const compatibleNames = compatibleIds.map((id) => typeNameMap.get(id) ?? id);
  const conflictNames = conflictIds.map((id) => typeNameMap.get(id) ?? id);

  // ── Portrait JSX — reused on mobile (inside heading) and PC (left col) ───
  const portraitInner = (
    <>
      <div
        className="relative overflow-hidden"
        style={{
          border: DL,
          aspectRatio: "3/4",
          background: "var(--dossier-surface)",
        }}
      >
        {resolvedCharacterImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedCharacterImage}
            alt={`${type.name} 肖像`}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          /* Placeholder portrait frame */
          <div
            className="w-full h-full flex items-end justify-start p-3"
            style={{ background: "var(--dossier-paper)" }}
          >
            <span
              className="text-[9px] font-mono-doc tracking-[0.2em]"
              style={{ color: "var(--dossier-line)" }}
            >
              PORTRAIT
            </span>
          </div>
        )}
        {/* Trait badge — small certification stamp, bottom-right */}
        {traitBadge && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={traitBadge.image}
            alt={traitBadge.label}
            className="absolute bottom-2 right-2 w-10 h-auto opacity-75"
          />
        )}
        {/* Type colour accent — thin left border stripe */}
        <div
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: tc, opacity: 0.6 }}
        />
      </div>
      {/* Portrait caption */}
      <div
        className="flex items-center justify-between mt-1.5 px-0.5"
        style={{ borderTop: "1px solid var(--dossier-line-soft)", paddingTop: "4px" }}
      >
        <span
          className="text-[9px] font-mono-doc tracking-[0.18em]"
          style={{ color: "var(--dossier-muted)" }}
        >
          肖像 / Portrait
        </span>
        {traitBadge && (
          <span
            className="text-[9px] font-mono-doc"
            style={{ color: "var(--dossier-gold)" }}
          >
            {traitBadge.label}
          </span>
        )}
      </div>
    </>
  );

  return (
    <main
      className="dossier-page flex-1 result-fade-in"
      style={{ color: "var(--dossier-ink)" }}
    >
      <div className="max-w-2xl mx-auto px-5 w-full">

        {/* ── Dossier header bar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between py-4">
          <span
            className="text-[11px] font-jp"
            style={{ color: "var(--dossier-muted)" }}
          >
            {meta.title}
          </span>
          <span
            className="text-[11px] font-mono-doc tracking-[0.12em]"
            style={{ color: "var(--dossier-gold)" }}
          >
            No. {dossierNo}
          </span>
        </div>

        {/* ── FV: Identity + Portrait ────────────────────────────────────── */}
        <section style={{ borderTop: DL, borderBottom: DL, paddingTop: "1.75rem", paddingBottom: "1.75rem" }}>

          {/* PC layout: CSS grid [portrait | identity] */}
          <div className="sm:grid sm:gap-8" style={{ gridTemplateColumns: "200px 1fr" }}>

            {/* Portrait — PC left column (hidden on mobile) */}
            <div className="hidden sm:block">
              {portraitInner}
            </div>

            {/* Identity column */}
            <div>
              {/* TYPE label */}
              <p
                className="text-[10px] font-mono-doc tracking-[0.18em] mb-2"
                style={{ color: "var(--dossier-gold)" }}
              >
                TYPE-{typeNo}
              </p>

              {/* Type name */}
              <h1
                className="font-zen leading-tight mb-1"
                style={{
                  fontSize: "clamp(2rem, 8vw, 3rem)",
                  color: "var(--dossier-ink)",
                  letterSpacing: "0.04em",
                }}
              >
                {type.name}
              </h1>

              {/* English name */}
              {type.englishName && (
                <p
                  className="font-serif-en italic mb-5"
                  style={{ fontSize: "1.1rem", color: "var(--dossier-sub)" }}
                >
                  {type.englishName}
                </p>
              )}

              {/* Portrait — mobile (shown below name, hidden on PC) */}
              <div className="sm:hidden mb-5 max-w-[200px]">
                {portraitInner}
              </div>

              {/* Divider between name and description */}
              <div className="mb-4" style={{ borderTop: DLS }} />

              {/* Catch copy */}
              {type.shareCatch && (
                <p
                  className="font-jp font-medium leading-snug mb-2"
                  style={{ fontSize: "1rem", color: "var(--dossier-ink)" }}
                >
                  {type.shareCatch}
                </p>
              )}

              {/* Description */}
              {type.catchCopy && (
                <p
                  className="font-jp leading-relaxed"
                  style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
                >
                  {type.catchCopy}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── 解析コメント ───────────────────────────────────────────────── */}
        {type.humanOsComment && (
          <section
            className="py-6"
            style={{ borderBottom: DL }}
          >
            <SectionLabel>解析コメント</SectionLabel>
            <div
              className="pl-3"
              style={{ borderLeft: "2px solid rgba(140,122,75,0.35)" }}
            >
              <p
                className="font-jp leading-relaxed"
                style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
              >
                {type.humanOsComment}
              </p>
            </div>
          </section>
        )}

        {/* ── 能力値 + スタイル傾向 (client) ───────────────────────────── */}
        <Suspense
          fallback={
            <div className="py-10 text-center">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                style={{
                  borderColor: "var(--dossier-line)",
                  borderTopColor: "var(--dossier-gold)",
                }}
              />
            </div>
          }
        >
          <ResultClient
            fallbackScores={type.representativeScores}
            typeColor={tc}
            styleAxesFallback={type.axes}
          />
        </Suspense>

        {/* ── あなたの社会人OS ────────────────────────────────────────────── */}
        {(type.oneLine ?? type.osDescription) && (
          <section className="py-7" style={{ borderBottom: DL }}>
            <SectionLabel>社会人 OS</SectionLabel>
            {type.oneLine && (
              <p
                className="font-jp font-medium leading-snug mb-3"
                style={{ fontSize: "1rem", color: "var(--dossier-ink)" }}
              >
                {type.oneLine}
              </p>
            )}
            {type.osDescription && (
              <p
                className="font-jp leading-relaxed whitespace-pre-line"
                style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
              >
                {type.osDescription}
              </p>
            )}
          </section>
        )}

        {/* ── 強み・弱み ─────────────────────────────────────────────────── */}
        <section className="py-7" style={{ borderBottom: DL }}>
          <SectionLabel>強み・弱み</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* 強み */}
            <div>
              <p
                className="text-xs font-mono-doc mb-3 tracking-[0.06em]"
                style={{ color: "var(--dossier-muted)" }}
              >
                強み
              </p>
              <ul className="space-y-2">
                {type.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className="shrink-0 text-xs mt-0.5"
                      style={{ color: "var(--dossier-gold)" }}
                    >
                      ◦
                    </span>
                    <span
                      className="font-jp leading-relaxed"
                      style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
                    >
                      {s}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* 弱み */}
            <div>
              <p
                className="text-xs font-mono-doc mb-3 tracking-[0.06em]"
                style={{ color: "var(--dossier-muted)" }}
              >
                弱み
              </p>
              <ul className="space-y-2">
                {type.weaknesses.map((w, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className="shrink-0 text-xs mt-0.5"
                      style={{ color: "var(--dossier-muted)" }}
                    >
                      ◦
                    </span>
                    <span
                      className="font-jp leading-relaxed"
                      style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
                    >
                      {w}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 致命的な弱点 — red annotation */}
          {type.fatalWeakness && (
            <div
              className="mt-2 p-4"
              style={{
                background: "var(--dossier-red-bg)",
                borderLeft: "3px solid var(--dossier-red-line)",
              }}
            >
              <p
                className="text-[10px] font-mono-doc mb-1.5 tracking-[0.06em]"
                style={{ color: "var(--dossier-red-line)" }}
              >
                致命的な弱点
              </p>
              <p
                className="font-jp leading-relaxed"
                style={{ fontSize: "0.875rem", color: "var(--dossier-red-text)" }}
              >
                {type.fatalWeakness}
              </p>
            </div>
          )}
        </section>

        {/* ── 自己成長 ───────────────────────────────────────────────────── */}
        {(type.brokenEnvironment ?? (type.growthTips && type.growthTips.length > 0)) && (
          <section className="py-7" style={{ borderBottom: DL }}>
            <SectionLabel>自己成長</SectionLabel>

            {/* 壊れる環境 — orange annotation */}
            {type.brokenEnvironment && (
              <div
                className="mb-4 p-4"
                style={{
                  background: "var(--dossier-orange-bg)",
                  borderLeft: "3px solid var(--dossier-orange-line)",
                }}
              >
                <p
                  className="text-[10px] font-mono-doc mb-1.5 tracking-[0.06em]"
                  style={{ color: "var(--dossier-orange-line)" }}
                >
                  壊れる環境
                </p>
                <p
                  className="font-jp leading-relaxed"
                  style={{ fontSize: "0.875rem", color: "var(--dossier-orange-text)" }}
                >
                  {type.brokenEnvironment}
                </p>
              </div>
            )}

            {/* 成長ヒント */}
            {type.growthTips && type.growthTips.length > 0 && (
              <div>
                <p
                  className="text-xs font-mono-doc mb-3 tracking-[0.06em]"
                  style={{ color: "var(--dossier-muted)" }}
                >
                  成長のヒント
                </p>
                <ol className="space-y-3">
                  {type.growthTips.map((tip, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className="shrink-0 font-mono-doc text-xs mt-0.5 w-4"
                        style={{ color: "var(--dossier-gold)" }}
                      >
                        {i + 1}.
                      </span>
                      <span
                        className="font-jp leading-relaxed"
                        style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
                      >
                        {tip}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {/* ── キャリア適性 ───────────────────────────────────────────────── */}
        {(type.recommendedCareers ?? type.recommendedTasks ?? type.notRecommendedWork) && (
          <section className="py-7" style={{ borderBottom: DL }}>
            <SectionLabel>キャリア適性</SectionLabel>

            {type.recommendedCareers && type.recommendedCareers.length > 0 && (
              <div className="mb-5">
                <p
                  className="text-xs font-mono-doc mb-3 tracking-[0.05em]"
                  style={{ color: "var(--dossier-muted)" }}
                >
                  向いている職種
                </p>
                <div className="flex flex-wrap gap-2">
                  {type.recommendedCareers.map((career, i) => (
                    <span
                      key={i}
                      className="text-xs font-jp px-3 py-1"
                      style={{
                        border: "1px solid var(--dossier-line)",
                        background: "var(--dossier-surface)",
                        color: "var(--dossier-sub)",
                      }}
                    >
                      {career}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {type.recommendedTasks && type.recommendedTasks.length > 0 && (
              <div className="mb-4">
                <p
                  className="text-xs font-mono-doc mb-3 tracking-[0.05em]"
                  style={{ color: "var(--dossier-muted)" }}
                >
                  向いている仕事
                </p>
                <ul className="space-y-2">
                  {type.recommendedTasks.map((task, i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        className="shrink-0 text-xs mt-0.5"
                        style={{ color: "var(--dossier-gold)" }}
                      >
                        ◦
                      </span>
                      <span
                        className="font-jp leading-relaxed"
                        style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
                      >
                        {task}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {type.notRecommendedWork && (
              <div>
                <p
                  className="text-xs font-mono-doc mb-2 tracking-[0.05em]"
                  style={{ color: "var(--dossier-muted)" }}
                >
                  避けた方がいい仕事
                </p>
                <p
                  className="font-jp leading-relaxed"
                  style={{ fontSize: "0.875rem", color: "var(--dossier-muted)" }}
                >
                  {type.notRecommendedWork}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── 人間関係 ───────────────────────────────────────────────────── */}
        {(compatibleNames.length > 0 || conflictNames.length > 0) && (
          <section className="py-7" style={{ borderBottom: DL }}>
            <SectionLabel>人間関係</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {compatibleNames.length > 0 && (
                <div>
                  <p
                    className="text-xs font-mono-doc mb-3 tracking-[0.05em]"
                    style={{ color: "var(--dossier-muted)" }}
                  >
                    相性が良いタイプ
                  </p>
                  <ul className="space-y-1.5">
                    {compatibleNames.map((name, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-xs" style={{ color: "#4A7A58" }}>◎</span>
                        <span
                          className="font-jp"
                          style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
                        >
                          {name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {conflictNames.length > 0 && (
                <div>
                  <p
                    className="text-xs font-mono-doc mb-3 tracking-[0.05em]"
                    style={{ color: "var(--dossier-muted)" }}
                  >
                    ぶつかりやすいタイプ
                  </p>
                  <ul className="space-y-1.5">
                    {conflictNames.map((name, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-xs" style={{ color: "#8A5050" }}>△</span>
                        <span
                          className="font-jp"
                          style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
                        >
                          {name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── チーム内での役割 ────────────────────────────────────────────── */}
        {type.teamRole && (
          <section className="py-7" style={{ borderBottom: DL }}>
            <SectionLabel>チーム内での役割</SectionLabel>
            <p
              className="font-jp leading-relaxed"
              style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
            >
              {type.teamRole}
            </p>
          </section>
        )}

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="py-10 flex flex-col gap-3">
          <Link
            href={`/diagnoses/${diagnosisId}/questions`}
            className="flex items-center justify-center gap-2 w-full py-4 text-sm font-jp font-medium transition-opacity hover:opacity-80"
            style={{
              background: "var(--dossier-dark)",
              color: "var(--dossier-bg)",
            }}
          >
            <RotateCcw size={14} />
            もう一度診断する
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full text-sm py-2 font-jp transition-opacity hover:opacity-70"
            style={{ color: "var(--dossier-muted)" }}
          >
            <Home size={14} />
            トップへ戻る
          </Link>
        </div>

      </div>
    </main>
  );
}
