import { Suspense } from "react";
import Link from "next/link";
import type { DiagnosisType } from "@/schemas/diagnosis";
import type { BusinessSkillsV2ResultRoute } from "@/schemas/business-skills-v2";
import type { BusinessSkillsV2NumericRenderResult } from "@/engine/business-skills-v2-numeric-renderer";
import type { TypeDisplayAssets } from "./result-assets";
import { ResultBadgeGroup } from "./ResultBadgeGroup";
import { ResultAbilitySection } from "./ResultAbilitySection";
import { ResultClient } from "./ResultClient";
import { ResultShareSection } from "./ResultShareSection";
import { RotateCcw, Home } from "lucide-react";

const ORN = "/images/diagnoses/business-skills/ornaments";

function DividerOrnament() {
  return (
    <div className="divider-ornament-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ORN}/divider-ornament.png`}
        alt=""
        aria-hidden="true"
        className="divider-ornament-img pointer-events-none select-none"
      />
    </div>
  );
}

interface TypeCopyShape {
  typeName: string;
  englishName: string;
  catchCopy: string;
}

interface Props {
  diagnosisId: string;
  type: DiagnosisType;
  displayAssets: TypeDisplayAssets | null;
  typeCopy: TypeCopyShape;
  routeCopy: BusinessSkillsV2ResultRoute;
  numericResult: BusinessSkillsV2NumericRenderResult;
}

export function BusinessSkillsV2Result({
  diagnosisId,
  type,
  displayAssets,
  typeCopy,
  routeCopy,
  numericResult,
}: Props) {
  const resolvedCharImage = displayAssets?.characterImage ?? (type.characterImage ?? null);

  return (
    <main className="dossier-page flex-1" style={{ color: "#21160D" }}>

      {/* ── コーナー装飾（左上・右上） ─────────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ORN}/corner-ornament.png`}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute corner-ornament corner-ornament-left"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ORN}/corner-ornament.png`}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute corner-ornament corner-ornament-right"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* ══ ファーストビュー ══════════════════════════════════════════ */}
      <section
        className="flex flex-col items-center min-h-[calc(100vh-64px)] pt-6 md:pt-8 pb-10 md:pb-14 max-w-[1040px] mx-auto px-5 md:px-7 lg:px-8"
        style={{ textAlign: "center" }}
      >

        {/* パンくず */}
        <div className="w-full mb-6 md:mb-8 text-left">
          <Link
            href={`/diagnoses/${diagnosisId}`}
            className="text-xs md:text-sm font-jp transition-opacity hover:opacity-70"
            style={{ color: "rgba(33,22,13,0.52)" }}
          >
            ← {type.name}
          </Link>
        </div>

        {/* ① キャラクター画像 */}
        <div
          data-slot="character-portrait"
          className="relative mx-auto result-portrait-stage w-[280px] md:w-[400px] lg:w-[520px]"
        >
          <div className="relative overflow-hidden">
            {resolvedCharImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolvedCharImage}
                alt={`${typeCopy.typeName} キャラクター`}
                data-slot="character-image"
                className="w-full h-auto object-contain block"
              />
            ) : (
              <div className="w-full aspect-[3/4] flex items-end justify-start p-4">
                <span
                  className="text-[9px] font-mono-doc tracking-[0.2em]"
                  style={{ color: "rgba(111,85,44,0.40)" }}
                >
                  PORTRAIT
                </span>
              </div>
            )}
            <div
              className="absolute inset-0 pointer-events-none result-shine-overlay"
              style={{
                background:
                  "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.62) 48%, rgba(255,255,255,0.18) 52%, transparent 66%)",
              }}
            />
          </div>
        </div>

        {/* ②③ 動物タイプ + タイプ名 */}
        <div className="mt-4 md:mt-6">
          {displayAssets?.animalType && (
            <p
              className="font-mono-doc mb-2 md:mb-3"
              style={{ color: "rgba(111,85,44,0.82)", fontSize: "clamp(16px, 2.2vw, 22px)", letterSpacing: "0.12em" }}
            >
              {displayAssets.animalType}
            </p>
          )}
          <h1
            className="font-heading tracking-[0.04em] result-type-name result-type-name-heading"
            style={{ fontWeight: 700, color: "#17100A" }}
          >
            {typeCopy.typeName}
          </h1>
        </div>

        {/* ④ バッジ */}
        {type.axes && (
          <Suspense fallback={<div className="tribe-badge-fallback" />}>
            <ResultBadgeGroup typeAxesFallback={type.axes} />
          </Suspense>
        )}

        {/* ⑤ 英語名 */}
        {typeCopy.englishName && (
          <p
            className="font-serif-en italic result-en-name"
            style={{
              fontSize: "clamp(1.1rem, 2.6vw, 1.65rem)",
              lineHeight: "1.3",
              color: "rgba(33,22,13,0.72)",
              marginTop: "10px",
            }}
          >
            {typeCopy.englishName}
          </p>
        )}

        {/* ⑥ タイプ共通キャッチ */}
        <p
          className="font-heading leading-[1.4] tracking-[0.04em] max-w-2xl mx-auto result-catch"
          style={{
            fontSize: "clamp(1.3rem, 3.2vw, 2rem)",
            color: "#17100A",
            marginTop: "18px",
          }}
        >
          {typeCopy.catchCopy}
        </p>

        {/* ⑦ 今回のあなた */}
        <div
          className="mx-auto w-full result-panel-reveal parchment-panel text-left"
          style={{ maxWidth: "760px", marginTop: "24px" }}
        >
          <h2
            className="font-heading leading-[1.2] tracking-[0.04em] mb-5"
            style={{ fontSize: "clamp(1.4rem, 2.2vw, 1.9rem)", color: "#17100A" }}
          >
            今回のあなた
          </h2>
          <div className="space-y-4">
            {routeCopy.currentYou.baseSentences.map((s, i) => (
              <p key={i} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
            ))}
          </div>
        </div>

      </section>

      {/* ⑧ 5能力レーダー */}
      <Suspense fallback={null}>
        <ResultAbilitySection />
      </Suspense>

      {/* ⑨ 4軸バー */}
      <div className="max-w-[960px] mx-auto px-5 md:px-7 lg:px-8 w-full pb-4">
        <Suspense
          fallback={
            <div className="py-16 text-center">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: "rgba(111,85,44,0.28)", borderTopColor: "#8A713C" }}
              />
            </div>
          }
        >
          <ResultClient styleAxesFallback={type.axes} />
        </Suspense>
      </div>

      <DividerOrnament />

      {/* ⑩ 数値から見る、今回の特徴 */}
      {numericResult.quantitativeParagraphs.length > 0 && (
        <div className="max-w-[1040px] mx-auto px-5 md:px-7 lg:px-8 w-full">
          <section>
            <h2
              className="font-heading tracking-[0.04em] section-heading"
              style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
            >
              数値から見る、今回の特徴
            </h2>
            <div
              className="space-y-4"
              style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
            >
              {numericResult.quantitativeParagraphs.map((s, i) => (
                <p key={i} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ⑪ 辛辣な一文 */}
      <div
        className="mx-auto px-5 md:px-7 w-full"
        style={{ maxWidth: "760px", paddingTop: "32px", paddingBottom: "8px" }}
      >
        <div style={{ borderLeft: "3px solid #9A7350", paddingLeft: "16px" }}>
          <p
            className="font-heading leading-[1.4] tracking-[0.03em]"
            style={{ fontSize: "clamp(28px, 7.5vw, 48px)", color: "#21160D" }}
          >
            {routeCopy.harshOneLiner}
          </p>
        </div>
      </div>

      <DividerOrnament />

      <div className="max-w-[1040px] mx-auto px-5 md:px-7 lg:px-8 w-full">

        {/* ⑫ あなたの仕事の進め方 */}
        <section>
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            あなたの仕事の進め方
          </h2>
          <div style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            {(
              [
                ["最初に見ること", routeCopy.workThinking.see],
                ["決め方",         routeCopy.workThinking.decide],
                ["動き方",         routeCopy.workThinking.move],
                ["終わらせ方",     routeCopy.workThinking.land],
              ] as const
            ).map(([label, paras]) => (
              <div key={label} className="mb-6">
                <p
                  className="font-mono-doc mb-3"
                  style={{ fontSize: "clamp(13px, 1.4vw, 15px)", fontWeight: 600, letterSpacing: "0.20em", color: "rgba(111,85,44,0.85)" }}
                >
                  {label}
                </p>
                <div className="space-y-3">
                  {paras.map((s, i) => (
                    <p key={i} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ⑬ 強みが出やすい3つの場面 */}
        <section
          className="section-block-gap"
          style={{ borderTop: "1px solid rgba(111,85,44,0.24)", paddingTop: "clamp(36px, 4vw, 48px)" }}
        >
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            強みが出やすい3つの場面
          </h2>
          <div style={{ borderLeft: "2px solid #9A7C46", paddingLeft: "20px", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            <ul style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {routeCopy.strengthScenes.map((scene, i) => (
                <li key={i}>
                  <p
                    className="font-heading leading-[1.3] tracking-[0.03em] mb-2"
                    style={{ fontSize: "clamp(18px, 2vw, 22px)", color: "#17100A" }}
                  >
                    {scene.title}
                  </p>
                  <div className="space-y-2">
                    {scene.body.map((s, j) => (
                      <p key={j} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ⑭ うまくいかなくなるとき */}
        <section
          className="section-block-gap"
          style={{ borderTop: "1px solid rgba(111,85,44,0.24)", paddingTop: "clamp(36px, 4vw, 48px)" }}
        >
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            うまくいかなくなるとき
          </h2>
          <div
            className="space-y-4"
            style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            {routeCopy.failureFlow.map((s, i) => (
              <p key={i} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
            ))}
            {numericResult.failureCorrectionParagraphs.map((s, i) => (
              <p key={`fc${i}`} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
            ))}
          </div>
        </section>

        {/* ⑮ あなたのつもりと、周りからの見え方 */}
        <section
          className="section-block-gap"
          style={{ borderTop: "1px solid rgba(111,85,44,0.24)", paddingTop: "clamp(36px, 4vw, 48px)" }}
        >
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            あなたのつもりと、周りからの見え方
          </h2>
          <div style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            <div className="mb-6">
              <p
                className="font-mono-doc mb-3"
                style={{ fontSize: "clamp(13px, 1.4vw, 15px)", fontWeight: 600, letterSpacing: "0.20em", color: "rgba(111,85,44,0.85)" }}
              >
                あなたのつもり
              </p>
              <div className="space-y-3">
                {routeCopy.perception.intent.map((s, i) => (
                  <p key={i} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
                ))}
              </div>
            </div>
            <div>
              <p
                className="font-mono-doc mb-3"
                style={{ fontSize: "clamp(13px, 1.4vw, 15px)", fontWeight: 600, letterSpacing: "0.20em", color: "rgba(111,85,44,0.85)" }}
              >
                周りからの見え方
              </p>
              <div className="space-y-3">
                {routeCopy.perception.external.map((s, i) => (
                  <p key={i} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>

      <DividerOrnament />

      <div className="max-w-[1040px] mx-auto px-5 md:px-7 lg:px-8 w-full">

        {/* ⑯ 力を出しやすい環境・消耗しやすい環境 */}
        <section>
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            力を出しやすい環境・消耗しやすい環境
          </h2>
          <div style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            <div className="mb-8">
              <p
                className="font-mono-doc mb-4"
                style={{ fontSize: "clamp(15px, 1.6vw, 18px)", fontWeight: 600, letterSpacing: "0.20em", color: "rgba(111,85,44,0.85)" }}
              >
                力を出しやすい環境
              </p>
              <div className="space-y-3">
                {routeCopy.environment.fit.map((s, i) => (
                  <p key={i} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
                ))}
              </div>
            </div>
            <div>
              <p
                className="font-mono-doc mb-4"
                style={{ fontSize: "clamp(15px, 1.6vw, 18px)", fontWeight: 600, letterSpacing: "0.20em", color: "rgba(111,85,44,0.85)" }}
              >
                消耗しやすい環境
              </p>
              <div className="space-y-3">
                {routeCopy.environment.avoid.map((s, i) => (
                  <p key={i} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ⑰ 力を出しやすい仕事 */}
        <section
          className="section-block-gap"
          style={{ borderTop: "1px solid rgba(111,85,44,0.24)", paddingTop: "clamp(36px, 4vw, 48px)" }}
        >
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            力を出しやすい仕事
          </h2>
          <div
            className="space-y-3"
            style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            {routeCopy.roles.map((s, i) => (
              <p key={i} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
            ))}
          </div>
        </section>

        {/* ⑱ 一緒に働くと力が出る人 */}
        <section
          className="section-block-gap"
          style={{ borderTop: "1px solid rgba(111,85,44,0.24)", paddingTop: "clamp(36px, 4vw, 48px)" }}
        >
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            一緒に働くと力が出る人
          </h2>
          <div style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            <p
              className="font-heading leading-[1.3] tracking-[0.03em] mb-4"
              style={{ fontSize: "clamp(18px, 2vw, 22px)", color: "#17100A" }}
            >
              {routeCopy.partner.typeName}
            </p>
            <div className="space-y-3">
              {routeCopy.partner.body.map((s, i) => (
                <p key={i} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
              ))}
            </div>
          </div>
        </section>

        {/* ⑲ 一つだけ変えるなら */}
        <section
          className="section-block-gap"
          style={{ borderTop: "1px solid rgba(111,85,44,0.24)", paddingTop: "clamp(36px, 4vw, 48px)" }}
        >
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            一つだけ変えるなら
          </h2>
          <div className="parchment-panel mx-auto" style={{ maxWidth: "760px" }}>
            <div className="space-y-4">
              {routeCopy.oneChange.map((s, i) => (
                <p key={i} className="font-jp prose-text" style={{ color: "#21160D" }}>{s}</p>
              ))}
            </div>
          </div>
        </section>

      </div>

      <DividerOrnament />

      {/* ⑳ シェア */}
      <ResultShareSection
        typeName={typeCopy.typeName}
        v2Share={{
          typeLine:  routeCopy.share.typeLine,
          bodyLines: routeCopy.share.bodyLines,
        }}
      />

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div
        className="mx-auto px-5 md:px-0 pt-6 pb-16 flex flex-col md:flex-row gap-3"
        style={{ maxWidth: "760px" }}
      >
        <Link
          href={`/diagnoses/${diagnosisId}/questions`}
          className="flex items-center justify-center gap-2 flex-1 py-4 text-sm font-jp font-medium transition-opacity hover:opacity-80"
          style={{ background: "#11100D", color: "#F4EFE4" }}
        >
          <RotateCcw size={14} />
          もう一度診断する
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 flex-1 py-4 text-sm font-jp transition-opacity hover:opacity-70 border"
          style={{ color: "#6F552C", borderColor: "rgba(111,85,44,0.35)" }}
        >
          <Home size={14} />
          トップへ戻る
        </Link>
      </div>

      {/* ── フッター ─────────────────────────────────────────────── */}
      <footer
        className="mt-20 md:mt-28 px-6 md:px-10 py-12 md:py-16"
        style={{
          borderTop: "1px solid rgba(111,85,44,0.24)",
          background: "rgba(120,98,56,0.06)",
        }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1.4fr_2fr] gap-10">
          <div>
            <p
              className="font-heading text-[2rem] md:text-[3rem] leading-[1.1] tracking-[0.04em] mb-4"
              style={{ color: "#17100A" }}
            >
              Human-OS
            </p>
            <p
              className="font-jp text-sm md:text-base leading-[1.8] max-w-sm"
              style={{ color: "rgba(33,22,13,0.74)" }}
            >
              さまざまな診断を重ね、あなたという人間の「設計図」をつくる診断プラットフォーム。
            </p>
          </div>
          <div>
            <p className="font-mono-doc text-xs tracking-[0.22em] mb-4" style={{ color: "rgba(111,85,44,0.78)" }}>
              コンテンツ
            </p>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="font-jp text-sm md:text-base hover:underline" style={{ color: "rgba(33,22,13,0.78)" }}>
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="font-jp text-sm md:text-base hover:underline" style={{ color: "rgba(33,22,13,0.78)" }}>
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/diagnoses/business-skills/types" className="font-jp text-sm md:text-base hover:underline" style={{ color: "rgba(33,22,13,0.78)" }}>
                  ビジマル16タイプ図鑑
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div
          className="max-w-6xl mx-auto mt-12 pt-6"
          style={{ borderTop: "1px solid rgba(111,85,44,0.16)" }}
        >
          <p className="font-mono-doc text-xs" style={{ color: "rgba(33,22,13,0.38)" }}>
            © 2026 Human-OS
          </p>
        </div>
      </footer>

    </main>
  );
}
