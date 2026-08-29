"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DiagnosisResult, StationMatchResult } from "@/lib/diagnoses/best-station/types";
import { loadResult } from "@/lib/diagnoses/best-station/storage";
import { assembleCopy, type ResultCopyData } from "@/lib/diagnoses/best-station/copy";
import styles from "@/app/diagnoses/best-station/best-station.module.css";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  copyJson: any;
}

const BS = {
  ink: "#211920",
  muted: "#71656D",
  pink: "#FF4F9A",
  coral: "#FF765B",
  lavender: "#B9A5FF",
};

// ステッカー風セクションラベル
function SectionLabel({ tone, children }: { tone?: string; children: React.ReactNode }) {
  const toneClass =
    tone === "coral"
      ? styles.stickerCoral
      : tone === "aqua"
      ? styles.stickerAqua
      : tone === "lavender"
      ? styles.stickerLav
      : styles.stickerPink;
  return <span className={`${styles.sticker} ${toneClass} mb-3`}>{children}</span>;
}

function AltCard({ alt, index }: { alt: StationMatchResult; index: number }) {
  return (
    <div className={`${styles.readCard} p-4`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`${styles.sticker} ${styles.stickerAqua}`}>別候補 {index}</span>
        <p className="font-jp font-bold text-[17px]" style={{ color: BS.ink }}>
          {alt.station.stationName}
        </p>
      </div>
      <p className="font-jp text-sm leading-relaxed" style={{ color: BS.muted }}>
        {alt.station.resultLine}
      </p>
    </div>
  );
}

export function ResultDisplay({ copyJson }: Props) {
  const router = useRouter();
  const [result] = useState<DiagnosisResult | null>(() =>
    typeof window !== "undefined" ? loadResult() : null
  );
  const didRedirect = useRef(false);
  useEffect(() => {
    if (!result && !didRedirect.current) {
      didRedirect.current = true;
      router.replace("/diagnoses/best-station");
    }
  }, [result, router]);

  const copy = useMemo<ResultCopyData | null>(
    () => (result ? assembleCopy(result, copyJson) : null),
    [result, copyJson],
  );

  if (!result || !copy) {
    return (
      <div className={`${styles.root} flex items-center justify-center`}>
        <p className="font-jp text-sm" style={{ color: BS.muted }}>読み込み中...</p>
      </div>
    );
  }

  const alts = result.alternatives;
  const tempting = result.temptingMismatch;

  return (
    <main className={styles.root}>
      {/* Nav */}
      <div className="px-5 py-4" style={{ borderBottom: "2px solid #241C22" }}>
        <Link href="/diagnoses/best-station" className="text-sm font-jp" style={{ color: BS.muted }}>
          ← 診断トップへ
        </Link>
      </div>

      <div className="px-5 py-8 max-w-lg mx-auto flex flex-col gap-10">

        {/* ① 主結果駅 */}
        <section>
          <SectionLabel>あなたが住むべき最寄り駅</SectionLabel>
          <h1
            className={`${styles.display} ${styles.inkShadow} ${styles.stationIn} mb-4`}
            style={{ fontSize: "clamp(44px, 13vw, 64px)", color: BS.ink }}
          >
            <span className={styles.markerYellow}>{copy.stationName}</span>
          </h1>
          <div className={`${styles.popCard} p-4`} style={{ background: "rgba(255,79,154,0.06)" }}>
            <p className="font-jp leading-relaxed" style={{ fontSize: "15px", color: BS.ink }}>
              {copy.resultLine}
            </p>
          </div>
        </section>

        {/* ② 一発ツッコミ */}
        {copy.sharpOpening && (
          <section>
            <div className={`${styles.popCard} p-5`} style={{ background: "rgba(255,118,91,0.08)" }}>
              <p
                className={`${styles.display} leading-snug`}
                style={{ fontSize: "clamp(19px, 5.4vw, 24px)", color: BS.coral }}
              >
                {copy.sharpOpening}
              </p>
            </div>
          </section>
        )}

        {/* ③ 本当に必要な暮らし */}
        {copy.coreAnalysisText && (
          <section>
            <SectionLabel>本当に必要な暮らし</SectionLabel>
            <div className={`${styles.readCard} p-5`}>
              <p className="font-jp text-sm leading-relaxed" style={{ color: BS.ink }}>
                {copy.coreAnalysisText}
              </p>
            </div>
          </section>
        )}

        {/* ④ 今の無理 */}
        {copy.strainTexts.length > 0 && (
          <section>
            <SectionLabel tone="coral">今どこで無理が出てる？</SectionLabel>
            <div className="flex flex-col gap-3">
              {copy.strainTexts.map((text, i) => (
                <div
                  key={i}
                  className={`${styles.readCard} p-4`}
                  style={{ borderLeft: `5px solid ${BS.coral}` }}
                >
                  <p className="font-jp text-sm leading-relaxed" style={{ color: BS.ink }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ⑤⑥ 駅が合う理由 */}
        {copy.stationFitTexts.length > 0 && (
          <section>
            <SectionLabel>この駅が合う理由</SectionLabel>
            <div className="flex flex-col gap-2.5">
              {copy.stationFitTexts.map((line, i) => (
                <p
                  key={i}
                  className="font-jp text-sm leading-relaxed pl-4"
                  style={{ color: BS.muted, borderLeft: `3px solid ${BS.pink}` }}
                >
                  {line}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* ⑦ 駅の注意点 */}
        {copy.stationTradeoff && (
          <section>
            <SectionLabel tone="aqua">知っておくこと</SectionLabel>
            <div className={`${styles.readCard} p-4`}>
              <p className="font-jp text-sm leading-relaxed" style={{ color: BS.muted }}>
                {copy.stationTradeoff}
              </p>
            </div>
          </section>
        )}

        {/* ⑧ 惹かれやすいが無理が出やすい駅（条件付き） */}
        {tempting && copy.temptingText && (
          <section>
            <SectionLabel tone="lavender">惹かれやすいけど、無理が出やすい駅</SectionLabel>
            <div
              className={`${styles.readCard} p-5`}
              style={{ borderColor: BS.lavender, background: "rgba(185,165,255,0.08)" }}
            >
              <p className="font-jp font-bold text-[18px] mb-2" style={{ color: BS.ink }}>
                {copy.temptingStationName}
              </p>
              <p className="font-jp text-sm leading-relaxed" style={{ color: BS.ink }}>
                {copy.temptingText}
              </p>
            </div>
          </section>
        )}

        {/* ⑨ 別候補2駅 */}
        {alts?.length >= 2 && alts[0] && alts[1] && (
          <section>
            <SectionLabel tone="aqua">別の候補</SectionLabel>
            <div className="flex flex-col gap-3">
              {alts.map((alt, i) => alt && <AltCard key={alt.station.stationId} alt={alt} index={i + 1} />)}
            </div>
          </section>
        )}

        {/* ⑩ 救済 */}
        {copy.supportiveClosing && (
          <section>
            <div className={`${styles.popCard} px-5 py-4`} style={{ background: "rgba(255,216,77,0.14)" }}>
              <p className="font-jp text-sm leading-relaxed text-center" style={{ color: BS.ink }}>
                {copy.supportiveClosing}
              </p>
            </div>
          </section>
        )}

        {/* ⑪ 再診断・免責 */}
        <section className="flex flex-col gap-3">
          <Link
            href="/diagnoses/best-station/questions"
            className={`${styles.cta} py-4 text-[15px]`}
          >
            もう一回やる →
          </Link>
          <Link
            href="/"
            className="block w-full text-center py-3 font-jp text-xs"
            style={{ color: BS.muted }}
          >
            トップへ戻る
          </Link>
        </section>

        <p className="text-xs font-jp text-center leading-relaxed" style={{ color: "rgba(113,101,109,0.7)" }}>
          この診断は生活傾向を扱うエンタメ診断です。実際の住まい選びは最新情報と個別事情を確認のうえ、ご自身の判断で行ってください。
          <Link href="/diagnoses/best-station/about" className="underline ml-1">
            詳細
          </Link>
        </p>
      </div>
    </main>
  );
}
