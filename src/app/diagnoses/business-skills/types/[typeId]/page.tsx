import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { loadTypes, loadFixedCopy } from "@/lib/data-loader";
import { TYPE_DISPLAY_ASSETS } from "@/app/diagnoses/[diagnosisId]/results/[typeId]/result-assets";

const QUESTIONS_URL = "/diagnoses/business-skills/questions";
const TYPES_URL = "/diagnoses/business-skills/types";

type Props = { params: Promise<{ typeId: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(TYPE_DISPLAY_ASSETS).map((typeId) => ({ typeId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { typeId } = await params;
  const types = loadTypes("business-skills");
  const type = types.find((t) => t.id === typeId);
  if (!type) return {};
  const assets = TYPE_DISPLAY_ASSETS[typeId];
  const displayEn = assets?.displayEnglishName ?? type.englishName ?? "";

  return {
    title: `${type.name}（${displayEn}）| ビジマル診断`,
    description: type.shortDescription ?? type.detail,
    robots: { index: true, follow: true },
    openGraph: {
      title: `${type.name} — ${displayEn}`,
      description: type.shortDescription ?? type.detail,
      ...(assets?.characterImage ? { images: [assets.characterImage] } : {}),
    },
  };
}

export default async function TypeDetailPage({ params }: Props) {
  const { typeId } = await params;

  const types = loadTypes("business-skills");
  const fixedCopy = loadFixedCopy("business-skills");

  const type = types.find((t) => t.id === typeId);
  if (!type) notFound();

  const assets = TYPE_DISPLAY_ASSETS[typeId];
  if (!assets) notFound();

  const fc = fixedCopy.types.find((f) => f.typeId === typeId);
  if (!fc) notFound();

  return (
    <main className="dossier-page flex-1" style={{ color: "#21160D", minHeight: "100vh" }}>
      <div className="max-w-[1040px] mx-auto px-5 md:px-7 lg:px-8 pt-10 pb-24">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 flex-wrap">
          <Link
            href="/diagnoses/business-skills"
            className="text-xs font-jp transition-opacity hover:opacity-60"
            style={{ color: "rgba(33,22,13,0.44)" }}
          >
            ビジマル診断
          </Link>
          <span className="text-xs" style={{ color: "rgba(33,22,13,0.22)" }}>/</span>
          <Link
            href={TYPES_URL}
            className="text-xs font-jp transition-opacity hover:opacity-60"
            style={{ color: "rgba(33,22,13,0.44)" }}
          >
            16タイプ図鑑
          </Link>
        </nav>

        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-14 mb-20">

          {/* Character image */}
          <div
            className="w-full md:w-[200px] shrink-0 self-start"
            style={{
              background: "rgba(244,240,231,0.50)",
              borderRadius: "4px",
              overflow: "hidden",
              maxHeight: "320px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assets.characterImage}
              alt={type.name}
              className="w-full h-auto object-contain block"
              style={{ maxHeight: "320px", objectPosition: "bottom" }}
            />
          </div>

          {/* Type info */}
          <div className="flex flex-col justify-end flex-1 pb-1">

            {/* Animal type */}
            <p
              className="font-mono-doc mb-3"
              style={{ fontSize: "10px", letterSpacing: "0.18em", color: "rgba(111,85,44,0.65)" }}
            >
              {assets.animalType}
            </p>

            {/* English name */}
            <p
              className="font-heading tracking-[0.05em] mb-1"
              style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "rgba(33,22,13,0.38)" }}
            >
              {assets.displayEnglishName}
            </p>

            {/* Japanese name */}
            <h1
              className="font-heading tracking-[0.02em] mb-5"
              style={{ fontSize: "clamp(2rem, 5.5vw, 3.2rem)", lineHeight: "1.15", color: "#17100A" }}
            >
              {type.name}
            </h1>

            {/* Catch copy */}
            {type.catchCopy && (
              <p
                className="font-jp mb-9 leading-[1.9]"
                style={{ fontSize: "clamp(13px, 2.2vw, 15px)", color: "rgba(33,22,13,0.65)" }}
              >
                {type.catchCopy}
              </p>
            )}

            {/* Top CTA — understated, part of the reading flow */}
            <div>
              <Link
                href={QUESTIONS_URL}
                className="inline-block font-jp transition-opacity hover:opacity-75"
                style={{
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                  color: "#F4F0E7",
                  background: "#17100A",
                  padding: "8px 20px",
                  borderRadius: "2px",
                }}
              >
                診断する →
              </Link>
            </div>
          </div>
        </div>

        {/* Body — prose width constraint for readability */}
        <div style={{ maxWidth: "700px" }}>

          {/* Section: Overview */}
          <section className="mb-14">
            <h2
              className="font-heading tracking-[0.04em] mb-5"
              style={{ fontSize: "clamp(1rem, 2.6vw, 1.25rem)", color: "#17100A" }}
            >
              このタイプについて
            </h2>
            <p
              className="font-jp leading-[2]"
              style={{ fontSize: "clamp(14px, 2.2vw, 15px)", color: "rgba(33,22,13,0.78)" }}
            >
              {fc.overview.text}
            </p>
          </section>

          <hr style={{ border: "none", borderTop: "1px solid rgba(111,85,44,0.16)", marginBottom: "3.5rem" }} />

          {/* Section: Strengths */}
          <section className="mb-14">
            <h2
              className="font-heading tracking-[0.04em] mb-8"
              style={{ fontSize: "clamp(1rem, 2.6vw, 1.25rem)", color: "#17100A" }}
            >
              主な強み
            </h2>
            <div className="flex flex-col">
              {fc.strengths.map((s, i) => (
                <div
                  key={i}
                  style={{
                    paddingBottom: "1.75rem",
                    marginBottom: i < fc.strengths.length - 1 ? "1.75rem" : 0,
                    borderBottom: i < fc.strengths.length - 1
                      ? "1px solid rgba(111,85,44,0.10)"
                      : "none",
                  }}
                >
                  <p
                    className="font-heading tracking-[0.02em] mb-2"
                    style={{ fontSize: "clamp(14px, 2.2vw, 15px)", color: "#17100A" }}
                  >
                    {s.title.text}
                  </p>
                  <p
                    className="font-jp leading-[1.9]"
                    style={{ fontSize: "clamp(13px, 2vw, 14px)", color: "rgba(33,22,13,0.68)" }}
                  >
                    {s.body.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr style={{ border: "none", borderTop: "1px solid rgba(111,85,44,0.16)", marginBottom: "3.5rem" }} />

          {/* Section: Fit Jobs */}
          <section className="mb-14">
            <h2
              className="font-heading tracking-[0.04em] mb-6"
              style={{ fontSize: "clamp(1rem, 2.6vw, 1.25rem)", color: "#17100A" }}
            >
              向いている仕事
            </h2>
            {/* Job labels — index/tag style, not button-like */}
            <div className="flex flex-wrap gap-x-3 gap-y-2 mb-6">
              {fc.fitJobs.labels.map((label, i) => (
                <span
                  key={i}
                  className="font-jp"
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.04em",
                    color: "rgba(33,22,13,0.70)",
                    borderBottom: "1px solid rgba(111,85,44,0.28)",
                    paddingBottom: "2px",
                  }}
                >
                  {label.text}
                </span>
              ))}
            </div>
            <p
              className="font-jp leading-[1.95]"
              style={{ fontSize: "clamp(13px, 2vw, 14px)", color: "rgba(33,22,13,0.68)" }}
            >
              {fc.fitJobs.body.text}
            </p>
          </section>

          <hr style={{ border: "none", borderTop: "1px solid rgba(111,85,44,0.16)", marginBottom: "3.5rem" }} />

          {/* Section: Team Role */}
          <section className="mb-20">
            <h2
              className="font-heading tracking-[0.04em] mb-5"
              style={{ fontSize: "clamp(1rem, 2.6vw, 1.25rem)", color: "#17100A" }}
            >
              チームでの特徴
            </h2>
            <p
              className="font-jp leading-[2]"
              style={{ fontSize: "clamp(14px, 2.2vw, 15px)", color: "rgba(33,22,13,0.78)" }}
            >
              {fc.teamRole.text}
            </p>
          </section>

          {/* Bottom CTA — editorial, no enclosing box */}
          <section style={{ paddingTop: "1rem" }}>
            <h2
              className="font-heading tracking-[0.03em] mb-5"
              style={{ fontSize: "clamp(1.15rem, 3vw, 1.55rem)", lineHeight: "1.4", color: "#17100A" }}
            >
              自分のタイプを、まだ知らないなら。
            </h2>
            <p
              className="font-jp leading-[2] mb-8"
              style={{ fontSize: "clamp(13px, 2vw, 14px)", color: "rgba(33,22,13,0.62)" }}
            >
              280万通り以上の組み合わせから、
              5つの能力値・4つのビジネススタイル軸・仕事上の行動傾向を重ねて、
              あなたの強みやビジネス適性を立体的に診断します。
            </p>
            <Link
              href={QUESTIONS_URL}
              className="inline-block font-jp transition-opacity hover:opacity-75 mb-6"
              style={{
                fontSize: "14px",
                letterSpacing: "0.04em",
                color: "#F4F0E7",
                background: "#17100A",
                padding: "11px 26px",
                borderRadius: "2px",
              }}
            >
              今すぐタイプ診断をする →
            </Link>
            <div>
              <Link
                href={TYPES_URL}
                className="font-jp transition-opacity hover:opacity-60"
                style={{ fontSize: "12px", color: "rgba(33,22,13,0.44)", letterSpacing: "0.02em" }}
              >
                ← 16タイプ図鑑へ戻る
              </Link>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer
        className="px-6 md:px-10 py-10"
        style={{ borderTop: "1px solid rgba(111,85,44,0.18)" }}
      >
        <div className="max-w-[1040px] mx-auto flex flex-col sm:flex-row justify-between items-start gap-4">
          <p className="font-mono-doc text-xs" style={{ color: "rgba(33,22,13,0.34)" }}>
            © 2026 Human-OS
          </p>
          <nav className="flex flex-wrap gap-5">
            <Link href="/terms" className="font-jp text-xs hover:underline" style={{ color: "rgba(33,22,13,0.54)" }}>
              利用規約
            </Link>
            <Link href="/privacy" className="font-jp text-xs hover:underline" style={{ color: "rgba(33,22,13,0.54)" }}>
              プライバシーポリシー
            </Link>
            <Link href={TYPES_URL} className="font-jp text-xs hover:underline" style={{ color: "rgba(33,22,13,0.54)" }}>
              ビジマル16タイプ図鑑
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
