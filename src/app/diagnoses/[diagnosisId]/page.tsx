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

// Per-diagnosis hero config — add entries as new diagnoses are created
const DIAGNOSIS_HERO: Record<string, {
  heroImage: string;
  displayTitle: string;
  subtitle: string;
  ctaLabel: string;
  tagline: string;
  features?: {
    heading: string;
    lead: string;
    items: { title: string; body: string }[];
  };
}> = {
  "business-skills": {
    heroImage: "/images/diagnoses/business-skills/hero-top-temp.png",
    displayTitle: "ビジマル診断",
    subtitle: "40問であなたのビジネスアニマル16タイプを判定します。",
    ctaLabel: "診断を受ける",
    tagline: "BIZMARU SHINDAN",
    features: {
      heading: "この診断でわかること",
      lead: "ビジネスアニマル16タイプと4つのスタイル傾向から、あなたの社会人OSを読み解きます。",
      items: [
        {
          title: "ビジネスアニマル16タイプ",
          body: "仕事で出やすい思考・行動パターンを16タイプで判定。",
        },
        {
          title: "タイプ鑑定書",
          body: "強み・弱み・キャリア・成長ヒント・結論など21項目のタイプ詳細を表示。",
        },
        {
          title: "4つのスタイル傾向",
          body: "思考型/行動型、攻め型/安定型など、働き方の軸を分析。",
        },
        {
          title: "強みと成長ヒント",
          body: "強み・弱み・向いている役割・相性まで、鑑定書として表示。",
        },
      ],
    },
  },
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
  const hero = DIAGNOSIS_HERO[diagnosisId] ?? null;

  const DL  = "1px solid var(--dossier-line)";
  const DLS = "1px solid var(--dossier-line-soft)";

  // ── Business-skills (and future hero-enabled diagnoses) ─────────────────
  if (hero) {
    return (
      <main style={{ color: "var(--dossier-ink)" }}>

        {/* ── Hero section — center aligned ─────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{
            minHeight: "70vh",
            backgroundColor: "var(--dossier-dark)",
          }}
        >
          {/* Background image via CSS — fails silently if file absent */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${hero.heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
            }}
          />

          {/* Gradient overlay — subtle overall + stronger at bottom for text */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.36) 100%)",
            }}
          />

          {/* Navigation — top left */}
          <Link
            href="/"
            className="absolute top-6 left-6 z-20 text-xs font-jp transition-opacity hover:opacity-70"
            style={{ color: "rgba(245,243,239,0.70)" }}
          >
            ← トップへ
          </Link>

          {/* Hero content — centered, pinned to bottom */}
          <div className="absolute inset-x-0 bottom-[10%] md:bottom-[12%] z-10">
            <div className="max-w-4xl mx-auto px-6 md:px-10 text-center">
              <p
                className="font-mono-doc tracking-[0.32em] mb-5"
                style={{ fontSize: "0.6875rem", color: "rgba(184,160,106,0.85)" }}
              >
                {hero.tagline}
              </p>
              <h1
                className="font-heading leading-[0.95] tracking-[0.04em] mb-6"
                style={{
                  fontSize: "clamp(3.4rem, 8vw, 6.4rem)",
                  fontWeight: 700,
                  color: "#F5F3EF",
                }}
              >
                {hero.displayTitle}
              </h1>
              <p
                className="font-jp leading-[1.9] mb-10 mx-auto"
                style={{
                  fontSize: "clamp(0.9375rem, 1.8vw, 1.0625rem)",
                  color: "rgba(245,243,239,0.82)",
                  maxWidth: "30rem",
                }}
              >
                {hero.subtitle}
              </p>
              <div className="flex justify-center">
                <Link
                  href={`/diagnoses/${diagnosisId}/questions`}
                  className="w-full max-w-[320px] md:w-[320px] h-14 md:h-[60px] flex items-center justify-center gap-2 font-jp font-semibold transition-opacity hover:opacity-85"
                  style={{
                    background: "var(--dossier-dark)",
                    border: "1px solid rgba(140,122,75,0.45)",
                    color: "var(--dossier-bg)",
                    fontSize: "0.9375rem",
                  }}
                >
                  {hero.ctaLabel}
                  <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── この診断でわかること ──────────────────────────────────── */}
        {hero.features && (
          <div className="dossier-page">
            <section className="max-w-5xl mx-auto px-6 md:px-10 py-20 md:py-28">

              {/* Section heading */}
              <div className="text-center mb-14 md:mb-16">
                <h2
                  className="font-heading leading-[1.25] mb-5"
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 3rem)",
                    color: "var(--dossier-ink)",
                  }}
                >
                  {hero.features.heading}
                </h2>
                <p
                  className="font-jp leading-[2] mx-auto"
                  style={{
                    fontSize: "clamp(0.875rem, 1.6vw, 1rem)",
                    color: "var(--dossier-sub)",
                    maxWidth: "36rem",
                  }}
                >
                  {hero.features.lead}
                </p>
              </div>

              {/* Feature blocks — 2 col on PC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {hero.features.items.map(({ title, body }) => (
                  <div
                    key={title}
                    className="p-6 md:p-8"
                    style={{
                      border: "1px solid var(--dossier-line)",
                      borderRadius: "6px",
                      background: "rgba(252,251,249,0.72)",
                    }}
                  >
                    <p
                      className="font-jp font-semibold mb-3"
                      style={{
                        fontSize: "clamp(1rem, 1.8vw, 1.125rem)",
                        color: "var(--dossier-ink)",
                      }}
                    >
                      {title}
                    </p>
                    <p
                      className="font-jp leading-[1.9]"
                      style={{
                        fontSize: "clamp(0.8125rem, 1.4vw, 0.9375rem)",
                        color: "var(--dossier-sub)",
                      }}
                    >
                      {body}
                    </p>
                  </div>
                ))}
              </div>

            </section>
          </div>
        )}

      </main>
    );
  }

  // ── Generic layout — for diagnoses without a hero config ────────────────
  return (
    <main
      className="dossier-page flex-1 px-5 py-10 max-w-2xl mx-auto w-full"
      style={{ color: "var(--dossier-ink)" }}
    >
      <Link
        href="/"
        className="text-xs font-jp transition-opacity hover:opacity-60 mb-10 inline-block"
        style={{ color: "var(--dossier-muted)" }}
      >
        ← トップへ
      </Link>

      <div className="mb-6" style={{ borderBottom: DL, paddingBottom: "0.75rem" }}>
        <p
          className="text-[10px] font-mono-doc tracking-[0.15em]"
          style={{ color: "var(--dossier-gold)" }}
        >
          解析申請書
        </p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <span
          className="text-[11px] font-jp px-2.5 py-0.5"
          style={{ border: DL, background: "var(--dossier-surface)", color: "var(--dossier-sub)" }}
        >
          {meta.category}
        </span>
        <span className="text-[11px] font-mono-doc" style={{ color: "var(--dossier-muted)" }}>
          約 {meta.estimatedMinutes} 分
        </span>
      </div>

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

      <p
        className="font-jp leading-relaxed mb-8"
        style={{ fontSize: "0.875rem", color: "var(--dossier-sub)" }}
      >
        {meta.description}
      </p>

      <div className="mb-6" style={{ border: DL }}>
        <div className="px-4 py-2" style={{ borderBottom: DLS, background: "var(--dossier-paper)" }}>
          <p className="text-[10px] font-mono-doc tracking-[0.12em]" style={{ color: "var(--dossier-gold)" }}>
            解析仕様
          </p>
        </div>
        {[
          { label: "質問数",   value: `${meta.questionCount} 問` },
          { label: "タイプ数", value: `${meta.typeCount} タイプ` },
          { label: "診断方式", value: "4スタイル軸" },
        ].map(({ label, value }, i) => (
          <div
            key={i}
            className="flex justify-between items-baseline px-4 py-3 text-sm"
            style={{ borderTop: i === 0 ? undefined : DLS }}
          >
            <span className="font-jp" style={{ color: "var(--dossier-muted)" }}>{label}</span>
            <span className="font-mono-doc" style={{ color: "var(--dossier-ink)", fontSize: "0.875rem" }}>{value}</span>
          </div>
        ))}
      </div>

      {axes.length > 0 && (
        <div className="mb-8" style={{ borderTop: DL, paddingTop: "1.25rem" }}>
          <p className="text-[10px] font-mono-doc tracking-[0.12em] mb-3" style={{ color: "var(--dossier-gold)" }}>
            評価軸
          </p>
          <div className="flex flex-wrap gap-2">
            {axes.map((axis) => (
              <span
                key={axis}
                className="text-xs font-jp px-3 py-1"
                style={{ border: DL, background: "var(--dossier-surface)", color: "var(--dossier-sub)" }}
              >
                {AXIS_LABELS[axis] ?? axis}
              </span>
            ))}
          </div>
        </div>
      )}

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
