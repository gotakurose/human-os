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
      <div className="max-w-[1040px] mx-auto px-5 md:px-7 lg:px-8 pt-12 pb-20">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <Link
            href="/diagnoses/business-skills"
            className="text-xs md:text-sm font-jp transition-opacity hover:opacity-70"
            style={{ color: "rgba(33,22,13,0.52)" }}
          >
            ← ビジマル診断
          </Link>
          <span className="text-xs" style={{ color: "rgba(33,22,13,0.28)" }}>/</span>
          <Link
            href={TYPES_URL}
            className="text-xs md:text-sm font-jp transition-opacity hover:opacity-70"
            style={{ color: "rgba(33,22,13,0.52)" }}
          >
            16タイプ図鑑
          </Link>
        </div>

        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-16">

          {/* Character image */}
          <div
            className="w-full md:w-[220px] shrink-0"
            style={{
              background: "rgba(244,240,231,0.55)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assets.characterImage}
              alt={type.name}
              className="w-full h-auto object-contain block"
            />
          </div>

          {/* Type info + top CTA */}
          <div className="flex flex-col justify-center flex-1">

            {/* Animal type */}
            <p
              className="font-mono-doc mb-2"
              style={{ fontSize: "11px", letterSpacing: "0.14em", color: "rgba(111,85,44,0.80)" }}
            >
              {assets.animalType}
            </p>

            {/* English name */}
            <p
              className="font-heading tracking-[0.06em] mb-1"
              style={{ fontSize: "clamp(12px, 2.4vw, 15px)", color: "rgba(33,22,13,0.48)" }}
            >
              {assets.displayEnglishName}
            </p>

            {/* Japanese name */}
            <h1
              className="font-heading tracking-[0.03em] mb-4"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: "1.2", color: "#17100A" }}
            >
              {type.name}
            </h1>

            {/* Catch copy */}
            {type.catchCopy && (
              <p
                className="font-jp mb-8 leading-[1.85]"
                style={{ fontSize: "clamp(14px, 2.4vw, 16px)", color: "rgba(33,22,13,0.72)" }}
              >
                {type.catchCopy}
              </p>
            )}

            {/* Top CTA */}
            <div>
              <Link
                href={QUESTIONS_URL}
                className="inline-block font-jp text-sm px-7 py-3 rounded transition-opacity hover:opacity-80"
                style={{ background: "#17100A", color: "#F4F0E7" }}
              >
                診断する →
              </Link>
            </div>
          </div>
        </div>

        {/* Section: Overview */}
        <section className="mb-12">
          <h2
            className="font-heading tracking-[0.04em] mb-4"
            style={{ fontSize: "clamp(1.1rem, 2.8vw, 1.45rem)", color: "#17100A" }}
          >
            このタイプについて
          </h2>
          <p
            className="font-jp leading-[1.95]"
            style={{ fontSize: "clamp(14px, 2.3vw, 16px)", color: "rgba(33,22,13,0.80)" }}
          >
            {fc.overview.text}
          </p>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid rgba(111,85,44,0.18)", marginBottom: "3rem" }} />

        {/* Section: Strengths */}
        <section className="mb-12">
          <h2
            className="font-heading tracking-[0.04em] mb-6"
            style={{ fontSize: "clamp(1.1rem, 2.8vw, 1.45rem)", color: "#17100A" }}
          >
            主な強み
          </h2>
          <div className="flex flex-col gap-7">
            {fc.strengths.map((s, i) => (
              <div key={i}>
                <p
                  className="font-heading tracking-[0.02em] mb-1"
                  style={{ fontSize: "clamp(14px, 2.3vw, 16px)", color: "#17100A" }}
                >
                  {s.title.text}
                </p>
                <p
                  className="font-jp leading-[1.85]"
                  style={{ fontSize: "clamp(13px, 2.1vw, 15px)", color: "rgba(33,22,13,0.70)" }}
                >
                  {s.body.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid rgba(111,85,44,0.18)", marginBottom: "3rem" }} />

        {/* Section: Fit Jobs */}
        <section className="mb-12">
          <h2
            className="font-heading tracking-[0.04em] mb-5"
            style={{ fontSize: "clamp(1.1rem, 2.8vw, 1.45rem)", color: "#17100A" }}
          >
            向いている仕事
          </h2>
          <div className="flex flex-wrap gap-2 mb-5">
            {fc.fitJobs.labels.map((label, i) => (
              <span
                key={i}
                className="font-jp text-sm px-3 py-1.5 rounded"
                style={{
                  background: "rgba(111,85,44,0.10)",
                  color: "rgba(33,22,13,0.82)",
                  border: "1px solid rgba(111,85,44,0.16)",
                }}
              >
                {label.text}
              </span>
            ))}
          </div>
          <p
            className="font-jp leading-[1.9]"
            style={{ fontSize: "clamp(13px, 2.1vw, 15px)", color: "rgba(33,22,13,0.70)" }}
          >
            {fc.fitJobs.body.text}
          </p>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid rgba(111,85,44,0.18)", marginBottom: "3rem" }} />

        {/* Section: Team Role */}
        <section className="mb-16">
          <h2
            className="font-heading tracking-[0.04em] mb-4"
            style={{ fontSize: "clamp(1.1rem, 2.8vw, 1.45rem)", color: "#17100A" }}
          >
            チームでの特徴
          </h2>
          <p
            className="font-jp leading-[1.95]"
            style={{ fontSize: "clamp(14px, 2.3vw, 16px)", color: "rgba(33,22,13,0.80)" }}
          >
            {fc.teamRole.text}
          </p>
        </section>

        {/* Bottom CTA */}
        <div
          className="flex flex-col items-center gap-5 py-12 px-6 rounded-lg"
          style={{
            background: "rgba(244,240,231,0.55)",
            border: "1px solid rgba(111,85,44,0.18)",
          }}
        >
          <p
            className="font-jp text-sm text-center"
            style={{ color: "rgba(33,22,13,0.58)" }}
          >
            あなたのタイプを確かめてみる
          </p>
          <Link
            href={QUESTIONS_URL}
            className="inline-block font-jp text-sm px-8 py-3.5 rounded transition-opacity hover:opacity-80"
            style={{ background: "#17100A", color: "#F4F0E7" }}
          >
            診断する →
          </Link>
          <Link
            href={TYPES_URL}
            className="font-jp text-xs transition-opacity hover:opacity-70"
            style={{ color: "rgba(33,22,13,0.48)" }}
          >
            ← 16タイプ図鑑へ戻る
          </Link>
        </div>

      </div>

      {/* Footer */}
      <footer
        className="px-6 md:px-10 py-10"
        style={{ borderTop: "1px solid rgba(111,85,44,0.20)" }}
      >
        <div className="max-w-[1040px] mx-auto flex flex-col sm:flex-row justify-between items-start gap-4">
          <p className="font-mono-doc text-xs" style={{ color: "rgba(33,22,13,0.38)" }}>
            © 2026 Human-OS
          </p>
          <nav className="flex flex-wrap gap-5">
            <Link href="/terms" className="font-jp text-xs hover:underline" style={{ color: "rgba(33,22,13,0.60)" }}>
              利用規約
            </Link>
            <Link href="/privacy" className="font-jp text-xs hover:underline" style={{ color: "rgba(33,22,13,0.60)" }}>
              プライバシーポリシー
            </Link>
            <Link href={TYPES_URL} className="font-jp text-xs hover:underline" style={{ color: "rgba(33,22,13,0.60)" }}>
              ビジマル16タイプ図鑑
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
